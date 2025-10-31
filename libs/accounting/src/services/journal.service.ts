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

import { getDrizzle } from "@common/drizzle";
import { AC_accounting_ledger_entries, AC_accounting_ledger_lines } from '@geniuserp/shared';
import { eq } from 'drizzle-orm';
import { AuditService, AuditAction } from '@geniuserp/audit';
import { JournalNumberingService } from './journal-numbering.service';
import { AccountingPeriodsService } from './accounting-periods.service';
import { accountingQueueService } from './accounting-queue.service';
import { RedisService } from '@common/services/redis.service';
import { chartOfAccountsUtils } from '@geniuserp/shared';

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
  franchiseId?: string | null;
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
  private redisService: RedisService;

  constructor() {
    this.redisService = new RedisService();
  }

  private async ensureRedisConnection(): Promise<void> {
    if (!this.redisService.isConnected()) {
      await this.redisService.connect();
    }
  }

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
    
    // Generate journal number (for future use when added to schema)
    await numberingService.generateJournalNumber(
      companyId,
      type,
      entryDate
    );
    
    try {
      // Generate UUIDs
      const now = new Date();
      
      // Calculate totals from lines
      const totalDebit = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
      const totalCredit = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
      
      // Extract fiscal year and month from entry date
      const fiscalYear = entryDate.getFullYear();
      const fiscalMonth = entryDate.getMonth() + 1;
      
      // Use Drizzle ORM for database operations
      const db = getDrizzle();
      
      // Create entry and lines in a transaction
      const result = await db.transaction(async (tx) => {
        // Insert into AC_accounting_ledger_entries and get the generated ID
        const [createdEntry] = await tx.insert(AC_accounting_ledger_entries).values({
          company_id: companyId,
          franchise_id: franchiseId || null,
          type: type,
          transaction_date: entryDate,
          posting_date: entryDate,
          document_date: (documentDate || entryDate).toISOString().split('T')[0],
          document_number: referenceNumber || null,
          document_type: type,
          description: description,
          notes: null,
          is_posted: false,
          is_draft: true,
          is_system_generated: false,
          total_amount: amount.toString(),
          total_debit: totalDebit.toString(),
          total_credit: totalCredit.toString(),
          currency: 'RON',
          exchange_rate: '1',
          fiscal_year: fiscalYear,
          fiscal_month: fiscalMonth,
          created_at: now,
          updated_at: now,
          created_by: userId || null,
          metadata: null
        }).returning({ id: AC_accounting_ledger_entries.id });
        
        const actualEntryId = createdEntry.id;
        
        // Insert ledger lines into AC_accounting_ledger_lines
        const lineValues = lines.map((line, index) => {
          const accountId = line.accountId || line.accountNumber;
          
          if (!accountId) {
            throw new Error('Account ID is required for ledger line');
          }
          
          // Parse account structure using centralized utils
          const accountStr = String(accountId);
          const accountClass = parseInt(chartOfAccountsUtils.extractClassCode(accountStr)) || 0;
          const accountGroup = parseInt(chartOfAccountsUtils.extractGroupCode(accountStr)) || 0;
          const accountNumber = accountStr.substring(0, 3) || accountStr;
          const accountSubNumber = accountStr.length > 3 ? accountStr.substring(3) : null;
          
          return {
            ledger_entry_id: actualEntryId,
            company_id: companyId,
            line_number: index + 1,
            description: line.description || description,
            account_class: accountClass,
            account_group: accountGroup,
            account_number: accountNumber,
            account_sub_number: accountSubNumber,
            full_account_number: accountId,
            amount: ((line.debitAmount || 0) + (line.creditAmount || 0)).toString(),
            debit_amount: (line.debitAmount || 0).toString(),
            credit_amount: (line.creditAmount || 0).toString(),
            currency: 'RON',
            exchange_rate: '1',
            created_at: now,
            updated_at: now,
            metadata: null
          };
        });
        
        await tx.insert(AC_accounting_ledger_lines).values(lineValues);
        
        // Fetch the created entry with lines using Drizzle
        const [entryWithData] = await tx
          .select()
          .from(AC_accounting_ledger_entries)
          .where(eq(AC_accounting_ledger_entries.id, actualEntryId))
          .limit(1);
        
        const createdLines = await tx
          .select()
          .from(AC_accounting_ledger_lines)
          .where(eq(AC_accounting_ledger_lines.ledger_entry_id, actualEntryId));
        
        const entry: LedgerEntryData = {
          id: entryWithData.id,
          companyId: entryWithData.company_id,
          franchiseId: entryWithData.franchise_id ?? null,
          type: entryWithData.type as LedgerEntryType,
          referenceNumber: entryWithData.document_number ?? undefined,
          journalNumber: undefined,
          entryDate: entryWithData.transaction_date.toISOString(),
          documentDate: entryWithData.document_date,
          amount: parseFloat(entryWithData.total_amount),
          description: entryWithData.description ?? '',
          createdAt: entryWithData.created_at.toISOString(),
          createdBy: entryWithData.created_by ?? undefined,
          lines: createdLines.map(line => ({
            id: line.id,
            ledgerEntryId: line.ledger_entry_id,
            accountId: line.full_account_number,
            debitAmount: parseFloat(line.debit_amount),
            creditAmount: parseFloat(line.credit_amount),
            description: line.description ?? ''
          }))
        };
        
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
          entityId: result.id,
          details: {
            type,
            amount,
            referenceNumber
          }
        });
      }
      
      return result;
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
    
    const db = getDrizzle();
    
    // Get the original entry with lines using Drizzle ORM
    const [originalEntryData] = await db
      .select()
      .from(AC_accounting_ledger_entries)
      .where(eq(AC_accounting_ledger_entries.id, ledgerEntryId))
      .limit(1);
    
    if (!originalEntryData) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    const originalLines = await db
      .select()
      .from(AC_accounting_ledger_lines)
      .where(eq(AC_accounting_ledger_lines.ledger_entry_id, ledgerEntryId));
    
    const originalEntry = {
      id: originalEntryData.id,
      companyId: originalEntryData.company_id,
      franchiseId: originalEntryData.franchise_id ?? null,
      type: originalEntryData.type,
      referenceNumber: originalEntryData.document_number ?? undefined,
      amount: parseFloat(originalEntryData.total_amount),
      description: originalEntryData.description,
      isPosted: originalEntryData.is_posted,
      isReversed: originalEntryData.is_reversal,
      reversalEntryId: originalEntryData.reversal_entry_id ?? undefined,
      createdAt: originalEntryData.created_at.toISOString(),
      createdBy: originalEntryData.created_by ?? undefined,
      lines: originalLines.map(line => ({
        id: line.id,
        ledgerEntryId: line.ledger_entry_id,
        accountId: line.full_account_number,
        debitAmount: parseFloat(line.debit_amount),
        creditAmount: parseFloat(line.credit_amount),
        description: line.description
      }))
    };
    
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
      debitAmount: line.creditAmount,
      creditAmount: line.debitAmount,
      description: `Stornare: ${line.description || ''}`
    }));
    
    // Create the reversal entry
    const reversalEntry = await this.createLedgerEntry({
      companyId: originalEntry.companyId,
      franchiseId: originalEntry.franchiseId ?? undefined,
      type: LedgerEntryType.REVERSAL,
      referenceNumber: `REV-${originalEntry.referenceNumber || originalEntry.id}`,
      amount: originalEntry.amount,
      description: `Stornare nota ${originalEntry.referenceNumber || originalEntry.id}: ${reason}`,
      userId: userId,
      lines: reversalLines
    });
    
    // Update the reversal entry to link it to the original
    const now = new Date();
    await db
      .update(AC_accounting_ledger_entries)
      .set({
        original_entry_id: ledgerEntryId,
        updated_at: now
      })
      .where(eq(AC_accounting_ledger_entries.id, reversalEntry.id));
    
    // Post the reversal entry automatically
    await this.postLedgerEntry(reversalEntry.id, userId);
    
    // Mark the original entry as reversed
    await db
      .update(AC_accounting_ledger_entries)
      .set({
        is_reversal: true,
        reversed_at: now,
        reversed_by: userId,
        reversal_reason: reason,
        reversal_entry_id: reversalEntry.id,
        updated_at: now
      })
      .where(eq(AC_accounting_ledger_entries.id, ledgerEntryId));
    
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
  /**
   * Parse account number to extract class and group
   * Uses centralized chartOfAccountsUtils for consistency
   * @param accountId Account ID or number
   * @returns Account class and group as numbers
   * @deprecated Consider using chartOfAccountsUtils directly for string operations
   */
  parseAccountNumber(accountId: string): { class: number; group: number } {
    // Romanian account numbers follow format X or XY or XYZ
    // Where X is class (1-9), Y is group, Z is synthetic account
    const accountNumber = accountId.toString().split('-')[0]; // In case there's an analytic part after dash
    
    // Use centralized utils to avoid code duplication
    const classCode = chartOfAccountsUtils.extractClassCode(accountNumber);
    const groupCode = chartOfAccountsUtils.extractGroupCode(accountNumber);
    
    return {
      class: parseInt(classCode) || 0,
      group: parseInt(groupCode) || 0
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
    
    const db = getDrizzle();
    
    // Get the entry to validate it exists and is not already posted
    const [entry] = await db
      .select({
        id: AC_accounting_ledger_entries.id,
        companyId: AC_accounting_ledger_entries.company_id,
        type: AC_accounting_ledger_entries.type,
        isPosted: AC_accounting_ledger_entries.is_posted,
        isReversed: AC_accounting_ledger_entries.is_reversal,
        amount: AC_accounting_ledger_entries.total_amount,
        description: AC_accounting_ledger_entries.description
      })
      .from(AC_accounting_ledger_entries)
      .where(eq(AC_accounting_ledger_entries.id, ledgerEntryId))
      .limit(1);
    
    if (!entry) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    if (entry.isPosted) {
      throw new Error('Ledger entry is already posted');
    }
    
    if (entry.isReversed) {
      throw new Error('Cannot post a reversed entry');
    }
    
    // Validate that lines are balanced
    const lines = await db
      .select({
        debit_amount: AC_accounting_ledger_lines.debit_amount,
        credit_amount: AC_accounting_ledger_lines.credit_amount
      })
      .from(AC_accounting_ledger_lines)
      .where(eq(AC_accounting_ledger_lines.ledger_entry_id, ledgerEntryId));
    
    if (lines.length === 0) {
      throw new Error('Ledger entry has no lines');
    }
    
    const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit_amount), 0);
    const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit_amount), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Ledger entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
    }
    
    // Update the entry to mark it as posted
    const now = new Date();
    await db
      .update(AC_accounting_ledger_entries)
      .set({
        is_posted: true,
        is_draft: false,
        posted_at: now,
        posted_by: userId,
        updated_at: now
      })
      .where(eq(AC_accounting_ledger_entries.id, ledgerEntryId));
    
    // Log audit event
    await AuditService.log({
      userId,
      companyId: entry.companyId,
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
    
    const db = getDrizzle();
    
    // Get the entry to validate
    const [entry] = await db
      .select({
        id: AC_accounting_ledger_entries.id,
        companyId: AC_accounting_ledger_entries.company_id,
        type: AC_accounting_ledger_entries.type,
        isPosted: AC_accounting_ledger_entries.is_posted,
        isReversed: AC_accounting_ledger_entries.is_reversal,
        reversalEntryId: AC_accounting_ledger_entries.reversal_entry_id
      })
      .from(AC_accounting_ledger_entries)
      .where(eq(AC_accounting_ledger_entries.id, ledgerEntryId))
      .limit(1);
    
    if (!entry) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    if (!entry.isPosted) {
      throw new Error('Ledger entry is not posted');
    }
    
    if (entry.isReversed) {
      throw new Error('Cannot unpost a reversed entry');
    }
    
    if (entry.reversalEntryId) {
      throw new Error('Cannot unpost an entry that has a reversal');
    }
    
    // Update the entry to mark it as draft again
    const now = new Date();
    await db
      .update(AC_accounting_ledger_entries)
      .set({
        is_posted: false,
        is_draft: true,
        posted_at: null,
        posted_by: null,
        updated_at: now
      })
      .where(eq(AC_accounting_ledger_entries.id, ledgerEntryId));
    
    // Log audit event
    await AuditService.log({
      userId,
      companyId: entry.companyId,
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
   * Enhanced cu Redis caching (TTL: 10min)
   * @param ledgerEntryId ID of the ledger entry
   * @returns Ledger entry with lines
   */
  async getLedgerEntry(ledgerEntryId: string): Promise<LedgerEntryData> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:ledger-entry:${ledgerEntryId}`;
    
    // Check cache first
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<LedgerEntryData>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const db = getDrizzle();
    
    // Get the entry
    const [entry] = await db
      .select()
      .from(AC_accounting_ledger_entries)
      .where(eq(AC_accounting_ledger_entries.id, ledgerEntryId))
      .limit(1);
    
    if (!entry) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    // Get the lines
    const lines = await db
      .select()
      .from(AC_accounting_ledger_lines)
      .where(eq(AC_accounting_ledger_lines.ledger_entry_id, ledgerEntryId));
    
    const entryData: LedgerEntryData = {
      id: entry.id,
      companyId: entry.company_id,
      franchiseId: entry.franchise_id ?? null,
      type: entry.type as LedgerEntryType,
      referenceNumber: entry.document_number ?? undefined,
      journalNumber: undefined,
      entryDate: entry.transaction_date.toISOString(),
      documentDate: entry.document_date,
      amount: parseFloat(entry.total_amount),
      description: entry.description ?? '',
      isPosted: entry.is_posted,
      postedAt: entry.posted_at?.toISOString(),
      postedBy: entry.posted_by ?? undefined,
      isReversed: entry.is_reversal,
      reversedAt: entry.reversed_at?.toISOString(),
      reversedBy: entry.reversed_by ?? undefined,
      reversalReason: entry.reversal_reason ?? undefined,
      originalEntryId: entry.original_entry_id ?? undefined,
      reversalEntryId: entry.reversal_entry_id ?? undefined,
      createdAt: entry.created_at.toISOString(),
      createdBy: entry.created_by ?? undefined,
      updatedAt: entry.updated_at?.toISOString(),
      lines: lines.map(line => ({
        id: line.id,
        ledgerEntryId: line.ledger_entry_id,
        accountId: line.full_account_number,
        debitAmount: parseFloat(line.debit_amount),
        creditAmount: parseFloat(line.credit_amount),
        description: line.description ?? ''
      }))
    };
    
    // Cache for 10 minutes if Redis is available
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, entryData, 600);
    }
    
    return entryData;
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
      console.log(`Queueing balance update for journal entry ${journalEntryId}`, 'journal-async');
      await accountingQueueService.queueBalanceUpdate({ journalEntryId, companyId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error queueing balance update: ${errorMessage}`, 'journal-error');
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
      console.log(`Invalidated ledger cache for ${companyId}`, 'journal-cache');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Error invalidating ledger cache: ${errorMessage}`, 'journal-error');
    }
  }
}

export default JournalService;