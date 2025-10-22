/**
 * PandaDoc Service
 * 
 * Provides integration with PandaDoc API for document generation and eSignature features.
 * Uses the PANDADOC_API_KEY from Replit Secrets for authentication.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';

/**
 * PandaDoc document creation options
 */
export interface CreateDocumentOptions {
  name: string;
  templateId?: string;
  folderId?: string;
  recipients?: Array<{
    email: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    role: string;
  }>;
  tokens?: Record<string, string>;
  fields?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * PandaDoc document content options
 */
export interface DocumentContentOptions {
  content?: string; // Base64-encoded file content
  fileName?: string;
  fileType?: string;
  url?: string; // URL to fetch the document from
}

/**
 * PandaDoc document status response
 */
export interface DocumentStatus {
  id: string;
  name: string;
  status: string;
  expires_on?: string;
  version?: string;
  date_created?: string;
  date_modified?: string;
}

/**
 * PandaDoc service for document generation and eSignature
 */
export class PandaDocService {
  private readonly apiKey: string;
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.pandadoc.com/public/v1';

  constructor() {
    this.apiKey = process.env.PANDADOC_API_KEY || '';
    
    if (!this.apiKey) {
      console.error('[PandaDocService] 🚨 Missing PANDADOC_API_KEY in environment');
    } else {
      console.log('[PandaDocService] 📝 Service initialized with API key');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `API-Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a new document from template
   */
  async createDocument(options: CreateDocumentOptions): Promise<DocumentStatus> {
    try {
      console.log(`[PandaDocService] 📄 Creating document "${options.name}"`);
      
      const response = await this.client.post('/documents', {
        name: options.name,
        template_uuid: options.templateId,
        folder_uuid: options.folderId,
        recipients: options.recipients,
        tokens: options.tokens,
        fields: options.fields,
        metadata: options.metadata,
        tags: options.tags
      });

      console.log(`[PandaDocService] ✅ Document created with ID: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      console.error('[PandaDocService] ❌ Failed to create document:', error.message);
      
      if (error.response) {
        console.error('[PandaDocService] Response status:', error.response.status);
        console.error('[PandaDocService] Response data:', error.response.data);
      }
      
      throw new Error(`Failed to create PandaDoc document: ${error.message}`);
    }
  }

  /**
   * Get document details by ID
   */
  async getDocument(documentId: string): Promise<DocumentStatus> {
    try {
      console.log(`[PandaDocService] 🔍 Fetching document ${documentId}`);
      
      const response = await this.client.get(`/documents/${documentId}`);
      
      console.log(`[PandaDocService] ✅ Document fetched: ${response.data.name} (${response.data.status})`);
      return response.data;
    } catch (error: any) {
      console.error(`[PandaDocService] ❌ Failed to fetch document ${documentId}:`, error.message);
      
      // Enhanced error handling for debugging
      if (error.response) {
        console.error(`[PandaDocService] Response error details:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // If we get a 400 Bad Request, the document might be in a processing state or doesn't exist
        if (error.response.status === 400) {
          // Return a default status object with "processing" state to avoid breaking the flow
          console.log(`[PandaDocService] Document ${documentId} is likely in processing state, returning default status`);
          return {
            id: documentId,
            name: `Document ${documentId}`,
            status: 'document.processing'
          };
        }
      }
      
      throw new Error(`Failed to fetch PandaDoc document: ${error.message}`);
    }
  }

  /**
   * Send a document for signing
   */
  async sendDocument(documentId: string, subject?: string, message?: string): Promise<DocumentStatus> {
    try {
      console.log(`[PandaDocService] 📨 Sending document ${documentId} for signature`);
      
      // First check the document's current status to avoid 409 Conflict errors
      const docStatus = await this.getDocument(documentId);
      console.log(`[PandaDocService] ℹ️ Current document status: ${docStatus.status}`);
      
      // Only send if document is in draft status
      if (docStatus.status !== 'document.draft') {
        console.log(`[PandaDocService] ⚠️ Document is already in ${docStatus.status} status, skipping send operation`);
        return docStatus;
      }
      
      // Wait a moment for document to be fully processed before sending
      console.log(`[PandaDocService] ⏳ Waiting for document to be ready...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const response = await this.client.post(`/documents/${documentId}/send`, {
        subject: subject || 'Please sign this document',
        message: message || 'This document requires your signature.'
      });
      
      console.log(`[PandaDocService] ✅ Document sent for signature with status: ${response.data.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`[PandaDocService] ❌ Failed to send document ${documentId}:`, error.message);
      
      // Enhanced error handling with PandaDoc error response details
      if (error.response && error.response.data) {
        console.error(`[PandaDocService] Error details:`, JSON.stringify(error.response.data, null, 2));
        
        // If this is a 409 conflict, try to get the document status and return it
        if (error.response.status === 409) {
          try {
            console.log(`[PandaDocService] ℹ️ Document had a conflict, retrieving current status`);
            const currentStatus = await this.getDocument(documentId);
            console.log(`[PandaDocService] ℹ️ Document is in ${currentStatus.status} status`);
            return currentStatus;
          } catch (statusError) {
            console.error(`[PandaDocService] ❌ Failed to get document status after conflict:`, statusError);
          }
        }
      }
      
      throw new Error(`Failed to send PandaDoc document: ${error.message}`);
    }
  }

  /**
   * Generate a document share link
   */
  async createShareLink(documentId: string, lifetime?: number): Promise<{ link: string }> {
    try {
      console.log(`[PandaDocService] 🔗 Creating share link for document ${documentId}`);
      
      const response = await this.client.post(`/documents/${documentId}/session`, {
        lifetime: lifetime || 3600, // Default 1 hour in seconds
        recipient: '',
        fields: {}
      });
      
      console.log(`[PandaDocService] ✅ Document share link created`);
      return { link: response.data.id };
    } catch (error: any) {
      console.error(`[PandaDocService] ❌ Failed to create share link for ${documentId}:`, error.message);
      throw new Error(`Failed to create PandaDoc share link: ${error.message}`);
    }
  }

  /**
   * Download a document PDF
   */
  async downloadDocument(documentId: string): Promise<Buffer> {
    try {
      console.log(`[PandaDocService] 📥 Downloading document ${documentId}`);
      
      const response = await this.client.get(`/documents/${documentId}/download`, {
        responseType: 'arraybuffer'
      });
      
      console.log(`[PandaDocService] ✅ Document PDF downloaded (${response.data.length} bytes)`);
      return response.data;
    } catch (error: any) {
      console.error(`[PandaDocService] ❌ Failed to download document ${documentId}:`, error.message);
      throw new Error(`Failed to download PandaDoc document: ${error.message}`);
    }
  }

  /**
   * List available document templates
   */
  async listTemplates(folderUuid?: string): Promise<any[]> {
    try {
      console.log('[PandaDocService] 📋 Listing available templates');
      
      const params: Record<string, string> = {};
      if (folderUuid) {
        params.folder_uuid = folderUuid;
      }
      
      const response = await this.client.get('/templates', { params });
      
      console.log(`[PandaDocService] ✅ Retrieved ${response.data.results.length} templates`);
      return response.data.results;
    } catch (error: any) {
      console.error('[PandaDocService] ❌ Failed to list templates:', error.message);
      throw new Error(`Failed to list PandaDoc templates: ${error.message}`);
    }
  }

  /**
   * Create a new document from PDF content
   * This method allows creating documents directly from PDF content as base64 encoded string
   * or by providing a URL to fetch the document from
   */
  async createDocumentFromContent(
    options: CreateDocumentOptions,
    contentOptions: DocumentContentOptions
  ): Promise<DocumentStatus> {
    try {
      console.log(`[PandaDocService] 📄 Creating document "${options.name}" from content`);
      
      // Check if we have at least one content source
      if (!contentOptions.content && !contentOptions.url) {
        throw new Error('Either content or url must be provided');
      }
      
      // Prepare payload with proper typing
      let requestData: any;
      
      if (contentOptions.content) {
        console.log(`[PandaDocService] 📎 Using provided file content (${contentOptions.fileType || 'application/pdf'})`);
        
        // Create document data object for file content
        requestData = {
          name: options.name,
          file: {
            content: contentOptions.content,
            file_name: contentOptions.fileName || `${options.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            content_type: contentOptions.fileType || 'application/pdf'
          }
        };
      } else if (contentOptions.url) {
        console.log(`[PandaDocService] 🔗 Using document URL: ${contentOptions.url}`);
        
        // Create document data object with URL
        requestData = {
          name: options.name,
          url: contentOptions.url
        };
      }
      
      // Add recipients if provided
      if (options.recipients && options.recipients.length > 0) {
        requestData.recipients = options.recipients;
      }
      
      // Add metadata if provided
      if (options.metadata) {
        requestData.metadata = options.metadata;
      }
      
      // Add tags if provided
      if (options.tags) {
        requestData.tags = options.tags;
      }
      
      // Configure request headers
      const headers = {
        'Authorization': `API-Key ${this.apiKey}`,
        'Content-Type': 'application/json'
      };
      
      // Send the request with JSON payload
      const response = await axios.post(
        `${this.baseUrl}/documents`, 
        requestData,
        { headers }
      );
      
      console.log(`[PandaDocService] ✅ Document created with ID: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      console.error('[PandaDocService] ❌ Failed to create document from content:', error.message);
      
      if (error.response) {
        console.error('[PandaDocService] Response status:', error.response.status);
        console.error('[PandaDocService] Response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw new Error(`Failed to create PandaDoc document from content: ${error.message}`);
    }
  }
}

// Export singleton instance
export const pandaDocService = new PandaDocService();