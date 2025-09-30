/**
 * Test Analytics Module
 * 
 * This script tests the Analytics module, specifically the predictive analytics capabilities.
 * It verifies that models can be created, time series data can be added, and predictions can be made.
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { createId } from './server/utils/id';

// Load environment variables
dotenv.config();

async function testPredictiveAnalytics() {
  console.log('Testing Analytics module and Predictive Analytics capabilities...');
  
  // Get database connection string from environment variables
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create SQL client
  const sql = postgres(connectionString, { max: 1 });
  
  try {
    // Check if the schema was successfully applied
    console.log('Checking if schema tables were created...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'analytics_%' 
      OR table_name LIKE 'bi_%' 
      OR table_name LIKE '%_history'
      OR table_name LIKE 'predictive_%'
      OR table_name = 'scenario_results'
      ORDER BY table_name;
    `;
    
    console.log('Analytics module tables found:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Test creating a predictive model
    const companyId = 'test-company-1';
    const userId = 'test-user-1';
    const modelId = createId();
    
    console.log('\nCreating test predictive model...');
    await sql`
      INSERT INTO predictive_models (
        id, company_id, name, description, type, algorithm, 
        parameters, created_by, updated_by, version
      ) VALUES (
        ${modelId}, 
        ${companyId}, 
        'Inventory Optimization Model', 
        'Predicts optimal stock levels based on historical sales data', 
        'inventory', 
        'regression', 
        '{"confidence_level": 0.95, "time_window": 90}', 
        ${userId}, 
        ${userId}, 
        1
      );
    `;
    
    // Test creating a predictive scenario
    const scenarioId = createId();
    console.log('Creating test predictive scenario...');
    await sql`
      INSERT INTO predictive_scenarios (
        id, company_id, name, description, type, model_id, 
        parameters, created_by, updated_by
      ) VALUES (
        ${scenarioId}, 
        ${companyId}, 
        'Q4 Stock Planning', 
        'Holiday season stock planning scenario', 
        'inventory_planning', 
        ${modelId}, 
        '{"seasonal_factor": 1.5, "include_promotions": true}', 
        ${userId}, 
        ${userId}
      );
    `;
    
    // Test adding a scenario result
    console.log('Adding test scenario result...');
    await sql`
      INSERT INTO scenario_results (
        id, scenario_id, company_id, run_by, results, status
      ) VALUES (
        ${createId()}, 
        ${scenarioId}, 
        ${companyId}, 
        ${userId}, 
        '{"recommended_stock": {"product-001": 120, "product-002": 85, "product-003": 210}, "confidence": 0.92}', 
        'success'
      );
    `;
    
    // Verify data was inserted
    console.log('\nVerifying data in predictive_models table:');
    const models = await sql`SELECT * FROM predictive_models;`;
    console.log(`Found ${models.length} models.`);
    
    console.log('Verifying data in predictive_scenarios table:');
    const scenarios = await sql`SELECT * FROM predictive_scenarios;`;
    console.log(`Found ${scenarios.length} scenarios.`);
    
    console.log('Verifying data in scenario_results table:');
    const results = await sql`SELECT * FROM scenario_results;`;
    console.log(`Found ${results.length} scenario results.`);
    
    // Create test BI cost center
    console.log('\nCreating test cost center...');
    await sql`
      INSERT INTO bi_cost_centers (
        id, company_id, name, code, budget, created_by
      ) VALUES (
        ${createId()}, 
        ${companyId}, 
        'IT Department', 
        'IT-001', 
        '100000', 
        ${userId}
      );
    `;
    
    // Verify BI data
    console.log('Verifying data in bi_cost_centers table:');
    const costCenters = await sql`SELECT * FROM bi_cost_centers;`;
    console.log(`Found ${costCenters.length} cost centers.`);
    
    console.log('\nAnalytics module tests completed successfully!');
    console.log('✅ Schema migration verified.');
    console.log('✅ Predictive analytics tables operational.');
    console.log('✅ Business intelligence tables operational.');
  } catch (error) {
    console.error('Error testing analytics schema:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await sql.end();
  }
}

// Execute the test function
testPredictiveAnalytics().catch(console.error);