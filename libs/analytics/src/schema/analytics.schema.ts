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
  varchar, 
  text, 
  timestamp, 
  boolean, 
  pgEnum, 
  integer
} from 'drizzle-orm/pg-core';
import { createId } from '@geniuserp/shared/utils/id';

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
export const analyticsDashboards = pgTable('analytics_dashboards', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
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
export const analyticsReports = pgTable('analytics_reports', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
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
  dashboardId: varchar('dashboard_id').references(() => analyticsDashboards.id),
  schedule: varchar('schedule', { length: 50 })
});

/**
 * Report execution history table
 * Tracks when reports are run and their results
 */
export const reportExecutionHistory = pgTable('report_execution_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  reportId: varchar('report_id').notNull().references(() => analyticsReports.id),
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
export const dashboardViews = pgTable('dashboard_views', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  dashboardId: varchar('dashboard_id').notNull().references(() => analyticsDashboards.id),
  userId: varchar('user_id').notNull(), // References user ID
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  viewDuration: integer('view_duration'), // in seconds
  companyId: varchar('company_id').notNull() // References company ID
});

/**
 * Analytics metrics table
 * Stores metric definitions and current values
 */
export const analyticsMetrics = pgTable('analytics_metrics', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
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
export const metricsHistory = pgTable('metrics_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  metricId: varchar('metric_id').notNull().references(() => analyticsMetrics.id),
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
export const analyticsAlerts = pgTable('analytics_alerts', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  metricId: varchar('metric_id').references(() => analyticsMetrics.id),
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
export const alertHistory = pgTable('alert_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  alertId: varchar('alert_id').notNull().references(() => analyticsAlerts.id),
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
export const biCostCenters = pgTable('bi_cost_centers', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
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
export const biBusinessUnits = pgTable('bi_business_units', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  managerUserId: varchar('manager_user_id'), // References user ID
  parentBusinessUnitId: varchar('parent_business_unit_id'), // Self-reference added in SQL migrations
  costCenterId: varchar('cost_center_id').references(() => biCostCenters.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by').notNull(), // References user ID
  updatedBy: varchar('updated_by'), // References user ID
  isActive: boolean('is_active').default(true).notNull()
});

/**
 * Business intelligence cost allocations table
 */
export const biCostAllocations = pgTable('bi_cost_allocations', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  sourceCostCenterId: varchar('source_cost_center_id').notNull().references(() => biCostCenters.id),
  targetCostCenterId: varchar('target_cost_center_id').notNull().references(() => biCostCenters.id),
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
export const costAllocationHistory = pgTable('cost_allocation_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  costAllocationId: varchar('cost_allocation_id').notNull().references(() => biCostAllocations.id),
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
export const predictiveModels = pgTable('predictive_models', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
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
export const modelTrainingHistory = pgTable('model_training_history', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  modelId: varchar('model_id').notNull().references(() => predictiveModels.id),
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
export const predictiveScenarios = pgTable('predictive_scenarios', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  companyId: varchar('company_id').notNull(), // References company ID
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: predictiveScenarioTypeEnum('type').notNull(),
  modelId: varchar('model_id').notNull().references(() => predictiveModels.id),
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
export const scenarioResults = pgTable('scenario_results', {
  id: varchar('id').primaryKey().notNull().$defaultFn(() => createId()),
  scenarioId: varchar('scenario_id').notNull().references(() => predictiveScenarios.id),
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
export type Dashboard = typeof analyticsDashboards.$inferSelect;
export type InsertDashboard = typeof analyticsDashboards.$inferInsert;
export type Report = typeof analyticsReports.$inferSelect;
export type InsertReport = typeof analyticsReports.$inferInsert;
export type Metric = typeof analyticsMetrics.$inferSelect;
export type InsertMetric = typeof analyticsMetrics.$inferInsert;
export type Alert = typeof analyticsAlerts.$inferSelect;
export type InsertAlert = typeof analyticsAlerts.$inferInsert;
export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;
export type CostCenter = typeof biCostCenters.$inferSelect;
export type InsertCostCenter = typeof biCostCenters.$inferInsert;
export type BusinessUnit = typeof biBusinessUnits.$inferSelect;
export type InsertBusinessUnit = typeof biBusinessUnits.$inferInsert;
export type CostAllocation = typeof biCostAllocations.$inferSelect;
export type InsertCostAllocation = typeof biCostAllocations.$inferInsert;
export type CostAllocationHistory = typeof costAllocationHistory.$inferSelect;
export type InsertCostAllocationHistory = typeof costAllocationHistory.$inferInsert;

// Additional types
export type ReportType = typeof reportTypeEnum.enumValues[number];
export type AlertSeverity = typeof alertSeverityEnum.enumValues[number];
export type AlertStatus = typeof alertStatusEnum.enumValues[number];
export type VisualizationType = 'bar' | 'line' | 'pie' | 'area' | 'table';