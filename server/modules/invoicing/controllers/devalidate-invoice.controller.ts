/**
 * Devalidate Invoice Controller
 * 
 * This controller handles devalidation operations for invoices, including
 * reversing accounting entries and updating invoice status.
 */

import { Request, Response, NextFunction } from 'express';
import { DevalidateInvoiceService } from '../services/devalidate-invoice.service';
import { Logger } from '../../../common/logger';
import { AuditService } from '../../audit/services/audit.service';
import { ENTITY_NAME } from '../invoices.module';

export class DevalidateInvoiceController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('DevalidateInvoiceController');
  }

  /**
   * Devalidate an invoice
   */
  async devalidateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Devalidating invoice ${invoiceId} for company ${companyId}`);
      
      if (!invoiceId) {
        res.status(400).json({ message: 'Invoice ID is required' });
        return;
      }
      
      if (!reason) {
        res.status(400).json({ message: 'Devalidation reason is required' });
        return;
      }
      
      // Devalidate the invoice
      const result = await DevalidateInvoiceService.devalidateInvoice(
        invoiceId,
        companyId as string,
        userId as string,
        reason
      );
      
      if (!result) {
        res.status(404).json({ message: 'Invoice not found or cannot be devalidated' });
        return;
      }
      
      // Log the devalidation in audit trail
      await AuditService.log({
        userId: userId as string,
        companyId: companyId as string,
        action: 'DEVALIDATE',
        entity: ENTITY_NAME,
        entityId: invoiceId,
        details: {
          reason,
          timestamp: new Date().toISOString(),
          devalidatedAt: result.devalidatedAt
        }
      });
      
      this.logger.debug(`Successfully devalidated invoice ${invoiceId}`);
      res.json({
        success: true,
        message: 'Invoice devalidated successfully',
        result
      });
    } catch (error) {
      this.logger.error(`Error devalidating invoice ${req.params.invoiceId}:`, error);
      next(error);
    }
  }

  /**
   * Check if an invoice can be devalidated
   */
  async canDevalidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Checking if invoice ${invoiceId} can be devalidated`);
      
      if (!invoiceId) {
        res.status(400).json({ message: 'Invoice ID is required' });
        return;
      }
      
      // Check if the invoice can be devalidated
      const canDevalidate = await DevalidateInvoiceService.canDevalidate(
        invoiceId,
        companyId as string
      );
      
      this.logger.debug(`Devalidation check for invoice ${invoiceId}: ${canDevalidate.canDevalidate}`);
      res.json(canDevalidate);
    } catch (error) {
      this.logger.error(`Error checking devalidation status for invoice ${req.params.invoiceId}:`, error);
      next(error);
    }
  }

  /**
   * Get the devalidation history for an invoice
   */
  async getDevalidationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Getting devalidation history for invoice ${invoiceId}`);
      
      if (!invoiceId) {
        res.status(400).json({ message: 'Invoice ID is required' });
        return;
      }
      
      // Get the devalidation history
      const history = await DevalidateInvoiceService.getDevalidationHistory(
        invoiceId,
        companyId as string
      );
      
      if (!history) {
        res.status(404).json({ message: 'Invoice not found or no devalidation history' });
        return;
      }
      
      this.logger.debug(`Retrieved devalidation history for invoice ${invoiceId}`);
      res.json(history);
    } catch (error) {
      this.logger.error(`Error getting devalidation history for invoice ${req.params.invoiceId}:`, error);
      next(error);
    }
  }
}