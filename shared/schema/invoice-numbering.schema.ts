/**
 * Invoice Numbering Schema
 * 
 * Defines the database schema for storing invoice numbering settings and sequences
 * according to Romanian ANAF requirements and e-factura regulations.
 */

import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { 
  pgTable, 
  text, 
  uuid, 
  varchar, 
  integer, 
  timestamp, 
  boolean, 
  unique 
} from 'drizzle-orm/pg-core';

/**
 * Invoice numbering settings table
 * 
 * This table stores the configuration for invoice number generation.
 * According to Romanian regulations, each company can have multiple invoice series
 * with a specific number sequence for each series.
 */
export const invoiceNumberingSettings = pgTable('invoice_numbering_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // The company that owns this numbering configuration
  companyId: uuid('company_id').notNull(),
  
  // Series code (e.g., 'FDI', 'AVANS', etc.)
  series: varchar('series', { length: 10 }).notNull(),
  
  // The current number in the sequence (will be incremented with each new invoice)
  currentNumber: integer('current_number').notNull().default(1),
  
  // The last used number (used for tracking and auditing)
  lastNumber: integer('last_number'),
  
  // The next number to be used (calculated from currentNumber)
  nextNumber: integer('next_number').notNull().default(1),
  
  // Prefix to be added before the number (optional)
  prefix: varchar('prefix', { length: 10 }),
  
  // Suffix to be added after the number (optional, like year)
  suffix: varchar('suffix', { length: 10 }),
  
  // Year component (optional, for annual series reset)
  year: integer('year'),
  
  // The padding width for the number part (e.g., 5 means '00001')
  paddingWidth: integer('padding_width').notNull().default(5),
  
  // Whether this series is active and available for use
  isActive: boolean('is_active').notNull().default(true),
  
  // Whether this is the default series for the company/warehouse/franchise
  isDefault: boolean('is_default').default(false),
  
  // Specific warehouse ID (optional) - if set, this series can only be used for this warehouse
  warehouseId: uuid('warehouse_id'),
  
  // Specific franchise ID (optional) - if set, this series can only be used for this franchise
  franchiseId: uuid('franchise_id'),
  
  // Description of the numbering sequence
  description: text('description'),
  
  // Creation timestamp
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  
  // Last update timestamp
  updatedAt: timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  
  // Unique constraint to ensure series + warehouse + franchise combination is unique per company
}, (table) => {
  return {
    seriesWarehouseFranchiseUnique: unique().on(table.companyId, table.series, table.warehouseId, table.franchiseId),
  };
});

/**
 * Insert schema for invoice numbering settings
 */
export const insertInvoiceNumberingSettingsSchema = createInsertSchema(invoiceNumberingSettings)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    series: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 
      'Seria trebuie să conțină doar litere mari și cifre'),
    currentNumber: z.number().int().min(1).optional(),
    nextNumber: z.number().int().min(1).optional(),
    lastNumber: z.number().int().min(0).optional(),
    paddingWidth: z.number().int().min(1).max(10).optional(),
    prefix: z.string().max(10).optional(),
    suffix: z.string().max(10).optional(),
    year: z.number().int().optional(),
    franchiseId: z.string().uuid().optional().nullable(),
    isDefault: z.boolean().optional(),
  });

/**
 * Update schema for invoice numbering settings
 */
export const updateInvoiceNumberingSettingsSchema = createInsertSchema(invoiceNumberingSettings)
  .omit({ id: true, companyId: true, createdAt: true, updatedAt: true })
  .extend({
    series: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 
      'Seria trebuie să conțină doar litere mari și cifre').optional(),
    currentNumber: z.number().int().min(1).optional(),
    nextNumber: z.number().int().min(1).optional(),
    lastNumber: z.number().int().min(0).optional(),
    paddingWidth: z.number().int().min(1).max(10).optional(),
    prefix: z.string().max(10).optional(),
    suffix: z.string().max(10).optional(),
    year: z.number().int().optional(),
    franchiseId: z.string().uuid().optional().nullable(),
    isDefault: z.boolean().optional(),
  });

/**
 * Types
 */
export type InvoiceNumberingSetting = typeof invoiceNumberingSettings.$inferSelect;
export type InsertInvoiceNumberingSetting = z.infer<typeof insertInvoiceNumberingSettingsSchema>;
export type UpdateInvoiceNumberingSetting = z.infer<typeof updateInvoiceNumberingSettingsSchema>;