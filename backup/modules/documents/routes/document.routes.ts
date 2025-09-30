/**
 * Document Routes
 * 
 * Defines API routes for document operations with comprehensive JWT and RBAC protection
 */

import { Router } from 'express';
import multer from 'multer';
import { documentController } from '../controllers/document.controller';
import { signDocumentController } from '../controllers/sign-document.controller';
import { documentRegistryController } from '../controllers/document-registry.controller';
import { ocrController } from '../controllers/ocr.controller';
import { templateController } from '../controllers/template.controller';
import authGuard from '../../auth/guards/auth.guard';
import { JwtAuthMode, UserRole } from '../../auth/types';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export function initDocumentRoutes(): Router {
  const router = Router();

  // Apply authentication guard to all document routes

  // === Template Management Routes ===
  router.get('/templates', authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]), 
    documentController.listTemplates.bind(documentController));

  // === Document Creation & Management ===
  router.post('/versioned/create', 
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.DOCUMENT_MANAGER]),
    documentController.createVersionedDocument.bind(documentController));

  router.get('/versioned/:id', 
    authGuard.requireAuth(),
    authGuard.requireCompanyAccess('companyId'),
    documentController.getVersionedDocument.bind(documentController));

  router.post('/versioned/:id/version',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.DOCUMENT_MANAGER]),
    authGuard.requireCompanyAccess('companyId'),
    documentController.addDocumentVersion.bind(documentController));

  router.patch('/versioned/:id',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.DOCUMENT_MANAGER]),
    authGuard.requireCompanyAccess('companyId'),
    documentController.updateDocumentMetadata.bind(documentController));

  router.delete('/versioned/:id',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.DOCUMENT_MANAGER]),
    authGuard.requireCompanyAccess('companyId'),
    documentController.deleteDocument.bind(documentController));


  // === Document Signing Routes ===
  router.post('/sign/pdf/upload',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.DOCUMENT_MANAGER]),
    signDocumentController.uploadPdfForSigning.bind(signDocumentController));

  router.post('/sign/:id',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
    authGuard.requireCompanyAccess('companyId'),
    signDocumentController.signDocument.bind(signDocumentController));

  // === Document Registry Routes ===
  router.post('/registry/:id',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.DOCUMENT_MANAGER]),
    documentRegistryController.registerDocument.bind(documentRegistryController));

  router.get('/registry/search',
    authGuard.requireAuth(),
    authGuard.requireCompanyAccess('companyId'),
    documentRegistryController.searchRegistry.bind(documentRegistryController));

  // === OCR Routes ===
  router.post('/ocr/:id',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.DOCUMENT_MANAGER]),
    ocrController.processDocument.bind(ocrController));

  router.get('/ocr/search',
    authGuard.requireAuth(),
    authGuard.requireCompanyAccess('companyId'),
    ocrController.searchByText.bind(ocrController));

  // === Template Management Routes ===
  router.post('/templates/create',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
    templateController.createTemplate.bind(templateController));

  router.put('/templates/:id',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
    templateController.updateTemplate.bind(templateController));

  router.get('/templates/:id',
    authGuard.requireAuth(),
    authGuard.requireCompanyAccess('companyId'),
    templateController.getTemplate.bind(templateController));

  router.post('/templates/:templateId/generate',
    authGuard.requireRoles([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.DOCUMENT_MANAGER]),
    templateController.generateFromTemplate.bind(templateController));

  return router;
}