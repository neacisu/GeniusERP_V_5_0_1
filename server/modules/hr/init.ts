/**
 * HR Module Initialization
 * 
 * This file initializes the HR module and registers its routes and services with the Express application.
 */

import { Express } from 'express';
import { HrModule } from './hr.module';
import hrRoutes from './routes/hr.routes';

export function initHrModule(app: Express) {
  const { router, services } = HrModule.register();
  
  // Register the HR module routes
  app.use('/api/hr', router);
  
  // Register the HR routes from the routes file for settings and other endpoints
  app.use('/api/hr', hrRoutes);
  
  console.log('HR module routes registered at /api/hr');
  
  return {
    name: 'HR Module',
    version: '1.0.0',
    services
  };
}