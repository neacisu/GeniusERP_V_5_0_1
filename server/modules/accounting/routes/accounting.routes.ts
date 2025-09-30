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
import { setupNoteContabilRoutes } from "./note-contabil.routes";
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
  
  // Mount specialized journal routes
  router.use("/sales-journal", setupSalesJournalRoutes());
  router.use("/purchase-journal", setupPurchaseJournalRoutes());
  router.use("/bank-journal", setupBankJournalRoutes());
  router.use("/cash-register", setupCashRegisterRoutes());
  router.use("/ledger", setupLedgerRoutes());
  router.use("/note-contabil", setupNoteContabilRoutes());
  
  // Chart of Accounts - Account Classes
  router.get("/account-classes", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getAccountClasses(req, res);
  });
  
  // Chart of Accounts - Account Groups
  router.get("/account-groups", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getAccountGroups(req, res);
  });
  
  router.get("/account-groups/by-class/:classId", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getAccountGroupsByClass(req, res);
  });
  
  // Chart of Accounts - Synthetic Accounts
  router.get("/synthetic-accounts", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getSyntheticAccounts(req, res);
  });
  
  router.get("/synthetic-accounts/by-group/:groupId", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getSyntheticAccountsByGroup(req, res);
  });
  
  router.get("/synthetic-accounts/by-grade/:grade", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getSyntheticAccountsByGrade(req, res);
  });
  
  // Chart of Accounts - Analytic Accounts
  router.get("/analytic-accounts", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getAnalyticAccounts(req, res);
  });
  
  router.get("/analytic-accounts/by-synthetic/:syntheticId", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getAnalyticAccountsBySynthetic(req, res);
  });
  
  // Create Analytic Account
  router.post("/analytic-accounts", (req: AuthenticatedRequest, res: Response) => {
    accountingController.createAnalyticAccount(req, res);
  });
  
  // General Journal Entries
  router.get("/journal-entries", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getJournalEntries(req, res);
  });
  
  router.get("/journal-entries/:id", (req: AuthenticatedRequest, res: Response) => {
    accountingController.getJournalEntry(req, res);
  });
  
  // Create General Journal Entry - requires accountant role or admin
  router.post(
    "/journal-entries", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      accountingController.createJournalEntry(req, res);
    }
  );
  
  // Financial reports
  router.get(
    "/trial-balance", 
    AuthGuard.roleGuard(["accountant", "admin", "manager"]),
    AuthGuard.companyGuard('companyId'),
    (req: AuthenticatedRequest, res: Response) => {
      accountingController.getTrialBalance(req, res);
    }
  );
  
  router.get(
    "/balance-sheet", 
    AuthGuard.roleGuard(["accountant", "admin", "manager"]), 
    (req: AuthenticatedRequest, res: Response) => {
      accountingController.getBalanceSheet(req, res);
    }
  );
  
  router.get(
    "/income-statement", 
    AuthGuard.roleGuard(["accountant", "admin", "manager"]), 
    (req: AuthenticatedRequest, res: Response) => {
      accountingController.getIncomeStatement(req, res);
    }
  );
  
  return router;
}