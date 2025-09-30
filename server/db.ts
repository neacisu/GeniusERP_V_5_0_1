/**
 * Database Connection - PostgreSQL Local
 * 
 * Uses standard postgres client for local PostgreSQL 17 database
 * Replaces previous Neon Cloud serverless connection
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to configure the .env file?",
  );
}

// Create PostgreSQL connection using postgres-js
// Note: This replaces the previous @neondatabase/serverless implementation
const queryClient = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: false  // Disable SSL for local PostgreSQL
});

// Create Drizzle instance with schema
export const db = drizzle(queryClient, { schema });

// Export query client for services that need direct query access
export const pool = queryClient;

// Make pool available globally for backward compatibility
// @ts-ignore - Adding pool to globalThis
globalThis.pool = pool;

console.log('✅ Database connection initialized (PostgreSQL 17 local)');
