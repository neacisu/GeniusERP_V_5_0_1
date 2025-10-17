/**
 * BPM Schema - Drizzle ORM schema definitions for BPM entities
 */
import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Process Status Enum
 */
export enum BpmProcessStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Process Instance Status Enum
 */
export enum BpmProcessInstanceStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
  PAUSED = 'PAUSED',
}

/**
 * Trigger Type Enum
 */
export enum BpmTriggerType {
  WEBHOOK = 'WEBHOOK',
  SCHEDULED = 'SCHEDULED',
  EVENT = 'EVENT',
  MANUAL = 'MANUAL',
  DATA_CHANGE = 'DATA_CHANGE',
  EXTERNAL_API = 'EXTERNAL_API',
}

/**
 * Step Template Type Enum
 */
export enum BpmStepTemplateType {
  ACTION = 'ACTION',
  DECISION = 'DECISION',
  DELAY = 'DELAY',
  NOTIFICATION = 'NOTIFICATION',
  APPROVAL = 'APPROVAL',
  SUBPROCESS = 'SUBPROCESS',
  API_CALL = 'API_CALL',
  DOCUMENT_GENERATION = 'DOCUMENT_GENERATION',
}

/**
 * Step Template Target Type Enum
 */
export enum BpmStepTemplateTargetType {
  INVOICING = 'INVOICING',
  INVENTORY = 'INVENTORY',
  CRM = 'CRM',
  LOGISTICS = 'LOGISTICS',
  ACCOUNTING = 'ACCOUNTING',
  DOCUMENTS = 'DOCUMENTS',
  COMMUNICATIONS = 'COMMUNICATIONS',
  MARKETING = 'MARKETING',
  EXTERNAL_API = 'EXTERNAL_API',
}

/**
 * Step Execution Status Enum
 */
export enum BpmStepExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  WAITING_MANUAL = 'WAITING_MANUAL',
}

/**
 * API Connection Type Enum
 */
export enum BpmApiConnectionType {
  REST = 'REST',
  GRAPHQL = 'GRAPHQL',
  SOAP = 'SOAP',
  WEBHOOK = 'WEBHOOK',
  DATABASE = 'DATABASE',
}

/**
 * Process Definition Table
 * 
 * Stores process definitions, steps, and configurations
 */
export const bpmProcesses = pgTable('bpm_processes', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  companyId: text('company_id').notNull(),
  steps: jsonb('steps').notNull().default({}),
  status: text('status').notNull().default('DRAFT'),
  isTemplate: boolean('is_template').notNull().default(false),
  version: text('version').notNull().default('1.0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull(),
  franchiseId: text('franchise_id'),
});

/**
 * Process Triggers Table
 * 
 * Stores triggers that can start processes
 */
export const bpmTriggers = pgTable('bpm_triggers', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  companyId: text('company_id').notNull(),
  type: text('type').notNull(),
  processId: text('process_id').notNull(),
  configuration: jsonb('configuration').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull(),
});

/**
 * Process Instances Table
 * 
 * Stores running/completed process executions
 */
export const bpmProcessInstances = pgTable('bpm_process_instances', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  processId: text('process_id').notNull(),
  companyId: text('company_id').notNull(),
  status: text('status').notNull(),
  currentStep: text('current_step'),
  startedBy: text('started_by').notNull(),
  inputData: jsonb('input_data').notNull().default({}),
  outputData: jsonb('output_data').notNull().default({}),
  variables: jsonb('variables').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

/**
 * Process Instance History Table
 * 
 * Stores historical records of process execution
 */
export const bpmProcessInstanceHistory = pgTable('bpm_process_instance_history', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  instanceId: text('instance_id').notNull(),
  action: text('action').notNull(),
  status: text('status').notNull(),
  details: jsonb('details').notNull().default({}),
  userId: text('user_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Step Template Table
 * 
 * Stores reusable step templates that can be added to processes
 */
export const bpmStepTemplates = pgTable('bpm_step_templates', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  companyId: text('company_id').notNull(),
  type: text('type').notNull(),
  configuration: jsonb('configuration').notNull().default({}),
  targetType: text('target_type'),
  isGlobal: boolean('is_global').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull(),
});

/**
 * Step Execution Table
 * 
 * Stores execution records of process steps
 */
export const bpmStepExecutions = pgTable('bpm_step_executions', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  instanceId: text('instance_id').notNull(),
  stepId: text('step_id').notNull(),
  companyId: text('company_id').notNull(),
  status: text('status').notNull(),
  inputData: jsonb('input_data').notNull().default({}),
  outputData: jsonb('output_data').notNull().default({}),
  errorData: jsonb('error_data').default({}),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  assignedTo: text('assigned_to'),
  executedBy: text('executed_by'),
});

/**
 * API Connection Table
 * 
 * Stores API connections that can be used in process steps
 */
export const bpmApiConnections = pgTable('bpm_api_connections', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  companyId: text('company_id').notNull(),
  type: text('type').notNull(),
  configuration: jsonb('configuration').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull(),
  lastUsedAt: timestamp('last_used_at'),
});

/**
 * Scheduled Job Table
 * 
 * Stores scheduled jobs for process automation
 */
export const bpmScheduledJobs = pgTable('bpm_scheduled_jobs', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  companyId: text('company_id').notNull(),
  schedule: text('schedule').notNull(),
  action: text('action').notNull(),
  configuration: jsonb('configuration').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by').notNull(),
  updatedBy: text('updated_by').notNull(),
  lastRunAt: timestamp('last_run_at'),
});

/**
 * Zod Schemas for validation
 */
export const insertProcessSchema = createInsertSchema(bpmProcesses);
export const insertTriggerSchema = createInsertSchema(bpmTriggers);
export const insertProcessInstanceSchema = createInsertSchema(bpmProcessInstances);
export const insertProcessInstanceHistorySchema = createInsertSchema(bpmProcessInstanceHistory);
export const insertStepTemplateSchema = createInsertSchema(bpmStepTemplates);
export const insertStepExecutionSchema = createInsertSchema(bpmStepExecutions);
export const insertApiConnectionSchema = createInsertSchema(bpmApiConnections);
export const insertScheduledJobSchema = createInsertSchema(bpmScheduledJobs);

export const selectProcessSchema = createSelectSchema(bpmProcesses);
export const selectTriggerSchema = createSelectSchema(bpmTriggers);
export const selectProcessInstanceSchema = createSelectSchema(bpmProcessInstances);
export const selectProcessInstanceHistorySchema = createSelectSchema(bpmProcessInstanceHistory);
export const selectStepTemplateSchema = createSelectSchema(bpmStepTemplates);
export const selectStepExecutionSchema = createSelectSchema(bpmStepExecutions);
export const selectApiConnectionSchema = createSelectSchema(bpmApiConnections);
export const selectScheduledJobSchema = createSelectSchema(bpmScheduledJobs);

/**
 * Zod schemas with additional validation
 */
export const createProcessSchema = insertProcessSchema
  .extend({ // Fixed: removed omit() for drizzle-zod compatibility
    name: z.string().min(3).max(100),
    status: z.nativeEnum(BpmProcessStatus),
  });

export const updateProcessSchema = createProcessSchema
  .partial()
  .extend({
    updatedBy: z.string(),
  });

export const createTriggerSchema = insertTriggerSchema
  .extend({ // Fixed: removed omit() for drizzle-zod compatibility
    name: z.string().min(3).max(100),
    type: z.nativeEnum(BpmTriggerType),
  });

export const updateTriggerSchema = createTriggerSchema
  .partial()
  .extend({
    updatedBy: z.string(),
  });

export const startProcessSchema = z.object({
  processId: z.string().uuid(),
  companyId: z.string(),
  startedBy: z.string(),
  inputData: z.record(z.string(), z.any()).optional(),
});

/**
 * Type definitions
 */
export type BpmProcess = typeof bpmProcesses.$inferSelect;
export type BpmProcessInsert = z.infer<typeof insertProcessSchema>;
export type BpmProcessCreate = z.infer<typeof createProcessSchema>;
export type BpmProcessUpdate = z.infer<typeof updateProcessSchema>;

export type Trigger = typeof bpmTriggers.$inferSelect;
export type TriggerInsert = z.infer<typeof insertTriggerSchema>;
export type TriggerCreate = z.infer<typeof createTriggerSchema>;
export type TriggerUpdate = z.infer<typeof updateTriggerSchema>;

export type ProcessInstance = typeof bpmProcessInstances.$inferSelect;
export type ProcessInstanceInsert = z.infer<typeof insertProcessInstanceSchema>;

export type ProcessInstanceHistory = typeof bpmProcessInstanceHistory.$inferSelect;
export type ProcessInstanceHistoryInsert = z.infer<typeof insertProcessInstanceHistorySchema>;

export type StartProcess = z.infer<typeof startProcessSchema>;

// Step Template types
export const createStepTemplateSchema = insertStepTemplateSchema
  .extend({ // Fixed: removed omit() for drizzle-zod compatibility
    name: z.string().min(3).max(100),
    type: z.nativeEnum(BpmStepTemplateType),
    targetType: z.nativeEnum(BpmStepTemplateTargetType).optional(),
  });

export const updateStepTemplateSchema = createStepTemplateSchema
  .partial()
  .extend({
    updatedBy: z.string(),
  });

export type StepTemplate = typeof bpmStepTemplates.$inferSelect;
export type StepTemplateInsert = z.infer<typeof insertStepTemplateSchema>;
export type StepTemplateCreate = z.infer<typeof createStepTemplateSchema>;
export type StepTemplateUpdate = z.infer<typeof updateStepTemplateSchema>;

// Step Execution types
export const createStepExecutionSchema = insertStepExecutionSchema
  .extend({ // Fixed: removed omit() for drizzle-zod compatibility
    status: z.nativeEnum(BpmStepExecutionStatus),
  });

export const updateStepExecutionSchema = createStepExecutionSchema
  .partial()
  .extend({
    status: z.nativeEnum(BpmStepExecutionStatus).optional(),
  });

export type StepExecution = typeof bpmStepExecutions.$inferSelect;
export type StepExecutionInsert = z.infer<typeof insertStepExecutionSchema>;
export type StepExecutionCreate = z.infer<typeof createStepExecutionSchema>;
export type StepExecutionUpdate = z.infer<typeof updateStepExecutionSchema>;

// API Connection types
export const createApiConnectionSchema = insertApiConnectionSchema
  .extend({ // Fixed: removed omit() for drizzle-zod compatibility
    name: z.string().min(3).max(100),
    type: z.nativeEnum(BpmApiConnectionType),
  });

export const updateApiConnectionSchema = createApiConnectionSchema
  .partial()
  .extend({
    updatedBy: z.string(),
  });

export type ApiConnection = typeof bpmApiConnections.$inferSelect;
export type ApiConnectionInsert = z.infer<typeof insertApiConnectionSchema>;
export type ApiConnectionCreate = z.infer<typeof createApiConnectionSchema>;
export type ApiConnectionUpdate = z.infer<typeof updateApiConnectionSchema>;

// Scheduled Job types
export const createScheduledJobSchema = insertScheduledJobSchema
  .extend({ // Fixed: removed omit() for drizzle-zod compatibility
    name: z.string().min(3).max(100),
    schedule: z.string().min(5),
  });

export const updateScheduledJobSchema = createScheduledJobSchema
  .partial()
  .extend({
    updatedBy: z.string(),
  });

export type ScheduledJob = typeof bpmScheduledJobs.$inferSelect;
export type ScheduledJobInsert = z.infer<typeof insertScheduledJobSchema>;
export type ScheduledJobCreate = z.infer<typeof createScheduledJobSchema>;
export type ScheduledJobUpdate = z.infer<typeof updateScheduledJobSchema>;