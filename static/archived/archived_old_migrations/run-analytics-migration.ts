/**
 * Analytics Schema Migration Script
 * 
 * This script applies the analytics schema directly to the database
 * using raw SQL queries for quick development and testing.
 */

import postgres from 'postgres';
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
  
  try {
    console.log('Pushing analytics schema to database...');
    
    // Create enum types first to avoid issues with other tables
    await sql`
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
    `;
    
    console.log('Created PostgreSQL enum types');
    
    // Create analytics dashboards table
    console.log('Creating analytics dashboards table...');
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_dashboards (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        layout TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255),
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        refresh_interval INTEGER
      );
    `;
    
    // Create analytics reports table
    console.log('Creating analytics reports table...');
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_reports (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type report_type NOT NULL,
        parameters TEXT,
        result TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255),
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        dashboard_id VARCHAR(255) REFERENCES analytics_dashboards(id),
        schedule VARCHAR(50)
      );
    `;
    
    // Create report execution history table
    console.log('Creating report execution history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS report_execution_history (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        report_id VARCHAR(255) NOT NULL REFERENCES analytics_reports(id),
        company_id VARCHAR(255) NOT NULL,
        executed_by VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        parameters TEXT,
        result TEXT,
        execution_time INTEGER,
        status VARCHAR(20) NOT NULL,
        error_message TEXT
      );
    `;
    
    // Create dashboard views table
    console.log('Creating dashboard views table...');
    await sql`
      CREATE TABLE IF NOT EXISTS dashboard_views (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        dashboard_id VARCHAR(255) NOT NULL REFERENCES analytics_dashboards(id),
        user_id VARCHAR(255) NOT NULL,
        viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        view_duration INTEGER,
        company_id VARCHAR(255) NOT NULL
      );
    `;
    
    // Create analytics metrics table
    console.log('Creating analytics metrics table...');
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_metrics (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        value TEXT NOT NULL,
        unit VARCHAR(20),
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        period VARCHAR(20),
        source VARCHAR(50),
        metadata TEXT
      );
    `;
    
    // Create metrics history table
    console.log('Creating metrics history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS metrics_history (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        metric_id VARCHAR(255) NOT NULL REFERENCES analytics_metrics(id),
        company_id VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        period VARCHAR(20),
        metadata TEXT
      );
    `;
    
    // Create analytics alerts table
    console.log('Creating analytics alerts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_alerts (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        metric_id VARCHAR(255) REFERENCES analytics_metrics(id),
        condition TEXT NOT NULL,
        severity alert_severity NOT NULL,
        status alert_status NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255),
        last_triggered_at TIMESTAMP,
        notification_channels TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `;
    
    // Create alert history table
    console.log('Creating alert history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS alert_history (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        alert_id VARCHAR(255) NOT NULL REFERENCES analytics_alerts(id),
        company_id VARCHAR(255) NOT NULL,
        previous_status alert_status,
        new_status alert_status NOT NULL,
        triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
        acknowledged_by VARCHAR(255),
        acknowledged_at TIMESTAMP,
        resolved_by VARCHAR(255),
        resolved_at TIMESTAMP,
        metric_value TEXT,
        message TEXT,
        notification_sent BOOLEAN NOT NULL DEFAULT FALSE
      );
    `;
    
    // Create business intelligence cost centers table
    console.log('Creating business intelligence cost centers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS bi_cost_centers (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        description TEXT,
        budget TEXT,
        manager_user_id VARCHAR(255),
        parent_cost_center_id VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `;
    
    // Add self-references for cost centers
    console.log('Adding self-reference for cost centers...');
    await sql`
      ALTER TABLE IF EXISTS bi_cost_centers
      DROP CONSTRAINT IF EXISTS fk_cost_center_parent;
    `;
    
    await sql`
      ALTER TABLE bi_cost_centers
      ADD CONSTRAINT fk_cost_center_parent
      FOREIGN KEY (parent_cost_center_id)
      REFERENCES bi_cost_centers(id);
    `;
    
    // Create business intelligence business units table
    console.log('Creating business intelligence business units table...');
    await sql`
      CREATE TABLE IF NOT EXISTS bi_business_units (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        description TEXT,
        manager_user_id VARCHAR(255),
        parent_business_unit_id VARCHAR(255),
        cost_center_id VARCHAR(255) REFERENCES bi_cost_centers(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `;
    
    // Add self-references for business units
    console.log('Adding self-reference for business units...');
    await sql`
      ALTER TABLE IF EXISTS bi_business_units
      DROP CONSTRAINT IF EXISTS fk_business_unit_parent;
    `;
    
    await sql`
      ALTER TABLE bi_business_units
      ADD CONSTRAINT fk_business_unit_parent
      FOREIGN KEY (parent_business_unit_id)
      REFERENCES bi_business_units(id);
    `;
    
    // Create business intelligence cost allocations table
    console.log('Creating business intelligence cost allocations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS bi_cost_allocations (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        source_cost_center_id VARCHAR(255) NOT NULL REFERENCES bi_cost_centers(id),
        target_cost_center_id VARCHAR(255) NOT NULL REFERENCES bi_cost_centers(id),
        allocation_method VARCHAR(50) NOT NULL,
        allocation_value TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        frequency VARCHAR(20),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `;
    
    // Create cost allocation history table
    console.log('Creating cost allocation history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS cost_allocation_history (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        cost_allocation_id VARCHAR(255) NOT NULL REFERENCES bi_cost_allocations(id),
        company_id VARCHAR(255) NOT NULL,
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        amount TEXT NOT NULL,
        allocated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        allocated_by VARCHAR(255) NOT NULL,
        notes TEXT
      );
    `;
    
    // Create predictive models table
    console.log('Creating predictive models table...');
    await sql`
      CREATE TABLE IF NOT EXISTS predictive_models (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type predictive_model_type NOT NULL,
        algorithm VARCHAR(50) NOT NULL,
        parameters TEXT,
        model_data TEXT,
        accuracy TEXT,
        last_trained_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        version INTEGER NOT NULL DEFAULT 1
      );
    `;
    
    // Create model training history table
    console.log('Creating model training history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS model_training_history (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        model_id VARCHAR(255) NOT NULL REFERENCES predictive_models(id),
        company_id VARCHAR(255) NOT NULL,
        trained_at TIMESTAMP NOT NULL DEFAULT NOW(),
        trained_by VARCHAR(255) NOT NULL,
        parameters TEXT,
        training_data_size INTEGER,
        accuracy TEXT,
        metrics TEXT,
        duration INTEGER,
        version INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL
      );
    `;
    
    // Create predictive scenarios table
    console.log('Creating predictive scenarios table...');
    await sql`
      CREATE TABLE IF NOT EXISTS predictive_scenarios (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        company_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type predictive_scenario_type NOT NULL,
        model_id VARCHAR(255) NOT NULL REFERENCES predictive_models(id),
        parameters TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255) NOT NULL,
        updated_by VARCHAR(255),
        last_run_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      );
    `;
    
    // Create scenario results table
    console.log('Creating scenario results table...');
    await sql`
      CREATE TABLE IF NOT EXISTS scenario_results (
        id VARCHAR(255) PRIMARY KEY NOT NULL,
        scenario_id VARCHAR(255) NOT NULL REFERENCES predictive_scenarios(id),
        company_id VARCHAR(255) NOT NULL,
        run_at TIMESTAMP NOT NULL DEFAULT NOW(),
        run_by VARCHAR(255) NOT NULL,
        parameters TEXT,
        results TEXT NOT NULL,
        duration INTEGER,
        status VARCHAR(20) NOT NULL,
        notes TEXT
      );
    `;
    
    console.log('Analytics schema successfully pushed to database.');
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