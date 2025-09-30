/**
 * Stripe Integration Client
 * 
 * Client for integrating with the Stripe Payments API.
 */

import axios from 'axios';
import { IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';
import { BaseIntegrationClient } from './base-integration.client';

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
  private baseUrl = 'https://api.stripe.com/v1';
  
  /**
   * Constructor
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.STRIPE, companyId, franchiseId);
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
      const config = {
        apiKey,
        webhookSecret,
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
        await this.updateStatus(IntegrationStatus.ERROR, userId);
        throw new Error('Could not connect to Stripe API, please check your credentials');
      }
      
      return integration;
    } catch (error) {
      console.error('[StripeClient] Error initializing integration:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Test the connection to Stripe API
   * @returns Boolean indicating if the connection test succeeded
   */
  public async testConnection() {
    try {
      const config = await this.getConfig();
      if (!config) {
        return false;
      }
      
      // Test the connection by getting account info
      const response = await axios.get(`${this.baseUrl}/account`, {
        headers: this.getHeaders(config.apiKey)
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('[StripeClient] Error testing connection:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Get HTTP headers for API requests
   * @param apiKey Stripe API key
   * @returns HTTP headers
   */
  private getHeaders(apiKey: string) {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': this.apiVersion
    };
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
  ) {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      // Build request data
      const data = new URLSearchParams();
      data.append('amount', amount.toString());
      data.append('currency', currency);
      data.append('description', description);
      
      // Add metadata
      Object.entries(metadata).forEach(([key, value]) => {
        data.append(`metadata[${key}]`, value);
      });
      
      // Add customer if provided
      if (customerId) {
        data.append('customer', customerId);
      }
      
      // Add payment method if provided
      if (paymentMethodId) {
        data.append('payment_method', paymentMethodId);
        data.append('confirm', 'true');
      }
      
      // Create payment intent
      const response = await axios.post(
        `${this.baseUrl}/payment_intents`,
        data,
        {
          headers: this.getHeaders(config.apiKey)
        }
      );
      
      // Update last sync
      if (userId) {
        await this.updateLastSync(userId);
      }
      
      // Map response to our interface
      const paymentIntent: PaymentIntentData = {
        id: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
        paymentMethod: response.data.payment_method,
        paymentMethodType: response.data.payment_method_types[0] as PaymentMethodType,
        customerId: response.data.customer,
        description: response.data.description,
        metadata: response.data.metadata,
        status: response.data.status as PaymentStatus,
        clientSecret: response.data.client_secret,
        createdAt: new Date(response.data.created * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return paymentIntent;
    } catch (error) {
      console.error('[StripeClient] Error creating payment intent:', error instanceof Error ? error.message : String(error));
      
      // If the error is due to invalid API key, update the status
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await this.updateStatus(IntegrationStatus.ERROR, userId || 'system');
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
  public async getPaymentIntent(paymentIntentId: string, userId: string) {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      // Get payment intent
      const response = await axios.get(
        `${this.baseUrl}/payment_intents/${paymentIntentId}`,
        {
          headers: this.getHeaders(config.apiKey)
        }
      );
      
      // Map response to our interface
      const paymentIntent: PaymentIntentData = {
        id: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
        paymentMethod: response.data.payment_method,
        paymentMethodType: response.data.payment_method_types[0] as PaymentMethodType,
        customerId: response.data.customer,
        description: response.data.description,
        metadata: response.data.metadata,
        status: response.data.status as PaymentStatus,
        clientSecret: response.data.client_secret,
        receiptUrl: response.data.charges?.data[0]?.receipt_url,
        createdAt: new Date(response.data.created * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return paymentIntent;
    } catch (error) {
      console.error('[StripeClient] Error getting payment intent:', error instanceof Error ? error.message : String(error));
      
      // If the error is due to invalid API key, update the status
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await this.updateStatus(IntegrationStatus.ERROR, userId);
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
  ) {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      // Build request data
      const data = new URLSearchParams();
      data.append('name', name);
      data.append('email', email);
      
      if (phone) {
        data.append('phone', phone);
      }
      
      // Add address if provided
      if (address) {
        if (address.line1) data.append('address[line1]', address.line1);
        if (address.line2) data.append('address[line2]', address.line2);
        if (address.city) data.append('address[city]', address.city);
        if (address.state) data.append('address[state]', address.state);
        if (address.postalCode) data.append('address[postal_code]', address.postalCode);
        if (address.country) data.append('address[country]', address.country);
      }
      
      // Add metadata
      Object.entries(metadata).forEach(([key, value]) => {
        data.append(`metadata[${key}]`, value);
      });
      
      // Create customer
      const response = await axios.post(
        `${this.baseUrl}/customers`,
        data,
        {
          headers: this.getHeaders(config.apiKey)
        }
      );
      
      // Update last sync
      if (userId) {
        await this.updateLastSync(userId);
      }
      
      // Map response to our interface
      const customer: CustomerData = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone,
        address: response.data.address ? {
          line1: response.data.address.line1,
          line2: response.data.address.line2,
          city: response.data.address.city,
          state: response.data.address.state,
          postalCode: response.data.address.postal_code,
          country: response.data.address.country
        } : undefined,
        metadata: response.data.metadata,
        defaultPaymentMethodId: response.data.invoice_settings?.default_payment_method,
        createdAt: new Date(response.data.created * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return customer;
    } catch (error) {
      console.error('[StripeClient] Error creating customer:', error instanceof Error ? error.message : String(error));
      
      // If the error is due to invalid API key, update the status
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await this.updateStatus(IntegrationStatus.ERROR, userId || 'system');
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
  public async getCustomer(customerId: string, userId: string) {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Integration not configured');
      }
      
      // Get customer
      const response = await axios.get(
        `${this.baseUrl}/customers/${customerId}`,
        {
          headers: this.getHeaders(config.apiKey)
        }
      );
      
      // Map response to our interface
      const customer: CustomerData = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone,
        address: response.data.address ? {
          line1: response.data.address.line1,
          line2: response.data.address.line2,
          city: response.data.address.city,
          state: response.data.address.state,
          postalCode: response.data.address.postal_code,
          country: response.data.address.country
        } : undefined,
        metadata: response.data.metadata,
        defaultPaymentMethodId: response.data.invoice_settings?.default_payment_method,
        createdAt: new Date(response.data.created * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return customer;
    } catch (error) {
      console.error('[StripeClient] Error getting customer:', error instanceof Error ? error.message : String(error));
      
      // If the error is due to invalid API key, update the status
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await this.updateStatus(IntegrationStatus.ERROR, userId);
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
  public async verifyWebhookSignature(payload: string, signature: string) {
    try {
      const config = await this.getConfig();
      if (!config || !config.webhookSecret) {
        throw new Error('Webhook secret not configured');
      }
      
      // In a real implementation, we would use the Stripe SDK:
      // const event = stripe.webhooks.constructEvent(payload, signature, config.webhookSecret);
      
      // For now, just simulate the verification
      return true;
    } catch (error) {
      console.error('[StripeClient] Error verifying webhook signature:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
}

export default StripeClient;