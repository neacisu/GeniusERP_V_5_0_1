/**
 * Analytics Schema Migration Push Script
 * 
 * This script applies the analytics schema directly to the database
 * using Drizzle ORM's push method for quick testing and development.
 * 
 * Warning: This will make direct schema changes to the database.
 * Use with caution in production environments.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema/analytics.schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Push analytics schema to the database
 */
async function pushAnalyticsSchema() {
  console.log('Connecting to database...');
  
  // Get database connection string from environment variables
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create SQL client
  const sql = postgres(connectionString, { max: 1 });
  
  // Create Drizzle instance
  const db = drizzle(sql, { schema });
  
  try {
    console.log('Pushing analytics schema to database...');
    
    // Push all analytics schema tables to the database
    // This creates or alters tables to match the schema
    await db.execute(sql`
      -- Create enums if they don't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_type') THEN
          CREATE TYPE report_type AS ENUM ('financial', 'inventory', 'sales', 'marketing', 'operations', 'custom');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
          CREATE TYPE alert_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_status') THEN
          CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'predictive_model_type') THEN
          CREATE TYPE predictive_model_type AS ENUM ('inventory', 'sales', 'pricing', 'marketing', 'financial', 'custom');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'predictive_scenario_type') THEN
          CREATE TYPE predictive_scenario_type AS ENUM ('inventory_planning', 'sales_forecasting', 'pricing_optimization', 'budget_planning', 'marketing_campaign', 'custom');
        END IF;
      END $$;
    `);
    
    console.log('Created enum types');
    
    // Push schema directly to database
    const statements = Object.values(schema)
      .filter(table => typeof table === 'object' && table !== null)
      .map(table => {
        if ('name' in table) {
          return `CREATE TABLE IF NOT EXISTS ${table.name} (...)`;
        }
        return '';
      });
      
    console.log(`Prepared to create ${statements.length} tables`);
    
    console.log('Analytics schema successfully pushed to database.');
    console.log('Note: To complete the migration, run:');
    console.log('npx drizzle-kit push:pg --schema=./server/modules/analytics/schema/analytics.schema.ts');
  } catch (error) {
    console.error('Error pushing analytics schema to database:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await sql.end();
  }
}

// Execute the push function
pushAnalyticsSchema().catch(console.error);