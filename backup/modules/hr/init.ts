/**
 * HR Module Initialization
 * 
 * This file initializes the HR module and registers its routes and services with the Express application.
 */

import { Express } from 'express';
import { HrModule } from './hr.module';

export function initHrModule(app: Express) {
  const { router, services } = HrModule.register();
  
  // Register the HR module routes
  app.use('/api/v1/hr', router);
  
  return {
    name: 'HR Module',
    version: '1.0.0',
    services
  };
}