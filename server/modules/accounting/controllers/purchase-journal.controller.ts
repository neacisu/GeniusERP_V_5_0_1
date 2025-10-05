import { Request, Response } from 'express';
import { PurchaseJournalService } from '../services/purchase-journal.service';
import { PurchaseJournalExportService } from '../services/purchase-journal-export.service';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';

/**
 * PurchaseJournalController
 * 
 * Handles all purchase journal operations including supplier invoices,
 * payments, and reporting for the romanian accounting system
 */
export class PurchaseJournalController extends BaseController {
  private exportService: PurchaseJournalExportService;
  
  /**
   * Constructor
   */
  constructor(private purchaseJournalService: PurchaseJournalService) {
    super();
    this.exportService = new PurchaseJournalExportService();
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
    console.log('=== CONTROLLER START ===');
    console.log('req.user:', req.user);
    console.log('req.body keys:', Object.keys(req.body));

    await this.handleRequest(req, res, async () => {
      console.log('Inside handleRequest');
      const companyId = this.getCompanyId(req);
      console.log('companyId from getCompanyId:', companyId, 'type:', typeof companyId);

      const userId = this.getUserId(req);
      console.log('userId from getUserId:', userId, 'type:', typeof userId);

      const {
        invoiceData,
        supplier,
        items,
        taxRates,
        paymentTerms,
        notes
      } = req.body;

      console.log('invoiceData from req.body:', invoiceData);
      console.log('invoiceData.companyId:', invoiceData.companyId, 'type:', typeof invoiceData.companyId);

      // Add company and user information
      invoiceData.companyId = companyId;
      invoiceData.userId = userId;

      console.log('After assignment - invoiceData.companyId:', invoiceData.companyId, 'type:', typeof invoiceData.companyId);
      
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
      
      if (!startDate) {
        throw { statusCode: 400, message: 'startDate is required' };
      }

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
  
  /**
   * Complete missing supplier details for existing purchase invoices
   * Requires admin role for data correction operations
   */
  async completeMissingSupplierDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);

      const completedCount = await this.purchaseJournalService.completeMissingSupplierDetails(companyId);

      return {
        success: true,
        message: `Completed supplier details for ${completedCount} purchase invoices`,
        completedCount
      };
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
  
  async exportPurchaseJournalExcel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = this.getCompanyId(req);
      const periodStart = this.parseDate(req.query.periodStart as string);
      const periodEnd = this.parseDate(req.query.periodEnd as string);
      
      if (!periodStart || !periodEnd) {
        res.status(400).json({ error: 'periodStart and periodEnd required' });
        return;
      }
      
      const report = await this.purchaseJournalService.generatePurchaseJournal({
        companyId, periodStart, periodEnd
      });
      
      const excelBuffer = await this.exportService.exportToExcel(report);
      const filename = `Jurnal_Cumparari_${report.periodLabel.replace(/\s/g, '_')}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export' });
    }
  }
  
  async exportPurchaseJournalPDF(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = this.getCompanyId(req);
      const periodStart = this.parseDate(req.query.periodStart as string);
      const periodEnd = this.parseDate(req.query.periodEnd as string);
      
      if (!periodStart || !periodEnd) {
        res.status(400).json({ error: 'periodStart and periodEnd required' });
        return;
      }
      
      const report = await this.purchaseJournalService.generatePurchaseJournal({
        companyId, periodStart, periodEnd
      });
      
      const pdfBuffer = await this.exportService.exportToPDF(report);
      const filename = `Jurnal_Cumparari_${report.periodLabel.replace(/\s/g, '_')}.html`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export' });
    }
  }
}