/**
 * Stripe Controller
 * 
 * Controller for Stripe payment operations
 */

import { Request, Response } from 'express';
import { StripeClient } from '../clients';
import { IntegrationsService } from '../services/integrations.service';
import { AuditService } from '../../audit/services/audit.service';

// Resource type for audit logs
const RESOURCE_TYPE = 'stripe';

/**
 * Controller for Stripe payment operations
 */
export class StripeController {
  private integrationsService: IntegrationsService;
  private auditService: AuditService;

  constructor() {
    this.integrationsService = new IntegrationsService();
    this.auditService = new AuditService();
  }

  /**
   * Initialize Stripe integration
   */
  async initialize(req: Request, res: Response): Promise<Response> {
    try {
      const { secretKey, publishableKey } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!secretKey || !publishableKey) {
        return res.status(400).json({
          success: false,
          error: 'Secret key and publishable key are required'
        });
      }
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Check if integration already exists
      const existingIntegration = await this.integrationsService.getIntegrationByProvider(
        'stripe',
        companyId
      );
      
      if (existingIntegration) {
        return res.status(400).json({
          success: false,
          error: 'Stripe integration already exists for this company',
          data: existingIntegration
        });
      }
      
      // Initialize Stripe client
      const stripeClient = new StripeClient(companyId);
      
      // Test connection
      const isConnected = await stripeClient.testConnection(secretKey);
      
      if (!isConnected) {
        return res.status(400).json({
          success: false,
          error: 'Failed to connect to Stripe API'
        });
      }
      
      // Create integration
      const integration = await stripeClient.initialize({
        secretKey,
        publishableKey
      }, userId);
      
      // Create audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'create',
        resourceType: RESOURCE_TYPE,
        resourceId: integration.id,
        details: {
          message: 'Stripe integration initialized'
        }
      });
      
      return res.status(201).json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('[StripeController] Initialize error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize Stripe integration'
      });
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(req: Request, res: Response): Promise<Response> {
    try {
      const { amount, currency, description, metadata } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!amount || !currency) {
        return res.status(400).json({
          success: false,
          error: 'Amount and currency are required'
        });
      }
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'stripe',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'Stripe integration not found'
        });
      }
      
      // Initialize Stripe client
      const stripeClient = new StripeClient(companyId);
      
      // Create payment intent
      const paymentIntent = await stripeClient.createPaymentIntent(
        amount,
        currency,
        description,
        metadata,
        userId
      );
      
      // Create audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'create',
        resourceType: 'payment_intent',
        resourceId: paymentIntent.id,
        details: {
          amount,
          currency,
          description: description || 'N/A'
        }
      });
      
      return res.status(201).json({
        success: true,
        data: paymentIntent
      });
    } catch (error) {
      console.error('[StripeController] Create payment intent error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment intent'
      });
    }
  }

  /**
   * Create customer
   */
  async createCustomer(req: Request, res: Response): Promise<Response> {
    try {
      const { email, name, phone, metadata } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'stripe',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'Stripe integration not found'
        });
      }
      
      // Initialize Stripe client
      const stripeClient = new StripeClient(companyId);
      
      // Create customer
      const customer = await stripeClient.createCustomer(
        email,
        name,
        phone,
        metadata,
        userId
      );
      
      // Create audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'create',
        resourceType: 'stripe_customer',
        resourceId: customer.id,
        details: {
          email,
          name: name || 'N/A'
        }
      });
      
      return res.status(201).json({
        success: true,
        data: customer
      });
    } catch (error) {
      console.error('[StripeController] Create customer error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create customer'
      });
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(req: Request, res: Response): Promise<Response> {
    try {
      const { customerId, priceId, quantity, metadata } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!customerId || !priceId) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID and price ID are required'
        });
      }
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'stripe',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'Stripe integration not found'
        });
      }
      
      // Initialize Stripe client
      const stripeClient = new StripeClient(companyId);
      
      // Create subscription
      const subscription = await stripeClient.createSubscription(
        customerId,
        priceId,
        quantity,
        metadata,
        userId
      );
      
      // Create audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'create',
        resourceType: 'subscription',
        resourceId: subscription.id,
        details: {
          customerId,
          priceId,
          quantity: quantity || 1
        }
      });
      
      return res.status(201).json({
        success: true,
        data: subscription
      });
    } catch (error) {
      console.error('[StripeController] Create subscription error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create subscription'
      });
    }
  }

  /**
   * Handle webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<Response> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;
      const { companyId } = req.params;
      
      if (!signature || !payload) {
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook request'
        });
      }
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID is required'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'stripe',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'Stripe integration not found'
        });
      }
      
      // Initialize Stripe client
      const stripeClient = new StripeClient(companyId);
      
      // Handle webhook
      const event = await stripeClient.handleWebhook(payload, signature);
      
      // Create system audit log
      await AuditService.createAuditLog({
        userId: 'system',
        companyId,
        action: 'webhook',
        resourceType: RESOURCE_TYPE,
        resourceId: event?.id || 'unknown',
        details: {
          type: event?.type || 'unknown',
          object: event?.object || 'unknown'
        }
      });
      
      return res.status(200).json({
        success: true,
        received: true
      });
    } catch (error) {
      console.error('[StripeController] Handle webhook error:', error instanceof Error ? error.message : String(error));
      
      return res.status(400).json({
        success: false,
        error: 'Failed to handle webhook'
      });
    }
  }

  /**
   * Get payment methods for customer
   */
  async getPaymentMethods(req: Request, res: Response): Promise<Response> {
    try {
      const { customerId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID is required'
        });
      }
      
      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }
      
      // Get integration
      const integration = await this.integrationsService.getIntegrationByProvider(
        'stripe',
        companyId
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'Stripe integration not found'
        });
      }
      
      // Initialize Stripe client
      const stripeClient = new StripeClient(companyId);
      
      // Get payment methods
      const paymentMethods = await stripeClient.getPaymentMethods(customerId);
      
      return res.status(200).json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      console.error('[StripeController] Get payment methods error:', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get payment methods'
      });
    }
  }
}

// Export singleton instance
export const stripeController = new StripeController();