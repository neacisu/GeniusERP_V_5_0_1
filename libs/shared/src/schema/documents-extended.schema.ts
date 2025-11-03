/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Documents Extended Schema
 * 
 * Document management and foreign exchange rates.
 * 
 * Tables:
 * - documents: Generic document storage with OCR support
 * - document_versions: Document versioning and change tracking
 * - fx_rates: Foreign exchange rates (mainly from BNR - National Bank of Romania)
 * 
 * All structures extracted from PostgreSQL DB.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Forward references (resolved when schemas combined)
declare const companies: any;

// ============================================================================
// DOCUMENT TABLES
// ============================================================================

/**
 * Documents table
 * Generic document storage for various business documents
 * Supports OCR text extraction
 */
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').notNull(),
  franchise_id: uuid('franchise_id'),
  file_path: text('file_path').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  ocr_text: text('ocr_text'),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  company_idx: index('documents_company_idx').on(table.company_id),
  franchise_idx: index('documents_franchise_idx').on(table.franchise_id),
  type_idx: index('documents_type_idx').on(table.type),
  created_at_idx: index('documents_created_at_idx').on(table.created_at),
  company_franchise_idx: index('documents_company_franchise_idx').on(table.company_id, table.franchise_id),
}));

/**
 * Document Versions table
 * Version control for documents
 * Tracks all changes with descriptions and tags
 */
export const document_versions = pgTable('document_versions', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  document_id: uuid('document_id').notNull(),
  content: text('content').notNull(),
  version: integer('version').notNull().default(1),
  tag: varchar('tag', { length: 50 }),
  change_description: text('change_description'),
  created_at: timestamp('created_at').notNull().default(sql`now()`)
}, (table) => ({
  document_idx: index('document_versions_document_idx').on(table.document_id),
  document_version_idx: index('document_versions_document_version_idx').on(table.document_id, table.version),
  created_at_idx: index('document_versions_created_at_idx').on(table.created_at),
}));

// ⚠️ AC_fx_rates has been MOVED to accounting.schema.ts where it logically belongs
// Cursurile valutare sunt folosite de modulul accounting, NU de documents
// Import from '@geniuserp/shared' (re-exported from accounting.schema.ts)

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Documents Relations
 */
export const documentsRelations = relations(documents, ({ one, many }) => ({
  company: one(companies, {
    fields: [documents.company_id],
    references: [companies.id],
  }),
  franchise: one(companies, {
    fields: [documents.franchise_id],
    references: [companies.id],
  }),
  versions: many(document_versions),
}));

/**
 * Document Versions Relations
 */
export const document_versionsRelations = relations(document_versions, ({ one }) => ({
  document: one(documents, {
    fields: [document_versions.document_id],
    references: [documents.id],
  }),
}));

/**
 * FX Rates Relations
 * No explicit relations as this is a reference data table
 */

// Note: Forward references to companies will be resolved when schemas are combined

