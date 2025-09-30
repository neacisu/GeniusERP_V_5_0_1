import { Router } from "express";
import { BankJournalService } from "../services";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { bankJournalService } from "..";
import { BankJournalController } from "../controllers/bank-journal.controller";
import { AuthenticatedRequest } from "../../../common/middleware/auth-types";
import { Response } from "express";

/**
 * Setup routes for the Romanian Bank Journal
 * Routes for managing bank transactions and reconciliations
 */
export function setupBankJournalRoutes() {
  const router = Router();
  
  // Create controller instance
  const bankJournalController = new BankJournalController(bankJournalService);
  
  // Apply authentication middleware to all bank journal routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  /**
   * Get all bank accounts
   */
  router.get("/accounts", (req: AuthenticatedRequest, res: Response) => {
    bankJournalController.getBankAccounts(req, res);
  });
  
  /**
   * Get bank account by ID
   */
  router.get("/accounts/:id", (req: AuthenticatedRequest, res: Response) => {
    bankJournalController.getBankAccount(req, res);
  });
  
  /**
   * Create new bank account
   * Requires accountant or admin role
   */
  router.post(
    "/accounts", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      bankJournalController.createBankAccount(req, res);
    }
  );
  
  /**
   * Update bank account
   * Requires accountant or admin role
   */
  router.put(
    "/accounts/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      bankJournalController.updateBankAccount(req, res);
    }
  );
  
  /**
   * Get bank transactions with pagination and filtering
   */
  router.get("/transactions", (req: AuthenticatedRequest, res: Response) => {
    bankJournalController.getBankTransactions(req, res);
  });
  
  /**
   * Get bank transaction by ID
   */
  router.get("/transactions/:id", (req: AuthenticatedRequest, res: Response) => {
    bankJournalController.getBankTransaction(req, res);
  });
  
  /**
   * Create bank deposit transaction
   * Requires accountant or admin role
   */
  router.post(
    "/transactions/deposits", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      bankJournalController.createDeposit(req, res);
    }
  );
  
  /**
   * Create bank payment transaction
   * Requires accountant or admin role
   */
  router.post(
    "/transactions/payments", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      bankJournalController.createPayment(req, res);
    }
  );
  
  /**
   * Create bank transfer between own accounts
   * Requires accountant or admin role
   */
  router.post(
    "/transactions/transfers", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      bankJournalController.createBankTransfer(req, res);
    }
  );
  
  /**
   * Bank account statement import
   * Requires accountant or admin role
   */
  router.post(
    "/statements/import/:bankAccountId", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      bankJournalController.importBankStatement(req, res);
    }
  );
  
  /**
   * Bank reconciliation
   * Requires accountant or admin role
   */
  router.post(
    "/reconciliations/:bankAccountId", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      bankJournalController.createReconciliation(req, res);
    }
  );
  
  /**
   * Get bank account balance as of specific date
   */
  router.get("/accounts/:id/balance", (req: AuthenticatedRequest, res: Response) => {
    bankJournalController.getBankAccountBalance(req, res);
  });
  
  /**
   * Get bank account statement for a period
   */
  router.get("/accounts/:id/statement", (req: AuthenticatedRequest, res: Response) => {
    bankJournalController.generateBankStatement(req, res);
  });
  
  /**
   * Create a bank transaction entry (ledger entry)
   * Requires accountant or admin role
   */
  router.post(
    "/transactions/entry", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      bankJournalController.createBankTransactionEntry(req, res);
    }
  );
  
  return router;
}