/**
 * Predictive Analytics Schema Migration Script
 * 
 * This script applies the predictive analytics schema to the database.
 * It creates tables for predictive models, forecasting, inventory optimization,
 * and time series data analysis.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import 'dotenv/config';
import * as predictiveSchema from './server/modules/analytics/schema/predictive.schema';

/**
 * Push predictive analytics schema to the database
 */
async function pushPredictiveAnalyticsSchema() {
  console.log('Starting predictive analytics schema migration...');
  
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
    
    // Create Drizzle ORM instance with predictive schema
    const db = drizzle(queryClient, { schema: predictiveSchema });
    
    console.log('Connected to database');
    console.log('Pushing predictive analytics schema changes...');
    
    // Use Drizzle's built-in push mechanism instead of manual table creation
    console.log('Preparing to push schema using Drizzle ORM...');
    
    // Create the predictive models table (usually this would be done with drizzle-kit push)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_predictive_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        model_type VARCHAR(50) NOT NULL,
        prediction_type VARCHAR(50) NOT NULL,
        target_entity VARCHAR(100) NOT NULL,
        configuration JSONB NOT NULL DEFAULT '{}',
        training_config JSONB,
        features JSONB,
        pre_processing_steps JSONB,
        post_processing_steps JSONB,
        evaluation_metrics JSONB,
        last_trained_at TIMESTAMP WITH TIME ZONE,
        last_evaluated_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        company_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        updated_by VARCHAR(36),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        version INTEGER DEFAULT 1,
        model_url TEXT,
        integration_id VARCHAR(36)
      )
    `);
    console.log('Created analytics_predictive_models table');
    
    // Create time series data table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_time_series_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        value NUMERIC NOT NULL,
        confidence NUMERIC,
        metadata JSONB,
        tags JSONB,
        source VARCHAR(100),
        data_quality_score NUMERIC,
        is_anomaly BOOLEAN DEFAULT false,
        company_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created analytics_time_series_data table');
    
    // Create model executions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_model_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id UUID NOT NULL REFERENCES analytics_predictive_models(id),
        execution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        parameters JSONB NOT NULL DEFAULT '{}',
        result JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(50) NOT NULL DEFAULT 'completed',
        execution_time_ms INTEGER,
        performance_metrics JSONB,
        error_details JSONB,
        prediction_horizon VARCHAR(100),
        batch_size INTEGER,
        company_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created analytics_model_executions table');
    
    // Create inventory optimizations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_inventory_optimizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR(36) NOT NULL,
        warehouse_id VARCHAR(36) NOT NULL,
        current_stock_level INTEGER NOT NULL,
        recommended_stock_level INTEGER NOT NULL,
        reorder_point INTEGER NOT NULL,
        safety_stock INTEGER NOT NULL,
        max_stock_level INTEGER,
        lead_time_days INTEGER,
        confidence_level NUMERIC NOT NULL,
        calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        model_execution_id UUID,
        optimization_algorithm VARCHAR(100),
        optimization_parameters JSONB,
        metadata JSONB,
        company_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created analytics_inventory_optimizations table');
    
    // Create purchasing recommendations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_purchasing_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id VARCHAR(36) NOT NULL,
        supplier_id VARCHAR(36),
        recommended_quantity INTEGER NOT NULL,
        min_order_quantity INTEGER,
        max_order_quantity INTEGER,
        recommended_order_date TIMESTAMP WITH TIME ZONE NOT NULL,
        recommended_delivery_date TIMESTAMP WITH TIME ZONE,
        unit_price NUMERIC,
        total_price NUMERIC,
        discount_percentage NUMERIC,
        currency VARCHAR(3),
        confidence_level NUMERIC NOT NULL,
        calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        model_execution_id UUID,
        recommendation_algorithm VARCHAR(100),
        algorithm_parameters JSONB,
        metadata JSONB,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        priority VARCHAR(10),
        company_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_by VARCHAR(36),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created analytics_purchasing_recommendations table');
    
    // Create scenarios table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_scenarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        base_model_id UUID NOT NULL REFERENCES analytics_predictive_models(id),
        inputs JSONB NOT NULL DEFAULT '[]',
        outputs JSONB NOT NULL DEFAULT '[]',
        parameters JSONB,
        scenario_type VARCHAR(50),
        scenario_category VARCHAR(50),
        tags VARCHAR(255)[],
        assumptions JSONB,
        variables JSONB,
        time_horizon VARCHAR(50),
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_template BOOLEAN DEFAULT false,
        template_id UUID,
        visibility VARCHAR(20) DEFAULT 'private',
        company_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        updated_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created analytics_scenarios table');
    
    // Create scenario executions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_scenario_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scenario_id UUID NOT NULL REFERENCES analytics_scenarios(id),
        input_values JSONB NOT NULL DEFAULT '{}',
        results JSONB NOT NULL DEFAULT '{}',
        comparison_results JSONB,
        metrics JSONB,
        execution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        execution_time_ms INTEGER,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        execution_environment VARCHAR(50),
        version VARCHAR(20),
        log_details TEXT,
        error_message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'completed',
        execution_type VARCHAR(20) DEFAULT 'manual',
        confidence_score NUMERIC,
        is_baseline BOOLEAN DEFAULT false,
        company_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created analytics_scenario_executions table');
    
    console.log('Creating indexes for better query performance...');
    
    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_time_series_entity ON analytics_time_series_data(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_time_series_metric ON analytics_time_series_data(metric_name);
      CREATE INDEX IF NOT EXISTS idx_time_series_timestamp ON analytics_time_series_data(timestamp);
      CREATE INDEX IF NOT EXISTS idx_time_series_company ON analytics_time_series_data(company_id);
      
      CREATE INDEX IF NOT EXISTS idx_model_executions_model ON analytics_model_executions(model_id);
      CREATE INDEX IF NOT EXISTS idx_model_executions_company ON analytics_model_executions(company_id);
      
      CREATE INDEX IF NOT EXISTS idx_inventory_optimizations_product ON analytics_inventory_optimizations(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_optimizations_company ON analytics_inventory_optimizations(company_id);
      
      CREATE INDEX IF NOT EXISTS idx_purchasing_recommendations_product ON analytics_purchasing_recommendations(product_id);
      CREATE INDEX IF NOT EXISTS idx_purchasing_recommendations_company ON analytics_purchasing_recommendations(company_id);
      
      CREATE INDEX IF NOT EXISTS idx_scenarios_base_model ON analytics_scenarios(base_model_id);
      CREATE INDEX IF NOT EXISTS idx_scenarios_company ON analytics_scenarios(company_id);
      
      CREATE INDEX IF NOT EXISTS idx_scenario_executions_scenario ON analytics_scenario_executions(scenario_id);
      CREATE INDEX IF NOT EXISTS idx_scenario_executions_company ON analytics_scenario_executions(company_id);
    `);
    
    console.log('Predictive analytics schema migration completed successfully');
  } catch (error) {
    console.error('Error during predictive analytics schema migration:', error);
    process.exit(1);
  }
}

// Run the migration when script is executed directly (using ESM syntax)
pushPredictiveAnalyticsSchema();