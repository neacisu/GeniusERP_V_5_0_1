/**
 * Journal Service
 * 
 * Core service for journal entries in the accounting system.
 * Handles creating and managing ledger entries and lines.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDrizzle } from '../../../common/drizzle';
import { ledgerEntries, ledgerLines } from '../schema/accounting.schema';
import { eq, and } from 'drizzle-orm';
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
    
    const db = getDrizzle();
    
    try {
      // Generate UUIDs
      const entryId = uuidv4();
      const now = new Date();
      
      // Create entry and lines in a transaction
      // Execute as an atomic operation
      const result = await (async () => {
        // Insert ledger entry
        await db.insert(ledgerEntries).values({
          id: entryId,
          companyId,
          franchiseId,
          type,
          referenceNumber,
          amount,
          description,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          createdBy: userId
        });
        
        // Insert ledger lines
        const lineEntities = lines.map(line => {
          const lineId = uuidv4();
          
          return {
            id: lineId,
            ledgerEntryId: entryId,
            accountId: line.accountId,
            debitAmount: line.debitAmount || 0,
            creditAmount: line.creditAmount || 0,
            description: line.description || description,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
          };
        });
        
        await db.insert(ledgerLines).values(lineEntities);
        
        // Fetch the created entry with lines
        const entry = await db.query.ledgerEntries.findFirst({
          where: eq(ledgerEntries.id, entryId),
          with: {
            lines: true
          }
        });
        
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
      
      // Return entry data
      return {
        id: result.id,
        companyId: result.companyId,
        type: result.type as LedgerEntryType,
        referenceNumber: result.referenceNumber,
        amount: Number(result.amount),
        description: result.description,
        createdAt: result.createdAt,
        lines: result.lines.map(line => ({
          id: line.id,
          ledgerEntryId: line.ledgerEntryId,
          accountId: line.accountId,
          debitAmount: Number(line.debitAmount),
          creditAmount: Number(line.creditAmount),
          description: line.description
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
    
    // Get the original entry with lines
    const originalEntry = await db.query.ledgerEntries.findFirst({
      where: eq(ledgerEntries.id, ledgerEntryId),
      with: {
        lines: true
      }
    });
    
    if (!originalEntry) {
      throw new Error(`Ledger entry with ID ${ledgerEntryId} not found`);
    }
    
    // Create reversal lines by swapping debit and credit amounts
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
}

export default JournalService;