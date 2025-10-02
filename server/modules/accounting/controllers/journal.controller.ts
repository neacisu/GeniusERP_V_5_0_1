import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { JournalService, LedgerEntryType } from '../services/journal.service';
import { JournalServiceV2 } from '../services/journal-service-v2';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';
import { getDrizzle } from '../../../common/drizzle';
import { v4 as uuidv4 } from 'uuid';
import { AuditService, AuditAction } from '../../audit/services/audit.service';

/**
 * JournalController 
 * 
 * Handles journal and ledger operations in the accounting system
 */
export class JournalController extends BaseController {
  private readonly journalServiceV2: JournalServiceV2;
  
  constructor(private readonly journalService: JournalService) {
    super();
    this.journalServiceV2 = new JournalServiceV2();
  }
  
  /**
   * Get all ledger entries (Registrul Jurnal)
   * GET /api/accounting/ledger/entries
   */
  async getLedgerEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      const db = getDrizzle();
      const entries = await db.$client`
        SELECT 
          le.*,
          json_agg(
            json_build_object(
              'id', ll.id,
              'accountId', ll.account_id,
              'debitAmount', ll.debit_amount,
              'creditAmount', ll.credit_amount,
              'description', ll.description
            ) ORDER BY ll.id
          ) as lines
        FROM ledger_entries le
        LEFT JOIN ledger_lines ll ON le.id = ll.ledger_entry_id
        WHERE le.company_id = ${companyId}
        GROUP BY le.id
        ORDER BY le.created_at DESC
      `;
      
      return entries.map((e: any) => ({
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
      
      // Record the transaction using the V2 service for direct SQL
      console.log('[DEBUG] Using JournalServiceV2 for transaction recording');
      const entryId = await this.journalServiceV2.recordTransaction({
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
      
      console.log(`[DEBUG] Fetching transaction details for entry ID: ${entryId} using JournalServiceV2`);
      
      try {
        // Use the V2 service to get transaction by ID
        const transaction = await this.journalServiceV2.getLedgerEntryById(entryId);
        
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
      
      // Create the ledger entry using the V2 service with direct SQL
      console.log('[DEBUG] Using JournalServiceV2 for direct SQL operations');
      const entry = await this.journalServiceV2.createLedgerEntry({
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
   * Reverse a ledger entry
   * POST /api/accounting/ledger/entries/:id/reverse
   */
  async reverseLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const entryId = req.params.id;
      const { reason } = req.body;
      
      if (!reason) {
        throw {
          statusCode: 400,
          message: "Reason for reversal is required"
        };
      }
      
      // Use the V2 service for direct SQL operations
      console.log('[DEBUG] Using JournalServiceV2 for reversal operation');
      const reversalId = await this.journalServiceV2.reverseLedgerEntry(entryId, reason);
      
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
}