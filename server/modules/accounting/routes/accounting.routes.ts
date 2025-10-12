import { Router } from "express";
import { AccountingService } from "../services/accounting.service";
import { storage } from "../../../storage";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { setupSalesJournalRoutes } from "./sales-journal.routes";
import { setupPurchaseJournalRoutes } from "./purchase-journal.routes";
import { setupBankJournalRoutes } from "./bank-journal.routes";
import { setupCashRegisterRoutes } from "./cash-register.routes";
import { setupLedgerRoutes } from "./ledger.routes";
// Note Contabil routes moved to routes/index.ts (note-contabil.route.ts)
import { AccountingController } from "../controllers/accounting.controller";
import { AuthenticatedRequest } from "../../../common/middleware/auth-types";
import { Response } from "express";

/**
 * Setup all accounting routes including specialized journal routes
 */
export function setupAccountingRoutes() {
  const router = Router();
  const accountingService = new AccountingService(storage);
  const accountingController = new AccountingController(accountingService);
  
  // Apply authentication middleware to all accounting routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  // Chart of Accounts - Account Classes
  router.get("/account-classes", async (req, res) => {
    await accountingController.getAccountClasses(req as AuthenticatedRequest, res as Response);
  });
  
  // Chart of Accounts - Account Groups
  router.get("/account-groups", async (req, res) => {
    await accountingController.getAccountGroups(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/account-groups/by-class/:classId", async (req, res) => {
    await accountingController.getAccountGroupsByClass(req as AuthenticatedRequest, res as Response);
  });
  
  // Chart of Accounts - Synthetic Accounts
  router.get("/synthetic-accounts", async (req, res) => {
    await accountingController.getSyntheticAccounts(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/synthetic-accounts/by-group/:groupId", async (req, res) => {
    await accountingController.getSyntheticAccountsByGroup(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/synthetic-accounts/by-grade/:grade", async (req, res) => {
    await accountingController.getSyntheticAccountsByGrade(req as AuthenticatedRequest, res as Response);
  });
  
  // Chart of Accounts - Analytic Accounts
  router.get("/analytic-accounts", async (req, res) => {
    await accountingController.getAnalyticAccounts(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/analytic-accounts/by-synthetic/:syntheticId", async (req, res) => {
    await accountingController.getAnalyticAccountsBySynthetic(req as AuthenticatedRequest, res as Response);
  });
  
  // Create Analytic Account
  router.post("/analytic-accounts", async (req, res) => {
    await accountingController.createAnalyticAccount(req as AuthenticatedRequest, res as Response);
  });
  
  // General Journal Entries
  router.get("/journal-entries", async (req, res) => {
    await accountingController.getJournalEntries(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/journal-entries/:id", async (req, res) => {
    await accountingController.getJournalEntry(req as AuthenticatedRequest, res as Response);
  });
  
  // Create General Journal Entry - requires accountant role or admin
  router.post(
    "/journal-entries", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    async (req, res) => {
      await accountingController.createJournalEntry(req as AuthenticatedRequest, res as Response);
    }
  );
  
  // Financial reports
  router.get(
    "/trial-balance", 
    AuthGuard.roleGuard(["accountant", "admin", "manager"]),
    AuthGuard.companyGuard('companyId'),
    async (req, res) => {
      await accountingController.getTrialBalance(req as AuthenticatedRequest, res as Response);
    }
  );
  
  router.get(
    "/balance-sheet", 
    AuthGuard.roleGuard(["accountant", "admin", "manager"]), 
    async (req, res) => {
      await accountingController.getBalanceSheet(req as AuthenticatedRequest, res as Response);
    }
  );
  
  router.get(
    "/income-statement",
    AuthGuard.roleGuard(["accountant", "admin", "manager"]),
    async (req, res) => {
      await accountingController.getIncomeStatement(req as AuthenticatedRequest, res as Response);
    }
  );

  // Suppliers routes
  router.get("/suppliers", async (req, res) => {
    await accountingController.getSuppliers(req as AuthenticatedRequest, res as Response);
  });

  router.get("/suppliers/:id", async (req, res) => {
    await accountingController.getSupplier(req as AuthenticatedRequest, res as Response);
  });

  return router;
}