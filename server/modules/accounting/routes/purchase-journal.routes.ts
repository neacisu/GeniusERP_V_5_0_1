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
  router.get("/invoices", (req: AuthenticatedRequest, res: Response) => {
    purchaseJournalController.getSupplierInvoices(req, res);
  });
  
  /**
   * Get supplier invoice by ID
   */
  router.get("/invoices/:id", (req: AuthenticatedRequest, res: Response) => {
    purchaseJournalController.getSupplierInvoice(req, res);
  });
  
  /**
   * Record supplier invoice
   * Requires accountant or admin role
   */
  router.post(
    "/invoices", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      purchaseJournalController.recordSupplierInvoice(req, res);
    }
  );
  
  /**
   * Update supplier invoice
   * Requires accountant or admin role
   */
  router.put(
    "/invoices/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      purchaseJournalController.updateSupplierInvoice(req, res);
    }
  );
  
  /**
   * Delete supplier invoice
   * Requires accountant or admin role
   */
  router.delete(
    "/invoices/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      purchaseJournalController.deleteSupplierInvoice(req, res);
    }
  );
  
  /**
   * Record payment for invoice
   * Requires accountant or admin role
   */
  router.post(
    "/invoices/:id/payments", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      purchaseJournalController.recordInvoicePayment(req, res);
    }
  );
  
  /**
   * Get payments for an invoice
   */
  router.get("/invoices/:id/payments", (req: AuthenticatedRequest, res: Response) => {
    purchaseJournalController.getInvoicePayments(req, res);
  });
  
  /**
   * Delete payment
   * Requires accountant or admin role
   */
  router.delete(
    "/payments/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      purchaseJournalController.deleteInvoicePayment(req, res);
    }
  );
  
  /**
   * Create purchase ledger entry
   * Requires accountant or admin role
   */
  router.post(
    "/ledger-entries", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      purchaseJournalController.createPurchaseLedgerEntry(req, res);
    }
  );
  
  /**
   * Get purchase ledger entries
   */
  router.get("/ledger-entries", (req: AuthenticatedRequest, res: Response) => {
    purchaseJournalController.getPurchaseLedgerEntries(req, res);
  });
  
  /**
   * Get purchase ledger entry by ID
   */
  router.get("/ledger-entries/:id", (req: AuthenticatedRequest, res: Response) => {
    purchaseJournalController.getPurchaseLedgerEntry(req, res);
  });
  
  /**
   * Generate supplier account statement
   */
  router.get("/suppliers/:id/statement", (req: AuthenticatedRequest, res: Response) => {
    purchaseJournalController.getSupplierAccountStatement(req, res);
  });
  
  /**
   * Get supplier balance
   */
  router.get("/suppliers/:id/balance", (req: AuthenticatedRequest, res: Response) => {
    purchaseJournalController.getSupplierBalance(req, res);
  });
  
  return router;
}