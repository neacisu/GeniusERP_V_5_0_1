/**
 * E-commerce Schema - Drizzle ORM Definitions
 * 
 * This file defines the schema for the E-commerce module tables using Drizzle ORM.
 * These tables implement a comprehensive e-commerce system with orders, transactions,
 * and integration with external platforms like Shopify.
 */

import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  numeric, 
  date,
  primaryKey,
  json,
  pgEnum,
  unique,
  index
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { customers as crmCustomers } from "../../crm/schema/crm.schema";
import { IntegrationProvider } from "../../integrations/schema/integrations.schema";

/**
 * Order status enum
 */
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  ON_HOLD = 'on_hold',
  PAYMENT_FAILED = 'payment_failed'
}

/**
 * Order source enum
 */
export enum OrderSource {
  MANUAL = 'manual',
  WEBSITE = 'website',
  POS = 'pos',
  SHOPIFY = 'shopify',
  MOBILE_APP = 'mobile_app'
}

/**
 * Order payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  FAILED = 'failed'
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  REVOLUT = 'revolut',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  OTHER = 'other'
}

/**
 * Order status enum for database
 */
export const orderStatusEnum = pgEnum('order_status', [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.COMPLETED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
  OrderStatus.ON_HOLD,
  OrderStatus.PAYMENT_FAILED
]);

/**
 * Order source enum for database
 */
export const orderSourceEnum = pgEnum('order_source', [
  OrderSource.MANUAL,
  OrderSource.WEBSITE,
  OrderSource.POS,
  OrderSource.SHOPIFY,
  OrderSource.MOBILE_APP
]);

/**
 * Payment status enum for database
 */
export const paymentStatusEnum = pgEnum('payment_status', [
  PaymentStatus.PENDING,
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_PAID,
  PaymentStatus.REFUNDED,
  PaymentStatus.PARTIALLY_REFUNDED,
  PaymentStatus.FAILED
]);

/**
 * Payment method enum for database
 */
export const paymentMethodEnum = pgEnum('payment_method', [
  PaymentMethod.CREDIT_CARD,
  PaymentMethod.DEBIT_CARD,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.CASH,
  PaymentMethod.REVOLUT,
  PaymentMethod.STRIPE,
  PaymentMethod.PAYPAL,
  PaymentMethod.OTHER
]);

/**
 * Orders table - Main e-commerce orders table
 */
export const orders = pgTable("ecommerce_orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  franchiseId: uuid("franchise_id"),
  customerId: uuid("customer_id").references(() => crmCustomers.id),
  orderNumber: text("order_number").notNull().unique(),
  externalId: text("external_id"), // External order ID (e.g., from Shopify)
  externalOrderNumber: text("external_order_number"), // External order number
  orderDate: timestamp("order_date", { withTimezone: true }).defaultNow().notNull(),
  status: orderStatusEnum("status").default(OrderStatus.PENDING).notNull(),
  source: orderSourceEnum("source").default(OrderSource.WEBSITE).notNull(),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  shippingAddress: json("shipping_address").default({}),
  billingAddress: json("billing_address").default({}),
  shippingMethod: text("shipping_method"),
  shippingCost: numeric("shipping_cost", { precision: 15, scale: 2 }).default("0").notNull(),
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }).default("0").notNull(),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  discountAmount: numeric("discount_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("RON").notNull(),
  notes: text("notes"),
  paymentStatus: paymentStatusEnum("payment_status").default(PaymentStatus.PENDING).notNull(),
  tags: json("tags").default([]),
  metadata: json("metadata").default({}),
  integrationSource: text("integration_source"), // e.g., shopify, prestashop, etc.
  syncedAt: timestamp("synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (orders) => ({
  companyIndex: index("ecommerce_orders_company_idx").on(orders.companyId),
  customerIndex: index("ecommerce_orders_customer_idx").on(orders.customerId),
  sourceIndex: index("ecommerce_orders_source_idx").on(orders.source),
  statusIndex: index("ecommerce_orders_status_idx").on(orders.status),
  dateIndex: index("ecommerce_orders_date_idx").on(orders.orderDate),
  companyDateIndex: index("ecommerce_orders_company_date_idx").on(orders.companyId, orders.orderDate),
  companyFranchiseIndex: index("ecommerce_orders_company_franchise_idx").on(orders.companyId, orders.franchiseId)
}));

/**
 * Order items table - Line items in an order
 */
export const orderItems = pgTable("ecommerce_order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  companyId: uuid("company_id").notNull(),
  productId: uuid("product_id"), // Reference to inventory product
  externalProductId: text("external_product_id"), // External product ID (e.g., from Shopify)
  sku: text("sku"),
  name: text("name").notNull(),
  description: text("description"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("19").notNull(),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  discountAmount: numeric("discount_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (orderItems) => ({
  orderIndex: index("ecommerce_order_items_order_idx").on(orderItems.orderId),
  productIndex: index("ecommerce_order_items_product_idx").on(orderItems.productId)
}));

/**
 * Order transactions table - Payment transactions for orders
 */
export const transactions = pgTable("ecommerce_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  franchiseId: uuid("franchise_id"),
  orderId: uuid("order_id").references(() => orders.id),
  transactionNumber: text("transaction_number").notNull().unique(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("RON").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: text("status").notNull(), // success, failed, pending, refunded
  processorId: text("processor_id"), // ID from payment processor
  processorResponse: json("processor_response").default({}),
  refundAmount: numeric("refund_amount", { precision: 15, scale: 2 }).default("0"),
  refundReason: text("refund_reason"),
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (transactions) => ({
  companyIndex: index("ecommerce_transactions_company_idx").on(transactions.companyId),
  orderIndex: index("ecommerce_transactions_order_idx").on(transactions.orderId),
  dateIndex: index("ecommerce_transactions_date_idx").on(transactions.createdAt),
  companyDateIndex: index("ecommerce_transactions_company_date_idx").on(transactions.companyId, transactions.createdAt),
  companyFranchiseIndex: index("ecommerce_transactions_company_franchise_idx").on(transactions.companyId, transactions.franchiseId)
}));

/**
 * Shopify collections table - Maps Shopify collections to local categories
 */
export const shopifyCollections = pgTable("ecommerce_shopify_collections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  shopifyCollectionId: text("shopify_collection_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  handle: text("handle"),
  localCategoryId: uuid("local_category_id"), // Reference to local inventory category
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (shopifyCollections) => ({
  companyIndex: index("ecommerce_shopify_collections_company_idx").on(shopifyCollections.companyId),
  shopifyIdIndex: index("ecommerce_shopify_collections_shopify_id_idx").on(shopifyCollections.shopifyCollectionId),
  uniqueShopifyCollection: unique("unique_shopify_collection").on(shopifyCollections.companyId, shopifyCollections.shopifyCollectionId)
}));

/**
 * Shopify products table - Maps Shopify products to local inventory products
 */
export const shopifyProducts = pgTable("ecommerce_shopify_products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  shopifyProductId: text("shopify_product_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  handle: text("handle"),
  productType: text("product_type"),
  vendor: text("vendor"),
  tags: json("tags").default([]),
  localProductId: uuid("local_product_id"), // Reference to local inventory product
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (shopifyProducts) => ({
  companyIndex: index("ecommerce_shopify_products_company_idx").on(shopifyProducts.companyId),
  shopifyIdIndex: index("ecommerce_shopify_products_shopify_id_idx").on(shopifyProducts.shopifyProductId),
  uniqueShopifyProduct: unique("unique_shopify_product").on(shopifyProducts.companyId, shopifyProducts.shopifyProductId)
}));

/**
 * Shopify variants table - Maps Shopify product variants to local inventory items
 */
export const shopifyVariants = pgTable("ecommerce_shopify_variants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  shopifyProductId: text("shopify_product_id").notNull(),
  shopifyVariantId: text("shopify_variant_id").notNull(),
  shopifyProductEntryId: uuid("shopify_product_entry_id").notNull().references(() => shopifyProducts.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  sku: text("sku"),
  barcode: text("barcode"),
  price: numeric("price", { precision: 15, scale: 2 }),
  compareAtPrice: numeric("compare_at_price", { precision: 15, scale: 2 }),
  inventory: integer("inventory"),
  localInventoryItemId: uuid("local_inventory_item_id"), // Reference to local inventory item
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (shopifyVariants) => ({
  shopifyProductIndex: index("ecommerce_shopify_variants_product_idx").on(shopifyVariants.shopifyProductEntryId),
  shopifyIdIndex: index("ecommerce_shopify_variants_shopify_id_idx").on(shopifyVariants.shopifyVariantId),
  uniqueShopifyVariant: unique("unique_shopify_variant").on(shopifyVariants.companyId, shopifyVariants.shopifyVariantId)
}));

// Define relations between tables
export const orderRelations = relations(orders, ({ one, many }) => ({
  customer: one(crmCustomers, {
    fields: [orders.customerId],
    references: [crmCustomers.id],
  }),
  items: many(orderItems),
  transactions: many(transactions)
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  })
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  })
}));

export const shopifyProductRelations = relations(shopifyProducts, ({ many }) => ({
  variants: many(shopifyVariants)
}));

export const shopifyVariantRelations = relations(shopifyVariants, ({ one }) => ({
  product: one(shopifyProducts, {
    fields: [shopifyVariants.shopifyProductEntryId],
    references: [shopifyProducts.id],
  })
}));

// Create insert schemas for all tables
export const insertOrderSchema = createInsertSchema(orders, {
  // Custom validations can be added here
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  shippingAddress: z.record(z.any()).optional(),
  billingAddress: z.record(z.any()).optional(),
}); // Fixed: removed omit() for drizzle-zod compatibility

export const insertOrderItemSchema = createInsertSchema(orderItems); // Fixed: removed omit() for drizzle-zod compatibility

export const insertTransactionSchema = createInsertSchema(transactions, {
  metadata: z.record(z.any()).optional(),
  processorResponse: z.record(z.any()).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility

export const insertShopifyCollectionSchema = createInsertSchema(shopifyCollections, {
  metadata: z.record(z.any()).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility

export const insertShopifyProductSchema = createInsertSchema(shopifyProducts, {
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility

export const insertShopifyVariantSchema = createInsertSchema(shopifyVariants, {
  metadata: z.record(z.any()).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility

// Export types
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ShopifyCollection = typeof shopifyCollections.$inferSelect;
export type ShopifyProduct = typeof shopifyProducts.$inferSelect;
export type ShopifyVariant = typeof shopifyVariants.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertShopifyCollection = z.infer<typeof insertShopifyCollectionSchema>;
export type InsertShopifyProduct = z.infer<typeof insertShopifyProductSchema>;
export type InsertShopifyVariant = z.infer<typeof insertShopifyVariantSchema>;