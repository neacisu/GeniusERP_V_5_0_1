/**
 * PandaDoc Controller
 * 
 * Controller for PandaDoc document operations
 */

import { Request, Response } from 'express';
import { PandaDocClient } from '../clients';
import { IntegrationsService } from '../services/integrations.service';
import { AuditService } from '../../audit/services/audit.service';

// Resource type for audit logs
const RESOURCE_TYPE = 'pandadoc';

/**
 * Controller for PandaDoc document operations
 */
export class PandaDocController {
  private integrationsService: IntegrationsService;
  private auditService: AuditService;

  constructor() {
    this.integrationsService = new IntegrationsService();
    this.auditService = new AuditService();
  }

  /**
   * Initialize PandaDoc integration
   */
  async initialize(req: Request, res: Response): Promise<Response> {
    try {
      const { apiKey } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required'
        });
      }
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Check if integration already exists
      const existingIntegration = await this.integrationsService.getIntegrationByProvider(
        'pandadoc',
        companyId
      );
      
      if (existingIntegration) {
        return res.status(400).json({
          success: false,
          error: 'PandaDoc integration already exists for this company',
          data: existingIntegration
        });
      }
      
      // Initialize PandaDoc client
      const pandaDocClient = new PandaDocClient(companyId);
      
      // Test connection
      const isConnected = await pandaDocClient.testConnection(apiKey);
      
      if (!isConnected) {
        return res.status(400).json({
          success: false,
          error: 'Failed to connect to PandaDoc API'
        });
      }
      
      // Create integration
      const integration = await pandaDocClient.initialize(apiKey, userId);
      
      // Create audit log
      await this.auditService.createAuditLog({
        userId,
        companyId,
        action: 'create',
        resourceType: RESOURCE_TYPE,
        resourceId: integration.id,
        details: {
          message: 'PandaDoc integration initialized'
        }
      });
      
      return res.status(201).json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('[PandaDocController] Initialize error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize PandaDoc integration'
      });
    }
  }

  /**
   * List PandaDoc templates
   */
  async listTemplates(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'pandadoc',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'PandaDoc integration not found'
        });
      }
      
      // Initialize PandaDoc client
      const pandaDocClient = new PandaDocClient(companyId);
      
      // List templates
      const templates = await pandaDocClient.listTemplates(userId);
      
      return res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('[PandaDocController] List templates error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to list PandaDoc templates'
      });
    }
  }

  /**
   * Get PandaDoc template details
   */
  async getTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const { templateId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'pandadoc',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'PandaDoc integration not found'
        });
      }
      
      // Initialize PandaDoc client
      const pandaDocClient = new PandaDocClient(companyId);
      
      // Get template details
      const template = await pandaDocClient.getTemplate(templateId, userId);
      
      return res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('[PandaDocController] Get template error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get PandaDoc template details'
      });
    }
  }

  /**
   * Create document from template
   */
  async createDocumentFromTemplate(req: Request, res: Response): Promise<Response> {
    try {
      const {
        name,
        templateId,
        recipients,
        metadata,
        tokens,
        fields,
        tags,
        pricingTables
      } = req.body;
      
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      if (!name || !templateId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Name, templateId, and recipients are required'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'pandadoc',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'PandaDoc integration not found'
        });
      }
      
      // Initialize PandaDoc client
      const pandaDocClient = new PandaDocClient(companyId);
      
      // Create document
      const document = await pandaDocClient.createDocumentFromTemplate(
        name,
        templateId,
        recipients,
        metadata,
        tokens,
        fields,
        tags,
        pricingTables,
        userId
      );
      
      // Create audit log
      await this.auditService.createAuditLog({
        userId,
        companyId,
        action: 'create',
        resourceType: 'document',
        resourceId: document.id,
        details: {
          name,
          templateId,
          recipientCount: recipients.length
        }
      });
      
      return res.status(201).json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('[PandaDocController] Create document error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create document from template'
      });
    }
  }

  /**
   * Get document details
   */
  async getDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'pandadoc',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'PandaDoc integration not found'
        });
      }
      
      // Initialize PandaDoc client
      const pandaDocClient = new PandaDocClient(companyId);
      
      // Get document details
      const document = await pandaDocClient.getDocument(documentId, userId);
      
      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('[PandaDocController] Get document error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get document details'
      });
    }
  }

  /**
   * Send document for signing
   */
  async sendDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { documentId } = req.params;
      const { subject, message, silent = false } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'pandadoc',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'PandaDoc integration not found'
        });
      }
      
      // Initialize PandaDoc client
      const pandaDocClient = new PandaDocClient(companyId);
      
      // Send document
      const document = await pandaDocClient.sendDocument(
        documentId,
        subject,
        message,
        silent,
        userId
      );
      
      // Create audit log
      await this.auditService.createAuditLog({
        userId,
        companyId,
        action: 'update',
        resourceType: 'document',
        resourceId: documentId,
        details: {
          message: 'Document sent for signing',
          silent
        }
      });
      
      return res.status(200).json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('[PandaDocController] Send document error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send document'
      });
    }
  }

  /**
   * Get document status
   */
  async getDocumentStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'pandadoc',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'PandaDoc integration not found'
        });
      }
      
      // Initialize PandaDoc client
      const pandaDocClient = new PandaDocClient(companyId);
      
      // Get document status
      const documentStatus = await pandaDocClient.getDocumentStatus(documentId, userId);
      
      return res.status(200).json({
        success: true,
        data: documentStatus
      });
    } catch (error) {
      console.error('[PandaDocController] Get document status error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get document status'
      });
    }
  }

  /**
   * Download document
   */
  async downloadDocument(req: Request, res: Response): Promise<Response> {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'pandadoc',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'PandaDoc integration not found'
        });
      }
      
      // Initialize PandaDoc client
      const pandaDocClient = new PandaDocClient(companyId);
      
      // Download document
      const fileBuffer = await pandaDocClient.downloadDocument(documentId, userId);
      
      // Create audit log
      await this.auditService.createAuditLog({
        userId,
        companyId,
        action: 'read',
        resourceType: 'document',
        resourceId: documentId,
        details: {
          message: 'Document downloaded'
        }
      });
      
      // Set headers and send file
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `attachment; filename="document-${documentId}.pdf"`);
      return res.send(fileBuffer);
    } catch (error) {
      console.error('[PandaDocController] Download document error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to download document'
      });
    }
  }
}

// Export singleton instance
export const pandaDocController = new PandaDocController();