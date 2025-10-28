/**
 * Audit Schema
 * 
 * Database schema for audit logs.
 */

import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Audit logs table to track user actions in the system
 * This schema must match the existing database table
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().notNull(),
  userId: uuid('user_id').notNull(),
  companyId: uuid('company_id').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: uuid('entity_id'),
  details: jsonb('details').default({}),
  createdAt: timestamp('created_at').notNull()
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Interface for audit log data provided to AuditService.console.log() method
 * This includes optional properties that will be stored in the details field
 */
export interface AuditLogData {
  userId: string;
  companyId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  franchiseId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export default auditLogs;