import { Router } from "express";
import { AccountingService } from "../services/accounting.service";
import { storage } from "../../../storage";
import authGuard from "../../auth/guards/auth.guard";
import { setupSalesJournalRoutes } from "./sales-journal.routes";
import { setupPurchaseJournalRoutes } from "./purchase-journal.routes";
import { setupBankJournalRoutes } from "./bank-journal.routes";
import { setupCashRegisterRoutes } from "./cash-register.routes";

/**
 * Setup all accounting routes including specialized journal routes
 */
export function setupAccountingRoutes() {
  const router = Router();
  const accountingService = new AccountingService(storage);
  
  // Apply authentication middleware to all accounting routes
  router.use(authGuard.requireAuth());
  
  // Mount specialized journal routes
  router.use("/sales-journal", setupSalesJournalRoutes());
  router.use("/purchase-journal", setupPurchaseJournalRoutes());
  router.use("/bank-journal", setupBankJournalRoutes());
  router.use("/cash-register", setupCashRegisterRoutes());
  
  // Chart of Accounts - Account Classes
  router.get("/account-classes", async (req, res, next) => {
    try {
      const accountClasses = await accountingService.getAccountClasses();
      res.json(accountClasses);
    } catch (error) {
      next(error);
    }
  });
  
  // Chart of Accounts - Account Groups
  router.get("/account-groups", async (req, res, next) => {
    try {
      const accountGroups = await accountingService.getAccountGroups();
      res.json(accountGroups);
    } catch (error) {
      next(error);
    }
  });
  
  router.get("/account-groups/by-class/:classId", async (req, res, next) => {
    try {
      const accountGroups = await accountingService.getAccountGroupsByClass(req.params.classId);
      res.json(accountGroups);
    } catch (error) {
      next(error);
    }
  });
  
  // Chart of Accounts - Synthetic Accounts
  router.get("/synthetic-accounts", async (req, res, next) => {
    try {
      const syntheticAccounts = await accountingService.getSyntheticAccounts();
      res.json(syntheticAccounts);
    } catch (error) {
      next(error);
    }
  });
  
  router.get("/synthetic-accounts/by-group/:groupId", async (req, res, next) => {
    try {
      const syntheticAccounts = await accountingService.getSyntheticAccountsByGroup(req.params.groupId);
      res.json(syntheticAccounts);
    } catch (error) {
      next(error);
    }
  });
  
  router.get("/synthetic-accounts/by-grade/:grade", async (req, res, next) => {
    try {
      const grade = parseInt(req.params.grade);
      const syntheticAccounts = await accountingService.getSyntheticAccountsByGrade(grade);
      res.json(syntheticAccounts);
    } catch (error) {
      next(error);
    }
  });
  
  // Chart of Accounts - Analytic Accounts
  router.get("/analytic-accounts", async (req, res, next) => {
    try {
      const analyticAccounts = await accountingService.getAnalyticAccounts();
      res.json(analyticAccounts);
    } catch (error) {
      next(error);
    }
  });
  
  router.get("/analytic-accounts/by-synthetic/:syntheticId", async (req, res, next) => {
    try {
      const analyticAccounts = await accountingService.getAnalyticAccountsBySynthetic(req.params.syntheticId);
      res.json(analyticAccounts);
    } catch (error) {
      next(error);
    }
  });
  
  // General Journal Entries (for transactions not covered by specialized journals)
  router.get("/journal-entries", async (req, res, next) => {
    try {
      const journalEntries = await accountingService.getJournalEntries();
      res.json(journalEntries);
    } catch (error) {
      next(error);
    }
  });
  
  router.get("/journal-entries/:id", async (req, res, next) => {
    try {
      const journalEntry = await accountingService.getJournalEntry(req.params.id);
      
      if (!journalEntry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      res.json(journalEntry);
    } catch (error) {
      next(error);
    }
  });
  
  // Create General Journal Entry - requires accountant role or admin
  router.post("/journal-entries", authGuard.requireRoles(["accountant", "admin"]), async (req, res, next) => {
    try {
      const { entry, lines } = req.body;
      
      // Add current user as creator
      entry.createdBy = req.user.id;
      
      const journalEntry = await accountingService.createJournalEntry(entry, lines);
      res.status(201).json(journalEntry);
    } catch (error: any) {
      // Handle validation errors
      if (error.message.includes("not balanced") || error.message.includes("at least two lines")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  // Get Trial Balance (Balanța de Verificare)
  router.get("/trial-balance", 
    authGuard.requireAuth(),
    authGuard.requireRoles(["accountant", "admin", "manager"]),
    authGuard.requireCompanyAccess('companyId'),
    async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const fiscalYear = parseInt(req.query.fiscalYear as string) || new Date().getFullYear();
      const fiscalMonth = parseInt(req.query.fiscalMonth as string) || new Date().getMonth() + 1;
      
      const trialBalance = await accountingService.generateTrialBalance(companyId, fiscalYear, fiscalMonth);
      res.json(trialBalance);
    } catch (error) {
      next(error);
    }
  });
  
  // Get Balance Sheet (Bilanț)
  router.get("/balance-sheet", 
    authGuard.requireAuth(),
    authGuard.requireRoles(["accountant", "admin", "manager"]), 
    async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();
      
      const balanceSheet = await accountingService.generateBalanceSheet(companyId, asOfDate);
      res.json(balanceSheet);
    } catch (error) {
      next(error);
    }
  });
  
  // Get Income Statement (Cont de Profit și Pierdere)
  router.get("/income-statement", 
    authGuard.requireAuth(),
    authGuard.requireRoles(["accountant", "admin", "manager"]), 
    async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const startDate = new Date(req.query.startDate as string);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      const incomeStatement = await accountingService.generateIncomeStatement(companyId, startDate, endDate);
      res.json(incomeStatement);
    } catch (error: any) {
      if (error.message.includes("date")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  return router;
}