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
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

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
export const PC_account_classes = pgTable('PC_account_classes', {
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
export const PC_account_groups = pgTable('PC_account_groups', {
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
 * Synthetic Accounts table (Plan de Conturi - PC_ prefix)
 * Third level of chart of accounts (3-4 digits)
 * Grade 1: 3 digits (e.g., 401)
 * Grade 2: 4 digits (e.g., 4011)
 */
export const PC_synthetic_accounts = pgTable('PC_synthetic_accounts', {
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
  code_unique: unique('PC_synthetic_accounts_code_unique').on(table.code),
  code_idx: index('PC_synthetic_accounts_code_idx').on(table.code),
  group_idx: index('PC_synthetic_accounts_group_idx').on(table.group_id),
  parent_idx: index('PC_synthetic_accounts_parent_idx').on(table.parent_id),
  function_idx: index('PC_synthetic_accounts_function_idx').on(table.account_function),
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
 * @deprecated This is a legacy flat structure. Use PC_account_classes, PC_account_groups, PC_synthetic_accounts, and analytic_accounts instead.
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
export const PC_account_classesRelations = relations(PC_account_classes, ({ many }) => ({
  groups: many(PC_account_groups),
  accounts: many(accounts), // Legacy
}));

/**
 * Account Groups Relations
 */
export const PC_account_groupsRelations = relations(PC_account_groups, ({ one, many }) => ({
  class: one(PC_account_classes, {
    fields: [PC_account_groups.class_id],
    references: [PC_account_classes.id],
  }),
  syntheticAccounts: many(PC_synthetic_accounts),
}));

/**
 * Synthetic Accounts Relations
 */
export const PC_synthetic_accountsRelations = relations(PC_synthetic_accounts, ({ one, many }) => ({
  group: one(PC_account_groups, {
    fields: [PC_synthetic_accounts.group_id],
    references: [PC_account_groups.id],
  }),
  parent: one(PC_synthetic_accounts, {
    fields: [PC_synthetic_accounts.parent_id],
    references: [PC_synthetic_accounts.id],
  }),
  children: many(PC_synthetic_accounts),
  analyticAccounts: many(analytic_accounts),
}));

/**
 * Analytic Accounts Relations
 */
export const analytic_accountsRelations = relations(analytic_accounts, ({ one }) => ({
  synthetic: one(PC_synthetic_accounts, {
    fields: [analytic_accounts.synthetic_id],
    references: [PC_synthetic_accounts.id],
  }),
}));

/**
 * Accounts Relations (Legacy)
 */
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  class: one(PC_account_classes, {
    fields: [accounts.class_id],
    references: [PC_account_classes.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parent_id],
    references: [accounts.id],
  }),
  children: many(accounts),
  synthetic: one(PC_synthetic_accounts, {
    fields: [accounts.synthetic_id],
    references: [PC_synthetic_accounts.id],
  }),
  analytic: one(analytic_accounts, {
    fields: [accounts.analytic_id],
    references: [analytic_accounts.id],
  }),
}));

// Note: companies relation is forward reference and will be resolved when companies is imported
// This is handled by Drizzle ORM automatically

// ============================================================================
// ZOD SCHEMAS FOR ACCOUNT CLASSES
// ============================================================================

// Account Classes Schemas
export const insertAccountClassSchema = createInsertSchema(PC_account_classes, {
  code: z.string().length(1).regex(/^[1-9]$/, "Codul clasei trebuie să fie cifră 1-9"),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  default_account_function: z.enum(['A', 'P', 'B'])
});

export const selectAccountClassSchema = createSelectSchema(PC_account_classes);

export const updateAccountClassSchema = insertAccountClassSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Export Zod types
export type InsertAccountClassZod = z.infer<typeof insertAccountClassSchema>;
export type SelectAccountClassZod = z.infer<typeof selectAccountClassSchema>;
export type UpdateAccountClassZod = z.infer<typeof updateAccountClassSchema>;

// Account Groups Schemas
export const insertAccountGroupSchema = createInsertSchema(PC_account_groups, {
  code: z.string().length(2).regex(/^[0-9]{2}$/, "Codul grupei trebuie să fie 2 cifre"),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  class_id: z.string().uuid()
});
export const selectAccountGroupSchema = createSelectSchema(PC_account_groups);
export const updateAccountGroupSchema = insertAccountGroupSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});
export type InsertAccountGroupZod = z.infer<typeof insertAccountGroupSchema>;
export type SelectAccountGroupZod = z.infer<typeof selectAccountGroupSchema>;
export type UpdateAccountGroupZod = z.infer<typeof updateAccountGroupSchema>;

// Synthetic Accounts Schemas
export const insertSyntheticAccountSchema = createInsertSchema(PC_synthetic_accounts, {
  code: z.string().min(3).max(4).regex(/^[0-9]{3,4}$/, "Codul contului sintetic trebuie să fie 3-4 cifre"),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  account_function: z.enum(['A', 'P', 'B']),
  grade: z.number().int().min(1).max(2),
  group_id: z.string().uuid(),
  parent_id: z.string().uuid().optional()
}).refine((data) => {
  // Validare: conturile grad 1 NU pot avea parent_id
  if (data.grade === 1 && data.parent_id) {
    return false;
  }
  // Validare: conturile grad 2 TREBUIE să aibă parent_id
  if (data.grade === 2 && !data.parent_id) {
    return false;
  }
  return true;
}, {
  message: "Conturile grad 1 nu pot avea parent_id, conturile grad 2 trebuie să aibă parent_id",
  path: ["parent_id"]
}).refine((data) => {
  // Validare: gradul trebuie să corespundă cu lungimea codului
  const determinedGrade = chartOfAccountsUtils.determineGrade(data.code);
  if (determinedGrade && determinedGrade !== data.grade) {
    return false;
  }
  return true;
}, {
  message: "Gradul contului nu corespunde cu lungimea codului (grad 1 = 3 cifre, grad 2 = 4 cifre)",
  path: ["grade"]
});

// NOTE TODO: Validarea că group_id corespunde cu primele 2 cifre ale codului nu poate fi făcută
// în schema Zod deoarece necesită acces la baza de date pentru a lua codul grupei.
// Această validare trebuie făcută la nivel de service/controller înainte de insert.
// Exemplu: 
//   const groupCode = chartOfAccountsUtils.extractGroupCode(data.code);
//   const group = await db.query.PC_account_groups.findFirst({ where: eq(PC_account_groups.id, data.group_id) });
//   if (group && group.code !== groupCode) throw new Error("group_id nu corespunde cu codul contului");
export const selectSyntheticAccountSchema = createSelectSchema(PC_synthetic_accounts);
export const updateSyntheticAccountSchema = insertSyntheticAccountSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});
export type InsertSyntheticAccountZod = z.infer<typeof insertSyntheticAccountSchema>;
export type SelectSyntheticAccountZod = z.infer<typeof selectSyntheticAccountSchema>;
export type UpdateSyntheticAccountZod = z.infer<typeof updateSyntheticAccountSchema>;

// Analytic Accounts Schemas
export const insertAnalyticAccountSchema = createInsertSchema(analytic_accounts, {
  code: z.string().length(6).regex(/^[0-9]{6}$/, "Codul contului analitic trebuie să fie 6 cifre"),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  account_function: z.enum(['A', 'P', 'B']),
  synthetic_id: z.string().uuid()
});
export const selectAnalyticAccountSchema = createSelectSchema(analytic_accounts);
export const updateAnalyticAccountSchema = insertAnalyticAccountSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});
export type InsertAnalyticAccountZod = z.infer<typeof insertAnalyticAccountSchema>;
export type SelectAnalyticAccountZod = z.infer<typeof selectAnalyticAccountSchema>;
export type UpdateAnalyticAccountZod = z.infer<typeof updateAnalyticAccountSchema>;

// Accounts Schemas
export const insertAccountSchema = createInsertSchema(accounts, {
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['A', 'P', 'B']),
  class_id: z.string().uuid(),
  parent_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
  synthetic_id: z.string().uuid().optional(),
  analytic_id: z.string().uuid().optional()
});
export const selectAccountSchema = createSelectSchema(accounts);
export const updateAccountSchema = insertAccountSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});
export type InsertAccountZod = z.infer<typeof insertAccountSchema>;
export type SelectAccountZod = z.infer<typeof selectAccountSchema>;
export type UpdateAccountZod = z.infer<typeof updateAccountSchema>;

// Legacy type aliases for backward compatibility
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type PC_AccountGroup = typeof PC_account_groups.$inferSelect;
export type InsertPC_AccountGroup = z.infer<typeof insertAccountGroupSchema>;
export type PC_SyntheticAccount = typeof PC_synthetic_accounts.$inferSelect;
export type InsertPC_SyntheticAccount = z.infer<typeof insertSyntheticAccountSchema>;
export type AnalyticAccount = typeof analytic_accounts.$inferSelect;
export type InsertAnalyticAccount = z.infer<typeof insertAnalyticAccountSchema>;
export type PC_AccountClass = typeof PC_account_classes.$inferSelect;
export type InsertPC_AccountClass = z.infer<typeof insertAccountClassSchema>;

// Backward compatibility aliases (deprecated - use PC_ prefixed versions)
export type SyntheticAccount = PC_SyntheticAccount;
export type InsertSyntheticAccount = InsertPC_SyntheticAccount;
export const synthetic_accounts = PC_synthetic_accounts;
export const synthetic_accountsRelations = PC_synthetic_accountsRelations;

/**
 * Utility functions for Romanian Chart of Accounts
 */
export const chartOfAccountsUtils = {
  /**
   * Extract class code from account code
   * For account codes: first digit represents the class
   * For group codes: first digit represents the class
   * @param code Account or group code (e.g., "401", "10")
   * @returns Class code as string (e.g., "4", "1")
   */
  extractClassCode: (code: string): string => {
    if (!code || code.length === 0) return '';
    return code.charAt(0);
  },

  /**
   * Extract group code from account code
   * For account codes: first 2 digits represent the group
   * @param code Account code (e.g., "401", "4011")
   * @returns Group code as string (e.g., "40")
   */
  extractGroupCode: (code: string): string => {
    if (!code || code.length < 2) return '';
    return code.substring(0, 2);
  },

  /**
   * Extract synthetic prefix from analytic account code
   * For analytic codes like "401.1" or "4011.2", extracts "401" or "4011"
   * @param analyticCode Analytic account code (e.g., "401.1", "4011.2")
   * @returns Synthetic prefix (e.g., "401", "4011")
   */
  extractSyntheticPrefix: (analyticCode: string): string => {
    if (!analyticCode) return '';
    return analyticCode.split('.')[0] || '';
  },

  /**
   * Validate that account/group code belongs to the correct class
   * @param code Account or group code
   * @param expectedClassCode Expected class code
   * @returns true if valid, false otherwise
   */
  validateCodeClassMatch: (code: string, expectedClassCode: string): boolean => {
    const actualClassCode = chartOfAccountsUtils.extractClassCode(code);
    return actualClassCode === expectedClassCode;
  },

  /**
   * Validate that account code belongs to the correct group
   * @param code Account code (e.g., "401", "4011")
   * @param expectedGroupCode Expected group code (e.g., "40")
   * @returns true if valid, false otherwise
   */
  validateCodeGroupMatch: (code: string, expectedGroupCode: string): boolean => {
    const extractedGroup = chartOfAccountsUtils.extractGroupCode(code);
    return extractedGroup === expectedGroupCode;
  },

  /**
   * Validate hierarchy between grade 2 and grade 1 synthetic accounts
   * Grade 2 code must start with grade 1 code (e.g., "4011" starts with "401")
   * @param grade2Code Grade 2 account code (4 digits)
   * @param grade1Code Grade 1 parent code (3 digits)
   * @returns true if valid hierarchy, false otherwise
   */
  validateGrade2Hierarchy: (grade2Code: string, grade1Code: string): boolean => {
    if (!grade2Code || !grade1Code) return false;
    if (grade2Code.length !== 4 || grade1Code.length !== 3) return false;
    return grade2Code.substring(0, 3) === grade1Code;
  },

  /**
   * Determine account grade from code length
   * Grade 1: 3 digits (e.g., "401")
   * Grade 2: 4 digits (e.g., "4011")
   * @param code Account code
   * @returns 1 for grade 1, 2 for grade 2, null for invalid
   */
  determineGrade: (code: string): 1 | 2 | null => {
    if (!code) return null;
    if (code.length === 3) return 1;
    if (code.length === 4) return 2;
    return null;
  },

  /**
   * Get class code from group code (alias for extractClassCode for clarity)
   * @param groupCode Group code (2 digits)
   * @returns Class code (1 digit)
   */
  getClassFromGroupCode: (groupCode: string): string => {
    return chartOfAccountsUtils.extractClassCode(groupCode);
  },

  /**
   * Get class code from account code (alias for extractClassCode for clarity)
   * @param accountCode Account code (3-20 digits)
   * @returns Class code (1 digit)
   */
  getClassFromAccountCode: (accountCode: string): string => {
    return chartOfAccountsUtils.extractClassCode(accountCode);
  }
};


