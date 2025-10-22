/**
 * PandaDoc Routes
 * 
 * API routes for PandaDoc integration
 */

import express from 'express';
import { PandaDocClient } from '../clients';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { IntegrationsService } from '../services/integrations.service';
import { AuditService } from '../../audit/services/audit.service';
import { IntegrationProvider } from '../schema/integrations.schema';

// Create router
const router = express.Router();
const integrationsService = new IntegrationsService();

// Resource type for audit logs
const RESOURCE_TYPE = IntegrationProvider.PANDADOC;

/**
 * Initialize PandaDoc integration
 * 
 * POST /api/integrations/pandadoc/initialize
 */
router.post(
  '/initialize',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard(['admin', 'manager']),
  async (req, res) => {
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
      const existingIntegration = await integrationsService.getIntegrationByProvider(
        IntegrationProvider.PANDADOC,
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
      await AuditService.createAuditLog({
        userId,
        companyId,
        entity: 'integration',
        action: 'create',
        details: {
          message: 'PandaDoc integration initialized'
        }
      });
      
      return res.status(201).json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('[PandaDocRoutes] Initialize error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize PandaDoc integration'
      });
    }
  }
);

/**
 * List PandaDoc templates
 * 
 * GET /api/integrations/pandadoc/templates
 */
router.get(
  '/templates',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const integration = await integrationsService.getIntegrationByProvider(
        IntegrationProvider.PANDADOC,
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
      console.error('[PandaDocRoutes] List templates error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to list PandaDoc templates'
      });
    }
  }
);

/**
 * Get PandaDoc template details
 * 
 * GET /api/integrations/pandadoc/templates/:templateId
 */
router.get(
  '/templates/:templateId',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const integration = await integrationsService.getIntegrationByProvider(
        IntegrationProvider.PANDADOC,
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
      console.error('[PandaDocRoutes] Get template error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get PandaDoc template details'
      });
    }
  }
);

/**
 * Create document from template
 * 
 * POST /api/integrations/pandadoc/documents/from-template
 */
router.post(
  '/documents/from-template',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const integration = await integrationsService.getIntegrationByProvider(
        IntegrationProvider.PANDADOC,
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
      await AuditService.createAuditLog({
        userId,
        companyId,
        entity: 'integration',
        action: 'create',
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
      console.error('[PandaDocRoutes] Create document error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create document from template'
      });
    }
  }
);

/**
 * Get document details
 * 
 * GET /api/integrations/pandadoc/documents/:documentId
 */
router.get(
  '/documents/:documentId',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const integration = await integrationsService.getIntegrationByProvider(
        IntegrationProvider.PANDADOC,
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
      console.error('[PandaDocRoutes] Get document error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get document details'
      });
    }
  }
);

/**
 * Send document for signing
 * 
 * POST /api/integrations/pandadoc/documents/:documentId/send
 */
router.post(
  '/documents/:documentId/send',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const integration = await integrationsService.getIntegrationByProvider(
        IntegrationProvider.PANDADOC,
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
      await AuditService.createAuditLog({
        userId,
        companyId,
        entity: 'integration',
        action: 'update',
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
      console.error('[PandaDocRoutes] Send document error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send document'
      });
    }
  }
);

/**
 * Get document status
 * 
 * GET /api/integrations/pandadoc/documents/:documentId/status
 */
router.get(
  '/documents/:documentId/status',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const integration = await integrationsService.getIntegrationByProvider(
        IntegrationProvider.PANDADOC as IntegrationProvider,
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
      console.error('[PandaDoc Route] Failed to get document status:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get document status'
      });
    }
  }
);

/**
 * Download document
 * 
 * GET /api/integrations/pandadoc/documents/:documentId/download
 */
router.get(
  '/documents/:documentId/download',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const integration = await integrationsService.getIntegrationByProvider(
        IntegrationProvider.PANDADOC,
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
      await AuditService.createAuditLog({
        userId,
        companyId,
        entity: 'integration',
        action: 'read',
        details: {
          message: 'Document downloaded'
        }
      });
      
      // Set headers and send file
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `attachment; filename="document-${documentId}.pdf"`);
      return res.send(fileBuffer);
    } catch (error) {
      console.error('[PandaDocRoutes] Download document error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to download document'
      });
    }
  }
);

export default router;