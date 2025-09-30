/**
 * Analytics Module Database Migration Script
 * 
 * This script creates the necessary database tables for the Analytics module.
 * It includes tables for reports, dashboards, metrics, alerts, and predictive models.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { exit } from 'process';

// Import the analytics schema
import {
  analyticsReports,
  reportExecutionHistory,
  analyticsDashboards,
  dashboardViews,
  analyticsMetrics,
  metricsHistory,
  analyticsAlerts,
  alertHistory,
  biCostCenters,
  biBusinessUnits,
  biCostAllocations,
  costAllocationHistory,
  predictiveModels,
  modelTrainingHistory,
  predictiveScenarios,
  scenarioResults,
  
  reportTypeEnum,
  alertSeverityEnum,
  alertStatusEnum,
  predictiveModelTypeEnum,
  predictiveScenarioTypeEnum
} from './server/modules/analytics/schema/analytics.schema';

// Load environment variables
dotenv.config();

/**
 * Create a direct database connection for migration
 */
function createDatabaseConnection() {
  // Ensure DATABASE_URL is available
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create connection
  try {
    const client = postgres(databaseUrl, { max: 1 });
    const db = drizzle(client);
    console.log('Database connection established successfully');
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

/**
 * Run full migration for the analytics schema
 */
async function runMigration() {
  console.log('Starting Analytics module migration...');
  
  // Connect to the database
  const { client, db } = createDatabaseConnection();
  
  try {
    // Push schema changes directly
    await pushAnalyticsSchema(db);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connection
    await client.end();
  }
}

/**
 * Push analytics schema to the database
 */
async function pushAnalyticsSchema(db: any) {
  console.log('Pushing analytics schema to database...');
  
  try {
    // Create schema
    // First create enum types
    await db.execute(`
      DO $$ 
      BEGIN
        -- Create enums if they don't exist
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
    
    // Then create the tables
    await db.execute(`
      DO $$ 
      BEGIN
        -- Create analytics_dashboards table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_dashboards') THEN
          CREATE TABLE analytics_dashboards (
            id VARCHAR PRIMARY KEY NOT NULL,
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            layout TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            created_by VARCHAR NOT NULL REFERENCES users(id),
            updated_by VARCHAR REFERENCES users(id),
            is_public BOOLEAN DEFAULT FALSE NOT NULL,
            refresh_interval INTEGER
          );
        END IF;
        
        -- Create analytics_reports table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_reports') THEN
          CREATE TABLE analytics_reports (
            id VARCHAR PRIMARY KEY NOT NULL,
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            type report_type NOT NULL,
            parameters TEXT,
            result TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            created_by VARCHAR NOT NULL REFERENCES users(id),
            updated_by VARCHAR REFERENCES users(id),
            is_public BOOLEAN DEFAULT FALSE NOT NULL,
            dashboard_id VARCHAR REFERENCES analytics_dashboards(id),
            schedule VARCHAR(50)
          );
        END IF;
        
        -- Create report_execution_history table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_execution_history') THEN
          CREATE TABLE report_execution_history (
            id VARCHAR PRIMARY KEY NOT NULL,
            report_id VARCHAR NOT NULL REFERENCES analytics_reports(id),
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            executed_by VARCHAR NOT NULL REFERENCES users(id),
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            parameters TEXT,
            result TEXT,
            execution_time INTEGER,
            status VARCHAR(20) NOT NULL,
            error_message TEXT
          );
        END IF;
        
        -- Create dashboard_views table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dashboard_views') THEN
          CREATE TABLE dashboard_views (
            id VARCHAR PRIMARY KEY NOT NULL,
            dashboard_id VARCHAR NOT NULL REFERENCES analytics_dashboards(id),
            user_id VARCHAR NOT NULL REFERENCES users(id),
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            view_duration INTEGER,
            company_id VARCHAR NOT NULL REFERENCES users(company_id)
          );
        END IF;
        
        -- Create analytics_metrics table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_metrics') THEN
          CREATE TABLE analytics_metrics (
            id VARCHAR PRIMARY KEY NOT NULL,
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            type VARCHAR(50) NOT NULL,
            value TEXT NOT NULL,
            unit VARCHAR(20),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            period VARCHAR(20),
            source VARCHAR(50),
            metadata TEXT
          );
        END IF;
        
        -- Create metrics_history table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metrics_history') THEN
          CREATE TABLE metrics_history (
            id VARCHAR PRIMARY KEY NOT NULL,
            metric_id VARCHAR NOT NULL REFERENCES analytics_metrics(id),
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            value TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            period VARCHAR(20),
            metadata TEXT
          );
        END IF;
        
        -- Create analytics_alerts table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_alerts') THEN
          CREATE TABLE analytics_alerts (
            id VARCHAR PRIMARY KEY NOT NULL,
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            metric_id VARCHAR REFERENCES analytics_metrics(id),
            condition TEXT NOT NULL,
            severity alert_severity NOT NULL,
            status alert_status NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            created_by VARCHAR NOT NULL REFERENCES users(id),
            updated_by VARCHAR REFERENCES users(id),
            last_triggered_at TIMESTAMP,
            notification_channels TEXT,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
          );
        END IF;
        
        -- Create alert_history table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alert_history') THEN
          CREATE TABLE alert_history (
            id VARCHAR PRIMARY KEY NOT NULL,
            alert_id VARCHAR NOT NULL REFERENCES analytics_alerts(id),
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            previous_status alert_status,
            new_status alert_status NOT NULL,
            triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            acknowledged_by VARCHAR REFERENCES users(id),
            acknowledged_at TIMESTAMP,
            resolved_by VARCHAR REFERENCES users(id),
            resolved_at TIMESTAMP,
            metric_value TEXT,
            message TEXT,
            notification_sent BOOLEAN DEFAULT FALSE NOT NULL
          );
        END IF;
        
        -- Create bi_cost_centers table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bi_cost_centers') THEN
          CREATE TABLE bi_cost_centers (
            id VARCHAR PRIMARY KEY NOT NULL,
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            name VARCHAR(100) NOT NULL,
            code VARCHAR(50) NOT NULL,
            description TEXT,
            budget TEXT,
            manager_user_id VARCHAR REFERENCES users(id),
            parent_cost_center_id VARCHAR REFERENCES bi_cost_centers(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            created_by VARCHAR NOT NULL REFERENCES users(id),
            updated_by VARCHAR REFERENCES users(id),
            is_active BOOLEAN DEFAULT TRUE NOT NULL
          );
        END IF;
        
        -- Create bi_business_units table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bi_business_units') THEN
          CREATE TABLE bi_business_units (
            id VARCHAR PRIMARY KEY NOT NULL,
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            name VARCHAR(100) NOT NULL,
            code VARCHAR(50) NOT NULL,
            description TEXT,
            manager_user_id VARCHAR REFERENCES users(id),
            parent_business_unit_id VARCHAR REFERENCES bi_business_units(id),
            cost_center_id VARCHAR REFERENCES bi_cost_centers(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            created_by VARCHAR NOT NULL REFERENCES users(id),
            updated_by VARCHAR REFERENCES users(id),
            is_active BOOLEAN DEFAULT TRUE NOT NULL
          );
        END IF;
        
        -- Create bi_cost_allocations table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bi_cost_allocations') THEN
          CREATE TABLE bi_cost_allocations (
            id VARCHAR PRIMARY KEY NOT NULL,
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            source_cost_center_id VARCHAR NOT NULL REFERENCES bi_cost_centers(id),
            target_cost_center_id VARCHAR NOT NULL REFERENCES bi_cost_centers(id),
            allocation_method VARCHAR(50) NOT NULL,
            allocation_value TEXT NOT NULL,
            start_date TIMESTAMP NOT NULL,
            end_date TIMESTAMP,
            frequency VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            created_by VARCHAR NOT NULL REFERENCES users(id),
            updated_by VARCHAR REFERENCES users(id),
            is_active BOOLEAN DEFAULT TRUE NOT NULL
          );
        END IF;
        
        -- Create cost_allocation_history table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cost_allocation_history') THEN
          CREATE TABLE cost_allocation_history (
            id VARCHAR PRIMARY KEY NOT NULL,
            cost_allocation_id VARCHAR NOT NULL REFERENCES bi_cost_allocations(id),
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            period_start TIMESTAMP NOT NULL,
            period_end TIMESTAMP NOT NULL,
            amount TEXT NOT NULL,
            allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            allocated_by VARCHAR NOT NULL REFERENCES users(id),
            notes TEXT
          );
        END IF;
        
        -- Create predictive_models table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'predictive_models') THEN
          CREATE TABLE predictive_models (
            id VARCHAR PRIMARY KEY NOT NULL,
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            type predictive_model_type NOT NULL,
            algorithm VARCHAR(50) NOT NULL,
            parameters TEXT,
            model_data TEXT,
            accuracy TEXT,
            last_trained_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            created_by VARCHAR NOT NULL REFERENCES users(id),
            updated_by VARCHAR REFERENCES users(id),
            is_active BOOLEAN DEFAULT TRUE NOT NULL,
            version INTEGER DEFAULT 1 NOT NULL
          );
        END IF;
        
        -- Create model_training_history table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'model_training_history') THEN
          CREATE TABLE model_training_history (
            id VARCHAR PRIMARY KEY NOT NULL,
            model_id VARCHAR NOT NULL REFERENCES predictive_models(id),
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            trained_by VARCHAR NOT NULL REFERENCES users(id),
            parameters TEXT,
            training_data_size INTEGER,
            accuracy TEXT,
            metrics TEXT,
            duration INTEGER,
            version INTEGER NOT NULL,
            status VARCHAR(20) NOT NULL
          );
        END IF;
        
        -- Create predictive_scenarios table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'predictive_scenarios') THEN
          CREATE TABLE predictive_scenarios (
            id VARCHAR PRIMARY KEY NOT NULL,
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            name VARCHAR(100) NOT NULL,
            description TEXT,
            type predictive_scenario_type NOT NULL,
            model_id VARCHAR NOT NULL REFERENCES predictive_models(id),
            parameters TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            created_by VARCHAR NOT NULL REFERENCES users(id),
            updated_by VARCHAR REFERENCES users(id),
            last_run_at TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
          );
        END IF;
        
        -- Create scenario_results table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scenario_results') THEN
          CREATE TABLE scenario_results (
            id VARCHAR PRIMARY KEY NOT NULL,
            scenario_id VARCHAR NOT NULL REFERENCES predictive_scenarios(id),
            company_id VARCHAR NOT NULL REFERENCES users(company_id),
            run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            run_by VARCHAR NOT NULL REFERENCES users(id),
            parameters TEXT,
            results TEXT NOT NULL,
            duration INTEGER,
            status VARCHAR(20) NOT NULL,
            notes TEXT
          );
        END IF;
      END $$;
    `);
    
    console.log('Created all analytics tables successfully');
    
    return true;
  } catch (error) {
    console.error('Error creating analytics schema:', error);
    throw error;
  }
}

// Execute the migration if this script is run directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Analytics module migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export {
  runMigration,
  pushAnalyticsSchema
};