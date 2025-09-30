/**
 * Warehouse Schema Definition
 * 
 * This file defines the schema for the warehouses table, which is the main
 * warehouse data structure used across the application.
 */

import { pgTable, text, uuid, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Define warehouse type enum
export const warehouseTypeEnum = {
  DEPOZIT: 'depozit',
  MAGAZIN: 'magazin',
  CUSTODIE: 'custodie',
  TRANSFER: 'transfer'
} as const;

// Create PostgreSQL enum type for warehouse type
export const warehouseTypeEnumType = pgEnum('gestiune_type', ['depozit', 'magazin', 'custodie', 'transfer']);

// Define warehouse table schema for the existing warehouses table
export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  name: text('name').notNull(),
  code: text('code').notNull(),
  location: text('location'),
  address: text('address'),
  type: warehouseTypeEnumType('type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Create insert schema using Zod
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true, 
  updatedAt: true
});

// Type definitions
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;