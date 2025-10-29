/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Business Process Automation (BPM) Schema
 * 
 * This schema defines the database structure for the Business Process Automation module.
 * It enables the creation and management of workflows for automating business processes
 * such as invoicing, notifications, logistics, and CRM follow-ups.
 */

import { pgTable, uuid, text, jsonb, timestamp, index, boolean, varchar, foreignKey } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * BPM Process Status Enum
 */
export enum BpmProcessStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived'
}

/**
 * Trigger Type Enum
 */
export enum TriggerType {
  SCHEDULED = 'scheduled',
  EVENT_BASED = 'event_based',
  DATA_CHANGE = 'data_change',
  MANUAL = 'manual',
  API_WEBHOOK = 'api_webhook'
}

/**
 * Process Step Type Enum
 */
export enum ProcessStepType {
  ACTION = 'action',
  DECISION = 'decision',
  DELAY = 'delay',
  NOTIFICATION = 'notification',
  APPROVAL = 'approval',
  SUBPROCESS = 'subprocess',
  API_CALL = 'api_call',
  DOCUMENT_GENERATION = 'document_generation'
}

/**
 * Action Target Type Enum
 */
export enum ActionTargetType {
  INVOICING = 'invoicing',
  INVENTORY = 'inventory',
  CRM = 'crm',
  LOGISTICS = 'logistics',
  ACCOUNTING = 'accounting',
  DOCUMENTS = 'documents',
  COMMUNICATIONS = 'communications',
  MARKETING = 'marketing',
  EXTERNAL_API = 'external_api'
}

/**
 * Main BPM Process Table
 * 
 * Defines the core structure of a business process workflow
 */
export const bpm_processes = pgTable('bpm_processes', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  name: text('name').notNull(),
  description: text('description'),
  steps: jsonb('steps').notNull(), // contains dynamic step-based workflow
  status: text('status', { enum: [BpmProcessStatus.DRAFT, BpmProcessStatus.ACTIVE, BpmProcessStatus.PAUSED, BpmProcessStatus.ARCHIVED] })
    .default(BpmProcessStatus.DRAFT),
  isTemplate: boolean('is_template').default(false),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => ({
  companyIdx: index('bpm_company_idx').on(table.companyId),
  franchiseIdx: index('bpm_franchise_idx').on(table.franchiseId),
  statusIdx: index('bpm_status_idx').on(table.status),
  templateIdx: index('bpm_template_idx').on(table.isTemplate),
  createdAtIdx: index('bpm_created_at_idx').on(table.createdAt),
  combinedIdx: index('bpm_combined_idx').on(table.companyId, table.franchiseId, table.status, table.createdAt),
}));

/**
 * Process Triggers
 * 
 * Defines the conditions that trigger a workflow to start
 */
export const bpm_triggers = pgTable('bpm_triggers', {
  id: uuid('id').primaryKey().defaultRandom(),
  processId: uuid('process_id').notNull().references(() => bpm_processes.id),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: [TriggerType.SCHEDULED, TriggerType.EVENT_BASED, TriggerType.DATA_CHANGE, TriggerType.MANUAL, TriggerType.API_WEBHOOK] }).notNull(),
  condition: jsonb('condition').notNull(), // JSON structure defining trigger conditions
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => ({
  processIdx: index('bpm_trigger_process_idx').on(table.processId),
  typeIdx: index('bpm_trigger_type_idx').on(table.type),
  activeIdx: index('bpm_trigger_active_idx').on(table.isActive),
}));

/**
 * Process Instances
 * 
 * Represents the actual running instances of a process
 */
export const bpm_process_instances = pgTable('bpm_process_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  processId: uuid('process_id').notNull().references(() => bpm_processes.id),
  triggerId: uuid('trigger_id').references(() => bpm_triggers.id),
  companyId: uuid('company_id').notNull(),
  contextData: jsonb('context_data'), // Variable data for this instance
  currentStep: varchar('current_step', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('running'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  createdBy: uuid('created_by'),
  lastUpdatedBy: uuid('last_updated_by')
}, (table) => ({
  processIdx: index('bpm_instance_process_idx').on(table.processId),
  triggerIdx: index('bpm_instance_trigger_idx').on(table.triggerId),
  companyIdx: index('bpm_instance_company_idx').on(table.companyId),
  statusIdx: index('bpm_instance_status_idx').on(table.status),
  startedAtIdx: index('bpm_instance_started_at_idx').on(table.startedAt),
}));

/**
 * Process Step Templates
 * 
 * Reusable step templates that can be included in processes
 */
export const bpm_step_templates = pgTable('bpm_step_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: [ProcessStepType.ACTION, ProcessStepType.DECISION, ProcessStepType.DELAY, ProcessStepType.NOTIFICATION, ProcessStepType.APPROVAL, ProcessStepType.SUBPROCESS, ProcessStepType.API_CALL, ProcessStepType.DOCUMENT_GENERATION] }).notNull(),
  configuration: jsonb('configuration').notNull(),
  targetType: text('target_type', { enum: [ActionTargetType.INVOICING, ActionTargetType.INVENTORY, ActionTargetType.CRM, ActionTargetType.LOGISTICS, ActionTargetType.ACCOUNTING, ActionTargetType.DOCUMENTS, ActionTargetType.COMMUNICATIONS, ActionTargetType.MARKETING, ActionTargetType.EXTERNAL_API] }),
  isGlobal: boolean('is_global').default(false), // If true, available to all companies
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => ({
  companyIdx: index('bpm_template_company_idx').on(table.companyId),
  typeIdx: index('bpm_template_type_idx').on(table.type),
  targetTypeIdx: index('bpm_template_target_type_idx').on(table.targetType),
  globalIdx: index('bpm_template_global_idx').on(table.isGlobal),
}));

/**
 * Process Step Executions
 * 
 * Records of individual step executions within a process instance
 */
export const bpm_step_executions = pgTable('bpm_step_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  instanceId: uuid('instance_id').notNull().references(() => bpm_process_instances.id),
  stepId: varchar('step_id', { length: 100 }).notNull(), // ID of the step within the process definition
  stepType: text('step_type', { enum: [ProcessStepType.ACTION, ProcessStepType.DECISION, ProcessStepType.DELAY, ProcessStepType.NOTIFICATION, ProcessStepType.APPROVAL, ProcessStepType.SUBPROCESS, ProcessStepType.API_CALL, ProcessStepType.DOCUMENT_GENERATION] }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  inputData: jsonb('input_data'),
  outputData: jsonb('output_data'),
  errorData: jsonb('error_data'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  executedBy: uuid('executed_by')
}, (table) => ({
  instanceIdx: index('bpm_exec_instance_idx').on(table.instanceId),
  stepIdIdx: index('bpm_exec_step_id_idx').on(table.stepId),
  statusIdx: index('bpm_exec_status_idx').on(table.status),
  startedAtIdx: index('bpm_exec_started_at_idx').on(table.startedAt),
}));

/**
 * Process Approvals
 * 
 * Tracks approval steps in workflows that require human intervention
 */
export const bpm_approvals = pgTable('bpm_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  executionId: uuid('execution_id').notNull().references(() => bpm_step_executions.id),
  userId: uuid('user_id').notNull(), // User who needs to approve
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  comments: text('comments'),
  approvalData: jsonb('approval_data'),
  requestedAt: timestamp('requested_at').defaultNow(),
  respondedAt: timestamp('responded_at'),
  remindersSent: jsonb('reminders_sent').default(['[]'])
}, (table) => ({
  executionIdx: index('bpm_approval_execution_idx').on(table.executionId),
  userIdx: index('bpm_approval_user_idx').on(table.userId),
  statusIdx: index('bpm_approval_status_idx').on(table.status),
}));

/**
 * API Connections
 * 
 * Configured connections to external APIs for use in workflows
 */
export const bpm_api_connections = pgTable('bpm_api_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  name: text('name').notNull(),
  provider: varchar('provider', { length: 100 }).notNull(), // e.g., "sameday", "custom"
  connectionType: varchar('connection_type', { length: 50 }).notNull(), // e.g., "rest", "soap", "graphql"
  baseUrl: text('base_url').notNull(),
  authType: varchar('auth_type', { length: 50 }).notNull(), // e.g., "api_key", "oauth2", "basic"
  authData: jsonb('auth_data'), // Encrypted auth data (keys, tokens, etc.)
  headers: jsonb('headers').default(['[]']),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
  lastTestedAt: timestamp('last_tested_at')
}, (table) => ({
  companyIdx: index('bpm_api_company_idx').on(table.companyId),
  providerIdx: index('bpm_api_provider_idx').on(table.provider),
  activeIdx: index('bpm_api_active_idx').on(table.isActive),
}));

/**
 * Scheduled Jobs
 * 
 * Scheduled processes based on cron expressions
 */
export const bpm_scheduled_jobs = pgTable('bpm_scheduled_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  processId: uuid('process_id').notNull().references(() => bpm_processes.id),
  name: text('name').notNull(),
  description: text('description'),
  cronExpression: varchar('cron_expression', { length: 100 }).notNull(),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  inputData: jsonb('input_data'),
  isActive: boolean('is_active').default(true),
  lastRunAt: timestamp('last_run_at'),
  nextRunAt: timestamp('next_run_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => ({
  companyIdx: index('bpm_sched_company_idx').on(table.companyId),
  processIdx: index('bpm_sched_process_idx').on(table.processId),
  activeIdx: index('bpm_sched_active_idx').on(table.isActive),
  nextRunIdx: index('bpm_sched_next_run_idx').on(table.nextRunAt),
}));

// Create Zod schemas for validation
export const insertBpmProcessSchema = createInsertSchema(bpm_processes);
export const insertBpmTriggerSchema = createInsertSchema(bpm_triggers);
export const insertBpmProcessInstanceSchema = createInsertSchema(bpm_process_instances);
export const insertBpmStepTemplateSchema = createInsertSchema(bpm_step_templates);
export const insertBpmStepExecutionSchema = createInsertSchema(bpm_step_executions);
export const insertBpmApprovalSchema = createInsertSchema(bpm_approvals);
export const insertBpmApiConnectionSchema = createInsertSchema(bpm_api_connections);
export const insertBpmScheduledJobSchema = createInsertSchema(bpm_scheduled_jobs);

// Export types
export type BpmProcess = typeof bpm_processes.$inferSelect;
export type NewBpmProcess = typeof bpm_processes.$inferInsert;

export type BpmTrigger = typeof bpm_triggers.$inferSelect;
export type NewBpmTrigger = typeof bpm_triggers.$inferInsert;

export type BpmProcessInstance = typeof bpm_process_instances.$inferSelect;
export type NewBpmProcessInstance = typeof bpm_process_instances.$inferInsert;

export type BpmStepTemplate = typeof bpm_step_templates.$inferSelect;
export type NewBpmStepTemplate = typeof bpm_step_templates.$inferInsert;

export type BpmStepExecution = typeof bpm_step_executions.$inferSelect;
export type NewBpmStepExecution = typeof bpm_step_executions.$inferInsert;

export type BpmApproval = typeof bpm_approvals.$inferSelect;
export type NewBpmApproval = typeof bpm_approvals.$inferInsert;

export type BpmApiConnection = typeof bpm_api_connections.$inferSelect;
export type NewBpmApiConnection = typeof bpm_api_connections.$inferInsert;

export type BpmScheduledJob = typeof bpm_scheduled_jobs.$inferSelect;
export type NewBpmScheduledJob = typeof bpm_scheduled_jobs.$inferInsert;