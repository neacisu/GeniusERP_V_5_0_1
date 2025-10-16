import { Router } from "express";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { salesJournalService } from "..";
import { SalesJournalController } from "../controllers/sales-journal.controller";
import { AuthenticatedRequest } from "../../../common/middleware/auth-types";
import { Response } from "express";
import { 
  invoiceCreateRateLimiter,
  paymentRecordRateLimiter,
  accountingHeavyRateLimiter,
  exportRateLimiter,
  accountingReadRateLimiter
} from "../../../middlewares/rate-limit.middleware";

/**
 * Setup routes for the Romanian Sales Journal
 * Routes for managing sales invoices and credit notes
 */
export function setupSalesJournalRoutes() {
  const router = Router();
  
  // Create controller instance
  const salesJournalController = new SalesJournalController(salesJournalService);
  
  // Apply authentication middleware to all sales journal routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  /**
   * Get all customer invoices with pagination and filtering
   */
  router.get("/invoices", (req, res) => {
    salesJournalController.getCustomerInvoices(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get invoice by ID
   */
  router.get("/invoices/:id", (req, res) => {
    salesJournalController.getCustomerInvoice(req as AuthenticatedRequest, res);
  });
  
  /**
   * Create customer invoice
   * Requires accountant or admin role
   */
  router.post(
    "/invoices", 
    invoiceCreateRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      salesJournalController.createCustomerInvoice(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Update customer invoice
   * Requires accountant or admin role
   */
  router.put(
    "/invoices/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      salesJournalController.updateCustomerInvoice(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Delete customer invoice
   * Requires accountant or admin role
   */
  router.delete(
    "/invoices/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      salesJournalController.deleteCustomerInvoice(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Record payment for invoice
   * Requires accountant or admin role
   */
  router.post(
    "/invoices/:id/payments", 
    paymentRecordRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      salesJournalController.recordInvoicePayment(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get payments for an invoice
   */
  router.get("/invoices/:id/payments", (req, res) => {
    salesJournalController.getInvoicePayments(req as AuthenticatedRequest, res);
  });
  
  /**
   * Delete payment
   * Requires accountant or admin role
   */
  router.delete(
    "/payments/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      salesJournalController.deleteInvoicePayment(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Create sales receipt (cash sale)
   * Requires accountant or admin role
   */
  router.post(
    "/receipts", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      salesJournalController.createSalesReceipt(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get all sales receipts
   */
  router.get("/receipts", (req, res) => {
    salesJournalController.getSalesReceipts(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get sales receipt by ID
   */
  router.get("/receipts/:id", (req, res) => {
    salesJournalController.getSalesReceipt(req as AuthenticatedRequest, res);
  });
  
  /**
   * Create sales ledger entry
   * Requires accountant or admin role
   */
  router.post(
    "/ledger-entries", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      salesJournalController.createSalesLedgerEntry(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get sales ledger entries
   */
  router.get("/ledger-entries", (req, res) => {
    salesJournalController.getSalesLedgerEntries(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get sales ledger entry by ID
   */
  router.get("/ledger-entries/:id", (req, res) => {
    salesJournalController.getSalesLedgerEntry(req as AuthenticatedRequest, res);
  });
  
  /**
   * Generate customer account statement
   */
  router.get("/customers/:id/statement", (req, res) => {
    salesJournalController.getCustomerAccountStatement(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get customer balance
   */
  router.get("/customers/:id/balance", (req, res) => {
    salesJournalController.getCustomerBalance(req as AuthenticatedRequest, res);
  });
  
  /**
   * Generate sales report by period
   */
  router.get("/reports/sales-by-period", (req, res) => {
    salesJournalController.getSalesByPeriodReport(req as AuthenticatedRequest, res);
  });
  
  /**
   * Generate sales report by product
   */
  router.get("/reports/sales-by-product", (req, res) => {
    salesJournalController.getSalesByProductReport(req as AuthenticatedRequest, res);
  });
  
  /**
   * Generate sales report by customer
   */
  router.get("/reports/sales-by-customer", (req, res) => {
    salesJournalController.getSalesByCustomerReport(req as AuthenticatedRequest, res);
  });
  
  /**
   * =========================================================================
   * JURNAL DE VÂNZĂRI - CONFORM OMFP 2634/2015
   * =========================================================================
   */
  
  /**
   * Generare Jurnal de Vânzări pentru o perioadă
   * Endpoint: GET /api/accounting/sales/journal
   * 
   * Query params:
   * - periodStart: Data început perioadă (YYYY-MM-DD)
   * - periodEnd: Data sfârșit perioadă (YYYY-MM-DD)
   * - reportType: 'DETAILED' sau 'SUMMARY' (opțional, default: DETAILED)
   * - includeZeroVAT: true/false (opțional, default: true)
   * - includeCanceled: true/false (opțional, default: false)
   * - customerId: Filtrare după client (opțional)
   * - category: Filtrare după categorie fiscală (opțional)
   */
  router.get("/journal", accountingReadRateLimiter, (req, res) => {
    salesJournalController.generateSalesJournal(req as AuthenticatedRequest, res);
  });
  
  /**
   * Export Jurnal de Vânzări în Excel (CSV)
   * Endpoint: GET /api/accounting/sales/journal/export/excel
   */
  router.get("/journal/export/excel", exportRateLimiter, (req, res) => {
    salesJournalController.exportSalesJournalExcel(req as AuthenticatedRequest, res);
  });
  
  /**
   * Export Jurnal de Vânzări în PDF (HTML printabil)
   * Endpoint: GET /api/accounting/sales/journal/export/pdf
   */
  router.get("/journal/export/pdf", exportRateLimiter, (req, res) => {
    salesJournalController.exportSalesJournalPDF(req as AuthenticatedRequest, res);
  });
  
  /**
   * =========================================================================
   * ASYNC OPERATIONS & BULLMQ INTEGRATION
   * =========================================================================
   */
  
  /**
   * Generate sales journal asynchronously (via BullMQ)
   * POST /api/accounting/sales/journal/generate-async
   * 
   * Body:
   * - startDate: Data început (YYYY-MM-DD)
   * - endDate: Data sfârșit (YYYY-MM-DD)
   * - reportType: 'DETAILED' sau 'SUMMARY'
   */
  router.post(
    "/journal/generate-async",
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      salesJournalController.generateSalesJournalAsync(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * =========================================================================
   * BULK OPERATIONS
   * =========================================================================
   */
  
  /**
   * Bulk create customer invoices
   * POST /api/accounting/sales/bulk-create-invoices
   * 
   * Body:
   * - invoices: Array of invoice data (max 1000)
   */
  router.post(
    "/bulk-create-invoices",
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      salesJournalController.bulkCreateInvoices(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Bulk record payments
   * POST /api/accounting/sales/bulk-record-payments
   * 
   * Body:
   * - payments: Array of payment data (max 1000)
   */
  router.post(
    "/bulk-record-payments",
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      salesJournalController.bulkRecordPayments(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * =========================================================================
   * JOB STATUS & TRACKING
   * =========================================================================
   */
  
  /**
   * Get job status
   * GET /api/accounting/jobs/:jobId
   */
  router.get("/jobs/:jobId", accountingReadRateLimiter, (req, res) => {
    salesJournalController.getJobStatus(req as AuthenticatedRequest, res);
  });
  
  /**
   * Cancel a running job
   * POST /api/accounting/jobs/:jobId/cancel
   */
  router.post(
    "/jobs/:jobId/cancel",
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      salesJournalController.cancelJob(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get queue metrics
   * GET /api/accounting/jobs/metrics
   */
  router.get(
    "/jobs/metrics",
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      salesJournalController.getQueueMetrics(req as AuthenticatedRequest, res);
    }
  );
  
  return router;
}