/**
 * Settings Module Initialization
 * 
 * This file handles the initialization of the Settings module, registering
 * it with the application and setting up its services and routes.
 */

import { Express } from 'express';
import { SettingsModule } from './settings.module';
import { settingsRouter } from './routes';
import { log } from '../../vite';

/**
 * Initialize the Settings module
 * Called during application startup
 * 
 * @param app Express application instance
 * @returns Module information
 */
export function initSettingsModule(app?: Express) {
  log('⚙️ Initializing settings module', 'settings-module');
  
  // Initialize the module
  const moduleInfo = SettingsModule.initialize();
  
  if (app) {
    // Register the module with the Express app
    app.use('/api/settings', settingsRouter);
    log('⚙️ Settings module routes registered at /api/settings', 'settings-module');
  }
  
  // Return module info
  return {
    name: moduleInfo.name,
    version: moduleInfo.version,
    description: moduleInfo.description,
    capabilities: moduleInfo.capabilities
  };
}