import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { JournalService, LedgerEntryType } from '../services/journal.service';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';
import { getDrizzle } from '../../../common/drizzle';
import { eq, desc } from 'drizzle-orm';
import { ledgerEntries, ledgerLines } from '../../../../shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { AuditService, AuditAction } from '../../audit/services/audit.service';

/**
 * JournalController 
 * 
 * Handles journal and ledger operations in the accounting system
 */
export class JournalController extends BaseController {
  constructor(private readonly journalService: JournalService) {
    super();
  }
  
  /**
   * Get all ledger entries (Registrul Jurnal)
   * GET /api/accounting/ledger/entries
   */
  async getLedgerEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      const db = getDrizzle();
      // Get entries using Drizzle ORM
      const entries = await db
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.companyId, companyId))
        .orderBy(desc(ledgerEntries.createdAt));
      
      // Load lines for each entry
      const entriesWithLines = await Promise.all(
        entries.map(async (entry) => {
          const lines = await db
            .select()
            .from(ledgerLines)
            .where(eq(ledgerLines.ledgerEntryId, entry.id))
            .orderBy(ledgerLines.id);
          
          return {
            ...entry,
            lines: lines.map(line => ({
              id: line.id,
              accountId: line.accountId,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              description: line.description
            }))
          };
        })
      );
      
      return entriesWithLines.map((e: any) => ({
        id: e.id,
        number: e.note_number || `NC-${e.id.substring(0, 8)}`, // Numărul NOTEI contabile
        date: e.created_at,
        description: e.description,
        source: e.type,
        referenceDocument: e.reference_number, // Numărul DOCUMENTULUI sursă (TEST-0001, etc.)
        referenceNumber: e.reference_number, // Pentru afișare în coloană
        amount: Number(e.amount),
        lines: e.lines || []
      }));
    });
  }
  
  /**
   * Record a new transaction
   * POST /api/accounting/ledger/transactions
   */
  async recordTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const {
        debitAccount,
        creditAccount,
        amount,
        description,
        documentId,
        documentType,
        franchiseId
      } = req.body;
      
      // Basic validation
      if (!debitAccount || !creditAccount || !amount || !description) {
        throw {
          statusCode: 400,
          message: "Missing required fields: debitAccount, creditAccount, amount, and description are required"
        };
      }
      
      // Get the company ID from the authenticated user
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      // Record the transaction using direct SQL
      console.log('[DEBUG] Using JournalService for transaction recording');
      const entryId = await this.journalService.recordTransaction({
        companyId,
        franchiseId,
        debitAccount,
        creditAccount,
        amount: Number(amount),
        description,
        documentId,
        documentType,
        userId
      });
      
      return {
        success: true,
        data: {
          entryId,
          message: "Transaction recorded successfully"
        }
      };
    });
  }
  
  /**
   * Get transaction details
   * GET /api/accounting/ledger/transactions/:id
   */
  async getTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const entryId = req.params.id;
      const companyId = this.getCompanyId(req);
      
      console.log(`[DEBUG] Fetching transaction details for entry ID: ${entryId} using JournalService`);
      
      try {
        // Get transaction by ID
        const transaction = await this.journalService.getLedgerEntry(entryId);
        
        if (!transaction) {
          throw {
            statusCode: 404,
            message: `Transaction with ID ${entryId} not found`
          };
        }
        
        // Check if the transaction belongs to the company
        if (transaction.companyId !== companyId) {
          throw {
            statusCode: 403,
            message: "You don't have permission to access this transaction"
          };
        }
        
        return {
          success: true,
          data: transaction
        };
      } catch (error) {
        const err = error as any;
        console.error(`[ERROR] Failed to fetch transaction details: ${err.message || error}`);
        throw {
          statusCode: err.statusCode || 500,
          message: err.message || "Failed to fetch transaction details"
        };
      }
    });
  }
  
  /**
   * Create a ledger entry
   * POST /api/accounting/ledger/entries or /api/accounting/ledger/entry
   */
  async createLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { 
        type, 
        referenceNumber, 
        documentType, 
        documentNumber,
        amount, 
        description, 
        transactionDate,
        lines 
      } = req.body;
      
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const franchiseId = this.getFranchiseId(req);
      
      // Map account numbers to account IDs if provided that way
      const mappedLines = lines.map((line: any) => {
        // If the line already has accountId, use it
        if (line.accountId) {
          return line;
        }
        
        // Otherwise, use accountNumber as the accountId
        // In a real system, we'd look up the actual account ID based on number
        return {
          ...line,
          accountId: line.accountNumber
        };
      });
      
      console.log('[DEBUG] Creating ledger entry with mapped lines:', JSON.stringify(mappedLines, null, 2));
      
      // Create the ledger entry using direct SQL
      console.log('[DEBUG] Using JournalService for direct SQL operations');
      const entry = await this.journalService.createLedgerEntry({
        companyId,
        franchiseId: franchiseId || undefined,
        // Use the type from the request, or map from documentType if not provided
        type: type || (documentType as LedgerEntryType),
        // Use referenceNumber if provided, otherwise use documentNumber
        referenceNumber: referenceNumber || documentNumber,
        amount: Number(amount),
        description,
        userId,
        lines: mappedLines
      });
      
      return {
        success: true,
        data: entry,
        message: "Ledger entry created successfully"
      };
    });
  }
  
  /**
   * Reverse a ledger entry (create stornare)
   * POST /api/accounting/ledger/entries/:id/reverse
   * Only posted entries can be reversed
   */
  async reverseLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const entryId = req.params.id;
      const { reason } = req.body;
      const userId = this.getUserId(req);
      
      if (!reason) {
        throw {
          statusCode: 400,
          message: "Reason for reversal is required"
        };
      }
      
      console.log('[DEBUG] Reversing ledger entry:', entryId, 'Reason:', reason);
      const reversalId = await this.journalService.reverseLedgerEntry(entryId, reason, userId);
      
      return {
        success: true,
        data: {
          originalEntryId: entryId,
          reversalEntryId: reversalId,
          message: "Ledger entry reversed successfully"
        }
      };
    });
  }

  /**
   * Post a ledger entry (mark as final/posted)
   * POST /api/accounting/ledger/entries/:id/post
   */
  async postLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const entryId = req.params.id;
      const userId = this.getUserId(req);
      
      if (!entryId) {
        throw {
          statusCode: 400,
          message: "Ledger entry ID is required"
        };
      }
      
      console.log('[DEBUG] Posting ledger entry:', entryId);
      const postedEntry = await this.journalService.postLedgerEntry(entryId, userId);
      
      return {
        success: true,
        data: postedEntry,
        message: "Ledger entry posted successfully"
      };
    });
  }

  /**
   * Unpost a ledger entry (revert to draft)
   * POST /api/accounting/ledger/entries/:id/unpost
   */
  async unpostLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const entryId = req.params.id;
      const userId = this.getUserId(req);
      
      if (!entryId) {
        throw {
          statusCode: 400,
          message: "Ledger entry ID is required"
        };
      }
      
      console.log('[DEBUG] Unposting ledger entry:', entryId);
      const unpostedEntry = await this.journalService.unpostLedgerEntry(entryId, userId);
      
      return {
        success: true,
        data: unpostedEntry,
        message: "Ledger entry unposted successfully"
      };
    });
  }

  /**
   * Get ledger entry details including posting status
   * GET /api/accounting/ledger/entries/:id
   */
  async getLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const entryId = req.params.id;
      const companyId = this.getCompanyId(req);
      
      if (!entryId) {
        throw {
          statusCode: 400,
          message: "Ledger entry ID is required"
        };
      }
      
      console.log('[DEBUG] Getting ledger entry:', entryId);
      const entry = await this.journalService.getLedgerEntry(entryId);
      
      // Verify company ownership
      if (entry.companyId !== companyId) {
        throw {
          statusCode: 403,
          message: "You don't have permission to access this entry"
        };
      }
      
      return {
        success: true,
        data: entry
      };
    });
  }
}