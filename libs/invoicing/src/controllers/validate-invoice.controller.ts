/**
 * Validate Invoice Controller
 * 
 * This controller handles validation operations for invoices, including
 * business logic for invoice approval and accounting integrations.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidateInvoiceService } from '../services/validate-invoice.service';
import { Logger } from "@common/logger";
import { AuditService } from '../../audit/services/audit.service';
import { ENTITY_NAME } from '../invoices.module';
import { invoices } from '@geniuserp/shared';
import { eq, and } from 'drizzle-orm';

export class ValidateInvoiceController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ValidateInvoiceController');
  }

  /**
   * Validate an invoice
   */
  async validateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Validating invoice ${invoiceId} for company ${companyId}`);
      
      if (!invoiceId) {
        res.status(400).json({ message: 'Invoice ID is required' });
        return;
      }
      
      // Validate the invoice
      const validationResult = await ValidateInvoiceService.validateInvoice(
        invoiceId,
        userId as string
      );
      
      if (!validationResult.success) {
        this.logger.warn(`Failed to validate invoice ${invoiceId}: ${validationResult.message}`);
        res.status(400).json({ 
          success: false, 
          message: validationResult.message 
        });
        return;
      }
      
      // Log the validation in audit trail
      await AuditService.log({
        userId: userId as string,
        companyId: companyId as string,
        action: 'VALIDATE',
        entity: ENTITY_NAME,
        entityId: invoiceId,
        details: {
          result: validationResult,
          timestamp: new Date().toISOString(),
          journalEntryId: validationResult.ledgerEntryId
        }
      });
      
      this.logger.debug(`Successfully validated invoice ${invoiceId}`);
      res.json({
        success: true,
        message: 'Invoice validated successfully',
        validation: validationResult
      });
    } catch (error) {
      this.logger.error(`Error validating invoice ${req.params.invoiceId}:`, error);
      next(error);
    }
  }

  /**
   * Validate multiple invoices in a batch operation
   */
  async validateInvoiceBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceIds } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Batch validating ${invoiceIds.length} invoices for company ${companyId}`);
      
      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        res.status(400).json({ message: 'Invoice IDs array is required' });
        return;
      }
      
      // Process each invoice
      const results = await Promise.all(
        invoiceIds.map(async (invoiceId) => {
          try {
            const result = await ValidateInvoiceService.validateInvoice(
              invoiceId,
              userId as string
            );
            
            // Log the validation in audit trail
            if (result.success) {
              await AuditService.log({
                userId: userId as string,
                companyId: companyId as string,
                action: 'VALIDATE_BATCH',
                entity: ENTITY_NAME,
                entityId: invoiceId,
                details: {
                  batchOperation: true,
                  timestamp: new Date().toISOString(),
                  journalEntryId: result.ledgerEntryId
                }
              });
            }
            
            return {
              invoiceId,
              success: result.success,
              message: result.message,
              journalEntryId: result.ledgerEntryId
            };
          } catch (error) {
            return {
              invoiceId,
              success: false,
              message: (error as Error).message
            };
          }
        })
      );
      
      // Count successes and failures
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      this.logger.debug(`Batch validation complete: ${successCount} succeeded, ${failureCount} failed`);
      res.json({
        success: true,
        message: `Processed ${results.length} invoices: ${successCount} succeeded, ${failureCount} failed`,
        results
      });
    } catch (error) {
      this.logger.error('Error in batch invoice validation:', error);
      next(error);
    }
  }

  /**
   * Get the validation status of an invoice
   */
  async getValidationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Getting validation status for invoice ${invoiceId}`);
      
      if (!invoiceId) {
        res.status(400).json({ message: 'Invoice ID is required' });
        return;
      }
      
      // Get the validation status using Drizzle ORM
      const drizzle = new (await import('../../../common/drizzle/drizzle.service')).DrizzleService();
      
      const results = await drizzle.query(async (db) => {
        return await db
          .select({
            isValidated: invoices.isValidated,
            validatedAt: invoices.validatedAt,
            validatedBy: invoices.validatedBy,
            ledgerEntryId: invoices.ledgerEntryId
          })
          .from(invoices)
          .where(and(
            eq(invoices.id, invoiceId),
            eq(invoices.companyId, companyId as string)
          ))
          .limit(1);
      });
      
      if (!results || results.length === 0) {
        res.status(404).json({ message: 'Invoice not found' });
        return;
      }
      
      const status = results[0];
      this.logger.debug(`Retrieved validation status for invoice ${invoiceId}`);
      res.json(status);
    } catch (error) {
      this.logger.error(`Error getting validation status for invoice ${req.params.invoiceId}:`, error);
      next(error);
    }
  }
  
  /**
   * Preview the accounting entries that would be created upon validation
   */
  async previewAccountingEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Previewing accounting entries for invoice ${invoiceId}`);
      
      if (!invoiceId) {
        res.status(400).json({ message: 'Invoice ID is required' });
        return;
      }
      
      // Get invoice data for preview using Drizzle ORM
      const drizzle = new (await import('../../../common/drizzle/drizzle.service')).DrizzleService();
      
      const results = await drizzle.query(async (db) => {
        return await db
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, invoiceId),
            eq(invoices.companyId, companyId as string)
          ))
          .limit(1);
      });
      
      if (!results || results.length === 0) {
        res.status(404).json({ message: 'Invoice not found' });
        return;
      }
      
      // Return a simple preview for now
      const invoice = results[0];
      const preview = {
        debitAccount: '4111', // Client account
        creditAccount: '7071', // Sales revenue
        amount: Number(invoice.totalAmount || invoice.amount),
        description: `Sales invoice ${invoice.invoiceNumber}`
      };
      
      this.logger.debug(`Generated accounting entries preview for invoice ${invoiceId}`);
      res.json(preview);
    } catch (error) {
      this.logger.error(`Error previewing accounting entries for invoice ${req.params.invoiceId}:`, error);
      next(error);
    }
  }
}