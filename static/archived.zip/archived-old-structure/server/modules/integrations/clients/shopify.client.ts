/**
 * Shopify Integration Client
 * 
 * Client for Shopify API integration.
 * Handles store management, product catalog, orders, and customer data.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BaseIntegrationClient } from './base-integration.client';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';

/**
 * Shopify API versions
 */
export enum ShopifyApiVersion {
  LATEST = '2023-10',
  STABLE = '2023-07'
}

/**
 * Shopify integration types
 */
export enum ShopifyIntegrationType {
  ADMIN = 'admin',
  STOREFRONT = 'storefront',
  INBOX = 'inbox'
}

/**
 * Shopify Client for eCommerce integration
 */
export class ShopifyClient extends BaseIntegrationClient {
  private readonly integrationType: ShopifyIntegrationType;

  /**
   * Initialize the Shopify client
   * @param type Shopify integration type (admin, storefront, inbox)
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(
    type: ShopifyIntegrationType,
    companyId: string,
    franchiseId?: string
  ) {
    // Determine the appropriate provider based on type
    let provider: IntegrationProvider;
    switch (type) {
      case ShopifyIntegrationType.ADMIN:
        provider = IntegrationProvider.SHOPIFY_ADMIN;
        break;
      case ShopifyIntegrationType.STOREFRONT:
        provider = IntegrationProvider.SHOPIFY_STOREFRONT;
        break;
      case ShopifyIntegrationType.INBOX:
        provider = IntegrationProvider.SHOPIFY_INBOX;
        break;
      default:
        provider = IntegrationProvider.SHOPIFY_ADMIN;
    }
    
    super(provider, companyId, franchiseId);
    this.integrationType = type;
  }

  /**
   * Initialize the Shopify integration
   * @param shopUrl Shopify store URL (e.g., 'my-store.myshopify.com')
   * @param accessToken Access token for API access
   * @param apiVersion Shopify API version
   * @param userId User ID initializing the integration
   * @param webhookUrl Optional webhook URL for notifications
   * @param webhookSecret Optional webhook secret for signature verification
   */
  async initialize(
    shopUrl: string,
    accessToken: string,
    apiVersion: ShopifyApiVersion = ShopifyApiVersion.LATEST,
    userId: string,
    webhookUrl?: string,
    webhookSecret?: string
  ): Promise<Integration> {
    try {
      // Format shop URL correctly
      const formattedShopUrl = shopUrl.replace(/^https?:\/\//i, '').replace(/\/$/i, '');
      
      // Check for existing integration
      const existingIntegration = await this.getIntegrationRecord();
      
      if (existingIntegration) {
        // Update existing integration
        const updatedIntegration = await this.updateIntegrationRecord(
          existingIntegration.id,
          {
            config: {
              shopUrl: formattedShopUrl,
              accessToken,
              apiVersion,
              integrationType: this.integrationType,
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
          shopUrl: formattedShopUrl,
          accessToken,
          apiVersion,
          integrationType: this.integrationType,
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
        throw new Error('Failed to connect to Shopify API');
      }
      
      return integration;
    } catch (error) {
      throw new Error(`Failed to initialize Shopify integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Test the connection to Shopify API
   */
  async testConnection(): Promise<boolean> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        return false;
      }
      
      const config = integration.config as Record<string, any>;
      const shopUrl = config.shopUrl;
      const accessToken = config.accessToken;
      const apiVersion = config.apiVersion || ShopifyApiVersion.LATEST;
      
      if (!shopUrl || !accessToken) {
        return false;
      }
      
      // Test connection based on integration type
      let endpoint = '';
      switch (this.integrationType) {
        case ShopifyIntegrationType.ADMIN:
          endpoint = `https://${shopUrl}/admin/api/${apiVersion}/shop.json`;
          break;
        case ShopifyIntegrationType.STOREFRONT:
          // For Storefront API, we'll use a GraphQL query
          endpoint = `https://${shopUrl}/api/${apiVersion}/graphql.json`;
          break;
        case ShopifyIntegrationType.INBOX:
          endpoint = `https://${shopUrl}/admin/api/${apiVersion}/shop.json`;
          break;
      }
      
      let response;
      
      if (this.integrationType === ShopifyIntegrationType.STOREFRONT) {
        // GraphQL request for Storefront API
        response = await axios.post(
          endpoint,
          {
            query: `{
              shop {
                name
              }
            }`
          },
          {
            headers: {
              'X-Shopify-Storefront-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // REST request for Admin API
        response = await axios.get(endpoint, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        });
      }
      
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
        console.error(`Shopify connection test failed: ${error.message}`);
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
   * Get Shopify store information
   */
  async getShopInfo(): Promise<any> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const shopUrl = config.shopUrl;
      const accessToken = config.accessToken;
      const apiVersion = config.apiVersion || ShopifyApiVersion.LATEST;
      
      if (!shopUrl || !accessToken) {
        throw new Error('Shopify credentials not configured');
      }
      
      // For storefront API, use GraphQL
      if (this.integrationType === ShopifyIntegrationType.STOREFRONT) {
        const response = await axios.post(
          `https://${shopUrl}/api/${apiVersion}/graphql.json`,
          {
            query: `{
              shop {
                name
                description
                moneyFormat
                primaryDomain {
                  url
                  host
                }
              }
            }`
          },
          {
            headers: {
              'X-Shopify-Storefront-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }
        );
        
        await this.updateLastSynced(integration.id, 'system');
        
        return response.data.data.shop;
      }
      
      // For admin API
      const response = await axios.get(
        `https://${shopUrl}/admin/api/${apiVersion}/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data.shop;
    } catch (error) {
      throw new Error(`Failed to get Shopify shop info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get products from Shopify store
   * @param limit Number of products to retrieve
   * @param page Page number for pagination
   */
  async getProducts(limit: number = 50, page: number = 1): Promise<any> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const shopUrl = config.shopUrl;
      const accessToken = config.accessToken;
      const apiVersion = config.apiVersion || ShopifyApiVersion.LATEST;
      
      if (!shopUrl || !accessToken) {
        throw new Error('Shopify credentials not configured');
      }
      
      // For storefront API, use GraphQL
      if (this.integrationType === ShopifyIntegrationType.STOREFRONT) {
        const response = await axios.post(
          `https://${shopUrl}/api/${apiVersion}/graphql.json`,
          {
            query: `{
              products(first: ${limit}, sortKey: TITLE) {
                edges {
                  node {
                    id
                    title
                    description
                    handle
                    priceRange {
                      minVariantPrice {
                        amount
                        currencyCode
                      }
                      maxVariantPrice {
                        amount
                        currencyCode
                      }
                    }
                    variants(first: 10) {
                      edges {
                        node {
                          id
                          title
                          price {
                            amount
                            currencyCode
                          }
                          sku
                          availableForSale
                        }
                      }
                    }
                    images(first: 5) {
                      edges {
                        node {
                          id
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }`
          },
          {
            headers: {
              'X-Shopify-Storefront-Access-Token': accessToken,
              'Content-Type': 'application/json'
            }
          }
        );
        
        await this.updateLastSynced(integration.id, 'system');
        
        return response.data.data.products;
      }
      
      // For admin API, use REST
      const response = await axios.get(
        `https://${shopUrl}/admin/api/${apiVersion}/products.json?limit=${limit}&page=${page}`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data.products;
    } catch (error) {
      throw new Error(`Failed to get Shopify products: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get orders from Shopify store
   * @param limit Number of orders to retrieve
   * @param status Order status filter
   * @param sinceId Retrieve orders after this ID
   */
  async getOrders(limit: number = 50, status: string = 'any', sinceId?: string): Promise<any> {
    try {
      // This is only available in Admin API
      if (this.integrationType !== ShopifyIntegrationType.ADMIN) {
        throw new Error('Orders can only be retrieved with Admin API access');
      }
      
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const shopUrl = config.shopUrl;
      const accessToken = config.accessToken;
      const apiVersion = config.apiVersion || ShopifyApiVersion.LATEST;
      
      if (!shopUrl || !accessToken) {
        throw new Error('Shopify credentials not configured');
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        status
      });
      
      if (sinceId) {
        params.append('since_id', sinceId);
      }
      
      const response = await axios.get(
        `https://${shopUrl}/admin/api/${apiVersion}/orders.json?${params.toString()}`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data.orders;
    } catch (error) {
      throw new Error(`Failed to get Shopify orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get customers from Shopify store
   * @param limit Number of customers to retrieve
   * @param sinceId Retrieve customers after this ID
   */
  async getCustomers(limit: number = 50, sinceId?: string): Promise<any> {
    try {
      // This is only available in Admin API
      if (this.integrationType !== ShopifyIntegrationType.ADMIN) {
        throw new Error('Customers can only be retrieved with Admin API access');
      }
      
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const shopUrl = config.shopUrl;
      const accessToken = config.accessToken;
      const apiVersion = config.apiVersion || ShopifyApiVersion.LATEST;
      
      if (!shopUrl || !accessToken) {
        throw new Error('Shopify credentials not configured');
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString()
      });
      
      if (sinceId) {
        params.append('since_id', sinceId);
      }
      
      const response = await axios.get(
        `https://${shopUrl}/admin/api/${apiVersion}/customers.json?${params.toString()}`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data.customers;
    } catch (error) {
      throw new Error(`Failed to get Shopify customers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a webhook to receive notifications from Shopify
   * @param topic Webhook topic (e.g., 'orders/create')
   * @param address Webhook URL
   * @param format Response format ('json' or 'xml')
   */
  async createWebhook(topic: string, address: string, format: 'json' | 'xml' = 'json'): Promise<any> {
    try {
      // This is only available in Admin API
      if (this.integrationType !== ShopifyIntegrationType.ADMIN) {
        throw new Error('Webhooks can only be created with Admin API access');
      }
      
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const shopUrl = config.shopUrl;
      const accessToken = config.accessToken;
      const apiVersion = config.apiVersion || ShopifyApiVersion.LATEST;
      
      if (!shopUrl || !accessToken) {
        throw new Error('Shopify credentials not configured');
      }
      
      const response = await axios.post(
        `https://${shopUrl}/admin/api/${apiVersion}/webhooks.json`,
        {
          webhook: {
            topic,
            address,
            format
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update webhook URL in integration record
      await this.updateIntegrationRecord(
        integration.id,
        {
          webhookUrl: address
        },
        'system'
      );
      
      return response.data.webhook;
    } catch (error) {
      throw new Error(`Failed to create Shopify webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Synchronize product inventory between Shopify and local database
   * @param syncInventoryOnly Only sync inventory levels (not product data)
   * @param limit Maximum number of products to sync
   */
  async syncProducts(syncInventoryOnly: boolean = false, limit: number = 100): Promise<any> {
    try {
      const products = await this.getProducts(limit);
      
      // Process products and their inventory here...
      // This would typically involve mapping Shopify products to your local database schema
      // and updating or creating records as needed
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return {
        status: 'success',
        syncedAt: new Date().toISOString(),
        productCount: Array.isArray(products) ? products.length : (products?.edges?.length || 0)
      };
    } catch (error) {
      throw new Error(`Failed to sync Shopify products: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}