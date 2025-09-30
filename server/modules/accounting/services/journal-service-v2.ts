/**
 * Journal Service V2
 * 
 * Core service for journal entries in the accounting system.
 * Handles creating and managing ledger entries and lines.
 * Also provides direct recordTransaction method for simpler double-entry transaction recording.
 * 
 * This version uses direct SQL queries instead of Drizzle ORM to avoid type errors.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDrizzle, getClient } from '../../../common/drizzle';
import { AuditService, AuditAction } from '../../audit/services/audit.service';

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
export class JournalServiceV2 {
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
    
    const db = getDrizzle();
    
    try {
      // Generate UUIDs
      const entryId = uuidv4();
      const now = new Date();
      
      console.log('[DEBUG] Using direct SQL for database operations');
      
      // Use direct SQL queries instead of Drizzle ORM
      // Execute the entry insert
      // Using postgres client function directly as a tagged template literal
      const sqlClient = getClient();
      await sqlClient`
        INSERT INTO ledger_entries (
          id, company_id, franchise_id, type, reference_number, 
          amount, description, created_at, updated_at, created_by
        ) VALUES (
          ${entryId}, ${companyId}, ${franchiseId || null}, ${type}, ${referenceNumber || null},
          ${amount}, ${description}, ${now.toISOString()}, ${now.toISOString()}, ${userId || null}
        ) RETURNING id
      `;
      
      console.log('[DEBUG] Entry inserted with ID:', entryId);
      
      // Insert all the lines
      const lineIds = [];
      for (const line of lines) {
        const lineId = uuidv4();
        lineIds.push(lineId);
        
        // Get the account ID from either accountId or accountNumber field
        const accountId = line.accountId || line.accountNumber;
        
        if (!accountId) {
          throw new Error('Account ID is required for ledger line');
        }
        
        const sql = getClient();
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
      
      console.log('[DEBUG] Inserted', lineIds.length, 'ledger lines');
      
      // Fetch the entry data with a direct query using SQL tagged template
      const sql = getClient();
      const entryResult = await sql`
        SELECT 
          id, company_id as "companyId", franchise_id as "franchiseId", 
          type, reference_number as "referenceNumber", amount, 
          description, created_at as "createdAt"
        FROM ledger_entries 
        WHERE id = ${entryId}
      `;
      
      // Fetch the lines with a direct query using SQL tagged template
      const linesResult = await sql`
        SELECT 
          id, ledger_entry_id as "ledgerEntryId", account_id as "accountId", 
          debit_amount as "debitAmount", credit_amount as "creditAmount", 
          description
        FROM ledger_lines 
        WHERE ledger_entry_id = ${entryId}
      `;
      
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
      
      // Create a consistent result structure
      // Check if entryResult has the expected structure with SQL tagged template
      const entryRow = entryResult && 
                      Array.isArray(entryResult) && 
                      entryResult.length > 0 
                      ? entryResult[0] 
                      : null;
                     
      // Check if linesResult has the expected structure with SQL tagged template
      const lineRows = linesResult && 
                      Array.isArray(linesResult) 
                      ? linesResult 
                      : [];
      
      if (!entryRow) {
        console.error('[ERROR] Failed to retrieve entry after creation');
        
        // Return a structure based on what we know was inserted
        return {
          id: entryId,
          companyId,
          type: type as LedgerEntryType,
          referenceNumber: referenceNumber || '',
          amount: Number(amount),
          description,
          createdAt: now.toISOString(),
          lines: lineIds.map((lineId, index) => ({
            id: lineId,
            ledgerEntryId: entryId,
            accountId: lines[index].accountId || lines[index].accountNumber || '',
            debitAmount: Number(lines[index].debitAmount || 0),
            creditAmount: Number(lines[index].creditAmount || 0),
            description: lines[index].description || description
          }))
        };
      }
      
      // Process result using SQL query results
      return {
        id: entryRow.id,
        companyId: entryRow.companyId,
        type: entryRow.type as LedgerEntryType,
        referenceNumber: entryRow.referenceNumber || '',
        amount: Number(entryRow.amount),
        description: entryRow.description,
        createdAt: entryRow.createdAt,
        lines: lineRows.map(line => ({
          id: line.id,
          ledgerEntryId: line.ledgerEntryId,
          accountId: line.accountId,
          debitAmount: Number(line.debitAmount || 0),
          creditAmount: Number(line.creditAmount || 0),
          description: line.description || ''
        }))
      };
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
    
    const db = getDrizzle();
    
    // Get the original entry using SQL tagged template
    const sql = getClient();
    const entryResult = await sql`
      SELECT 
        id, company_id as "companyId", franchise_id as "franchiseId", 
        type, reference_number as "referenceNumber", amount, 
        description, created_at as "createdAt", created_by as "createdBy"
      FROM ledger_entries 
      WHERE id = ${ledgerEntryId}
    `;
    
    // Check if entryResult has the expected structure with SQL tagged template
    const originalEntry = entryResult && 
                      Array.isArray(entryResult) && 
                      entryResult.length > 0 
                      ? entryResult[0] 
                      : null;
    
    if (!originalEntry) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    // Get the original lines using SQL tagged template
    const linesResult = await sql`
      SELECT 
        id, ledger_entry_id as "ledgerEntryId", account_id as "accountId", 
        debit_amount as "debitAmount", credit_amount as "creditAmount", 
        description
      FROM ledger_lines 
      WHERE ledger_entry_id = ${ledgerEntryId}
    `;
    
    // Check if linesResult has the expected structure with SQL tagged template
    const originalLines = linesResult && 
                        Array.isArray(linesResult)
                        ? linesResult 
                        : [];
    
    if (originalLines.length === 0) {
      throw new Error('Ledger entry is missing its associated lines');
    }
    
    // Create reversal lines by swapping debit and credit amounts
    const reversalLines = originalLines.map(line => ({
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
   * Retrieve a ledger entry by ID including all its lines
   * @param entryId The ledger entry ID to retrieve
   * @returns The ledger entry data with lines
   */
  async getLedgerEntryById(entryId: string): Promise<LedgerEntryData | null> {
    try {
      console.log(`[DEBUG] Getting ledger entry by ID: ${entryId}`);
      
      // First get the ledger entry using SQL tagged template
      const sql = getClient();
      const entryResult = await sql`
        SELECT * FROM ledger_entries 
        WHERE id = ${entryId}
      `;
      
      // Check if entryResult has the expected structure
      if (!entryResult || entryResult.length === 0) {
        console.log(`[DEBUG] No ledger entry found with ID: ${entryId}`);
        return null;
      }
      
      const entry = entryResult[0];
      
      // Then get all the lines for this entry using SQL tagged template
      const linesResult = await sql`
        SELECT * FROM ledger_lines
        WHERE ledger_entry_id = ${entryId}
        ORDER BY id
      `;
      
      // Check if linesResult has the expected structure
      const lines = linesResult && Array.isArray(linesResult) ? linesResult : [];
      
      // Format the data according to our interface
      const result: LedgerEntryData = {
        id: entry.id,
        companyId: entry.company_id,
        type: entry.type as LedgerEntryType,
        referenceNumber: entry.reference_number,
        amount: parseFloat(entry.amount),
        description: entry.description,
        createdAt: entry.created_at,
        lines: lines.map(line => ({
          id: line.id,
          ledgerEntryId: line.ledger_entry_id,
          accountId: line.account_id,
          debitAmount: parseFloat(line.debit_amount || 0),
          creditAmount: parseFloat(line.credit_amount || 0),
          description: line.description
        }))
      };
      
      console.log(`[DEBUG] Successfully retrieved ledger entry with ${result.lines.length} lines`);
      return result;
    } catch (error) {
      console.error('[ERROR] Error getting ledger entry by ID:', error);
      throw error;
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
    
    // Determine entry type from documentType
    let entryType = LedgerEntryType.GENERAL;
    if (documentType) {
      try {
        entryType = LedgerEntryType[documentType as keyof typeof LedgerEntryType] || LedgerEntryType.GENERAL;
      } catch (e) {
        console.warn(`Invalid document type: ${documentType}, using GENERAL instead`);
      }
    }
    
    // Create the ledger entry
    const ledgerEntry = await this.createLedgerEntry({
      companyId,
      franchiseId,
      type: entryType,
      referenceNumber: documentId,
      amount,
      description,
      userId,
      lines
    });
    
    return ledgerEntry.id;
  }
}

export default JournalServiceV2;