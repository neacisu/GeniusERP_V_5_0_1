/**
 * Invoice Schema
 * 
 * Database schema for invoices and related tables.
 * 
 * Note: Main invoice table schema is defined in shared/schema.ts
 * This file only contains invoice_items (unified table)
 */

import { pgTable, uuid, text, timestamp, numeric, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { invoices } from '@shared/schema';

/**
 * Invoice items table (unified from invoice_lines)
 */
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().notNull(),
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
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

/**
 * Relations for invoices (extends shared schema relation)
 */
export const invoicesRelations = relations(invoices, ({ many }) => ({
  items: many(invoiceItems)
}));

/**
 * Relations for invoice items
 */
export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id]
  })
}));

// Re-export Invoice types from shared schema for consistency
export type { Invoice, InsertInvoice } from '@shared/schema';

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

/**
 * Extended Invoice type with relations
 */
export interface InvoiceWithRelations {
  details?: any;
  lines?: InvoiceItem[];
  items?: InvoiceItem[];
  [key: string]: any; // Allow dynamic properties from DB queries
}

export default {
  invoices,
  invoiceItems,
  invoicesRelations,
  invoiceItemsRelations
};