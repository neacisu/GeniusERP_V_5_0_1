/**
 * Cart Service
 * 
 * This service manages shopping cart operations including adding, updating, 
 * removing items, and retrieving cart contents.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { carts, cartItems, CartStatus } from '../../../../shared/schema/ecommerce.schema';
import { Logger } from '../../../common/logger';

// Create a logger
const logger = new Logger('CartService');

export class CartService {
  private db: DrizzleService;

  constructor(drizzleService: DrizzleService) {
    this.db = drizzleService;
    logger.info('CartService initialized');
  }

  /**
   * Create a new cart for a user
   * 
   * @param userId User ID
   * @param companyId Company ID
   * @returns The created cart
   */
  async createCart(userId: string, companyId: string) {
    try {
      const cartId = uuidv4();
      
      const [newCart] = await this.db.insert(carts).values({
        userId,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: CartStatus.ACTIVE,
        subtotal: "0",
        taxAmount: "0",
        discountAmount: "0",
        total: "0",
        currencyCode: 'RON', // Default to Romanian currency
        metadata: {}
      }).returning();
      
      logger.info(`Created new cart with ID for user ${userId}`);
      return newCart;
    } catch (error) {
      logger.error('Failed to create cart', error);
      throw new Error('Failed to create cart');
    }
  }

  /**
   * Get an active cart for a user, creating one if it doesn't exist
   * 
   * @param userId User ID
   * @param companyId Company ID
   * @returns The user's active cart
   */
  async getOrCreateCart(userId: string, companyId: string) {
    try {
      // Find active cart for user
      const existingCarts = await this.db.select()
        .from(carts)
        .where(
          and(
            eq(carts.userId, userId),
            eq(carts.companyId, companyId),
            eq(carts.status, CartStatus.ACTIVE)
          )
        );
      
      // Return existing cart if found
      if (existingCarts.length > 0) {
        return existingCarts[0];
      }
      
      // Create new cart if none exists
      return this.createCart(userId, companyId);
    } catch (error) {
      logger.error('Failed to get or create cart', error);
      throw new Error('Failed to get or create cart');
    }
  }

  /**
   * Add an item to a cart
   * 
   * @param cartId Cart ID
   * @param productId Product ID
   * @param quantity Quantity
   * @param unitPrice Unit price
   * @param metadata Additional metadata
   * @returns The updated cart
   */
  async addItem(
    cartId: string,
    productId: string,
    quantity: number,
    unitPrice: number,
    metadata: Record<string, any> = {}
  ) {
    try {
      // Check if item already exists in cart
      const existingItems = await this.db.select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cartId),
            eq(cartItems.productId, productId)
          )
        );
      
      if (existingItems.length > 0) {
        // Update existing item quantity
        const existingItem = existingItems[0];
        const newQuantity = existingItem.quantity + quantity;
        
        await this.db.update(cartItems)
          .set({
            quantity: newQuantity,
            totalPrice: String(newQuantity * Number(existingItem.unitPrice)),
            updatedAt: new Date()
          })
          .where(eq(cartItems.id, existingItem.id));
      } else {
        // Add new item
        await this.db.insert(cartItems).values({
          cartId,
          productId,
          quantity,
          unitPrice: String(unitPrice),
          totalPrice: String(quantity * unitPrice),
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata
        });
      }
      
      // Update cart totals
      await this.updateCartTotals(cartId);
      
      // Return updated cart with items
      return this.getCartWithItems(cartId);
    } catch (error) {
      logger.error(`Failed to add item to cart ${cartId}`, error);
      throw new Error('Failed to add item to cart');
    }
  }

  /**
   * Update the quantity of an item in the cart
   * 
   * @param cartItemId Cart item ID
   * @param quantity New quantity
   * @returns The updated cart
   */
  async updateItemQuantity(cartItemId: string, quantity: number) {
    try {
      const items = await this.db.select()
        .from(cartItems)
        .where(eq(cartItems.id, cartItemId));
      
      if (items.length === 0) {
        throw new Error('Cart item not found');
      }
      
      const item = items[0];
      
      if (quantity <= 0) {
        // Remove item if quantity is zero or negative
        await this.db.delete(cartItems)
          .where(eq(cartItems.id, cartItemId));
      } else {
        // Update item quantity
        await this.db.update(cartItems)
          .set({
            quantity,
            totalPrice: String(quantity * Number(item.unitPrice)),
            updatedAt: new Date()
          })
          .where(eq(cartItems.id, cartItemId));
      }
      
      // Update cart totals
      await this.updateCartTotals(item.cartId);
      
      // Return updated cart with items
      return this.getCartWithItems(item.cartId);
    } catch (error) {
      logger.error(`Failed to update cart item ${cartItemId}`, error);
      throw new Error('Failed to update cart item');
    }
  }

  /**
   * Remove an item from the cart
   * 
   * @param cartItemId Cart item ID
   * @returns The updated cart
   */
  async removeItem(cartItemId: string) {
    try {
      const items = await this.db.select()
        .from(cartItems)
        .where(eq(cartItems.id, cartItemId));
      
      if (items.length === 0) {
        throw new Error('Cart item not found');
      }
      
      const item = items[0];
      
      // Delete the item
      await this.db.delete(cartItems)
        .where(eq(cartItems.id, cartItemId));
      
      // Update cart totals
      await this.updateCartTotals(item.cartId);
      
      // Return updated cart with items
      return this.getCartWithItems(item.cartId);
    } catch (error) {
      logger.error(`Failed to remove cart item ${cartItemId}`, error);
      throw new Error('Failed to remove cart item');
    }
  }

  /**
   * Clear all items from a cart
   * 
   * @param cartId Cart ID
   * @returns The updated cart
   */
  async clearCart(cartId: string) {
    try {
      // Delete all items from the cart
      await this.db.delete(cartItems)
        .where(eq(cartItems.cartId, cartId));
      
      // Update cart totals
      await this.updateCartTotals(cartId);
      
      // Return updated cart
      const [cart] = await this.db.select()
        .from(carts)
        .where(eq(carts.id, cartId));
      
      return cart;
    } catch (error) {
      logger.error(`Failed to clear cart ${cartId}`, error);
      throw new Error('Failed to clear cart');
    }
  }

  /**
   * Get a cart with all its items
   * 
   * @param cartId Cart ID
   * @returns The cart with items
   */
  async getCartWithItems(cartId: string) {
    try {
      const [cart] = await this.db.select()
        .from(carts)
        .where(eq(carts.id, cartId));
      
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      const items = await this.db.select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cartId));
      
      return {
        ...cart,
        items
      };
    } catch (error) {
      logger.error(`Failed to get cart ${cartId} with items`, error);
      throw new Error('Failed to get cart with items');
    }
  }

  /**
   * Update the calculated totals for a cart
   * 
   * @param cartId Cart ID
   */
  private async updateCartTotals(cartId: string) {
    try {
      // Get all items in the cart
      const items = await this.db.select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cartId));
      
      // Calculate totals
      const subtotal = items.reduce((sum: number, item) => sum + Number(item.totalPrice), 0);
      
      // For now, we'll set tax and discount to 0
      // In a real system, these would be calculated based on business rules
      const taxAmount = 0;
      const discountAmount = 0;
      
      const total = subtotal + taxAmount - discountAmount;
      
      // Update the cart
      await this.db.update(carts)
        .set({
          subtotal: String(subtotal),
          taxAmount: String(taxAmount),
          discountAmount: String(discountAmount),
          total: String(total),
          updatedAt: new Date()
        })
        .where(eq(carts.id, cartId));
    } catch (error) {
      logger.error(`Failed to update cart totals for ${cartId}`, error);
      throw new Error('Failed to update cart totals');
    }
  }

  /**
   * Apply a discount to a cart
   * 
   * @param cartId Cart ID
   * @param discountAmount Discount amount
   * @param discountCode Discount code
   * @returns The updated cart
   */
  async applyDiscount(cartId: string, discountAmount: number, discountCode: string) {
    try {
      // Update cart with discount
      await this.db.update(carts)
        .set({
          discountAmount: String(discountAmount),
          appliedDiscountCode: discountCode,
          updatedAt: new Date()
        })
        .where(eq(carts.id, cartId));
      
      // Recalculate totals
      const [cart] = await this.db.select()
        .from(carts)
        .where(eq(carts.id, cartId));
      
      const total = Number(cart.subtotal) + Number(cart.taxAmount) - Number(cart.discountAmount);
      
      await this.db.update(carts)
        .set({
          total: String(total),
          updatedAt: new Date()
        })
        .where(eq(carts.id, cartId));
      
      // Return updated cart with items
      return this.getCartWithItems(cartId);
    } catch (error) {
      logger.error(`Failed to apply discount to cart ${cartId}`, error);
      throw new Error('Failed to apply discount');
    }
  }

  /**
   * Set the cart status
   * 
   * @param cartId Cart ID
   * @param status New status
   * @returns The updated cart
   */
  async setCartStatus(cartId: string, status: CartStatus) {
    try {
      await this.db.update(carts)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(carts.id, cartId));
      
      // Return updated cart
      const [cart] = await this.db.select()
        .from(carts)
        .where(eq(carts.id, cartId));
      
      return cart;
    } catch (error) {
      logger.error(`Failed to update cart ${cartId} status to ${status}`, error);
      throw new Error('Failed to update cart status');
    }
  }
}