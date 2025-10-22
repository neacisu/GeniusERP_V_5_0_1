/**
 * Cart Controller
 * 
 * This controller handles operations related to shopping carts.
 */

import { Router, Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { CartStatus } from '../../../../shared/schema/ecommerce.schema';
import { Logger } from "@common/logger";

// Create a logger
const logger = new Logger('CartController');

export class CartController {
  private router: Router;
  private cartService: CartService;

  constructor(cartService: CartService) {
    this.router = Router();
    this.cartService = cartService;
    this.setupRoutes();
    logger.info('CartController initialized');
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
    // Get or create cart for current user
    this.router.get('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getCart.bind(this));
    
    // Get cart by ID
    this.router.get('/:cartId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getCartById.bind(this));
    
    // Add item to cart
    this.router.post('/items', AuthGuard.protect(JwtAuthMode.REQUIRED), this.addItem.bind(this));
    
    // Update item quantity
    this.router.put('/items/:itemId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateItemQuantity.bind(this));
    
    // Remove item from cart
    this.router.delete('/items/:itemId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.removeItem.bind(this));
    
    // Clear cart
    this.router.delete('/:cartId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.clearCart.bind(this));
    
    // Apply discount
    this.router.post('/:cartId/discount', AuthGuard.protect(JwtAuthMode.REQUIRED), this.applyDiscount.bind(this));
    
    // Update cart status
    this.router.patch('/:cartId/status', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateCartStatus.bind(this));
  }

  /**
   * Get or create cart for current user
   * 
   * @param req Request
   * @param res Response
   */
  private async getCart(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId, userId } = req.user;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      const cart = await this.cartService.getOrCreateCart(userId, companyId);
      const cartWithItems = await this.cartService.getCartWithItems(cart.id);
      
      res.json({
        success: true,
        data: cartWithItems
      });
    } catch (error) {
      logger.error('Failed to get cart', error);
      res.status(500).json({
        success: false,
        message: `Failed to get cart: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Get cart by ID
   * 
   * @param req Request
   * @param res Response
   */
  private async getCartById(req: Request, res: Response) {
    try {
      const { cartId } = req.params;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const cartWithItems = await this.cartService.getCartWithItems(cartId);
      
      res.json({
        success: true,
        data: cartWithItems
      });
    } catch (error) {
      logger.error(`Failed to get cart ${req.params.cartId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to get cart: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Add item to cart
   * 
   * @param req Request
   * @param res Response
   */
  private async addItem(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId, userId } = req.user;
      const { cartId, productId, quantity, unitPrice, metadata } = req.body;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      if (!cartId || !productId || !quantity || !unitPrice) {
        return res.status(400).json({
          success: false,
          message: 'Cart ID, product ID, quantity, and unit price are required'
        });
      }
      
      const updatedCart = await this.cartService.addItem(
        cartId,
        productId,
        Number(quantity),
        Number(unitPrice),
        metadata
      );
      
      res.json({
        success: true,
        data: updatedCart
      });
    } catch (error) {
      logger.error('Failed to add item to cart', error);
      res.status(500).json({
        success: false,
        message: `Failed to add item to cart: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Update item quantity
   * 
   * @param req Request
   * @param res Response
   */
  private async updateItemQuantity(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { itemId } = req.params;
      const { quantity } = req.body;
      
      if (!quantity && quantity !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity is required'
        });
      }
      
      const updatedCart = await this.cartService.updateItemQuantity(itemId, Number(quantity));
      
      res.json({
        success: true,
        data: updatedCart
      });
    } catch (error) {
      logger.error(`Failed to update cart item ${req.params.itemId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to update cart item: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Remove item from cart
   * 
   * @param req Request
   * @param res Response
   */
  private async removeItem(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { itemId } = req.params;
      
      const updatedCart = await this.cartService.removeItem(itemId);
      
      res.json({
        success: true,
        data: updatedCart
      });
    } catch (error) {
      logger.error(`Failed to remove cart item ${req.params.itemId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to remove cart item: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Clear cart
   * 
   * @param req Request
   * @param res Response
   */
  private async clearCart(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { cartId } = req.params;
      
      const cart = await this.cartService.clearCart(cartId);
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error(`Failed to clear cart ${req.params.cartId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to clear cart: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Apply discount
   * 
   * @param req Request
   * @param res Response
   */
  private async applyDiscount(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { cartId } = req.params;
      const { discountAmount, discountCode } = req.body;
      
      if (!discountAmount || !discountCode) {
        return res.status(400).json({
          success: false,
          message: 'Discount amount and code are required'
        });
      }
      
      const updatedCart = await this.cartService.applyDiscount(
        cartId,
        Number(discountAmount),
        discountCode
      );
      
      res.json({
        success: true,
        data: updatedCart
      });
    } catch (error) {
      logger.error(`Failed to apply discount to cart ${req.params.cartId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to apply discount: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Update cart status
   * 
   * @param req Request
   * @param res Response
   */
  private async updateCartStatus(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { cartId } = req.params;
      const { status } = req.body;
      
      if (!status || !Object.values(CartStatus).includes(status as CartStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cart status'
        });
      }
      
      const updatedCart = await this.cartService.setCartStatus(
        cartId,
        status as CartStatus
      );
      
      res.json({
        success: true,
        data: updatedCart
      });
    } catch (error) {
      logger.error(`Failed to update cart status for ${req.params.cartId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to update cart status: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}