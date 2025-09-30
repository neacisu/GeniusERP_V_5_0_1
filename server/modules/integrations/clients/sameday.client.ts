/**
 * SameDay Shipping Integration Client
 * 
 * Client for SameDay Courier API integration (Romanian shipping provider).
 * Handles creating AWBs, package tracking, and pick-up point management.
 */

import axios from 'axios';
import { BaseIntegrationClient } from './base-integration.client';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';

/**
 * SameDay environment options
 */
export enum SameDayEnvironment {
  DEMO = 'demo',
  PRODUCTION = 'production'
}

/**
 * SameDay package type
 */
export enum SameDayPackageType {
  PARCEL = 'parcel',
  ENVELOPE = 'envelope',
  LARGE_PACKAGE = 'large_package'
}

/**
 * SameDay Courier Client for Romanian shipping integration
 */
export class SameDayClient extends BaseIntegrationClient {
  private static readonly DEMO_API_URL = 'https://api.demo.sameday.ro';
  private static readonly PRODUCTION_API_URL = 'https://api.sameday.ro';

  /**
   * Initialize the SameDay client
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.SAMEDAY, companyId, franchiseId);
  }

  /**
   * Initialize the SameDay integration
   * @param username SameDay username
   * @param password SameDay password
   * @param environment API environment (demo or production)
   * @param userId User ID initializing the integration
   */
  async initialize(
    username: string,
    password: string,
    environment: SameDayEnvironment = SameDayEnvironment.DEMO,
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
              username,
              password,
              environment,
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
          username,
          password,
          environment,
          lastConnectionCheck: new Date().toISOString()
        },
        userId
      );
      
      // Verify connection by getting an auth token
      const token = await this.getAuthToken();
      
      if (token) {
        await this.updateIntegrationRecord(
          integration.id,
          {
            config: {
              username,
              password,
              environment,
              accessToken: token.token,
              tokenExpiresAt: token.expires_at,
              lastConnectionCheck: new Date().toISOString()
            },
            isConnected: true,
            status: IntegrationStatus.ACTIVE
          },
          userId
        );
      } else {
        await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        throw new Error('Failed to connect to SameDay API');
      }
      
      return integration;
    } catch (error) {
      throw new Error(`Failed to initialize SameDay integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get base URL based on environment
   */
  private getBaseUrl(): string {
    return this.getEnvironment() === SameDayEnvironment.PRODUCTION
      ? SameDayClient.PRODUCTION_API_URL
      : SameDayClient.DEMO_API_URL;
  }

  /**
   * Get configured environment
   */
  private async getEnvironment(): Promise<SameDayEnvironment> {
    const integration = await this.getIntegrationRecord();
    
    if (!integration || !integration.config) {
      return SameDayEnvironment.DEMO; // Default to demo
    }
    
    const config = integration.config as Record<string, any>;
    return config.environment || SameDayEnvironment.DEMO;
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<{ token: string; expires_at: string } | null> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const username = config.username;
      const password = config.password;
      
      if (!username || !password) {
        throw new Error('SameDay credentials not configured');
      }
      
      // Check if we already have a valid token
      if (config.accessToken && config.tokenExpiresAt) {
        const tokenExpiry = new Date(config.tokenExpiresAt);
        const now = new Date();
        const expirationBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (now.getTime() + expirationBuffer < tokenExpiry.getTime()) {
          return {
            token: config.accessToken,
            expires_at: config.tokenExpiresAt
          };
        }
      }
      
      // Get new token
      const baseUrl = this.getBaseUrl();
      
      const response = await axios.post(
        `${baseUrl}/api/authenticate`,
        {
          username,
          password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200 && response.data.token) {
        // Update integration with new token
        await this.updateIntegrationRecord(
          integration.id,
          {
            config: {
              ...config,
              accessToken: response.data.token,
              tokenExpiresAt: response.data.expires_at,
              lastTokenRefresh: new Date().toISOString()
            },
            isConnected: true,
            status: IntegrationStatus.ACTIVE
          },
          'system'
        );
        
        return {
          token: response.data.token,
          expires_at: response.data.expires_at
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get SameDay auth token: ${error instanceof Error ? error.message : String(error)}`);
      
      const integration = await this.getIntegrationRecord();
      
      if (integration) {
        await this.updateIntegrationRecord(
          integration.id,
          {
            isConnected: false,
            status: IntegrationStatus.ERROR,
            config: {
              ...(integration.config as Record<string, any>),
              lastError: error instanceof Error ? error.message : String(error),
              lastErrorTime: new Date().toISOString()
            }
          },
          'system'
        );
      }
      
      return null;
    }
  }

  /**
   * Test the connection to SameDay API
   */
  async testConnection(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      return !!token;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`SameDay connection test failed: ${error.message}`);
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
   * Get pickup points
   */
  async getPickupPoints(): Promise<any[]> {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Failed to authenticate with SameDay API');
      }
      
      const baseUrl = this.getBaseUrl();
      
      const response = await axios.get(`${baseUrl}/api/client/pickup-points`, {
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get pickup points: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get service list
   */
  async getServices(): Promise<any[]> {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Failed to authenticate with SameDay API');
      }
      
      const baseUrl = this.getBaseUrl();
      
      const response = await axios.get(`${baseUrl}/api/client/services`, {
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get services: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create an AWB (shipping label)
   * @param pickupPointId Pickup point ID
   * @param contactPerson Contact person name
   * @param phoneNumber Contact phone number
   * @param serviceId Service ID
   * @param packageType Package type
   * @param packageWeight Package weight in kg
   * @param packageLength Package length in cm
   * @param packageWidth Package width in cm
   * @param packageHeight Package height in cm
   * @param deliveryAddress Delivery address details
   * @param awbPayment Payment method for AWB ('sender' or 'recipient')
   * @param cashOnDelivery Optional cash on delivery amount
   * @param insuranceValue Optional insurance value
   * @param observation Optional observation text
   */
  async createAwb(
    pickupPointId: number,
    contactPerson: string,
    phoneNumber: string,
    serviceId: number,
    packageType: SameDayPackageType,
    packageWeight: number,
    packageLength: number,
    packageWidth: number,
    packageHeight: number,
    deliveryAddress: {
      county: string;
      city: string;
      address: string;
      postalCode?: string;
      contactPerson: string;
      phoneNumber: string;
      email?: string;
      companyName?: string;
    },
    awbPayment: 'sender' | 'recipient',
    cashOnDelivery?: number,
    insuranceValue?: number,
    observation?: string
  ): Promise<any> {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Failed to authenticate with SameDay API');
      }
      
      const baseUrl = this.getBaseUrl();
      
      // Prepare request payload
      const payload = {
        pickupPoint: pickupPointId,
        contactPerson,
        phone: phoneNumber,
        service: serviceId,
        packageType,
        packageWeight,
        packageLength,
        packageWidth,
        packageHeight,
        county: deliveryAddress.county,
        city: deliveryAddress.city,
        address: deliveryAddress.address,
        postalCode: deliveryAddress.postalCode,
        personWhoReceives: deliveryAddress.contactPerson,
        phoneWhoReceives: deliveryAddress.phoneNumber,
        emailWhoReceives: deliveryAddress.email,
        companyWhoReceives: deliveryAddress.companyName,
        awbPayment,
        cashOnDelivery,
        insuredValue: insuranceValue,
        observation
      };
      
      const response = await axios.post(
        `${baseUrl}/api/awb`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create AWB: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get AWB status by AWB number
   * @param awbNumber AWB number to track
   */
  async getAwbStatus(awbNumber: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Failed to authenticate with SameDay API');
      }
      
      const baseUrl = this.getBaseUrl();
      
      const response = await axios.get(`${baseUrl}/api/awb/${awbNumber}/status`, {
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get AWB status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Download AWB PDF
   * @param awbNumber AWB number
   * @returns PDF file as Buffer
   */
  async downloadAwbPdf(awbNumber: string): Promise<Buffer> {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Failed to authenticate with SameDay API');
      }
      
      const baseUrl = this.getBaseUrl();
      
      const response = await axios.get(`${baseUrl}/api/awb/${awbNumber}/download`, {
        headers: {
          'Authorization': `Bearer ${token.token}`
        },
        responseType: 'arraybuffer'
      });
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download AWB PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cancel AWB
   * @param awbNumber AWB number to cancel
   */
  async cancelAwb(awbNumber: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Failed to authenticate with SameDay API');
      }
      
      const baseUrl = this.getBaseUrl();
      
      const response = await axios.delete(`${baseUrl}/api/awb/${awbNumber}`, {
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to cancel AWB: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Request courier pickup
   * @param pickupPointId Pickup point ID
   * @param contactPerson Contact person name
   * @param phoneNumber Contact phone number
   * @param pickupDate Pickup date (YYYY-MM-DD)
   * @param pickupStartHour Pickup start hour (HH:MM)
   * @param pickupEndHour Pickup end hour (HH:MM)
   * @param awbNumbers List of AWB numbers for pickup
   * @param observation Optional observation text
   */
  async requestCourierPickup(
    pickupPointId: number,
    contactPerson: string,
    phoneNumber: string,
    pickupDate: string,
    pickupStartHour: string,
    pickupEndHour: string,
    awbNumbers: string[],
    observation?: string
  ): Promise<any> {
    try {
      const token = await this.getAuthToken();
      
      if (!token) {
        throw new Error('Failed to authenticate with SameDay API');
      }
      
      const baseUrl = this.getBaseUrl();
      
      // Prepare request payload
      const payload = {
        pickupPoint: pickupPointId,
        contactPerson,
        phone: phoneNumber,
        pickupDate,
        pickupStartHour,
        pickupEndHour,
        awbCodes: awbNumbers,
        observation
      };
      
      const response = await axios.post(
        `${baseUrl}/api/pickup`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to request courier pickup: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}