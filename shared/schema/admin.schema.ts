/**
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
 * User Status Enum
 * Represents the possible states of a user account
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  LOCKED = 'locked'
}

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
  edition: varchar('edition', { length: 50 }).default('standard').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  issued_to: varchar('issued_to', { length: 255 }).notNull(),
  issued_email: varchar('issued_email', { length: 255 }).notNull(),
  max_activations: integer('max_activations').default(1).notNull(),
  current_activations: integer('current_activations').default(0).notNull(),
  features: json('features').default({}).notNull(),
  activation_code: varchar('activation_code', { length: 100 }),
  issued_at: timestamp('issued_at').defaultNow().notNull(),
  expires_at: timestamp('expires_at'),
  last_verified: timestamp('last_verified'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
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
 * Users Table
 * Stores user account information
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  first_name: varchar('first_name', { length: 100 }),
  last_name: varchar('last_name', { length: 100 }),
  role: text('role').notNull().default('user'), // Adăugare câmp role care există în baza de date
  status: varchar('status', { length: 20 }).default(UserStatus.ACTIVE).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  // franchise_id a fost eliminat, deoarece nu există în baza de date reală
  // last_login_at a fost eliminat, deoarece nu există în baza de date reală
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Roles Table
 * Defines available roles in the system
 */
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull(), // Câmp obligatoriu care exista deja în BD
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  is_system: boolean('is_system').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * User Roles Junction Table
 * Connects users to their assigned roles
 */
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: varchar('user_id', { length: 36 }).notNull(),
  role_id: varchar('role_id', { length: 36 }).notNull(),
  assigned_at: timestamp('assigned_at').defaultNow().notNull(),
  assigned_by: varchar('assigned_by', { length: 36 }).notNull(),
});

/**
 * Permissions Table
 * Defines individual permissions in the system
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Role Permissions Junction Table
 * Associates roles with their assigned permissions
 */
export const rolePermissions = pgTable('role_permissions', {
  role_id: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permission_id: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.role_id, table.permission_id] }),
  };
});

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

export const insertPermissionSchema = createInsertSchema(permissions); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertRolePermissionSchema = createInsertSchema(rolePermissions);

// TypeScript types for insert operations
export type InsertSetupStep = z.infer<typeof insertSetupStepSchema>;
export type InsertHealthCheck = z.infer<typeof insertHealthCheckSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type InsertCompanyLicense = z.infer<typeof insertCompanyLicenseSchema>;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

// TypeScript types for select operations
export type SetupStep = typeof setup_steps.$inferSelect;
export type HealthCheck = typeof health_checks.$inferSelect;
export type ApiKey = typeof api_keys.$inferSelect;
export type SystemConfig = typeof system_configs.$inferSelect;
export type AdminAction = typeof admin_actions.$inferSelect;
export type CompanyLicense = typeof company_licenses.$inferSelect;
export type Configuration = typeof configurations.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;