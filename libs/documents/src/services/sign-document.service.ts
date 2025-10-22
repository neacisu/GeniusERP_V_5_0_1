/**
 * Sign Document Service
 * 
 * Service to handle document signing workflows with PandaDoc integration.
 * Uses Axios to call PandaDoc's API and tracks the signing flow per document.
 * Includes comprehensive audit logging for all document signing operations.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { documents } from '@geniuserp/shared';
import { pandaDocService } from './pandadoc.service';
import { Services, logAction } from "@common/services";
import { AuditAction } from '../../audit/services/audit.service';
import { Logger } from "@common/logger";

// Entity type for audit logs
export const DOCUMENT_ENTITY = 'document';

/**
 * Service for managing document signing workflows
 */
export class SignDocumentService {
  private db: ReturnType<typeof drizzle>;
  private queryClient: ReturnType<typeof postgres>;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SignDocumentService');
    this.logger.info('Service initialized');
    
    // Set up database connection
    this.queryClient = postgres(process.env.DATABASE_URL || '');
    this.db = drizzle(this.queryClient);
  }

  /**
   * Create a document directly from provided PDF content
   * 
   * @param name - Document name
   * @param pdfContent - Base64-encoded PDF content
   * @param signerEmail - Email of the person to sign the document
   * @param signerName - Name of the signer
   * @param options - Additional options
   */
  async createFromPdf(
    name: string,
    pdfContent: string,
    signerEmail: string,
    signerName: string,
    options?: {
      subject?: string;
      message?: string;
      fileName?: string;
      metadata?: Record<string, any>;
      tags?: string[];
      userId?: string;
      companyId?: string;
    }
  ) {
    try {
      this.logger.info(`Creating document from PDF content: ${name}`);
      
      // Separate first and last name (best effort)
      const nameParts = signerName.split(' ');
      const firstName = nameParts[0] || signerName;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Create document options
      const documentOptions = {
        name,
        recipients: [
          {
            email: signerEmail,
            firstName,
            lastName,
            role: 'signer'
          }
        ],
        metadata: options?.metadata || {},
        tags: options?.tags || ['erp', 'pdf-upload', 'document']
      };
      
      // Create content options
      const contentOptions = {
        content: pdfContent,
        fileName: options?.fileName || `${name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        fileType: 'application/pdf'
      };
      
      // Use the PandaDoc service to create document from content
      this.logger.info(`Creating document from PDF content`);
      const document = await pandaDocService.createDocumentFromContent(documentOptions, contentOptions);
      
      this.logger.info(`Document created from PDF with ID: ${document.id}`);
      
      // Allow some time for document processing before sending
      this.logger.info(`Waiting for document to process...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Send document for signature
      const sendResponse = await pandaDocService.sendDocument(
        document.id,
        options?.subject || 'Please sign this document',
        options?.message || 'This document requires your signature.'
      );
      
      this.logger.info(`Document sent for signing, status: ${sendResponse.status}`);
      
      // Create audit log entry for document creation and sending
      // Use the userId and companyId if provided, otherwise use system values
      if (options?.userId && options?.companyId) {
        await logAction({
          userId: options.userId,
          companyId: options.companyId,
          action: AuditAction.CREATE,
          entity: DOCUMENT_ENTITY,
          entityId: document.id,
          details: {
            operation: 'createFromPdf',
            documentName: name,
            fileName: contentOptions.fileName,
            signerEmail,
            signerName,
            sentForSigning: true,
            status: sendResponse.status,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return {
        pandaDocId: document.id,
        signerEmail,
        status: sendResponse.status,
        sentAt: new Date()
      };
    } catch (error: any) {
      this.logger.error(`Failed to create and sign PDF document: ${error.message}`);
      
      // Log the failure if userId and companyId are provided
      if (options?.userId && options?.companyId) {
        await logAction({
          userId: options.userId,
          companyId: options.companyId,
          action: 'CREATE_FAILED',
          entity: DOCUMENT_ENTITY,
          entityId: 'unknown',
          details: {
            operation: 'createFromPdf',
            documentName: name,
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      throw new Error(`Failed to create document from PDF: ${error.message}`);
    }
  }

  /**
   * Initiate signing process for a document
   * 
   * @param documentId - ID of the document to be signed
   * @param signerEmail - Email of the person to sign the document
   * @param signerName - Name of the signer
   * @param options - Additional options like subject, message, etc.
   */
  async sign(
    documentId: string, 
    signerEmail: string, 
    signerName: string,
    options?: {
      subject?: string;
      message?: string;
      role?: string;
      userId?: string;
      companyId?: string;
    }
  ) {
    try {
      this.logger.info(`Initiating signing process for document ${documentId}`);
      
      // Get the document from the database using Drizzle ORM
      const docsResult = await this.db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      
      const doc = docsResult[0];

      if (!doc) {
        this.logger.error(`Document ${documentId} not found`);
        
        // Log the failure if userId and companyId are provided
        if (options?.userId && options?.companyId) {
          await logAction({
            userId: options.userId,
            companyId: options.companyId,
            action: 'DOCUMENT_NOT_FOUND',
            entity: DOCUMENT_ENTITY,
            entityId: documentId,
            details: {
              operation: 'sign',
              error: 'Document not found',
              timestamp: new Date().toISOString()
            }
          });
        }
        
        throw new Error('Document not found');
      }

      // Separate first and last name (best effort)
      const nameParts = signerName.split(' ');
      const firstName = nameParts[0] || signerName;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Create PandaDoc document for signing
      // If the document is already in PandaDoc, we can retrieve by external ID
      // Otherwise, we need to create a new document
      let pandaDocResponse;

      // Get available template list to use one as a base
      this.logger.info(`Fetching available templates`);
      const templates = await pandaDocService.listTemplates();
      
      if (templates.length === 0) {
        this.logger.error('No templates available in PandaDoc account');
        
        // Log the failure if userId and companyId are provided
        if (options?.userId && options?.companyId) {
          await logAction({
            userId: options.userId,
            companyId: options.companyId,
            action: 'TEMPLATE_NOT_FOUND',
            entity: DOCUMENT_ENTITY,
            entityId: documentId,
            details: {
              operation: 'sign',
              error: 'No templates available in PandaDoc account',
              timestamp: new Date().toISOString()
            }
          });
        }
        
        throw new Error('No templates available in PandaDoc account');
      }
      
      // Get the first template
      const templateId = templates[0].id;
      this.logger.info(`Using template ID: ${templateId}`);
      
      // Get template details to find roles via direct axios call
      const templateDetailsResponse = await axios.get(
        `https://api.pandadoc.com/public/v1/templates/${templateId}/details`,
        {
          headers: {
            'Authorization': `API-Key ${process.env.PANDADOC_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract roles from template
      const roles = templateDetailsResponse.data.roles || [];
      if (roles.length === 0) {
        this.logger.error('No recipient roles defined in the template');
        
        // Log the failure if userId and companyId are provided
        if (options?.userId && options?.companyId) {
          await logAction({
            userId: options.userId,
            companyId: options.companyId,
            action: 'TEMPLATE_INVALID',
            entity: DOCUMENT_ENTITY,
            entityId: documentId,
            details: {
              operation: 'sign',
              templateId,
              error: 'No recipient roles defined in the template',
              timestamp: new Date().toISOString()
            }
          });
        }
        
        throw new Error('No recipient roles defined in the template');
      }
      
      // Find a client/signer role or use the first available role
      let roleName = roles[0].name;
      const roleNames = roles.map((r: { name: string }) => r.name.toLowerCase());
      if (roleNames.includes('client')) {
        roleName = 'Client';
      } else if (roleNames.includes('signer')) {
        roleName = 'Signer';
      } else if (roleNames.includes('recipient')) {
        roleName = 'Recipient';
      }
      
      this.logger.info(`Using role: ${roleName}`);
      
      // Create document options
      const documentOptions = {
        name: `${doc.type || 'Document'}-${documentId}`,
        templateId,
        recipients: [
          {
            email: signerEmail,
            firstName,
            lastName,
            role: roleName,
          }
        ],
        tokens: {
          "document_name": `${doc.type || 'Document'}-${documentId}`,
          "document_id": documentId,
          "created_date": new Date().toLocaleDateString()
        },
        tags: ['erp', 'automatic', doc.type || 'document']
      };
      
      // Create document based on type
      if (doc.filePath) {
        // For documents with file paths, use URL approach
        this.logger.info(`Creating document from URL: ${doc.filePath}`);
        
        // Create content options with URL
        const contentOptions = {
          url: doc.filePath
        };
        
        // Use createDocumentFromContent with URL
        const document = await pandaDocService.createDocumentFromContent(documentOptions, contentOptions);
        pandaDocResponse = document;
      } else {
        // Document doesn't have a file path, use template-based approach
        this.logger.info(`Creating document from template`);
        
        const document = await pandaDocService.createDocument(documentOptions);
        pandaDocResponse = document;
      }
      
      this.logger.info(`Document created in PandaDoc with ID: ${pandaDocResponse.id}`);
      
      // Send document for signing
      const sendResponse = await pandaDocService.sendDocument(
        pandaDocResponse.id,
        options?.subject || 'Please sign this document',
        options?.message || 'This document requires your signature.'
      );
      
      this.logger.info(`Document sent for signing, status: ${sendResponse.status}`);
      
      // Update our document record with PandaDoc info using Drizzle ORM
      // This could be extended to store the PandaDoc ID in a separate table
      await this.db
        .update(documents)
        .set({ updatedAt: new Date() })
        .where(eq(documents.id, documentId));
      
      // Create audit log entry for signing process
      if (options?.userId && options?.companyId) {
        await logAction({
          userId: options.userId,
          companyId: options.companyId,
          action: AuditAction.CREATE,
          entity: DOCUMENT_ENTITY,
          entityId: documentId,
          details: {
            operation: 'sign',
            pandaDocId: pandaDocResponse.id,
            documentName: documentOptions.name,
            templateId,
            signerEmail,
            signerName,
            sentForSigning: true,
            status: sendResponse.status,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return {
        documentId,
        pandaDocId: pandaDocResponse.id,
        signerEmail,
        status: sendResponse.status,
        sentAt: new Date()
      };
    } catch (error: any) {
      this.logger.error(`Failed to sign document ${documentId}: ${error.message}`);
      
      // Log the failure if userId and companyId are provided
      if (options?.userId && options?.companyId) {
        await logAction({
          userId: options.userId,
          companyId: options.companyId,
          action: 'SIGN_FAILED',
          entity: DOCUMENT_ENTITY,
          entityId: documentId,
          details: {
            operation: 'sign',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      throw new Error(`Failed to initiate document signing: ${error.message}`);
    }
  }

  /**
   * Check status of a signing process
   * 
   * @param pandaDocId - PandaDoc document ID
   * @param options - Additional options like userId and companyId for audit logging
   */
  async checkSigningStatus(
    pandaDocId: string,
    options?: {
      userId?: string;
      companyId?: string;
    }
  ) {
    try {
      this.logger.info(`Checking signing status for PandaDoc document ${pandaDocId}`);
      
      const docStatus = await pandaDocService.getDocument(pandaDocId);
      
      this.logger.info(`Document status: ${docStatus.status}`);
      
      // Create audit log entry for status check
      if (options?.userId && options?.companyId) {
        await logAction({
          userId: options.userId,
          companyId: options.companyId,
          action: AuditAction.VIEW,
          entity: DOCUMENT_ENTITY,
          entityId: pandaDocId,
          details: {
            operation: 'checkSigningStatus',
            status: docStatus.status,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return {
        pandaDocId,
        status: docStatus.status,
        updatedAt: new Date()
      };
    } catch (error: any) {
      this.logger.error(`Failed to check document status ${pandaDocId}: ${error.message}`);
      
      // Log the failure if userId and companyId are provided
      if (options?.userId && options?.companyId) {
        await logAction({
          userId: options.userId,
          companyId: options.companyId,
          action: 'STATUS_CHECK_FAILED',
          entity: DOCUMENT_ENTITY,
          entityId: pandaDocId,
          details: {
            operation: 'checkSigningStatus',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      throw new Error(`Failed to check document signing status: ${error.message}`);
    }
  }

  /**
   * Generate a share link for a document being signed
   * 
   * @param pandaDocId - PandaDoc document ID
   * @param expiresIn - Link expiration in seconds (default: 1 day)
   * @param options - Additional options like userId and companyId for audit logging
   */
  async generateSigningLink(
    pandaDocId: string, 
    expiresIn: number = 86400,
    options?: {
      userId?: string;
      companyId?: string;
    }
  ) {
    try {
      this.logger.info(`Generating signing link for PandaDoc document ${pandaDocId}`);
      
      // Use the PandaDocService instead of direct axios call for consistency and error handling
      const result = await pandaDocService.createShareLink(pandaDocId, expiresIn);
      
      this.logger.info(`Signing link generated: ${result.link}`);
      
      // Create audit log entry for link generation
      if (options?.userId && options?.companyId) {
        await logAction({
          userId: options.userId,
          companyId: options.companyId,
          action: AuditAction.CREATE,
          entity: DOCUMENT_ENTITY,
          entityId: pandaDocId,
          details: {
            operation: 'generateSigningLink',
            linkGenerated: true,
            expiresIn,
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return {
        pandaDocId,
        link: result.link,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
      };
    } catch (error: any) {
      this.logger.error(`Failed to generate signing link ${pandaDocId}: ${error.message}`);
      
      // If there's an error with API, at least try to return a status
      try {
        const status = await pandaDocService.getDocument(pandaDocId);
        this.logger.info(`Document status: ${status.status}`);
        
        // Log the fallback link generation if userId and companyId are provided
        if (options?.userId && options?.companyId) {
          await logAction({
            userId: options.userId,
            companyId: options.companyId,
            action: 'LINK_GENERATION_FALLBACK',
            entity: DOCUMENT_ENTITY,
            entityId: pandaDocId,
            details: {
              operation: 'generateSigningLink',
              fallbackLinkGenerated: true,
              documentStatus: status.status,
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        // Generate a fallback link that could work once document is fully processed
        return {
          pandaDocId,
          link: `https://app.pandadoc.com/documents/${pandaDocId}`,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          status: status.status,
          isTemporary: true,
          message: 'Document is still processing. This link will be available once processing is complete.'
        };
      } catch (statusError: any) {
        this.logger.error(`Also failed to get document status: ${statusError.message}`);
        
        // Log the complete failure if userId and companyId are provided
        if (options?.userId && options?.companyId) {
          await logAction({
            userId: options.userId,
            companyId: options.companyId,
            action: 'LINK_GENERATION_FAILED',
            entity: DOCUMENT_ENTITY,
            entityId: pandaDocId,
            details: {
              operation: 'generateSigningLink',
              error: error.message,
              statusCheckError: statusError.message,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
      
      throw new Error(`Failed to generate document signing link: ${error.message}`);
    }
  }
}

// Export singleton instance
export const signDocumentService = new SignDocumentService();