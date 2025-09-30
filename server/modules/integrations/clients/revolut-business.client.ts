/**
 * Revolut Business Integration Client
 * 
 * Client for Revolut Business API integration.
 * Handles payment processing, account information, and transaction management.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BaseIntegrationClient } from './base-integration.client';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';

/**
 * Revolut API environments
 */
export enum RevolutEnvironment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production'
}

/**
 * Revolut Business Client for payment processing
 */
export class RevolutBusinessClient extends BaseIntegrationClient {
  private static readonly BASE_SANDBOX_URL = 'https://sandbox-b2b.revolut.com/api/1.0';
  private static readonly BASE_PRODUCTION_URL = 'https://b2b.revolut.com/api/1.0';

  /**
   * Initialize the Revolut Business client
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.REVOLUT_BUSINESS, companyId, franchiseId);
  }

  /**
   * Initialize the Revolut Business integration
   * @param apiKey Revolut Business API key
   * @param environment API environment (sandbox or production)
   * @param userId User ID initializing the integration
   * @param webhookUrl Optional webhook URL for notifications
   * @param webhookSecret Optional webhook secret for signature verification
   */
  async initialize(
    apiKey: string,
    environment: RevolutEnvironment = RevolutEnvironment.SANDBOX,
    userId: string,
    webhookUrl?: string,
    webhookSecret?: string
  ): Promise<Integration> {
    try {
      // Check for existing integration
      const existingIntegration = await this.getIntegrationRecord();
      
      if (existingIntegration) {
        // Update existing integration
        const updatedIntegration = await this.updateIntegrationRecord(
          existingIntegration.id,
          {
            config: {
              apiKey,
              environment,
              lastConnectionCheck: new Date().toISOString()
            },
            isConnected: true,
            status: IntegrationStatus.ACTIVE,
            webhookUrl,
            webhookSecret
          },
          userId
        );
        
        return updatedIntegration || existingIntegration;
      }
      
      // Create new integration
      const integration = await this.createIntegrationRecord(
        {
          apiKey,
          environment,
          lastConnectionCheck: new Date().toISOString()
        },
        userId,
        webhookUrl,
        webhookSecret
      );
      
      // Verify connection
      const isConnected = await this.testConnection();
      
      if (isConnected) {
        await this.updateStatus(integration.id, IntegrationStatus.ACTIVE, userId);
      } else {
        await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        throw new Error('Failed to connect to Revolut Business API');
      }
      
      return integration;
    } catch (error) {
      throw new Error(`Failed to initialize Revolut Business integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Test the connection to Revolut Business API
   */
  async testConnection(): Promise<boolean> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        return false;
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      const environment = config.environment || RevolutEnvironment.SANDBOX;
      
      if (!apiKey) {
        return false;
      }
      
      // Get base URL based on environment
      const baseUrl = environment === RevolutEnvironment.PRODUCTION
        ? RevolutBusinessClient.BASE_PRODUCTION_URL
        : RevolutBusinessClient.BASE_SANDBOX_URL;
      
      // Test connection by retrieving account info
      const response = await axios.get(`${baseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const isConnected = response.status === 200;
      
      if (isConnected && integration) {
        await this.updateIntegrationRecord(
          integration.id,
          {
            isConnected: true,
            status: IntegrationStatus.ACTIVE,
            config: {
              ...config,
              lastConnectionCheck: new Date().toISOString()
            }
          },
          'system'
        );
      }
      
      return isConnected;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Revolut Business connection test failed: ${error.message}`);
      }
      
      const integration = await this.getIntegrationRecord();
      
      if (integration) {
        await this.updateIntegrationRecord(
          integration.id,
          {
            isConnected: false,
            status: IntegrationStatus.ERROR,
            config: {
              ...(integration.config as Record<string, any>),
              lastConnectionCheck: new Date().toISOString(),
              lastError: error instanceof Error ? error.message : String(error)
            }
          },
          'system'
        );
      }
      
      return false;
    }
  }

  /**
   * Get account information
   */
  async getAccounts(): Promise<any[]> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      const environment = config.environment || RevolutEnvironment.SANDBOX;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      // Get base URL based on environment
      const baseUrl = environment === RevolutEnvironment.PRODUCTION
        ? RevolutBusinessClient.BASE_PRODUCTION_URL
        : RevolutBusinessClient.BASE_SANDBOX_URL;
      
      const response = await axios.get(`${baseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Revolut accounts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a payment
   * @param fromAccountId Source account ID
   * @param amount Amount to transfer
   * @param currency Currency code (e.g., RON, EUR, USD)
   * @param toAccountId Destination account ID (for internal transfers)
   * @param recipientId Recipient ID (for external transfers)
   * @param reference Payment reference
   */
  async createPayment(
    fromAccountId: string,
    amount: number,
    currency: string,
    toAccountId?: string,
    recipientId?: string,
    reference?: string
  ): Promise<any> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      const environment = config.environment || RevolutEnvironment.SANDBOX;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      // Get base URL based on environment
      const baseUrl = environment === RevolutEnvironment.PRODUCTION
        ? RevolutBusinessClient.BASE_PRODUCTION_URL
        : RevolutBusinessClient.BASE_SANDBOX_URL;
      
      // Create payment payload based on internal or external transfer
      const payload: Record<string, any> = {
        request_id: uuidv4(),
        account_id: fromAccountId,
        amount,
        currency,
        reference: reference || `Payment ${new Date().toISOString()}`
      };
      
      if (toAccountId) {
        // Internal transfer
        payload.receiver = { account_id: toAccountId };
      } else if (recipientId) {
        // External transfer
        payload.receiver = { counterparty_id: recipientId };
      } else {
        throw new Error('Either toAccountId or recipientId must be provided');
      }
      
      const response = await axios.post(`${baseUrl}/pay`, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create Revolut payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get transactions for an account
   * @param accountId Account ID
   * @param from Start date (ISO string)
   * @param to End date (ISO string)
   * @param count Maximum number of transactions
   */
  async getTransactions(
    accountId: string,
    from?: string,
    to?: string,
    count?: number
  ): Promise<any[]> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      const environment = config.environment || RevolutEnvironment.SANDBOX;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      // Get base URL based on environment
      const baseUrl = environment === RevolutEnvironment.PRODUCTION
        ? RevolutBusinessClient.BASE_PRODUCTION_URL
        : RevolutBusinessClient.BASE_SANDBOX_URL;
      
      // Build query parameters
      const params: Record<string, any> = {};
      
      if (from) params.from = from;
      if (to) params.to = to;
      if (count) params.count = count;
      
      const queryString = new URLSearchParams(params).toString();
      
      const response = await axios.get(
        `${baseUrl}/accounts/${accountId}/transactions${queryString ? `?${queryString}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Revolut transactions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}