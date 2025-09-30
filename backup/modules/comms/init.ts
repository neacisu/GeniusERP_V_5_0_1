/**
 * Communications Module Initialization
 * 
 * This file handles the initialization of the Communications module,
 * registering it with the application and setting up its services and routes.
 */

import { Express } from 'express';
import { CommsModule } from './comms.module';
import { getDrizzle } from '../../common/drizzle';

/**
 * Initialize the Communications module
 * 
 * @param app Express application instance
 * @returns Module information
 */
export function initCommsModule(app?: Express) {
  // Get database connection if not provided
  const db = getDrizzle();
  
  // Initialize the module
  const moduleInfo = CommsModule.initialize(app || {} as Express, db);
  
  // Return module info
  return {
    name: moduleInfo.name,
    version: moduleInfo.version,
    services: moduleInfo.services
  };
}