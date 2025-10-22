/**
 * Termene.ro Integration Client
 * 
 * Client for Termene.ro API integration.
 * Handles Romanian company information lookup, validation, and monitoring.
 */

import axios from 'axios';
import { BaseIntegrationClient } from './base-integration.client';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';

/**
 * Termene.ro Client for Romanian company registry integration
 */
export class TermeneRoClient extends BaseIntegrationClient {
  private static readonly API_URL = 'https://api.termene.ro';
  private static readonly API_VERSION = 'v1.0';

  /**
   * Initialize the Termene.ro client
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.TERMENE_RO, companyId, franchiseId);
  }

  /**
   * Initialize the Termene.ro integration
   * @param apiKey Termene.ro API key
   * @param userId User ID initializing the integration
   */
  async initialize(
    apiKey: string,
    userId: string
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
              lastConnectionCheck: new Date().toISOString()
            },
            isConnected: true,
            status: IntegrationStatus.ACTIVE
          },
          userId
        );
        
        return updatedIntegration || existingIntegration;
      }
      
      // Create new integration
      const integration = await this.createIntegrationRecord(
        {
          apiKey,
          lastConnectionCheck: new Date().toISOString()
        },
        userId
      );
      
      // Verify connection
      const isConnected = await this.testConnection();
      
      if (isConnected) {
        await this.updateStatus(integration.id, IntegrationStatus.ACTIVE, userId);
      } else {
        await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        throw new Error('Failed to connect to Termene.ro API');
      }
      
      return integration;
    } catch (error) {
      throw new Error(`Failed to initialize Termene.ro integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Test the connection to Termene.ro API
   */
  async testConnection(): Promise<boolean> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        return false;
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      
      if (!apiKey) {
        return false;
      }
      
      // Test connection by retrieving API info
      const response = await axios.get(`${TermeneRoClient.API_URL}/${TermeneRoClient.API_VERSION}/companies/info`, {
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
        console.error(`Termene.ro connection test failed: ${error.message}`);
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
   * Get private headers with API key
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const integration = await this.getIntegrationRecord();
    
    if (!integration || !integration.config) {
      throw new Error('Integration not configured');
    }
    
    const config = integration.config as Record<string, any>;
    const apiKey = config.apiKey;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Search for companies by CUI (tax ID)
   * @param cui Company tax ID (CUI/CIF)
   */
  async getCompanyByCui(cui: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(
        `${TermeneRoClient.API_URL}/${TermeneRoClient.API_VERSION}/company/cui/${cui}`,
        { headers }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get company by CUI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for companies by name
   * @param name Company name
   * @param exact Whether to match the name exactly
   */
  async searchCompanyByName(name: string, exact: boolean = false): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const params = new URLSearchParams({
        name,
        exact: exact ? '1' : '0'
      });
      
      const response = await axios.get(
        `${TermeneRoClient.API_URL}/${TermeneRoClient.API_VERSION}/company/search?${params.toString()}`,
        { headers }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search company by name: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get company financial data
   * @param cui Company tax ID (CUI/CIF)
   */
  async getCompanyFinancials(cui: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(
        `${TermeneRoClient.API_URL}/${TermeneRoClient.API_VERSION}/company/financial/${cui}`,
        { headers }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get company financials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a company is in insolvency
   * @param cui Company tax ID (CUI/CIF)
   */
  async checkInsolvency(cui: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(
        `${TermeneRoClient.API_URL}/${TermeneRoClient.API_VERSION}/company/insolvency/${cui}`,
        { headers }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to check insolvency status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add company to monitoring list
   * @param cui Company tax ID (CUI/CIF)
   */
  async addCompanyToMonitoring(cui: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.post(
        `${TermeneRoClient.API_URL}/${TermeneRoClient.API_VERSION}/company/monitoring/add`,
        { cui },
        { headers }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add company to monitoring: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove company from monitoring list
   * @param cui Company tax ID (CUI/CIF)
   */
  async removeCompanyFromMonitoring(cui: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.post(
        `${TermeneRoClient.API_URL}/${TermeneRoClient.API_VERSION}/company/monitoring/remove`,
        { cui },
        { headers }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to remove company from monitoring: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get monitored companies list
   */
  async getMonitoredCompanies(): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const response = await axios.get(
        `${TermeneRoClient.API_URL}/${TermeneRoClient.API_VERSION}/company/monitoring/list`,
        { headers }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get monitored companies: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate Romanian VAT number
   * @param vatNumber VAT number to validate
   */
  async validateVatNumber(vatNumber: string): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      // Remove 'RO' prefix if present for consistent formatting
      const formattedVat = vatNumber.replace(/^RO/i, '');
      
      const response = await axios.get(
        `${TermeneRoClient.API_URL}/${TermeneRoClient.API_VERSION}/company/vat/${formattedVat}`,
        { headers }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate VAT number: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}