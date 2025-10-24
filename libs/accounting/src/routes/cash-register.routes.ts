import { Router } from "express";
import { CashRegisterService } from "../services";
import { AuthGuard } from "@geniuserp/auth";
import { JwtAuthMode } from "@geniuserp/auth";
import { CashRegisterController } from "../controllers/cash-register.controller";
import { AuthenticatedRequest } from "@common/middleware/auth-types";
import { 
  accountingReadRateLimiter,
  accountingHeavyRateLimiter,
  reconciliationRateLimiter
} from "@api/middlewares/rate-limit.middleware";

/**
 * Setup routes for the Romanian Cash Register (Registru de Casă)
 * Routes for managing cash transactions, receipts and payments
 */
export function setupCashRegisterRoutes() {
  const router = Router();
  
  // Create service and controller instances
  const cashRegisterService = new CashRegisterService();
  const cashRegisterController = new CashRegisterController(cashRegisterService);
  
  // Apply authentication middleware to all cash register routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  /**
   * Get all cash registers
   */
  router.get("/cash-registers", accountingReadRateLimiter, (req, res) => {
    cashRegisterController.getCashRegisters(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get cash register by ID
   */
  router.get("/cash-registers/:id", accountingReadRateLimiter, (req, res) => {
    cashRegisterController.getCashRegister(req as AuthenticatedRequest, res);
  });
  
  /**
   * Create new cash register
   * Requires accountant or admin role
   */
  router.post(
    "/cash-registers",
    accountingHeavyRateLimiter, 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.createCashRegister(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Update cash register
   * Requires accountant or admin role
   */
  router.put(
    "/cash-registers/:id",
    accountingHeavyRateLimiter, 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.updateCashRegister(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Create cash receipt (Chitanță)
   * Requires accountant or admin role
   */
  router.post(
    "/receipts", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.recordCashReceipt(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Create cash payment (Dispoziție de Plată)
   * Requires accountant or admin role
   */
  router.post(
    "/payments", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.recordCashPayment(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Create cash transfer between registers
   * Requires accountant or admin role
   */
  router.post(
    "/transfers", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.transferCash(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get all cash transactions (for all registers or filtered)
   */
  router.get("/cash-transactions", accountingReadRateLimiter, (req, res) => {
    cashRegisterController.getAllCashTransactions(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get all cash transactions for a specific register
   */
  router.get("/cash-registers/:id/transactions", accountingReadRateLimiter, (req, res) => {
    cashRegisterController.getCashTransactions(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get cash register balance as of specific date
   */
  router.get("/cash-registers/:id/balance", accountingReadRateLimiter, (req, res) => {
    cashRegisterController.getCashRegisterBalance(req as AuthenticatedRequest, res);
  });
  
  /**
   * Record cash deposit from cash register to bank
   * Requires accountant or admin role
   */
  router.post(
    "/cash-registers/:id/bank-deposits", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.recordCashDepositToBank(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Record cash withdrawal from bank to cash register
   * Requires accountant or admin role
   */
  router.post(
    "/cash-registers/:id/bank-withdrawals", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.recordCashWithdrawalFromBank(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Create cash register reconciliation
   * Requires accountant or admin role
   */
  router.post(
    "/reconciliations/:registerId", 
    reconciliationRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.createReconciliation(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get daily closing report for a cash register
   */
  router.get("/registers/:id/daily-closing", accountingReadRateLimiter, (req, res) => {
    cashRegisterController.getDailyClosingReport(req as AuthenticatedRequest, res);
  });
  
  /**
   * ASYNC OPERATIONS
   */
  
  /**
   * Get daily cash report with caching (ASYNC)
   */
  router.get("/reports/daily/cached", accountingReadRateLimiter, (req, res) => {
    cashRegisterController.getDailyCashReportCached(req as AuthenticatedRequest, res);
  });
  
  /**
   * Queue cash reconciliation (ASYNC)
   * Requires accountant or admin role
   */
  router.post(
    "/reconciliations/:registerId/async", 
    reconciliationRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.reconcileCashRegisterAsync(req as AuthenticatedRequest, res);
    }
  );
  
  return router;
}