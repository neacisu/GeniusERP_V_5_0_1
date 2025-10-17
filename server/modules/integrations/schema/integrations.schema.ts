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
  SHOPIFY_INBOX = 'shopify_inbox',
  PRESTASHOP = 'prestashop',
  WOOCOMMERCE = 'woocommerce',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  EMAIL = 'email',
  SMS = 'sms',
  ANAF = 'anaf',
  ANAF_EFACTURA = 'anaf_efactura',
  REVISAL = 'revisal',
  REVOLUT_BUSINESS = 'revolut_business',
  PANDADOC = 'pandadoc',
  MICROSOFT_GRAPH = 'microsoft_graph',
  MICROSOFT = 'microsoft',
  GOOGLE = 'google',
  SAMEDAY = 'sameday',
  TERMENE_RO = 'termene_ro',
  OPENAI = 'openai',
  ELEVENLABS = 'elevenlabs',
  AMAZON = 'amazon',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  HUBSPOT = 'hubspot',
  MAILCHIMP = 'mailchimp',
  QUICKBOOKS = 'quickbooks',
  XERO = 'xero'
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
export const integrationProviderEnum = pgEnum('integration_provider', [
  'shopify_admin', 'shopify_storefront', 'shopify_inbox', 'prestashop', 'woocommerce',
  'stripe', 'paypal', 'email', 'sms', 'anaf', 'anaf_efactura', 'revisal',
  'revolut_business', 'pandadoc', 'microsoft_graph', 'microsoft', 'google',
  'sameday', 'termene_ro', 'openai', 'elevenlabs', 'amazon', 'facebook',
  'twitter', 'hubspot', 'mailchimp', 'quickbooks', 'xero'
]);

/**
 * Integration status enum for database
 */
export const integrationStatusEnum = pgEnum('integration_status', [
  'active', 'inactive', 'pending', 'error'
]);

/**
 * Integrations table - Stores external service integration configurations
 */
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  franchiseId: uuid("franchise_id"),
  provider: integrationProviderEnum("provider").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  config: json("config").default({}),
  isConnected: boolean("is_connected").default(false),
  status: integrationStatusEnum("status").default(IntegrationStatus.INACTIVE),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
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
  config: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
}); // Fixed: removed omit() for drizzle-zod compatibility

// Create update schema for integrations
export const updateIntegrationSchema = createInsertSchema(integrations, {
  config: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional()
}).partial(); // Fixed: removed omit() for drizzle-zod compatibility

// Export types
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type UpdateIntegration = z.infer<typeof updateIntegrationSchema>;