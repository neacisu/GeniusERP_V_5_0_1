/**
 * Document Counters Schema
 * 
 * Tabel pentru generare automată de numere secvențiale pentru documente
 * (facturi, chitanțe, dispoziții de plată, etc.)
 */

import { pgTable, uuid, text, numeric, timestamp, unique } from 'drizzle-orm/pg-core';
import { companies } from '../schema';

/**
 * Document Counters Table
 * Contoare pentru numerotare automată documente
 */
export const documentCounters = pgTable('document_counters', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  counterType: text('counter_type').notNull(), // 'INVOICE', 'CASH', 'JOURNAL', etc.
  series: text('series').notNull(), // 'INV', 'CH', 'DP', etc.
  year: numeric('year').notNull(),
  lastNumber: numeric('last_number').notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one counter per company/type/series/year combination
  uniqueCounter: unique('document_counters_company_id_counter_type_series_year_unique')
    .on(table.companyId, table.counterType, table.series, table.year),
}));

/**
 * Types
 */
export type DocumentCounter = typeof documentCounters.$inferSelect;
export type InsertDocumentCounter = typeof documentCounters.$inferInsert;
