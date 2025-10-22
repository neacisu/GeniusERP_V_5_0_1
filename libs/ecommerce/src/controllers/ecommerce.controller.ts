/**
 * E-Commerce Controller
 * 
 * This controller handles the main e-commerce operations including payment processing and order creation.
 */

import { Router, Request, Response } from 'express';
import { Logger } from "@common/logger";
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { PaymentService, PaymentResultStatus } from '../services/payment.service';
import { v4 as uuidv4 } from 'uuid';

// Create a logger
const logger = new Logger('ECommerceController');

export class ECommerceController {
  private router: Router;
  private paymentService: PaymentService;

  constructor(paymentService?: PaymentService) {
    this.router = Router();
    
    if (paymentService) {
      this.paymentService = paymentService;
    } else {
      logger.warn('PaymentService not provided to ECommerceController, some features may be unavailable');
      // We'll handle this in the processPayment method
      this.paymentService = null as unknown as PaymentService;
    }
    
    this.setupRoutes();
    logger.info('ECommerceController initialized');
  }

  /**
   * Get the router
   * 
   * @returns Express router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Setup routes
   */
  private setupRoutes() {
    // Order creation placeholder endpoint with role-based access control
    this.router.post(
      '/order-placeholder', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard(['ecommerce_admin', 'ecommerce_manager', 'ecommerce_user']),
      AuthGuard.companyGuard('companyId'), 
      this.orderPlaceholder.bind(this)
    );

    // Direct payment processing endpoint with proper authentication
    this.router.post(
      '/payment',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard(['ecommerce_admin', 'ecommerce_manager', 'sales_team']),
      AuthGuard.companyGuard('companyId'),
      this.processPayment.bind(this)
    );
  }

  /**
   * Order creation placeholder
   * 
   * @param req Request
   * @param res Response
   */
  private async orderPlaceholder(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { id, companyId } = req.user;
      
      if (!companyId || !id) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      // Process request data
      const orderData = req.body;
      
      // Return successful response with received data
      res.status(200).json({
        success: true,
        message: 'E-commerce order creation placeholder',
        timestamp: new Date().toISOString(),
        user: {
          id: id,
          companyId: companyId
        },
        data: orderData
      });
    } catch (error) {
      logger.error('Error in order placeholder endpoint', error);
      res.status(500).json({
        success: false,
        message: `Error processing request: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Process a payment directly through the payment service
   * 
   * This endpoint provides direct access to process payments via Stripe integration
   * 
   * @param req Request
   * @param res Response
   */
  private async processPayment(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      // Check if payment service is available
      if (!this.paymentService) {
        return res.status(503).json({
          success: false,
          message: 'Payment service is not available. Please try again later or contact support.'
        });
      }
      
      const { id: userId, companyId } = req.user;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      // Extract payment details from request body
      const { 
        amount, 
        currency = 'usd', 
        paymentMethod = 'credit_card',
        paymentMethodId, 
        customerId,
        description = 'Direct payment',
        capture = true,
        receiptEmail,
        metadata = {} 
      } = req.body;
      
      // Validate required fields
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Amount is required'
        });
      }
      
      // Add request ID for idempotency
      const requestId = req.body.requestId || uuidv4();
      
      // Convert amount to cents/smallest currency unit if not already
      const amountInSmallestUnit = Math.round(parseFloat(amount) * 100);
      
      // Process the payment through the payment service
      const paymentResult = await this.paymentService.processPayment(
        companyId,
        userId,
        paymentMethod,
        amountInSmallestUnit,
        currency,
        {
          idempotencyKey: requestId,
          description,
          capture,
          receiptEmail,
          metadata: {
            ...metadata,
            directPayment: true,
            requestId,
            paymentMethodId
          }
        }
      );
      
      // Return payment processing result
      const isSuccess = paymentResult.status === PaymentResultStatus.SUCCESS;
      res.status(isSuccess ? 200 : 402).json({
        success: isSuccess,
        status: paymentResult.status,
        data: paymentResult.data,
        message: paymentResult.error || 'Payment processed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error processing payment', error);
      res.status(500).json({
        success: false,
        message: `Error processing payment: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}

// Export default instance for convenience
export default new ECommerceController().getRouter();