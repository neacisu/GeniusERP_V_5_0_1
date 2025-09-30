/**
 * CRM Module Initialization
 * 
 * This file handles the initialization of the CRM module, registering
 * it with the application and setting up its services and routes.
 */

import { Express } from 'express';
import { CrmModule } from './crm.module';

/**
 * Initialize the CRM module
 * Called during application startup
 */
export function initCrmModule(app?: Express) {
  if (app) {
    // Register the module with the Express app
    CrmModule.register(app);
  }
  
  // Return module info
  return {
    name: 'CRM Module',
    version: '1.0.0',
    description: 'Advanced CRM with Kanban-based sales pipeline, better than HubSpot'
  };
}