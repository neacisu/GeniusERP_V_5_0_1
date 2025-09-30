/**
 * PandaDoc Routes (Controller-based version)
 * 
 * API routes for PandaDoc integration
 */

import express from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { pandaDocController } from '../controllers';

// Create router
const router = express.Router();

/**
 * Initialize PandaDoc integration
 * 
 * POST /api/integrations/pandadoc/initialize
 */
router.post(
  '/initialize',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard(['admin', 'manager']),
  (req, res, next) => pandaDocController.initialize(req, res).catch(next)
);

/**
 * List PandaDoc templates
 * 
 * GET /api/integrations/pandadoc/templates
 */
router.get(
  '/templates',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => pandaDocController.listTemplates(req, res).catch(next)
);

/**
 * Get PandaDoc template details
 * 
 * GET /api/integrations/pandadoc/templates/:templateId
 */
router.get(
  '/templates/:templateId',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => pandaDocController.getTemplate(req, res).catch(next)
);

/**
 * Create document from template
 * 
 * POST /api/integrations/pandadoc/documents/from-template
 */
router.post(
  '/documents/from-template',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => pandaDocController.createDocumentFromTemplate(req, res).catch(next)
);

/**
 * Get document details
 * 
 * GET /api/integrations/pandadoc/documents/:documentId
 */
router.get(
  '/documents/:documentId',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => pandaDocController.getDocument(req, res).catch(next)
);

/**
 * Send document for signing
 * 
 * POST /api/integrations/pandadoc/documents/:documentId/send
 */
router.post(
  '/documents/:documentId/send',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => pandaDocController.sendDocument(req, res).catch(next)
);

/**
 * Get document status
 * 
 * GET /api/integrations/pandadoc/documents/:documentId/status
 */
router.get(
  '/documents/:documentId/status',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => pandaDocController.getDocumentStatus(req, res).catch(next)
);

/**
 * Download document
 * 
 * GET /api/integrations/pandadoc/documents/:documentId/download
 */
router.get(
  '/documents/:documentId/download',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => pandaDocController.downloadDocument(req, res).catch(next)
);

export default router;