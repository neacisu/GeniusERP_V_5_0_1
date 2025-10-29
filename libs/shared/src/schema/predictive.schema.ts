/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Predictive Analytics Schema
 * 
 * This file defines the database schema for the predictive analytics functionality
 * including models for forecasting, AI predictions, and time series analysis.
 */

import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, integer, index, doublePrecision, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Prediction Model Types Enum
export const PredictionModelType = {
  ARIMA: 'ARIMA',              // Auto-Regressive Integrated Moving Average
  SARIMA: 'SARIMA',            // Seasonal ARIMA
  LINEAR_REGRESSION: 'LINEAR_REGRESSION',
  PROPHET: 'PROPHET',          // Facebook's Prophet model
  LSTM: 'LSTM',                // Long Short-Term Memory neural network
  GRU: 'GRU',                  // Gated Recurrent Unit neural network
  XGBOOST: 'XGBOOST',          // XGBoost gradient boosting
  ENSEMBLE: 'ENSEMBLE',        // Ensemble of multiple models
  CUSTOM: 'CUSTOM',            // Custom model
  OPENAI: 'OPENAI',            // OpenAI GPT model
  ML_MODEL: 'ML_MODEL'         // Generic ML model (with model details in config)
};

export type PredictionModelTypeValues = typeof PredictionModelType[keyof typeof PredictionModelType];

// Prediction Types Enum
export const PredictionType = {
  STOCK_LEVEL: 'STOCK_LEVEL',          // Predict inventory stock levels
  STOCK_OUTAGE: 'STOCK_OUTAGE',        // Predict potential stock outages
  PURCHASING_VOLUME: 'PURCHASING_VOLUME', // Predict required purchase volumes
  SALES_FORECAST: 'SALES_FORECAST',    // Predict sales volume/revenue
  DEMAND_FORECAST: 'DEMAND_FORECAST',  // Predict product demand
  PRICE_OPTIMIZATION: 'PRICE_OPTIMIZATION', // Predict optimal pricing
  CASH_FLOW: 'CASH_FLOW',              // Predict cash flow
  CUSTOMER_BEHAVIOR: 'CUSTOMER_BEHAVIOR', // Predict customer behavior
  SUPPLIER_PERFORMANCE: 'SUPPLIER_PERFORMANCE', // Predict supplier performance
  RESOURCE_ALLOCATION: 'RESOURCE_ALLOCATION', // Predict optimal resource allocation
  CUSTOM: 'CUSTOM'                     // Custom prediction type
};

export type PredictionTypeValues = typeof PredictionType[keyof typeof PredictionType];

/**
 * Predictive Models Table
 * 
 * Stores configurations and metadata for predictive models.
 */
export const analytics_predictive_models = pgTable('analytics_predictive_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  modelType: varchar('model_type', { length: 50 }).notNull(), // ARIMA, SARIMA, LSTM, etc.
  predictionType: varchar('prediction_type', { length: 50 }).notNull(), // STOCK_LEVEL, SALES_FORECAST, etc.
  targetEntity: varchar('target_entity', { length: 100 }).notNull(), // products, inventory, sales, etc.
  configuration: jsonb('configuration').notNull(), // Model parameters and configuration
  trainingConfig: jsonb('training_config'), // Training parameters (epochs, learning rate, etc.)
  features: jsonb('features'), // Array of features/variables used in the model
  preProcessingSteps: jsonb('pre_processing_steps'), // Data preprocessing steps
  postProcessingSteps: jsonb('post_processing_steps'), // Data postprocessing steps
  evaluationMetrics: jsonb('evaluation_metrics'), // Model evaluation metrics (RMSE, MAE, etc.)
  lastTrainedAt: timestamp('last_trained_at'),
  lastEvaluatedAt: timestamp('last_evaluated_at'),
  isActive: boolean('is_active').default(true),
  companyId: varchar('company_id', { length: 36 }).notNull(),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  updatedBy: varchar('updated_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  version: integer('version').default(1),
  modelUrl: text('model_url'), // URL to the model file (for ML models)
  integrationId: varchar('integration_id', { length: 36 }), // Reference to external model API
  // Additional fields for compatibility
  type: varchar('type', { length: 50 }), // Alias for modelType
  algorithm: varchar('algorithm', { length: 50 }), // Algorithm name
  parameters: jsonb('parameters'), // Model parameters (alias for configuration)
  trainingData: text('training_data'), // Training data reference
  status: varchar('status', { length: 20 }).default('draft'), // Model status
}, (table) => ({
  companyIdx: index('analytics_predictive_models_company_idx').on(table.companyId),
  typeIdx: index('analytics_predictive_models_type_idx').on(table.modelType, table.predictionType),
}));

/**
 * Prediction Results Table
 * 
 * Stores the results of predictive model executions.
 */
export const analytics_prediction_results = pgTable('analytics_prediction_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull().references(() => analytics_predictive_models.id, { onDelete: 'cascade' }),
  executionId: uuid('execution_id').notNull(), // Unique ID for this execution run
  predictionDate: timestamp('prediction_date').notNull(), // When the prediction was made
  targetDate: timestamp('target_date').notNull(), // Date for which the prediction is made
  predictions: jsonb('predictions').notNull(), // Prediction values and confidence intervals
  actualValues: jsonb('actual_values'), // Actual values (once known, for comparison)
  accuracy: doublePrecision('accuracy'), // Prediction accuracy (once actual values are known)
  confidenceLevel: doublePrecision('confidence_level'), // Confidence level of the prediction
  inputParameters: jsonb('input_parameters'), // Parameters used for this prediction
  metadata: jsonb('metadata'), // Additional metadata about the prediction
  tags: jsonb('tags'), // Tags for filtering/categorization
  createdAt: timestamp('created_at').defaultNow(),
  additionalMetrics: jsonb('additional_metrics'), // Additional performance metrics
}, (table) => ({
  modelIdx: index('analytics_prediction_results_model_idx').on(table.modelId),
  targetDateIdx: index('analytics_prediction_results_target_date_idx').on(table.targetDate),
  executionIdx: index('analytics_prediction_results_execution_idx').on(table.executionId),
}));

/**
 * Time Series Data Table
 * 
 * Stores time series data for model training and forecasting.
 */
export const analytics_time_series_data = pgTable('analytics_time_series_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // products, inventory, sales, etc.
  entityId: varchar('entity_id', { length: 36 }).notNull(), // ID of the related entity
  metricName: varchar('metric_name', { length: 100 }).notNull(), // What's being measured
  timestamp: timestamp('timestamp').notNull(), // Time point of the measurement
  value: doublePrecision('value').notNull(), // The measured value
  additionalData: jsonb('additional_data'), // Additional context data
  source: varchar('source', { length: 100 }), // Source of the data
  isAdjusted: boolean('is_adjusted').default(false), // Whether the value was adjusted/corrected
  adjustmentReason: text('adjustment_reason'), // Reason for adjustment
  companyId: varchar('company_id', { length: 36 }).notNull(),
  warehouseId: varchar('warehouse_id', { length: 36 }), // Optional warehouse ID for inventory data
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  entityIdx: index('analytics_time_series_entity_idx').on(table.entityType, table.entityId),
  timeIdx: index('analytics_time_series_time_idx').on(table.timestamp),
  metricIdx: index('analytics_time_series_metric_idx').on(table.metricName),
  companyIdx: index('analytics_time_series_company_idx').on(table.companyId),
}));

/**
 * Anomaly Detection Rules Table
 * 
 * Stores rules for detecting anomalies in time series data.
 */
export const analytics_anomaly_rules = pgTable('analytics_anomaly_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // products, inventory, sales, etc.
  metricName: varchar('metric_name', { length: 100 }).notNull(), // What's being measured
  detectionMethod: varchar('detection_method', { length: 100 }).notNull(), // statistical, ml-based, etc.
  configuration: jsonb('configuration').notNull(), // Rule configuration
  sensitivityLevel: doublePrecision('sensitivity_level').default(1.0), // How sensitive the rule is
  isActive: boolean('is_active').default(true),
  notificationChannels: jsonb('notification_channels'), // Where to send notifications
  companyId: varchar('company_id', { length: 36 }).notNull(),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  updatedBy: varchar('updated_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  entityMetricIdx: index('analytics_anomaly_rules_metric_idx').on(table.entityType, table.metricName),
  companyIdx: index('analytics_anomaly_rules_company_idx').on(table.companyId),
}));

/**
 * Detected Anomalies Table
 * 
 * Stores detected anomalies in time series data.
 */
export const analytics_anomalies = pgTable('analytics_anomalies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleId: uuid('rule_id').notNull().references(() => analytics_anomaly_rules.id, { onDelete: 'cascade' }),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // products, inventory, sales, etc.
  entityId: varchar('entity_id', { length: 36 }).notNull(), // ID of the related entity
  metricName: varchar('metric_name', { length: 100 }).notNull(), // What's being measured
  timestamp: timestamp('timestamp').notNull(), // When the anomaly occurred
  expectedValue: doublePrecision('expected_value'), // Expected value based on model
  actualValue: doublePrecision('actual_value').notNull(), // Actual observed value
  deviation: doublePrecision('deviation'), // Deviation from expected
  severity: varchar('severity', { length: 20 }).notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  status: varchar('status', { length: 20 }).default('OPEN'), // OPEN, ACKNOWLEDGED, RESOLVED, IGNORED
  metadata: jsonb('metadata'), // Additional context
  resolvedBy: varchar('resolved_by', { length: 36 }),
  resolvedAt: timestamp('resolved_at'),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  ruleIdx: index('analytics_anomalies_rule_idx').on(table.ruleId),
  entityIdx: index('analytics_anomalies_entity_idx').on(table.entityType, table.entityId),
  timeIdx: index('analytics_anomalies_time_idx').on(table.timestamp),
  statusIdx: index('analytics_anomalies_status_idx').on(table.status),
}));

/**
 * Seasonal Pattern Analysis Table
 * 
 * Stores identified seasonal patterns in time series data.
 */
export const analytics_seasonal_patterns = pgTable('analytics_seasonal_patterns', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // products, inventory, sales, etc.
  entityId: varchar('entity_id', { length: 36 }).notNull(), // ID of the related entity
  metricName: varchar('metric_name', { length: 100 }).notNull(), // What's being measured
  patternType: varchar('pattern_type', { length: 50 }).notNull(), // daily, weekly, monthly, quarterly, annual
  strength: doublePrecision('strength').notNull(), // Strength of the pattern (0-1)
  configuration: jsonb('configuration').notNull(), // Pattern configuration and coefficients
  confidenceLevel: doublePrecision('confidence_level'), // Confidence in the pattern detection
  validFrom: timestamp('valid_from'), // Start of validity period
  validTo: timestamp('valid_to'), // End of validity period
  isActive: boolean('is_active').default(true),
  companyId: varchar('company_id', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  entityMetricIdx: index('analytics_seasonal_patterns_metric_idx').on(table.entityType, table.entityId, table.metricName),
  typeIdx: index('analytics_seasonal_patterns_type_idx').on(table.patternType),
  companyIdx: index('analytics_seasonal_patterns_company_idx').on(table.companyId),
}));

/**
 * Scenario Analysis Table
 * 
 * Stores configurations for "what-if" scenario analysis.
 */
export const analytics_scenarios = pgTable('analytics_scenarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  baseModelId: uuid('base_model_id').references(() => analytics_predictive_models.id, { onDelete: 'set null' }),
  inputs: jsonb('inputs').notNull().default('[]'), // Input parameters for the scenario
  outputs: jsonb('outputs').notNull().default('[]'), // Output metrics to track
  variables: jsonb('variables'), // Optional: Variables and their ranges for the scenario
  parameters: jsonb('parameters'), // Additional configuration parameters
  assumptions: jsonb('assumptions'), // Business assumptions for the scenario
  timeHorizon: varchar('time_horizon'), // Time horizon for the scenario (short, medium, long)
  visibility: varchar('visibility'), // Scenario visibility (private, team, organization)
  scenarioType: varchar('scenario_type'), // Type of scenario (forecast, what-if, risk, etc.)
  scenarioCategory: varchar('scenario_category'), // Category (financial, inventory, sales, etc.)
  isTemplate: boolean('is_template'), // Whether this is a reusable template
  templateId: uuid('template_id'), // Reference to parent template if derived
  tags: jsonb('tags'), // Tags for categorization and filtering
  isActive: boolean('is_active').default(true),
  companyId: varchar('company_id', { length: 36 }).notNull(),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  updatedBy: varchar('updated_by', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  // Additional fields for compatibility
  modelId: uuid('model_id'), // Alias for baseModelId
  status: varchar('status', { length: 20 }).default('draft'), // Scenario status
}, (table) => ({
  modelIdx: index('analytics_scenarios_model_idx').on(table.baseModelId),
  companyIdx: index('analytics_scenarios_company_idx').on(table.companyId),
}));

/**
 * Scenario Results Table
 * 
 * Stores results from scenario analysis runs.
 */
export const analytics_scenario_results = pgTable('analytics_scenario_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  scenarioId: uuid('scenario_id').notNull().references(() => analytics_scenarios.id, { onDelete: 'cascade' }),
  executionId: uuid('execution_id').notNull(), // Unique ID for this scenario run
  inputValues: jsonb('input_values').notNull(), // Input values used for this scenario
  results: jsonb('results').notNull(), // Results of the scenario analysis
  metadata: jsonb('metadata'), // Additional metadata
  companyId: varchar('company_id', { length: 36 }).notNull(),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  scenarioIdx: index('analytics_scenario_results_scenario_idx').on(table.scenarioId),
  executionIdx: index('analytics_scenario_results_execution_idx').on(table.executionId),
  companyIdx: index('analytics_scenario_results_company_idx').on(table.companyId),
}));

/**
 * Inventory Optimization Table
 * 
 * Stores inventory optimization recommendations.
 */
export const analytics_inventory_optimization = pgTable('analytics_inventory_optimization', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  warehouseId: varchar('warehouse_id', { length: 36 }).notNull(),
  recommendedStockLevel: doublePrecision('recommended_stock_level').notNull(),
  currentStockLevel: doublePrecision('current_stock_level').notNull(),
  safetyStock: doublePrecision('safety_stock').notNull(),
  reorderPoint: doublePrecision('reorder_point').notNull(),
  economicOrderQuantity: doublePrecision('economic_order_quantity'),
  leadTime: integer('lead_time'), // in days
  stockOutProbability: doublePrecision('stock_out_probability'),
  holding_cost: doublePrecision('holding_cost'),
  ordering_cost: doublePrecision('ordering_cost'),
  stockout_cost: doublePrecision('stockout_cost'),
  confidence: doublePrecision('confidence'),
  modelId: uuid('model_id').references(() => analytics_predictive_models.id, { onDelete: 'set null' }),
  executionId: uuid('execution_id'),
  companyId: varchar('company_id', { length: 36 }).notNull(),
  calculatedAt: timestamp('calculated_at').defaultNow(),
  validUntil: timestamp('valid_until'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
}, (table) => ({
  productWarehouseIdx: uniqueIndex('analytics_inventory_opt_product_warehouse_idx').on(table.productId, table.warehouseId),
  companyIdx: index('analytics_inventory_opt_company_idx').on(table.companyId),
}));

/**
 * Purchasing Recommendations Table
 * 
 * Stores recommended purchase orders based on predictions.
 */
export const analytics_purchasing_recommendations = pgTable('analytics_purchasing_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: varchar('product_id', { length: 36 }).notNull(),
  warehouseId: varchar('warehouse_id', { length: 36 }).notNull(),
  supplierId: varchar('supplier_id', { length: 36 }).notNull(),
  recommendedQuantity: doublePrecision('recommended_quantity').notNull(),
  recommendedOrderDate: timestamp('recommended_order_date').notNull(),
  expectedDeliveryDate: timestamp('expected_delivery_date').notNull(),
  pricePrediction: doublePrecision('price_prediction'),
  confidenceLevel: doublePrecision('confidence_level'),
  modelId: uuid('model_id').references(() => analytics_predictive_models.id, { onDelete: 'set null' }),
  executionId: uuid('execution_id'),
  status: varchar('status', { length: 20 }).default('PENDING'), // PENDING, APPROVED, REJECTED, ORDERED
  approvedBy: varchar('approved_by', { length: 36 }),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  companyId: varchar('company_id', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  productSupplierIdx: index('analytics_purchasing_rec_product_supplier_idx').on(table.productId, table.supplierId),
  dateIdx: index('analytics_purchasing_rec_date_idx').on(table.recommendedOrderDate),
  statusIdx: index('analytics_purchasing_rec_status_idx').on(table.status),
  companyIdx: index('analytics_purchasing_rec_company_idx').on(table.companyId),
}));

// Create insert schemas
export const insertPredictiveModelSchema = createInsertSchema(analytics_predictive_models);
export const insertPredictionResultSchema = createInsertSchema(analytics_prediction_results);
export const insertTimeSeriesDataSchema = createInsertSchema(analytics_time_series_data);
export const insertAnomalyRuleSchema = createInsertSchema(analytics_anomaly_rules);
export const insertAnomalySchema = createInsertSchema(analytics_anomalies);
export const insertSeasonalPatternSchema = createInsertSchema(analytics_seasonal_patterns);
export const insertScenarioSchema = createInsertSchema(analytics_scenarios);
export const insertScenarioResultSchema = createInsertSchema(analytics_scenario_results);
export const insertInventoryOptimizationSchema = createInsertSchema(analytics_inventory_optimization);
export const insertPurchasingRecommendationSchema = createInsertSchema(analytics_purchasing_recommendations);

// Export types
export type PredictiveModel = typeof analytics_predictive_models.$inferSelect;
export type PredictionResult = typeof analytics_prediction_results.$inferSelect;
export type TimeSeriesData = typeof analytics_time_series_data.$inferSelect;
export type AnomalyRule = typeof analytics_anomaly_rules.$inferSelect;
export type Anomaly = typeof analytics_anomalies.$inferSelect;
export type SeasonalPattern = typeof analytics_seasonal_patterns.$inferSelect;
export type Scenario = typeof analytics_scenarios.$inferSelect;
export type ScenarioResult = typeof analytics_scenario_results.$inferSelect;
export type InventoryOptimization = typeof analytics_inventory_optimization.$inferSelect;
export type PurchasingRecommendation = typeof analytics_purchasing_recommendations.$inferSelect;

// Insert types
export type InsertPredictiveModel = z.infer<typeof insertPredictiveModelSchema>;
export type InsertPredictionResult = z.infer<typeof insertPredictionResultSchema>;
export type InsertTimeSeriesData = z.infer<typeof insertTimeSeriesDataSchema>;
export type InsertAnomalyRule = z.infer<typeof insertAnomalyRuleSchema>;
export type InsertAnomaly = z.infer<typeof insertAnomalySchema>;
export type InsertSeasonalPattern = z.infer<typeof insertSeasonalPatternSchema>;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type InsertScenarioResult = z.infer<typeof insertScenarioResultSchema>;
export type InsertInventoryOptimization = z.infer<typeof insertInventoryOptimizationSchema>;
export type InsertPurchasingRecommendation = z.infer<typeof insertPurchasingRecommendationSchema>;