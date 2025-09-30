import { Router } from "express";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { JwtAuthMode } from "../../auth/constants/auth-mode.enum";
import { salesJournalService } from "..";
import { SalesJournalController } from "../controllers/sales-journal.controller";
import { AuthenticatedRequest } from "../../../common/middleware/auth-types";
import { Response } from "express";

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
  router.get("/invoices", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getCustomerInvoices(req, res);
  });
  
  /**
   * Get invoice by ID
   */
  router.get("/invoices/:id", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getCustomerInvoice(req, res);
  });
  
  /**
   * Create customer invoice
   * Requires accountant or admin role
   */
  router.post(
    "/invoices", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      salesJournalController.createCustomerInvoice(req, res);
    }
  );
  
  /**
   * Update customer invoice
   * Requires accountant or admin role
   */
  router.put(
    "/invoices/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      salesJournalController.updateCustomerInvoice(req, res);
    }
  );
  
  /**
   * Delete customer invoice
   * Requires accountant or admin role
   */
  router.delete(
    "/invoices/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      salesJournalController.deleteCustomerInvoice(req, res);
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
      salesJournalController.recordInvoicePayment(req, res);
    }
  );
  
  /**
   * Get payments for an invoice
   */
  router.get("/invoices/:id/payments", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getInvoicePayments(req, res);
  });
  
  /**
   * Delete payment
   * Requires accountant or admin role
   */
  router.delete(
    "/payments/:id", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      salesJournalController.deleteInvoicePayment(req, res);
    }
  );
  
  /**
   * Create sales receipt (cash sale)
   * Requires accountant or admin role
   */
  router.post(
    "/receipts", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      salesJournalController.createSalesReceipt(req, res);
    }
  );
  
  /**
   * Get all sales receipts
   */
  router.get("/receipts", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getSalesReceipts(req, res);
  });
  
  /**
   * Get sales receipt by ID
   */
  router.get("/receipts/:id", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getSalesReceipt(req, res);
  });
  
  /**
   * Create sales ledger entry
   * Requires accountant or admin role
   */
  router.post(
    "/ledger-entries", 
    AuthGuard.roleGuard(["accountant", "admin"]), 
    (req: AuthenticatedRequest, res: Response) => {
      salesJournalController.createSalesLedgerEntry(req, res);
    }
  );
  
  /**
   * Get sales ledger entries
   */
  router.get("/ledger-entries", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getSalesLedgerEntries(req, res);
  });
  
  /**
   * Get sales ledger entry by ID
   */
  router.get("/ledger-entries/:id", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getSalesLedgerEntry(req, res);
  });
  
  /**
   * Generate customer account statement
   */
  router.get("/customers/:id/statement", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getCustomerAccountStatement(req, res);
  });
  
  /**
   * Get customer balance
   */
  router.get("/customers/:id/balance", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getCustomerBalance(req, res);
  });
  
  /**
   * Generate sales report by period
   */
  router.get("/reports/sales-by-period", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getSalesByPeriodReport(req, res);
  });
  
  /**
   * Generate sales report by product
   */
  router.get("/reports/sales-by-product", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getSalesByProductReport(req, res);
  });
  
  /**
   * Generate sales report by customer
   */
  router.get("/reports/sales-by-customer", (req: AuthenticatedRequest, res: Response) => {
    salesJournalController.getSalesByCustomerReport(req, res);
  });
  
  return router;
}