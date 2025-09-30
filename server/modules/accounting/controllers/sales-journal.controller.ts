import { Request, Response } from 'express';
import { SalesJournalService } from '../services/sales-journal.service';
import { BaseController } from './base.controller';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';

/**
 * SalesJournalController
 * 
 * Handles all sales journal operations including customer invoices,
 * receipts, payments, and reporting for the romanian accounting system
 */
export class SalesJournalController extends BaseController {
  /**
   * Constructor
   */
  constructor(private salesJournalService: SalesJournalService) {
    super();
  }
  
  /**
   * Get all customer invoices with pagination and filtering
   */
  async getCustomerInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const { page, limit } = this.getPaginationParams(req);
      
      // Parse filter parameters
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string);
      const customerId = req.query.customerId as string;
      const status = req.query.status as string;
      
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
      const invoiceId = req.params.id;
      
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
      
      return await this.salesJournalService.getCustomerInvoice(invoiceId, companyId);
    });
  }
  
  /**
   * Update customer invoice
   */
  async updateCustomerInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const companyId = this.getCompanyId(req);
      const invoiceId = req.params.id;
      
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
      const invoiceId = req.params.id;
      
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
      const invoiceId = req.params.id;
      
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
      const invoiceId = req.params.id;
      
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
      const paymentId = req.params.id;
      
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
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string);
      const customerId = req.query.customerId as string;
      
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
      const receiptId = req.params.id;
      
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
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string);
      
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
      const entryId = req.params.id;
      
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
      const customerId = req.params.id;
      
      // Parse date parameters
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string) || new Date();
      
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
      const customerId = req.params.id;
      
      // Parse date parameter
      const asOfDate = this.parseDate(req.query.asOfDate as string) || new Date();
      
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
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string) || new Date();
      const groupBy = req.query.groupBy as string || 'month'; // day, week, month, quarter, year
      
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
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string) || new Date();
      
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
      const startDate = this.parseDate(req.query.startDate as string);
      const endDate = this.parseDate(req.query.endDate as string) || new Date();
      
      return await this.salesJournalService.generateSalesByCustomerReport(
        companyId,
        startDate,
        endDate
      );
    });
  }
}