/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Admin Module Schema
 * 
 * This file defines the Drizzle ORM schema for the Admin module, which serves as
 * the centralized control center for managing the entire system.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  json,
  integer,
  text,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Setup Steps Table
 * Tracks the completion status of various system setup steps
 */
export const setup_steps = pgTable('setup_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  franchise_id: varchar('franchise_id', { length: 36 }),
  step: varchar('step', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * System Health Checks Table
 * Stores the results of periodic system health checks
 */
export const health_checks = pgTable('health_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  check_type: varchar('check_type', { length: 50 }).notNull(), // e.g., 'database', 'redis', 'storage'
  status: varchar('status', { length: 20 }).notNull(), // 'ok', 'warning', 'error', 'degraded'
  details: json('details'),
  performed_at: timestamp('performed_at').defaultNow().notNull(),
  performed_by: varchar('performed_by', { length: 36 }), // user ID if manually triggered
});

/**
 * API Keys Table
 * Manages API keys for external service integration
 */
export const api_keys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  service: varchar('service', { length: 100 }).notNull(), // e.g., 'stripe', 'twilio'
  key_identifier: varchar('key_identifier', { length: 255 }).notNull(), // partial/masked identifier
  is_active: boolean('is_active').default(true),
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 36 }).notNull(),
  last_used_at: timestamp('last_used_at'),
  last_rotated_at: timestamp('last_rotated_at'),
});

/**
 * System Configurations Table
 * Centralized repository for system-wide configuration settings
 */
export const system_configs = pgTable('system_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: varchar('company_id', { length: 36 }),
  module: varchar('module', { length: 100 }).notNull(),
  key: varchar('key', { length: 255 }).notNull(),
  value: json('value').notNull(),
  is_encrypted: boolean('is_encrypted').default(false),
  description: varchar('description', { length: 500 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 36 }).notNull(),
  updated_by: varchar('updated_by', { length: 36 }).notNull(),
});

/**
 * Admin Actions Log Table
 * Tracks administrative actions for auditing purposes
 */
export const admin_actions = pgTable('admin_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  action_type: varchar('action_type', { length: 100 }).notNull(), // e.g., 'user_impersonation', 'config_change'
  performed_by: varchar('performed_by', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  target_resource: varchar('target_resource', { length: 255 }),
  target_id: varchar('target_id', { length: 36 }),
  details: json('details'),
  performed_at: timestamp('performed_at').defaultNow().notNull(),
  ip_address: varchar('ip_address', { length: 50 }),
});

/**
 * Licenses Table
 * Manages software licensing information
 */
export const licenses = pgTable('licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  license_key: varchar('license_key', { length: 100 }).notNull().unique(),
  edition: varchar('edition', { length: 50 }).default('basic').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  issued_to: varchar('issued_to', { length: 255 }).notNull(),
  issued_email: varchar('issued_email', { length: 255 }).notNull(),
  max_activations: integer('max_activations').default(1).notNull(),
  current_activations: integer('current_activations').default(0).notNull(),
  features: json('features').default({}).notNull(),
  activation_code: varchar('activation_code', { length: 100 }),
  issued_at: timestamp('issued_at').defaultNow(),
  expires_at: timestamp('expires_at'),
  last_verified: timestamp('last_verified'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

/**
 * Company Licenses Table
 * Manages licensing information for companies/tenants
 */
export const company_licenses = pgTable('company_licenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  license_type: varchar('license_type', { length: 100 }).notNull(), // 'standard', 'professional', 'enterprise'
  max_users: integer('max_users'),
  features: json('features'), // enabled features
  is_active: boolean('is_active').default(true),
  starts_at: timestamp('starts_at').notNull(),
  expires_at: timestamp('expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 36 }).notNull(),
  updated_by: varchar('updated_by', { length: 36 }).notNull(),
});

/**
 * IMPORTANT: Users, Roles, Permissions tables are now defined in ../schema.ts
 * This file previously had duplicate definitions that caused mapping inconsistencies.
 * All user-related tables now use camelCase in TypeScript with snake_case mapping to PostgreSQL.
 * 
 * Import from '@geniuserp/shared' to use:
 * - users (table)
 * - roles (table)  
 * - userRoles (table)
 * - permissions (table)
 * - rolePermissions (table)
 */

/**
 * System Configurations Table
 * Stores configuration values for all modules with proper scoping
 */
export const configurations = pgTable('configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull(),
  value: json('value').notNull(),
  scope: varchar('scope', { length: 50 }).notNull().default('global'), // 'global', 'company', 'user', 'module'
  company_id: varchar('company_id', { length: 36 }),
  user_id: varchar('user_id', { length: 36 }),
  module_id: varchar('module_id', { length: 100 }),
  description: varchar('description', { length: 500 }),
  is_encrypted: boolean('is_encrypted').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
});

// Zod insert schemas for validation
export const insertSetupStepSchema = createInsertSchema(setup_steps); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertHealthCheckSchema = createInsertSchema(health_checks); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertApiKeySchema = createInsertSchema(api_keys); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertSystemConfigSchema = createInsertSchema(system_configs); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertAdminActionSchema = createInsertSchema(admin_actions); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertCompanyLicenseSchema = createInsertSchema(company_licenses); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertConfigurationSchema = createInsertSchema(configurations); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertLicenseSchema = createInsertSchema(licenses); // Fixed: removed omit() for drizzle-zod compatibility;

// Note: Permission and RolePermission schemas are in ../schema.ts

// TypeScript types for insert operations
export type InsertSetupStep = z.infer<typeof insertSetupStepSchema>;
export type InsertHealthCheck = z.infer<typeof insertHealthCheckSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type InsertCompanyLicense = z.infer<typeof insertCompanyLicenseSchema>;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;

// Note: InsertPermission and InsertRolePermission types are in ../schema.ts

// TypeScript types for select operations
export type SetupStep = typeof setup_steps.$inferSelect;
export type HealthCheck = typeof health_checks.$inferSelect;
export type ApiKey = typeof api_keys.$inferSelect;
export type SystemConfig = typeof system_configs.$inferSelect;
export type AdminAction = typeof admin_actions.$inferSelect;
export type CompanyLicense = typeof company_licenses.$inferSelect;
export type Configuration = typeof configurations.$inferSelect;
export type License = typeof licenses.$inferSelect;

// Note: User, Role, UserRole, Permission, RolePermission types are exported from ../schema.ts
// to avoid duplicate type definitions and ensure consistent camelCase/snake_case mapping