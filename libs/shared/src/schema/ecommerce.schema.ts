/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * E-Commerce Module Schema - Drizzle ORM Definitions
 * 
 * This file defines the database schema for the E-Commerce module tables
 * using Drizzle ORM with specific customizations for Romanian business requirements.
 */

import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  pgEnum, 
  numeric, 
  boolean,
  json,
  integer,
  index,
  unique
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Order status enum 
 */
export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PROCESSING = 'processing',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  RETURNED = 'returned'
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

/**
 * Transaction type enum
 */
export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PARTIAL_REFUND = 'partial_refund',
  AUTHORIZATION = 'authorization',
  CAPTURE = 'capture',
  VOID = 'void'
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  STRIPE = 'stripe',
  OTHER = 'other'
}

/**
 * Platform type enum - the source of the order
 */
export enum PlatformType {
  WEBSITE = 'website',
  POS = 'pos',
  SHOPIFY = 'shopify',
  PRESTASHOP = 'prestashop',
  WOOCOMMERCE = 'woocommerce',
  MARKETPLACE = 'marketplace',
  OTHER = 'other'
}

/**
 * Cart status enum
 */
export enum CartStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  EXPIRED = 'expired'
}

// Convert enum values to strings
const orderStatusValues = Object.values(OrderStatus).map(val => val.toString());
const paymentStatusValues = Object.values(PaymentStatus).map(val => val.toString());
const transactionTypeValues = Object.values(TransactionType).map(val => val.toString());
const paymentMethodValues = Object.values(PaymentMethod).map(val => val.toString());
const platformTypeValues = Object.values(PlatformType).map(val => val.toString());
const cartStatusValues = Object.values(CartStatus).map(val => val.toString());

// Create database enums
export const orderStatusEnum = pgEnum('order_status', orderStatusValues as [string, ...string[]]);
export const paymentStatusEnum = pgEnum('payment_status', paymentStatusValues as [string, ...string[]]);
export const transactionTypeEnum = pgEnum('transaction_type', transactionTypeValues as [string, ...string[]]);
export const paymentMethodEnum = pgEnum('payment_method', paymentMethodValues as [string, ...string[]]);
export const platformTypeEnum = pgEnum('platform_type', platformTypeValues as [string, ...string[]]);
export const cartStatusEnum = pgEnum('cart_status', cartStatusValues as [string, ...string[]]);

/**
 * E-commerce orders table
 */
export const ecommerce_orders = pgTable("ecommerce_orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  orderNumber: text("order_number").notNull(),
  orderDate: timestamp("order_date", { withTimezone: true }).defaultNow().notNull(),
  
  // Customer information
  customerId: uuid("customer_id"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  customerName: text("customer_name"),
  
  // Amounts
  subtotal: numeric("subtotal").notNull(),
  tax: numeric("tax").notNull(),
  shipping: numeric("shipping").notNull(),
  discount: numeric("discount").notNull(),
  total: numeric("total").notNull(),
  
  // Status tracking
  status: orderStatusEnum("status").default(OrderStatus.DRAFT).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default(PaymentStatus.PENDING).notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  
  // Shipping details
  shippingAddress: json("shipping_address"),
  billingAddress: json("billing_address"),
  trackingNumber: text("tracking_number"),
  shippingMethod: text("shipping_method"),
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  
  // Platform information
  platformType: platformTypeEnum("platform_type").default(PlatformType.WEBSITE),
  platformOrderId: text("platform_order_id"),
  platformData: json("platform_data"),
  
  // Flags
  isInvoiced: boolean("is_invoiced").default(false),
  needsAttention: boolean("needs_attention").default(false),
  
  // Items and notes
  items: json("items").notNull(),
  notes: text("notes"),
  customerNotes: text("customer_notes"),
  internalNotes: text("internal_notes"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => ({
  companyIdIdx: index("ecommerce_orders_company_id_idx").on(table.companyId),
  customerIdIdx: index("ecommerce_orders_customer_id_idx").on(table.customerId),
  orderNumberIdx: index("ecommerce_orders_order_number_idx").on(table.orderNumber),
  orderDateIdx: index("ecommerce_orders_order_date_idx").on(table.orderDate),
  statusIdx: index("ecommerce_orders_status_idx").on(table.status),
  paymentStatusIdx: index("ecommerce_orders_payment_status_idx").on(table.paymentStatus),
  platformTypeIdx: index("ecommerce_orders_platform_type_idx").on(table.platformType),
  uniqueOrderNumberPerCompany: unique("unique_order_number_company").on(table.companyId, table.orderNumber)
}));

/**
 * E-commerce transactions table
 */
export const ecommerce_transactions = pgTable("ecommerce_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  orderId: uuid("order_id").notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull(),
  status: paymentStatusEnum("status").default(PaymentStatus.PENDING).notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  
  // Transaction details
  transactionId: text("transaction_id"),
  transactionReference: text("transaction_reference"),
  authorizationCode: text("authorization_code"),
  transactionDate: timestamp("transaction_date", { withTimezone: true }).defaultNow().notNull(),
  
  // Card details (masked)
  cardLast4: text("card_last_4"),
  cardType: text("card_type"),
  cardExpiryMonth: integer("card_expiry_month"),
  cardExpiryYear: integer("card_expiry_year"),
  
  // Gateway information
  gatewayName: text("gateway_name"),
  gatewayResponse: json("gateway_response"),
  gatewayFee: numeric("gateway_fee"),
  
  // Parent transaction (for refunds)
  parentTransactionId: uuid("parent_transaction_id"),
  
  // Notes
  notes: text("notes"),
  metadata: json("metadata"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => ({
  companyIdIdx: index("ecommerce_transactions_company_id_idx").on(table.companyId),
  orderIdIdx: index("ecommerce_transactions_order_id_idx").on(table.orderId),
  transactionTypeIdx: index("ecommerce_transactions_type_idx").on(table.transactionType),
  statusIdx: index("ecommerce_transactions_status_idx").on(table.status),
  transactionDateIdx: index("ecommerce_transactions_date_idx").on(table.transactionDate)
}));

/**
 * Shopping ecommerce_carts table
 */
export const ecommerce_carts = pgTable("ecommerce_carts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  userId: uuid("user_id").notNull(),
  sessionId: text("session_id"),
  status: cartStatusEnum("status").default(CartStatus.ACTIVE).notNull(),
  
  // Cart totals
  subtotal: numeric("subtotal").default("0").notNull(),
  taxAmount: numeric("tax_amount").default("0").notNull(),
  discountAmount: numeric("discount_amount").default("0").notNull(),
  total: numeric("total").default("0").notNull(),
  
  // Currency and discounts
  currencyCode: text("currency_code").default("RON").notNull(),
  appliedDiscountCode: text("applied_discount_code"),
  
  // Expiration
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  
  // Metadata
  metadata: json("metadata"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyIdIdx: index("ecommerce_carts_company_id_idx").on(table.companyId),
  userIdIdx: index("ecommerce_carts_user_id_idx").on(table.userId),
  sessionIdIdx: index("ecommerce_carts_session_id_idx").on(table.sessionId),
  statusIdx: index("ecommerce_carts_status_idx").on(table.status),
}));

/**
 * Cart items table
 */
export const ecommerce_cart_items = pgTable("ecommerce_cart_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: uuid("cart_id").notNull().references(() => ecommerce_carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price").notNull(),
  totalPrice: numeric("total_price").notNull(),
  
  // Product information (snapshot)
  name: text("name"),
  sku: text("sku"),
  
  // Customizations
  options: json("options"),
  metadata: json("metadata"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cartIdIdx: index("ecommerce_cart_items_cart_id_idx").on(table.cartId),
  productIdIdx: index("ecommerce_cart_items_product_id_idx").on(table.productId),
}));

// Create insert schemas
export const insertEcommerceOrderSchema = createInsertSchema(ecommerce_orders, {
  subtotal: z.string().or(z.number()).transform(val => val.toString()),
  tax: z.string().or(z.number()).transform(val => val.toString()),
  shipping: z.string().or(z.number()).transform(val => val.toString()),
  discount: z.string().or(z.number()).transform(val => val.toString()),
  total: z.string().or(z.number()).transform(val => val.toString()),
  shippingAddress: z.record(z.string(), z.any()).optional(),
  billingAddress: z.record(z.string(), z.any()).optional(),
  platformData: z.record(z.string(), z.any()).optional(),
  items: z.array(z.any()).min(1),
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertEcommerceTransactionSchema = createInsertSchema(ecommerce_transactions, {
  amount: z.string().or(z.number()).transform(val => val.toString()),
  gatewayFee: z.string().or(z.number()).transform(val => val.toString()).optional(),
  gatewayResponse: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertCartSchema = createInsertSchema(ecommerce_carts, {
  subtotal: z.string().or(z.number()).transform(val => val.toString()).optional(),
  taxAmount: z.string().or(z.number()).transform(val => val.toString()).optional(),
  discountAmount: z.string().or(z.number()).transform(val => val.toString()).optional(),
  total: z.string().or(z.number()).transform(val => val.toString()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertCartItemSchema = createInsertSchema(ecommerce_cart_items, {
  unitPrice: z.string().or(z.number()).transform(val => val.toString()),
  totalPrice: z.string().or(z.number()).transform(val => val.toString()),
  options: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

/**
 * E-commerce integrations table
 */
export const ecommerce_integrations = pgTable("ecommerce_integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  type: text("type").notNull(), // shopify, woocommerce, prestashop, etc.
  name: text("name").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  
  // Integration credentials (API keys, tokens, etc.)
  credentials: json("credentials").notNull(),
  
  // Integration settings
  settings: json("settings").notNull(),
  
  // Sync status and metadata
  syncStatus: json("sync_status").notNull(),
  metadata: json("metadata").notNull(),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyIdIdx: index("ecommerce_integrations_company_id_idx").on(table.companyId),
  typeIdx: index("ecommerce_integrations_type_idx").on(table.type),
  uniqueTypePerCompany: unique("unique_integration_type_company").on(table.companyId, table.type)
}));

// Create insert schema for integrations
export const insertEcommerceIntegrationSchema = createInsertSchema(ecommerce_integrations, {
  credentials: z.record(z.string(), z.any()),
  settings: z.record(z.string(), z.any()),
  syncStatus: z.record(z.string(), z.any()),
  metadata: z.record(z.string(), z.any())
}); // Fixed: removed omit() for drizzle-zod compatibility;

// Export types
export type EcommerceOrder = typeof ecommerce_orders.$inferSelect;
export type InsertEcommerceOrder = z.infer<typeof insertEcommerceOrderSchema>;

export type EcommerceTransaction = typeof ecommerce_transactions.$inferSelect;
export type InsertEcommerceTransaction = z.infer<typeof insertEcommerceTransactionSchema>;

export type Cart = typeof ecommerce_carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type CartItem = typeof ecommerce_cart_items.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type EcommerceIntegration = typeof ecommerce_integrations.$inferSelect;
export type InsertEcommerceIntegration = z.infer<typeof insertEcommerceIntegrationSchema>;

// ============================================================================
// ADDITIONAL E-COMMERCE TABLES (Shopify Integration)
// ============================================================================

/**
 * E-commerce Order Items
 * Line items for e-commerce orders
 */
export const ecommerce_order_items = pgTable("ecommerce_order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").notNull(),
  companyId: uuid("company_id").notNull(),
  productId: uuid("product_id"),
  externalProductId: text("external_product_id"),
  sku: text("sku"),
  name: text("name").notNull(),
  description: text("description"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default('19'),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  discountAmount: numeric("discount_amount", { precision: 15, scale: 2 }).notNull().default('0'),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  metadata: json("metadata").default('{}'),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-commerce Shopify Collections
 * Shopify collections synced to local categories
 */
export const ecommerce_shopify_collections = pgTable("ecommerce_shopify_collections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  shopifyCollectionId: text("shopify_collection_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  handle: text("handle"),
  localCategoryId: uuid("local_category_id"),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  metadata: json("metadata").default('{}'),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-commerce Shopify Products
 * Shopify products synced to local inventory
 */
export const ecommerce_shopify_products = pgTable("ecommerce_shopify_products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  shopifyProductId: text("shopify_product_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  handle: text("handle"),
  productType: text("product_type"),
  vendor: text("vendor"),
  tags: json("tags").default('[]'),
  localProductId: uuid("local_product_id"),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  metadata: json("metadata").default('{}'),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * E-commerce Shopify Variants
 * Shopify product variants (size, color, etc.)
 */
export const ecommerce_shopify_variants = pgTable("ecommerce_shopify_variants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  shopifyProductId: text("shopify_product_id").notNull(),
  shopifyVariantId: text("shopify_variant_id").notNull(),
  shopifyProductEntryId: uuid("shopify_product_entry_id").notNull(),
  title: text("title").notNull(),
  sku: text("sku"),
  barcode: text("barcode"),
  price: numeric("price", { precision: 15, scale: 2 }),
  compareAtPrice: numeric("compare_at_price", { precision: 15, scale: 2 }),
  inventoryQuantity: integer("inventory_quantity").default(0),
  weight: numeric("weight", { precision: 10, scale: 3 }),
  weightUnit: text("weight_unit"),
  localProductId: uuid("local_product_id"),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  metadata: json("metadata").default('{}'),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});