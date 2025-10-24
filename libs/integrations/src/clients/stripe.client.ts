/**
 * Stripe Integration Client
 * 
 * Client for integrating with the Stripe Payments API using the official Stripe SDK.
 */

import Stripe from 'stripe';
import { createModuleLogger } from "@common/logger/loki-logger";
import { IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';
import { BaseIntegrationClient } from './base-integration.client';

// Create a logger
const logger = createModuleLogger('StripeClient');

/**
 * Payment method type enum
 */
export enum PaymentMethodType {
  CARD = 'card',
  SEPA = 'sepa_debit',
  BANK_TRANSFER = 'bank_transfer',
  IDEAL = 'ideal',
  SOFORT = 'sofort'
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  SUCCEEDED = 'succeeded',
  PENDING = 'pending',
  FAILED = 'failed',
  CANCELED = 'canceled',
  PROCESSING = 'processing',
  REQUIRES_ACTION = 'requires_action',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_CAPTURE = 'requires_capture'
}

/**
 * Payment intent data
 */
export interface PaymentIntentData {
  id: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentMethodType?: PaymentMethodType;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  metadata?: Record<string, string>;
  invoiceId?: string;
  status: PaymentStatus;
  clientSecret?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Product data
 */
export interface ProductData {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  defaultPriceId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Stripe configuration
 */
export interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
  apiVersion?: string;
}

/**
 * Price data
 */
export interface PriceData {
  id: string;
  productId: string;
  amount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
  };
  active: boolean;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer data
 */
export interface CustomerData {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  metadata?: Record<string, string>;
  defaultPaymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Stripe API client
 */
export class StripeClient extends BaseIntegrationClient {
  private apiVersion = '2023-10-16';
  private stripe: Stripe | null = null;
  
  /**
   * Constructor
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.STRIPE, companyId, franchiseId);
    logger.info('StripeClient initialized for company', { companyId, franchiseId });
  }
  
  /**
   * Initialize integration with provided credentials
   * @param apiKey Stripe API key
   * @param webhookSecret Stripe webhook secret
   * @param userId User ID for audit
   * @returns Created integration configuration
   */
  public async initialize(
    apiKey: string,
    webhookSecret: string,
    userId: string
  ) {
    try {
      // First, check if integration already exists
      const isConnected = await this.isConnected();
      if (isConnected) {
        throw new Error('Stripe integration already connected');
      }
      
      // Create integration configuration
      const config: StripeConfig = {
        apiKey,
        webhookSecret,
        apiVersion: this.apiVersion
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
        throw new Error('Could not connect to Stripe API, please check your credentials');
      }
      
      return integration;
    } catch (error) {
      logger.error('Error initializing Stripe integration', { 
        error: error instanceof Error ? error.message : String(error), 
        companyId: this.companyId 
      });
      throw error;
    }
  }
  
  /**
   * Get Stripe instance
   * @returns Configured Stripe instance
   */
  private async getStripeInstance(): Promise<Stripe> {
    if (this.stripe) {
      return this.stripe;
    }
    
    const config = await this.getIntegrationConfig();
    if (!config || !config.apiKey) {
      throw new Error('Stripe integration not configured');
    }
    
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: (config.apiVersion || this.apiVersion) as Stripe.LatestApiVersion
    });
    
    return this.stripe;
  }
  
  /**
   * Test the connection to Stripe API
   * @returns Boolean indicating if the connection test succeeded
   */
  public async testConnection(): Promise<boolean> {
    try {
      const stripe = await this.getStripeInstance();
      
      // Test the connection by getting account info
      const account = await stripe.accounts.retrieve();
      
      return !!account.id;
    } catch (error) {
      logger.error('Error testing Stripe connection', { 
        error: error instanceof Error ? error.message : String(error),
        companyId: this.companyId
      });
      return false;
    }
  }
  
  /**
   * Create a payment intent
   * @param amount Amount in the smallest currency unit (e.g., cents for USD)
   * @param currency Three-letter ISO currency code
   * @param description Payment description
   * @param metadata Optional metadata
   * @param customerId Optional Stripe customer ID
   * @param paymentMethodId Optional payment method ID
   * @param userId User ID for audit
   * @returns Created payment intent
   */
  public async createPaymentIntent(
    amount: number,
    currency: string,
    description: string,
    metadata: Record<string, string> = {},
    customerId?: string,
    paymentMethodId?: string,
    userId?: string
  ): Promise<PaymentIntentData> {
    try {
      const stripe = await this.getStripeInstance();
      
      // Prepare options for the payment intent
      const params: Stripe.PaymentIntentCreateParams = {
        amount,
        currency,
        description,
        metadata,
      };
      
      // Add customer if provided
      if (customerId) {
        params.customer = customerId;
      }
      
      // Add payment method if provided
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
        params.confirm = true;
      }
      
      // Create payment intent using Stripe SDK
      const paymentIntent = await stripe.paymentIntents.create(params);
      
      // Update last sync time in our database
      if (userId) {
        await this.updateLastSynced(userId);
      }
      
      // Map Stripe response to our interface
      const result: PaymentIntentData = {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method as string,
        paymentMethodType: (paymentIntent.payment_method_types?.[0] || 'card') as PaymentMethodType,
        customerId: paymentIntent.customer as string,
        description: paymentIntent.description || '',
        metadata: paymentIntent.metadata,
        status: paymentIntent.status as PaymentStatus,
        clientSecret: paymentIntent.client_secret || undefined,
        createdAt: new Date(paymentIntent.created * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      logger.info('Payment intent created successfully', { 
        paymentIntentId: result.id, 
        amount: result.amount, 
        currency: result.currency 
      });
      
      return result;
    } catch (error) {
      logger.error('Error creating payment intent', {
        error: error instanceof Error ? error.message : String(error),
        amount,
        currency,
        companyId: this.companyId
      });
      
      // If the error is due to authentication, update integration status
      if (error instanceof Stripe.errors.StripeAuthenticationError) {
        const integration = await this.getIntegrationRecord();
        if (integration) {
          await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId || 'system');
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Get payment intent by ID
   * @param paymentIntentId Payment intent ID
   * @param userId User ID for audit
   * @returns Payment intent data
   */
  public async getPaymentIntent(paymentIntentId: string, userId: string): Promise<PaymentIntentData> {
    try {
      const stripe = await this.getStripeInstance();
      
      // Retrieve payment intent using Stripe SDK
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges']
      });
      
      // Get receipt URL from the first charge if available
      const charges = (paymentIntent as any).charges as Stripe.ApiList<Stripe.Charge>;
      const receiptUrl = charges?.data?.[0]?.receipt_url || undefined;
      
      // Map Stripe response to our interface
      const result: PaymentIntentData = {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method as string,
        paymentMethodType: (paymentIntent.payment_method_types?.[0] || 'card') as PaymentMethodType,
        customerId: paymentIntent.customer as string,
        description: paymentIntent.description || '',
        metadata: paymentIntent.metadata,
        status: paymentIntent.status as PaymentStatus,
        clientSecret: paymentIntent.client_secret || undefined,
        receiptUrl,
        createdAt: new Date(paymentIntent.created * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return result;
    } catch (error) {
      logger.error('Error retrieving payment intent', {
        error: error instanceof Error ? error.message : String(error),
        paymentIntentId,
        companyId: this.companyId
      });
      
      // If the error is due to authentication, update integration status
      if (error instanceof Stripe.errors.StripeAuthenticationError) {
        const integration = await this.getIntegrationRecord();
        if (integration) {
          await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Create a Stripe customer
   * @param name Customer name
   * @param email Customer email
   * @param phone Optional customer phone
   * @param address Optional customer address
   * @param metadata Optional metadata
   * @param userId User ID for audit
   * @returns Created customer
   */
  public async createCustomer(
    name: string,
    email: string,
    phone?: string,
    address?: CustomerData['address'],
    metadata: Record<string, string> = {},
    userId?: string
  ): Promise<CustomerData> {
    try {
      const stripe = await this.getStripeInstance();
      
      // Prepare customer creation parameters
      const params: Stripe.CustomerCreateParams = {
        name,
        email,
        metadata
      };
      
      if (phone) {
        params.phone = phone;
      }
      
      // Add address if provided
      if (address) {
        params.address = {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          country: address.country
        };
      }
      
      // Create customer using Stripe SDK
      const customer = await stripe.customers.create(params);
      
      // Update last sync time in our database
      if (userId) {
        await this.updateLastSynced(userId);
      }
      
      // Map Stripe response to our interface
      const result: CustomerData = {
        id: customer.id,
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || undefined,
        address: customer.address ? {
          line1: customer.address.line1 || undefined,
          line2: customer.address.line2 || undefined,
          city: customer.address.city || undefined,
          state: customer.address.state || undefined,
          postalCode: customer.address.postal_code || undefined,
          country: customer.address.country || undefined
        } : undefined,
        metadata: customer.metadata,
        defaultPaymentMethodId: customer.invoice_settings?.default_payment_method as string,
        createdAt: new Date(customer.created * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      logger.info('Customer created successfully', { 
        customerId: result.id, 
        email: result.email 
      });
      
      return result;
    } catch (error) {
      logger.error('Error creating customer', {
        error: error instanceof Error ? error.message : String(error),
        name,
        email,
        companyId: this.companyId
      });
      
      // If the error is due to authentication, update integration status
      if (error instanceof Stripe.errors.StripeAuthenticationError) {
        const integration = await this.getIntegrationRecord();
        if (integration) {
          await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId || 'system');
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Get customer by ID
   * @param customerId Customer ID
   * @param userId User ID for audit
   * @returns Customer data
   */
  public async getCustomer(customerId: string, userId: string): Promise<CustomerData> {
    try {
      const stripe = await this.getStripeInstance();
      
      // Retrieve customer using Stripe SDK
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      
      // Map Stripe response to our interface
      const result: CustomerData = {
        id: customer.id,
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || undefined,
        address: customer.address ? {
          line1: customer.address.line1 || undefined,
          line2: customer.address.line2 || undefined,
          city: customer.address.city || undefined,
          state: customer.address.state || undefined,
          postalCode: customer.address.postal_code || undefined,
          country: customer.address.country || undefined
        } : undefined,
        metadata: customer.metadata,
        defaultPaymentMethodId: customer.invoice_settings?.default_payment_method as string,
        createdAt: new Date(customer.created * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return result;
    } catch (error) {
      logger.error('Error retrieving customer', {
        error: error instanceof Error ? error.message : String(error),
        customerId,
        companyId: this.companyId
      });
      
      // If the error is due to authentication, update integration status
      if (error instanceof Stripe.errors.StripeAuthenticationError) {
        const integration = await this.getIntegrationRecord();
        if (integration) {
          await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Verify Stripe webhook signature
   * @param payload Request body as a string
   * @param signature Stripe signature from the request headers
   * @returns Boolean indicating if the signature is valid
   */
  public async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      const stripe = await this.getStripeInstance();
      const config = await this.getIntegrationConfig();
      
      if (!config?.webhookSecret) {
        logger.warn('Webhook secret not configured for Stripe integration', { companyId: this.companyId });
        return false;
      }
      
      // Verify webhook signature using Stripe SDK
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.webhookSecret
      );
      
      // If we get here, the signature is valid
      logger.info('Webhook signature verified successfully', { 
        eventType: event.type, 
        eventId: event.id 
      });
      
      return true;
    } catch (error) {
      logger.error('Error verifying webhook signature', {
        error: error instanceof Error ? error.message : String(error),
        companyId: this.companyId
      });
      return false;
    }
  }
  
  /**
   * Get integration configuration
   * @returns Integration configuration or null if not found
   */
  private async getIntegrationConfig(): Promise<StripeConfig | null> {
    try {
      // First try to get from database
      const integration = await this.integrationsService.getIntegrationByProvider(
        this.provider,
        this.companyId,
        this.franchiseId
      );
      
      if (integration && integration.config) {
        return integration.config as StripeConfig;
      }
      
      // If not found in database, check environment variables
      const envApiKey = process.env.STRIPE_SECRET_KEY;
      const envWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (envApiKey) {
        logger.info('Using Stripe API key from environment variables', { 
          companyId: this.companyId,
          usingEnvVars: true
        });
        
        return {
          apiKey: envApiKey,
          webhookSecret: envWebhookSecret,
          apiVersion: this.apiVersion
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Error retrieving integration configuration', {
        error: error instanceof Error ? error.message : String(error),
        provider: this.provider,
        companyId: this.companyId
      });
      return null;
    }
  }
  
  /**
   * Update last synced timestamp
   * @param userId User ID for audit
   */
  public async updateLastSynced(userId: string): Promise<void> {
    try {
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await super.updateLastSynced(integration.id, userId);
      }
    } catch (error) {
      logger.warn('Error updating last synced timestamp', {
        error: error instanceof Error ? error.message : String(error),
        provider: this.provider,
        companyId: this.companyId
      });
    }
  }

  /**
   * Create a subscription for a customer
   * @param customerId Customer ID
   * @param priceId Price ID
   * @param quantity Quantity
   * @param userId User ID for audit
   * @returns Created subscription
   */
  public async createSubscription(
    customerId: string,
    priceId: string,
    quantity: number,
    userId: string
  ): Promise<any> {
    try {
      const stripe = await this.getStripeInstance();
      
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId, quantity }]
      });
      
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription', {
        error: error instanceof Error ? error.message : String(error),
        customerId,
        priceId
      });
      throw error;
    }
  }

  /**
   * Handle webhook events
   * @param body Request body
   * @param signature Stripe signature
   * @param userId User ID for audit
   * @returns Processed event
   */
  public async handleWebhook(
    body: string,
    signature: string,
    userId: string
  ): Promise<any> {
    try {
      const stripe = await this.getStripeInstance();
      const config = await this.getIntegrationConfig();
      
      if (!config?.webhookSecret) {
        throw new Error('Webhook secret not configured');
      }
      
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.webhookSecret
      );
      
      return event;
    } catch (error) {
      logger.error('Error handling webhook', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get payment methods for a customer
   * @param customerId Customer ID
   * @param userId User ID for audit
   * @returns List of payment methods
   */
  public async getPaymentMethods(
    customerId: string,
    userId: string
  ): Promise<any[]> {
    try {
      const stripe = await this.getStripeInstance();
      
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      return paymentMethods.data;
    } catch (error) {
      logger.error('Error getting payment methods', {
        error: error instanceof Error ? error.message : String(error),
        customerId
      });
      throw error;
    }
  }
}

export default StripeClient;