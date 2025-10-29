/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Core Schema - Fundamental Tables
 * 
 * Contains essential tables for system operation:
 * - RBAC (users, roles, permissions)
 * - Chart of Accounts (account hierarchy)
 * 
 * All table and variable names standardized to match database exactly.
 */

import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  integer,
  index,
  unique,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Forward references (resolved when all schemas combined)
declare const companies: any;

// ============================================================================
// RBAC TABLES
// ============================================================================

/**
 * Users table
 * System users with authentication and profile information
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  first_name: varchar('first_name', { length: 100 }),
  last_name: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  avatar_url: text('avatar_url'),
  company_id: uuid('company_id'),
  is_active: boolean('is_active').notNull().default(true),
  is_verified: boolean('is_verified').notNull().default(false),
  email_verified_at: timestamp('email_verified_at'),
  last_login_at: timestamp('last_login_at'),
  last_login_ip: varchar('last_login_ip', { length: 50 }),
  failed_login_attempts: integer('failed_login_attempts').default(0),
  locked_until: timestamp('locked_until'),
  password_changed_at: timestamp('password_changed_at'),
  force_password_change: boolean('force_password_change').default(false),
  two_factor_enabled: boolean('two_factor_enabled').default(false),
  two_factor_secret: text('two_factor_secret'),
  backup_codes: text('backup_codes'),
  
  // MFA fields (missing from schema)
  mfa_enabled: boolean('mfa_enabled').default(false),
  mfa_secret: text('mfa_secret'),
  mfa_backup_codes: text('mfa_backup_codes'),
  role: text('role').notNull().default('user'),
  
  preferences: text('preferences'),
  locale: varchar('locale', { length: 10 }).default('ro'),
  timezone: varchar('timezone', { length: 50 }).default('Europe/Bucharest'),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`),
  created_by: uuid('created_by'),
  updated_by: uuid('updated_by'),
  deleted_at: timestamp('deleted_at')
}, (table) => ({
  email_unique: unique('users_email_unique').on(table.email),
  username_unique: unique('users_username_unique').on(table.username),
  email_idx: index('users_email_idx').on(table.email),
  username_idx: index('users_username_idx').on(table.username),
  company_idx: index('users_company_idx').on(table.company_id),
  active_idx: index('users_active_idx').on(table.is_active),
}));

/**
 * Roles table
 * User roles for RBAC system
 */
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  company_id: uuid('company_id'),
  is_system_role: boolean('is_system_role').default(false),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`),
  created_by: uuid('created_by'),
  updated_by: uuid('updated_by')
}, (table) => ({
  name_idx: index('roles_name_idx').on(table.name),
  company_idx: index('roles_company_idx').on(table.company_id),
}));

/**
 * Permissions table
 * System permissions for granular access control
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  resource: varchar('resource', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  is_system_permission: boolean('is_system_permission').default(true),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  name_unique: unique('permissions_name_unique').on(table.name),
  resource_action_idx: index('permissions_resource_action_idx').on(table.resource, table.action),
}));

/**
 * User Roles junction table
 * Many-to-Many relationship between users and roles
 */
export const user_roles = pgTable('user_roles', {
  user_id: uuid('user_id').notNull(),
  role_id: uuid('role_id').notNull(),
  assigned_at: timestamp('assigned_at').default(sql`now()`),
  assigned_by: uuid('assigned_by')
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.role_id] }),
  user_idx: index('user_roles_user_idx').on(table.user_id),
  role_idx: index('user_roles_role_idx').on(table.role_id),
}));

/**
 * Role Permissions junction table
 * Many-to-Many relationship between roles and permissions
 */
export const role_permissions = pgTable('role_permissions', {
  role_id: uuid('role_id').notNull(),
  permission_id: uuid('permission_id').notNull(),
  granted_at: timestamp('granted_at').default(sql`now()`),
  granted_by: uuid('granted_by')
}, (table) => ({
  pk: primaryKey({ columns: [table.role_id, table.permission_id] }),
  role_idx: index('role_permissions_role_idx').on(table.role_id),
  permission_idx: index('role_permissions_permission_idx').on(table.permission_id),
}));

// ============================================================================
// CHART OF ACCOUNTS - Romanian Accounting Standard
// ============================================================================

/**
 * Account Classes table
 * Top level of chart of accounts (1-9)
 * Class 1-7: Balance sheet accounts
 * Class 8-9: Profit & Loss accounts
 */
export const account_classes = pgTable('account_classes', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 1 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  default_account_function: text('default_account_function').notNull(), // 'A', 'P', 'B'
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  code_unique: unique('account_classes_code_unique').on(table.code),
  code_idx: index('account_classes_code_idx').on(table.code),
}));

/**
 * Account Groups table
 * Second level of chart of accounts (10-99)
 */
export const account_groups = pgTable('account_groups', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 2 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  class_id: uuid('class_id').notNull(),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  code_unique: unique('account_groups_code_unique').on(table.code),
  code_idx: index('account_groups_code_idx').on(table.code),
  class_idx: index('account_groups_class_idx').on(table.class_id),
}));

/**
 * Synthetic Accounts table
 * Third level of chart of accounts (3-4 digits)
 * Grade 1: 3 digits (e.g., 401)
 * Grade 2: 4 digits (e.g., 4011)
 */
export const synthetic_accounts = pgTable('synthetic_accounts', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 4 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  account_function: text('account_function').notNull(), // 'A' (Active), 'P' (Pasive), 'B' (Bifunctional)
  grade: integer('grade').notNull(), // 1 or 2
  group_id: uuid('group_id').notNull(),
  parent_id: uuid('parent_id'), // Self-reference for grade 2 accounts
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  code_unique: unique('synthetic_accounts_code_unique').on(table.code),
  code_idx: index('synthetic_accounts_code_idx').on(table.code),
  group_idx: index('synthetic_accounts_group_idx').on(table.group_id),
  parent_idx: index('synthetic_accounts_parent_idx').on(table.parent_id),
  function_idx: index('synthetic_accounts_function_idx').on(table.account_function),
}));

/**
 * Analytic Accounts table
 * Detailed level of chart of accounts (5+ digits)
 * Full analytical breakdown of synthetic accounts
 */
export const analytic_accounts = pgTable('analytic_accounts', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  synthetic_id: uuid('synthetic_id').notNull(),
  account_function: text('account_function').notNull(), // Inherited from synthetic
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  code_unique: unique('analytic_accounts_code_unique').on(table.code),
  code_idx: index('analytic_accounts_code_idx').on(table.code),
  synthetic_idx: index('analytic_accounts_synthetic_idx').on(table.synthetic_id),
  function_idx: index('analytic_accounts_function_idx').on(table.account_function),
}));

/**
 * Accounts table (LEGACY)
 * @deprecated This is a legacy flat structure. Use account_classes, account_groups, synthetic_accounts, and analytic_accounts instead.
 * Kept for backward compatibility with older data.
 */
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'A', 'P', 'B'
  class_id: uuid('class_id').notNull(),
  parent_id: uuid('parent_id'), // Self-reference
  is_active: boolean('is_active').default(true),
  synthetic_id: uuid('synthetic_id'),
  analytic_id: uuid('analytic_id'),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  code_unique: unique('accounts_code_unique').on(table.code),
  code_idx: index('accounts_code_idx').on(table.code),
  class_idx: index('accounts_class_idx').on(table.class_id),
  parent_idx: index('accounts_parent_idx').on(table.parent_id),
  type_idx: index('accounts_type_idx').on(table.type),
}));

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Users Relations
 */
export const usersRelations = relations(users, ({ many, one }) => ({
  roles: many(user_roles),
  company: one(companies, {
    fields: [users.company_id],
    references: [companies.id],
  }),
}));

/**
 * Roles Relations
 */
export const rolesRelations = relations(roles, ({ many, one }) => ({
  users: many(user_roles),
  permissions: many(role_permissions),
  company: one(companies, {
    fields: [roles.company_id],
    references: [companies.id],
  }),
}));

/**
 * Permissions Relations
 */
export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(role_permissions),
}));

/**
 * User Roles Relations
 */
export const user_rolesRelations = relations(user_roles, ({ one }) => ({
  user: one(users, {
    fields: [user_roles.user_id],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [user_roles.role_id],
    references: [roles.id],
  }),
}));

/**
 * Role Permissions Relations
 */
export const role_permissionsRelations = relations(role_permissions, ({ one }) => ({
  role: one(roles, {
    fields: [role_permissions.role_id],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [role_permissions.permission_id],
    references: [permissions.id],
  }),
}));

/**
 * Account Classes Relations
 */
export const account_classesRelations = relations(account_classes, ({ many }) => ({
  groups: many(account_groups),
  accounts: many(accounts), // Legacy
}));

/**
 * Account Groups Relations
 */
export const account_groupsRelations = relations(account_groups, ({ one, many }) => ({
  class: one(account_classes, {
    fields: [account_groups.class_id],
    references: [account_classes.id],
  }),
  syntheticAccounts: many(synthetic_accounts),
}));

/**
 * Synthetic Accounts Relations
 */
export const synthetic_accountsRelations = relations(synthetic_accounts, ({ one, many }) => ({
  group: one(account_groups, {
    fields: [synthetic_accounts.group_id],
    references: [account_groups.id],
  }),
  parent: one(synthetic_accounts, {
    fields: [synthetic_accounts.parent_id],
    references: [synthetic_accounts.id],
  }),
  children: many(synthetic_accounts),
  analyticAccounts: many(analytic_accounts),
}));

/**
 * Analytic Accounts Relations
 */
export const analytic_accountsRelations = relations(analytic_accounts, ({ one }) => ({
  synthetic: one(synthetic_accounts, {
    fields: [analytic_accounts.synthetic_id],
    references: [synthetic_accounts.id],
  }),
}));

/**
 * Accounts Relations (Legacy)
 */
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  class: one(account_classes, {
    fields: [accounts.class_id],
    references: [account_classes.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parent_id],
    references: [accounts.id],
  }),
  children: many(accounts),
  synthetic: one(synthetic_accounts, {
    fields: [accounts.synthetic_id],
    references: [synthetic_accounts.id],
  }),
  analytic: one(analytic_accounts, {
    fields: [accounts.analytic_id],
    references: [analytic_accounts.id],
  }),
}));

// Note: companies relation is forward reference and will be resolved when companies is imported
// This is handled by Drizzle ORM automatically

