/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * HR Documents Schema
 * 
 * This schema defines the tables for HR document management:
 * - hr_documents: Stores metadata for all HR-related documents
 * - hr_employee_drafts: Stores draft employee data before finalization
 */

import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// HR Documents Table
export const hr_documents = pgTable('hr_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  employeeId: uuid('employee_id'),
  documentType: text('document_type').notNull(),
  documentUrl: text('document_url').notNull(),
  originalName: text('original_name').notNull(),
  uploadedBy: uuid('uploaded_by').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  status: text('status').default('active').notNull(),
  metadata: jsonb('metadata')
});

// HR Employee Drafts Table
export const hr_employee_drafts = pgTable('hr_employee_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  userData: jsonb('user_data').notNull(),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  status: text('status').default('draft').notNull()
});

// Zod schemas for validation
export const insertHrDocumentSchema = createInsertSchema(hr_documents);
export const selectHrDocumentSchema = createSelectSchema(hr_documents);

export const insertHrEmployeeDraftSchema = createInsertSchema(hr_employee_drafts);
export const selectHrEmployeeDraftSchema = createSelectSchema(hr_employee_drafts);

// Export types
export type HrDocument = typeof hr_documents.$inferSelect;
export type InsertHrDocument = typeof hr_documents.$inferInsert;

export type HrEmployeeDraft = typeof hr_employee_drafts.$inferSelect;
export type InsertHrEmployeeDraft = typeof hr_employee_drafts.$inferInsert;