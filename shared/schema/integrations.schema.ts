/**
 * Integrations Schema
 * 
 * Schema for managing external service integrations (Stripe, PayPal, etc.)
 */

import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean,
  json,
  pgEnum,
  index
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Integration Provider Enum
 */
export const integrationProviderEnum = pgEnum('integration_provider', [
  'stripe',
  'paypal',
  'shopify',
  'pandadoc',
  'anaf_efactura',
  'google',
  'microsoft',
  'amazon',
  'facebook',
  'twitter',
  'hubspot',
  'mailchimp',
  'quickbooks',
  'xero'
]);

/**
 * Integration Status Enum
 */
export const integrationStatusEnum = pgEnum('integration_status', [
  'active',
  'inactive',
  'failed',
  'pending',
  'disabled'
]);

/**
 * Integrations Table
 * 
 * Stores external service integration configurations and credentials
 */
export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  provider: integrationProviderEnum('provider').notNull(),
  name: text('name'),
  description: text('description'),
  status: integrationStatusEnum('status').default('pending'),
  isConnected: boolean('is_connected').default(false),
  config: json('config').default({}),
  lastSyncedAt: timestamp('last_synced_at'),
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => ({
  companyIdIdx: index('integrations_company_id_idx').on(table.companyId),
  providerIdx: index('integrations_provider_idx').on(table.provider),
  statusIdx: index('integrations_status_idx').on(table.status),
  companyProviderIdx: index('integrations_company_provider_idx').on(table.companyId, table.provider)
}));

// Create insert schema
export const insertIntegrationSchema = createInsertSchema(integrations, {
  config: z.record(z.string(), z.any())
});

// Export types
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

/**
 * TypeScript enum for IntegrationProvider (for type-safe usage in code)
 */
export enum IntegrationProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SHOPIFY = 'shopify',
  PANDADOC = 'pandadoc',
  ANAF_EFACTURA = 'anaf_efactura',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  AMAZON = 'amazon',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  HUBSPOT = 'hubspot',
  MAILCHIMP = 'mailchimp',
  QUICKBOOKS = 'quickbooks',
  XERO = 'xero'
}

