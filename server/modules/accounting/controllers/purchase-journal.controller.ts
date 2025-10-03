import { Request, Response } from 'express';
import { PurchaseJournalService } from '../services/purchase-journal.service';
import { SalesJournalExportService } from '../services/sales-journal-export.service';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';

/**
 * PurchaseJournalController
 * 
 * Handles all purchase journal operations including supplier invoices,
 * payments, and reporting for the romanian accounting system
 */
export class PurchaseJournalController extends BaseController {
  /**
   * Constructor
   */
  constructor(private purchaseJournalService: PurchaseJournalService) {
    super();
  }
  
  /**
   * Get all supplier invoices with pagination and filtering
   */
  async getSupplierInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const { page, limit } = this.getPaginationParams(req);
      
      // Parse filter parameters
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string);
      const supplierId = req.query.supplierId as string;
      const status = req.query.status as string;
      
      return await this.purchaseJournalService.getSupplierInvoices(
        companyId,
        page,
        limit,
        startDate,
        endDate,
        supplierId,
        status
      );
    });
  }
  
  /**
   * Get supplier invoice by ID
   */
  async getSupplierInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const invoiceId = req.params.id;
      
      const invoice = await this.purchaseJournalService.getSupplierInvoice(invoiceId, companyId);
      
      if (!invoice) {
        throw { statusCode: 404, message: 'Supplier invoice not found' };
      }
      
      return invoice;
    });
  }
  
  /**
   * Record supplier invoice
   */
  async recordSupplierInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const { 
        invoiceData,
        supplier,
        items,
        taxRates,
        paymentTerms,
        notes
      } = req.body;
      
      // Add company and user information
      invoiceData.companyId = companyId;
      invoiceData.userId = userId;
      
      const invoiceId = await this.purchaseJournalService.recordSupplierInvoice(
        invoiceData,
        supplier,
        items,
        taxRates,
        paymentTerms,
        notes
      );
      
      return await this.purchaseJournalService.getSupplierInvoice(invoiceId, companyId);
    });
  }
  
  /**
   * Update supplier invoice
   */
  async updateSupplierInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const invoiceId = req.params.id;
      
      // Verify that the invoice exists and belongs to the company
      const existingInvoice = await this.purchaseJournalService.getSupplierInvoice(invoiceId, companyId);
      if (!existingInvoice) {
        throw { statusCode: 404, message: 'Supplier invoice not found' };
      }
      
      // Update the invoice
      const { 
        invoiceData,
        supplier,
        items,
        taxRates,
        paymentTerms,
        notes
      } = req.body;
      
      // Add company and ID information
      invoiceData.companyId = companyId;
      invoiceData.id = invoiceId;
      
      await this.purchaseJournalService.updateSupplierInvoice(
        invoiceData,
        supplier,
        items,
        taxRates,
        paymentTerms,
        notes
      );
      
      return await this.purchaseJournalService.getSupplierInvoice(invoiceId, companyId);
    });
  }
  
  /**
   * Delete supplier invoice
   */
  async deleteSupplierInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const invoiceId = req.params.id;
      
      // Verify that the invoice exists and belongs to the company
      const existingInvoice = await this.purchaseJournalService.getSupplierInvoice(invoiceId, companyId);
      if (!existingInvoice) {
        throw { statusCode: 404, message: 'Supplier invoice not found' };
      }
      
      // Delete the invoice
      await this.purchaseJournalService.deleteSupplierInvoice(invoiceId, companyId);
      
      return { success: true, message: 'Supplier invoice deleted successfully' };
    });
  }
  
  /**
   * Record payment for invoice
   */
  async recordInvoicePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const invoiceId = req.params.id;
      
      // Verify that the invoice exists and belongs to the company
      const existingInvoice = await this.purchaseJournalService.getSupplierInvoice(invoiceId, companyId);
      if (!existingInvoice) {
        throw { statusCode: 404, message: 'Supplier invoice not found' };
      }
      
      const { paymentData } = req.body;
      
      // Add company and user information
      paymentData.companyId = companyId;
      paymentData.userId = userId;
      paymentData.invoiceId = invoiceId;
      
      const paymentId = await this.purchaseJournalService.recordInvoicePayment(paymentData);
      const payment = await this.purchaseJournalService.getInvoicePayment(paymentId, companyId);
      
      if (!payment) {
        throw { 
          statusCode: 500, 
          message: 'Payment was recorded but could not be retrieved' 
        };
      }
      
      return payment;
    });
  }
  
  /**
   * Get payments for an invoice
   */
  async getInvoicePayments(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const invoiceId = req.params.id;
      
      // Verify that the invoice exists and belongs to the company
      const existingInvoice = await this.purchaseJournalService.getSupplierInvoice(invoiceId, companyId);
      if (!existingInvoice) {
        throw { statusCode: 404, message: 'Supplier invoice not found' };
      }
      
      return await this.purchaseJournalService.getInvoicePayments(invoiceId, companyId);
    });
  }
  
  /**
   * Delete payment
   */
  async deleteInvoicePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const paymentId = req.params.id;
      
      // Verify that the payment exists and belongs to the company
      const existingPayment = await this.purchaseJournalService.getInvoicePayment(paymentId, companyId);
      if (!existingPayment) {
        throw { statusCode: 404, message: 'Payment not found' };
      }
      
      // Delete the payment
      await this.purchaseJournalService.deleteInvoicePayment(paymentId, companyId);
      
      return { success: true, message: 'Payment deleted successfully' };
    });
  }
  
  /**
   * Create purchase ledger entry
   */
  async createPurchaseLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const ledgerEntryData = { ...req.body, companyId, userId };
      
      const entryId = await this.purchaseJournalService.createPurchaseLedgerEntry(ledgerEntryData);
      const entry = await this.purchaseJournalService.getPurchaseLedgerEntry(entryId, companyId);
      
      if (!entry) {
        throw { 
          statusCode: 500, 
          message: 'Ledger entry was created but could not be retrieved' 
        };
      }
      
      return entry;
    });
  }
  
  /**
   * Get purchase ledger entries
   */
  async getPurchaseLedgerEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const { page, limit } = this.getPaginationParams(req);
      
      // Parse filter parameters
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string);
      
      return await this.purchaseJournalService.getPurchaseLedgerEntries(
        companyId,
        page,
        limit,
        startDate,
        endDate
      );
    });
  }
  
  /**
   * Get purchase ledger entry by ID
   */
  async getPurchaseLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const entryId = req.params.id;
      
      const entry = await this.purchaseJournalService.getPurchaseLedgerEntry(entryId, companyId);
      
      if (!entry) {
        throw { statusCode: 404, message: 'Purchase ledger entry not found' };
      }
      
      return entry;
    });
  }
  
  /**
   * Generate supplier account statement
   */
  async getSupplierAccountStatement(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const supplierId = req.params.id;
      
      // Parse date parameters
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string) || new Date();
      
      return await this.purchaseJournalService.generateSupplierAccountStatement(
        companyId,
        supplierId,
        startDate,
        endDate
      );
    });
  }
  
  /**
   * Get supplier balance
   */
  async getSupplierBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const supplierId = req.params.id;
      
      // Parse date parameter
      const asOfDate = this.parseDate(req.query.asOfDate as string) || new Date();
      
      return await this.purchaseJournalService.getSupplierBalanceAsOf(
        companyId,
        supplierId,
        asOfDate
      );
    });
  }
  
  async generatePurchaseJournal(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const periodStart = this.parseDate(req.query.periodStart as string);
      const periodEnd = this.parseDate(req.query.periodEnd as string);
      
      if (!periodStart || !periodEnd) {
        throw { statusCode: 400, message: 'periodStart and periodEnd required' };
      }
      
      return await this.purchaseJournalService.generatePurchaseJournal({
        companyId, periodStart, periodEnd
      });
    });
  }
}