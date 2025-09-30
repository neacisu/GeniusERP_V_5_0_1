/**
 * Sign Document Service
 * 
 * Service to handle document signing workflows with PandaDoc integration.
 * Uses Axios to call PandaDoc's API and tracks the signing flow per document.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { pandaDocService } from './pandadoc.service';

/**
 * Service for managing document signing workflows
 */
export class SignDocumentService {
  private db: ReturnType<typeof drizzle>;
  private queryClient: ReturnType<typeof postgres>;

  constructor() {
    console.log('[SignDocumentService] 📝 Service initialized');
    
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
    }
  ) {
    try {
      console.log(`[SignDocumentService] 🔏 Creating document from PDF content: ${name}`);
      
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
      console.log(`[SignDocumentService] 📄 Creating document from PDF content`);
      const document = await pandaDocService.createDocumentFromContent(documentOptions, contentOptions);
      
      console.log(`[SignDocumentService] ✅ Document created from PDF with ID: ${document.id}`);
      
      // Allow some time for document processing before sending
      console.log(`[SignDocumentService] ⏳ Waiting for document to process...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Send document for signature
      const sendResponse = await pandaDocService.sendDocument(
        document.id,
        options?.subject || 'Please sign this document',
        options?.message || 'This document requires your signature.'
      );
      
      console.log(`[SignDocumentService] ✅ Document sent for signing, status: ${sendResponse.status}`);
      
      return {
        pandaDocId: document.id,
        signerEmail,
        status: sendResponse.status,
        sentAt: new Date()
      };
    } catch (error: any) {
      console.error(`[SignDocumentService] ❌ Failed to create and sign PDF document:`, error.message);
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
    }
  ) {
    try {
      console.log(`[SignDocumentService] 🔏 Initiating signing process for document ${documentId}`);
      
      // Get the document from the database using simple SQL query instead of drizzle query
      const docsResult = await this.queryClient`
        SELECT * FROM documents WHERE id = ${documentId} LIMIT 1
      `;
      
      const doc = docsResult[0];

      if (!doc) {
        console.error(`[SignDocumentService] ❌ Document ${documentId} not found`);
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
      console.log(`[SignDocumentService] 🔍 Fetching available templates`);
      const templates = await pandaDocService.listTemplates();
      
      if (templates.length === 0) {
        throw new Error('No templates available in PandaDoc account');
      }
      
      // Get the first template
      const templateId = templates[0].id;
      console.log(`[SignDocumentService] 📝 Using template ID: ${templateId}`);
      
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
      
      console.log(`[SignDocumentService] 👤 Using role: ${roleName}`);
      
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
      if (doc.file_path) {
        // For documents with file paths, use URL approach
        console.log(`[SignDocumentService] 📄 Creating document from URL: ${doc.file_path}`);
        
        // Create content options with URL
        const contentOptions = {
          url: doc.file_path
        };
        
        // Use createDocumentFromContent with URL
        const document = await pandaDocService.createDocumentFromContent(documentOptions, contentOptions);
        pandaDocResponse = document;
      } else {
        // Document doesn't have a file path, use template-based approach
        console.log(`[SignDocumentService] 📄 Creating document from template`);
        
        const document = await pandaDocService.createDocument(documentOptions);
        pandaDocResponse = document;
      }
      
      console.log(`[SignDocumentService] ✅ Document created in PandaDoc with ID: ${pandaDocResponse.id}`);
      
      // Send document for signing
      const sendResponse = await pandaDocService.sendDocument(
        pandaDocResponse.id,
        options?.subject || 'Please sign this document',
        options?.message || 'This document requires your signature.'
      );
      
      console.log(`[SignDocumentService] ✅ Document sent for signing, status: ${sendResponse.status}`);
      
      // Update our document record with PandaDoc info using SQL instead of Drizzle ORM
      // This could be extended to store the PandaDoc ID in a separate table
      const updatedAt = new Date().toISOString();
      await this.queryClient`
        UPDATE documents
        SET updated_at = ${updatedAt}
        WHERE id = ${documentId}
      `;
      
      return {
        documentId,
        pandaDocId: pandaDocResponse.id,
        signerEmail,
        status: sendResponse.status,
        sentAt: new Date()
      };
    } catch (error: any) {
      console.error(`[SignDocumentService] ❌ Failed to sign document ${documentId}:`, error.message);
      throw new Error(`Failed to initiate document signing: ${error.message}`);
    }
  }

  /**
   * Check status of a signing process
   * 
   * @param pandaDocId - PandaDoc document ID
   */
  async checkSigningStatus(pandaDocId: string) {
    try {
      console.log(`[SignDocumentService] 🔍 Checking signing status for PandaDoc document ${pandaDocId}`);
      
      const docStatus = await pandaDocService.getDocument(pandaDocId);
      
      console.log(`[SignDocumentService] ✅ Document status: ${docStatus.status}`);
      
      return {
        pandaDocId,
        status: docStatus.status,
        updatedAt: new Date()
      };
    } catch (error: any) {
      console.error(`[SignDocumentService] ❌ Failed to check document status ${pandaDocId}:`, error.message);
      throw new Error(`Failed to check document signing status: ${error.message}`);
    }
  }

  /**
   * Generate a share link for a document being signed
   * 
   * @param pandaDocId - PandaDoc document ID
   * @param expiresIn - Link expiration in seconds (default: 1 day)
   */
  async generateSigningLink(pandaDocId: string, expiresIn: number = 86400) {
    try {
      console.log(`[SignDocumentService] 🔗 Generating signing link for PandaDoc document ${pandaDocId}`);
      
      // Use the PandaDocService instead of direct axios call for consistency and error handling
      const result = await pandaDocService.createShareLink(pandaDocId, expiresIn);
      
      console.log(`[SignDocumentService] ✅ Signing link generated: ${result.link}`);
      
      return {
        pandaDocId,
        link: result.link,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
      };
    } catch (error: any) {
      console.error(`[SignDocumentService] ❌ Failed to generate signing link ${pandaDocId}:`, error.message);
      
      // If there's an error with API, at least try to return a status
      try {
        const status = await pandaDocService.getDocument(pandaDocId);
        console.log(`[SignDocumentService] ℹ️ Document status: ${status.status}`);
        
        // Generate a fallback link that could work once document is fully processed
        return {
          pandaDocId,
          link: `https://app.pandadoc.com/documents/${pandaDocId}`,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          status: status.status,
          isTemporary: true,
          message: 'Document is still processing. This link will be available once processing is complete.'
        };
      } catch (statusError) {
        console.error(`[SignDocumentService] ❌ Also failed to get document status:`, statusError);
      }
      
      throw new Error(`Failed to generate document signing link: ${error.message}`);
    }
  }
}

// Export singleton instance
export const signDocumentService = new SignDocumentService();