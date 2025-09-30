/**
 * Marketing Module Initialization
 * 
 * This file contains the initialization logic for the Marketing module
 * including database connection setup and service registration.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Logger } from '../../common/logger';
import { 
  campaigns, 
  campaignMessages, 
  campaignSegments, 
  campaignTemplates 
} from '../../../shared/schema/marketing.schema';
import { 
  messages, 
  contacts, 
  messageThreads, 
  channelConfigurations 
} from '../../../shared/schema/communications.schema';

// Database connection for the module
let db: any = null;
const logger = new Logger('MarketingInit');

/**
 * Initialize the Marketing module database connection and services
 */
export async function initialize() {
  if (db) {
    logger.info('Marketing module database already initialized');
    return db;
  }

  try {
    logger.info('Initializing Marketing module database connection...');
    
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Create database connection
    const client = postgres(connectionString, { ssl: 'require' });
    db = drizzle(client);
    
    logger.info('Marketing module database connection initialized');
    
    return db;
  } catch (error) {
    logger.error('Failed to initialize Marketing module database connection', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Get the database connection for the Marketing module
 * Initializes the connection if it doesn't exist
 */
export async function getDrizzle() {
  if (!db) {
    return initialize();
  }
  return db;
}