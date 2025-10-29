/**
 * Transfer Schema
 * 
 * Inventory transfer management between warehouses/locations.
 * 
 * Tables:
 * - transfer_documents: Transfer orders between warehouses
 * - transfer_items: Line items for transfers
 * - stock_reservations: Stock reservation system for pending orders
 * 
 * All structures extracted from PostgreSQL DB.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  numeric,
  date,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { transfer_status } from './enums';

// ============================================================================
// TRANSFER TABLES
// ============================================================================

/**
 * Transfer Documents table
 * Manages inventory transfers between warehouses
 */
export const transfer_documents = pgTable('transfer_documents', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').notNull(),
  franchise_id: uuid('franchise_id'),
  transfer_number: varchar('transfer_number', { length: 50 }).notNull(),
  source_warehouse_id: uuid('source_warehouse_id').notNull(),
  destination_warehouse_id: uuid('destination_warehouse_id').notNull(),
  status: transfer_status('status').default('draft'),
  transfer_date: timestamp('transfer_date').notNull().default(sql`now()`),
  
  // Approval and receipt
  approved_by: uuid('approved_by'),
  approved_at: timestamp('approved_at'),
  received_by: uuid('received_by'),
  received_at: timestamp('received_at'),
  
  // NIR link (goods receipt at destination)
  nir_id: uuid('nir_id'),
  
  // Content
  notes: text('notes'),
  total_value: numeric('total_value', { precision: 15, scale: 2 }).default('0'),
  
  // Currency
  currency: varchar('currency', { length: 5 }).default('RON'),
  exchange_rate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1'),
  exchange_rate_source: varchar('exchange_rate_source', { length: 20 }).default('BNR'),
  exchange_rate_date: date('exchange_rate_date'),
  
  // Audit
  created_at: timestamp('created_at').default(sql`now()`),
  updated_at: timestamp('updated_at').default(sql`now()`)
}, (table) => ({
  transfer_number_unique: unique('transfer_documents_transfer_number_unique').on(table.transfer_number),
  company_idx: index('transfer_documents_company_idx').on(table.company_id),
  source_warehouse_idx: index('transfer_documents_source_warehouse_idx').on(table.source_warehouse_id),
  destination_warehouse_idx: index('transfer_documents_destination_warehouse_idx').on(table.destination_warehouse_id),
  status_idx: index('transfer_documents_status_idx').on(table.status),
  transfer_date_idx: index('transfer_documents_transfer_date_idx').on(table.transfer_date),
}));

/**
 * Transfer Items table
 * Line items for warehouse transfers
 */
export const transfer_items = pgTable('transfer_items', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  transfer_id: uuid('transfer_id').notNull(),
  product_id: uuid('product_id').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantity_received: numeric('quantity_received', { precision: 15, scale: 3 }).default('0'),
  
  // Batch tracking
  batch_no: varchar('batch_no', { length: 50 }),
  expiry_date: date('expiry_date'),
  
  // Valuation
  unit_value: numeric('unit_value', { precision: 15, scale: 2 }).notNull(),
  total_value: numeric('total_value', { precision: 15, scale: 2 }).default('0'),
  
  // Currency
  currency: varchar('currency', { length: 5 }).default('RON'),
  exchange_rate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1'),
  exchange_rate_source: varchar('exchange_rate_source', { length: 20 }).default('BNR'),
  exchange_rate_date: date('exchange_rate_date'),
  
  // Audit
  created_at: timestamp('created_at').default(sql`now()`),
  updated_at: timestamp('updated_at').default(sql`now()`)
}, (table) => ({
  transfer_idx: index('transfer_items_transfer_idx').on(table.transfer_id),
  product_idx: index('transfer_items_product_idx').on(table.product_id),
}));

/**
 * Stock Reservations table
 * Reserve inventory for pending orders/operations
 * Prevents overselling and manages allocation
 */
export const stock_reservations = pgTable('stock_reservations', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  stock_id: uuid('stock_id').notNull(),
  reservation_quantity: numeric('reservation_quantity', { precision: 15, scale: 3 }).notNull(),
  notes: text('notes'),
  reservation_date: timestamp('reservation_date', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
  expiry_date: timestamp('expiry_date', { withTimezone: true }),
  is_active: boolean('is_active').default(true),
  created_by: uuid('created_by'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
  
  // Source tracking (polymorphic)
  source_type: text('source_type').notNull().default('other'),
  source_id: uuid('source_id'),
  company_id: uuid('company_id')
}, (table) => ({
  stock_idx: index('stock_reservations_stock_idx').on(table.stock_id),
  source_idx: index('stock_reservations_source_idx').on(table.source_type, table.source_id),
  active_idx: index('stock_reservations_active_idx').on(table.is_active),
  company_idx: index('stock_reservations_company_idx').on(table.company_id),
}));

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Transfer Documents Relations
 */
export const transfer_documentsRelations = relations(transfer_documents, ({ one, many }) => ({
  company: one(companies, {
    fields: [transfer_documents.company_id],
    references: [companies.id],
  }),
  sourceWarehouse: one(inventory_warehouses, {
    fields: [transfer_documents.source_warehouse_id],
    references: [inventory_warehouses.id],
    relationName: 'sourceWarehouse',
  }),
  destinationWarehouse: one(inventory_warehouses, {
    fields: [transfer_documents.destination_warehouse_id],
    references: [inventory_warehouses.id],
    relationName: 'destinationWarehouse',
  }),
  items: many(transfer_items),
  nirDocument: one(nir_documents, {
    fields: [transfer_documents.nir_id],
    references: [nir_documents.id],
  }),
  approvedByUser: one(users, {
    fields: [transfer_documents.approved_by],
    references: [users.id],
  }),
  receivedByUser: one(users, {
    fields: [transfer_documents.received_by],
    references: [users.id],
  }),
}));

/**
 * Transfer Items Relations
 */
export const transfer_itemsRelations = relations(transfer_items, ({ one }) => ({
  transferDocument: one(transfer_documents, {
    fields: [transfer_items.transfer_id],
    references: [transfer_documents.id],
  }),
  product: one(inventory_products, {
    fields: [transfer_items.product_id],
    references: [inventory_products.id],
  }),
}));

/**
 * Stock Reservations Relations
 */
export const stock_reservationsRelations = relations(stock_reservations, ({ one }) => ({
  stock: one(inventory_stock, {
    fields: [stock_reservations.stock_id],
    references: [inventory_stock.id],
  }),
  company: one(companies, {
    fields: [stock_reservations.company_id],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [stock_reservations.created_by],
    references: [users.id],
  }),
}));

// Note: Forward references will be resolved when schemas are combined

