/**
 * Orders Service
 * 
 * This service handles e-commerce order management including creating, updating,
 * and retrieving orders.
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import { ecommerceOrders, OrderStatus } from '../../../../shared/schema/ecommerce.schema';
import { createModuleLogger } from "@common/logger/loki-logger";

// Create a logger
const logger = createModuleLogger('OrdersService');

export class OrdersService {
  private db: DrizzleService;

  constructor(drizzleService: DrizzleService) {
    this.db = drizzleService;
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
      
      // We need to handle orderDate differently - the database column expects a timestamp with timezone
      // But we don't use orderDate.toISOString() in the insert query as this causes errors with Postgres/Drizzle
      
      // Normalize the orderDate to ensure it's a valid Date object or null
      // Let Drizzle/Postgres handle the conversion to SQL timestamp format
      let orderDate;
      
      try {
        // If it's null or undefined, use current date
        if (orderData.orderDate === null || orderData.orderDate === undefined) {
          orderDate = new Date();
          logger.info('No orderDate provided, using current date');
        }
        // If it's already a Date object, use it directly
        else if (orderData.orderDate instanceof Date) {
          orderDate = orderData.orderDate;
        }
        // If it's a string that looks like an ISO date, parse it
        else if (typeof orderData.orderDate === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(orderData.orderDate)) {
          orderDate = new Date(orderData.orderDate);
        }
        // If it's a number (timestamp), convert it
        else if (typeof orderData.orderDate === 'number') {
          orderDate = new Date(orderData.orderDate);
        }
        // For any other string, try to parse it
        else if (typeof orderData.orderDate === 'string') {
          orderDate = new Date(orderData.orderDate);
        }
        else {
          // For anything else, use current date
          orderDate = new Date();
          logger.warn(`Unrecognized orderDate format: ${typeof orderData.orderDate}, using current date`);
        }
        
        // Final validation - if the date is invalid, use current date
        if (orderDate instanceof Date && isNaN(orderDate.getTime())) {
          logger.warn(`Invalid date value: ${orderData.orderDate}, using current date instead`);
          orderDate = new Date();
        }
      } catch (error) {
        logger.error('Error parsing orderDate:', error);
        orderDate = new Date();
      }

      logger.info(`Creating order with date: ${orderDate.toISOString()}`);
      
      // Use Drizzle ORM to insert the order
      const [order] = await this.db.query(async (db) => {
        return await db.insert(ecommerceOrders).values({
          id: orderId,
          companyId: orderData.companyId,
          userId: orderData.userId,
          orderNumber: orderData.orderNumber,
          orderDate: orderDate,
          status: orderData.status,
          subtotal: orderData.totalAmount,
          tax: orderData.taxAmount,
          discount: orderData.discountAmount,
          shipping: orderData.shippingAmount,
          total: orderData.totalAmount,
          shippingAddress: orderData.shippingAddress || {},
          billingAddress: orderData.billingAddress || {},
          paymentMethod: orderData.paymentMethod,
          items: orderData.items,
          notes: orderData.notes || '',
          metadata: orderData.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
      });
      
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
      const orders = await this.db.query(async (db) => {
        return await db.select()
          .from(ecommerceOrders)
          .where(
            and(
              eq(ecommerceOrders.id, orderId),
              eq(ecommerceOrders.companyId, companyId)
            )
          );
      });
      
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
      
      const orders = await this.db.query(async (db) => {
        let query = db.select()
          .from(ecommerceOrders)
          .where(eq(ecommerceOrders.companyId, companyId));
        
        // Apply status filter if not 'all'
        if (status !== 'all') {
          query = query.where(eq(ecommerceOrders.status, status));
        }
        
        // Apply sorting
        const sortColumn = ecommerceOrders[sortBy as keyof typeof ecommerceOrders];
        if (sortColumn && typeof sortColumn !== 'function') {
          if (sortDirection === 'desc') {
            query = query.orderBy(desc(sortColumn as any));
          } else {
            query = query.orderBy(sortColumn as any);
          }
        }
        
        // Apply pagination
        query = query.limit(limit).offset(offset);
        
        return await query;
      });
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
      
      const orders = await this.db.query(async (db) => {
        let query = db.select()
          .from(ecommerceOrders)
          .where(
            and(
              eq(ecommerceOrders.customerId, userId), // Fixed: ecommerceOrders uses customerId, not userId
              eq(ecommerceOrders.companyId, companyId)
            )
          );
        
        // Apply status filter if not 'all'
        if (status !== 'all') {
          query = query.where(eq(ecommerceOrders.status, status));
        }
        
        // Apply sorting
        const sortColumn = ecommerceOrders[sortBy as keyof typeof ecommerceOrders];
        if (sortColumn && typeof sortColumn !== 'function') {
          if (sortDirection === 'desc') {
            query = query.orderBy(desc(sortColumn as any));
          } else {
            query = query.orderBy(sortColumn as any);
          }
        }
        
        // Apply pagination
        query = query.limit(limit).offset(offset);
        
        return await query;
      });
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
      const [updatedOrder] = await this.db.query(async (db) => {
        return await db.update(ecommerceOrders)
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
      });
      
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
      const [updatedOrder] = await this.db.query(async (db) => {
        return await db.update(ecommerceOrders)
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
      });
      
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
      const orders = await this.db.query(async (db) => {
        return await db.select()
          .from(ecommerceOrders)
          .where(eq(ecommerceOrders.companyId, companyId));
      });
      
      const counts: Record<string, number> = {};
      
      // Initialize counts for all statuses
      Object.values(OrderStatus).forEach(status => {
        counts[status] = 0;
      });
      
      // Count orders by status
      orders.forEach((order: any) => {
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
      const orders = await this.db.query(async (db) => {
        return await db.select()
          .from(ecommerceOrders)
          .where(
            and(
              eq(ecommerceOrders.companyId, companyId)
            )
          );
      });
      
      // Filter orders that contain the search term in order number
      // This is just a simple example - in practice, you'd use database search
      return orders.filter((order: any) => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      logger.error(`Failed to search orders for company ${companyId}`, error);
      throw new Error(`Failed to search orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}