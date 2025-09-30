/**
 * Collaboration Module Schema - Drizzle ORM Definitions
 * 
 * This file defines the database schema for the Collaboration module tables
 * using Drizzle ORM for internal task management, notes, and collaborative workflows.
 */

import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  pgEnum, 
  index,
  jsonb,
  varchar,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Task Status Enum
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  DEFERRED = 'deferred',
  CANCELLED = 'cancelled',
  REVIEW = 'review'
}

/**
 * Task Priority Enum
 */
export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

/**
 * Task Type Enum
 */
export enum TaskType {
  REGULAR = 'regular',
  PROJECT = 'project',
  MEETING = 'meeting',
  APPROVAL = 'approval',
  REVIEW = 'review',
  DECISION = 'decision'
}

/**
 * Community Category Enum
 */
export enum CommunityCategory {
  ANUNTURI = 'ANUNTURI',
  INTREBARI = 'INTREBARI',
  IDEI = 'IDEI',
  EVENIMENTE = 'EVENIMENTE',
  RESURSE = 'RESURSE',
  TUTORIALE = 'TUTORIALE'
}

// Define the PostgreSQL enums
export const taskStatusEnum = pgEnum('task_status', [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.BLOCKED,
  TaskStatus.DEFERRED,
  TaskStatus.CANCELLED,
  TaskStatus.REVIEW
]);
export const taskPriorityEnum = pgEnum('task_priority', [
  TaskPriority.LOW,
  TaskPriority.NORMAL,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
  TaskPriority.CRITICAL
]);
export const taskTypeEnum = pgEnum('task_type', [
  TaskType.REGULAR,
  TaskType.PROJECT,
  TaskType.MEETING,
  TaskType.APPROVAL,
  TaskType.REVIEW,
  TaskType.DECISION
]);

/**
 * Collaboration Tasks Table
 * 
 * Main table for task assignments and tracking
 */
export const collaborationTasks = pgTable('collaboration_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: taskTypeEnum('type').default(TaskType.REGULAR),
  status: taskStatusEnum('status').default(TaskStatus.PENDING),
  priority: taskPriorityEnum('priority').default(TaskPriority.NORMAL),
  assignedTo: uuid('assigned_to').notNull(),
  supervisorId: uuid('supervisor_id'),
  dueDate: timestamp('due_date'),
  completionDate: timestamp('completion_date'),
  metadata: jsonb('metadata').default({}),
  tags: jsonb('tags').default([]),
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: jsonb('recurring_pattern').default({}),
  parentTaskId: uuid('parent_task_id'),
  relatedItems: jsonb('related_items').default({}), // Can store relations to documents, invoices, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => ({
  companyIdIdx: index('collaboration_tasks_company_id_idx').on(table.companyId),
  assignedToIdx: index('collaboration_tasks_assigned_to_idx').on(table.assignedTo),
  supervisorIdIdx: index('collaboration_tasks_supervisor_id_idx').on(table.supervisorId),
  statusIdx: index('collaboration_tasks_status_idx').on(table.status),
  priorityIdx: index('collaboration_tasks_priority_idx').on(table.priority),
  dueDateIdx: index('collaboration_tasks_due_date_idx').on(table.dueDate),
  typeIdx: index('collaboration_tasks_type_idx').on(table.type),
  parentTaskIdIdx: index('collaboration_tasks_parent_task_id_idx').on(table.parentTaskId)
}));

/**
 * Collaboration Notes Table
 * 
 * Used for adding notes, comments, and updates to tasks
 */
export const collaborationNotes = pgTable('collaboration_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  companyId: uuid('company_id').notNull(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  contentHtml: text('content_html'),
  isPrivate: boolean('is_private').default(false),
  isPinned: boolean('is_pinned').default(false),
  attachments: jsonb('attachments').default([]),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  editedBy: uuid('edited_by')
}, (table) => ({
  taskIdIdx: index('collaboration_notes_task_id_idx').on(table.taskId),
  companyIdIdx: index('collaboration_notes_company_id_idx').on(table.companyId),
  userIdIdx: index('collaboration_notes_user_id_idx').on(table.userId),
  createdAtIdx: index('collaboration_notes_created_at_idx').on(table.createdAt)
}));

/**
 * Collaboration Threads Table
 * 
 * Used for internal discussions separate from tasks
 */
export const collaborationThreads = pgTable('collaboration_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  isPrivate: boolean('is_private').default(false),
  isClosed: boolean('is_closed').default(false),
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags').default([]),
  participants: jsonb('participants').default([]),
  lastMessageAt: timestamp('last_message_at').defaultNow(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by')
}, (table) => ({
  companyIdIdx: index('collaboration_threads_company_id_idx').on(table.companyId),
  createdByIdx: index('collaboration_threads_created_by_idx').on(table.createdBy),
  categoryIdx: index('collaboration_threads_category_idx').on(table.category),
  lastMessageAtIdx: index('collaboration_threads_last_message_at_idx').on(table.lastMessageAt)
}));

/**
 * Collaboration Messages Table
 * 
 * Messages within collaboration threads
 */
export const collaborationMessages = pgTable('collaboration_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull(),
  companyId: uuid('company_id').notNull(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  contentHtml: text('content_html'),
  isEdited: boolean('is_edited').default(false),
  attachments: jsonb('attachments').default([]),
  mentions: jsonb('mentions').default([]),
  replyToId: uuid('reply_to_id'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  editedBy: uuid('edited_by')
}, (table) => ({
  threadIdIdx: index('collaboration_messages_thread_id_idx').on(table.threadId),
  companyIdIdx: index('collaboration_messages_company_id_idx').on(table.companyId),
  userIdIdx: index('collaboration_messages_user_id_idx').on(table.userId),
  createdAtIdx: index('collaboration_messages_created_at_idx').on(table.createdAt),
  replyToIdIdx: index('collaboration_messages_reply_to_id_idx').on(table.replyToId)
}));

/**
 * Task Assignments History Table
 * 
 * Tracks changes in task assignments
 */
export const taskAssignmentHistory = pgTable('collaboration_task_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  companyId: uuid('company_id').notNull(),
  assignedTo: uuid('assigned_to').notNull(),
  assignedBy: uuid('assigned_by').notNull(),
  assignedFrom: uuid('assigned_from'),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  taskIdIdx: index('collaboration_task_assignments_task_id_idx').on(table.taskId),
  assignedToIdx: index('collaboration_task_assignments_assigned_to_idx').on(table.assignedTo),
  assignedByIdx: index('collaboration_task_assignments_assigned_by_idx').on(table.assignedBy),
  createdAtIdx: index('collaboration_task_assignments_created_at_idx').on(table.createdAt)
}));

/**
 * Task Status History Table
 * 
 * Tracks changes in task status
 */
export const taskStatusHistory = pgTable('collaboration_task_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  companyId: uuid('company_id').notNull(),
  status: taskStatusEnum('status').notNull(),
  previousStatus: taskStatusEnum('previous_status'),
  changedBy: uuid('changed_by').notNull(),
  comments: text('comments'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  taskIdIdx: index('collaboration_task_status_history_task_id_idx').on(table.taskId),
  statusIdx: index('collaboration_task_status_history_status_idx').on(table.status),
  changedByIdx: index('collaboration_task_status_history_changed_by_idx').on(table.changedBy),
  createdAtIdx: index('collaboration_task_status_history_created_at_idx').on(table.createdAt)
}));

/**
 * Task Watchers Table
 * 
 * Users who are watching/subscribed to tasks
 */
export const taskWatchers = pgTable('collaboration_task_watchers', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull(),
  companyId: uuid('company_id').notNull(),
  userId: uuid('user_id').notNull(),
  notificationPreference: jsonb('notification_preference').default({}),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  taskIdIdx: index('collaboration_task_watchers_task_id_idx').on(table.taskId),
  userIdIdx: index('collaboration_task_watchers_user_id_idx').on(table.userId),
  taskUserIdx: index('collaboration_task_watchers_task_user_idx').on(table.taskId, table.userId)
}));

// Create Zod schemas for validation and insertion
export const insertCollaborationTaskSchema = createInsertSchema(collaborationTasks, {
  id: z.string().uuid().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  type: z.nativeEnum(TaskType).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  tags: z.array(z.string()).optional(),
  relatedItems: z.record(z.string(), z.any()).optional()
});

export const insertCollaborationNoteSchema = createInsertSchema(collaborationNotes, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  attachments: z.array(z.any()).optional()
});

export const insertCollaborationThreadSchema = createInsertSchema(collaborationThreads, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  tags: z.array(z.string()).optional(),
  participants: z.array(z.string()).optional(),
  category: z.nativeEnum(CommunityCategory).optional()
});

export const insertCollaborationMessageSchema = createInsertSchema(collaborationMessages, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  attachments: z.array(z.any()).optional(),
  mentions: z.array(z.string()).optional()
});

// Type definitions for inference
export type CollaborationTask = typeof collaborationTasks.$inferSelect;
export type NewCollaborationTask = z.infer<typeof insertCollaborationTaskSchema>;

export type CollaborationNote = typeof collaborationNotes.$inferSelect;
export type NewCollaborationNote = z.infer<typeof insertCollaborationNoteSchema>;

export type CollaborationThread = typeof collaborationThreads.$inferSelect;
export type NewCollaborationThread = z.infer<typeof insertCollaborationThreadSchema>;

export type CollaborationMessage = typeof collaborationMessages.$inferSelect;
export type NewCollaborationMessage = z.infer<typeof insertCollaborationMessageSchema>;

export const insertTaskWatcherSchema = createInsertSchema(taskWatchers, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  notificationPreference: z.record(z.string(), z.any()).optional()
});

export type TaskAssignmentHistoryRecord = typeof taskAssignmentHistory.$inferSelect;
export type TaskStatusHistoryRecord = typeof taskStatusHistory.$inferSelect;
export type TaskWatcher = typeof taskWatchers.$inferSelect;
export type NewTaskWatcher = z.infer<typeof insertTaskWatcherSchema>;

/**
 * Collaboration Activity Table
 * 
 * Tracks activity across the collaboration module
 */
export const collaborationActivities = pgTable('collaboration_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  userId: uuid('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  objectType: varchar('object_type', { length: 50 }).notNull(),
  objectId: uuid('object_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  data: jsonb('data').default({}),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  companyIdIdx: index('collaboration_activities_company_id_idx').on(table.companyId),
  userIdIdx: index('collaboration_activities_user_id_idx').on(table.userId),
  typeIdx: index('collaboration_activities_type_idx').on(table.type),
  objectTypeIdx: index('collaboration_activities_object_type_idx').on(table.objectType),
  objectIdIdx: index('collaboration_activities_object_id_idx').on(table.objectId),
  createdAtIdx: index('collaboration_activities_created_at_idx').on(table.createdAt)
}));

/**
 * Collaboration Notifications Table
 * 
 * Stores user notifications from collaboration activities
 */
export const collaborationNotifications = pgTable('collaboration_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  userId: uuid('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 50 }).default('UNREAD').notNull(),
  sourceType: varchar('source_type', { length: 50 }),
  sourceId: uuid('source_id'),
  actionType: varchar('action_type', { length: 50 }),
  actionTarget: varchar('action_target', { length: 255 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  companyIdIdx: index('collaboration_notifications_company_id_idx').on(table.companyId),
  userIdIdx: index('collaboration_notifications_user_id_idx').on(table.userId),
  statusIdx: index('collaboration_notifications_status_idx').on(table.status),
  typeIdx: index('collaboration_notifications_type_idx').on(table.type),
  sourceTypeIdx: index('collaboration_notifications_source_type_idx').on(table.sourceType),
  createdAtIdx: index('collaboration_notifications_created_at_idx').on(table.createdAt)
}));

// Type definitions for activities and notifications
export type Activity = typeof collaborationActivities.$inferSelect;
export type Notification = typeof collaborationNotifications.$inferSelect;

export const insertActivitySchema = createInsertSchema(collaborationActivities, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  data: z.record(z.string(), z.any()).optional()
});

export const insertNotificationSchema = createInsertSchema(collaborationNotifications, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export type NewActivity = z.infer<typeof insertActivitySchema>;
export type NewNotification = z.infer<typeof insertNotificationSchema>;