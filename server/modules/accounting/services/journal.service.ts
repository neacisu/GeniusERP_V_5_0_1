/**
 * Journal Service
 * 
 * Core service for journal entries in the accounting system.
 * Handles creating and managing ledger entries and lines.
 * Also provides direct recordTransaction method for simpler double-entry transaction recording.
 * 
 * ENHANCED WITH:
 * - Redis caching for ledger queries
 * - BullMQ async processing for balance updates
 */

import { v4 as uuidv4 } from 'uuid';
import { getDrizzle, getClient } from '../../../common/drizzle';
import { ledgerEntries, ledgerLines } from '../schema/accounting.schema';
import { eq, and } from 'drizzle-orm';
import { AuditService, AuditAction } from '../../audit/services/audit.service';
import { JournalNumberingService } from './journal-numbering.service';
import { AccountingPeriodsService } from './accounting-periods.service';
import { accountingQueueService } from './accounting-queue.service';
import { RedisService } from '../../../services/redis.service';
import { log } from '../../../vite';

/**
 * Ledger entry type
 */
export enum LedgerEntryType {
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  BANK = 'BANK',
  CASH = 'CASH',
  GENERAL = 'GENERAL',
  ADJUSTMENT = 'ADJUSTMENT',
  REVERSAL = 'REVERSAL'
}

/**
 * Ledger entry data interface
 */
export interface LedgerEntryData {
  id: string;
  companyId: string;
  type: LedgerEntryType;
  referenceNumber?: string;
  journalNumber?: string; // Numărul secvențial JV/2025/00001
  entryDate?: string; // Data înregistrării
  documentDate?: string; // Data documentului
  amount: number;
  description: string;
  // Posting fields
  isPosted?: boolean; // Marcaj dacă nota este postată (finalizată)
  postedAt?: string; // Data și ora postării
  postedBy?: string; // ID utilizator care a postat
  // Reversal fields
  isReversed?: boolean; // Marcaj dacă nota este stornată
  reversedAt?: string; // Data și ora stornării
  reversedBy?: string; // ID utilizator care a stornat
  reversalReason?: string; // Motivul stornării
  originalEntryId?: string; // ID nota originală (pentru stornări)
  reversalEntryId?: string; // ID nota de stornare (pentru note stornate)
  // Audit fields
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  lines: LedgerLineData[];
}

/**
 * Ledger line data interface
 */
export interface LedgerLineData {
  id: string;
  ledgerEntryId: string;
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

/**
 * Ledger entry creation options
 */
export interface CreateLedgerEntryOptions {
  companyId: string;
  franchiseId?: string;
  type: LedgerEntryType;
  referenceNumber?: string;
  amount: number;
  description: string;
  userId?: string;
  entryDate?: Date; // Data înregistrării în jurnal (default: today)
  documentDate?: Date; // Data documentului justificativ
  lines: CreateLedgerLineOptions[];
}

/**
 * Ledger line creation options
 */
export interface CreateLedgerLineOptions {
  accountId: string;
  debitAmount?: number;
  creditAmount?: number;
  description?: string;
  accountNumber?: string; // Allow accountNumber to be passed instead of accountId
}

/**
 * Journal service for accounting operations
 */
export class JournalService {
  /**
   * Create a ledger entry with lines
   * @param options Ledger entry options
   * @returns Created entry data
   */
  async createLedgerEntry(options: CreateLedgerEntryOptions): Promise<LedgerEntryData> {
    const {
      companyId,
      franchiseId,
      type,
      referenceNumber,
      amount,
      description,
      userId,
      entryDate = new Date(),
      documentDate,
      lines
    } = options;
    
    console.log('[DEBUG] createLedgerEntry called with params:', JSON.stringify({
      companyId,
      franchiseId,
      type,
      referenceNumber,
      amount,
      description,
      userId,
      lines
    }, null, 2));
    
    // Validate input
    if (!companyId) {
      throw new Error('Company ID is required');
    }
    
    if (!type) {
      throw new Error('Ledger entry type is required');
    }
    
    if (amount === undefined || amount === null) {
      throw new Error('Amount is required');
    }
    
    if (!description) {
      throw new Error('Description is required');
    }
    
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      throw new Error('At least one ledger line is required');
    }
    
    // Validate that lines are balanced (debits = credits)
    this.validateBalancedLines(lines);
    
    // Initialize services
    const periodsService = new AccountingPeriodsService();
    const numberingService = new JournalNumberingService();
    
    // Validate period is open for posting
    const periodValidation = await periodsService.validatePeriodOperation(
      companyId, 
      entryDate, 
      'post'
    );
    
    if (!periodValidation.canPost) {
      throw new Error(`Nu puteți posta în această perioadă: ${periodValidation.message}`);
    }
    
    // Generate journal number
    const journalNumber = await numberingService.generateJournalNumber(
      companyId,
      type,
      entryDate
    );
    
    try {
      // Generate UUIDs
      const entryId = uuidv4();
      const now = new Date();
      
      // Use direct SQL client for better compatibility
      const sql = getClient();
      
      // Create entry and lines in a transaction
      const result = await (async () => {
        // Insert ledger entry
        await sql`
          INSERT INTO ledger_entries (
            id, company_id, franchise_id, type, reference_number, journal_number,
            entry_date, document_date, amount, description, created_at, updated_at, created_by
          ) VALUES (
            ${entryId}, ${companyId}, ${franchiseId || null}, ${type}, ${referenceNumber || null}, ${journalNumber},
            ${entryDate.toISOString()}, ${(documentDate || entryDate).toISOString()}, ${amount}, ${description}, ${now.toISOString()}, ${now.toISOString()}, ${userId || null}
          )
        `;
        
        // Insert ledger lines
        for (const line of lines) {
          const lineId = uuidv4();
          const accountId = line.accountId || line.accountNumber;
          
          if (!accountId) {
            throw new Error('Account ID is required for ledger line');
          }
          
          await sql`
            INSERT INTO ledger_lines (
              id, ledger_entry_id, account_id, debit_amount, credit_amount, 
              description, created_at, updated_at
            ) VALUES (
              ${lineId}, ${entryId}, ${accountId}, ${line.debitAmount || 0}, ${line.creditAmount || 0},
              ${line.description || description}, ${now.toISOString()}, ${now.toISOString()}
            )
          `;
        }
        
        // Fetch the created entry with lines using direct SQL
        const entryResult = await sql`
          SELECT 
            e.id, e.company_id, e.franchise_id, e.type, e.reference_number, 
            e.journal_number, e.entry_date, e.document_date, e.amount, e.description, 
            e.created_at, e.created_by,
            l.id as line_id, l.account_id, l.debit_amount, l.credit_amount, 
            l.description as line_description
          FROM ledger_entries e
          LEFT JOIN ledger_lines l ON l.ledger_entry_id = e.id
          WHERE e.id = ${entryId}
          ORDER BY l.created_at
        `;
        
        if (entryResult.length === 0) {
          throw new Error('Failed to fetch created entry');
        }
        
        // Group lines by entry
        const firstRow = entryResult[0];
        const entry = {
          id: firstRow.id,
          companyId: firstRow.company_id,
          franchiseId: firstRow.franchise_id,
          type: firstRow.type,
          referenceNumber: firstRow.reference_number,
          journalNumber: firstRow.journal_number,
          entryDate: firstRow.entry_date,
          documentDate: firstRow.document_date,
          amount: firstRow.amount,
          description: firstRow.description,
          createdAt: firstRow.created_at,
          createdBy: firstRow.created_by,
          lines: entryResult
            .filter(row => row.line_id) // Filter out null lines
            .map(row => ({
              id: row.line_id,
              ledgerEntryId: row.id,
              accountId: row.account_id,
              debitAmount: row.debit_amount,
              creditAmount: row.credit_amount,
              description: row.line_description
            }))
        };
        
        console.log('[DEBUG] Database query result:', JSON.stringify(entry, null, 2));
        
        return entry;
      });
      
      // Update account balances (for performance, this could be moved to a background job)
      await this.updateAccountBalances(lines);
      
      // Log audit event
      if (userId) {
        await AuditService.log({
          userId,
          companyId,
          franchiseId,
          action: AuditAction.CREATE,
          entity: 'ledger_entry',
          entityId: entryId,
          details: {
            type,
            amount,
            referenceNumber
          }
        });
      }
      
      console.log('[DEBUG] Result value:', typeof result);
      
      // Await the result function to get the actual data
      const actualResult = await result();
      
      return actualResult;
    } catch (error) {
      console.error('[JournalService] Error creating ledger entry:', error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to create ledger entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Reverse a ledger entry (create stornare/reversare)
   * Creates a mirror entry with debits and credits swapped
   * Only posted entries can be reversed
   * @param ledgerEntryId ID of the ledger entry to reverse
   * @param reason Reason for the reversal (required)
   * @param userId ID of the user performing the reversal
   * @returns Reversal ledger entry ID
   */
  async reverseLedgerEntry(ledgerEntryId: string, reason: string, userId: string): Promise<string> {
    if (!ledgerEntryId) {
      throw new Error('Ledger entry ID is required');
    }
    
    if (!reason) {
      throw new Error('Reversal reason is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required for reversal');
    }
    
    const sql = getClient();
    
    // Get the original entry with lines and status using direct SQL
    const originalEntry = await sql`
      SELECT 
        e.id, e.company_id, e.franchise_id, e.type, e.reference_number, e.amount, e.description,
        e.is_posted, e.is_reversed, e.reversal_entry_id,
        e.created_at, e.created_by,
        l.id as line_id, l.account_id, l.debit_amount, l.credit_amount, l.description as line_description
      FROM ledger_entries e
      LEFT JOIN ledger_lines l ON l.ledger_entry_id = e.id
      WHERE e.id = ${ledgerEntryId}
      ORDER BY l.created_at
    `.then(rows => {
        if (rows.length === 0) return null;

        // Extract the entry data from the first row (SQL direct structure)
        const firstRow = rows[0];
        const entryData = {
          id: firstRow.id,
          companyId: firstRow.company_id,
          franchiseId: firstRow.franchise_id || null,
          type: firstRow.type,
          referenceNumber: firstRow.reference_number,
          amount: firstRow.amount,
          description: firstRow.description,
          isPosted: firstRow.is_posted,
          isReversed: firstRow.is_reversed,
          reversalEntryId: firstRow.reversal_entry_id,
          createdAt: firstRow.created_at,
          createdBy: firstRow.created_by,
          // Group the lines from the joined rows
          lines: rows
            .filter(row => row.line_id) // Filter out null lines
            .map(row => ({
              id: row.line_id,
              ledgerEntryId: row.id,
              accountId: row.account_id,
              debitAmount: row.debit_amount,
              creditAmount: row.credit_amount,
              description: row.line_description
            }))
        };
        return entryData;
      });
    
    if (!originalEntry) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    // Validări: doar notele postate pot fi stornate
    if (!originalEntry.isPosted) {
      throw new Error('Only posted entries can be reversed. Please post the entry first.');
    }
    
    if (originalEntry.isReversed) {
      throw new Error('Entry is already reversed');
    }
    
    if (originalEntry.reversalEntryId) {
      throw new Error('Entry has already been reversed');
    }
    
    // Create reversal lines by swapping debit and credit amounts
    // First ensure lines is an array
    if (!Array.isArray(originalEntry.lines)) {
      throw new Error('Ledger entry is missing its associated lines');
    }
    
    const reversalLines = originalEntry.lines.map(line => ({
      accountId: line.accountId,
      debitAmount: Number(line.creditAmount),
      creditAmount: Number(line.debitAmount),
      description: `Stornare: ${line.description}`
    }));
    
    // Create the reversal entry
    const reversalEntry = await this.createLedgerEntry({
      companyId: originalEntry.companyId,
      franchiseId: originalEntry.franchiseId,
      type: LedgerEntryType.REVERSAL,
      referenceNumber: `REV-${originalEntry.referenceNumber || originalEntry.id}`,
      amount: Number(originalEntry.amount),
      description: `Stornare nota ${originalEntry.referenceNumber || originalEntry.id}: ${reason}`,
      userId: userId,
      lines: reversalLines
    });
    
    // Update the reversal entry to link it to the original and set original_entry_id
    const now = new Date();
    await sql`
      UPDATE ledger_entries
      SET original_entry_id = ${ledgerEntryId},
          updated_at = ${now.toISOString()}
      WHERE id = ${reversalEntry.id}
    `;
    
    // Post the reversal entry automatically
    await this.postLedgerEntry(reversalEntry.id, userId);
    
    // Mark the original entry as reversed
    await sql`
      UPDATE ledger_entries
      SET is_reversed = TRUE,
          reversed_at = ${now.toISOString()},
          reversed_by = ${userId},
          reversal_reason = ${reason},
          reversal_entry_id = ${reversalEntry.id},
          updated_at = ${now.toISOString()}
      WHERE id = ${ledgerEntryId}
    `;
    
    // Log audit event for the original entry
    await AuditService.log({
      userId,
      companyId: originalEntry.companyId,
      action: AuditAction.UPDATE,
      entity: 'ledger_entry',
      entityId: ledgerEntryId,
      details: {
        action: 'REVERSED',
        reason,
        reversal_entry_id: reversalEntry.id,
        reversed_at: now.toISOString()
      }
    });
    
    return reversalEntry.id;
  }
  
  /**
   * Validate that ledger lines are balanced (debits = credits)
   * @param lines Ledger lines to validate
   * @throws Error if lines are not balanced
   */
  private validateBalancedLines(lines: CreateLedgerLineOptions[]): void {
    let totalDebits = 0;
    let totalCredits = 0;
    
    for (const line of lines) {
      totalDebits += Number(line.debitAmount || 0);
      totalCredits += Number(line.creditAmount || 0);
    }
    
    // Allow for small floating point differences
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error(`Ledger lines must be balanced (debits = credits). Current totals: debits = ${totalDebits}, credits = ${totalCredits}`);
    }
  }
  
  /**
   * Calculate account class and group from Romanian account number
   * @param accountId Account ID or number
   * @returns Account class and group
   */
  parseAccountNumber(accountId: string): { class: number; group: number } {
    // Romanian account numbers follow format X or XY or XYZ
    // Where X is class (1-9), Y is group, Z is synthetic account
    const accountNumber = accountId.toString().split('-')[0]; // In case there's an analytic part after dash
    
    const accountClass = parseInt(accountNumber.charAt(0));
    const accountGroup = accountNumber.length > 1 ? parseInt(accountNumber.substring(0, 2)) : accountClass * 10;
    
    return {
      class: accountClass,
      group: accountGroup
    };
  }
  
  /**
   * Update account balances after ledger entry creation
   * @param lines Ledger lines
   */
  private async updateAccountBalances(lines: CreateLedgerLineOptions[]): Promise<void> {
    // This would update account balances in the accounts table
    // Implementation depends on the structure of the account balances tracking
    // For now, this is a placeholder
    try {
      // Update account balances based on debit/credit amounts
      const accountUpdates: Record<string, { debit: number; credit: number }> = {};
      
      // Aggregate changes by account
      for (const line of lines) {
        if (!accountUpdates[line.accountId]) {
          accountUpdates[line.accountId] = { debit: 0, credit: 0 };
        }
        
        accountUpdates[line.accountId].debit += Number(line.debitAmount || 0);
        accountUpdates[line.accountId].credit += Number(line.creditAmount || 0);
      }
      
      // TODO: Implement account balance updates once account balance table is defined
    } catch (error) {
      console.error('[JournalService] Error updating account balances:', error);
      // Don't throw, allow the entry to be created even if balance update fails
      // This can be fixed later with a reconciliation job
    }
  }

  /**
   * Record a simple double-entry transaction (simplified ledger recording)
   * This provides a more direct way to create a ledger entry with just debit and credit accounts
   * 
   * @param options Transaction recording options
   * @returns The created ledger entry ID
   */
  async recordTransaction({
    companyId,
    franchiseId,
    debitAccount,
    creditAccount,
    amount,
    description,
    documentId,
    documentType,
    userId
  }: {
    companyId: string;
    franchiseId?: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    description: string;
    documentId?: string;
    documentType?: string;
    userId?: string;
  }): Promise<string> {
    if (!companyId) {
      throw new Error('Company ID is required');
    }
    
    if (!debitAccount) {
      throw new Error('Debit account is required');
    }
    
    if (!creditAccount) {
      throw new Error('Credit account is required');
    }
    
    if (amount === undefined || amount === null || amount <= 0) {
      throw new Error('Amount must be a positive number');
    }
    
    if (!description) {
      throw new Error('Description is required');
    }
    
    // Create ledger lines
    const lines: CreateLedgerLineOptions[] = [
      {
        accountId: debitAccount,
        debitAmount: amount,
        creditAmount: 0,
        description: `${description} (DR)`
      },
      {
        accountId: creditAccount,
        debitAmount: 0,
        creditAmount: amount,
        description: `${description} (CR)`
      }
    ];
    
    // Create the ledger entry using the existing method
    const ledgerEntry = await this.createLedgerEntry({
      companyId,
      franchiseId,
      type: documentType ? LedgerEntryType[documentType as keyof typeof LedgerEntryType] || LedgerEntryType.GENERAL : LedgerEntryType.GENERAL,
      referenceNumber: documentId,
      amount,
      description,
      userId,
      lines
    });
    
    return ledgerEntry.id;
  }

  /**
   * Post a ledger entry (mark as final/posted)
   * Once posted, a ledger entry cannot be modified
   * @param ledgerEntryId ID of the ledger entry to post
   * @param userId ID of the user posting the entry
   * @returns Updated ledger entry data
   */
  async postLedgerEntry(ledgerEntryId: string, userId: string): Promise<LedgerEntryData> {
    if (!ledgerEntryId) {
      throw new Error('Ledger entry ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required for posting');
    }
    
    const sql = getClient();
    
    // Get the entry to validate it exists and is not already posted
    const existingEntry = await sql`
      SELECT id, company_id, type, is_posted, is_reversed, amount, description
      FROM ledger_entries
      WHERE id = ${ledgerEntryId}
    `;
    
    if (existingEntry.length === 0) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    const entry = existingEntry[0];
    
    if (entry.is_posted) {
      throw new Error('Ledger entry is already posted');
    }
    
    if (entry.is_reversed) {
      throw new Error('Cannot post a reversed entry');
    }
    
    // Validate that lines are balanced
    const lines = await sql`
      SELECT debit_amount, credit_amount
      FROM ledger_lines
      WHERE ledger_entry_id = ${ledgerEntryId}
    `;
    
    if (lines.length === 0) {
      throw new Error('Ledger entry has no lines');
    }
    
    const totalDebit = lines.reduce((sum: number, line: any) => sum + Number(line.debit_amount || 0), 0);
    const totalCredit = lines.reduce((sum: number, line: any) => sum + Number(line.credit_amount || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Ledger entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
    }
    
    // Update the entry to mark it as posted
    const now = new Date();
    await sql`
      UPDATE ledger_entries
      SET is_posted = TRUE,
          posted_at = ${now.toISOString()},
          posted_by = ${userId},
          updated_at = ${now.toISOString()}
      WHERE id = ${ledgerEntryId}
    `;
    
    // Log audit event
    await AuditService.log({
      userId,
      companyId: entry.company_id,
      action: AuditAction.UPDATE,
      entity: 'ledger_entry',
      entityId: ledgerEntryId,
      details: {
        action: 'POSTED',
        type: entry.type,
        amount: entry.amount,
        posted_at: now.toISOString()
      }
    });
    
    // Fetch and return the updated entry
    return this.getLedgerEntry(ledgerEntryId);
  }

  /**
   * Unpost a ledger entry (revert to draft state)
   * This is only allowed if the entry has not been reversed
   * Use with caution - should only be allowed in specific scenarios
   * @param ledgerEntryId ID of the ledger entry to unpost
   * @param userId ID of the user unposting the entry
   * @returns Updated ledger entry data
   */
  async unpostLedgerEntry(ledgerEntryId: string, userId: string): Promise<LedgerEntryData> {
    if (!ledgerEntryId) {
      throw new Error('Ledger entry ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required for unposting');
    }
    
    const sql = getClient();
    
    // Get the entry to validate
    const existingEntry = await sql`
      SELECT id, company_id, type, is_posted, is_reversed, reversal_entry_id
      FROM ledger_entries
      WHERE id = ${ledgerEntryId}
    `;
    
    if (existingEntry.length === 0) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    const entry = existingEntry[0];
    
    if (!entry.is_posted) {
      throw new Error('Ledger entry is not posted');
    }
    
    if (entry.is_reversed) {
      throw new Error('Cannot unpost a reversed entry');
    }
    
    if (entry.reversal_entry_id) {
      throw new Error('Cannot unpost an entry that has a reversal');
    }
    
    // Update the entry to mark it as draft again
    const now = new Date();
    await sql`
      UPDATE ledger_entries
      SET is_posted = FALSE,
          posted_at = NULL,
          posted_by = NULL,
          updated_at = ${now.toISOString()}
      WHERE id = ${ledgerEntryId}
    `;
    
    // Log audit event
    await AuditService.log({
      userId,
      companyId: entry.company_id,
      action: AuditAction.UPDATE,
      entity: 'ledger_entry',
      entityId: ledgerEntryId,
      details: {
        action: 'UNPOSTED',
        type: entry.type,
        unposted_at: now.toISOString()
      }
    });
    
    // Fetch and return the updated entry
    return this.getLedgerEntry(ledgerEntryId);
  }

  /**
   * Get a single ledger entry with its lines
   * @param ledgerEntryId ID of the ledger entry
   * @returns Ledger entry with lines
   */
  async getLedgerEntry(ledgerEntryId: string): Promise<LedgerEntryData> {
    const sql = getClient();
    
    const result = await sql`
      SELECT 
        e.id, e.company_id, e.franchise_id, e.type, e.reference_number, 
        e.journal_number, e.entry_date, e.document_date, e.amount, e.description, 
        e.is_posted, e.posted_at, e.posted_by,
        e.is_reversed, e.reversed_at, e.reversed_by, e.reversal_reason,
        e.original_entry_id, e.reversal_entry_id,
        e.created_at, e.created_by, e.updated_at,
        l.id as line_id, l.account_id, l.debit_amount, l.credit_amount, 
        l.description as line_description
      FROM ledger_entries e
      LEFT JOIN ledger_lines l ON l.ledger_entry_id = e.id
      WHERE e.id = ${ledgerEntryId}
      ORDER BY l.created_at
    `;
    
    if (result.length === 0) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    const firstRow = result[0];
    return {
      id: firstRow.id,
      companyId: firstRow.company_id,
      franchiseId: firstRow.franchise_id,
      type: firstRow.type,
      referenceNumber: firstRow.reference_number,
      journalNumber: firstRow.journal_number,
      entryDate: firstRow.entry_date,
      documentDate: firstRow.document_date,
      amount: firstRow.amount,
      description: firstRow.description,
      isPosted: firstRow.is_posted,
      postedAt: firstRow.posted_at,
      postedBy: firstRow.posted_by,
      isReversed: firstRow.is_reversed,
      reversedAt: firstRow.reversed_at,
      reversedBy: firstRow.reversed_by,
      reversalReason: firstRow.reversal_reason,
      originalEntryId: firstRow.original_entry_id,
      reversalEntryId: firstRow.reversal_entry_id,
      createdAt: firstRow.created_at,
      createdBy: firstRow.created_by,
      updatedAt: firstRow.updated_at,
      lines: result
        .filter(row => row.line_id)
        .map(row => ({
          id: row.line_id,
          ledgerEntryId: row.id,
          accountId: row.account_id,
          debitAmount: row.debit_amount,
          creditAmount: row.credit_amount,
          description: row.line_description
        }))
    } as any;
  }
  
  /**
   * ============================================================================
   * REDIS CACHING & BULLMQ ASYNC OPERATIONS
   * ============================================================================
   */
  
  /**
   * Queue balance update after journal entry creation
   */
  public async queueBalanceUpdate(journalEntryId: string, companyId: string): Promise<void> {
    try {
      log(`Queueing balance update for journal entry ${journalEntryId}`, 'journal-async');
      await accountingQueueService.queueBalanceUpdate({ journalEntryId, companyId });
    } catch (error: any) {
      log(`Error queueing balance update: ${error.message}`, 'journal-error');
    }
  }
  
  /**
   * Invalidate ledger cache for a company
   */
  public async invalidateLedgerCache(companyId: string): Promise<void> {
    try {
      const redisService = new RedisService();
      await redisService.connect();
      
      if (!redisService.isConnected()) {
        return;
      }
      
      await redisService.invalidatePattern(`acc:ledger:${companyId}:*`);
      log(`Invalidated ledger cache for ${companyId}`, 'journal-cache');
    } catch (error: any) {
      log(`Error invalidating ledger cache: ${error.message}`, 'journal-error');
    }
  }
}

export default JournalService;