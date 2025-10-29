/**
 * Inventory Schema
 * 
 * Core inventory management tables for product catalog, stock tracking, and movements.
 * These tables are CRITICAL for inventory operations and were previously missing from Drizzle.
 * 
 * Tables:
 * - inventory_categories: Product categorization hierarchy
 * - inventory_units: Units of measure (buc, kg, litri, etc.)
 * - inventory_products: Product master data
 * - inventory_stock: Current stock levels by product/company
 * - inventory_stock_movements: All inventory transactions
 * 
 * All structures extracted from PostgreSQL DB with complete column definitions.
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
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================================
// INVENTORY TABLES
// ============================================================================

/**
 * Inventory Categories
 * Hierarchical product categorization
 */
export const inventory_categories = pgTable('inventory_categories', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  parent_id: uuid('parent_id'), // Self-reference for hierarchy
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  name_idx: index('inventory_categories_name_idx').on(table.name),
  parent_idx: index('inventory_categories_parent_idx').on(table.parent_id),
  active_idx: index('inventory_categories_active_idx').on(table.is_active),
}));

/**
 * Inventory Units of Measure
 * Standard units: buc, kg, litri, metri, etc.
 */
export const inventory_units = pgTable('inventory_units', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  abbreviation: text('abbreviation').notNull(),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  name_idx: index('inventory_units_name_idx').on(table.name),
  abbreviation_idx: index('inventory_units_abbreviation_idx').on(table.abbreviation),
}));

/**
 * Inventory Products
 * Master product catalog with pricing and stock settings
 */
export const inventory_products = pgTable('inventory_products', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category_id: uuid('category_id'),
  unit_id: uuid('unit_id'),
  
  // Pricing
  purchase_price: numeric('purchase_price', { precision: 15, scale: 2 }).notNull().default('0'),
  selling_price: numeric('selling_price', { precision: 15, scale: 2 }).notNull().default('0'),
  price_includes_vat: boolean('price_includes_vat').default(true),
  vat_rate: integer('vat_rate').default(19),
  
  // Stock management
  stock_alert: numeric('stock_alert', { precision: 15, scale: 2 }).default('0'),
  is_active: boolean('is_active').default(true),
  barcode: text('barcode'),
  
  // Audit
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  sku_unique: unique('inventory_products_sku_unique').on(table.sku),
  name_unique: unique('inventory_products_name_unique').on(table.name),
  barcode_unique: unique('inventory_products_barcode_unique').on(table.barcode),
  sku_idx: index('inventory_products_sku_idx').on(table.sku),
  name_idx: index('inventory_products_name_idx').on(table.name),
  category_idx: index('inventory_products_category_idx').on(table.category_id),
  barcode_idx: index('inventory_products_barcode_idx').on(table.barcode),
  active_idx: index('inventory_products_active_idx').on(table.is_active),
}));

/**
 * Inventory Stock
 * Current stock levels per product/company
 * Maintains running totals and average costs
 */
export const inventory_stock = pgTable('inventory_stock', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  product_id: uuid('product_id').notNull(),
  company_id: uuid('company_id').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 2 }).notNull().default('0'),
  average_cost: numeric('average_cost', { precision: 15, scale: 2 }).notNull().default('0'),
  total_value: numeric('total_value', { precision: 15, scale: 2 }).notNull().default('0'),
  last_updated: timestamp('last_updated').notNull().default(sql`now()`)
}, (table) => ({
  product_idx: index('inventory_stock_product_idx').on(table.product_id),
  company_idx: index('inventory_stock_company_idx').on(table.company_id),
  product_company_idx: index('inventory_stock_product_company_idx').on(table.product_id, table.company_id),
}));

/**
 * Inventory Stock Movements
 * All inventory transactions (receipts, issues, adjustments)
 * Document types: 'RECEIPT', 'ISSUE', 'ADJUSTMENT', 'TRANSFER', etc.
 */
export const inventory_stock_movements = pgTable('inventory_stock_movements', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  product_id: uuid('product_id').notNull(),
  date: timestamp('date').notNull(),
  document_number: text('document_number'),
  document_type: text('document_type').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 2 }).notNull(),
  unit_price: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  total_value: numeric('total_value', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  created_by: uuid('created_by').notNull(),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  product_idx: index('inventory_stock_movements_product_idx').on(table.product_id),
  date_idx: index('inventory_stock_movements_date_idx').on(table.date),
  document_type_idx: index('inventory_stock_movements_document_type_idx').on(table.document_type),
  created_by_idx: index('inventory_stock_movements_created_by_idx').on(table.created_by),
  product_date_idx: index('inventory_stock_movements_product_date_idx').on(table.product_id, table.date),
}));

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Inventory Categories Relations
 */
export const inventory_categoriesRelations = relations(inventory_categories, ({ one, many }) => ({
  parent: one(inventory_categories, {
    fields: [inventory_categories.parent_id],
    references: [inventory_categories.id],
  }),
  children: many(inventory_categories),
  products: many(inventory_products),
}));

/**
 * Inventory Units Relations
 */
export const inventory_unitsRelations = relations(inventory_units, ({ many }) => ({
  products: many(inventory_products),
}));

/**
 * Inventory Products Relations
 */
export const inventory_productsRelations = relations(inventory_products, ({ one, many }) => ({
  category: one(inventory_categories, {
    fields: [inventory_products.category_id],
    references: [inventory_categories.id],
  }),
  unit: one(inventory_units, {
    fields: [inventory_products.unit_id],
    references: [inventory_units.id],
  }),
  stockLevels: many(inventory_stock),
  movements: many(inventory_stock_movements),
}));

/**
 * Inventory Stock Relations
 */
export const inventory_stockRelations = relations(inventory_stock, ({ one }) => ({
  product: one(inventory_products, {
    fields: [inventory_stock.product_id],
    references: [inventory_products.id],
  }),
  company: one(companies, {
    fields: [inventory_stock.company_id],
    references: [companies.id],
  }),
}));

/**
 * Inventory Stock Movements Relations
 */
export const inventory_stock_movementsRelations = relations(inventory_stock_movements, ({ one }) => ({
  product: one(inventory_products, {
    fields: [inventory_stock_movements.product_id],
    references: [inventory_products.id],
  }),
  createdByUser: one(users, {
    fields: [inventory_stock_movements.created_by],
    references: [users.id],
  }),
}));

// Note: Forward references to companies and users will be resolved by Drizzle ORM
// when all schemas are combined in the main schema.ts file

