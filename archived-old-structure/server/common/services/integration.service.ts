/**
 * Integration Service
 * 
 * This service handles integration with external services, providing 
 * a unified interface for retrieving and managing integration credentials.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../logger';
import { integrations, IntegrationProvider, IntegrationStatus } from '../../modules/integrations/schema/integrations.schema';
import { eq, and } from 'drizzle-orm';

// Re-export IntegrationProvider and IntegrationStatus for convenience
export { IntegrationProvider, IntegrationStatus };

// Initialize logger
const logger = new Logger('IntegrationService');

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
      const result = await this.db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.companyId, companyId),
            eq(integrations.provider, provider),
            eq(integrations.status, IntegrationStatus.ACTIVE)
          )
        )
        .limit(1);

      return result[0] || null;
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
      // Check if integration already exists
      const existing = await this.db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.companyId, companyId),
            eq(integrations.provider, provider)
          )
        )
        .limit(1);

      const existingIntegration = existing[0] || null;
      const timestamp = new Date();
      
      if (existingIntegration) {
        // Update existing integration
        const updated = await this.db
          .update(integrations)
          .set({
            config,
            status: IntegrationStatus.ACTIVE,
            isConnected: true,
            updatedAt: timestamp,
            updatedBy: userId
          })
          .where(eq(integrations.id, existingIntegration.id))
          .returning();
        
        logger.info(`Updated ${provider} integration for company ${companyId}`);
        
        return updated[0];
      } else {
        // Create new integration
        const newIntegration = {
          id: uuidv4(),
          companyId,
          provider,
          name: this.getDefaultName(provider),
          config,
          status: IntegrationStatus.ACTIVE as any,
          isConnected: true,
          createdAt: timestamp,
          createdBy: userId,
          updatedAt: timestamp,
          updatedBy: userId
        };
        
        const created = await this.db
          .insert(integrations)
          .values(newIntegration)
          .returning();
        
        logger.info(`Created new ${provider} integration for company ${companyId}`);
        
        return created[0];
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
      case IntegrationProvider.SHOPIFY_ADMIN:
        return 'Shopify Admin E-commerce';
      case IntegrationProvider.SHOPIFY_STOREFRONT:
        return 'Shopify Storefront E-commerce';
      case IntegrationProvider.SHOPIFY_INBOX:
        return 'Shopify Inbox Messaging';
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