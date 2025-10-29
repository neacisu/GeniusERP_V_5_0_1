/**
 * ANAF e-Factura Integration Client
 * 
 * Client for integrating with the Romanian ANAF e-Factura API.
 */

import axios from 'axios';
import { IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';
import { BaseIntegrationClient } from './base-integration.client';

/**
 * e-Factura invoice data
 */
export interface EfacturaInvoiceData {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  sellerName: string;
  sellerVatNumber: string;
  buyerName: string;
  buyerVatNumber: string;
  totalAmount: number;
  vatAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'delivered' | 'accepted' | 'rejected' | 'canceled';
  xmlContent?: string;
}

/**
 * e-Factura API client
 */
export class AnafEfacturaClient extends BaseIntegrationClient {
  /**
   * Constructor
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.ANAF_EFACTURA, companyId, franchiseId);
  }
  
  /**
   * Initialize integration with provided credentials
   * @param apiKey API key for ANAF oauth authorization
   * @param clientId Client ID for ANAF oauth authorization
   * @param clientSecret Client secret for ANAF oauth authorization
   * @param apiUrl API URL (optional, defaults to production URL)
   * @param userId User ID for audit
   * @returns Created integration configuration
   */
  public async initialize(
    apiKey: string,
    clientId: string,
    clientSecret: string,
    apiUrl: string = 'https://api.anaf.ro/prod/FCTEL/rest',
    userId: string
  ) {
    try {
      // First, check if integration already exists
      const isConnected = await this.isConnected();
      if (isConnected) {
        throw new Error('ANAF e-Factura integration already connected');
      }
      
      // Create integration configuration
      const config = {
        apiKey,
        clientId,
        clientSecret,
        apiUrl,
        lastSyncAt: new Date().toISOString()
      };
      
      // Create integration in database
      const integration = await this.integrationsService.createIntegration(
        this.provider,
        this.companyId,
        config,
        userId,
        this.franchiseId
      );
      
      // Test the connection to verify credentials
      const isValid = await this.testConnection();
      
      if (!isValid) {
        // Update status to error if connection test fails
        await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        throw new Error('Could not connect to ANAF e-Factura API, please check your credentials');
      }
      
      return integration;
    } catch (error) {
      console.error('[AnafEfacturaClient] Error initializing integration:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Test the connection to ANAF e-Factura API
   * @returns Boolean indicating if the connection test succeeded
   */
  public async testConnection() {
    try {
      const config = await this.getConfig();
      if (!config) {
        return false;
      }
      
      // First, get an access token
      const accessToken = await this.getAccessToken();
      
      if (!accessToken) {
        return false;
      }
      
      // Test the connection by getting account info
      const response = await axios.get(`${config['apiUrl']}/account/info`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('[AnafEfacturaClient] Error testing connection:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Get an access token for API operations
   * @returns Access token or null if failed
   */
  private async getAccessToken() {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      // Check if the token is still valid
      if (
        config['accessToken'] &&
        config['tokenExpiresAt'] &&
        new Date(config['tokenExpiresAt']) > new Date()
      ) {
        return config['accessToken'];
      }
      
      // Get a new token
      const response = await axios.post(
        `${config['apiUrl']}/oauth2/token`,
        {
          grant_type: 'client_credentials',
          client_id: config['clientId'],
          client_secret: config['clientSecret']
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-api-key': config['apiKey']
          }
        }
      );
      
      if (response.status !== 200 || !response.data.access_token) {
        throw new Error('Failed to get access token');
      }
      
      // Calculate token expiry (usually 1 hour from now)
      const expiresIn = response.data.expires_in || 3600;
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expiresIn - 60); // Subtract 60 seconds for safety margin
      
      // Update the config with the new token
      await this.updateConfig(
        {
          accessToken: response.data.access_token,
          tokenExpiresAt: tokenExpiresAt.toISOString()
        },
        'system' // Using 'system' as the user ID for system operations
      );
      
      return response.data.access_token;
    } catch (error) {
      console.error('[AnafEfacturaClient] Error getting access token:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }
  
  /**
   * Send an invoice to ANAF e-Factura
   * @param invoiceXml Invoice XML in UBL format
   * @param userId User ID for audit
   * @returns Response from ANAF or error
   */
  public async sendInvoice(invoiceXml: string, userId: string) {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      
      // Send the invoice
      const response = await axios.post(
        `${config['apiUrl']}/upload`,
        {
          xml_data: invoiceXml
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config['apiKey']
          }
        }
      );
      
      // Get integration record for ID
      const integration = await this.getIntegrationRecord();
      if (integration) {
        // Update last sync
        await this.updateLastSynced(integration.id, userId);
      }
      
      return response.data;
    } catch (error) {
      console.error('[AnafEfacturaClient] Error sending invoice:', error instanceof Error ? error.message : String(error));
      
      // If the error is due to expired credentials, update the status
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        const integration = await this.getIntegrationRecord();
        if (integration) {
          await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Get invoices from ANAF e-Factura
   * @param startDate Start date for invoice filter (ISO format)
   * @param endDate End date for invoice filter (ISO format)
   * @param userId User ID for audit
   * @returns List of invoices
   */
  public async getInvoices(startDate: string, endDate: string, userId: string) {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      
      // Get invoices
      const response = await axios.get(
        `${config['apiUrl']}/invoices`,
        {
          params: {
            startDate,
            endDate
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config['apiKey']
          }
        }
      );
      
      // Get integration record for ID
      const integration = await this.getIntegrationRecord();
      if (integration) {
        // Update last sync
        await this.updateLastSynced(integration.id, userId);
      }
      
      return response.data;
    } catch (error) {
      console.error('[AnafEfacturaClient] Error getting invoices:', error instanceof Error ? error.message : String(error));
      
      // If the error is due to expired credentials, update the status
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        const integration = await this.getIntegrationRecord();
        if (integration) {
          await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Get a specific invoice by ID
   * @param invoiceId Invoice ID
   * @param userId User ID for audit
   * @returns Invoice data
   */
  public async getInvoice(invoiceId: string, userId: string) {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      
      // Get invoice
      const response = await axios.get(
        `${config['apiUrl']}/invoices/${invoiceId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config['apiKey']
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('[AnafEfacturaClient] Error getting invoice:', error instanceof Error ? error.message : String(error));
      
      // If the error is due to expired credentials, update the status
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        const integration = await this.getIntegrationRecord();
        if (integration) {
          await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Get the status of a specific invoice
   * @param invoiceId Invoice ID
   * @param userId User ID for audit
   * @returns Invoice status
   */
  public async getInvoiceStatus(invoiceId: string, userId: string) {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      
      // Get invoice status
      const response = await axios.get(
        `${config['apiUrl']}/invoices/${invoiceId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config['apiKey']
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('[AnafEfacturaClient] Error getting invoice status:', error instanceof Error ? error.message : String(error));
      
      // If the error is due to expired credentials, update the status
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        const integration = await this.getIntegrationRecord();
        if (integration) {
          await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Download invoice XML
   * @param invoiceId Invoice ID
   * @param userId User ID for audit
   * @returns Invoice XML content
   */
  public async downloadInvoiceXml(invoiceId: string, userId: string) {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get access token');
      }
      
      // Download invoice XML
      const response = await axios.get(
        `${config['apiUrl']}/invoices/${invoiceId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-api-key': config['apiKey']
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('[AnafEfacturaClient] Error downloading invoice XML:', error instanceof Error ? error.message : String(error));
      
      // If the error is due to expired credentials, update the status
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        const integration = await this.getIntegrationRecord();
        if (integration) {
          await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        }
      }
      
      throw error;
    }
  }
}

export default AnafEfacturaClient;