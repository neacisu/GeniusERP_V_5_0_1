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

import { DocumentService } from './services/document.service';
import { SignDocumentService } from './services/sign-document.service';
import { PandaDocService } from './services/pandadoc.service';
import { DocumentRegistryService } from './services/document-registry.service';
import { OcrService } from './services/ocr.service';
import { TemplateService } from './services/template.service';
import { ExchangeRateService } from '../../modules/integrations/services/exchange-rate.service';
// Import existing services
// The placeholder services don't need to be imported as we're using null exports

/**
 * Documents Module Registration
 * Centralizes all document-related services for use throughout the application
 */
export class DocumentsModule {
  /**
   * Register all document services
   */
  static register() {
    console.log('[DocumentsModule] 📄 Registering documents module services');
    
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
  static initialize() {
    console.log('[DocumentsModule] 📄 Initializing enterprise documents module');
    
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