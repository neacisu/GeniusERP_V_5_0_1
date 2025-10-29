/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Inventory Assessment Schema
 * 
 * This schema defines the data model for the Romanian "Inventariere" process
 * as required by Romanian accounting regulations (OMFP 2861/2009, Law 82/1991).
 * It includes all necessary tables, relations, and types for compliant inventory management.
 */

import { pgTable, text, uuid, timestamp, boolean, pgEnum, smallint, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Define custom enum types for inventory assessment
export const warehouseTypeEnum = {
  DEPOZIT: 'depozit',
  MAGAZIN: 'magazin',
  CUSTODIE: 'custodie',
  TRANSFER: 'transfer'
} as const;

export const inventoryAssessmentTypeEnum = {
  ANNUAL: 'annual',
  MONTHLY: 'monthly',
  UNSCHEDULED: 'unscheduled',
  SPECIAL: 'special'
} as const;

export const inventoryAssessmentStatusEnum = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  FINALIZED: 'finalized',
  CANCELLED: 'cancelled'
} as const;

export const inventoryValuationMethodEnum = {
  FIFO: 'FIFO',
  LIFO: 'LIFO',
  WEIGHTED_AVERAGE: 'WEIGHTED_AVERAGE',
  STANDARD_COST: 'STANDARD_COST'
} as const;

export const inventoryCountResultEnum = {
  MATCH: 'MATCH',
  SURPLUS: 'SURPLUS',
  DEFICIT: 'DEFICIT'
} as const;

// Create PostgreSQL enum types
export const warehouseTypeEnumType = pgEnum('warehouse_type', ['depozit', 'magazin', 'custodie', 'transfer']);
export const assessmentTypeEnumType = pgEnum('inventory_assessment_type', ['annual', 'monthly', 'unscheduled', 'special']);
export const assessmentStatusEnumType = pgEnum('inventory_assessment_status', ['draft', 'in_progress', 'pending_approval', 'approved', 'finalized', 'cancelled']);
export const valuationMethodEnumType = pgEnum('inventory_valuation_method', ['FIFO', 'LIFO', 'WEIGHTED_AVERAGE', 'STANDARD_COST']);
export const countResultEnumType = pgEnum('inventory_count_result', ['MATCH', 'SURPLUS', 'DEFICIT']);

// Define warehouse table
export const inventory_warehouses = pgTable('inventory_warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  type: warehouseTypeEnumType('type').notNull(),
  address: text('address'),
  location: text('location'),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
});

// Define inventory assessment table
export const inventory_assessments = pgTable('inventory_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  warehouseId: uuid('warehouse_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  documentNumber: text('document_number').notNull(),
  type: assessmentTypeEnumType('assessment_type').notNull(),
  status: assessmentStatusEnumType('status').notNull().default('draft'),
  startDate: timestamp('start_date').notNull().defaultNow(),
  endDate: timestamp('end_date'),
  legalBasis: text('legal_basis'),
  valuationMethod: valuationMethodEnumType('valuation_method'),
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  finalizedBy: uuid('finalized_by'),
  finalizedAt: timestamp('finalized_at'),
  cancelledBy: uuid('cancelled_by'),
  cancelledAt: timestamp('cancelled_at')
});

// Define inventory assessment items table
export const inventory_assessment_items = pgTable('inventory_assessment_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id').notNull().references(() => inventory_assessments.id),
  productId: uuid('product_id').notNull(),
  theoreticalQuantity: numeric('theoretical_quantity').notNull(),
  actualQuantity: numeric('actual_quantity'),
  unitOfMeasure: text('unit_of_measure').notNull(),
  theoreticalValue: numeric('theoretical_value'),
  actualValue: numeric('actual_value'),
  difference: numeric('difference'),
  valueDifference: numeric('value_difference'),
  countResult: countResultEnumType('count_result'),
  notes: text('notes'),
  countedBy: uuid('counted_by'),
  countedAt: timestamp('counted_at'),
  processedBy: uuid('processed_by'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
});

// Define inventory valuation table
export const inventory_valuations = pgTable('inventory_valuations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  productId: uuid('product_id').notNull(),
  warehouseId: uuid('warehouse_id').notNull(),
  method: valuationMethodEnumType('method').notNull(),
  quantity: numeric('quantity').notNull(),
  unitValue: numeric('unit_value').notNull(),
  totalValue: numeric('total_value').notNull(),
  valuationDate: timestamp('valuation_date').notNull(),
  referenceDocument: text('reference_document'),
  referenceId: uuid('reference_id'),
  assessmentId: uuid('assessment_id').references(() => inventory_assessments.id),
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
});

// Define inventory batches table
export const inventory_batches = pgTable('inventory_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  productId: uuid('product_id').notNull(),
  warehouseId: uuid('warehouse_id').notNull(),
  batchNumber: text('batch_number').notNull(),
  purchasePrice: numeric('purchase_price').notNull(),
  quantity: numeric('quantity').notNull(),
  remainingQuantity: numeric('remaining_quantity').notNull().default('0'),
  purchaseDate: timestamp('purchase_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  supplier: text('supplier'),
  invoiceNumber: text('invoice_number'),
  notes: text('notes'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
});

// Setup relations
// Note: Relations la companies vor fi stabilite în schema principală
export const warehouseRelations = relations(inventory_warehouses, ({ one, many }) => ({
  parent: one(inventory_warehouses, {
    fields: [inventory_warehouses.parentId],
    references: [inventory_warehouses.id]
  }),
  children: many(inventory_warehouses),
  assessments: many(inventory_assessments)
}));

export const assessmentRelations = relations(inventory_assessments, ({ one, many }) => ({
  warehouse: one(inventory_warehouses, {
    fields: [inventory_assessments.warehouseId],
    references: [inventory_warehouses.id]
  }),
  items: many(inventory_assessment_items),
  valuations: many(inventory_valuations)
}));

export const assessmentItemRelations = relations(inventory_assessment_items, ({ one }) => ({
  assessment: one(inventory_assessments, {
    fields: [inventory_assessment_items.assessmentId],
    references: [inventory_assessments.id]
  })
  // Note: Relația la product va fi stabilită în schema principală
}));

// Create Zod validation schemas
// Notă: Schema warehouse este exportată din warehouse.ts pentru a evita duplicarea
const insertWarehouseSchemaLocal = createInsertSchema(inventory_warehouses, {
  type: z.enum([
    warehouseTypeEnum.DEPOZIT, 
    warehouseTypeEnum.MAGAZIN, 
    warehouseTypeEnum.CUSTODIE, 
    warehouseTypeEnum.TRANSFER
  ]),
  code: z.string().optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertAssessmentSchema = createInsertSchema(inventory_assessments, {
  type: z.enum([
    inventoryAssessmentTypeEnum.ANNUAL,
    inventoryAssessmentTypeEnum.MONTHLY,
    inventoryAssessmentTypeEnum.UNSCHEDULED,
    inventoryAssessmentTypeEnum.SPECIAL
  ]),
  status: z.enum([
    inventoryAssessmentStatusEnum.DRAFT,
    inventoryAssessmentStatusEnum.IN_PROGRESS,
    inventoryAssessmentStatusEnum.PENDING_APPROVAL,
    inventoryAssessmentStatusEnum.APPROVED,
    inventoryAssessmentStatusEnum.FINALIZED,
    inventoryAssessmentStatusEnum.CANCELLED
  ]).optional(),
  valuationMethod: z.enum([
    inventoryValuationMethodEnum.FIFO,
    inventoryValuationMethodEnum.LIFO,
    inventoryValuationMethodEnum.WEIGHTED_AVERAGE,
    inventoryValuationMethodEnum.STANDARD_COST
  ]).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertAssessmentItemSchema = createInsertSchema(inventory_assessment_items, {
  countResult: z.enum([
    inventoryCountResultEnum.MATCH,
    inventoryCountResultEnum.SURPLUS,
    inventoryCountResultEnum.DEFICIT
  ]).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertValuationSchema = createInsertSchema(inventory_valuations, {
  method: z.enum([
    inventoryValuationMethodEnum.FIFO,
    inventoryValuationMethodEnum.LIFO,
    inventoryValuationMethodEnum.WEIGHTED_AVERAGE,
    inventoryValuationMethodEnum.STANDARD_COST
  ])
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertBatchSchema = createInsertSchema(inventory_batches)
  ; // Fixed: removed omit() for drizzle-zod compatibility;

// Create types
// Notă: Tipurile Warehouse și InsertWarehouse sunt exportate din warehouse.ts
// pentru a evita conflicte de export. Folosim tipuri locale aici dacă e necesar.
type WarehouseLocal = typeof inventory_warehouses.$inferSelect;
type InsertWarehouseLocal = z.infer<typeof insertWarehouseSchemaLocal>;

export type InventoryAssessment = typeof inventory_assessments.$inferSelect;
export type InsertInventoryAssessment = z.infer<typeof insertAssessmentSchema>;

export type InventoryAssessmentItem = typeof inventory_assessment_items.$inferSelect;
export type InsertInventoryAssessmentItem = z.infer<typeof insertAssessmentItemSchema>;

export type InventoryValuation = typeof inventory_valuations.$inferSelect;
export type InsertInventoryValuation = z.infer<typeof insertValuationSchema>;

export type InventoryBatch = typeof inventory_batches.$inferSelect;
export type InsertInventoryBatch = z.infer<typeof insertBatchSchema>;