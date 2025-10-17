/**
 * ANAF Controller
 * 
 * Controller for Romanian tax authority (ANAF) operations
 */

import { Request, Response } from 'express';
import { anafService } from '../services/anaf.service';
import { eFacturaService } from '../services/e-factura.service';
import { AuditService } from '../../audit/services/audit.service';

// For audit logging
const RESOURCE_TYPE = 'anaf';

/**
 * Controller for ANAF (Romanian tax authority) operations
 */
export class AnafController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Validate Romanian VAT number through ANAF
   */
  async validateVat(req: Request, res: Response): Promise<Response> {
    try {
      const vatNumber = req.params.vatNumber;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!vatNumber || vatNumber.length < 2) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid VAT number format' 
        });
      }

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const validationResult = await anafService.validateVat(vatNumber);
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        entity: 'integration',
        action: 'read',
        details: {
          message: 'VAT number validation',
          valid: !!validationResult.valid
        }
      });
      
      return res.status(200).json({
        success: true,
        data: validationResult
      });
    } catch (error) {
      console.error('[AnafController] Validate VAT error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to validate VAT number'
      });
    }
  }

  /**
   * Get company information by fiscal code
   */
  async getCompanyInfo(req: Request, res: Response): Promise<Response> {
    try {
      const fiscalCode = req.params.fiscalCode;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!fiscalCode || fiscalCode.length < 2) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid fiscal code format' 
        });
      }

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const companyInfo = await anafService.getCompanyInfo(fiscalCode);

      if (!companyInfo) {
        return res.status(404).json({ 
          success: false,
          error: 'Company not found' 
        });
      }
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        entity: 'integration',
        action: 'read',
        details: {
          message: 'Company info lookup',
          companyName: companyInfo.name || 'N/A'
        }
      });

      return res.status(200).json({
        success: true,
        data: companyInfo
      });
    } catch (error) {
      console.error('[AnafController] Get company info error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve company information'
      });
    }
  }

  /**
   * Send e-Invoice to ANAF
   */
  async sendEInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const { invoiceId, xmlData } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!invoiceId || !xmlData) {
        return res.status(400).json({ 
          success: false,
          error: 'Invoice ID and XML data are required' 
        });
      }

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const result = await eFacturaService.sendInvoice(xmlData, { invoiceId, companyId, userId });
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        entity: 'integration',
        action: 'create',
        details: {
          message: 'E-invoice sent to ANAF',
          result: result.success ? 'success' : 'failure',
          referenceId: result.referenceId
        }
      });

      return res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.message,
        referenceId: result.referenceId || null
      });
    } catch (error) {
      console.error('[AnafController] Send e-invoice error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to send e-invoice to ANAF'
      });
    }
  }

  /**
   * Check e-Invoice status in ANAF
   */
  async checkEInvoiceStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { invoiceId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!invoiceId) {
        return res.status(400).json({ 
          success: false,
          error: 'Invoice ID is required' 
        });
      }

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const status = await eFacturaService.checkInvoiceStatus(invoiceId);
      
      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('[AnafController] Check e-invoice status error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to check e-invoice status'
      });
    }
  }
}

// Export singleton instance
export const anafController = new AnafController();