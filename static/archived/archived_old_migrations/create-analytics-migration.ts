/**
 * Analytics Schema Migration Script
 * 
 * This script applies the analytics schema changes directly to the database
 * using Drizzle ORM's push method for quick testing and development.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { analytics_reports } from './server/modules/analytics/schema/analytics.schema';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migrate analytics schema
 */
async function migrateAnalyticsSchema() {
  console.log('Starting Analytics schema migration...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  // Connect to the database with SSL enabled
  const queryClient = postgres(connectionString, { ssl: { rejectUnauthorized: false } });
  const db = drizzle(queryClient);

  try {
    // Create a temporary table to test if analytics_reports exists already
    await queryClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'analytics_reports'
      ) as exists
    `.then(async (result) => {
      const exists = result[0]?.exists || false;
      
      if (exists) {
        console.log('Table analytics_reports already exists. Skipping creation.');
        return;
      }

      console.log('Creating analytics_reports table...');
      
      // Create the table using raw SQL for maximum compatibility
      await queryClient`
        CREATE TABLE IF NOT EXISTS analytics_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL,
          franchise_id UUID,
          type VARCHAR(100) NOT NULL,
          name VARCHAR(200) NOT NULL,
          description VARCHAR(500),
          data JSONB NOT NULL,
          parameters JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
          created_by UUID,
          updated_by UUID,
          is_scheduled BOOLEAN DEFAULT FALSE,
          schedule_interval VARCHAR(50),
          last_run_at TIMESTAMP WITH TIME ZONE
        )
      `;
      
      console.log('analytics_reports table created successfully.');
    });

    console.log('Analytics schema migration completed successfully.');
  } catch (error) {
    console.error('Error during analytics schema migration:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

// Run the migration
migrateAnalyticsSchema();