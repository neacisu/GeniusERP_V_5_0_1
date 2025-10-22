/**
 * Inventory Assessment Schema
 * 
 * Defines the database schema for inventory assessment (Inventariere) in Romanian accounting.
 * Implements tables for assessment documents, items, and valuation methods.
 */

import { pgTable, text, uuid, boolean, timestamp, pgEnum, numeric, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { inventoryProducts } from '../../../../shared/schema';

// Define enums for database
export const assessmentTypeEnum = pgEnum("inventory_assessment_type", ["annual", "monthly", "unscheduled", "special"]);
export const valuationMethodEnum = pgEnum("inventory_valuation_method", ["FIFO", "LIFO", "weighted_average", "standard_cost"]);
export const assessmentStatusEnum = pgEnum("inventory_assessment_status", ["draft", "in_progress", "pending_approval", "approved", "finalized", "cancelled"]);
export const countResultEnum = pgEnum("inventory_count_result", ["match", "surplus", "deficit"]);
export const warehouseTypeEnum = pgEnum("warehouse_type", ["depozit", "magazin", "custodie", "transfer"]);

// Warehouse (gestiune) table
export const inventoryWarehouses = pgTable("inventory_warehouses", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull(),
  franchiseId: uuid("franchise_id"),
  name: text("name").notNull(),
  code: text("code"),
  location: text("location"),
  address: text("address"),
  type: warehouseTypeEnum("type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => {
  return {
    nameIdx: index("warehouse_name_idx").on(table.name),
    companyIdx: index("warehouse_company_idx").on(table.companyId),
    codeIdx: index("warehouse_code_idx").on(table.code),
  };
});

// Assessment document table
export const inventoryAssessments = pgTable("inventory_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull(),
  franchiseId: uuid("franchise_id"),
  assessmentNumber: text("assessment_number").notNull(),
  assessmentType: assessmentTypeEnum("assessment_type").notNull(),
  warehouseId: uuid("warehouse_id").notNull(),
  startDate: date("start_date").notNull().defaultNow(),
  endDate: date("end_date"),
  status: assessmentStatusEnum("status").notNull().default("draft"),
  commissionOrderNumber: text("commission_order_number"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  // Additional columns added via migration 20251019
  name: text("name"),
  createdBy: uuid("created_by"),
  legalBasis: text("legal_basis"),
  documentNumber: text("document_number"),
  valuationMethod: text("valuation_method"),
}, (table) => {
  return {
    warehouseIdx: index("warehouse_assessment_idx").on(table.warehouseId),
    companyIdx: index("company_assessment_idx").on(table.companyId),
    dateIdx: index("assessment_date_idx").on(table.startDate),
  };
});

// Assessment items table for products and their counts
export const inventoryAssessmentItems = pgTable("inventory_assessment_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id").notNull().references(() => inventoryAssessments.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull(),
  accountingQuantity: numeric("accounting_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  actualQuantity: numeric("actual_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  batchNo: text("batch_no"),
  expiryDate: date("expiry_date"),
  valuationMethod: valuationMethodEnum("valuation_method").notNull(),
  accountingValue: numeric("accounting_value", { precision: 10, scale: 2 }).notNull().default("0"),
  actualValue: numeric("actual_value", { precision: 10, scale: 2 }).notNull().default("0"),
  differenceQuantity: numeric("difference_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  differenceValue: numeric("difference_value", { precision: 10, scale: 2 }).notNull().default("0"),
  resultType: countResultEnum("result_type").notNull(),
  isProcessed: boolean("is_processed").notNull().default(false),
  countedBy: uuid("counted_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  // Additional column added via migration 20251019
  unitOfMeasure: text("unit_of_measure").default("buc"),
}, (table) => {
  return {
    assessmentIdx: index("assessment_items_idx").on(table.assessmentId),
    productIdx: index("assessment_product_idx").on(table.productId),
  };
});

// Inventory valuation table (for tracking valuation history)
export const inventoryValuations = pgTable("inventory_valuations", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  warehouseId: uuid("warehouse_id").notNull(),
  companyId: uuid("company_id").notNull(),
  franchiseId: uuid("franchise_id"),
  valuationDate: date("valuation_date").notNull().defaultNow(),
  valuationMethod: valuationMethodEnum("valuation_method").notNull(),
  totalQuantity: numeric("total_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  totalValue: numeric("total_value", { precision: 10, scale: 2 }).notNull().default("0"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
  lastPurchasePrice: numeric("last_purchase_price", { precision: 10, scale: 2 }),
  lastValuationDate: date("last_valuation_date"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => {
  return {
    productIdx: index("valuation_product_idx").on(table.productId),
    warehouseIdx: index("valuation_warehouse_idx").on(table.warehouseId),
    dateIdx: index("valuation_date_idx").on(table.valuationDate),
  };
});

// Batch tracking for FIFO/LIFO methods
export const inventoryBatches = pgTable("inventory_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  warehouseId: uuid("warehouse_id").notNull(),
  batchNo: text("batch_no").notNull(),
  purchaseDate: date("purchase_date").notNull(),
  expiryDate: date("expiry_date"),
  initialQuantity: numeric("initial_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  remainingQuantity: numeric("remaining_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull().default("0"),
  totalValue: numeric("total_value", { precision: 10, scale: 2 }).notNull().default("0"),
  nirId: uuid("nir_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => {
  return {
    productIdx: index("batch_product_idx").on(table.productId),
    warehouseIdx: index("batch_warehouse_idx").on(table.warehouseId),
    batchIdx: index("batch_no_idx").on(table.batchNo),
    purchaseDateIdx: index("batch_purchase_date_idx").on(table.purchaseDate),
  };
});

// Relations configuration
export const inventoryWarehousesRelations = relations(inventoryWarehouses, ({ many }) => ({
  assessments: many(inventoryAssessments),
  valuations: many(inventoryValuations),
  batches: many(inventoryBatches)
}));

export const inventoryAssessmentsRelations = relations(inventoryAssessments, ({ many, one }) => ({
  items: many(inventoryAssessmentItems),
  warehouse: one(inventoryWarehouses, {
    fields: [inventoryAssessments.warehouseId],
    references: [inventoryWarehouses.id]
  })
}));

export const inventoryAssessmentItemsRelations = relations(inventoryAssessmentItems, ({ one }) => ({
  assessment: one(inventoryAssessments, {
    fields: [inventoryAssessmentItems.assessmentId],
    references: [inventoryAssessments.id],
  }),
  product: one(inventoryProducts, {
    fields: [inventoryAssessmentItems.productId],
    references: [inventoryProducts.id]
  })
}));

export const inventoryValuationsRelations = relations(inventoryValuations, ({ one }) => ({
  product: one(inventoryProducts, {
    fields: [inventoryValuations.productId],
    references: [inventoryProducts.id]
  }),
  warehouse: one(inventoryWarehouses, {
    fields: [inventoryValuations.warehouseId],
    references: [inventoryWarehouses.id]
  })
}));

export const inventoryBatchesRelations = relations(inventoryBatches, ({ one }) => ({
  product: one(inventoryProducts, {
    fields: [inventoryBatches.productId],
    references: [inventoryProducts.id]
  }),
  warehouse: one(inventoryWarehouses, {
    fields: [inventoryBatches.warehouseId],
    references: [inventoryWarehouses.id]
  })
}));

// Schemas for data validation
export const insertInventoryAssessmentSchema = createInsertSchema(inventoryAssessments);
export const insertInventoryAssessmentItemSchema = createInsertSchema(inventoryAssessmentItems);
export const insertInventoryValuationSchema = createInsertSchema(inventoryValuations);
export const insertInventoryBatchSchema = createInsertSchema(inventoryBatches);
export const insertInventoryWarehouseSchema = createInsertSchema(inventoryWarehouses);

// Export type definitions for TypeScript
export type InventoryWarehouse = typeof inventoryWarehouses.$inferSelect;
export type InventoryAssessment = typeof inventoryAssessments.$inferSelect;
export type InventoryAssessmentItem = typeof inventoryAssessmentItems.$inferSelect;
export type InventoryValuation = typeof inventoryValuations.$inferSelect;
export type InventoryBatch = typeof inventoryBatches.$inferSelect;