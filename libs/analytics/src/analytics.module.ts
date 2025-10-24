/**
 * Analytics Module
 * 
 * This module provides analytics and business intelligence capabilities for the Romanian ERP system.
 * It includes reports, dashboards, metrics, alerts, predictive analytics, and business intelligence.
 */

import express from 'express';
import { DrizzleService } from '@common/drizzle';
import { createModuleLogger } from '@common/logger/loki-logger';

// Services
import { AnalyticsService } from './services/analytics.service';
import { PredictiveService } from './services/predictive.service';
import { BusinessIntelligenceService } from './services/business-intelligence.service';

// Controllers
import { registerAnalyticsControllerRoutes } from './controllers/analytics.controller';
import { registerPredictiveControllerRoutes } from './controllers/predictive.controller';
import { registerBusinessIntelligenceControllerRoutes } from './controllers/business-intelligence.controller';

// Create logger instance
const logger = createModuleLogger('AnalyticsModule');

/**
 * Initialize the Analytics module
 * 
 * @param app Express application
 * @param drizzleService DrizzleService instance
 * @returns Analytics service instances
 */
export function initAnalyticsModule(app: express.Application, drizzleService: DrizzleService) {
  logger.info('Initializing Analytics module...');
  
  // Initialize services
  const analyticsService = new AnalyticsService(drizzleService);
  const predictiveService = new PredictiveService(drizzleService);
  const biService = new BusinessIntelligenceService(drizzleService);
  
  // Register controller routes
  registerAnalyticsControllerRoutes(app, analyticsService);
  registerPredictiveControllerRoutes(app, predictiveService);
  registerBusinessIntelligenceControllerRoutes(app, biService);
  
  // Legacy route support - can be removed after all clients are updated
  // This ensures backward compatibility with existing code
  app.use((req: any, _res, next) => {
    req.services = {
      ...req.services,
      analyticsService,
      predictiveService,
      businessIntelligenceService: biService
    };
    next();
  });
  
  logger.info('Analytics module initialized successfully');
  
  return {
    analyticsService,
    predictiveService,
    businessIntelligenceService: biService
  };
}

export {
  AnalyticsService,
  PredictiveService,
  BusinessIntelligenceService
};