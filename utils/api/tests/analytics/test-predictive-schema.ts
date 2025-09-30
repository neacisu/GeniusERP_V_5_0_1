/**
 * Test Script for Predictive Analytics Schema
 * 
 * This script verifies that the schema is correctly synced between the ORM models and database.
 * It tests creating and retrieving data with the ORM, particularly for scenario results.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';
import { analyticsPredictiveModels, analyticsScenarios, analyticsScenarioResults } from './server/modules/analytics/schema/predictive.schema';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function testPredictiveSchema() {
  console.log('Starting predictive schema test...');
  
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
    
    // Create a test predictive model
    const modelId = uuidv4();
    await db.insert(analyticsPredictiveModels).values({
      id: modelId,
      name: 'Test Predictive Model',
      modelType: 'FORECASTING',
      predictionType: 'INVENTORY',
      targetEntity: 'product',
      configuration: { algorithm: 'prophet', frequency: 'daily' },
      companyId: 'test-company-id',
      createdBy: 'test-user',
      updatedBy: 'test-user', // This field is required and was causing the error
      trainingConfig: { 
        learningRate: 0.01, 
        epochs: 100, 
        earlyStoppingPatience: 10,
        validationSplit: 0.2
      },
      features: ['historical_sales', 'season', 'price_change', 'marketing_campaign']
    });
    console.log('Created test predictive model with ID:', modelId);
    
    // Create a test scenario
    const scenarioId = uuidv4();
    await db.insert(analyticsScenarios).values({
      id: scenarioId,
      name: 'Test Inventory Scenario',
      baseModelId: modelId,
      inputs: [
        { name: 'stock_level', type: 'number', default: 100 },
        { name: 'lead_time_days', type: 'number', default: 7 },
        { name: 'safety_stock_factor', type: 'number', default: 1.5 }
      ],
      outputs: [
        { name: 'recommended_order_quantity', type: 'number' },
        { name: 'expected_stockout_probability', type: 'number' }
      ],
      scenarioType: 'inventory_optimization',
      scenarioCategory: 'stock_level',
      isActive: true,
      companyId: 'test-company-id',
      createdBy: 'test-user',
      updatedBy: 'test-user'
    });
    console.log('Created test scenario with ID:', scenarioId);
    
    // Create a test scenario result
    const resultId = uuidv4();
    const executionId = uuidv4();
    await db.insert(analyticsScenarioResults).values({
      id: resultId,
      scenarioId: scenarioId,
      executionId: executionId,
      inputValues: { 
        stock_level: 150, 
        lead_time_days: 10, 
        safety_stock_factor: 2.0 
      },
      results: {
        recommended_order_quantity: 75,
        expected_stockout_probability: 0.05,
        confidence_interval: [65, 85]
      },
      metadata: {
        execution_time_ms: 345,
        model_version: '1.2.0'
      },
      companyId: 'test-company-id',
      createdBy: 'test-user'
    });
    console.log('Created test scenario result with ID:', resultId);
    
    // Retrieve the scenario result to verify
    const retrievedResults = await db.select().from(analyticsScenarioResults).where(sql`${analyticsScenarioResults.id} = ${resultId}`);
    console.log('Retrieved scenario result:', JSON.stringify(retrievedResults[0], null, 2));
    
    // Verify scenario with joins
    const scenarioWithResults = await db
      .select({
        scenario: analyticsScenarios,
        result: analyticsScenarioResults
      })
      .from(analyticsScenarios)
      .leftJoin(analyticsScenarioResults, sql`${analyticsScenarios.id} = ${analyticsScenarioResults.scenarioId}`)
      .where(sql`${analyticsScenarios.id} = ${scenarioId}`);
    
    console.log('Retrieved scenario with results (joined):', 
      JSON.stringify({
        id: scenarioWithResults[0].scenario.id,
        name: scenarioWithResults[0].scenario.name,
        inputs: scenarioWithResults[0].scenario.inputs,
        result: {
          id: scenarioWithResults[0].result.id,
          inputValues: scenarioWithResults[0].result.inputValues,
          results: scenarioWithResults[0].result.results
        }
      }, null, 2));
    
    // Clean up test data - optional if you want to keep the test data in the database
    /*
    await db.delete(analyticsScenarioResults).where(sql`${analyticsScenarioResults.id} = ${resultId}`);
    await db.delete(analyticsScenarios).where(sql`${analyticsScenarios.id} = ${scenarioId}`);
    await db.delete(analyticsPredictiveModels).where(sql`${analyticsPredictiveModels.id} = ${modelId}`);
    console.log('Cleaned up test data');
    */
    
    console.log('Predictive schema test completed successfully');
  } catch (error) {
    console.error('Error during predictive schema test:', error);
    process.exit(1);
  }
}

// Run the test
testPredictiveSchema();