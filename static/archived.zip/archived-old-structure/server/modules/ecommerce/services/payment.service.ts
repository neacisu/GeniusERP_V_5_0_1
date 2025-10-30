/**
 * Payment Service
 * 
 * This service handles payment processing through various payment gateways,
 * including Stripe, PayPal, and manual payments.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { Logger } from '../../../common/logger';
import { IntegrationService, IntegrationProvider } from '../../../common/services/integration.service';
import { PaymentMethod, mapPaymentMethodToGateway } from '../utils/payment-methods.util';

// Initialize logger
const logger = new Logger('PaymentService');

// Define types for Stripe client
type StripeClient = Stripe;

/**
 * Payment result status enum
 */
export enum PaymentResultStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
  CANCELED = 'canceled',
  REQUIRES_ACTION = 'requires_action'
}

/**
 * Payment processing options
 */
export interface PaymentOptions {
  idempotencyKey?: string;
  capture?: boolean;
  metadata?: Record<string, any>;
  description?: string;
  receiptEmail?: string;
  statementDescriptor?: string;
  returnUrl?: string;
}

/**
 * Payment intent data
 */
export interface PaymentIntentData {
  id: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  customerId?: string;
  receiptUrl?: string;
  createdAt?: number;
  metadata?: Record<string, any>;
}

/**
 * Payment refund data
 */
export interface PaymentRefundData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentIntentId: string;
  reason?: string;
  createdAt?: number;
  metadata?: Record<string, any>;
}

/**
 * Payment service class for processing payments through various gateways
 */
export class PaymentService {
  private stripeClient: StripeClient | null = null;

  /**
   * Create a new PaymentService instance
   * 
   * @param db Database connection
   * @param integrationService Integration service for retrieving payment gateway credentials
   */
  constructor(
    private db: PostgresJsDatabase,
    private integrationService: IntegrationService
  ) {
    logger.info('PaymentService initialized');
  }

  /**
   * Get integration client configuration
   * 
   * @param provider Integration provider name
   * @param companyId Company ID
   * @returns Client configuration or null if not found
   */
  private async getIntegrationConfig(provider: IntegrationProvider, companyId: string): Promise<any | null> {
    try {
      // Use the standard method to get integration credentials
      if (typeof this.integrationService.getIntegrationCredentials === 'function') {
        return await this.integrationService.getIntegrationCredentials(provider, companyId, 'system');
      }
      
      return null;
    } catch (error) {
      logger.warn(`Error getting integration config for ${provider}: ${error}`);
      return null;
    }
  }

  /**
   * Initialize payment gateway clients
   * 
   * @param companyId Company ID
   */
  async initializeClients(companyId: string): Promise<void> {
    try {
      // Initialize Stripe client if needed
      if (!this.stripeClient) {
        // Try to get from integration service
        const stripeConfig = await this.getIntegrationConfig(IntegrationProvider.STRIPE, companyId);

        if (stripeConfig && stripeConfig.secretKey) {
          this.stripeClient = new Stripe(stripeConfig.secretKey, {
            apiVersion: '2025-09-30.clover',
          });
          logger.info(`Stripe client initialized for company ${companyId}`);
        } else {
          logger.warn(`No Stripe configuration found for company ${companyId}`);
        }
      }

    } catch (error) {
      logger.error(`Error initializing payment gateway clients for company ${companyId}`, error);
    }
    
    // Try to initialize with environment variables as fallback
    if (!this.stripeClient && process.env.STRIPE_SECRET_KEY) {
      this.stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-09-30.clover',
      });
      logger.info('Stripe client initialized using environment variables');
    }
  }

  /**
   * Process a payment using the appropriate payment gateway
   * 
   * @param companyId Company ID
   * @param userId User ID
   * @param paymentMethod Payment method
   * @param amount Amount in cents/smallest currency unit
   * @param currency Currency code (e.g., 'usd')
   * @param options Payment options
   * @returns Payment result
   */
  async processPayment(
    companyId: string,
    userId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    currency: string,
    options: PaymentOptions = {}
  ): Promise<{ status: PaymentResultStatus; data: PaymentIntentData | null; error?: string }> {
    try {
      // Initialize clients if needed
      await this.initializeClients(companyId);

      // Determine the appropriate payment gateway based on the payment method
      const gateway = mapPaymentMethodToGateway(paymentMethod);

      logger.info(`Processing payment for company ${companyId} using ${gateway} gateway (payment method: ${paymentMethod})`);

      // Process payment through the appropriate gateway
      switch (gateway) {
        case 'stripe':
          return await this.processStripePayment(companyId, userId, amount, currency, paymentMethod, options);
        case 'paypal':
          throw new Error('PayPal payment processing not implemented yet');
        case 'manual':
          return this.processManualPayment(companyId, userId, amount, currency, paymentMethod, options);
        default:
          throw new Error(`Unsupported payment gateway: ${gateway}`);
      }
    } catch (error) {
      logger.error(`Error processing payment for company ${companyId}`, error);
      return {
        status: PaymentResultStatus.FAILED,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Process a payment using Stripe
   * 
   * @param companyId Company ID
   * @param userId User ID
   * @param amount Amount in cents/smallest currency unit
   * @param currency Currency code (e.g., 'usd')
   * @param paymentMethod Payment method
   * @param options Payment options
   * @returns Payment result
   */
  private async processStripePayment(
    companyId: string,
    userId: string,
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    options: PaymentOptions
  ): Promise<{ status: PaymentResultStatus; data: PaymentIntentData | null; error?: string }> {
    try {
      if (!this.stripeClient) {
        throw new Error('Stripe client is not initialized. Please check your Stripe configuration.');
      }

      const paymentIntent = await this.stripeClient.paymentIntents.create({
        amount,
        currency,
        payment_method_types: ['card'],
        capture_method: options.capture === false ? 'manual' : 'automatic',
        description: options.description,
        receipt_email: options.receiptEmail,
        statement_descriptor: options.statementDescriptor?.substring(0, 22), // Stripe limits to 22 chars
        metadata: {
          ...options.metadata,
          companyId,
          userId
        }
      }, {
        idempotencyKey: options.idempotencyKey || uuidv4()
      });

      logger.info(`Stripe payment intent created: ${paymentIntent.id}`);

      let status: PaymentResultStatus;
      
      // Map Stripe status to our payment status
      switch (paymentIntent.status) {
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
        case 'processing':
          status = PaymentResultStatus.PENDING;
          break;
        case 'requires_capture':
          status = PaymentResultStatus.SUCCESS; // Payment authorized but not captured
          break;
        case 'canceled':
          status = PaymentResultStatus.CANCELED;
          break;
        case 'succeeded':
          status = PaymentResultStatus.SUCCESS;
          break;
        default:
          status = PaymentResultStatus.PENDING;
      }

      // Convert Stripe payment intent to our standardized format
      const paymentData: PaymentIntentData = {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method?.toString() || undefined,
        customerId: paymentIntent.customer?.toString() || undefined,
        receiptUrl: paymentIntent.latest_charge && typeof paymentIntent.latest_charge === 'object' ? (paymentIntent.latest_charge as any).receipt_url : undefined,
        createdAt: paymentIntent.created,
        metadata: paymentIntent.metadata as Record<string, any> | undefined
      };

      return {
        status,
        data: paymentData
      };
    } catch (error) {
      logger.error(`Stripe payment processing error for company ${companyId}`, error);
      
      // Format Stripe errors in a more user-friendly way
      let errorMessage = 'Payment processing failed';
      
      if (error instanceof Stripe.errors.StripeError) {
        switch (error.type) {
          case 'StripeCardError':
            errorMessage = `Card error: ${error.message}`;
            break;
          case 'StripeRateLimitError':
            errorMessage = 'Rate limit exceeded. Please try again later.';
            break;
          case 'StripeInvalidRequestError':
            errorMessage = `Invalid request: ${error.message}`;
            break;
          case 'StripeAPIError':
            errorMessage = 'Payment system temporarily unavailable. Please try again later.';
            break;
          case 'StripeAuthenticationError':
            errorMessage = 'Authentication with payment provider failed. Please contact support.';
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        status: PaymentResultStatus.FAILED,
        data: null,
        error: errorMessage
      };
    }
  }

  /**
   * Process a refund through the appropriate payment gateway
   * 
   * @param companyId Company ID
   * @param userId User ID
   * @param paymentIntentId Payment intent ID to refund
   * @param amount Amount to refund (null for full refund)
   * @param reason Reason for the refund
   * @param metadata Additional metadata
   * @returns Refund result
   */
  async processRefund(
    companyId: string,
    userId: string,
    paymentIntentId: string,
    amount?: number,
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; data: PaymentRefundData | null; error?: string }> {
    try {
      // Initialize clients if needed
      await this.initializeClients(companyId);

      if (!this.stripeClient) {
        throw new Error('Stripe client is not initialized. Please check your Stripe configuration.');
      }

      // Create refund in Stripe
      const refund = await this.stripeClient.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          ...metadata,
          companyId,
          userId,
          refundedBy: userId
        }
      }, {
        idempotencyKey: uuidv4()
      });

      logger.info(`Refund processed for payment intent ${paymentIntentId}: ${refund.id}`);

      // Convert Stripe refund to our standardized format
      const refundData: PaymentRefundData = {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status || 'unknown',
        paymentIntentId: paymentIntentId,
        reason: refund.reason || reason,
        createdAt: refund.created,
        metadata: (refund.metadata as Record<string, any>) || undefined
      };

      return {
        success: true,
        data: refundData
      };
    } catch (error) {
      logger.error(`Error processing refund for payment intent ${paymentIntentId}`, error);
      
      let errorMessage = 'Refund processing failed';
      
      if (error instanceof Stripe.errors.StripeError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        data: null,
        error: errorMessage
      };
    }
  }

  /**
   * Process a manual payment (e.g., bank transfer, cash)
   * 
   * @param companyId Company ID
   * @param userId User ID
   * @param amount Amount in cents/smallest currency unit
   * @param currency Currency code (e.g., 'usd')
   * @param paymentMethod Payment method
   * @param options Payment options
   * @returns Payment result
   */
  private processManualPayment(
    companyId: string,
    userId: string,
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    options: PaymentOptions
  ): { status: PaymentResultStatus; data: PaymentIntentData; error?: undefined } {
    logger.info(`Processing manual payment for company ${companyId} (payment method: ${paymentMethod})`);

    // Generate a unique ID for this manual payment
    const paymentId = uuidv4();
    
    // Create a payment data object that mirrors the structure of payment intent data
    const paymentData: PaymentIntentData = {
      id: paymentId,
      amount,
      currency,
      status: 'pending', // Manual payments are initially pending
      createdAt: Math.floor(Date.now() / 1000),
      metadata: {
        ...options.metadata,
        companyId,
        userId,
        paymentMethod,
        manual: true
      }
    };

    return {
      status: PaymentResultStatus.PENDING,
      data: paymentData
    };
  }

  /**
   * Check if a specific payment gateway is available
   * 
   * @param companyId Company ID
   * @param gateway Payment gateway to check
   * @returns Boolean indicating if the gateway is available
   */
  async isGatewayAvailable(companyId: string, gateway: 'stripe' | 'paypal' | 'manual'): Promise<boolean> {
    try {
      if (gateway === 'manual') {
        return true; // Manual payments are always available
      }

      await this.initializeClients(companyId);

      switch (gateway) {
        case 'stripe':
          return this.stripeClient !== null;
        case 'paypal':
          return false; // PayPal not implemented yet
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Error checking gateway availability for ${gateway}`, error);
      return false;
    }
  }

  /**
   * Get the Stripe client
   * 
   * @returns Stripe client or null if not initialized
   */
  getStripeClient(): StripeClient | null {
    return this.stripeClient;
  }

  /**
   * Manually set the Stripe client (useful for testing)
   * 
   * @param config Stripe configuration
   */
  setStripeClient(config: { secretKey: string, apiVersion: string }): void {
    this.stripeClient = new Stripe(config.secretKey, {
      apiVersion: config.apiVersion as Stripe.LatestApiVersion,
    });
  }

  /**
   * Manually reset all clients (useful for testing)
   */
  resetClients(config?: { secretKey: string, apiVersion: string }): void {
    if (config) {
      this.setStripeClient(config);
    } else {
      this.stripeClient = null;
    }
  }
}