/**
 * Update Predictive Analytics Schema
 * 
 * This script updates the predictive analytics schema to ensure consistency between
 * code and database. It adds missing columns and indexes to existing tables.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function updatePredictiveSchema() {
  console.log('Starting predictive analytics schema update...');
  
  try {
    // Create postgres client
    const queryClient = postgres({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE || 'postgres',
      username: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      max: 10,
      ssl: { rejectUnauthorized: false }, // Force SSL mode for Neon database
      idle_timeout: 20
    });
    
    // Create Drizzle ORM instance
    const db = drizzle(queryClient);
    
    console.log('Connected to database');
    console.log('Updating predictive analytics schema...');
    
    // Create scenario results table if missing
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_scenario_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scenario_id UUID NOT NULL REFERENCES analytics_scenarios(id) ON DELETE CASCADE,
        execution_id UUID NOT NULL,
        input_values JSONB NOT NULL,
        results JSONB NOT NULL,
        metadata JSONB,
        company_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      
      CREATE INDEX IF NOT EXISTS analytics_scenario_results_scenario_idx ON analytics_scenario_results(scenario_id);
      CREATE INDEX IF NOT EXISTS analytics_scenario_results_execution_idx ON analytics_scenario_results(execution_id);
      CREATE INDEX IF NOT EXISTS analytics_scenario_results_company_idx ON analytics_scenario_results(company_id);
    `);
    console.log('Updated analytics_scenario_results table');
    
    // Update time series data table with additional columns if needed
    await db.execute(sql`
      DO $$
      BEGIN
        -- Add additional_data column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'analytics_time_series_data' 
                      AND column_name = 'additional_data') THEN
          ALTER TABLE analytics_time_series_data ADD COLUMN additional_data JSONB;
        END IF;
        
        -- Add is_adjusted column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'analytics_time_series_data' 
                      AND column_name = 'is_adjusted') THEN
          ALTER TABLE analytics_time_series_data ADD COLUMN is_adjusted BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add adjustment_reason column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'analytics_time_series_data' 
                      AND column_name = 'adjustment_reason') THEN
          ALTER TABLE analytics_time_series_data ADD COLUMN adjustment_reason TEXT;
        END IF;
        
        -- Add warehouse_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'analytics_time_series_data' 
                      AND column_name = 'warehouse_id') THEN
          ALTER TABLE analytics_time_series_data ADD COLUMN warehouse_id VARCHAR(36);
        END IF;
      END $$;
    `);
    console.log('Updated analytics_time_series_data table');
    
    // Update predictive models table with additional columns if needed
    await db.execute(sql`
      DO $$
      BEGIN
        -- Add model_url column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'analytics_predictive_models' 
                      AND column_name = 'model_url') THEN
          ALTER TABLE analytics_predictive_models ADD COLUMN model_url TEXT;
        END IF;
        
        -- Add integration_id column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'analytics_predictive_models' 
                      AND column_name = 'integration_id') THEN
          ALTER TABLE analytics_predictive_models ADD COLUMN integration_id VARCHAR(36);
        END IF;
      END $$;
    `);
    console.log('Updated analytics_predictive_models table');
    
    // Update scenarios table to ensure inputs/outputs are configured correctly
    await db.execute(sql`
      DO $$
      BEGIN
        -- Ensure inputs column has correct default
        ALTER TABLE analytics_scenarios 
        ALTER COLUMN inputs SET DEFAULT '[]';
        
        -- Ensure outputs column has correct default
        ALTER TABLE analytics_scenarios 
        ALTER COLUMN outputs SET DEFAULT '[]';
      END $$;
    `);
    console.log('Updated analytics_scenarios table');
    
    // Create missing indexes for better query performance
    await db.execute(sql`
      -- Time series data indexes
      CREATE INDEX IF NOT EXISTS idx_time_series_entity_timestamp 
      ON analytics_time_series_data(entity_type, entity_id, timestamp);
      
      CREATE INDEX IF NOT EXISTS idx_time_series_metric_timestamp 
      ON analytics_time_series_data(metric_name, timestamp);
      
      -- Model indexes
      CREATE INDEX IF NOT EXISTS idx_predictive_models_type 
      ON analytics_predictive_models(model_type);
      
      CREATE INDEX IF NOT EXISTS idx_predictive_models_target 
      ON analytics_predictive_models(target_entity);
      
      -- Scenarios indexes
      CREATE INDEX IF NOT EXISTS idx_scenarios_type_category 
      ON analytics_scenarios(scenario_type, scenario_category);
      
      CREATE INDEX IF NOT EXISTS idx_scenarios_template 
      ON analytics_scenarios(is_template);
    `);
    console.log('Created additional indexes for better performance');
    
    console.log('Predictive analytics schema update completed successfully');
  } catch (error) {
    console.error('Error during predictive analytics schema update:', error);
    process.exit(1);
  }
}

// Execute the update function
updatePredictiveSchema();