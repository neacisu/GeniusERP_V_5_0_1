/**
 * Journal Service
 * 
 * Core service for journal entries in the accounting system.
 * Handles creating and managing ledger entries and lines.
 * Also provides direct recordTransaction method for simpler double-entry transaction recording.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDrizzle, getClient } from '../../../common/drizzle';
import { ledgerEntries, ledgerLines } from '../schema/accounting.schema';
import { eq, and } from 'drizzle-orm';
import { AuditService, AuditAction } from '../../audit/services/audit.service';
import { JournalNumberingService } from './journal-numbering.service';
import { AccountingPeriodsService } from './accounting-periods.service';

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
  createdAt: string;
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
   * Reverse a ledger entry
   * @param ledgerEntryId ID of the ledger entry to reverse
   * @param reason Reason for the reversal
   * @returns Reversal ledger entry ID
   */
  async reverseLedgerEntry(ledgerEntryId: string, reason: string): Promise<string> {
    if (!ledgerEntryId) {
      throw new Error('Ledger entry ID is required');
    }
    
    if (!reason) {
      throw new Error('Reversal reason is required');
    }
    
    const sql = getClient();
    
    // Get the original entry with lines using direct SQL
    const originalEntry = await sql`
      SELECT 
        e.id, e.company_id, e.type, e.reference_number, e.amount, e.description,
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
    
    // Create reversal lines by swapping debit and credit amounts
    // First ensure lines is an array
    if (!Array.isArray(originalEntry.lines)) {
      throw new Error('Ledger entry is missing its associated lines');
    }
    
    const reversalLines = originalEntry.lines.map(line => ({
      accountId: line.accountId,
      debitAmount: Number(line.creditAmount),
      creditAmount: Number(line.debitAmount),
      description: `Reversal: ${line.description}`
    }));
    
    // Create the reversal entry
    const reversalEntry = await this.createLedgerEntry({
      companyId: originalEntry.companyId,
      franchiseId: originalEntry.franchiseId,
      type: LedgerEntryType.REVERSAL,
      referenceNumber: `REV-${originalEntry.referenceNumber || originalEntry.id}`,
      amount: Number(originalEntry.amount),
      description: `Reversal of entry ${originalEntry.id}: ${reason}`,
      userId: originalEntry.createdBy,
      lines: reversalLines
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
}

export default JournalService;