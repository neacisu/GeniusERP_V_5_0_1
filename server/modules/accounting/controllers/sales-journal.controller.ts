import { Response } from 'express';
import { SalesJournalService } from '../services/sales-journal.service';
import { SalesJournalExportService } from '../services/sales-journal-export.service';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';
import { trackJournalEntry } from '../../../middlewares/business-metrics.middleware';
import { bulkOperationsService } from '../services/bulk-operations.service';
import { accountingQueueService } from '../services/accounting-queue.service';

/**
 * SalesJournalController
 * 
 * Handles all sales journal operations including customer invoices,
 * receipts, payments, and reporting for the romanian accounting system
 */
export class SalesJournalController extends BaseController {
  private exportService: SalesJournalExportService;
  
  /**
   * Constructor
   */
  constructor(private salesJournalService: SalesJournalService) {
    super();
    this.exportService = new SalesJournalExportService();
  }
  
  /**
   * Get all customer invoices with pagination and filtering
   */
  async getCustomerInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const { page, limit } = this.getPaginationParams(req);
      
      // Parse filter parameters
      const startDate = this.parseDate(req.query['startDate'] as string);
      const endDate = this.parseDate(req.query['endDate'] as string);
      const customerId = req.query['customerId'] as string;
      const status = req.query['status'] as string;
      
      return await this.salesJournalService.getCustomerInvoices(
        companyId,
        page,
        limit,
        startDate,
        endDate,
        customerId,
        status
      );
    });
  }
  
  /**
   * Get invoice by ID
   */
  async getCustomerInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const invoiceId = req.params['id'];
      
      const invoice = await this.salesJournalService.getCustomerInvoice(invoiceId, companyId);
      
      if (!invoice) {
        throw { statusCode: 404, message: 'Customer invoice not found' };
      }
      
      return invoice;
    });
  }
  
  /**
   * Create customer invoice
   */
  async createCustomerInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const { 
        invoiceData,
        customer,
        items,
        taxRates,
        paymentTerms,
        notes
      } = req.body;
      
      // Add company and user information
      invoiceData.companyId = companyId;
      invoiceData.userId = userId;
      
      const invoiceId = await this.salesJournalService.createCustomerInvoice(
        invoiceData,
        customer,
        items,
        taxRates,
        paymentTerms,
        notes
      );
      
      // Track sales journal entry creation
      trackJournalEntry('sales');
      
      return await this.salesJournalService.getCustomerInvoice(invoiceId, companyId);
    });
  }
  
  /**
   * Update customer invoice
   */
  async updateCustomerInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const invoiceId = req.params['id'];
      
      // Verify that the invoice exists and belongs to the company
      const existingInvoice = await this.salesJournalService.getCustomerInvoice(invoiceId, companyId);
      if (!existingInvoice) {
        throw { statusCode: 404, message: 'Customer invoice not found' };
      }
      
      // Update the invoice
      const { 
        invoiceData,
        customer,
        items,
        taxRates,
        paymentTerms,
        notes
      } = req.body;
      
      // Add company and ID information
      invoiceData.companyId = companyId;
      invoiceData.id = invoiceId;
      
      await this.salesJournalService.updateCustomerInvoice(
        invoiceData,
        customer,
        items,
        taxRates,
        paymentTerms,
        notes
      );
      
      return await this.salesJournalService.getCustomerInvoice(invoiceId, companyId);
    });
  }
  
  /**
   * Delete customer invoice
   */
  async deleteCustomerInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const invoiceId = req.params['id'];
      
      // Verify that the invoice exists and belongs to the company
      const existingInvoice = await this.salesJournalService.getCustomerInvoice(invoiceId, companyId);
      if (!existingInvoice) {
        throw { statusCode: 404, message: 'Customer invoice not found' };
      }
      
      // Delete the invoice
      await this.salesJournalService.deleteCustomerInvoice(invoiceId, companyId);
      
      return { success: true, message: 'Customer invoice deleted successfully' };
    });
  }
  
  /**
   * Record payment for invoice
   */
  async recordInvoicePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const invoiceId = req.params['id'];
      
      // Verify that the invoice exists and belongs to the company
      const existingInvoice = await this.salesJournalService.getCustomerInvoice(invoiceId, companyId);
      if (!existingInvoice) {
        throw { statusCode: 404, message: 'Customer invoice not found' };
      }
      
      const { paymentData } = req.body;
      
      // Add company and user information
      paymentData.companyId = companyId;
      paymentData.userId = userId;
      paymentData.invoiceId = invoiceId;
      
      const paymentId = await this.salesJournalService.recordInvoicePayment(paymentData);
      const payment = await this.salesJournalService.getInvoicePayment(paymentId, companyId);
      
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
      const invoiceId = req.params['id'];
      
      // Verify that the invoice exists and belongs to the company
      const existingInvoice = await this.salesJournalService.getCustomerInvoice(invoiceId, companyId);
      if (!existingInvoice) {
        throw { statusCode: 404, message: 'Customer invoice not found' };
      }
      
      return await this.salesJournalService.getInvoicePayments(invoiceId, companyId);
    });
  }
  
  /**
   * Delete payment
   */
  async deleteInvoicePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const paymentId = req.params['id'];
      
      // Verify that the payment exists and belongs to the company
      const existingPayment = await this.salesJournalService.getInvoicePayment(paymentId, companyId);
      if (!existingPayment) {
        throw { statusCode: 404, message: 'Payment not found' };
      }
      
      // Delete the payment
      await this.salesJournalService.deleteInvoicePayment(paymentId, companyId);
      
      return { success: true, message: 'Payment deleted successfully' };
    });
  }
  
  /**
   * Create sales receipt (cash sale)
   */
  async createSalesReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const receiptData = { ...req.body, companyId, userId };
      
      const receiptId = await this.salesJournalService.createSalesReceipt(receiptData);
      const receipt = await this.salesJournalService.getSalesReceipt(receiptId, companyId);
      
      if (!receipt) {
        throw { 
          statusCode: 500, 
          message: 'Sales receipt was created but could not be retrieved' 
        };
      }
      
      return receipt;
    });
  }
  
  /**
   * Get all sales receipts
   */
  async getSalesReceipts(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const { page, limit } = this.getPaginationParams(req);
      
      // Parse filter parameters
      const startDate = this.parseDate(req.query['startDate'] as string);
      const endDate = this.parseDate(req.query['endDate'] as string);
      const customerId = req.query['customerId'] as string;
      
      return await this.salesJournalService.getSalesReceipts(
        companyId,
        page,
        limit,
        startDate,
        endDate,
        customerId
      );
    });
  }
  
  /**
   * Get sales receipt by ID
   */
  async getSalesReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const receiptId = req.params['id'];
      
      const receipt = await this.salesJournalService.getSalesReceipt(receiptId, companyId);
      
      if (!receipt) {
        throw { statusCode: 404, message: 'Sales receipt not found' };
      }
      
      return receipt;
    });
  }
  
  /**
   * Create sales ledger entry
   */
  async createSalesLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const ledgerEntryData = { ...req.body, companyId, userId };
      
      const entryId = await this.salesJournalService.createSalesLedgerEntry(ledgerEntryData);
      const entry = await this.salesJournalService.getSalesLedgerEntry(entryId, companyId);
      
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
   * Get sales ledger entries
   */
  async getSalesLedgerEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const { page, limit } = this.getPaginationParams(req);
      
      // Parse filter parameters
      const startDate = this.parseDate(req.query['startDate'] as string);
      const endDate = this.parseDate(req.query['endDate'] as string);
      
      return await this.salesJournalService.getSalesLedgerEntries(
        companyId,
        page,
        limit,
        startDate,
        endDate
      );
    });
  }
  
  /**
   * Get sales ledger entry by ID
   */
  async getSalesLedgerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const entryId = req.params['id'];
      
      const entry = await this.salesJournalService.getSalesLedgerEntry(entryId, companyId);
      
      if (!entry) {
        throw { statusCode: 404, message: 'Sales ledger entry not found' };
      }
      
      return entry;
    });
  }
  
  /**
   * Generate customer account statement
   */
  async getCustomerAccountStatement(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const customerId = req.params['id'];
      
      // Parse date parameters
      const startDate = this.parseDate(req.query['startDate'] as string);
      const endDate = this.parseDate(req.query['endDate'] as string) || new Date();
      
      return await this.salesJournalService.generateCustomerAccountStatement(
        companyId,
        customerId,
        startDate,
        endDate
      );
    });
  }
  
  /**
   * Get customer balance
   */
  async getCustomerBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const customerId = req.params['id'];
      
      // Parse date parameter
      const asOfDate = this.parseDate(req.query['asOfDate'] as string) || new Date();
      
      return await this.salesJournalService.getCustomerBalanceAsOf(
        companyId,
        customerId,
        asOfDate
      );
    });
  }
  
  /**
   * Generate sales report by period
   */
  async getSalesByPeriodReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      // Parse date parameters
      const startDate = this.parseDate(req.query['startDate'] as string);
      const endDate = this.parseDate(req.query['endDate'] as string) || new Date();
      const groupBy = req.query['groupBy'] as string || 'month'; // day, week, month, quarter, year
      
      return await this.salesJournalService.generateSalesByPeriodReport(
        companyId,
        startDate,
        endDate,
        groupBy
      );
    });
  }
  
  /**
   * Generate sales report by product
   */
  async getSalesByProductReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      // Parse date parameters
      const startDate = this.parseDate(req.query['startDate'] as string);
      const endDate = this.parseDate(req.query['endDate'] as string) || new Date();
      
      return await this.salesJournalService.generateSalesByProductReport(
        companyId,
        startDate,
        endDate
      );
    });
  }
  
  /**
   * Generate sales report by customer
   */
  async getSalesByCustomerReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      // Parse date parameters
      const startDate = this.parseDate(req.query['startDate'] as string);
      // endDate is parsed but not used by generateCustomerSalesReport (only year is used)
      
      return await this.salesJournalService.generateCustomerSalesReport(
        companyId,
        req.params['id'], // customerId
        startDate?.getFullYear() || new Date().getFullYear()
      );
    });
  }
  
  /**
   * =========================================================================
   * JURNAL DE VÂNZĂRI - CONFORM OMFP 2634/2015
   * =========================================================================
   */
  
  /**
   * Generare Jurnal de Vânzări pentru o perioadă
   * Endpoint: GET /api/accounting/sales/journal
   */
  async generateSalesJournal(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      
      // Parse parametri
      const periodStart = this.parseDate(req.query['periodStart'] as string);
      const periodEnd = this.parseDate(req.query['periodEnd'] as string);
      
      if (!periodStart || !periodEnd) {
        throw { 
          statusCode: 400, 
          message: 'periodStart and periodEnd are required' 
        };
      }
      
      const reportType = (req.query['reportType'] as string) === 'SUMMARY' ? 'SUMMARY' : 'DETAILED';
      const includeZeroVAT = req.query['includeZeroVAT'] !== 'false';
      const includeCanceled = req.query['includeCanceled'] === 'true';
      const customerFilter = req.query['customerId'] as string | undefined;
      const categoryFilter = req.query['category'] as any;
      
      return await this.salesJournalService.generateSalesJournal({
        companyId,
        periodStart,
        periodEnd,
        reportType,
        includeZeroVAT,
        includeCanceled,
        customerFilter,
        categoryFilter
      });
    });
  }
  
  /**
   * Export Jurnal de Vânzări în format Excel
   * Endpoint: GET /api/accounting/sales/journal/export/excel
   */
  async exportSalesJournalExcel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = this.getCompanyId(req);
      
      // Parse parametri (same as generateSalesJournal)
      const periodStart = this.parseDate(req.query['periodStart'] as string);
      const periodEnd = this.parseDate(req.query['periodEnd'] as string);
      
      if (!periodStart || !periodEnd) {
        res.status(400).json({ error: 'periodStart and periodEnd are required' });
        return;
      }
      
      // Generează raportul
      const report = await this.salesJournalService.generateSalesJournal({
        companyId,
        periodStart,
        periodEnd,
        reportType: 'DETAILED'
      });
      
      // Export la Excel
      const excelBuffer = await this.exportService.exportToExcel(report);
      
      // Setează headers pentru download
      const filename = `Jurnal_Vanzari_${report.periodLabel.replace(/\s/g, '_')}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      res.status(500).json({ error: 'Failed to export to Excel' });
    }
  }
  
  /**
   * Export Jurnal de Vânzări în format PDF
   * Endpoint: GET /api/accounting/sales/journal/export/pdf
   */
  async exportSalesJournalPDF(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const companyId = this.getCompanyId(req);
      
      // Parse parametri
      const periodStart = this.parseDate(req.query['periodStart'] as string);
      const periodEnd = this.parseDate(req.query['periodEnd'] as string);
      
      if (!periodStart || !periodEnd) {
        res.status(400).json({ error: 'periodStart and periodEnd are required' });
        return;
      }
      
      // Generează raportul
      const report = await this.salesJournalService.generateSalesJournal({
        companyId,
        periodStart,
        periodEnd,
        reportType: 'DETAILED'
      });
      
      // Export la PDF
      const pdfBuffer = await this.exportService.exportToPDF(report);
      
      // Setează headers pentru download
      const filename = `Jurnal_Vanzari_${report.periodLabel.replace(/\s/g, '_')}.html`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      res.status(500).json({ error: 'Failed to export to PDF' });
    }
  }
  
  /**
   * ============================================================================
   * ASYNC OPERATIONS & BULLMQ INTEGRATION
   * ============================================================================
   */
  
  /**
   * Generate sales journal asynchronously via BullMQ
   * Returns job ID for progress tracking
   * 
   * POST /api/accounting/sales-journal/generate-async
   */
  async generateSalesJournalAsync(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      
      const startDate = this.parseDate(req.body.startDate);
      const endDate = this.parseDate(req.body.endDate);
      
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required');
      }
      
      const result = await this.salesJournalService.generateSalesJournalAsync(
        {
          companyId,
          periodStart: startDate,
          periodEnd: endDate,
          reportType: req.body.reportType || 'DETAILED'
        },
        userId
      );
      
      return {
        success: true,
        ...result,
        statusUrl: `/api/accounting/jobs/${result.jobId}`
      };
    });
  }
  
  /**
   * ============================================================================
   * BULK OPERATIONS
   * ============================================================================
   */
  
  /**
   * Bulk create customer invoices
   * Processes multiple invoices in a single async job
   * 
   * POST /api/accounting/sales-journal/bulk-create-invoices
   */
  async bulkCreateInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const { invoices } = req.body;
      
      if (!Array.isArray(invoices) || invoices.length === 0) {
        throw new Error('Invoices array is required and must not be empty');
      }
      
      // Validare limită
      if (invoices.length > 1000) {
        throw new Error('Maximum 1000 invoices per bulk operation');
      }
      
      const result = await bulkOperationsService.bulkCreateInvoices(
        companyId,
        invoices,
        userId
      );
      
      if (result.jobId) {
        return {
          success: true,
          jobId: result.jobId,
          totalInvoices: result.totalItems,
          message: result.message,
          statusUrl: `/api/accounting/jobs/${result.jobId}`
        };
      }
      
      return result;
    });
  }
  
  /**
   * Bulk record payments
   * Processes multiple payment recordings in a single async job
   * 
   * POST /api/accounting/sales-journal/bulk-record-payments
   */
  async bulkRecordPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const { payments } = req.body;
      
      if (!Array.isArray(payments) || payments.length === 0) {
        throw new Error('Payments array is required and must not be empty');
      }
      
      // Validare limită
      if (payments.length > 1000) {
        throw new Error('Maximum 1000 payments per bulk operation');
      }
      
      const result = await bulkOperationsService.bulkRecordPayments(
        companyId,
        payments,
        userId
      );
      
      if (result.jobId) {
        return {
          success: true,
          jobId: result.jobId,
          totalPayments: result.totalItems,
          message: result.message,
          statusUrl: `/api/accounting/jobs/${result.jobId}`
        };
      }
      
      return result;
    });
  }
  
  /**
   * ============================================================================
   * JOB STATUS & TRACKING
   * ============================================================================
   */
  
  /**
   * Get job status and progress
   * 
   * GET /api/accounting/jobs/:jobId
   */
  async getJobStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { jobId } = req.params;
      
      if (!jobId) {
        throw new Error('Job ID is required');
      }
      
      const progress = await bulkOperationsService.getBulkOperationProgress(jobId);
      
      if (!progress) {
        throw new Error('Job not found');
      }
      
      return {
        success: true,
        job: progress
      };
    });
  }
  
  /**
   * Cancel a running job
   * 
   * POST /api/accounting/jobs/:jobId/cancel
   */
  async cancelJob(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { jobId } = req.params;
      
      if (!jobId) {
        throw new Error('Job ID is required');
      }
      
      const success = await bulkOperationsService.cancelBulkOperation(jobId);
      
      return {
        success,
        message: success 
          ? 'Job cancelled successfully' 
          : 'Failed to cancel job'
      };
    });
  }
  
  /**
   * Get queue metrics
   * 
   * GET /api/accounting/jobs/metrics
   */
  async getQueueMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const metrics = await accountingQueueService.getQueueMetrics();
      
      return {
        success: true,
        metrics
      };
    });
  }
}