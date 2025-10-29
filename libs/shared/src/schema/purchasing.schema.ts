/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Purchasing Schema
 * 
 * Complete purchasing and goods receipt management.
 * Includes purchase orders and NIR (Notă Intrare Recepție - Romanian goods receipt note).
 * 
 * Tables:
 * - purchase_orders: Purchase orders to suppliers
 * - purchase_order_items: Line items for purchase orders
 * - nir_documents: NIR (Goods Receipt Note) documents
 * - nir_items: Line items for NIR documents
 * 
 * All structures extracted from PostgreSQL DB with complete compliance to Romanian accounting.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  date,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { po_status, nir_status, gestiune_type } from './enums';

// Forward references (resolved when schemas combined)
declare const companies: any;
declare const users: any;
declare const crm_customers: any;
declare const inventory_warehouses: any;
declare const inventory_products: any;

// ============================================================================
// PURCHASING TABLES
// ============================================================================

/**
 * Purchase Orders table
 * Orders placed to suppliers for inventory replenishment
 */
export const purchase_orders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').notNull(),
  franchise_id: uuid('franchise_id'),
  po_number: varchar('po_number', { length: 50 }).notNull(),
  supplier_id: uuid('supplier_id').notNull(),
  warehouse_id: uuid('warehouse_id').notNull(),
  status: po_status('status').default('draft'),
  is_custody: boolean('is_custody').default(false),
  expected_date: date('expected_date'),
  
  // Approval
  approved_by: uuid('approved_by'),
  approved_at: timestamp('approved_at'),
  
  // Content
  notes: text('notes'),
  
  // Totals
  total_value_no_vat: numeric('total_value_no_vat', { precision: 15, scale: 2 }).default('0'),
  total_vat: numeric('total_vat', { precision: 15, scale: 2 }).default('0'),
  total_value_with_vat: numeric('total_value_with_vat', { precision: 15, scale: 2 }).default('0'),
  
  // Currency
  currency: varchar('currency', { length: 5 }).default('RON'),
  exchange_rate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1'),
  
  // NIR link
  nir_id: uuid('nir_id'),
  
  // Audit
  created_at: timestamp('created_at').default(sql`now()`),
  updated_at: timestamp('updated_at').default(sql`now()`)
}, (table) => ({
  po_number_unique: unique('purchase_orders_po_number_unique').on(table.po_number),
  company_idx: index('purchase_orders_company_idx').on(table.company_id),
  supplier_idx: index('purchase_orders_supplier_idx').on(table.supplier_id),
  warehouse_idx: index('purchase_orders_warehouse_idx').on(table.warehouse_id),
  status_idx: index('purchase_orders_status_idx').on(table.status),
  created_at_idx: index('purchase_orders_created_at_idx').on(table.created_at),
}));

/**
 * Purchase Order Items table
 * Line items for each purchase order
 */
export const purchase_order_items = pgTable('purchase_order_items', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  po_id: uuid('po_id').notNull(),
  product_id: uuid('product_id').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  quantity_received: numeric('quantity_received', { precision: 15, scale: 3 }).default('0'),
  unit_price: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  vat_rate: integer('vat_rate').default(19),
  vat_value: numeric('vat_value', { precision: 15, scale: 2 }).default('0'),
  total_value_no_vat: numeric('total_value_no_vat', { precision: 15, scale: 2 }).default('0'),
  total_value_with_vat: numeric('total_value_with_vat', { precision: 15, scale: 2 }).default('0'),
  
  // Currency
  currency: varchar('currency', { length: 5 }).default('RON'),
  exchange_rate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1'),
  exchange_rate_source: varchar('exchange_rate_source', { length: 20 }).default('BNR'),
  exchange_rate_date: date('exchange_rate_date'),
  
  // Audit
  created_at: timestamp('created_at').default(sql`now()`),
  updated_at: timestamp('updated_at').default(sql`now()`)
}, (table) => ({
  po_idx: index('purchase_order_items_po_idx').on(table.po_id),
  product_idx: index('purchase_order_items_product_idx').on(table.product_id),
}));

/**
 * NIR Documents table
 * Notă Intrare Recepție (Goods Receipt Note) - Romanian specific
 * Legal document for inventory receipt confirmation
 */
export const nir_documents = pgTable('nir_documents', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').notNull(),
  franchise_id: uuid('franchise_id'),
  nir_number: varchar('nir_number', { length: 50 }).notNull(),
  supplier_invoice_number: varchar('supplier_invoice_number', { length: 50 }),
  supplier_id: uuid('supplier_id').notNull(),
  warehouse_id: uuid('warehouse_id').notNull(),
  warehouse_type: gestiune_type('warehouse_type').notNull(),
  is_custody: boolean('is_custody').default(false),
  status: nir_status('status').default('draft'),
  receipt_date: timestamp('receipt_date').notNull().default(sql`now()`),
  
  // Approval
  approved_by: uuid('approved_by'),
  approved_at: timestamp('approved_at'),
  
  // Content
  notes: text('notes'),
  
  // Totals
  total_value_no_vat: numeric('total_value_no_vat', { precision: 15, scale: 2 }).default('0'),
  total_vat: numeric('total_vat', { precision: 15, scale: 2 }).default('0'),
  total_value_with_vat: numeric('total_value_with_vat', { precision: 15, scale: 2 }).default('0'),
  
  // Currency
  currency: varchar('currency', { length: 5 }).default('RON'),
  exchange_rate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1'),
  
  // Audit
  created_at: timestamp('created_at').default(sql`now()`),
  updated_at: timestamp('updated_at').default(sql`now()`)
}, (table) => ({
  nir_number_unique: unique('nir_documents_nir_number_unique').on(table.nir_number),
  company_idx: index('nir_documents_company_idx').on(table.company_id),
  supplier_idx: index('nir_documents_supplier_idx').on(table.supplier_id),
  warehouse_idx: index('nir_documents_warehouse_idx').on(table.warehouse_id),
  status_idx: index('nir_documents_status_idx').on(table.status),
  receipt_date_idx: index('nir_documents_receipt_date_idx').on(table.receipt_date),
}));

/**
 * NIR Items table
 * Line items for NIR documents with batch tracking
 */
export const nir_items = pgTable('nir_items', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  nir_id: uuid('nir_id').notNull(),
  product_id: uuid('product_id').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  
  // Batch tracking
  batch_no: varchar('batch_no', { length: 50 }),
  expiry_date: date('expiry_date'),
  
  // Pricing
  purchase_price: numeric('purchase_price', { precision: 15, scale: 2 }).notNull(),
  purchase_price_with_vat: numeric('purchase_price_with_vat', { precision: 15, scale: 2 }),
  selling_price: numeric('selling_price', { precision: 15, scale: 2 }),
  selling_price_with_vat: numeric('selling_price_with_vat', { precision: 15, scale: 2 }),
  
  // VAT and totals
  vat_rate: integer('vat_rate').default(19),
  vat_value: numeric('vat_value', { precision: 15, scale: 2 }).default('0'),
  total_value_no_vat: numeric('total_value_no_vat', { precision: 15, scale: 2 }).default('0'),
  total_value_with_vat: numeric('total_value_with_vat', { precision: 15, scale: 2 }).default('0'),
  
  // Currency
  currency: varchar('currency', { length: 5 }).default('RON'),
  exchange_rate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1'),
  exchange_rate_source: varchar('exchange_rate_source', { length: 20 }).default('BNR'),
  exchange_rate_date: date('exchange_rate_date'),
  
  // Audit
  created_at: timestamp('created_at').default(sql`now()`),
  updated_at: timestamp('updated_at').default(sql`now()`)
}, (table) => ({
  nir_idx: index('nir_items_nir_idx').on(table.nir_id),
  product_idx: index('nir_items_product_idx').on(table.product_id),
  batch_idx: index('nir_items_batch_idx').on(table.batch_no),
}));

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Purchase Orders Relations
 */
export const purchase_ordersRelations = relations(purchase_orders, ({ one, many }) => ({
  company: one(companies, {
    fields: [purchase_orders.company_id],
    references: [companies.id],
  }),
  supplier: one(crm_customers, {
    fields: [purchase_orders.supplier_id],
    references: [crm_customers.id],
  }),
  warehouse: one(inventory_warehouses, {
    fields: [purchase_orders.warehouse_id],
    references: [inventory_warehouses.id],
  }),
  items: many(purchase_order_items),
  nirDocument: one(nir_documents, {
    fields: [purchase_orders.nir_id],
    references: [nir_documents.id],
  }),
  approvedByUser: one(users, {
    fields: [purchase_orders.approved_by],
    references: [users.id],
  }),
}));

/**
 * Purchase Order Items Relations
 */
export const purchase_order_itemsRelations = relations(purchase_order_items, ({ one }) => ({
  purchaseOrder: one(purchase_orders, {
    fields: [purchase_order_items.po_id],
    references: [purchase_orders.id],
  }),
  product: one(inventory_products, {
    fields: [purchase_order_items.product_id],
    references: [inventory_products.id],
  }),
}));

/**
 * NIR Documents Relations
 */
export const nir_documentsRelations = relations(nir_documents, ({ one, many }) => ({
  company: one(companies, {
    fields: [nir_documents.company_id],
    references: [companies.id],
  }),
  supplier: one(crm_customers, {
    fields: [nir_documents.supplier_id],
    references: [crm_customers.id],
  }),
  warehouse: one(inventory_warehouses, {
    fields: [nir_documents.warehouse_id],
    references: [inventory_warehouses.id],
  }),
  items: many(nir_items),
  approvedByUser: one(users, {
    fields: [nir_documents.approved_by],
    references: [users.id],
  }),
}));

/**
 * NIR Items Relations
 */
export const nir_itemsRelations = relations(nir_items, ({ one }) => ({
  nirDocument: one(nir_documents, {
    fields: [nir_items.nir_id],
    references: [nir_documents.id],
  }),
  product: one(inventory_products, {
    fields: [nir_items.product_id],
    references: [inventory_products.id],
  }),
}));

// Note: Forward references will be resolved when all schemas are combined

