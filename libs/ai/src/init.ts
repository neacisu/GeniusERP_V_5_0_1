/**
 * AI Module Initialization
 * 
 * This file initializes the AI module by connecting it to the Express application
 * and setting up necessary middleware and routes.
 */

import { Express } from 'express';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
// Import ONLY schema namespace, not the entire @geniuserp/shared package
import { schema } from '@geniuserp/shared';
import { DrizzleService } from '../../../apps/api/src/common/drizzle';

// Import the AI module function to initialize services and routes
import { initAiModule } from './ai.module';

/**
 * Initialize the AI module
 * 
 * @param app Express application instance
 * @param db Database connection (optional, will create if not provided)
 */
export function initializeAiModule(app: Express, db?: PostgresJsDatabase<typeof schema>) {
  console.log('Setting up AI module...');
  
  // Create or use provided DrizzleService
  const drizzleService = db ? { db } : new DrizzleService();
  
  // Initialize the AI module with all its services and routes
  const aiServices = initAiModule(app, drizzleService as DrizzleService);
  
  console.log('AI module setup complete');
  
  return aiServices;
}