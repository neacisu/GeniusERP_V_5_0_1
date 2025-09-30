/**
 * Create Invoice Controller
 * 
 * This controller is responsible for handling invoice creation requests.
 * It validates the input and delegates to the CreateInvoiceService.
 */

import { Request, Response } from 'express';
import { CreateInvoiceService } from '../services/create-invoice.service';
import { log } from '../../../vite';
import { CreateInvoiceValidator } from '../validators/create-invoice.validator';
import { AuditService } from '../../audit/services/audit.service';
import { ENTITY_NAME } from '../invoices.module';

export class InvoicesController {
  /**
   * Handle the creation of a new invoice
   * @param req Express request
   * @param res Express response
   */
  static async createInvoice(req: Request, res: Response) {
    try {
      // Get the user ID from the authenticated request for audit logging
      const userId = req.user?.id;
      
      // Log the incoming request
      log(`📝 Processing invoice creation request for user: ${userId}`, 'invoices-controller');
      
      // Validate the input data
      const validationResult = CreateInvoiceValidator.validate(req.body);
      if (validationResult.error) {
        log(`❌ Validation error: ${validationResult.error.message}`, 'invoices-controller');
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: validationResult.error.message
        });
      }
      
      // Extract validated data
      const input = {
        companyId: req.body.companyId,
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
        AuditService.log({
          userId,
          action: 'create',
          entityType: ENTITY_NAME,
          entityId: result.id,
          details: `Created invoice with series ${result.series}, amount ${result.totalAmount} ${result.currency}`
        });
      } catch (auditError) {
        // Log the audit error but don't fail the request
        log(`⚠️ Failed to create audit log: ${(auditError as Error).message}`, 'invoices-controller');
      }
      
      // Return success response
      return res.status(201).json({ 
        success: true, 
        invoice: result 
      });
    } catch (error) {
      // Log the error
      log(`❌ Failed to create invoice: ${(error as Error).message}`, 'invoices-controller');
      
      // Return error response
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: (error as Error).message
      });
    }
  }
}