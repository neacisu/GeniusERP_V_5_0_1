/**
 * Drizzle connection module
 * 
 * Provides access to the database connection.
 */

import { getDrizzleInstance, getPostgresClient } from './db';
import { DrizzleService } from './drizzle.service';

// Re-export getDrizzleInstance as getDrizzle for backwards compatibility
export const getDrizzle = getDrizzleInstance;

// Export PostgresClient as getClient for backwards compatibility
export const getClient = getPostgresClient;

// Export DrizzleService class
export { DrizzleService };