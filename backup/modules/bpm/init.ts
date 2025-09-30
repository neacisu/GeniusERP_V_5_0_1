/**
 * BPM Module Initialization
 * 
 * This file initializes services and dependencies for the Business Process Management module.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Logger } from '../../common/logger';
import { getDrizzle } from '../../common/drizzle';
import { ProcessService } from './services/process.service';

const logger = new Logger('BPM Init');

/**
 * Initialize BPM services
 */
export function initBpmServices(db?: PostgresJsDatabase<any>) {
  logger.info('Initializing BPM services...');
  
  // Use provided database connection or get default connection
  const dbConnection = db || getDrizzle();
  
  // Initialize BPM services
  const processService = new ProcessService(dbConnection);
  
  logger.info('BPM services initialized successfully');
  
  return {
    processService
  };
}