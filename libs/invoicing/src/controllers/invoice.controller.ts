/**
 * Invoice Controller
 * 
 * This controller implements the RESTful API endpoints for invoice management,
 * including CRUD operations and specialized business logic.
 */

import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { Logger } from '../../../common/logger';
import { AuditService } from '../../audit/services/audit.service';
import { v4 as uuidv4 } from 'uuid';
import { ENTITY_NAME } from '../invoices.module';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { invoices, invoiceDetails } from '@shared/schema';
import { invoiceItems } from '../schema/invoice.schema';
import { eq, and, desc } from 'drizzle-orm';
import { trackInvoiceCreation, invoiceMetrics } from '../../../middlewares/business-metrics.middleware';

export class InvoiceController {
  private logger: Logger;
  private drizzle: DrizzleService;

  constructor() {
    this.logger = new Logger('InvoiceController');
    this.drizzle = new DrizzleService();
  }

  /**
   * Create a new invoice
   */
  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoice, details, lines } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      this.logger.debug(`Creating invoice for company ${companyId}`);

      if (!invoice || !details || !lines) {
        res.status(400).json({ message: 'Invoice, details, and lines are required' });
        return;
      }

      // Ensure company ID is set
      invoice.companyId = companyId;

      const result = await InvoiceService.createDraftInvoice(
        invoice,
        details,
        lines,
        userId
      );

      // Track invoice creation metrics
      trackInvoiceCreation('sales', companyId as string);

      this.logger.debug(`Created invoice ${result.id}`);
      res.status(201).json(result);
    } catch (error) {
      this.logger.error('Error creating invoice:', error);
      next(error);
    }
  }

  /**
   * Get all invoices for a company
   */
  async getCompanyInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const { page = '1', limit = '20', sortBy = 'issueDate', sortDir = 'desc' } = req.query;
      
      this.logger.debug(`Getting invoices for company ${companyId}`);
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;
      
      const results = await InvoiceService.getInvoicesForCompany(
        companyId as string,
        limitNum,
        offset,
        sortBy as string,
        sortDir as 'asc' | 'desc'
      );
      
      this.logger.debug(`Retrieved ${results.invoices.length} invoices`);
      res.json(results);
    } catch (error) {
      this.logger.error('Error getting company invoices:', error);
      next(error);
    }
  }

  /**
   * Get a single invoice by ID
   */
  async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      this.logger.debug(`Getting invoice ${id} for company ${companyId}`);

      const invoice = await InvoiceService.getInvoiceById(id, companyId as string);

      if (!invoice) {
        res.status(404).json({ message: 'Invoice not found' });
        return;
      }

      this.logger.debug(`Retrieved invoice ${id}`);
      res.json(invoice);
    } catch (error) {
      this.logger.error(`Error getting invoice ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Update an invoice
   */
  async updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      this.logger.debug(`Updating invoice ${id} for company ${companyId}`);

      // Ensure we're not allowing update of sensitive fields
      delete updates.id;
      delete updates.companyId;
      delete updates.createdAt;
      delete updates.createdBy;
      
      const result = await InvoiceService.updateInvoice(
        id,
        companyId as string,
        updates,
        userId
      );

      if (!result) {
        res.status(404).json({ message: 'Invoice not found or not updated' });
        return;
      }

      // Log the update in audit trail
      await AuditService.log({
        userId: userId as string,
        companyId: companyId as string,
        action: 'UPDATE',
        entity: ENTITY_NAME,
        entityId: id,
        details: {
          updates: Object.keys(updates),
          timestamp: new Date().toISOString()
        }
      });

      this.logger.debug(`Updated invoice ${id}`);
      res.json(result);
    } catch (error) {
      this.logger.error(`Error updating invoice ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Delete an invoice
   */
  async deleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      this.logger.debug(`Deleting invoice ${id} for company ${companyId}`);

      // First check if the invoice can be deleted (not validated, etc.)
      const canDelete = await InvoiceService.canDeleteInvoice(id, companyId as string);
      
      if (!canDelete.canDelete) {
        res.status(400).json({ 
          message: 'Invoice cannot be deleted', 
          reason: canDelete.reason 
        });
        return;
      }

      const result = await InvoiceService.deleteInvoiceForCompany(id, companyId as string, userId);

      if (!result) {
        res.status(404).json({ message: 'Invoice not found or not deleted' });
        return;
      }

      // Log the deletion in audit trail
      await AuditService.log({
        userId: userId as string,
        companyId: companyId as string,
        action: 'DELETE',
        entity: ENTITY_NAME,
        entityId: id,
        details: {
          timestamp: new Date().toISOString()
        }
      });

      this.logger.debug(`Deleted invoice ${id}`);
      res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (error) {
      this.logger.error(`Error deleting invoice ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId } = req.params;
      const companyId = req.user?.companyId;
      const { page = '1', limit = '20' } = req.query;
      
      this.logger.debug(`Getting invoices for customer ${customerId}`);
      
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;
      
      const results = await InvoiceService.getCustomerInvoices(
        customerId,
        companyId as string,
        limitNum,
        offset
      );
      
      this.logger.debug(`Retrieved ${results.invoices.length} invoices for customer ${customerId}`);
      res.json(results);
    } catch (error) {
      this.logger.error(`Error getting customer ${req.params.customerId} invoices:`, error);
      next(error);
    }
  }

  /**
   * Get invoice stats
   */
  async getInvoiceStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Getting invoice statistics for company ${companyId}`);
      
      const stats = await InvoiceService.getInvoiceStats(companyId as string);
      
      this.logger.debug(`Retrieved invoice statistics for company ${companyId}`);
      res.json(stats);
    } catch (error) {
      this.logger.error('Error getting invoice statistics:', error);
      next(error);
    }
  }

  /**
   * Export an invoice to PDF
   */
  async exportInvoiceToPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Exporting invoice ${id} to PDF`);
      
      const pdfBuffer = await InvoiceService.generateInvoicePdf(id, companyId as string);
      
      if (!pdfBuffer) {
        res.status(404).json({ message: 'Invoice not found or PDF generation failed' });
        return;
      }
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
      
      this.logger.debug(`Successfully exported invoice ${id} to PDF`);
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Error exporting invoice ${req.params.id} to PDF:`, error);
      next(error);
    }
  }
}