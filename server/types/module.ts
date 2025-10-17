/**
 * Base Module Interface
 * 
 * Interface that all modules must implement to provide a consistent
 * initialization, registration, and lifecycle management pattern.
 */

import { Express } from 'express';
import { DrizzleService } from '../common/drizzle';

export interface BaseModule {
  /**
   * Initialize the module with a database connection
   * @param db Database connection (DrizzleService)
   */
  initialize(db: DrizzleService): void;
  
  /**
   * Register the module's routes with the Express application
   * @param app Express application
   */
  registerRoutes(app: Express): void;
  
  /**
   * Start any background processes or services
   */
  start(): void;
  
  /**
   * Stop any background processes or services (for clean shutdown)
   */
  stop(): void;
}