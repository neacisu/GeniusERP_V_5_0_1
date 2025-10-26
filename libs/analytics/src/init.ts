/**
 * Analytics Module Initialization
 * 
 * This file initializes the Analytics module by connecting it to the Express application
 * and setting up necessary middleware and routes.
 */

import { Express } from 'express';
import { setupAnalyticsRoutes } from './routes/analytics.routes';
import { setupBusinessIntelligenceRoutes } from './routes/business-intelligence.routes';
import { setupPredictiveRoutes } from './routes/predictive.routes';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { randomUUID } from 'crypto';
// Import ONLY schema namespace, not the entire @geniuserp/shared package
import { schema } from '@geniuserp/shared';

/**
 * Initialize the Analytics module
 * 
 * @param app Express application instance
 * @param db Database connection
 */
export function initializeAnalyticsModule(app: Express) {
  // Set up analytics routes
  const analyticsRouter = setupAnalyticsRoutes();

  // Set up business intelligence routes
  const biRouter = setupBusinessIntelligenceRoutes();

  // Set up predictive analytics routes
  const predictiveRouter = setupPredictiveRoutes();
  
  // Register the routers with their respective API paths
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/analytics/bi', biRouter);
  app.use('/api/analytics/predictive', predictiveRouter);
  
  console.log('Analytics module initialized successfully');
}