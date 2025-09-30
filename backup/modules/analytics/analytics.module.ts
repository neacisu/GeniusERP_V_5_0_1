/**
 * Analytics Module
 * 
 * This module provides analytics and business intelligence capabilities for the Romanian ERP system.
 * It includes reports, dashboards, metrics, alerts, predictive analytics, and business intelligence.
 */

import express from 'express';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';

// Services
import { AnalyticsService } from './services/analytics.service';
import { PredictiveService } from './services/predictive.service';
import { BusinessIntelligenceService } from './services/business-intelligence.service';

// Routes
import analyticsRoutes from './routes/analytics.routes';
import biRoutes from './routes/business-intelligence.routes';
import predictiveRoutes from './routes/predictive.routes.fixed';

/**
 * Initialize the Analytics module
 * 
 * @param app Express application
 * @param drizzleService DrizzleService instance
 * @returns Analytics service instances
 */
export function initAnalyticsModule(app: express.Application, drizzleService: DrizzleService) {
  console.log('Initializing Analytics module...');
  
  // Initialize services
  const auditService = new AuditService(drizzleService);
  const analyticsService = new AnalyticsService(drizzleService, auditService);
  const predictiveService = new PredictiveService(drizzleService, analyticsService, auditService);
  const biService = new BusinessIntelligenceService(drizzleService, analyticsService, auditService);
  
  // Register routes
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/analytics/bi', biRoutes);
  app.use('/api/analytics/predictive', predictiveRoutes);
  
  // Add services to request object for middleware access
  app.use((req: any, res, next) => {
    req.services = {
      ...req.services,
      analyticsService,
      predictiveService,
      businessIntelligenceService: biService
    };
    next();
  });
  
  console.log('Analytics module initialized successfully');
  
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