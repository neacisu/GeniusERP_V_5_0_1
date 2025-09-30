import { Router } from "express";
import { PurchaseJournalService } from "../services";
import { authGuard, roleGuard } from "../../auth/middleware/auth.middleware";
import { purchaseJournalService } from "..";

/**
 * Setup routes for the Romanian Purchase Journal
 * Routes for managing purchase invoices and debit notes
 */
export function setupPurchaseJournalRoutes() {
  const router = Router();
  
  // Apply authentication middleware to all purchase journal routes
  router.use(authGuard);
  
  /**
   * Get all purchase journal entries with pagination
   */
  router.get("/", async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const companyId = req.user.companyId;
      
      const entries = await purchaseJournalService.getPurchaseJournalEntries(companyId, page, limit);
      res.json(entries);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get purchase journal entry by ID
   */
  router.get("/:id", async (req, res, next) => {
    try {
      const entry = await purchaseJournalService.getPurchaseJournalEntry(req.params.id, req.user.companyId);
      
      if (!entry) {
        return res.status(404).json({ message: "Purchase journal entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Create purchase invoice entry in the journal
   * Requires accountant or admin role
   */
  router.post("/invoices", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const { 
        invoiceData,
        supplier,
        items,
        taxRates,
        paymentTerms,
        notes
      } = req.body;
      
      // Add company and user information
      invoiceData.companyId = req.user.companyId;
      invoiceData.userId = req.user.id;
      
      const entryId = await purchaseJournalService.createPurchaseInvoice(
        invoiceData,
        supplier,
        items,
        taxRates,
        paymentTerms,
        notes
      );
      
      const entry = await purchaseJournalService.getPurchaseJournalEntry(entryId, req.user.companyId);
      res.status(201).json(entry);
    } catch (error: any) {
      // Handle validation errors
      if (error.message.includes("validation")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Create debit note (purchase return) in the journal
   * Requires accountant or admin role
   */
  router.post("/debit-notes", roleGuard(["accountant", "admin"]), async (req, res, next) => {
    try {
      const { 
        debitNoteData,
        relatedInvoiceId,
        supplier,
        items,
        taxRates,
        reason,
        notes
      } = req.body;
      
      // Add company and user information
      debitNoteData.companyId = req.user.companyId;
      debitNoteData.userId = req.user.id;
      
      const entryId = await purchaseJournalService.createDebitNote(
        debitNoteData,
        relatedInvoiceId,
        supplier,
        items,
        taxRates,
        reason,
        notes
      );
      
      const entry = await purchaseJournalService.getPurchaseJournalEntry(entryId, req.user.companyId);
      res.status(201).json(entry);
    } catch (error: any) {
      // Handle validation errors
      if (error.message.includes("validation") || error.message.includes("not found")) {
        return res.status(400).json({ message: error.message });
      }
      
      next(error);
    }
  });
  
  /**
   * Get report of all purchases by period
   */
  router.get("/reports/by-period", async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const fiscalYear = parseInt(req.query.fiscalYear as string) || new Date().getFullYear();
      const fiscalMonth = req.query.fiscalMonth ? parseInt(req.query.fiscalMonth as string) : undefined;
      
      const report = await purchaseJournalService.generatePurchaseReport(companyId, fiscalYear, fiscalMonth);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get supplier purchases report
   */
  router.get("/reports/by-supplier/:supplierId", async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const supplierId = req.params.supplierId;
      const fiscalYear = parseInt(req.query.fiscalYear as string) || new Date().getFullYear();
      
      const report = await purchaseJournalService.generateSupplierPurchaseReport(companyId, supplierId, fiscalYear);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get Tax Report (D300 form preparation data)
   */
  router.get("/reports/tax", async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const fiscalYear = parseInt(req.query.fiscalYear as string) || new Date().getFullYear();
      const fiscalMonth = parseInt(req.query.fiscalMonth as string) || new Date().getMonth() + 1;
      
      const report = await purchaseJournalService.generateTaxReport(companyId, fiscalYear, fiscalMonth);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}