/**
 * Admin Schema Migration Script
 * 
 * This script applies the admin module schema changes directly to the database
 * using raw SQL queries to ensure proper creation of tables.
 */

import { getDrizzle } from './server/common/drizzle';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config();

/**
 * Migrate admin schema
 */
async function migrateAdminSchema() {
  console.log('Migrating admin schema...');

  try {
    const db = getDrizzle();
    
    // Create setup_steps table
    console.log('Creating setup_steps table if it doesn\'t exist...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS setup_steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR(36) NOT NULL,
        franchise_id VARCHAR(36),
        step VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create index for efficient queries
    console.log('Creating setup_step_idx index...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS setup_step_idx ON setup_steps (company_id, franchise_id, created_at);
    `);
    
    console.log('Admin schema migration completed successfully.');
  } catch (error) {
    console.error('Failed to migrate admin schema:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

// Run migration
migrateAdminSchema()
  .then(() => {
    console.log('Admin schema migration completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Admin schema migration failed:', error);
    process.exit(1);
  });