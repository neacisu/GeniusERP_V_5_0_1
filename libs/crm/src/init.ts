/**
 * CRM Module Initialization
 * 
 * This file handles the initialization of the CRM module, registering
 * it with the application and setting up its services and routes.
 */

import { Express } from 'express';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { CrmModule } from './crm.module';
import { createModuleLogger } from "@common/logger/loki-logger";

const logger = createModuleLogger('CrmModuleInit');

/**
 * Initialize the CRM module
 * Called during application startup
 */
export function initCrmModule(app?: Express, drizzleService?: DrizzleService) {
  logger.info('Initializing CRM Module');
  
  if (app) {
    // Register the module with the Express app
    CrmModule.register(app, drizzleService);
  }
  
  // Return module info
  return {
    name: 'CRM Module',
    version: '1.0.0',
    description: 'Advanced CRM with Kanban-based sales pipeline, better than HubSpot'
  };
}