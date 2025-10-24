/**
 * Orders Controller
 * 
 * This controller handles operations related to e-commerce orders.
 */

import { Router, Request, Response } from 'express';
import { OrdersService } from '../services/orders.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { OrderStatus } from '../../../../shared/schema/ecommerce.schema';
import { createModuleLogger } from "@common/logger/loki-logger";

// Create a logger
const logger = createModuleLogger('OrdersController');

export class OrdersController {
  private router: Router;
  private ordersService: OrdersService;

  constructor(ordersService: OrdersService) {
    this.router = Router();
    this.ordersService = ordersService;
    this.setupRoutes();
    logger.info('OrdersController initialized');
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
    // Get all orders
    this.router.get('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getOrders.bind(this));
    
    // Get order by ID
    this.router.get('/:orderId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getOrderById.bind(this));
    
    // Create new order
    this.router.post('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.createOrder.bind(this));
    
    // Update order
    this.router.put('/:orderId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateOrder.bind(this));
    
    // Update order status
    this.router.patch('/:orderId/status', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateOrderStatus.bind(this));
    
    // Get orders count by status
    this.router.get('/stats/count-by-status', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getOrdersCountByStatus.bind(this));
    
    // Search orders
    this.router.get('/search/:query', AuthGuard.protect(JwtAuthMode.REQUIRED), this.searchOrders.bind(this));
  }

  /**
   * Get all orders
   * 
   * @param req Request
   * @param res Response
   */
  private async getOrders(req: Request, res: Response) {
    try {
      // Ensure req.user is defined and extract properties safely
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId, userId } = req.user;
      const {
        limit = 50,
        offset = 0,
        status = 'all',
        sortBy = 'orderDate',
        sortDirection = 'desc',
        user = 'false' // Whether to filter by current user
      } = req.query;
      
      // Convert query parameters to appropriate types
      const options: {
        limit: number;
        offset: number;
        status: OrderStatus | 'all';
        sortBy: string;
        sortDirection: 'asc' | 'desc';
      } = {
        limit: Number(limit),
        offset: Number(offset),
        status: status as OrderStatus | 'all',
        sortBy: sortBy as string,
        sortDirection: sortDirection === 'asc' ? 'asc' : 'desc'
      };
      
      // Make sure companyId is available
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }

      let orders;
      if (user === 'true') {
        // Get orders for the current user
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required for user-specific orders'
          });
        }
        orders = await this.ordersService.getUserOrders(userId, companyId, options);
      } else {
        // Get all orders for the company
        orders = await this.ordersService.getCompanyOrders(companyId, options);
      }
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      logger.error('Failed to get orders', error);
      res.status(500).json({
        success: false,
        message: `Failed to get orders: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Get order by ID
   * 
   * @param req Request
   * @param res Response
   */
  private async getOrderById(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      
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
      
      const order = await this.ordersService.getOrderById(orderId, companyId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error(`Failed to get order ${req.params.orderId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to get order: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Create new order
   * 
   * @param req Request
   * @param res Response
   */
  private async createOrder(req: Request, res: Response) {
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
      
      const orderData = req.body;
      
      // Remove the orderDate field entirely, let the database default or SQL CURRENT_TIMESTAMP handle it
      delete orderData.orderDate;
      
      // Log for debugging
      logger.info('Creating order with database default timestamp');
      
      // Add company and user IDs to order data
      const fullOrderData = {
        ...orderData,
        companyId,
        userId
      };
      
      const newOrder = await this.ordersService.createOrder(fullOrderData);
      
      res.status(201).json({
        success: true,
        data: newOrder
      });
    } catch (error) {
      logger.error('Failed to create order', error);
      res.status(500).json({
        success: false,
        message: `Failed to create order: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Update order
   * 
   * @param req Request
   * @param res Response
   */
  private async updateOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      
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
      
      const updateData = req.body;
      
      const updatedOrder = await this.ordersService.updateOrder(orderId, updateData, companyId);
      
      res.json({
        success: true,
        data: updatedOrder
      });
    } catch (error) {
      logger.error(`Failed to update order ${req.params.orderId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to update order: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Update order status
   * 
   * @param req Request
   * @param res Response
   */
  private async updateOrderStatus(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      
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
      
      if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order status'
        });
      }
      
      const updatedOrder = await this.ordersService.updateOrderStatus(
        orderId,
        status as OrderStatus,
        companyId
      );
      
      res.json({
        success: true,
        data: updatedOrder
      });
    } catch (error) {
      logger.error(`Failed to update order status for ${req.params.orderId}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to update order status: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Get orders count by status
   * 
   * @param req Request
   * @param res Response
   */
  private async getOrdersCountByStatus(req: Request, res: Response) {
    try {
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
      
      const counts = await this.ordersService.getOrdersCountByStatus(companyId);
      
      res.json({
        success: true,
        data: counts
      });
    } catch (error) {
      logger.error('Failed to get orders count', error);
      res.status(500).json({
        success: false,
        message: `Failed to get orders count: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Search orders
   * 
   * @param req Request
   * @param res Response
   */
  private async searchOrders(req: Request, res: Response) {
    try {
      const { query } = req.params;
      
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
      
      const orders = await this.ordersService.searchOrders(companyId, query);
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      logger.error(`Failed to search orders with query ${req.params.query}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to search orders: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}