import { Router } from "express";
import { CashRegisterService } from "../services";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { cashRegisterService } from "..";
import { CashRegisterController } from "../controllers/cash-register.controller";
import { AuthenticatedRequest } from "../../../common/middleware/auth-types";
import { Response } from "express";

/**
 * Setup routes for the Romanian Cash Register (Registru de Casă)
 * Routes for managing cash transactions, receipts and payments
 */
export function setupCashRegisterRoutes() {
  const router = Router();
  
  // Create controller instance
  const cashRegisterController = new CashRegisterController(cashRegisterService);
  
  // Apply authentication middleware to all cash register routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  /**
   * Get all cash registers
   */
  router.get("/cash-registers", (req, res) => {
    cashRegisterController.getCashRegisters(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get cash register by ID
   */
  router.get("/cash-registers/:id", (req, res) => {
    cashRegisterController.getCashRegister(req as AuthenticatedRequest, res);
  });
  
  /**
   * Create new cash register
   * Requires accountant or admin role
   */
  router.post(
    "/cash-registers", 
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
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.transferCash(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get all cash transactions (for all registers or filtered)
   */
  router.get("/cash-transactions", (req, res) => {
    cashRegisterController.getAllCashTransactions(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get all cash transactions for a specific register
   */
  router.get("/cash-registers/:id/transactions", (req, res) => {
    cashRegisterController.getCashTransactions(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get cash register balance as of specific date
   */
  router.get("/cash-registers/:id/balance", (req, res) => {
    cashRegisterController.getCashRegisterBalance(req as AuthenticatedRequest, res);
  });
  
  /**
   * Record cash deposit from cash register to bank
   * Requires accountant or admin role
   */
  router.post(
    "/cash-registers/:id/bank-deposits", 
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
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      cashRegisterController.createReconciliation(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get cash register report
   */
  router.get("/reports/:registerId", (req, res) => {
    cashRegisterController.generateCashRegisterReport(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get daily closing report for a cash register
   */
  router.get("/registers/:id/daily-closing", (req, res) => {
    cashRegisterController.getDailyClosingReport(req as AuthenticatedRequest, res);
  });
  
  return router;
}