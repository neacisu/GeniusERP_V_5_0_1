/**
 * Core Drizzle Database Connection
 * 
 * This module provides the core database connection for the entire application.
 * It creates a singleton Postgres client and Drizzle ORM instance.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Logger } from '../logger';
// NX Monorepo: Import ONLY schema namespace, not the entire @geniuserp/shared package
import { schema } from '@geniuserp/shared';

// Create a logger for database operations
const logger = new Logger('DrizzleDB');

// Database connection singleton instances
let pgClient: postgres.Sql<{}>;
let drizzleInstance: ReturnType<typeof drizzle>;

/**
 * Initialize the database connection (if not already initialized)
 * @returns The postgres client
 */
export function getPostgresClient(): postgres.Sql<{}> {
  if (pgClient) {
    return pgClient;
  }

  try {
    const connectionString = process.env['DATABASE_URL'];
    
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // Create PostgreSQL connection (local PostgreSQL without SSL)
    pgClient = postgres(connectionString, { 
      ssl: false,  // Disable SSL for local PostgreSQL
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    });
    
    logger.info('Database client initialized');
    
    return pgClient;
  } catch (error) {
    logger.error('Failed to initialize database client', error);
    throw error;
  }
}

/**
 * Get the Drizzle ORM instance
 * This function ensures a singleton pattern for database connections
 * @returns The drizzle ORM instance
 */
export function getDrizzleInstance() {
  if (drizzleInstance) {
    return drizzleInstance;
  }

  try {
    const client = getPostgresClient();
    
    // Re-enable schema with fixed relations
    drizzleInstance = drizzle(client, { schema });
    
    logger.info('Database ORM instance initialized WITH schema (relations enabled)');
    
    return drizzleInstance;
  } catch (error) {
    logger.error('Failed to initialize database ORM', error);
    throw error;
  }
}

/**
 * Close database connections (for cleanup)
 */
export async function closeDatabase() {
  if (pgClient) {
    try {
      await pgClient.end();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', error);
    }
  }
}

// Export singletons
export default {
  getPostgresClient,
  getDrizzleInstance,
  closeDatabase
};