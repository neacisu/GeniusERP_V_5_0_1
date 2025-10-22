/**
 * Invoice Schema
 * 
 * Database schema for invoices and related tables.
 * 
 * Note: Main invoice table schema is defined in shared/schema.ts
 * This file only contains invoice_items (unified table)
 */

import { pgTable, uuid, text, timestamp, numeric, integer } from 'drizzle-orm/pg-core';
import { invoices, type Invoice } from '@geniuserp/shared';

/**
 * Invoice items table (unified from invoice_lines)
 */
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: uuid('product_id'),
  productName: text('product_name').notNull(),
  productCode: text('product_code'),
  quantity: numeric('quantity').notNull(),
  unitPrice: numeric('unit_price').notNull(),
  netAmount: numeric('net_amount').notNull(),
  vatAmount: numeric('vat_amount').notNull(),
  vatRate: numeric('vat_rate').notNull(),
  grossAmount: numeric('gross_amount').notNull(),
  discount: numeric('discount').default('0'),
  sequence: integer('sequence').notNull().default(1),
  notes: text('notes'),
  
  // Additional fields (merged from invoice_lines)
  description: text('description'),
  vatCategory: text('vat_category').default('STANDARD_19'), // vat_category enum
  vatCode: text('vat_code'),
  originalItemId: uuid('original_item_id'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Note: Relations for invoices and invoiceItems are defined in shared/schema.ts
// to avoid circular dependency issues

// Re-export Invoice types from shared schema for consistency
export type { Invoice, InsertInvoice } from '@geniuserp/shared';

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

/**
 * Extended Invoice type with relations
 * Extends base Invoice type with additional relation properties
 */
export interface InvoiceWithRelations extends Invoice {
  details?: unknown;
  lines?: InvoiceItem[];
  items?: InvoiceItem[];
  [key: string]: unknown; // Allow dynamic properties from DB queries
}

export default {
  invoiceItems
};
