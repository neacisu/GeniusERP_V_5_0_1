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
import { Logger } from '../../common/logger';
import { DrizzleService } from '../../common/drizzle';
import AuditService from '../audit/services/audit.service';

// Service imports
import { AIService } from './services/ai.service';
import { OpenAiService } from './services/openai.service';
import { SalesAiService } from './services/sales-ai.service';
import { InboxAiAssistantService } from './services/inbox-ai-assistant.service';
import { ProductQaService } from './services/product-qa.service';

// Controller imports
import { registerAIControllerRoutes } from './controllers/ai.controller';
import { registerOpenAIControllerRoutes } from './controllers/openai.controller';
import { registerSalesAIControllerRoutes } from './controllers/sales-ai.controller';
import { registerInboxAIControllerRoutes } from './controllers/inbox-ai.controller';
import { registerProductQAControllerRoutes } from './controllers/product-qa.controller';

// Create logger instance
const logger = new Logger('AIModule');

/**
 * Initialize the AI module
 * 
 * @param app Express application
 * @param drizzleService DrizzleService instance
 * @returns AI service instances
 */
export function initAiModule(app: express.Application, drizzleService: DrizzleService) {
  logger.info('Initializing AI module...');
  
  // Initialize AI services
  const aiService = new AIService(drizzleService);
  const openAiService = new OpenAiService(drizzleService);
  const salesAiService = new SalesAiService(drizzleService);
  const inboxAiAssistantService = new InboxAiAssistantService(drizzleService);
  const productQaService = new ProductQaService(drizzleService);
  
  // Register controllers with the application
  registerAIControllerRoutes(app, aiService);
  registerOpenAIControllerRoutes(app, openAiService);
  registerSalesAIControllerRoutes(app, salesAiService);
  registerInboxAIControllerRoutes(app, inboxAiAssistantService);
  registerProductQAControllerRoutes(app, productQaService);
  
  // Add services to request object for middleware access (legacy support)
  app.use((req: any, res, next) => {
    req.services = {
      ...req.services,
      aiService,
      openAiService,
      salesAiService,
      inboxAiAssistantService,
      productQaService
    };
    next();
  });
  
  logger.info('AI module initialized successfully');
  
  return {
    aiService,
    openAiService,
    salesAiService,
    inboxAiAssistantService,
    productQaService
  };
}

// Export services for use in other modules
export {
  AIService,
  OpenAiService,
  SalesAiService,
  InboxAiAssistantService,
  ProductQaService
};