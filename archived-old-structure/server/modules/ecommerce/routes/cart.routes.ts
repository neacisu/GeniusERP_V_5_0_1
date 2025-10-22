/**
 * Cart Router
 * 
 * This router handles routes related to shopping cart management.
 */

import { Router, Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { Logger } from '../../../common/logger.js';

// Create a logger
const logger = new Logger('CartRouter');

export class CartRouter {
  private router: Router;
  private cartService: CartService;

  constructor(cartService: CartService) {
    this.router = Router();
    this.cartService = cartService;
    this.setupRoutes();
    logger.info('CartRouter initialized');
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
    // Get active cart for user
    this.router.get('/active', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getActiveCart.bind(this));
    
    // Get cart by ID
    this.router.get('/:cartId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getCartById.bind(this));
    
    // Add item to cart
    this.router.post('/item', AuthGuard.protect(JwtAuthMode.REQUIRED), this.addCartItem.bind(this));
    
    // Update cart item quantity
    this.router.put('/item/:itemId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateCartItem.bind(this));
    
    // Remove item from cart
    this.router.delete('/item/:itemId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.removeCartItem.bind(this));
    
    // Clear cart
    this.router.delete('/:cartId/clear', AuthGuard.protect(JwtAuthMode.REQUIRED), this.clearCart.bind(this));
    
    // Apply discount to cart
    this.router.post('/:cartId/discount', AuthGuard.protect(JwtAuthMode.REQUIRED), this.applyDiscount.bind(this));
  }

  /**
   * Get the active cart for the authenticated user
   * 
   * @param req Request
   * @param res Response
   */
  private async getActiveCart(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { userId, companyId } = req.user;
      
      if (!userId || !companyId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and Company ID are required'
        });
      }
      
      // Get active cart for user
      const cart = await this.cartService.getActiveCart(userId, companyId as string);
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error('Failed to get active cart', error);
      res.status(500).json({
        success: false,
        message: `Failed to get active cart: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Get a cart by ID
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
      
      const { companyId } = req.user;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      // Get cart by ID
      const cart = await this.cartService.getCartById(cartId, companyId as string);
      
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: `Cart with ID ${cartId} not found`
        });
      }
      
      res.json({
        success: true,
        data: cart
      });
    } catch (error) {
      logger.error(`Failed to get cart with ID ${req.params.cartId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to get cart: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Add an item to the cart
   * 
   * @param req Request
   * @param res Response
   */
  private async addCartItem(req: Request, res: Response) {
    try {
      const { cartId, productId, quantity, unitPrice, metadata } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { userId, companyId } = req.user;
      
      if (!userId || !companyId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and Company ID are required'
        });
      }
      
      // Validate required fields
      if (!productId || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Product ID and quantity are required'
        });
      }
      
      // Add item to cart
      // If no cartId provided, get or create active cart first
      let activeCartId = cartId;
      if (!activeCartId) {
        const activeCart = await this.cartService.getOrCreateCart(userId as string, companyId as string);
        activeCartId = activeCart.id;
      }
      
      const updatedCart = await this.cartService.addItem(
        activeCartId,
        productId,
        quantity,
        unitPrice,
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
   * Update cart item quantity
   * 
   * @param req Request
   * @param res Response
   */
  private async updateCartItem(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      // Validate required fields
      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }
      
      // Update cart item quantity
      const updatedCart = await this.cartService.updateItemQuantity(
        itemId,
        quantity
      );
      
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
   * Remove an item from the cart
   * 
   * @param req Request
   * @param res Response
   */
  private async removeCartItem(req: Request, res: Response) {
    try {
      const { itemId } = req.params;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      // Remove item from cart
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
   * Clear all items from the cart
   * 
   * @param req Request
   * @param res Response
   */
  private async clearCart(req: Request, res: Response) {
    try {
      const { cartId } = req.params;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      // Clear cart
      const clearedCart = await this.cartService.clearCart(cartId);
      
      res.json({
        success: true,
        data: clearedCart
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
   * Apply a discount to the cart
   * 
   * @param req Request
   * @param res Response
   */
  private async applyDiscount(req: Request, res: Response) {
    try {
      const { cartId } = req.params;
      const { discountCode, discountAmount, discountType } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      // Validate required fields
      if (!discountAmount || !discountType) {
        return res.status(400).json({
          success: false,
          message: 'Discount amount and type are required'
        });
      }
      
      // Apply discount to cart
      const updatedCart = await this.cartService.applyDiscount(
        cartId,
        discountAmount,
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
}