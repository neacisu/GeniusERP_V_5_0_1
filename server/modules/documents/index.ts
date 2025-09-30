/**
 * Documents Module
 * 
 * A comprehensive enterprise-grade document management system that provides:
 * - Document creation, versioning, and management
 * - OCR and text extraction capabilities
 * - Document registry for incoming and outgoing documents
 * - Template management and document generation
 * - Electronic signature integration with PandaDoc
 */

import express, { Router } from 'express';
import { initDocumentRoutes } from './routes/document.routes';
import { DocumentsModule } from './documents.module';

/**
 * Initialize documents module
 */
export function initDocumentsModule(): Router {
  console.log('[documents-module] 📄 Initializing documents module');
  
  // Initialize the module structure
  const moduleInfo = DocumentsModule.initialize();
  console.log(`[documents-module] 📚 Registered ${moduleInfo.serviceCount} document services`);
  
  const router = Router();
  
  // Register document routes
  const documentRoutes = initDocumentRoutes();
  router.use('/', documentRoutes);
  
  console.log('[documents-module] 🔗 Document routes registered');
  
  // Return router for express app
  return router;
}

// Export all services from the Documents Module
export { DocumentsModule } from './documents.module';
export { documentService } from './services/document.service';
export { pandaDocService } from './services/pandadoc.service';
export { signDocumentService } from './services/sign-document.service';
export { documentRegistryService } from './services/document-registry.service';
export { ocrService } from './services/ocr.service';
export { templateService } from './services/template.service';