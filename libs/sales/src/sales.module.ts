import { Express } from 'express';
import { CustomerService } from "./customer.service";
import { JwtService } from '../auth/services/jwt.service';
import { createModuleLogger } from "@common/logger/loki-logger";
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import salesRoutes from './sales.controller';

const logger = createModuleLogger('SalesModule');

/**
 * Sales Module class that initializes and registers all Sales components
 */
export class SalesModule {
  private customerService: CustomerService;
  private jwtService: JwtService;
  private drizzleService: DrizzleService;

  /**
   * Register the Sales module with the Express application
   */
  static register(app: Express): void {
    logger.info('Registering Sales Module');
    const module = new SalesModule();
    module.initialize(app);
  }

  constructor() {
    this.drizzleService = new DrizzleService();
    this.customerService = new CustomerService(this.drizzleService);
    this.jwtService = new JwtService();
  }

  /**
   * Initialize the Sales module
   */
  initialize(app: Express): void {
    logger.info('Initializing Sales Module');
    
    // Register routes and middleware
    this.registerRoutes(app);
  }

  /**
   * Register all routes for the Sales module
   */
  private registerRoutes(app: Express): void {
    // Register sales routes
    app.use('/api/sales', salesRoutes);
    logger.info('Sales routes registered at /api/sales');
  }
}

/**
 * Initialize the Sales module
 * @param app Express application instance
 */
export function initSalesModule(app: Express): void {
  logger.info('Initializing Sales Module');
  SalesModule.register(app);
}

// Export service providers for dependency injection
export const SalesModuleProviders = {
  providers: [CustomerService, DrizzleService],
};