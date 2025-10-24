/**
 * E-Commerce Module
 * 
 * This module provides e-commerce functionality including order management,
 * payment processing, and integration with external e-commerce platforms.
 */

import { Express } from 'express';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createModuleLogger } from "@common/logger/loki-logger";
import { OrdersService } from './services/orders.service';
import { TransactionsService } from './services/transactions.service';
import { ShopifyRouter } from './routes/shopify.routes';
import { POSRouter } from './routes/pos.routes';
import { OrdersRouter } from './routes/orders.routes';
import { TransactionsRouter } from './routes/transactions.routes';
import { CartRouter } from './routes/cart.routes';
import { ShopifyIntegrationService } from './services/shopify-integration.service';
import { CartService } from './services/cart.service';
import { CheckoutService } from './services/checkout.service';
import { PaymentService } from './services/payment.service';
import { POSIntegrationService } from './services/pos-integration.service';
import { InventoryModule } from '../inventory/inventory.module';
import { CrmModule } from '../crm/crm.module';
import { ECommerceController } from './controllers/ecommerce.controller';
import { OrdersController } from './controllers/orders.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { CartController } from './controllers/cart.controller';
import { CheckoutController } from './controllers/checkout.controller';
import { IntegrationService } from '../../common/services/integration.service';
import { AuditService } from '../audit/services/audit.service';
import { registerModule } from '../../common/services/registry';
import { getDrizzleInstance } from '../../common/drizzle/db';

// Create a logger for the module
const logger = createModuleLogger('ECommerceModule');

/**
 * Initialize the E-Commerce module
 * @param app Express application instance
 * @param drizzleService DrizzleService instance
 * @returns Information about the initialized module
 */
export function initECommerceModule(app: Express, drizzleService: DrizzleService) {
  logger.info('Initializing E-Commerce module');
  
  try {
    // Get the PostgresJsDatabase instance for services that need it
    const db = getDrizzleInstance() as any;
    
    // Initialize core services with drizzleService
    const ordersService = new OrdersService(drizzleService);
    const transactionsService = new TransactionsService(drizzleService);
    
    // Initialize integration service and required services (these need PostgresJsDatabase)
    const integrationService = new IntegrationService(db);
    const auditService = new AuditService();
    
    // Initialize payment service (expects db and integrationService)
    const paymentService = new PaymentService(db, integrationService);
    
    // Initialize cart and checkout services
    const cartService = new CartService(drizzleService);
    const checkoutService = new CheckoutService(drizzleService, ordersService, transactionsService, cartService, paymentService);
    
    // Initialize integration services (these need PostgresJsDatabase)
    const shopifyService = new ShopifyIntegrationService(db, ordersService, transactionsService);
    const posService = new POSIntegrationService(db, ordersService, transactionsService);
    
    // Initialize integration routers
    const shopifyRouter = new ShopifyRouter(shopifyService);
    const posRouter = new POSRouter(posService);
    
    // Initialize controllers
    const checkoutController = new CheckoutController(checkoutService);
    
    // Initialize controllers
    const ordersController = new OrdersController(ordersService);
    const transactionsController = new TransactionsController(transactionsService);
    const cartController = new CartController(cartService);
    const ecommerceController = new ECommerceController(paymentService);
    
    // Mount routes
    app.use('/api/ecommerce/orders', ordersController.getRouter());
    app.use('/api/ecommerce/transactions', transactionsController.getRouter());
    app.use('/api/ecommerce/shopify', shopifyRouter.getRouter());
    app.use('/api/ecommerce/cart', cartController.getRouter());
    app.use('/api/ecommerce/checkout', checkoutController.getRouter());
    app.use('/api/ecommerce/pos', posRouter.getRouter());
    app.use('/api/ecommerce', ecommerceController.getRouter());
    
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
   * @param drizzleService DrizzleService instance
   * @returns Information about the registered module
   */
  register: (app: Express, drizzleService: DrizzleService) => {
    const moduleInfo = initECommerceModule(app, drizzleService);
    
    // Register module with service registry
    try {
      registerModule('ecommerce', {
        name: ECommerceModule.name,
        version: ECommerceModule.version,
        services: moduleInfo.services,
        permissions: ECommerceModule.permissions
      });
      logger.info('E-Commerce module registered with service registry');
    } catch (error) {
      logger.warn('Failed to register E-Commerce module with service registry', error);
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
      path: '/api/ecommerce/order-placeholder',
      methods: ['POST'],
      description: 'E-commerce order creation placeholder endpoint'
    },
    {
      path: '/api/ecommerce/payment',
      methods: ['POST'],
      description: 'Direct payment processing endpoint using Stripe integration'
    }
  ],
  dependencies: ['settings', 'customers', 'products', 'inventory', 'crm']
};