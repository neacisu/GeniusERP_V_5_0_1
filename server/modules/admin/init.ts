/**
 * Admin Module Initialization
 * 
 * This file initializes the Admin module which handles system configuration,
 * setup tracking, and administrative functions.
 */

import express, { Router, Response, NextFunction } from 'express';
import { DrizzleService } from '../../common/drizzle';
import { AdminModule } from './admin.module';
import { Logger } from '../../common/logger';

const logger = new Logger('AdminModuleInit');

/**
 * Initialize the Admin module
 */
export function initAdminModule(app: express.Application): void {
  logger.info('Initializing Admin module...');

  try {
    // Get database connection
    const db = new DrizzleService();
    
    // Get the AdminModule singleton instance
    const adminModule = AdminModule.getInstance();
    
    // Initialize the module with database connection
    adminModule.initialize(db);
    
    // Register routes
    adminModule.registerRoutes(app);
    
    // Start any background services
    adminModule.start();
    
    logger.info('Admin module initialized successfully.');
    
    return adminModule;
  } catch (error) {
    logger.error('Failed to initialize Admin module:', error);
    throw error;
  }
}