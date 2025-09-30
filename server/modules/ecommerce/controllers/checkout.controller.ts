/**
 * Checkout Controller
 * 
 * This controller handles the checkout process, integrating with the checkout service
 * for cart and direct checkout operations.
 */

import { Router, Request, Response } from 'express';
import { CheckoutService } from '../services/checkout.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { Logger } from '../../../common/logger';

// Create a logger
const logger = new Logger('CheckoutController');

export class CheckoutController {
  private router: Router;
  private checkoutService: CheckoutService;

  constructor(checkoutService: CheckoutService) {
    this.router = Router();
    this.checkoutService = checkoutService;
    this.setupRoutes();
    logger.info('CheckoutController initialized');
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
    // Process checkout from cart
    this.router.post('/cart/:cartId', 
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      AuthGuard.roleGuard(['ecommerce_admin', 'ecommerce_user']), 
      this.processCartCheckout.bind(this)
    );
    
    // Process direct checkout (without cart)
    this.router.post('/direct', 
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      AuthGuard.roleGuard(['ecommerce_admin', 'ecommerce_user']), 
      this.processDirectCheckout.bind(this)
    );
  }

  /**
   * Process checkout from a cart
   * 
   * @param req Request
   * @param res Response
   */
  private async processCartCheckout(req: Request, res: Response) {
    try {
      const { cartId } = req.params;
      const {
        paymentMethod,
        shippingAddress,
        billingAddress,
        ...additionalDetails
      } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      // Validate required fields
      if (!paymentMethod || !shippingAddress || !billingAddress) {
        return res.status(400).json({
          success: false,
          message: 'Payment method, shipping address, and billing address are required'
        });
      }
      
      // Process cart checkout
      const checkoutResult = await this.checkoutService.processCheckout(
        cartId,
        userId,
        companyId,
        paymentMethod,
        shippingAddress,
        billingAddress,
        additionalDetails
      );
      
      res.json({
        success: true,
        data: checkoutResult
      });
    } catch (error) {
      logger.error(`Failed to process checkout for cart ${req.params.cartId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to process checkout: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Process direct checkout (without using a cart)
   * 
   * @param req Request
   * @param res Response
   */
  private async processDirectCheckout(req: Request, res: Response) {
    try {
      const {
        items,
        paymentMethod,
        shippingAddress,
        billingAddress,
        ...additionalDetails
      } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      // Validate required fields
      if (!items || !paymentMethod || !shippingAddress || !billingAddress) {
        return res.status(400).json({
          success: false,
          message: 'Items, payment method, shipping address, and billing address are required'
        });
      }
      
      // Process direct checkout
      const checkoutResult = await this.checkoutService.processDirectCheckout(
        userId,
        companyId,
        items,
        paymentMethod,
        shippingAddress,
        billingAddress,
        additionalDetails
      );
      
      res.json({
        success: true,
        data: checkoutResult
      });
    } catch (error) {
      logger.error('Failed to process direct checkout', error);
      res.status(500).json({
        success: false,
        message: `Failed to process direct checkout: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}