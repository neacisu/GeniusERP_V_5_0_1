/**
 * Inventory Assessment Types
 * 
 * Type definitions for the Romanian inventory assessment process ("Inventariere")
 * Compliant with Romanian Accounting Standards OMFP 1802/2014 and OMFP 2861/2009
 */

import { z } from "zod";

// Enum values for inventory assessment types
export const inventoryAssessmentTypeEnum = {
  enumValues: ['annual', 'monthly', 'unscheduled', 'special'] as const
};

// Enum values for inventory valuation methods
export const valuationMethodEnum = {
  enumValues: ['FIFO', 'LIFO', 'weighted_average', 'standard_cost'] as const
};

// Enum values for inventory assessment status
export const assessmentStatusEnum = {
  enumValues: ['draft', 'in_progress', 'pending_approval', 'approved', 'finalized', 'cancelled'] as const
};

// Enum values for inventory count results
export const countResultEnum = {
  enumValues: ['match', 'surplus', 'deficit'] as const
};

// Basic types for inventory assessment process
export type InventoryAssessment = {
  id: string;
  companyId: string;
  franchiseId?: string | null;
  assessmentNumber: string;
  assessmentType: typeof inventoryAssessmentTypeEnum.enumValues[number];
  warehouseId: string;
  startDate: Date;
  endDate?: Date | null;
  status: typeof assessmentStatusEnum.enumValues[number];
  commissionOrderNumber?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InventoryAssessmentItem = {
  id: string;
  assessmentId: string;
  productId: string;
  accountingQuantity: number; // Theoretical quantity from records
  actualQuantity: number; // Actual quantity counted
  batchNo?: string | null;
  expiryDate?: Date | null;
  valuationMethod: typeof valuationMethodEnum.enumValues[number];
  accountingValue: number; // Value in accounting records
  actualValue: number; // Value after inventory
  differenceQuantity: number; // actualQuantity - accountingQuantity
  differenceValue: number; // actualValue - accountingValue
  resultType: typeof countResultEnum.enumValues[number];
  isProcessed: boolean; // Indicates if difference has been processed in accounting
  countedBy?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InventoryValuation = {
  id: string;
  productId: string;
  warehouseId: string;
  companyId: string;
  franchiseId?: string | null;
  valuationDate: Date;
  valuationMethod: typeof valuationMethodEnum.enumValues[number];
  totalQuantity: number;
  totalValue: number;
  unitPrice: number; // Calculated price using the selected method
  lastPurchasePrice?: number | null;
  lastValuationDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InventoryBatch = {
  id: string;
  productId: string;
  warehouseId: string;
  batchNo: string;
  purchaseDate: Date;
  expiryDate?: Date | null;
  initialQuantity: number;
  remainingQuantity: number;
  purchasePrice: number;
  totalValue: number;
  nirId?: string | null; // Reference to NIR document
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Schemas for validation
export const insertAssessmentSchema = z.object({
  companyId: z.string().uuid(),
  franchiseId: z.string().uuid().optional().nullable(),
  assessmentNumber: z.string().min(3),
  assessmentType: z.enum(inventoryAssessmentTypeEnum.enumValues),
  warehouseId: z.string().uuid(),
  startDate: z.date().default(() => new Date()),
  endDate: z.date().optional().nullable(),
  status: z.enum(assessmentStatusEnum.enumValues).default('draft'),
  commissionOrderNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const insertAssessmentItemSchema = z.object({
  assessmentId: z.string().uuid(),
  productId: z.string().uuid(),
  accountingQuantity: z.number(),
  actualQuantity: z.number(),
  batchNo: z.string().optional().nullable(),
  expiryDate: z.date().optional().nullable(),
  valuationMethod: z.enum(valuationMethodEnum.enumValues),
  accountingValue: z.number(),
  actualValue: z.number(),
  differenceQuantity: z.number(),
  differenceValue: z.number(),
  resultType: z.enum(countResultEnum.enumValues),
  isProcessed: z.boolean().default(false),
  countedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const insertInventoryValuationSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  companyId: z.string().uuid(),
  franchiseId: z.string().uuid().optional().nullable(),
  valuationDate: z.date().default(() => new Date()),
  valuationMethod: z.enum(valuationMethodEnum.enumValues),
  totalQuantity: z.number(),
  totalValue: z.number(),
  unitPrice: z.number(),
  lastPurchasePrice: z.number().optional().nullable(),
  lastValuationDate: z.date().optional().nullable()
});

export const insertInventoryBatchSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  batchNo: z.string(),
  purchaseDate: z.date(),
  expiryDate: z.date().optional().nullable(),
  initialQuantity: z.number().positive(),
  remainingQuantity: z.number(),
  purchasePrice: z.number().nonnegative(),
  totalValue: z.number(),
  nirId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true)
});

// Insert types for type safety
export type InsertInventoryAssessment = z.infer<typeof insertAssessmentSchema>;
export type InsertInventoryAssessmentItem = z.infer<typeof insertAssessmentItemSchema>;
export type InsertInventoryValuation = z.infer<typeof insertInventoryValuationSchema>;
export type InsertInventoryBatch = z.infer<typeof insertInventoryBatchSchema>;

// Extended schemas with additional validation for API endpoints
export const createAssessmentSchema = insertAssessmentSchema;
export const createAssessmentItemSchema = insertAssessmentItemSchema;
export const createInventoryValuationSchema = insertInventoryValuationSchema;
export const createInventoryBatchSchema = insertInventoryBatchSchema;