import { Router } from "express";
import { AccountingService } from "../services/accounting.service";
import { storage } from "../../../../apps/api/src/storage";
import { AuthGuard } from "../../../auth/src/guards/auth.guard";
import { JwtAuthMode } from "../../../auth/src/constants/auth-mode.enum";
import { setupSalesJournalRoutes } from "./sales-journal.routes";
import { setupPurchaseJournalRoutes } from "./purchase-journal.routes";
import { setupBankJournalRoutes } from "./bank-journal.routes";
import { setupCashRegisterRoutes } from "./cash-register.routes";
import { setupLedgerRoutes } from "./ledger.routes";
// Note Contabil routes moved to routes/index.ts (note-contabil.route.ts)
import { AccountingController } from "../controllers/accounting.controller";
import { MetricsController } from "../controllers/metrics.controller";
import { AuthenticatedRequest } from "@common/middleware/auth-types";
import { Response } from "express";
import { accountingReadRateLimiter, accountingHeavyRateLimiter } from '../../../../apps/api/src/middlewares/rate-limit.middleware';
import { accountingQueueService } from "../services/accounting-queue.service";

/**
 * Setup all accounting routes including specialized journal routes
 */
export function setupAccountingRoutes() {
  const router = Router();
  const accountingService = new AccountingService(storage);
  const accountingController = new AccountingController(accountingService);
  const metricsController = new MetricsController();
  
  // Apply authentication middleware to all accounting routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  // Dashboard Metrics Endpoints
  router.get("/metrics", accountingReadRateLimiter, async (req, res) => {
    await metricsController.getAccountingMetrics(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/recent-transactions", accountingReadRateLimiter, async (req, res) => {
    await metricsController.getRecentTransactions(req as AuthenticatedRequest, res as Response);
  });
  
  // Chart of Accounts - Account Classes
  router.get("/account-classes", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getAccountClasses(req as AuthenticatedRequest, res as Response);
  });
  
  // Chart of Accounts - Account Groups
  router.get("/account-groups", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getAccountGroups(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/account-groups/by-class/:classId", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getAccountGroupsByClass(req as AuthenticatedRequest, res as Response);
  });
  
  // Chart of Accounts - Synthetic Accounts
  router.get("/synthetic-accounts", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getSyntheticAccounts(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/synthetic-accounts/by-group/:groupId", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getSyntheticAccountsByGroup(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/synthetic-accounts/by-grade/:grade", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getSyntheticAccountsByGrade(req as AuthenticatedRequest, res as Response);
  });
  
  // Chart of Accounts - Analytic Accounts
  router.get("/analytic-accounts", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getAnalyticAccounts(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/analytic-accounts/by-synthetic/:syntheticId", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getAnalyticAccountsBySynthetic(req as AuthenticatedRequest, res as Response);
  });
  
  // Create Analytic Account
  router.post("/analytic-accounts", accountingHeavyRateLimiter, async (req, res) => {
    await accountingController.createAnalyticAccount(req as AuthenticatedRequest, res as Response);
  });
  
  // General Journal Entries
  router.get("/journal-entries", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getJournalEntries(req as AuthenticatedRequest, res as Response);
  });
  
  router.get("/journal-entries/:id", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getJournalEntry(req as AuthenticatedRequest, res as Response);
  });
  
  // Create General Journal Entry - requires accountant role or admin
  router.post(
    "/journal-entries", 
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    async (req, res) => {
      await accountingController.createJournalEntry(req as AuthenticatedRequest, res as Response);
    }
  );
  // Financial reports ASYNC endpoints (via BullMQ)
  router.get(
    "/trial-balance/async",
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin", "manager"]),
    async (req, res) => {
      try {
        const { companyId, startDate, endDate } = req.query;
        const userId = (req as any).user?.id;
        
        if (!companyId || !startDate || !endDate) {
          return res.status(400).json({ error: 'Missing required parameters: companyId, startDate, endDate' });
        }
        
        const job = await accountingQueueService.queueGenerateTrialBalance({
          companyId: companyId as string,
          startDate: startDate as string,
          endDate: endDate as string,
          userId
        });
        
        return res.status(202).json({
          success: true,
          jobId: job.id,
          message: 'Trial balance generation queued',
          statusUrl: `/api/accounting/jobs/${job.id}/status`
        });
      } catch (error: any) {
        console.error('Error queuing trial balance:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );
  
  router.get(
    "/balance-sheet/async",
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin", "manager"]),
    async (req, res) => {
      try {
        const { companyId, date } = req.query;
        const userId = (req as any).user?.id;
        
        if (!companyId || !date) {
          return res.status(400).json({ error: 'Missing required parameters: companyId, date' });
        }
        
        const job = await accountingQueueService.queueGenerateBalanceSheet({
          companyId: companyId as string,
          date: date as string,
          userId
        });
        
        return res.status(202).json({
          success: true,
          jobId: job.id,
          message: 'Balance sheet generation queued',
          statusUrl: `/api/accounting/jobs/${job.id}/status`
        });
      } catch (error: any) {
        console.error('Error queuing balance sheet:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );
  
  router.get(
    "/income-statement/async",
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin", "manager"]),
    async (req, res) => {
      try {
        const { companyId, startDate, endDate } = req.query;
        const userId = (req as any).user?.id;
        
        if (!companyId || !startDate || !endDate) {
          return res.status(400).json({ error: 'Missing required parameters: companyId, startDate, endDate' });
        }
        
        const job = await accountingQueueService.queueGenerateIncomeStatement({
          companyId: companyId as string,
          startDate: startDate as string,
          endDate: endDate as string,
          userId
        });
        
        return res.status(202).json({
          success: true,
          jobId: job.id,
          message: 'Income statement generation queued',
          statusUrl: `/api/accounting/jobs/${job.id}/status`
        });
      } catch (error: any) {
        console.error('Error queuing income statement:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
  );

  // Suppliers routes
  router.get("/suppliers", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getSuppliers(req as AuthenticatedRequest, res as Response);
  });

  router.get("/suppliers/:id", accountingReadRateLimiter, async (req, res) => {
    await accountingController.getSupplier(req as AuthenticatedRequest, res as Response);
  });

  return router;
}