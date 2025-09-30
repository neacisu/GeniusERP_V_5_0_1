/**
 * Orders Service
 * 
 * This service handles e-commerce order management including creating, updating,
 * and retrieving orders.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import { ecommerceOrders, OrderStatus } from '../../../../shared/schema/ecommerce.schema';
import { Logger } from '../../../common/logger';

// Create a logger
const logger = new Logger('OrdersService');

export class OrdersService {
  private db: PostgresJsDatabase;

  constructor(db: PostgresJsDatabase) {
    this.db = db;
    logger.info('OrdersService initialized');
  }

  /**
   * Create a new order
   * 
   * @param orderData Order data
   * @returns The created order
   */
  async createOrder(orderData: {
    userId: string;
    companyId: string;
    orderNumber: string;
    orderDate: Date;
    status: string;
    totalAmount: string;
    taxAmount: string;
    discountAmount: string;
    shippingAmount: string;
    currencyCode: string;
    shippingAddress: Record<string, any>;
    billingAddress: Record<string, any>;
    paymentMethod: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      metadata?: Record<string, any>;
    }>;
    notes?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const orderId = uuidv4();
      
      // Insert order into database
      const [order] = await this.db.insert(ecommerceOrders).values({
        id: orderId,
        userId: orderData.userId,
        companyId: orderData.companyId,
        orderNumber: orderData.orderNumber,
        orderDate: orderData.orderDate,
        status: orderData.status as OrderStatus,
        totalAmount: orderData.totalAmount,
        taxAmount: orderData.taxAmount,
        discountAmount: orderData.discountAmount,
        shippingAmount: orderData.shippingAmount,
        currencyCode: orderData.currencyCode,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        paymentMethod: orderData.paymentMethod,
        items: orderData.items,
        notes: orderData.notes || '',
        metadata: orderData.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      logger.info(`Created order ${order.orderNumber} with ID ${order.id}`);
      return order;
    } catch (error) {
      logger.error('Failed to create order', error);
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get an order by ID
   * 
   * @param orderId Order ID
   * @param companyId Company ID
   * @returns The order
   */
  async getOrderById(orderId: string, companyId: string) {
    try {
      const orders = await this.db.select()
        .from(ecommerceOrders)
        .where(
          and(
            eq(ecommerceOrders.id, orderId),
            eq(ecommerceOrders.companyId, companyId)
          )
        );
      
      if (orders.length === 0) {
        return null;
      }
      
      return orders[0];
    } catch (error) {
      logger.error(`Failed to get order ${orderId}`, error);
      throw new Error(`Failed to get order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all orders for a company
   * 
   * @param companyId Company ID
   * @param options Query options
   * @returns Array of orders
   */
  async getCompanyOrders(companyId: string, options: {
    limit?: number;
    offset?: number;
    status?: OrderStatus | 'all';
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = 'all',
        sortBy = 'orderDate',
        sortDirection = 'desc'
      } = options;
      
      let query = this.db.select()
        .from(ecommerceOrders)
        .where(eq(ecommerceOrders.companyId, companyId));
      
      // Apply status filter if not 'all'
      if (status !== 'all') {
        query = query.where(eq(ecommerceOrders.status, status));
      }
      
      // Apply sorting
      if (sortDirection === 'desc') {
        query = query.orderBy(desc(ecommerceOrders[sortBy as keyof typeof ecommerceOrders]));
      } else {
        query = query.orderBy(ecommerceOrders[sortBy as keyof typeof ecommerceOrders]);
      }
      
      // Apply pagination
      query = query.limit(limit).offset(offset);
      
      const orders = await query;
      return orders;
    } catch (error) {
      logger.error(`Failed to get orders for company ${companyId}`, error);
      throw new Error(`Failed to get company orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get orders for a user
   * 
   * @param userId User ID
   * @param companyId Company ID
   * @param options Query options
   * @returns Array of orders
   */
  async getUserOrders(userId: string, companyId: string, options: {
    limit?: number;
    offset?: number;
    status?: OrderStatus | 'all';
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = 'all',
        sortBy = 'orderDate',
        sortDirection = 'desc'
      } = options;
      
      let query = this.db.select()
        .from(ecommerceOrders)
        .where(
          and(
            eq(ecommerceOrders.userId, userId),
            eq(ecommerceOrders.companyId, companyId)
          )
        );
      
      // Apply status filter if not 'all'
      if (status !== 'all') {
        query = query.where(eq(ecommerceOrders.status, status));
      }
      
      // Apply sorting
      if (sortDirection === 'desc') {
        query = query.orderBy(desc(ecommerceOrders[sortBy as keyof typeof ecommerceOrders]));
      } else {
        query = query.orderBy(ecommerceOrders[sortBy as keyof typeof ecommerceOrders]);
      }
      
      // Apply pagination
      query = query.limit(limit).offset(offset);
      
      const orders = await query;
      return orders;
    } catch (error) {
      logger.error(`Failed to get orders for user ${userId}`, error);
      throw new Error(`Failed to get user orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update an order's status
   * 
   * @param orderId Order ID
   * @param newStatus New status
   * @param companyId Company ID
   * @returns The updated order
   */
  async updateOrderStatus(orderId: string, newStatus: OrderStatus, companyId: string) {
    try {
      const [updatedOrder] = await this.db.update(ecommerceOrders)
        .set({
          status: newStatus,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(ecommerceOrders.id, orderId),
            eq(ecommerceOrders.companyId, companyId)
          )
        )
        .returning();
      
      if (!updatedOrder) {
        throw new Error('Order not found');
      }
      
      logger.info(`Updated order ${orderId} status to ${newStatus}`);
      return updatedOrder;
    } catch (error) {
      logger.error(`Failed to update order ${orderId} status`, error);
      throw new Error(`Failed to update order status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update an order
   * 
   * @param orderId Order ID
   * @param updateData Data to update
   * @param companyId Company ID
   * @returns The updated order
   */
  async updateOrder(orderId: string, updateData: Partial<{
    shippingAddress: Record<string, any>;
    billingAddress: Record<string, any>;
    notes: string;
    metadata: Record<string, any>;
    status: OrderStatus;
    shippingAmount: string;
  }>, companyId: string) {
    try {
      const [updatedOrder] = await this.db.update(ecommerceOrders)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(ecommerceOrders.id, orderId),
            eq(ecommerceOrders.companyId, companyId)
          )
        )
        .returning();
      
      if (!updatedOrder) {
        throw new Error('Order not found');
      }
      
      logger.info(`Updated order ${orderId}`);
      return updatedOrder;
    } catch (error) {
      logger.error(`Failed to update order ${orderId}`, error);
      throw new Error(`Failed to update order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get orders count by status
   * 
   * @param companyId Company ID
   * @returns Count of orders by status
   */
  async getOrdersCountByStatus(companyId: string) {
    try {
      // This would typically involve a GROUP BY query
      // For simplicity, we're fetching all orders and counting in JavaScript
      const orders = await this.db.select()
        .from(ecommerceOrders)
        .where(eq(ecommerceOrders.companyId, companyId));
      
      const counts: Record<string, number> = {};
      
      // Initialize counts for all statuses
      Object.values(OrderStatus).forEach(status => {
        counts[status] = 0;
      });
      
      // Count orders by status
      orders.forEach(order => {
        counts[order.status] = (counts[order.status] || 0) + 1;
      });
      
      // Add total count
      counts.total = orders.length;
      
      return counts;
    } catch (error) {
      logger.error(`Failed to get orders count for company ${companyId}`, error);
      throw new Error(`Failed to get orders count: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search orders
   * 
   * @param companyId Company ID
   * @param searchTerm Search term
   * @returns Matching orders
   */
  async searchOrders(companyId: string, searchTerm: string) {
    try {
      // In a real implementation, this would use more sophisticated search
      // For now, we'll just do a simple filter on order number
      const orders = await this.db.select()
        .from(ecommerceOrders)
        .where(
          and(
            eq(ecommerceOrders.companyId, companyId)
          )
        );
      
      // Filter orders that contain the search term in order number
      // This is just a simple example - in practice, you'd use database search
      return orders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      logger.error(`Failed to search orders for company ${companyId}`, error);
      throw new Error(`Failed to search orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}