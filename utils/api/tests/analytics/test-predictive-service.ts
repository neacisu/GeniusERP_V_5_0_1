/**
 * Test file for the Predictive Analytics Service
 * 
 * This script tests the implementation of the predictive analytics service
 * which provides forecasting capabilities, inventory optimization,
 * and purchasing recommendations.
 */

import { DrizzleService } from './server/common/drizzle/drizzle.service';
import { AnalyticsService } from './server/modules/analytics/services/analytics.service';
import { PredictiveService } from './server/modules/analytics/services/predictive.service';
import { AuditService } from './server/modules/audit/audit.service';

/**
 * Helper function to log results in a formatted way
 */
function logResult(title: string, data: any) {
  console.log('\n' + '='.repeat(80));
  console.log(`${title}`);
  console.log('='.repeat(80));
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Initialize services needed for testing
 */
async function initializeServices() {
  console.log('Initializing services for testing...');

  const drizzleService = new DrizzleService();
  const auditService = new AuditService(drizzleService);
  const analyticsService = new AnalyticsService(drizzleService, auditService);
  const predictiveService = new PredictiveService(drizzleService, analyticsService, auditService);

  return {
    drizzleService,
    analyticsService,
    predictiveService,
    auditService
  };
}

/**
 * Test creating and retrieving predictive models
 */
async function testPredictiveModels(predictiveService: PredictiveService) {
  console.log('\nTesting predictive models...');

  // Test creating a predictive model
  const modelData = {
    name: 'Inventory Optimization Model',
    type: 'inventory',
    description: 'Model for optimizing inventory levels based on historical data',
    algorithm: 'time_series_forecasting',
    parameters: JSON.stringify({
      timeframe: '90d',
      confidence_interval: 0.95,
      seasonality: true
    }),
    companyId: 'test-company-123',
    createdBy: 'test-user-123'
  };

  const model = await predictiveService.createPredictiveModel(modelData);
  logResult('Created predictive model', model);

  // Test retrieving all models
  const models = await predictiveService.getPredictiveModels('test-company-123', { page: 1, limit: 10 });
  logResult('Retrieved predictive models', models);

  // Test retrieving a specific model
  if (models.length > 0) {
    const modelId = models[0].id;
    const retrievedModel = await predictiveService.getPredictiveModelById(modelId, 'test-company-123');
    logResult('Retrieved specific model', retrievedModel);
  }

  return model;
}

/**
 * Test creating and running predictive scenarios
 */
async function testPredictiveScenarios(predictiveService: PredictiveService, modelId: string) {
  console.log('\nTesting predictive scenarios...');

  // Test creating a predictive scenario
  const scenarioData = {
    name: 'Q4 Inventory Planning',
    type: 'inventory_planning',
    description: 'Scenario for planning Q4 inventory levels',
    modelId: modelId,
    parameters: JSON.stringify({
      start_date: '2023-10-01',
      end_date: '2023-12-31',
      include_holidays: true,
      stockout_tolerance: 0.05
    }),
    companyId: 'test-company-123',
    createdBy: 'test-user-123'
  };

  const scenario = await predictiveService.createPredictiveScenario(scenarioData);
  logResult('Created predictive scenario', scenario);

  // Test retrieving all scenarios
  const scenarios = await predictiveService.getPredictiveScenarios('test-company-123', { page: 1, limit: 10 });
  logResult('Retrieved predictive scenarios', scenarios);

  // Test retrieving a specific scenario
  if (scenarios.length > 0) {
    const scenarioId = scenarios[0].id;
    const retrievedScenario = await predictiveService.getPredictiveScenarioById(scenarioId, 'test-company-123');
    logResult('Retrieved specific scenario', retrievedScenario);

    // Test running a scenario
    const runResult = await predictiveService.runPredictiveScenario(
      scenarioId,
      'test-company-123',
      'test-user-123',
      { additional_param: 'value' }
    );
    logResult('Scenario run result', runResult);
  }
}

/**
 * Test inventory forecasting
 */
async function testInventoryForecasting(predictiveService: PredictiveService) {
  console.log('\nTesting inventory forecasting...');

  const forecast = await predictiveService.getInventoryForecast(
    'test-company-123',
    'product-123',
    'warehouse-123',
    '30d'
  );
  logResult('Inventory forecast', forecast);
}

/**
 * Test sales forecasting
 */
async function testSalesForecasting(predictiveService: PredictiveService) {
  console.log('\nTesting sales forecasting...');

  const forecast = await predictiveService.getSalesForecast(
    'test-company-123',
    'product-123',
    '30d'
  );
  logResult('Sales forecast', forecast);
}

/**
 * Test purchase recommendations
 */
async function testPurchaseRecommendations(predictiveService: PredictiveService) {
  console.log('\nTesting purchase recommendations...');

  const recommendations = await predictiveService.getPurchaseRecommendations(
    'test-company-123',
    'warehouse-123'
  );
  logResult('Purchase recommendations', recommendations);
}

/**
 * Run all tests
 */
async function runAllTests() {
  try {
    const { predictiveService } = await initializeServices();

    // Run tests
    const model = await testPredictiveModels(predictiveService);
    await testPredictiveScenarios(predictiveService, model.id);
    await testInventoryForecasting(predictiveService);
    await testSalesForecasting(predictiveService);
    await testPurchaseRecommendations(predictiveService);

    console.log('\n✅ All tests completed successfully');
  } catch (error) {
    console.error('❌ Tests failed with error:', error);
  }
}

// Run the tests
runAllTests();