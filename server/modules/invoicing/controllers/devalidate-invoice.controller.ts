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
      
      // Check if the invoice can be devalidated from DB directly
      const query = `
        SELECT is_validated, ledger_entry_id 
        FROM invoices 
        WHERE id = $1 AND company_id = $2
        LIMIT 1
      `;
      
      const drizzle = new (await import('../../../common/drizzle/drizzle.service')).DrizzleService();
      const results = await drizzle.base.executeQuery(query, [invoiceId, companyId]);
      
      if (!results || results.length === 0) {
        res.status(404).json({ canDevalidate: false, message: 'Invoice not found' });
        return;
      }
      
      const invoice = results[0];
      const canDevalidate = {
        canDevalidate: invoice.is_validated && !!invoice.ledger_entry_id,
        message: invoice.is_validated ? 'Invoice can be devalidated' : 'Invoice is not validated'
      };
      
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
      
      // Get the devalidation history from audit logs
      const query = `
        SELECT * FROM audit_logs
        WHERE entity = 'invoice' 
          AND entity_id = $1 
          AND action = 'DEVALIDATE'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      const drizzle = new (await import('../../../common/drizzle/drizzle.service')).DrizzleService();
      const history = await drizzle.base.executeQuery(query, [invoiceId]);
      
      this.logger.debug(`Retrieved devalidation history for invoice ${invoiceId}`);
      res.json({ history: history || [] });
    } catch (error) {
      this.logger.error(`Error getting devalidation history for invoice ${req.params.invoiceId}:`, error);
      next(error);
    }
  }
}