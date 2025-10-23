import { Router } from "express";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { purchaseJournalService } from "..";
import { PurchaseJournalController } from "../controllers/purchase-journal.controller";
import { AuthenticatedRequest } from "@common/middleware/auth-types";
import { Response } from "express";
import { 
  invoiceCreateRateLimiter,
  paymentRecordRateLimiter,
  accountingHeavyRateLimiter,
  exportRateLimiter,
  accountingReadRateLimiter
} from '../../../../apps/api/src/middlewares/rate-limit.middleware';

/**
 * Setup routes for the Romanian Purchase Journal
 * Routes for managing purchase invoices and debit notes
 */
export function setupPurchaseJournalRoutes() {
  const router = Router();
  
  // Create controller instance
  const purchaseJournalController = new PurchaseJournalController(purchaseJournalService);
  
  // Apply authentication middleware to all purchase journal routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  /**
   * Get all supplier invoices with pagination and filtering
   */
  router.get("/invoices", accountingReadRateLimiter, (req, res) => {
    purchaseJournalController.getSupplierInvoices(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get supplier invoice by ID
   */
  router.get("/invoices/:id", accountingReadRateLimiter, (req, res) => {
    purchaseJournalController.getSupplierInvoice(req as AuthenticatedRequest, res);
  });
  
  /**
   * Record supplier invoice
   * Requires accountant or admin role
   */
  router.post(
    "/invoices", 
    invoiceCreateRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      purchaseJournalController.recordSupplierInvoice(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Update supplier invoice
   * Requires accountant or admin role
   */
  router.put(
    "/invoices/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      purchaseJournalController.updateSupplierInvoice(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Delete supplier invoice
   * Requires accountant or admin role
   */
  router.delete(
    "/invoices/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      purchaseJournalController.deleteSupplierInvoice(req as AuthenticatedRequest, res);
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
      purchaseJournalController.recordInvoicePayment(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get payments for an invoice
   */
  router.get("/invoices/:id/payments", (req, res) => {
    purchaseJournalController.getInvoicePayments(req as AuthenticatedRequest, res);
  });
  
  /**
   * Delete payment
   * Requires accountant or admin role
   */
  router.delete(
    "/payments/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      purchaseJournalController.deleteInvoicePayment(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Create purchase ledger entry
   * Requires accountant or admin role
   */
  router.post(
    "/ledger-entries", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req, res) => {
      purchaseJournalController.createPurchaseLedgerEntry(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Get purchase ledger entries  
   */
  router.get("/ledger-entries", (req, res) => {
    purchaseJournalController.getPurchaseLedgerEntries(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get purchase ledger entry by ID
   */
  router.get("/ledger-entries/:id", (req, res) => {
    purchaseJournalController.getPurchaseLedgerEntry(req as AuthenticatedRequest, res);
  });
  
  /**
   * Generate supplier account statement
   */
  router.get("/suppliers/:id/statement", (req, res) => {
    purchaseJournalController.getSupplierAccountStatement(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get supplier balance
   */
  router.get("/suppliers/:id/balance", (req, res) => {
    purchaseJournalController.getSupplierBalance(req as AuthenticatedRequest, res);
  });

  /**
   * Complete missing supplier details for existing purchase invoices
   * Requires admin role
   */
  router.post(
    "/complete-supplier-details",
    AuthGuard.roleGuard(["admin"]),
    (req, res) => {
      purchaseJournalController.completeMissingSupplierDetails(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * =========================================================================
   * ASYNC OPERATIONS & BULLMQ INTEGRATION
   * =========================================================================
   */
  
  /**
   * Generate purchase journal asynchronously (via BullMQ)
   * POST /api/accounting/purchases/journal/generate-async
   */
  router.post(
    "/journal/generate-async",
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      purchaseJournalController.generatePurchaseJournalAsync(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * =========================================================================
   * BULK OPERATIONS
   * =========================================================================
   */
  
  /**
   * Bulk create supplier invoices
   * POST /api/accounting/purchases/bulk-create-invoices
   */
  router.post(
    "/bulk-create-invoices",
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      purchaseJournalController.bulkCreateSupplierInvoices(req as AuthenticatedRequest, res);
    }
  );
  
  /**
   * Bulk record supplier payments
   * POST /api/accounting/purchases/bulk-record-payments
   */
  router.post(
    "/bulk-record-payments",
    accountingHeavyRateLimiter,
    AuthGuard.roleGuard(["accountant", "admin"]),
    (req, res) => {
      purchaseJournalController.bulkRecordSupplierPayments(req as AuthenticatedRequest, res);
    }
  );

  return router;
}