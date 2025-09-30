/**
 * Examples Module
 * 
 * This module contains example routes for testing various features
 * like authentication, authorization, etc.
 */

import { Router } from 'express';
import examplesRoutes from './routes/examples.routes';
import { log } from '../../vite';

export class ExamplesModule {
  /**
   * Register the module components with the application
   * @param app Express application
   * @returns Registered components
   */
  static register(app: any) {
    log('🔐 Registering example routes for testing', 'examples-module');
    
    // Create a router for auth routes
    const router = Router();
    
    // Register all routes
    router.use(examplesRoutes);
    
    // Mount the router under /api/examples
    app.use('/api/examples', router);
    
    log('🔐 AuthGuard example routes registered at /api/examples', 'examples-module');
    log('Try: /api/examples/protected with Authorization header', 'examples-module');
    
    // Return registered components
    return {
      routes: [examplesRoutes]
    };
  }
}