/**
 * Create Invoice Controller
 * 
 * This controller is responsible for handling invoice creation requests.
 * It validates the input and delegates to the CreateInvoiceService.
 */

import { Request, Response, NextFunction } from 'express';
import { CreateInvoiceService } from '../services/create-invoice.service';
import { Logger } from '../../../common/logger';
import { validateCreateInvoiceInput } from '../validators/create-invoice.validator';
import { AuditService } from '../../audit/services/audit.service';
import { ENTITY_NAME } from '../invoices.module';

export class CreateInvoiceController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('CreateInvoiceController');
  }

  /**
   * Handle the creation of a new invoice
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the user ID from the authenticated request for audit logging
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      // Log the incoming request
      this.logger.debug(`Processing invoice creation request for user: ${userId}`);
      
      // Validate the input data
      const validationResult = validateCreateInvoiceInput(req.body);
      if (!validationResult.success) {
        this.logger.warn(`Validation error: ${validationResult.error?.message}`);
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: validationResult.error?.issues?.map(i => i.message).join(', ') || 'Invalid input'
        });
        return;
      }
      
      // Extract validated data
      const input = {
        companyId: companyId || req.body.companyId,
        franchiseId: req.body.franchiseId,
        currency: req.body.currency,
        convertTo: req.body.convertTo,
        totalAmount: req.body.amount,
        series: req.body.series,
        userId
      };
      
      // Call the service to create the invoice
      const result = await CreateInvoiceService.execute(input);
      
      // Log the successful creation in the audit trail
      try {
        await AuditService.log({
          userId: userId as string,
          companyId: companyId as string,
          action: 'CREATE',
          entity: ENTITY_NAME,
          entityId: result.id,
          details: {
            series: result.series,
            amount: result.totalAmount,
            currency: result.currency,
            timestamp: new Date().toISOString()
          }
        });
      } catch (auditError) {
        // Log the audit error but don't fail the request
        this.logger.warn(`Failed to create audit log: ${(auditError as Error).message}`);
      }
      
      // Return success response
      this.logger.debug(`Successfully created invoice ${result.id}`);
      res.status(201).json({ 
        success: true, 
        invoice: result 
      });
    } catch (error) {
      // Log the error
      this.logger.error(`Failed to create invoice: ${(error as Error).message}`);
      next(error);
    }
  }

  /**
   * Create a batch of invoices
   */
  async createInvoiceBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoices } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      this.logger.debug(`Processing batch invoice creation request with ${invoices?.length} invoices`);
      
      if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Validation error',
          details: 'Invoices array is required and must not be empty'
        });
        return;
      }
      
      // Process each invoice
      const results = await Promise.all(
        invoices.map(async (invoiceData) => {
          try {
            // Validate the input data
            const validationResult = validateCreateInvoiceInput(invoiceData);
            if (!validationResult.success) {
              return {
                success: false,
                error: 'Validation error',
                details: validationResult.error?.issues?.map(i => i.message).join(', ') || 'Invalid input',
                data: invoiceData
              };
            }
            
            // Extract validated data
            const input = {
              companyId: companyId || invoiceData.companyId,
              franchiseId: invoiceData.franchiseId,
              currency: invoiceData.currency,
              convertTo: invoiceData.convertTo,
              totalAmount: invoiceData.amount,
              series: invoiceData.series,
              userId
            };
            
            // Call the service to create the invoice
            const result = await CreateInvoiceService.execute(input);
            
            // Log the successful creation in the audit trail
            try {
              await AuditService.log({
                userId: userId as string,
                companyId: companyId as string,
                action: 'CREATE_BATCH',
                entity: ENTITY_NAME,
                entityId: result.id,
                details: {
                  series: result.series,
                  amount: result.totalAmount,
                  currency: result.currency,
                  batchOperation: true,
                  timestamp: new Date().toISOString()
                }
              });
            } catch (auditError) {
              this.logger.warn(`Failed to create audit log for batch invoice: ${(auditError as Error).message}`);
            }
            
            return {
              success: true,
              invoice: result
            };
          } catch (error) {
            return {
              success: false,
              error: 'Processing error',
              message: (error as Error).message,
              data: invoiceData
            };
          }
        })
      );
      
      // Count successes and failures
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      this.logger.debug(`Batch creation complete: ${successCount} succeeded, ${failureCount} failed`);
      res.status(201).json({
        success: true,
        message: `Processed ${results.length} invoices: ${successCount} succeeded, ${failureCount} failed`,
        results
      });
    } catch (error) {
      this.logger.error(`Failed to process invoice batch: ${(error as Error).message}`);
      next(error);
    }
  }
}