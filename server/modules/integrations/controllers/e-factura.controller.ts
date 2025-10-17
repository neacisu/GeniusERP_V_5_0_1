/**
 * E-Factura Controller
 * 
 * Controller for Romanian e-Factura operations
 */

import { Request, Response } from 'express';
import { eFacturaService } from '../services/e-factura.service';
import { IntegrationsService } from '../services/integrations.service';
import { AuditService } from '../../audit/services/audit.service';

// Resource type for audit logs
const RESOURCE_TYPE = 'e_factura';

/**
 * Controller for Romanian e-Factura operations
 */
export class EFacturaController {
  private integrationsService: IntegrationsService;
  private auditService: AuditService;

  constructor() {
    this.integrationsService = new IntegrationsService();
    this.auditService = new AuditService();
  }

  /**
   * Send invoice to e-Factura system
   */
  async sendInvoice(req: Request, res: Response): Promise<Response> {
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
      
      // Check if ANAF integration exists
      const anafIntegration = await this.integrationsService.getIntegrationByProvider(
        'anaf_efactura',
        companyId
      );
      
      if (!anafIntegration) {
        return res.status(404).json({
          success: false,
          error: 'ANAF e-Factura integration not found'
        });
      }
      
      // Send invoice to e-Factura
      const result = await eFacturaService.sendInvoice(invoiceId, xmlData, companyId, userId);
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'create',
        resourceType: RESOURCE_TYPE,
        resourceId: invoiceId,
        details: {
          message: 'Invoice sent to e-Factura',
          result: result.success ? 'success' : 'failure'
        }
      });
      
      return res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.message,
        data: result.data || null
      });
    } catch (error) {
      console.error('[EFacturaController] Send invoice error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send invoice to e-Factura'
      });
    }
  }

  /**
   * Check invoice status in e-Factura system
   */
  async checkInvoiceStatus(req: Request, res: Response): Promise<Response> {
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
      
      // Check if ANAF integration exists
      const anafIntegration = await this.integrationsService.getIntegrationByProvider(
        'anaf_efactura',
        companyId
      );
      
      if (!anafIntegration) {
        return res.status(404).json({
          success: false,
          error: 'ANAF e-Factura integration not found'
        });
      }
      
      // Check invoice status
      const status = await eFacturaService.checkInvoiceStatus(invoiceId, companyId, userId);
      
      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('[EFacturaController] Check invoice status error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to check invoice status in e-Factura'
      });
    }
  }

  /**
   * Generate XML for e-Factura
   */
  async generateXml(req: Request, res: Response): Promise<Response> {
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
      
      // Generate XML
      const xml = await eFacturaService.generateInvoiceXml(invoiceId, companyId, userId);
      
      if (!xml) {
        return res.status(404).json({
          success: false,
          error: 'Failed to generate XML for invoice'
        });
      }
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'read',
        resourceType: RESOURCE_TYPE,
        resourceId: invoiceId,
        details: {
          message: 'Generated e-Factura XML'
        }
      });
      
      // Option 1: Return XML as string
      return res.status(200).json({
        success: true,
        data: {
          xml
        }
      });
      
      // Option 2: Return as downloadable file
      // res.setHeader('Content-Type', 'application/xml');
      // res.setHeader('Content-Disposition', `attachment; filename="efactura-${invoiceId}.xml"`);
      // return res.send(xml);
    } catch (error) {
      console.error('[EFacturaController] Generate XML error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to generate XML for e-Factura'
      });
    }
  }

  /**
   * Validate invoice against e-Factura schema
   */
  async validateInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const { xmlData } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!xmlData) {
        return res.status(400).json({
          success: false,
          error: 'XML data is required'
        });
      }
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Validate XML against e-Factura schema
      const validationResult = await eFacturaService.validateInvoiceXml(xmlData, companyId);
      
      return res.status(200).json({
        success: true,
        valid: validationResult.valid,
        errors: validationResult.errors || []
      });
    } catch (error) {
      console.error('[EFacturaController] Validate invoice error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to validate invoice against e-Factura schema'
      });
    }
  }

  /**
   * Download invoice metadata from e-Factura
   */
  async downloadInvoiceMetadata(req: Request, res: Response): Promise<Response> {
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
      
      // Check if ANAF integration exists
      const anafIntegration = await this.integrationsService.getIntegrationByProvider(
        'anaf_efactura',
        companyId
      );
      
      if (!anafIntegration) {
        return res.status(404).json({
          success: false,
          error: 'ANAF e-Factura integration not found'
        });
      }
      
      // Download invoice metadata
      const metadata = await eFacturaService.downloadInvoiceMetadata(invoiceId, companyId, userId);
      
      if (!metadata) {
        return res.status(404).json({
          success: false,
          error: 'Invoice metadata not found in e-Factura system'
        });
      }
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'read',
        resourceType: RESOURCE_TYPE,
        resourceId: invoiceId,
        details: {
          message: 'Downloaded e-Factura invoice metadata'
        }
      });
      
      return res.status(200).json({
        success: true,
        data: metadata
      });
    } catch (error) {
      console.error('[EFacturaController] Download invoice metadata error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to download invoice metadata from e-Factura'
      });
    }
  }
}

// Export singleton instance
export const eFacturaController = new EFacturaController();