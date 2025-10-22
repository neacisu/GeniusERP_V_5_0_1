import { Router } from "express";
import { BankJournalService } from "../services";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { bankJournalService } from "..";
import { BankJournalController } from "../controllers/bank-journal.controller";
import { AuthenticatedRequest } from "../../../common/middleware/auth-types";
import { Response } from "express";
import { 
  accountingReadRateLimiter,
  accountingHeavyRateLimiter,
  reconciliationRateLimiter
} from "../../../middlewares/rate-limit.middleware";

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
  router.get("/bank-accounts", accountingReadRateLimiter, (req, res) => {
    bankJournalController.getBankAccounts(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get bank account by ID
   */
  router.get("/bank-accounts/:id", accountingReadRateLimiter, (req, res) => {
    bankJournalController.getBankAccount(req as AuthenticatedRequest, res);
  });
  
  /**
   * Create new bank account
   * Requires accountant or admin role
   */
  router.post(
    "/bank-accounts", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      bankJournalController.createBankAccount(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Update bank account
   * Requires accountant or admin role
   */
  router.put(
    "/bank-accounts/:id", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      bankJournalController.updateBankAccount(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get bank transactions with pagination and filtering
   */
  router.get("/bank-transactions", (req, res) => {
    bankJournalController.getBankTransactions(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get bank transaction by ID
   */
  router.get("/bank-transactions/:id", (req, res) => {
    bankJournalController.getBankTransaction(req as AuthenticatedRequest, res);
  });
  
  /**
   * Create bank deposit transaction
   * Requires accountant or admin role
   */
  router.post(
    "/bank-transactions/deposits", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      bankJournalController.createDeposit(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Create bank payment transaction
   * Requires accountant or admin role
   */
  router.post(
    "/bank-transactions/payments", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      bankJournalController.createPayment(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Create bank transfer between own accounts
   * Requires accountant or admin role
   */
  router.post(
    "/bank-transactions/transfers", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      bankJournalController.createBankTransfer(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Bank account statement import
   * Requires accountant or admin role
   */
  router.post(
    "/bank-statements/import/:bankAccountId", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      bankJournalController.importBankStatement(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Bank reconciliation
   * Requires accountant or admin role
   */
  router.post(
    "/bank-reconciliations/:bankAccountId", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      bankJournalController.createReconciliation(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get bank account balance as of specific date
   */
  router.get("/bank-accounts/:id/balance", accountingReadRateLimiter, (req, res) => {
    bankJournalController.getBankAccountBalance(req as AuthenticatedRequest, res);
  });
  
  /**
   * ASYNC OPERATIONS
   */
  
  /**
   * Get bank statement with caching (ASYNC)
   */
  router.get("/bank-accounts/:id/statement/cached", accountingReadRateLimiter, (req, res) => {
    bankJournalController.getBankStatementCached(req as AuthenticatedRequest, res);
  });
  
  /**
   * Queue bank reconciliation (ASYNC)
   * Requires accountant or admin role
   */
  router.post(
    "/bank-reconciliations/:bankAccountId/async", 
    reconciliationRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      bankJournalController.reconcileBankAccountAsync(req as AuthenticatedRequest, res);
    }
  );
  
  return router;
}