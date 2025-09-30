/**
 * Collaboration Module Type Definitions
 * 
 * This file contains all type definitions used throughout the collaboration module,
 * including enums, interfaces, and type aliases for tasks, threads, notes and more.
 * These are aligned with the server-side database schema in shared/schema/collaboration.schema.ts
 */

/**
 * Interface for Community Thread objects, extends the Thread interface with community-specific fields
 */
export interface CommunityThread extends Thread {
  replyCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Task Status Enum - Represents the current status of a task
 */
export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  REVIEW = "review",
  BLOCKED = "blocked",
  DEFERRED = "deferred",
  CANCELLED = "cancelled"
}

/**
 * Task Priority Enum - Represents the priority level of a task
 */
export enum TaskPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
  CRITICAL = "critical"
}

/**
 * Task Type Enum - Represents the type of task
 */
export enum TaskType {
  REGULAR = "regular",
  PROJECT = "project",
  MEETING = "meeting",
  APPROVAL = "approval",
  REVIEW = "review",
  DECISION = "decision"
}

/**
 * Community Category Enum - Represents different sections of the community area
 */
export enum CommunityCategory {
  ANUNTURI = "ANUNTURI",
  INTREBARI = "INTREBARI",
  IDEI = "IDEI",
  EVENIMENTE = "EVENIMENTE",
  RESURSE = "RESURSE",
  TUTORIALE = "TUTORIALE"
}

/**
 * Message Type Enum - Represents the type of message in the communication system
 */
export enum MessageType {
  DIRECT = "DIRECT",
  THREAD = "THREAD",
  SYSTEM = "SYSTEM",
  NOTIFICATION = "NOTIFICATION"
}

/**
 * Notification Type Enum - Types of notifications in the collaboration system
 */
export enum NotificationType {
  TASK_ASSIGNED = "TASK_ASSIGNED",
  TASK_UPDATED = "TASK_UPDATED",
  TASK_COMPLETED = "TASK_COMPLETED",
  THREAD_CREATED = "THREAD_CREATED",
  THREAD_UPDATED = "THREAD_UPDATED",
  MENTION = "MENTION",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  SYSTEM = "SYSTEM"
}

/**
 * Activity Type Enum - Types of activities tracked in the collaboration system
 */
export enum ActivityType {
  TASK_CREATED = "TASK_CREATED",
  TASK_UPDATED = "TASK_UPDATED",
  TASK_ASSIGNED = "TASK_ASSIGNED",
  TASK_COMPLETED = "TASK_COMPLETED",
  THREAD_CREATED = "THREAD_CREATED",
  THREAD_UPDATED = "THREAD_UPDATED",
  NOTE_CREATED = "NOTE_CREATED",
  NOTE_UPDATED = "NOTE_UPDATED",
  MESSAGE_SENT = "MESSAGE_SENT",
  RESOURCE_ADDED = "RESOURCE_ADDED",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT"
}

/**
 * Task interface - matches the database schema for tasks
 */
export interface Task {
  id: string;
  companyId: string;
  franchiseId?: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  supervisorId?: string;
  dueDate?: Date | string;
  completionDate?: Date | string;
  metadata?: Record<string, any>;
  tags?: string[];
  isRecurring: boolean;
  recurringPattern?: Record<string, any>;
  parentTaskId?: string;
  relatedItems?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
  
  // UI convenience properties
  assignedToName?: string;
  supervisorName?: string;
  createdByName?: string;
}

/**
 * Note interface - matches the database schema for notes
 */
export interface Note {
  id: string;
  taskId: string;
  companyId: string;
  userId: string;
  content: string;
  contentHtml?: string;
  isPrivate: boolean;
  isPinned: boolean;
  attachments?: any[];
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  editedBy?: string;
  
  // UI convenience properties
  userName?: string;
  editedByName?: string;
  taskTitle?: string;
  tags?: string[];
}

/**
 * Thread interface - matches the database schema for threads
 */
export interface Thread {
  id: string;
  companyId: string;
  franchiseId?: string;
  title: string;
  description?: string;
  isPrivate: boolean;
  isClosed: boolean;
  category?: string;
  tags?: string[];
  participants?: string[];
  lastMessageAt: Date | string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  updatedBy?: string;
  
  // UI convenience properties 
  createdByName?: string;
  messageCount?: number;
  isPinned?: boolean;
}

/**
 * Message interface - matches the database schema for messages
 */
export interface Message {
  id: string;
  threadId: string;
  companyId: string;
  userId: string;
  content: string;
  contentHtml?: string;
  isEdited: boolean;
  attachments?: any[];
  mentions?: string[];
  replyToId?: string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
  editedBy?: string;
  
  // UI convenience properties
  subject?: string; // For display purposes (derived from thread title)
  sender?: string; // User name of the userId
  recipients?: string[]; // Derived from mentions or participants
  type?: MessageType; // Derived from metadata or context
  isRead?: boolean; // UI state
  isStarred?: boolean; // UI state
  attachmentCount?: number; // Count of attachments
  parentId?: string; // For threaded messages (same as replyToId)
}

/**
 * Task Watcher interface
 */
export interface TaskWatcher {
  id: string;
  taskId: string;
  companyId: string;
  userId: string;
  notificationPreference?: Record<string, any>;
  createdAt: Date | string;
  
  // UI convenience properties
  userName?: string;
  taskTitle?: string;
}