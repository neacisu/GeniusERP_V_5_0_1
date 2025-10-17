/**
 * Invoice Schema
 * 
 * Database schema for invoices and related tables.
 */

import { pgTable, uuid, text, timestamp, numeric, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Invoices table
 */
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().notNull(),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  customerId: uuid('customer_id').notNull(),
  invoiceNumber: text('invoice_number').notNull(),
  fiscalReceiptNumber: text('fiscal_receipt_number'),
  status: text('status').notNull().default('draft'),
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  vatRate: numeric('vat_rate').notNull().default('19'),
  netTotal: numeric('net_total').notNull().default('0'),
  vatTotal: numeric('vat_total').notNull().default('0'),
  grossTotal: numeric('gross_total').notNull().default('0'),
  currency: text('currency').notNull().default('RON'),
  exchangeRate: numeric('exchange_rate'),
  paymentMethod: text('payment_method'),
  paymentDetails: text('payment_details'),
  notes: text('notes'),
  
  // Validation fields for accounting note generation
  isValidated: boolean('is_validated').notNull().default(false),
  validatedAt: timestamp('validated_at'),
  validatedBy: uuid('validated_by'),
  ledgerEntryId: uuid('ledger_entry_id'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  createdBy: uuid('created_by')
});

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
 * Relations for invoices
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

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

export default {
  invoices,
  invoiceItems,
  invoicesRelations,
  invoiceItemsRelations
};