import { Router } from "express";
import { SalesJournalService } from "../services";
import authGuard from "../../auth/guards/auth.guard";
import { salesJournalService } from "..";

/**
 * Setup routes for the Romanian Sales Journal
 * Routes for managing sales invoices and credit notes
 */
export function setupSalesJournalRoutes() {
  const router = Router();
  
  // Apply authentication middleware to all sales journal routes
  router.use(authGuard.requireAuth());
  
  /**
   * Get all sales journal entries with pagination support
   */
  router.get("/", async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      
      const salesJournalServiceInstance = new SalesJournalService();
      const entries = await salesJournalServiceInstance.getSalesJournalEntries(companyId, page, limit);
      res.json(entries);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get sales journal entry by ID
   */
  router.get("/:id", async (req, res, next) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      
      const salesJournalServiceInstance = new SalesJournalService();
      const entry = await salesJournalServiceInstance.getSalesJournalEntry(req.params.id, companyId);
      
      if (!entry) {
        return res.status(404).json({ message: "Sales journal entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Create sales invoice entry in the journal
   * Requires accountant or admin role
   */
  router.post("/invoices", authGuard.requireRoles(["accountant", "admin"]), async (req, res, next) => {
    try {
      const { 
        invoiceData,
        customer,
        items,
        taxRates,
        paymentTerms,
        notes
      } = req.body;
      
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      
      if (!companyId || !userId) {
        return res.status(400).json({ message: "User and company information required" });
      }
      
      // Add company and user information
      invoiceData.companyId = companyId;
      invoiceData.userId = userId;
      
      const salesJournalServiceInstance = new SalesJournalService();
      const entryId = await salesJournalServiceInstance.createSalesInvoice(
        invoiceData,
        customer,
        items,
        taxRates,
        paymentTerms,
        notes
      );
      
      const entry = await salesJournalServiceInstance.getSalesJournalEntry(entryId, companyId);
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
   * Create credit note (sales return) in the journal
   * Requires accountant or admin role
   */
  router.post("/credit-notes", authGuard.requireRoles(["accountant", "admin"]), async (req, res, next) => {
    try {
      const { 
        creditNoteData,
        relatedInvoiceId,
        customer,
        items,
        taxRates,
        reason,
        notes
      } = req.body;
      
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      
      if (!companyId || !userId) {
        return res.status(400).json({ message: "User and company information required" });
      }
      
      // Add company and user information
      creditNoteData.companyId = companyId;
      creditNoteData.userId = userId;
      
      const salesJournalServiceInstance = new SalesJournalService();
      const entryId = await salesJournalServiceInstance.createCreditNote(
        creditNoteData,
        relatedInvoiceId,
        customer,
        items,
        taxRates,
        reason,
        notes
      );
      
      const entry = await salesJournalServiceInstance.getSalesJournalEntry(entryId, companyId);
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
   * Get report of all sales by period
   */
  router.get("/reports/by-period", async (req, res, next) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      
      const fiscalYear = parseInt(req.query.fiscalYear as string) || new Date().getFullYear();
      const fiscalMonth = req.query.fiscalMonth ? parseInt(req.query.fiscalMonth as string) : undefined;
      
      const salesJournalServiceInstance = new SalesJournalService();
      const report = await salesJournalServiceInstance.generateSalesReport(companyId, fiscalYear, fiscalMonth);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * Get customer sales report
   */
  router.get("/reports/by-customer/:customerId", async (req, res, next) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }
      
      const customerId = req.params.customerId;
      const fiscalYear = parseInt(req.query.fiscalYear as string) || new Date().getFullYear();
      
      const salesJournalServiceInstance = new SalesJournalService();
      const report = await salesJournalServiceInstance.generateCustomerSalesReport(companyId, customerId, fiscalYear);
      res.json(report);
    } catch (error) {
      next(error);
    }
  });
  
  return router;
}