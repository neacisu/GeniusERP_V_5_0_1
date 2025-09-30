/**
 * E-Commerce Module
 * 
 * This module provides e-commerce functionality including order management,
 * payment processing, and integration with external e-commerce platforms.
 */

import { Express } from 'express';
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Logger } from '../../common/logger';
import { OrdersService } from './services/orders.service';
import { TransactionsService } from './services/transactions.service';
import { OrdersRouter } from './routes/orders.routes';
import { TransactionsRouter } from './routes/transactions.routes';
import { ShopifyRouter } from './routes/shopify.routes';
import { CartRouter } from './routes/cart.routes';
import { CheckoutRouter } from './routes/checkout.routes';
import { POSRouter } from './routes/pos.routes';
import { ShopifyIntegrationService } from './services/shopify-integration.service';
import { CartService } from './services/cart.service';
import { CheckoutService } from './services/checkout.service';
import { POSIntegrationService } from './services/pos-integration.service';
import { InventoryModule } from '../inventory/inventory.module';
import { CrmModule } from '../crm/crm.module';
import { ECommerceController } from './controllers/ecommerce.controller';

// Create a logger for the module
const logger = new Logger('ECommerceModule');

/**
 * Initialize the E-Commerce module
 * @param app Express application instance
 * @param db Database connection
 * @returns Information about the initialized module
 */
export function initECommerceModule(app: Express, db: PostgresJsDatabase) {
  logger.info('Initializing E-Commerce module');
  
  try {
    // Initialize core services
    const ordersService = new OrdersService(db);
    const transactionsService = new TransactionsService(db);
    
    // Initialize cart and checkout services
    const cartService = new CartService(db);
    const checkoutService = new CheckoutService(db, ordersService, transactionsService, cartService);
    
    // Initialize integration services
    const shopifyService = new ShopifyIntegrationService(db, ordersService, transactionsService);
    const posService = new POSIntegrationService(db, ordersService, transactionsService);
    
    // Initialize and mount routers
    const ordersRouter = new OrdersRouter(ordersService);
    const transactionsRouter = new TransactionsRouter(transactionsService);
    const shopifyRouter = new ShopifyRouter(shopifyService);
    
    // Initialize cart, checkout, and POS routers
    const cartRouter = new CartRouter(cartService);
    const checkoutRouter = new CheckoutRouter(checkoutService);
    const posRouter = new POSRouter(posService);
    
    // Initialize main ecommerce controller
    const ecommerceController = new ECommerceController();
    
    // Mount routes
    app.use('/api/ecommerce/orders', ordersRouter.getRouter());
    app.use('/api/ecommerce/transactions', transactionsRouter.getRouter());
    app.use('/api/ecommerce/shopify', shopifyRouter.getRouter());
    app.use('/api/ecommerce/cart', cartRouter.getRouter());
    app.use('/api/ecommerce/checkout', checkoutRouter.getRouter());
    app.use('/api/ecommerce/pos', posRouter.getRouter());
    app.use('/api/v1/ecommerce', ecommerceController.getRouter());
    
    logger.info('E-Commerce module initialized successfully');
    
    return {
      name: ECommerceModule.name,
      version: ECommerceModule.version,
      services: {
        ordersService,
        transactionsService,
        cartService,
        checkoutService,
        shopifyService,
        posService
      }
    };
  } catch (error) {
    logger.error('Failed to initialize E-Commerce module', error);
    throw new Error('E-Commerce module initialization failed');
  }
}

/**
 * E-Commerce module configuration object
 */
export const ECommerceModule = {
  name: 'ecommerce',
  displayName: 'E-Commerce',
  description: 'Manage online sales, orders, and payments including integrations with e-commerce platforms',
  version: '1.0.0',
  initialize: initECommerceModule,
  
  /**
   * Register the module with the application
   * @param app Express application
   * @param db Database connection
   * @returns Information about the registered module
   */
  register: (app: Express, db: PostgresJsDatabase) => {
    const moduleInfo = initECommerceModule(app, db);
    
    // Register module with service registry if available
    try {
      const { registerModule } = require('../../common/services');
      registerModule('ecommerce', {
        name: ECommerceModule.name,
        version: ECommerceModule.version,
        services: moduleInfo.services,
        permissions: ECommerceModule.permissions
      });
      logger.info('E-Commerce module registered with service registry');
    } catch (error) {
      logger.warn('Service registry not available, module services will not be globally accessible', error);
    }
    
    return moduleInfo;
  },
  
  defaultRoles: [
    'ecommerce_admin',
    'ecommerce_user',
    'ecommerce_viewer'
  ],
  permissions: [
    'ecommerce.orders.create',
    'ecommerce.orders.read',
    'ecommerce.orders.update',
    'ecommerce.orders.delete',
    'ecommerce.transactions.create',
    'ecommerce.transactions.read',
    'ecommerce.transactions.update',
    'ecommerce.integrations.configure',
    'ecommerce.integrations.sync',
    'ecommerce.pos.manage',
    'ecommerce.cart.manage',
    'ecommerce.checkout.process'
  ],
  routes: [
    {
      path: '/api/ecommerce/orders',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      description: 'Manage e-commerce orders'
    },
    {
      path: '/api/ecommerce/transactions',
      methods: ['GET', 'POST', 'PUT'],
      description: 'Manage payment transactions'
    },
    {
      path: '/api/ecommerce/shopify',
      methods: ['GET', 'POST', 'PUT'],
      description: 'Shopify integration and synchronization'
    },
    {
      path: '/api/ecommerce/cart',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      description: 'Shopping cart management'
    },
    {
      path: '/api/ecommerce/checkout',
      methods: ['GET', 'POST'],
      description: 'Checkout process management'
    },
    {
      path: '/api/ecommerce/pos',
      methods: ['GET', 'POST', 'PUT'],
      description: 'POS integration and management'
    },
    {
      path: '/api/v1/ecommerce/order-placeholder',
      methods: ['POST'],
      description: 'E-commerce order creation placeholder endpoint'
    }
  ],
  dependencies: ['settings', 'customers', 'products', 'inventory', 'crm']
};