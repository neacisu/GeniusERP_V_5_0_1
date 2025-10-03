import { Router } from "express";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { purchaseJournalService } from "..";
import { PurchaseJournalController } from "../controllers/purchase-journal.controller";
import { AuthenticatedRequest } from "../../../common/middleware/auth-types";
import { Response } from "express";

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
  router.get("/invoices", (req, res) => {
    purchaseJournalController.getSupplierInvoices(req as AuthenticatedRequest, res);
  });
  
  /**
   * Get supplier invoice by ID
   */
  router.get("/invoices/:id", (req, res) => {
    purchaseJournalController.getSupplierInvoice(req as AuthenticatedRequest, res);
  });
  
  /**
   * Record supplier invoice
   * Requires accountant or admin role
   */
  router.post(
    "/invoices", 
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
  
  router.get("/journal", (req, res) => {
    purchaseJournalController.generatePurchaseJournal(req as AuthenticatedRequest, res);
  });
  
  router.get("/journal/export/excel", (req, res) => {
    purchaseJournalController.exportPurchaseJournalExcel(req as AuthenticatedRequest, res);
  });
  
  router.get("/journal/export/pdf", (req, res) => {
    purchaseJournalController.exportPurchaseJournalPDF(req as AuthenticatedRequest, res);
  });
  
  return router;
}