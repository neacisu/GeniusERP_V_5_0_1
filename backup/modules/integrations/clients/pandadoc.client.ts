/**
 * PandaDoc Integration Client
 * 
 * Client for PandaDoc document signing service.
 * Allows creating and managing electronic signature documents.
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { BaseIntegrationClient } from './base-integration.client';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';

/**
 * Document status in PandaDoc
 */
export enum PandaDocDocumentStatus {
  DOCUMENT_DRAFT = 'document.draft',
  DOCUMENT_SENT = 'document.sent',
  DOCUMENT_COMPLETED = 'document.completed',
  DOCUMENT_VIEWED = 'document.viewed',
  DOCUMENT_REJECTED = 'document.rejected',
  DOCUMENT_WAITING_APPROVAL = 'document.waiting_approval',
  DOCUMENT_APPROVED = 'document.approved',
  DOCUMENT_DECLINED = 'document.declined',
  DOCUMENT_EXTERNAL_REVIEW = 'document.external_review',
  DOCUMENT_CHANGE_REQUESTED = 'document.change_requested'
}

/**
 * PandaDoc document recipient role
 * These roles depend on the template being used - they're not fixed values.
 * Common role names include 'Client', 'Sender', etc.
 */
export type PandaDocRecipientRole = string;

/**
 * Template recipient
 */
export interface PandaDocTemplateRecipient {
  id: string;
  role: string;
  name: string;
  email: string;
  signingOrder: number;
}

/**
 * Template response
 */
export interface PandaDocTemplate {
  id: string;
  name: string;
  version: string;
  dateCreated: string;
  dateModified: string;
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  recipients: PandaDocTemplateRecipient[];
  metadata: Record<string, any>;
}

/**
 * Document recipient
 */
export interface PandaDocDocumentRecipient {
  email: string;
  firstName: string;
  lastName: string;
  role: PandaDocRecipientRole;
  signingOrder?: number;
}

/**
 * Document response
 */
export interface PandaDocDocument {
  id: string;
  name: string;
  status: PandaDocDocumentStatus;
  dateCreated: string;
  dateModified: string;
  expirationDate?: string;
  metadata?: Record<string, any>;
  recipients: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    id: string;
    signingOrder?: number;
    hasCompleted?: boolean;
  }[];
  version: string;
  uuid: string;
}

/**
 * Document status response
 */
export interface PandaDocDocumentStatus {
  id: string;
  status: PandaDocDocumentStatus;
  statusTimestamps: Record<string, string>;
  recipient?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Document download response
 */
export interface PandaDocDocumentDownload {
  document: {
    id: string;
    status: PandaDocDocumentStatus;
  };
  file: {
    name: string;
    url: string;
    contentType: string;
  };
}

/**
 * Document session response
 */
export interface PandaDocDocumentSession {
  id: string;
  document: {
    id: string;
    status: string;
  };
  session: {
    id: string;
    expires: string;
    links: {
      document: string;
      edit?: string;
    };
  };
}

/**
 * PandaDoc client implementation
 */
export class PandaDocClient extends BaseIntegrationClient {
  private readonly apiUrl = 'https://api.pandadoc.com/public/v1';
  private axios: AxiosInstance;
  private integration: Integration | null = null;

  /**
   * Initialize PandaDoc client
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.PANDADOC, companyId, franchiseId);
    this.axios = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Initialize integration with PandaDoc
   * @param apiKey PandaDoc API key
   * @param userId User ID initializing the integration
   */
  async initialize(apiKey: string, userId: string): Promise<Integration> {
    try {
      // Check if integration already exists
      const existingIntegration = await this.getIntegrationRecord();
      
      if (existingIntegration) {
        throw new Error('PandaDoc integration already exists for this company');
      }
      
      // Test connection
      await this.testConnection(apiKey);
      
      // Create integration record
      const integration = await this.createIntegrationRecord(
        { apiKey },
        userId
      );
      
      this.integration = integration;
      
      await this.updateStatus(
        integration.id,
        IntegrationStatus.ACTIVE,
        userId
      );
      
      return integration;
    } catch (error) {
      throw new Error(`Failed to initialize PandaDoc integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Test connection to PandaDoc API
   * @param apiKey Optional API key to use for testing
   */
  async testConnection(apiKey?: string): Promise<boolean> {
    try {
      // If no API key provided, get from integration record
      if (!apiKey) {
        const integration = await this.getIntegrationRecord();
        if (!integration) {
          throw new Error('PandaDoc integration not found');
        }
        
        this.integration = integration;
        apiKey = integration.config.apiKey;
      }
      
      if (!apiKey) {
        throw new Error('API key not found');
      }
      
      // Make a simple API call to verify connection
      await this.axios.get('/templates', {
        headers: {
          'Authorization': `API-Key ${apiKey}`
        }
      });
      
      return true;
    } catch (error) {
      console.error('[PandaDocClient] Connection test failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * List templates available in PandaDoc
   * @param userId User ID making the request
   */
  async listTemplates(userId: string): Promise<PandaDocTemplate[]> {
    try {
      const integration = await this.ensureIntegration();
      
      const response = await this.axios.get('/templates', {
        headers: {
          'Authorization': `API-Key ${integration.config.apiKey}`
        }
      });
      
      await this.updateLastSynced(integration.id, userId);
      
      return response.data.results;
    } catch (error) {
      throw new Error(`Failed to list templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get template details
   * @param templateId Template ID
   * @param userId User ID making the request
   */
  async getTemplate(templateId: string, userId: string): Promise<PandaDocTemplate> {
    try {
      const integration = await this.ensureIntegration();
      
      const response = await this.axios.get(`/templates/${templateId}`, {
        headers: {
          'Authorization': `API-Key ${integration.config.apiKey}`
        }
      });
      
      await this.updateLastSynced(integration.id, userId);
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get template details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create document from template
   * @param name Document name
   * @param templateId Template ID
   * @param recipients Document recipients
   * @param metadata Document metadata
   * @param tokens Template tokens to replace
   * @param fields Template fields to fill
   * @param tags Document tags
   * @param pricingTables Pricing tables data
   * @param userId User ID creating the document
   */
  async createDocumentFromTemplate(
    name: string,
    templateId: string,
    recipients: PandaDocDocumentRecipient[],
    metadata?: Record<string, any>,
    tokens?: Record<string, any>,
    fields?: Record<string, any>,
    tags?: string[],
    pricingTables?: Record<string, any>[],
    userId?: string
  ): Promise<PandaDocDocument> {
    try {
      const integration = await this.ensureIntegration();
      
      const payload = {
        name,
        template_uuid: templateId,
        recipients,
        metadata,
        tokens,
        fields,
        tags,
        pricing_tables: pricingTables
      };
      
      const response = await this.axios.post('/documents', payload, {
        headers: {
          'Authorization': `API-Key ${integration.config.apiKey}`
        }
      });
      
      if (userId) {
        await this.updateLastSynced(integration.id, userId);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create document from template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create document from PDF file
   * @param name Document name
   * @param filePath Path to PDF file
   * @param recipients Document recipients
   * @param metadata Document metadata
   * @param tags Document tags
   * @param fields Document fields
   * @param userId User ID creating the document
   */
  async createDocumentFromPdf(
    name: string,
    filePath: string,
    recipients: PandaDocDocumentRecipient[],
    metadata?: Record<string, any>,
    tags?: string[],
    fields?: Record<string, any>,
    userId?: string
  ): Promise<PandaDocDocument> {
    try {
      const integration = await this.ensureIntegration();
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('name', name);
      formData.append('recipients', JSON.stringify(recipients));
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      if (tags) {
        formData.append('tags', JSON.stringify(tags));
      }
      
      if (fields) {
        formData.append('fields', JSON.stringify(fields));
      }
      
      const response = await this.axios.post('/documents', formData, {
        headers: {
          'Authorization': `API-Key ${integration.config.apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
        }
      });
      
      if (userId) {
        await this.updateLastSynced(integration.id, userId);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create document from PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create document from buffer
   * @param name Document name
   * @param fileBuffer PDF file buffer
   * @param fileName Filename
   * @param recipients Document recipients
   * @param metadata Document metadata
   * @param tags Document tags
   * @param fields Document fields
   * @param userId User ID creating the document
   */
  async createDocumentFromBuffer(
    name: string,
    fileBuffer: Buffer,
    fileName: string,
    recipients: PandaDocDocumentRecipient[],
    metadata?: Record<string, any>,
    tags?: string[],
    fields?: Record<string, any>,
    userId?: string
  ): Promise<PandaDocDocument> {
    try {
      const integration = await this.ensureIntegration();
      
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: fileName });
      formData.append('name', name);
      formData.append('recipients', JSON.stringify(recipients));
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      if (tags) {
        formData.append('tags', JSON.stringify(tags));
      }
      
      if (fields) {
        formData.append('fields', JSON.stringify(fields));
      }
      
      const response = await this.axios.post('/documents', formData, {
        headers: {
          'Authorization': `API-Key ${integration.config.apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
        }
      });
      
      if (userId) {
        await this.updateLastSynced(integration.id, userId);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create document from buffer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get document details
   * @param documentId Document ID
   * @param userId User ID making the request
   */
  async getDocument(documentId: string, userId: string): Promise<PandaDocDocument> {
    try {
      const integration = await this.ensureIntegration();
      
      const response = await this.axios.get(`/documents/${documentId}`, {
        headers: {
          'Authorization': `API-Key ${integration.config.apiKey}`
        }
      });
      
      await this.updateLastSynced(integration.id, userId);
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get document details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get document status
   * @param documentId Document ID
   * @param userId User ID making the request
   */
  async getDocumentStatus(documentId: string, userId: string): Promise<PandaDocDocumentStatus> {
    try {
      // Get document details first - PandaDoc doesn't have a separate status endpoint
      const document = await this.getDocument(documentId, userId);
      
      // Format the response to match expected PandaDocDocumentStatus structure
      const statusResponse: PandaDocDocumentStatus = {
        id: document.id,
        status: document.status as PandaDocDocumentStatus,
        statusTimestamps: {} // We don't have timestamp details from the document endpoint
      };
      
      return statusResponse;
    } catch (error) {
      throw new Error(`Failed to get document status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Download document
   * @param documentId Document ID
   * @param userId User ID making the request
   */
  async downloadDocument(documentId: string, userId: string): Promise<Buffer> {
    try {
      const integration = await this.ensureIntegration();
      
      const response = await this.axios.get(`/documents/${documentId}/download`, {
        headers: {
          'Authorization': `API-Key ${integration.config.apiKey}`
        },
        responseType: 'arraybuffer'
      });
      
      await this.updateLastSynced(integration.id, userId);
      
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send document for signing
   * @param documentId Document ID
   * @param subject Email subject
   * @param message Email message
   * @param silent Whether to send without email
   * @param userId User ID making the request
   */
  async sendDocument(
    documentId: string,
    subject?: string,
    message?: string,
    silent: boolean = false,
    userId?: string
  ): Promise<PandaDocDocument> {
    try {
      const integration = await this.ensureIntegration();
      
      const payload = {
        subject,
        message,
        silent
      };
      
      const response = await this.axios.post(`/documents/${documentId}/send`, payload, {
        headers: {
          'Authorization': `API-Key ${integration.config.apiKey}`
        }
      });
      
      if (userId) {
        await this.updateLastSynced(integration.id, userId);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a document session (for embedding)
   * @param documentId Document ID
   * @param recipient Recipient email
   * @param lifetime Session lifetime in seconds
   * @param userId User ID making the request
   */
  async createDocumentSession(
    documentId: string,
    recipient: string,
    lifetime: number = 3600,
    userId?: string
  ): Promise<PandaDocDocumentSession> {
    try {
      const integration = await this.ensureIntegration();
      
      const payload = {
        recipient,
        lifetime
      };
      
      const response = await this.axios.post(`/documents/${documentId}/session`, payload, {
        headers: {
          'Authorization': `API-Key ${integration.config.apiKey}`
        }
      });
      
      if (userId) {
        await this.updateLastSynced(integration.id, userId);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create document session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure integration is available
   */
  private async ensureIntegration(): Promise<Integration> {
    if (this.integration) {
      return this.integration;
    }
    
    const integration = await this.getIntegrationRecord();
    
    if (!integration) {
      throw new Error('PandaDoc integration not found. Initialize the integration first.');
    }
    
    this.integration = integration;
    return integration;
  }
}