/**
 * Integration Service
 * 
 * This service handles integration with external services, providing 
 * a unified interface for retrieving and managing integration credentials.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logger';

// Initialize logger
const logger = new Logger('IntegrationService');

/**
 * Integration provider enum
 */
export enum IntegrationProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SHOPIFY = 'shopify',
  PANDADOC = 'pandadoc',
  ANAF_EFACTURA = 'anaf_efactura',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  AMAZON = 'amazon',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  HUBSPOT = 'hubspot',
  MAILCHIMP = 'mailchimp',
  QUICKBOOKS = 'quickbooks',
  XERO = 'xero'
}

/**
 * Integration status enum
 */
export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILED = 'failed',
  PENDING = 'pending',
  DISABLED = 'disabled'
}

/**
 * Integration service for managing external integrations and their credentials
 */
export class IntegrationService {
  constructor(private db: PostgresJsDatabase) {
    logger.info('IntegrationService initialized');
  }

  /**
   * Get active integration configuration for a company and provider
   * 
   * @param companyId Company ID
   * @param provider Integration provider
   * @returns Integration configuration or null if not found
   */
  async getActiveIntegration(companyId: string, provider: IntegrationProvider) {
    try {
      // Since we don't have the actual schema imported, we'll use dynamic table access
      // In a real implementation, you would import the integrations table from your schema
      const integrations = this.db.dynamic.table('integrations');
      
      const integration = await this.db.select()
        .from(integrations)
        .where(
          and(
            eq(integrations.companyId as any, companyId),
            eq(integrations.provider as any, provider),
            eq(integrations.status as any, IntegrationStatus.ACTIVE)
          )
        )
        .limit(1)
        .then(results => results[0] || null);

      return integration;
    } catch (error) {
      logger.error(`Error getting active integration for company ${companyId} and provider ${provider}`, error);
      return null;
    }
  }

  /**
   * Get integration credentials for a provider and company
   * 
   * @param provider Integration provider
   * @param companyId Company ID
   * @param userId User ID (for audit purposes)
   * @returns Integration credentials or null if not found
   */
  async getIntegrationCredentials(provider: IntegrationProvider, companyId: string, userId: string) {
    try {
      const integration = await this.getActiveIntegration(companyId, provider);
      
      if (!integration) {
        // Try to use environment variables as fallback based on provider
        return this.getEnvironmentCredentials(provider);
      }

      // Log credential access for audit purposes
      logger.info(`User ${userId} accessed ${provider} credentials for company ${companyId}`);
      
      return integration.config;
    } catch (error) {
      logger.error(`Error getting integration credentials for provider ${provider} and company ${companyId}`, error);
      
      // Try environment variables as a fallback
      return this.getEnvironmentCredentials(provider);
    }
  }

  /**
   * Get credentials from environment variables
   * 
   * @param provider Integration provider
   * @returns Credentials from environment variables or null
   */
  private getEnvironmentCredentials(provider: IntegrationProvider) {
    try {
      switch (provider) {
        case IntegrationProvider.STRIPE:
          if (process.env.STRIPE_SECRET_KEY) {
            return {
              secretKey: process.env.STRIPE_SECRET_KEY,
              publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
            };
          }
          break;
        case IntegrationProvider.PAYPAL:
          if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
            return {
              clientId: process.env.PAYPAL_CLIENT_ID,
              clientSecret: process.env.PAYPAL_CLIENT_SECRET,
              environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox'
            };
          }
          break;
        case IntegrationProvider.PANDADOC:
          if (process.env.PANDADOC_API_KEY) {
            return {
              apiKey: process.env.PANDADOC_API_KEY
            };
          }
          break;
        case IntegrationProvider.GOOGLE:
          if (process.env.GOOGLE_API_KEY) {
            return {
              apiKey: process.env.GOOGLE_API_KEY,
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET
            };
          }
          break;
        // Add more providers as needed
      }
      
      return null;
    } catch (error) {
      logger.error(`Error getting environment credentials for provider ${provider}`, error);
      return null;
    }
  }

  /**
   * Create or update an integration for a company
   * 
   * @param companyId Company ID
   * @param provider Integration provider
   * @param config Integration configuration
   * @param userId User ID (for audit)
   * @returns Created or updated integration
   */
  async saveIntegration(companyId: string, provider: IntegrationProvider, config: any, userId: string) {
    try {
      // Since we don't have the actual schema imported, we'll use dynamic table access
      const integrations = this.db.dynamic.table('integrations');
      
      // Check if integration already exists
      const existingIntegration = await this.db.select()
        .from(integrations)
        .where(
          and(
            eq(integrations.companyId as any, companyId),
            eq(integrations.provider as any, provider)
          )
        )
        .limit(1)
        .then(results => results[0] || null);

      const timestamp = new Date();
      
      if (existingIntegration) {
        // Update existing integration
        await this.db.update(integrations)
          .set({
            config,
            status: IntegrationStatus.ACTIVE,
            updatedAt: timestamp,
            updatedBy: userId
          } as any)
          .where(eq(integrations.id as any, existingIntegration.id));
        
        logger.info(`Updated ${provider} integration for company ${companyId}`);
        
        return {
          ...existingIntegration,
          config,
          status: IntegrationStatus.ACTIVE,
          updatedAt: timestamp,
          updatedBy: userId
        };
      } else {
        // Create new integration
        const newIntegration = {
          id: uuidv4(),
          companyId,
          provider,
          name: this.getDefaultName(provider),
          config,
          status: IntegrationStatus.ACTIVE,
          isConnected: true,
          createdAt: timestamp,
          createdBy: userId,
          updatedAt: timestamp,
          updatedBy: userId
        };
        
        await this.db.insert(integrations).values(newIntegration as any);
        
        logger.info(`Created new ${provider} integration for company ${companyId}`);
        
        return newIntegration;
      }
    } catch (error) {
      logger.error(`Error saving integration for company ${companyId} and provider ${provider}`, error);
      throw new Error(`Failed to save integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if company has an active integration with a provider
   * 
   * @param companyId Company ID
   * @param provider Integration provider
   * @returns Boolean indicating if integration exists and is active
   */
  async hasActiveIntegration(companyId: string, provider: IntegrationProvider): Promise<boolean> {
    try {
      const integration = await this.getActiveIntegration(companyId, provider);
      return integration !== null;
    } catch (error) {
      logger.error(`Error checking active integration for company ${companyId} and provider ${provider}`, error);
      return false;
    }
  }

  /**
   * Get default name for integration based on provider
   * 
   * @param provider Integration provider
   * @returns Default name
   */
  private getDefaultName(provider: IntegrationProvider): string {
    switch (provider) {
      case IntegrationProvider.STRIPE:
        return 'Stripe Payment Gateway';
      case IntegrationProvider.PAYPAL:
        return 'PayPal Payment Gateway';
      case IntegrationProvider.SHOPIFY:
        return 'Shopify E-commerce';
      case IntegrationProvider.PANDADOC:
        return 'PandaDoc Document Signing';
      case IntegrationProvider.ANAF_EFACTURA:
        return 'ANAF eFactura Integration';
      case IntegrationProvider.GOOGLE:
        return 'Google API Integration';
      case IntegrationProvider.MICROSOFT:
        return 'Microsoft API Integration';
      case IntegrationProvider.AMAZON:
        return 'Amazon API Integration';
      case IntegrationProvider.FACEBOOK:
        return 'Facebook API Integration';
      case IntegrationProvider.TWITTER:
        return 'Twitter API Integration';
      case IntegrationProvider.HUBSPOT:
        return 'HubSpot CRM Integration';
      case IntegrationProvider.MAILCHIMP:
        return 'Mailchimp Marketing Integration';
      case IntegrationProvider.QUICKBOOKS:
        return 'QuickBooks Accounting';
      case IntegrationProvider.XERO:
        return 'Xero Accounting';
      default:
        return `${provider} Integration`;
    }
  }
}