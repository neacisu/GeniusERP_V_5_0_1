/**
 * Analytics Schema Module
 * 
 * This module defines the database schema for the analytics module,
 * supporting internal Business Intelligence (BI) for the ERP system.
 * This includes cost center performance, stock rotation, operational insights,
 * predictive analytics, financial KPIs, and multi-dimensional reporting.
 */

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  pgEnum, 
  integer,
  serial,
  numeric,
  json,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Forward references (resolved when schemas combined)
declare const companies: any;
declare const users: any;

/**
 * Report types enum
 */
export const reportTypeEnum = pgEnum('report_type', [
  'financial',
  'inventory',
  'sales',
  'marketing',
  'operations',
  'custom',
  // AI Report types
  'financial_summary',
  'sales_performance',
  'inventory_analysis',
  'customer_insights',
  'market_trends'
]);

/**
 * Alert severity enum
 */
export const alertSeverityEnum = pgEnum('alert_severity', [
  'critical',
  'high',
  'medium',
  'low',
  'info'
]);

/**
 * Alert status enum
 */
export const alertStatusEnum = pgEnum('alert_status', [
  'active',
  'acknowledged',
  'resolved',
  'dismissed'
]);

/**
 * Predictive model type enum
 */
export const predictiveModelTypeEnum = pgEnum('predictive_model_type', [
  'inventory',
  'sales',
  'pricing',
  'marketing',
  'financial',
  'custom'
]);

/**
 * Predictive scenario type enum
 */
export const predictiveScenarioTypeEnum = pgEnum('predictive_scenario_type', [
  'inventory_planning',
  'sales_forecasting',
  'pricing_optimization',
  'budget_planning',
  'marketing_campaign',
  'custom'
]);

/**
 * Analytics dashboards table
 * Stores dashboard definitions and metadata
 */
export const analytics_dashboards = pgTable('analytics_dashboards', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  layout: text('layout'), // JSON string with dashboard layout
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by').notNull(), // References user ID
  updatedBy: varchar('updated_by'), // References user ID
  isPublic: boolean('is_public').default(false).notNull(),
  refreshInterval: integer('refresh_interval'), // in seconds
  // Additional fields for compatibility
  data: text('data'), // Alternative data storage
  thumbnailUrl: text('thumbnail_url') // Dashboard thumbnail
});

/**
 * Analytics reports table
 * Stores report definitions and metadata
 */
export const analytics_reports = pgTable('analytics_reports', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: reportTypeEnum('type').notNull(),
  parameters: text('parameters'),
  result: text('result'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by').notNull(), // References user ID
  updatedBy: varchar('updated_by'), // References user ID
  isPublic: boolean('is_public').default(false).notNull(),
  dashboardId: varchar('dashboard_id').references(() => analytics_dashboards.id),
  schedule: varchar('schedule', { length: 50 })
});

/**
 * Report execution history table
 * Tracks when reports are run and their results
 */
export const report_execution_history = pgTable('report_execution_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  reportId: varchar('report_id').notNull().references(() => analytics_reports.id),
  companyId: varchar('company_id').notNull(), // References company ID
  executedBy: varchar('executed_by').notNull(), // References user ID
  executedAt: timestamp('executed_at').defaultNow().notNull(),
  parameters: text('parameters'),
  result: text('result'),
  executionTime: integer('execution_time'), // in milliseconds
  status: varchar('status', { length: 20 }).notNull(),
  errorMessage: text('error_message')
});

/**
 * Dashboard views table
 * Tracks dashboard usage statistics
 */
export const dashboard_views = pgTable('dashboard_views', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  dashboardId: varchar('dashboard_id').notNull().references(() => analytics_dashboards.id),
  userId: varchar('user_id').notNull(), // References user ID
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  viewDuration: integer('view_duration'), // in seconds
  companyId: varchar('company_id').notNull() // References company ID
});

/**
 * Analytics metrics table
 * Stores metric definitions and current values
 */
export const analytics_metrics = pgTable('analytics_metrics', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  value: text('value').notNull(),
  unit: varchar('unit', { length: 20 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  period: varchar('period', { length: 20 }), // daily, weekly, monthly, quarterly, yearly
  source: varchar('source', { length: 50 }),
  metadata: text('metadata'), // JSON string with additional metadata
  // Additional fields for compatibility
  format: varchar('format', { length: 20 }), // Data format
  aggregationType: varchar('aggregation_type', { length: 20 }), // Aggregation method
  query: text('query'), // Query definition
  parameters: text('parameters'), // Query parameters
  schedule: varchar('schedule', { length: 50 }), // Schedule for updates
  createdBy: varchar('created_by') // User who created the metric
});

/**
 * Metrics history table
 * Tracks historical values of metrics over time
 */
export const metrics_history = pgTable('metrics_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  metricId: varchar('metric_id').notNull().references(() => analytics_metrics.id),
  companyId: varchar('company_id').notNull(), // References company ID
  value: text('value').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  period: varchar('period', { length: 20 }), // daily, weekly, monthly, quarterly, yearly
  metadata: text('metadata') // JSON string with additional context
});

/**
 * Analytics alerts table
 * Stores alert definitions and current status
 */
export const analytics_alerts = pgTable('analytics_alerts', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  metricId: varchar('metric_id').references(() => analytics_metrics.id),
  condition: text('condition').notNull(), // e.g., "value > 1000"
  severity: alertSeverityEnum('severity').notNull(),
  status: alertStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by').notNull(), // References user ID
  updatedBy: varchar('updated_by'), // References user ID
  lastTriggeredAt: timestamp('last_triggered_at'),
  notificationChannels: text('notification_channels'), // JSON string with notification settings
  isActive: boolean('is_active').default(true).notNull(),
  // Additional fields for compatibility
  reportId: varchar('report_id'), // Associated report ID
  threshold: text('threshold'), // Threshold value
  source: varchar('source', { length: 50 }), // Alert source
  value: text('value'), // Current value
  message: text('message') // Alert message
});

/**
 * Alert history table
 * Tracks alert status changes and notifications
 */
export const alert_history = pgTable('alert_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  alertId: varchar('alert_id').notNull().references(() => analytics_alerts.id),
  companyId: varchar('company_id').notNull(), // References company ID
  previousStatus: alertStatusEnum('previous_status'),
  newStatus: alertStatusEnum('new_status').notNull(),
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
  acknowledgedBy: varchar('acknowledged_by'), // References user ID
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedBy: varchar('resolved_by'), // References user ID
  resolvedAt: timestamp('resolved_at'),
  metricValue: text('metric_value'),
  message: text('message'),
  notificationSent: boolean('notification_sent').default(false).notNull()
});

/**
 * Business intelligence cost centers table
 */
export const bi_cost_centers = pgTable('bi_cost_centers', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  budget: text('budget'), // Decimal as text
  managerUserId: varchar('manager_user_id'), // References user ID
  parentCostCenterId: varchar('parent_cost_center_id'), // Self-reference added in SQL migrations
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by').notNull(), // References user ID
  updatedBy: varchar('updated_by'), // References user ID
  isActive: boolean('is_active').default(true).notNull()
});

/**
 * Business intelligence business units table
 */
export const bi_business_units = pgTable('bi_business_units', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  managerUserId: varchar('manager_user_id'), // References user ID
  parentBusinessUnitId: varchar('parent_business_unit_id'), // Self-reference added in SQL migrations
  costCenterId: varchar('cost_center_id').references(() => bi_cost_centers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by').notNull(), // References user ID
  updatedBy: varchar('updated_by'), // References user ID
  isActive: boolean('is_active').default(true).notNull()
});

/**
 * Business intelligence cost allocations table
 */
export const bi_cost_allocations = pgTable('bi_cost_allocations', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  sourceCostCenterId: varchar('source_cost_center_id').notNull().references(() => bi_cost_centers.id),
  targetCostCenterId: varchar('target_cost_center_id').notNull().references(() => bi_cost_centers.id),
  allocationMethod: varchar('allocation_method', { length: 50 }).notNull(), // fixed, percentage, usage-based
  allocationValue: text('allocation_value').notNull(), // Amount or percentage as text
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  frequency: varchar('frequency', { length: 20 }), // monthly, quarterly, yearly
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by').notNull(), // References user ID
  updatedBy: varchar('updated_by'), // References user ID
  isActive: boolean('is_active').default(true).notNull()
});

/**
 * Cost allocation history table
 */
export const cost_allocation_history = pgTable('cost_allocation_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  costAllocationId: varchar('cost_allocation_id').notNull().references(() => bi_cost_allocations.id),
  companyId: varchar('company_id').notNull(), // References company ID
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  amount: text('amount').notNull(), // Decimal as text
  allocatedAt: timestamp('allocated_at').defaultNow().notNull(),
  allocatedBy: varchar('allocated_by').notNull(), // References user ID
  notes: text('notes')
});

/**
 * Predictive models table
 */
export const predictive_models = pgTable('predictive_models', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: predictiveModelTypeEnum('type').notNull(),
  algorithm: varchar('algorithm', { length: 50 }).notNull(),
  parameters: text('parameters'), // JSON string with model parameters
  modelData: text('model_data'), // Serialized model data or reference
  accuracy: text('accuracy'), // Decimal as text
  lastTrainedAt: timestamp('last_trained_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by').notNull(), // References user ID
  updatedBy: varchar('updated_by'), // References user ID
  isActive: boolean('is_active').default(true).notNull(),
  version: integer('version').default(1).notNull()
});

/**
 * Model training history table
 */
export const model_training_history = pgTable('model_training_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  modelId: varchar('model_id').notNull().references(() => predictive_models.id),
  companyId: varchar('company_id').notNull(), // References company ID
  trainedAt: timestamp('trained_at').defaultNow().notNull(),
  trainedBy: varchar('trained_by').notNull(), // References user ID
  parameters: text('parameters'), // JSON string with training parameters
  trainingDataSize: integer('training_data_size'),
  accuracy: text('accuracy'), // Decimal as text
  metrics: text('metrics'), // JSON string with performance metrics
  duration: integer('duration'), // in seconds
  version: integer('version').notNull(),
  status: varchar('status', { length: 20 }).notNull() // success, failed, in-progress
});

/**
 * Predictive scenarios table
 */
export const predictive_scenarios = pgTable('predictive_scenarios', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: predictiveScenarioTypeEnum('type').notNull(),
  modelId: varchar('model_id').notNull().references(() => predictive_models.id),
  parameters: text('parameters'), // JSON string with scenario parameters
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by').notNull(), // References user ID
  updatedBy: varchar('updated_by'), // References user ID
  lastRunAt: timestamp('last_run_at'),
  isActive: boolean('is_active').default(true).notNull()
});

/**
 * Scenario results table
 */
export const scenario_results = pgTable('scenario_results', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => sql`gen_random_uuid()`),
  scenarioId: varchar('scenario_id').notNull().references(() => predictive_scenarios.id),
  companyId: varchar('company_id').notNull(), // References company ID
  runAt: timestamp('run_at').defaultNow().notNull(),
  runBy: varchar('run_by').notNull(), // References user ID
  parameters: text('parameters'), // JSON string with run parameters
  results: text('results').notNull(), // JSON string with scenario results
  duration: integer('duration'), // in seconds
  status: varchar('status', { length: 20 }).notNull(), // success, failed, in-progress
  notes: text('notes')
});

// Type exports for TypeScript
export type Dashboard = typeof analytics_dashboards.$inferSelect;
export type InsertDashboard = typeof analytics_dashboards.$inferInsert;
export type Report = typeof analytics_reports.$inferSelect;
export type InsertReport = typeof analytics_reports.$inferInsert;
export type Metric = typeof analytics_metrics.$inferSelect;
export type InsertMetric = typeof analytics_metrics.$inferInsert;
export type Alert = typeof analytics_alerts.$inferSelect;
export type InsertAlert = typeof analytics_alerts.$inferInsert;
export type AlertHistory = typeof alert_history.$inferSelect;
export type InsertAlertHistory = typeof alert_history.$inferInsert;
export type CostCenter = typeof bi_cost_centers.$inferSelect;
export type InsertCostCenter = typeof bi_cost_centers.$inferInsert;
export type BusinessUnit = typeof bi_business_units.$inferSelect;
export type InsertBusinessUnit = typeof bi_business_units.$inferInsert;
export type CostAllocation = typeof bi_cost_allocations.$inferSelect;
export type InsertCostAllocation = typeof bi_cost_allocations.$inferInsert;
export type CostAllocationHistory = typeof cost_allocation_history.$inferSelect;
export type InsertCostAllocationHistory = typeof cost_allocation_history.$inferInsert;

// Additional types
export type ReportType = typeof reportTypeEnum.enumValues[number];
export type AlertSeverity = typeof alertSeverityEnum.enumValues[number];
export type AlertStatus = typeof alertStatusEnum.enumValues[number];
export type VisualizationType = 'bar' | 'line' | 'pie' | 'area' | 'table';

// ============================================================================
// ADDITIONAL ANALYTICS TABLES (Previously missing)
// ============================================================================

/**
 * Analytics Inventory Optimizations
 * Inventory optimization recommendations with EOQ calculations
 */
export const analytics_inventory_optimizations = pgTable("analytics_inventory_optimizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id", { length: 36 }).notNull(),
  warehouseId: varchar("warehouse_id", { length: 36 }).notNull(),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  currentStockLevel: integer("current_stock_level").notNull(),
  recommendedStockLevel: integer("recommended_stock_level").notNull(),
  reorderPoint: integer("reorder_point").notNull(),
  safetyStock: integer("safety_stock").notNull(),
  economicOrderQuantity: integer("economic_order_quantity"),
  leadTimeDays: integer("lead_time_days"),
  averageDailyDemand: numeric("average_daily_demand"),
  seasonalityFactor: numeric("seasonality_factor"),
  stockoutCost: numeric("stockout_cost"),
  holdingCostPercentage: numeric("holding_cost_percentage"),
  optimizationAlgorithm: varchar("optimization_algorithm", { length: 50 }),
  algorithmParameters: json("algorithm_parameters"),
  optimizationNotes: text("optimization_notes"),
  confidenceLevel: numeric("confidence_level").notNull(),
  calculationDate: timestamp("calculation_date", { withTimezone: true }).defaultNow(),
  modelExecutionId: uuid("model_execution_id"),
  status: varchar("status", { length: 20 }),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * Analytics Model Executions
 * Execution history for predictive models
 */
export const analytics_model_executions = pgTable("analytics_model_executions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: uuid("model_id").notNull(),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  executionDate: timestamp("execution_date", { withTimezone: true }).defaultNow(),
  parameters: json("parameters").notNull().default('{}'),
  result: json("result").notNull().default('{}'),
  status: varchar("status", { length: 20 }).notNull().default('completed'),
  executionTimeMs: integer("execution_time_ms"),
  metrics: json("metrics"),
  datasetId: varchar("dataset_id", { length: 36 }),
  trainingMetrics: json("training_metrics"),
  validationMetrics: json("validation_metrics"),
  errorMessage: text("error_message"),
  version: varchar("version", { length: 20 }),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * Analytics Scenario Executions
 * Scenario simulation execution history
 */
export const analytics_scenario_executions = pgTable("analytics_scenario_executions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  scenarioId: uuid("scenario_id").notNull(),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  executionDate: timestamp("execution_date", { withTimezone: true }).defaultNow(),
  parameters: json("parameters").notNull().default('{}'),
  results: json("results").notNull().default('{}'),
  status: varchar("status", { length: 20 }).notNull().default('completed'),
  executionTimeMs: integer("execution_time_ms"),
  errorMessage: text("error_message"),
  createdBy: varchar("created_by", { length: 36 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});