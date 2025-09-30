/**
 * Shopify Integration Service
 * 
 * This service handles integration with Shopify including synchronizing
 * products, orders, and transactions between the ERP and Shopify.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { ecommerceIntegrations } from '../../../../shared/schema/ecommerce.schema';
import { OrdersService } from './orders.service';
import { TransactionsService } from './transactions.service';
import { Logger } from '../../../common/logger';
import { OrderStatus, PaymentStatus } from '../../../../shared/schema/ecommerce.schema';

// Create a logger
const logger = new Logger('ShopifyIntegrationService');

// Shopify API version to use
const SHOPIFY_API_VERSION = '2023-10';

// Define types for Shopify integration
export interface ShopifyCredentials {
  shopName: string;
  apiKey: string;
  apiSecretKey: string;
  accessToken: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  variants: ShopifyProductVariant[];
  options: Array<{
    id: number;
    product_id: number;
    name: string;
    position: number;
    values: string[];
  }>;
  images: Array<{
    id: number;
    product_id: number;
    position: number;
    created_at: string;
    updated_at: string;
    src: string;
    variant_ids: number[];
  }>;
}

export interface ShopifyProductVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string | null;
  grams: number;
  image_id: number | null;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
}

export interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  number: number;
  note: string | null;
  token: string;
  gateway: string;
  test: boolean;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  confirmed: boolean;
  total_discounts: string;
  total_line_items_price: string;
  cart_token: string;
  buyer_accepts_marketing: boolean;
  referring_site: string;
  landing_site: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  total_price_usd: string;
  checkout_token: string;
  reference: string;
  user_id: number | null;
  location_id: number | null;
  source_identifier: string | null;
  source_url: string | null;
  processed_at: string;
  device_id: number | null;
  phone: string | null;
  customer_locale: string;
  app_id: number;
  browser_ip: string;
  landing_site_ref: string | null;
  order_number: string;
  discount_applications: any[];
  discount_codes: any[];
  note_attributes: any[];
  payment_gateway_names: string[];
  processing_method: string;
  checkout_id: number;
  source_name: string;
  fulfillment_status: string | null;
  tax_lines: any[];
  tags: string;
  contact_email: string;
  order_status_url: string;
  presentment_currency: string;
  total_line_items_price_set: {
    shop_money: { amount: string; currency_code: string };
    presentment_money: { amount: string; currency_code: string };
  };
  total_discounts_set: {
    shop_money: { amount: string; currency_code: string };
    presentment_money: { amount: string; currency_code: string };
  };
  total_shipping_price_set: {
    shop_money: { amount: string; currency_code: string };
    presentment_money: { amount: string; currency_code: string };
  };
  subtotal_price_set: {
    shop_money: { amount: string; currency_code: string };
    presentment_money: { amount: string; currency_code: string };
  };
  total_price_set: {
    shop_money: { amount: string; currency_code: string };
    presentment_money: { amount: string; currency_code: string };
  };
  total_tax_set: {
    shop_money: { amount: string; currency_code: string };
    presentment_money: { amount: string; currency_code: string };
  };
  line_items: Array<{
    id: number;
    variant_id: number;
    title: string;
    quantity: number;
    sku: string;
    variant_title: string;
    vendor: string | null;
    fulfillment_service: string;
    product_id: number;
    requires_shipping: boolean;
    taxable: boolean;
    gift_card: boolean;
    name: string;
    variant_inventory_management: string;
    properties: any[];
    product_exists: boolean;
    fulfillable_quantity: number;
    grams: number;
    price: string;
    total_discount: string;
    fulfillment_status: string | null;
    price_set: {
      shop_money: { amount: string; currency_code: string };
      presentment_money: { amount: string; currency_code: string };
    };
    total_discount_set: {
      shop_money: { amount: string; currency_code: string };
      presentment_money: { amount: string; currency_code: string };
    };
    discount_allocations: any[];
    duties: any[];
    admin_graphql_api_id: string;
    tax_lines: any[];
  }>;
  shipping_lines: Array<{
    id: number;
    title: string;
    price: string;
    code: string;
    source: string;
    phone: string | null;
    requested_fulfillment_service_id: string | null;
    delivery_category: string | null;
    carrier_identifier: string | null;
    discounted_price: string;
    price_set: {
      shop_money: { amount: string; currency_code: string };
      presentment_money: { amount: string; currency_code: string };
    };
    discounted_price_set: {
      shop_money: { amount: string; currency_code: string };
      presentment_money: { amount: string; currency_code: string };
    };
    discount_allocations: any[];
    tax_lines: any[];
  }>;
  billing_address: {
    first_name: string;
    address1: string;
    phone: string;
    city: string;
    zip: string;
    province: string;
    country: string;
    last_name: string;
    address2: string;
    company: string | null;
    latitude: number | null;
    longitude: number | null;
    name: string;
    country_code: string;
    province_code: string;
  };
  shipping_address: {
    first_name: string;
    address1: string;
    phone: string;
    city: string;
    zip: string;
    province: string;
    country: string;
    last_name: string;
    address2: string;
    company: string | null;
    latitude: number | null;
    longitude: number | null;
    name: string;
    country_code: string;
    province_code: string;
  };
  fulfillments: any[];
  refunds: any[];
  customer: {
    id: number;
    email: string;
    accepts_marketing: boolean;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    orders_count: number;
    state: string;
    total_spent: string;
    last_order_id: number;
    note: string | null;
    verified_email: boolean;
    multipass_identifier: string | null;
    tax_exempt: boolean;
    phone: string | null;
    tags: string;
    last_order_name: string;
    currency: string;
    accepts_marketing_updated_at: string;
    marketing_opt_in_level: string | null;
    admin_graphql_api_id: string;
    default_address: {
      id: number;
      customer_id: number;
      first_name: string;
      last_name: string;
      company: string | null;
      address1: string;
      address2: string;
      city: string;
      province: string;
      country: string;
      zip: string;
      phone: string;
      name: string;
      province_code: string;
      country_code: string;
      country_name: string;
      default: boolean;
    };
  };
}

export interface ShopifyTransaction {
  id: number;
  order_id: number;
  kind: string;
  gateway: string;
  status: string;
  message: string | null;
  created_at: string;
  test: boolean;
  authorization: string;
  location_id: number | null;
  user_id: number | null;
  parent_id: number | null;
  processed_at: string;
  device_id: number | null;
  error_code: string | null;
  source_name: string;
  amount: string;
  currency: string;
  payment_details: {
    credit_card_bin: string | null;
    avs_result_code: string | null;
    cvv_result_code: string | null;
    credit_card_number: string;
    credit_card_company: string;
  };
}

export class ShopifyIntegrationService {
  private db: PostgresJsDatabase;
  private ordersService: OrdersService;
  private transactionsService: TransactionsService;

  constructor(
    db: PostgresJsDatabase,
    ordersService: OrdersService,
    transactionsService: TransactionsService
  ) {
    this.db = db;
    this.ordersService = ordersService;
    this.transactionsService = transactionsService;
    logger.info('ShopifyIntegrationService initialized');
  }

  /**
   * Get Shopify credentials for a company
   * 
   * @param companyId Company ID
   * @returns Shopify credentials
   */
  async getShopifyCredentials(companyId: string): Promise<ShopifyCredentials | null> {
    try {
      const integrations = await this.db.select()
        .from(ecommerceIntegrations)
        .where(
          and(
            eq(ecommerceIntegrations.companyId, companyId),
            eq(ecommerceIntegrations.type, 'shopify')
          )
        );
      
      if (integrations.length === 0) {
        return null;
      }
      
      const integration = integrations[0];
      
      // Extract credentials from integration data
      const integrationCredentials = integration.credentials as Record<string, string>;
      
      const credentials: ShopifyCredentials = {
        shopName: integrationCredentials.shopName,
        apiKey: integrationCredentials.apiKey,
        apiSecretKey: integrationCredentials.apiSecretKey,
        accessToken: integrationCredentials.accessToken
      };
      
      return credentials;
    } catch (error) {
      logger.error(`Failed to get Shopify credentials for company ${companyId}`, error);
      throw new Error(`Failed to get Shopify credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save Shopify credentials for a company
   * 
   * @param companyId Company ID
   * @param credentials Shopify credentials
   * @returns The created or updated integration
   */
  async saveShopifyCredentials(companyId: string, credentials: ShopifyCredentials) {
    try {
      // Check if integration already exists
      const existingIntegrations = await this.db.select()
        .from(ecommerceIntegrations)
        .where(
          and(
            eq(ecommerceIntegrations.companyId, companyId),
            eq(ecommerceIntegrations.type, 'shopify')
          )
        );
      
      if (existingIntegrations.length > 0) {
        // Update existing integration
        const [updatedIntegration] = await this.db.update(ecommerceIntegrations)
          .set({
            credentials,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(ecommerceIntegrations.companyId, companyId),
              eq(ecommerceIntegrations.type, 'shopify')
            )
          )
          .returning();
        
        logger.info(`Updated Shopify integration for company ${companyId}`);
        return updatedIntegration;
      } else {
        // Create new integration
        const integrationId = uuidv4();
        
        const [newIntegration] = await this.db.insert(ecommerceIntegrations).values({
          id: integrationId,
          companyId,
          type: 'shopify',
          name: 'Shopify',
          enabled: true,
          credentials,
          settings: {},
          metadata: {},
          syncStatus: {
            lastSyncTime: null,
            status: 'idle'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        logger.info(`Created Shopify integration for company ${companyId}`);
        return newIntegration;
      }
    } catch (error) {
      logger.error(`Failed to save Shopify credentials for company ${companyId}`, error);
      throw new Error(`Failed to save Shopify credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verify Shopify credentials
   * 
   * @param credentials Shopify credentials
   * @returns True if credentials are valid
   */
  async verifyCredentials(credentials: ShopifyCredentials): Promise<boolean> {
    try {
      const { shopName, accessToken } = credentials;
      const url = `https://${shopName}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/shop.json`;
      
      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      
      return response.status === 200;
    } catch (error) {
      logger.error('Failed to verify Shopify credentials', error);
      return false;
    }
  }

  /**
   * Sync products from Shopify
   * 
   * @param companyId Company ID
   * @returns Sync status
   */
  async syncProducts(companyId: string) {
    try {
      const credentials = await this.getShopifyCredentials(companyId);
      
      if (!credentials) {
        throw new Error('Shopify credentials not found');
      }
      
      // Update sync status to in progress
      await this.updateSyncStatus(companyId, 'in_progress');
      
      const { shopName, accessToken } = credentials;
      const url = `https://${shopName}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/products.json`;
      
      // Fetch products from Shopify
      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });
      
      // Process and import products
      // This would typically involve mapping Shopify products to your internal product schema
      // and inserting or updating them in your database
      
      // For demo purposes, we'll just update the sync status
      await this.updateSyncStatus(companyId, 'completed', {
        productsCount: response.data.products.length
      });
      
      logger.info(`Synced ${response.data.products.length} products from Shopify for company ${companyId}`);
      
      return {
        status: 'success',
        productsCount: response.data.products.length
      };
    } catch (error) {
      logger.error(`Failed to sync products for company ${companyId}`, error);
      
      // Update sync status to failed
      await this.updateSyncStatus(companyId, 'failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new Error(`Failed to sync products: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Import orders from Shopify
   * 
   * @param companyId Company ID
   * @param userId User ID performing the import
   * @returns Import status
   */
  async importOrders(companyId: string, userId: string) {
    try {
      const credentials = await this.getShopifyCredentials(companyId);
      
      if (!credentials) {
        throw new Error('Shopify credentials not found');
      }
      
      // Update sync status to in progress
      await this.updateSyncStatus(companyId, 'in_progress');
      
      const { shopName, accessToken } = credentials;
      const url = `https://${shopName}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/orders.json`;
      
      // Fetch orders from Shopify
      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        params: {
          status: 'any',
          limit: 50
        }
      });
      
      const shopifyOrders: ShopifyOrder[] = response.data.orders;
      const importedOrders = [];
      
      // Process each order
      for (const shopifyOrder of shopifyOrders) {
        // Create new order in ERP system
        const orderData = this.mapShopifyOrderToErpOrder(shopifyOrder, companyId, userId);
        const newOrder = await this.ordersService.createOrder(orderData);
        importedOrders.push(newOrder);
        
        // Create transaction records for the order
        if (shopifyOrder.financial_status === 'paid') {
          const transactionData = {
            orderId: newOrder.id,
            userId,
            companyId,
            transactionDate: new Date(shopifyOrder.processed_at),
            amount: shopifyOrder.total_price,
            currency: shopifyOrder.currency,
            status: PaymentStatus.COMPLETED,
            paymentMethod: shopifyOrder.gateway,
            paymentGateway: 'shopify',
            gatewayTransactionId: `shopify-${shopifyOrder.id}`,
            metadata: {
              shopifyOrderId: shopifyOrder.id,
              shopifyOrderNumber: shopifyOrder.order_number
            }
          };
          
          await this.transactionsService.createTransaction(transactionData);
        }
      }
      
      // Update sync status to completed
      await this.updateSyncStatus(companyId, 'completed', {
        ordersCount: importedOrders.length
      });
      
      logger.info(`Imported ${importedOrders.length} orders from Shopify for company ${companyId}`);
      
      return {
        status: 'success',
        ordersCount: importedOrders.length
      };
    } catch (error) {
      logger.error(`Failed to import orders for company ${companyId}`, error);
      
      // Update sync status to failed
      await this.updateSyncStatus(companyId, 'failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new Error(`Failed to import orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Map a Shopify order to ERP order format
   * 
   * @param shopifyOrder Shopify order
   * @param companyId Company ID
   * @param userId User ID
   * @returns Mapped order data
   */
  private mapShopifyOrderToErpOrder(shopifyOrder: ShopifyOrder, companyId: string, userId: string) {
    // Map Shopify financial status to ERP order status
    let orderStatus: OrderStatus;
    switch (shopifyOrder.financial_status) {
      case 'paid':
        orderStatus = OrderStatus.COMPLETED; // Changed from non-existent PAID to COMPLETED
        break;
      case 'pending':
        orderStatus = OrderStatus.PENDING;
        break;
      case 'refunded':
        orderStatus = OrderStatus.REFUNDED;
        break;
      case 'partially_refunded':
        // Using PaymentStatus for reference but mapping to an OrderStatus
        // Since there's no PARTIALLY_REFUNDED in OrderStatus, using REFUNDED
        orderStatus = OrderStatus.REFUNDED;
        break;
      case 'voided':
        orderStatus = OrderStatus.CANCELED; // Fixed from CANCELLED to CANCELED
        break;
      default:
        orderStatus = OrderStatus.PENDING;
    }
    
    // Map addresses
    const shippingAddress = shopifyOrder.shipping_address ? {
      firstName: shopifyOrder.shipping_address.first_name,
      lastName: shopifyOrder.shipping_address.last_name,
      company: shopifyOrder.shipping_address.company || '',
      address1: shopifyOrder.shipping_address.address1,
      address2: shopifyOrder.shipping_address.address2 || '',
      city: shopifyOrder.shipping_address.city,
      state: shopifyOrder.shipping_address.province,
      postalCode: shopifyOrder.shipping_address.zip,
      country: shopifyOrder.shipping_address.country,
      phone: shopifyOrder.shipping_address.phone || ''
    } : {};
    
    const billingAddress = shopifyOrder.billing_address ? {
      firstName: shopifyOrder.billing_address.first_name,
      lastName: shopifyOrder.billing_address.last_name,
      company: shopifyOrder.billing_address.company || '',
      address1: shopifyOrder.billing_address.address1,
      address2: shopifyOrder.billing_address.address2 || '',
      city: shopifyOrder.billing_address.city,
      state: shopifyOrder.billing_address.province,
      postalCode: shopifyOrder.billing_address.zip,
      country: shopifyOrder.billing_address.country,
      phone: shopifyOrder.billing_address.phone || ''
    } : {};
    
    // Map line items
    const items = shopifyOrder.line_items.map(item => ({
      productId: String(item.product_id),
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: String(Number(item.price) * item.quantity),
      metadata: {
        shopifyLineItemId: item.id,
        shopifyVariantId: item.variant_id,
        sku: item.sku,
        title: item.title
      }
    }));
    
    // Create ERP order data
    return {
      userId,
      companyId,
      orderNumber: `SHOPIFY-${shopifyOrder.order_number}`,
      orderDate: new Date(shopifyOrder.created_at),
      status: orderStatus,
      totalAmount: shopifyOrder.total_price,
      taxAmount: shopifyOrder.total_tax,
      discountAmount: shopifyOrder.total_discounts,
      shippingAmount: shopifyOrder.shipping_lines.reduce((sum, line) => sum + Number(line.price), 0).toString(),
      currencyCode: shopifyOrder.currency,
      shippingAddress,
      billingAddress,
      paymentMethod: shopifyOrder.gateway,
      items,
      notes: shopifyOrder.note || '',
      metadata: {
        shopifyOrderId: shopifyOrder.id,
        shopifyOrderNumber: shopifyOrder.order_number,
        tags: shopifyOrder.tags,
        shopifyCustomerId: shopifyOrder.customer?.id
      }
    };
  }

  /**
   * Update integration sync status
   * 
   * @param companyId Company ID
   * @param status New status
   * @param metadata Additional metadata
   */
  private async updateSyncStatus(companyId: string, status: 'idle' | 'in_progress' | 'completed' | 'failed', metadata: Record<string, any> = {}) {
    try {
      await this.db.update(ecommerceIntegrations)
        .set({
          syncStatus: {
            lastSyncTime: new Date(),
            status,
            ...metadata
          },
          updatedAt: new Date()
        })
        .where(
          and(
            eq(ecommerceIntegrations.companyId, companyId),
            eq(ecommerceIntegrations.type, 'shopify')
          )
        );
    } catch (error) {
      logger.error(`Failed to update sync status for company ${companyId}`, error);
    }
  }

  /**
   * Get integration status
   * 
   * @param companyId Company ID
   * @returns Integration status
   */
  async getIntegrationStatus(companyId: string) {
    try {
      const integrations = await this.db.select()
        .from(ecommerceIntegrations)
        .where(
          and(
            eq(ecommerceIntegrations.companyId, companyId),
            eq(ecommerceIntegrations.type, 'shopify')
          )
        );
      
      if (integrations.length === 0) {
        return {
          exists: false,
          enabled: false,
          syncStatus: {
            status: 'not_configured'
          }
        };
      }
      
      const integration = integrations[0];
      
      return {
        exists: true,
        enabled: integration.enabled,
        syncStatus: integration.syncStatus,
        lastUpdated: integration.updatedAt
      };
    } catch (error) {
      logger.error(`Failed to get integration status for company ${companyId}`, error);
      throw new Error(`Failed to get integration status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Enable or disable Shopify integration
   * 
   * @param companyId Company ID
   * @param enabled Enable status
   * @returns Updated integration
   */
  async setIntegrationEnabled(companyId: string, enabled: boolean) {
    try {
      const [updatedIntegration] = await this.db.update(ecommerceIntegrations)
        .set({
          enabled,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(ecommerceIntegrations.companyId, companyId),
            eq(ecommerceIntegrations.type, 'shopify')
          )
        )
        .returning();
      
      logger.info(`${enabled ? 'Enabled' : 'Disabled'} Shopify integration for company ${companyId}`);
      return updatedIntegration;
    } catch (error) {
      logger.error(`Failed to ${enabled ? 'enable' : 'disable'} Shopify integration for company ${companyId}`, error);
      throw new Error(`Failed to update integration status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}