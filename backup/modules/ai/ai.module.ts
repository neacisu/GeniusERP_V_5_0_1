/**
 * AI Module
 * 
 * This module provides AI-driven features across GeniusERP v.2 including:
 * - Sales automation and intelligence
 * - Customer communication and support
 * - Product knowledge and technical assistance
 * - Internal knowledge retrieval
 * - Predictive insights and lead scoring
 * 
 * The module integrates with Universal Inbox, Marketing, and Analytics modules
 * to provide an intelligent layer over business operations.
 */

import express from 'express';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import AuditService from '../audit/services/audit.service';

// Service imports
import { SalesAiService } from './services/sales-ai.service';
import { InboxAiAssistantService } from './services/inbox-ai-assistant.service';
import { ProductQaService } from './services/product-qa.service';

// Main router import
import aiRoutes from './routes/ai.routes';

/**
 * Initialize the AI module
 * 
 * @param app Express application
 * @param drizzleService DrizzleService instance
 * @returns AI service instances
 */
export function initAiModule(app: express.Application, drizzleService: DrizzleService) {
  console.log('Initializing AI module...');
  
  // Initialize AI services
  const salesAiService = new SalesAiService(drizzleService);
  const inboxAiAssistantService = new InboxAiAssistantService(drizzleService);
  const productQaService = new ProductQaService(drizzleService);
  
  // Register main AI router with all sub-routes
  app.use('/api/ai', aiRoutes);
  
  // Add services to request object for middleware access
  app.use((req: any, res, next) => {
    req.services = {
      ...req.services,
      salesAiService,
      inboxAiAssistantService,
      productQaService
    };
    next();
  });
  
  console.log('AI module initialized successfully');
  
  return {
    salesAiService,
    inboxAiAssistantService,
    productQaService
  };
}

// Export services for use in other modules
export {
  SalesAiService,
  InboxAiAssistantService,
  ProductQaService
};