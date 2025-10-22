/**
 * Documents Module
 * 
 * A comprehensive enterprise-grade documents system that centralizes all document
 * workflows in the Romanian accounting ERP. This module provides:
 * 
 * - OCR & intelligent document parsing
 * - Full archive and versioning system
 * - PandaDoc-based eSignature flows
 * - Incoming/outgoing registry (Registru intrări/ieșiri documente)
 * - Custom ERP templates for invoices, contracts, orders, etc.
 * - Embedded editor support
 * - Unique document indexing and auto-numbering
 * - Text + semantic content search (for OCR/metadata)
 * - Email & file attachments routing into archive
 */

import { Express } from 'express';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { DocumentController } from './controllers/document.controller';
import { DocumentService } from './services/document.service';
import { SignDocumentService } from './services/sign-document.service';
import { PandaDocService } from './services/pandadoc.service';
import { DocumentRegistryService } from './services/document-registry.service';
import { OcrService } from './services/ocr.service';
import { TemplateService } from './services/template.service';
import { ExchangeRateService } from '@geniuserp/integrations/services/exchange-rate.service';
import { Logger } from '../../common/logger';

// Create a logger for the documents module
const logger = new Logger('DocumentsModule');

/**
 * Documents Module Registration
 * Centralizes all document-related services for use throughout the application
 */
export class DocumentsModule {
  private readonly documentController: DocumentController;
  
  /**
   * Create an instance of the Documents Module
   */
  constructor(private readonly db: DrizzleService) {
    const documentService = new DocumentService(db);
    this.documentController = new DocumentController(documentService);
  }
  
  /**
   * Initialize the module and register routes
   */
  initialize(app: Express): void {
    logger.info('Initializing enterprise documents module');
    this.documentController.registerRoutes(app);
  }

  /**
   * Register all document services (static version for backward compatibility)
   */
  static register() {
    logger.info('Registering documents module services');
    
    return {
      services: {
        // Core Document Management
        document: DocumentService,           // Document versioning system
        registry: DocumentRegistryService,   // Incoming/outgoing document registry
        
        // Document Processing & Intelligence
        ocr: OcrService,                     // Text extraction & document parsing
        template: TemplateService,           // Custom ERP document templates
        
        // Electronic Signatures & Integrations
        sign: SignDocumentService,           // Document signing orchestration
        pandadoc: PandaDocService,           // PandaDoc API integration
        
        // Supporting Services
        exchangeRate: ExchangeRateService,   // Currency conversion in templates
      }
    };
  }
  
  /**
   * Initialize the documents module and return a structure report
   */
  static structureReport() {
    logger.info('Generating module structure report');
    
    const registeredServices = this.register();
    
    return {
      name: 'Documents Module',
      description: 'Enterprise-grade document management system',
      version: '2.0.0',
      serviceCount: Object.keys(registeredServices.services).length,
      capabilities: [
        'Document versioning & archiving',
        'Electronic signatures (PandaDoc)',
        'OCR text extraction & parsing',
        'Document registry (incoming/outgoing)',
        'Custom template management',
        'Email attachment processing',
        'Embedded document editor',
        'Full-text & semantic search',
        'Automatic document numbering'
      ]
    };
  }
}

// Export singleton instances for easy access
export { documentService } from './services/document.service';
export { signDocumentService } from './services/sign-document.service';
export { pandaDocService } from './services/pandadoc.service';
export { documentRegistryService } from './services/document-registry.service';
export { ocrService } from './services/ocr.service';
export { templateService } from './services/template.service';

// Export future services (will be implemented in upcoming steps)
// These exports will be properly linked once the services are developed
export const documentSearchService = null; // Placeholder for upcoming search service
export const emailAttachmentService = null; // Placeholder for upcoming email attachment service
export const documentEditorService = null; // Placeholder for upcoming editor service