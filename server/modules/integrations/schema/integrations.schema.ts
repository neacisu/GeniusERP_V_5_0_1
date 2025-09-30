/**
 * Integrations Schema - Drizzle ORM Definitions
 * 
 * This file defines the schema for the Integrations module tables using Drizzle ORM.
 * These tables are used to store external service integration configurations.
 */

import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean, 
  primaryKey,
  json,
  pgEnum,
  unique,
  index
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Integration provider enum
 */
export enum IntegrationProvider {
  SHOPIFY_ADMIN = 'shopify_admin',
  SHOPIFY_STOREFRONT = 'shopify_storefront',
  PRESTASHOP = 'prestashop',
  WOOCOMMERCE = 'woocommerce',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  EMAIL = 'email',
  SMS = 'sms',
  ANAF = 'anaf',
  REVISAL = 'revisal',
  API = 'api'
}

/**
 * Integration status enum
 */
export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ERROR = 'error'
}

/**
 * Integration provider enum for database
 */
export const integrationProviderEnum = pgEnum('integration_provider', Object.values(IntegrationProvider));

/**
 * Integration status enum for database
 */
export const integrationStatusEnum = pgEnum('integration_status', Object.values(IntegrationStatus));

/**
 * Integrations table - Stores external service integration configurations
 */
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  provider: integrationProviderEnum("provider").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  config: json("config").default({}),
  isConnected: boolean("is_connected").default(false),
  status: integrationStatusEnum("status").default(IntegrationStatus.INACTIVE),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => ({
  companyIndex: index("integrations_company_idx").on(table.companyId),
  providerIndex: index("integrations_provider_idx").on(table.provider),
  uniqueCompanyProvider: unique("unique_company_provider").on(table.companyId, table.provider)
}));

// Create insert schema for integrations
export const insertIntegrationSchema = createInsertSchema(integrations, {
  config: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Create update schema for integrations
export const updateIntegrationSchema = createInsertSchema(integrations, {
  config: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
}).omit({
  id: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true
}).partial();

// Export types
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type UpdateIntegration = z.infer<typeof updateIntegrationSchema>;