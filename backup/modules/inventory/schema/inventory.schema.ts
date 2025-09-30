/**
 * Inventory Schema Definitions
 * 
 * This module defines types and schema for the inventory module,
 * including warehouse types, NIR documents, and stock management.
 * Uses Zod for validation without direct Drizzle ORM dependencies.
 */

import { z } from "zod";

// Enum values from database schema
export const gestiuneTypeEnum = {
  enumValues: ['depozit', 'magazin', 'custodie', 'transfer'] as const
};

export const stockTrackingTypeEnum = {
  enumValues: ['QUANTITATIVE', 'QUANTITATIVE_VALUE', 'VALUE_ONLY'] as const
};

export const nirStatusEnum = {
  enumValues: ['draft', 'pending', 'approved', 'rejected'] as const
};

export const transferStatusEnum = {
  enumValues: ['draft', 'issued', 'in_transit', 'received', 'cancelled'] as const
};

export const purchaseOrderStatusEnum = {
  enumValues: ['draft', 'sent', 'partial', 'complete', 'cancelled'] as const
};

// Basic types for inventory entities defined manually
export type Warehouse = {
  id: string;
  companyId: string;
  franchiseId?: string | null;
  name: string;
  code: string;
  type: typeof gestiuneTypeEnum.enumValues[number];
  trackingType: typeof stockTrackingTypeEnum.enumValues[number];
  location?: string | null;
  responsible?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Stock = {
  id: string;
  productId: string;
  warehouseId: string;
  companyId: string;
  franchiseId?: string | null;
  quantity: number;
  reservedQuantity?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  totalValue?: number;
  batchNo?: string | null;
  expiryDate?: Date | null;
  lastUpdatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Product = {
  id: string;
  companyId: string;
  franchiseId?: string | null;
  name: string;
  code: string;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  categoryId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// NIR Document types
export type NirDocument = {
  id: string;
  companyId: string;
  franchiseId?: string | null;
  nirNumber: string;
  warehouseId: string;
  warehouseType: string;
  isCustody?: boolean;
  supplierId: string;
  supplierInvoiceNumber?: string | null;
  receiptDate: Date;
  status: typeof nirStatusEnum.enumValues[number];
  approvedBy?: string | null;
  approvedAt?: Date | null;
  totalValueNoVat: number;
  totalVat: number;
  totalValueWithVat: number;
  currency?: string;
  exchangeRate?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type NirItem = {
  id: string;
  nirId: string;
  productId: string;
  quantity: number;
  batchNo?: string | null;
  expiryDate?: Date | null;
  purchasePrice: number;
  purchasePriceWithVat?: number;
  sellingPrice?: number;
  sellingPriceWithVat?: number;
  vatRate: number;
  vatValue: number;
  totalValueNoVat: number;
  totalValueWithVat: number;
  createdAt: Date;
};

// Transfer Document types
export type TransferDocument = {
  id: string;
  companyId: string;
  franchiseId?: string | null;
  referenceNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  transferDate: Date;
  status: typeof transferStatusEnum.enumValues[number];
  issuedBy?: string | null;
  issuedAt?: Date | null;
  receivedBy?: string | null;
  receivedAt?: Date | null;
  totalValueNoVat: number;
  totalVat: number;
  totalValueWithVat: number;
  currency?: string;
  exchangeRate?: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TransferItem = {
  id: string;
  transferId: string;
  productId: string;
  quantity: number;
  batchNo?: string | null;
  expiryDate?: Date | null;
  unitPrice: number;
  unitPriceWithVat?: number;
  vatRate: number;
  vatValue: number;
  totalValueNoVat: number;
  totalValueWithVat: number;
  createdAt: Date;
};

// Purchase Order types
export type PurchaseOrder = {
  id: string;
  companyId: string;
  franchiseId?: string | null;
  poNumber: string;
  warehouseId: string;
  supplierId: string;
  orderDate: Date;
  expectedDeliveryDate?: Date | null;
  status: typeof purchaseOrderStatusEnum.enumValues[number];
  approvedBy?: string | null;
  approvedAt?: Date | null;
  totalValueNoVat: number;
  totalVat: number;
  totalValueWithVat: number;
  currency?: string;
  exchangeRate?: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PurchaseOrderItem = {
  id: string;
  poId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitPriceWithVat?: number;
  vatRate: number;
  vatValue: number;
  totalValueNoVat: number;
  totalValueWithVat: number;
  createdAt: Date;
};

// Zod schemas for validation
export const insertWarehouseSchema = z.object({
  companyId: z.string().uuid(),
  franchiseId: z.string().uuid().optional().nullable(),
  name: z.string().min(3).max(100),
  code: z.string().min(2).max(20),
  type: z.enum(gestiuneTypeEnum.enumValues),
  trackingType: z.enum(stockTrackingTypeEnum.enumValues),
  location: z.string().max(255).optional().nullable(),
  responsible: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true)
});

export const insertNirDocumentSchema = z.object({
  companyId: z.string().uuid(),
  franchiseId: z.string().uuid().optional().nullable(),
  nirNumber: z.string().min(3),
  warehouseId: z.string().uuid(),
  warehouseType: z.string(),
  isCustody: z.boolean().optional().default(false),
  supplierId: z.string().uuid(),
  supplierInvoiceNumber: z.string().optional().nullable(),
  receiptDate: z.date().default(() => new Date()),
  status: z.enum(nirStatusEnum.enumValues).default('draft'),
  totalValueNoVat: z.number().default(0),
  totalVat: z.number().default(0),
  totalValueWithVat: z.number().default(0),
  currency: z.string().optional().default('RON'),
  exchangeRate: z.number().optional().default(1),
});

export const insertNirItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  batchNo: z.string().optional().nullable(),
  expiryDate: z.date().optional().nullable(),
  purchasePrice: z.number().nonnegative(),
  purchasePriceWithVat: z.number().optional(),
  sellingPrice: z.number().optional(),
  sellingPriceWithVat: z.number().optional(),
  vatRate: z.number().nonnegative().default(19),
  vatValue: z.number().optional().default(0),
  totalValueNoVat: z.number().optional().default(0),
  totalValueWithVat: z.number().optional().default(0)
});

export const insertTransferDocumentSchema = z.object({
  companyId: z.string().uuid(),
  franchiseId: z.string().uuid().optional().nullable(),
  referenceNumber: z.string().min(3),
  sourceWarehouseId: z.string().uuid(),
  destinationWarehouseId: z.string().uuid(),
  transferDate: z.date().default(() => new Date()),
  status: z.enum(transferStatusEnum.enumValues).default('draft'),
  totalValueNoVat: z.number().default(0),
  totalVat: z.number().default(0),
  totalValueWithVat: z.number().default(0),
  currency: z.string().optional().default('RON'),
  exchangeRate: z.number().optional().default(1),
  notes: z.string().optional().nullable()
});

export const insertTransferItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  batchNo: z.string().optional().nullable(),
  expiryDate: z.date().optional().nullable(),
  unitPrice: z.number().nonnegative(),
  unitPriceWithVat: z.number().optional(),
  vatRate: z.number().nonnegative().default(19),
  vatValue: z.number().optional().default(0),
  totalValueNoVat: z.number().optional().default(0),
  totalValueWithVat: z.number().optional().default(0)
});

export const insertPurchaseOrderSchema = z.object({
  companyId: z.string().uuid(),
  franchiseId: z.string().uuid().optional().nullable(),
  poNumber: z.string().min(3),
  warehouseId: z.string().uuid(),
  supplierId: z.string().uuid(),
  orderDate: z.date().default(() => new Date()),
  expectedDeliveryDate: z.date().optional().nullable(),
  status: z.enum(purchaseOrderStatusEnum.enumValues).default('draft'),
  totalValueNoVat: z.number().default(0),
  totalVat: z.number().default(0),
  totalValueWithVat: z.number().default(0),
  currency: z.string().optional().default('RON'),
  exchangeRate: z.number().optional().default(1),
  notes: z.string().optional().nullable()
});

export const insertPurchaseOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  unitPriceWithVat: z.number().optional(),
  vatRate: z.number().nonnegative().default(19),
  vatValue: z.number().optional().default(0),
  totalValueNoVat: z.number().optional().default(0),
  totalValueWithVat: z.number().optional().default(0)
});

// Insert types for type safety
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type InsertNirDocument = z.infer<typeof insertNirDocumentSchema>;
export type InsertNirItem = z.infer<typeof insertNirItemSchema>;
export type InsertTransferDocument = z.infer<typeof insertTransferDocumentSchema>;
export type InsertTransferItem = z.infer<typeof insertTransferItemSchema>;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;

// Extended schemas with additional validation for API endpoints
export const createWarehouseSchema = insertWarehouseSchema;
export const createNirDocumentSchema = insertNirDocumentSchema;
export const createNirItemSchema = insertNirItemSchema;
export const createTransferDocumentSchema = insertTransferDocumentSchema;
export const createTransferItemSchema = insertTransferItemSchema;
export const createPurchaseOrderSchema = insertPurchaseOrderSchema;
export const createPurchaseOrderItemSchema = insertPurchaseOrderItemSchema;