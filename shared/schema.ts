import { pgTable, text, serial, integer, boolean, timestamp, uuid, varchar, decimal, jsonb, primaryKey, index, pgEnum, unique, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export CRM models for shared usage across the application
export * from "../server/modules/crm/schema/crm.schema";

// Export HR models for shared usage across the application
export * from "../server/modules/hr/schema/hr.schema";

// Export Accounting models for shared usage across the application
export * from "../server/modules/accounting/schema";

// Export Analytics models for shared usage across the application
export * from "../server/modules/analytics/schema/analytics.schema";

// Export Integrations models for shared usage across the application
export * from "../server/modules/integrations/schema/integrations.schema";

// Export E-commerce models for shared usage across the application
export * from "../server/modules/ecommerce/schema";

// Export Collaboration models for shared usage across the application
export * from "./schema/collaboration.schema";

// Export Invoicing Numbering models for shared usage across the application
export * from "./schema/invoice-numbering.schema";

// Export Warehouse models for shared usage across the application
export * from "./schema/warehouse";

// User Management
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("user"),
  companyId: uuid("company_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (users) => ({
  companyIdx: index('users_company_idx').on(users.companyId),
}));

// Role-Based Access Control (RBAC)
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (roles) => ({
  companyIdx: index('roles_company_idx').on(roles.companyId),
}));

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
}, (userRoles) => ({
  pk: primaryKey(userRoles.userId, userRoles.roleId),
}));

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id),
}, (rolePermissions) => ({
  pk: primaryKey(rolePermissions.roleId, rolePermissions.permissionId),
}));

// Relations are defined further down in the file

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles);
export const insertRolePermissionSchema = createInsertSchema(rolePermissions);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Define relations for RBAC tables
export const userRelations = relations(users, ({ many, one }) => ({
  userRoles: many(userRoles),
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  journalEntries: many(journalEntries),
}));

export const roleRelations = relations(roles, ({ many, one }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
  company: one(companies, {
    fields: [roles.companyId],
    references: [companies.id],
  }),
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRoleRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const rolePermissionRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// Company Settings
export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  fiscalCode: text("fiscal_code").notNull().unique(),
  registrationNumber: text("registration_number").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  county: text("county").notNull(),
  country: text("country").notNull().default("Romania"),
  phone: text("phone"),
  email: text("email"),
  bankAccount: text("bank_account"),
  bankName: text("bank_name"),
  vatPayer: boolean("vat_payer").default(true),
  vatRate: integer("vat_rate").default(19),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Romanian Chart of Accounts System
// 1. Account Classes (Class 1-9) - Top level classification
export const accountClasses = pgTable("account_classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 1 }).notNull().unique(), // Single digit (1-9)
  name: text("name").notNull(),
  description: text("description"),
  // Default account function for accounts in this class: 
  // - A (Activ/Asset/Debit): Class with primarily debit balance accounts
  // - P (Pasiv/Liability/Credit): Class with primarily credit balance accounts
  // - B (Bifunctional/Mixed): Class with mixed account types
  defaultAccountFunction: text("default_account_function").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Account Groups - Second level (2 digits)
export const accountGroups = pgTable("account_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 2 }).notNull().unique(), // Two digits (e.g., 10, 11, 30)
  name: text("name").notNull(),
  description: text("description"),
  classId: uuid("class_id").notNull().references(() => accountClasses.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accountGroupRelations = relations(accountGroups, ({ one, many }) => ({
  class: one(accountClasses, {
    fields: [accountGroups.classId],
    references: [accountClasses.id],
  }),
  syntheticAccounts: many(syntheticAccounts),
}));

// 3. Synthetic Accounts (Grade 1: 3 digits, Grade 2: 4 digits)
export const syntheticAccounts = pgTable("synthetic_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 4 }).notNull().unique(), // 3-4 digits (e.g., 101, 1011)
  name: text("name").notNull(),
  description: text("description"),
  // Account function in Romanian accounting:
  // - A (Activ/Asset/Debit): Accounts with normal debit balance (assets, expenses)
  // - P (Pasiv/Liability/Credit): Accounts with normal credit balance (liabilities, equity, revenues)
  // - B (Bifunctional/A/P): Accounts that can have either debit or credit balance
  accountFunction: text("account_function").notNull(),
  grade: integer("grade").notNull(), // 1 (3 digits) or 2 (4 digits)
  groupId: uuid("group_id").notNull().references(() => accountGroups.id),
  parentId: uuid("parent_id").references(() => syntheticAccounts.id), // For Grade 2 accounts
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const syntheticAccountRelations = relations(syntheticAccounts, ({ one, many }) => ({
  group: one(accountGroups, {
    fields: [syntheticAccounts.groupId],
    references: [accountGroups.id],
  }),
  parent: one(syntheticAccounts, {
    fields: [syntheticAccounts.parentId],
    references: [syntheticAccounts.id],
  }),
  children: many(syntheticAccounts),
  analyticAccounts: many(analyticAccounts),
}));

// 4. Analytic Accounts - Most detailed level
export const analyticAccounts = pgTable("analytic_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(), // Extended code for detailed classification
  name: text("name").notNull(),
  description: text("description"),
  syntheticId: uuid("synthetic_id").notNull().references(() => syntheticAccounts.id),
  // Account function in Romanian accounting:
  // - A (Activ/Asset/Debit): Accounts with normal debit balance (assets, expenses)
  // - P (Pasiv/Liability/Credit): Accounts with normal credit balance (liabilities, equity, revenues)
  // - B (Bifunctional/A/P): Accounts that can have either debit or credit balance
  accountFunction: text("account_function").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const analyticAccountRelations = relations(analyticAccounts, ({ one, many }) => ({
  syntheticAccount: one(syntheticAccounts, {
    fields: [analyticAccounts.syntheticId],
    references: [syntheticAccounts.id],
  }),
  balances: many(accountBalances),
}));

// Legacy accounts table maintained for backward compatibility
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // A (Active), P (Passive), B (Bifunctional)
  classId: uuid("class_id").notNull().references(() => accountClasses.id),
  parentId: uuid("parent_id").references(() => accounts.id),
  isActive: boolean("is_active").default(true),
  syntheticId: uuid("synthetic_id").references(() => syntheticAccounts.id),
  analyticId: uuid("analytic_id").references(() => analyticAccounts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accountRelations = relations(accounts, ({ one, many }) => ({
  class: one(accountClasses, {
    fields: [accounts.classId],
    references: [accountClasses.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
  }),
  children: many(accounts),
  syntheticAccount: one(syntheticAccounts, {
    fields: [accounts.syntheticId],
    references: [syntheticAccounts.id],
  }),
  analyticAccount: one(analyticAccounts, {
    fields: [accounts.analyticId],
    references: [analyticAccounts.id],
  }),
  balances: many(accountBalances),
}));

export const accountBalances = pgTable("account_balances", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  fiscalYear: integer("fiscal_year").notNull(),
  fiscalMonth: integer("fiscal_month").notNull(),
  openingDebit: decimal("opening_debit", { precision: 15, scale: 2 }).default("0").notNull(),
  openingCredit: decimal("opening_credit", { precision: 15, scale: 2 }).default("0").notNull(),
  periodDebit: decimal("period_debit", { precision: 15, scale: 2 }).default("0").notNull(),
  periodCredit: decimal("period_credit", { precision: 15, scale: 2 }).default("0").notNull(),
  closingDebit: decimal("closing_debit", { precision: 15, scale: 2 }).default("0").notNull(),
  closingCredit: decimal("closing_credit", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accountBalanceRelations = relations(accountBalances, ({ one }) => ({
  account: one(accounts, {
    fields: [accountBalances.accountId],
    references: [accounts.id],
  }),
  company: one(companies, {
    fields: [accountBalances.companyId],
    references: [companies.id],
  }),
}));

// Journal Entries and Transactions
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  date: timestamp("date").notNull(),
  number: text("number"),
  reference: text("reference"),
  description: text("description"),
  totalDebit: decimal("total_debit", { precision: 15, scale: 2 }).default("0").notNull(),
  totalCredit: decimal("total_credit", { precision: 15, scale: 2 }).default("0").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const journalLines = pgTable("journal_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  journalId: uuid("journal_id").notNull().references(() => journalEntries.id),
  accountId: uuid("account_id").notNull().references(() => accounts.id),
  description: text("description"),
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const journalEntryRelations = relations(journalEntries, ({ one, many }) => ({
  company: one(companies, {
    fields: [journalEntries.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [journalEntries.createdBy],
    references: [users.id],
  }),
  lines: many(journalLines),
}));

export const journalLineRelations = relations(journalLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalLines.journalId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalLines.accountId],
    references: [accounts.id],
  }),
}));

// Inventory Management
export const inventoryCategories = pgTable("inventory_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // Adăugare constrângere de unicitate
  description: text("description"),
  parentId: uuid("parent_id").references(() => inventoryCategories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryCategoryRelations = relations(inventoryCategories, ({ one, many }) => ({
  parent: one(inventoryCategories, {
    fields: [inventoryCategories.parentId],
    references: [inventoryCategories.id],
  }),
  children: many(inventoryCategories),
  products: many(inventoryProducts),
}));

export const inventoryUnits = pgTable("inventory_units", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryProducts = pgTable("inventory_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: text("sku").notNull().unique(), // Înlocuim code cu sku (Stock Keeping Unit) - obligatoriu și unic
  name: text("name").notNull().unique(), // Adăugare constrângere de unicitate pentru nume
  description: text("description"),
  categoryId: uuid("category_id").references(() => inventoryCategories.id),
  unitId: uuid("unit_id").references(() => inventoryUnits.id),
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }).default("0").notNull(),
  sellingPrice: decimal("selling_price", { precision: 15, scale: 2 }).default("0").notNull(),
  priceIncludesVat: boolean("price_includes_vat").default(true), // Preț cu TVA inclus
  vatRate: integer("vat_rate").default(19),
  stockAlert: decimal("stock_alert", { precision: 15, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  // Adăugare câmp barcode pentru coduri EAN13
  barcode: text("barcode").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryProductRelations = relations(inventoryProducts, ({ one, many }) => ({
  category: one(inventoryCategories, {
    fields: [inventoryProducts.categoryId],
    references: [inventoryCategories.id],
  }),
  unit: one(inventoryUnits, {
    fields: [inventoryProducts.unitId],
    references: [inventoryUnits.id],
  }),
  stockMovements: many(inventoryStockMovements),
}));

export const inventoryStockMovements = pgTable("inventory_stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => inventoryProducts.id),
  date: timestamp("date").notNull(),
  documentNumber: text("document_number"),
  documentType: text("document_type").notNull(), // RECEIPT, ISSUE, ADJUSTMENT
  quantity: decimal("quantity", { precision: 15, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryStockMovementRelations = relations(inventoryStockMovements, ({ one }) => ({
  product: one(inventoryProducts, {
    fields: [inventoryStockMovements.productId],
    references: [inventoryProducts.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryStockMovements.createdBy],
    references: [users.id],
  }),
}));

export const inventoryStock = pgTable("inventory_stock", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => inventoryProducts.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  quantity: decimal("quantity", { precision: 15, scale: 2 }).default("0").notNull(),
  averageCost: decimal("average_cost", { precision: 15, scale: 2 }).default("0").notNull(),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).default("0").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Schema validations for Chart of Accounts
export const insertAccountClassSchema = createInsertSchema(accountClasses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountGroupSchema = createInsertSchema(accountGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyntheticAccountSchema = createInsertSchema(syntheticAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticAccountSchema = createInsertSchema(analyticAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Legacy account schema validation (maintained for compatibility)
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJournalLineSchema = createInsertSchema(journalLines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryProductSchema = createInsertSchema(inventoryProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryStockMovementSchema = createInsertSchema(inventoryStockMovements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for insertions - Chart of Accounts
export type AccountClass = typeof accountClasses.$inferSelect;
export type InsertAccountClass = z.infer<typeof insertAccountClassSchema>;

export type AccountGroup = typeof accountGroups.$inferSelect;
export type InsertAccountGroup = z.infer<typeof insertAccountGroupSchema>;

export type SyntheticAccount = typeof syntheticAccounts.$inferSelect;
export type InsertSyntheticAccount = z.infer<typeof insertSyntheticAccountSchema>;

export type AnalyticAccount = typeof analyticAccounts.$inferSelect;
export type InsertAnalyticAccount = z.infer<typeof insertAnalyticAccountSchema>;

// Legacy and other types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export type JournalLine = typeof journalLines.$inferSelect;
export type InsertJournalLine = z.infer<typeof insertJournalLineSchema>;

export type InventoryProduct = typeof inventoryProducts.$inferSelect;
export type InsertInventoryProduct = z.infer<typeof insertInventoryProductSchema>;

export type InventoryStockMovement = typeof inventoryStockMovements.$inferSelect;
export type InsertInventoryStockMovement = z.infer<typeof insertInventoryStockMovementSchema>;

export type InventoryCategory = typeof inventoryCategories.$inferSelect;
export type InventoryUnit = typeof inventoryUnits.$inferSelect;

// Romanian Inventory Models (Gestiune)
export * from '../server/modules/inventory/schema';

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),        // e.g. 'CREATE_INVOICE'
  entity: text("entity").notNull(),        // e.g. 'invoice'
  entityId: uuid("entity_id").notNull(),   
  details: jsonb("details").notNull(),     // Any structured metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  auditScopeIdx: index('audit_scope_idx').on(table.companyId, table.createdAt),
  entityIdx: index('audit_entity_idx').on(table.entity, table.entityId),
}));

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  company: one(companies, {
    fields: [auditLogs.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Romanian Invoicing System
// Invoicing status enum: Draft -> Issued -> Sent -> Canceled
export const invoiceStatus = pgEnum('invoice_status', ['draft', 'issued', 'sent', 'canceled']);

// Invoices table with Romanian compliance requirements
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  franchiseId: uuid('franchise_id'),
  series: varchar('series', { length: 8 }),
  number: integer('number'), // Allocated only when status = issued
  status: invoiceStatus('status').default('draft').notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 5 }).default('RON').notNull(),
  version: integer('version').default(1).notNull(),
  // Accounting validation fields for Note Contabil generation
  isValidated: boolean('is_validated').default(false).notNull(),
  validatedAt: timestamp('validated_at'),
  ledgerEntryId: uuid('ledger_entry_id'), // Reference to the accounting ledger entry (Note Contabil)
  // Standard audit fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete for audit purposes
}, (table) => ({
  companyIndex: index('invoice_company_idx').on(table.companyId, table.franchiseId, table.createdAt),
  uniqueSeriesNumber: unique('invoice_series_number_unique').on(table.series, table.number),
  validationIndex: index('invoice_validation_idx').on(table.isValidated, table.validatedAt),
}));

// Invoice lines/items
export const invoiceLines = pgTable('invoice_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  productId: uuid('product_id').references(() => inventoryProducts.id),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  vatRate: integer('vat_rate').default(19).notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Invoice-related metadata (partners, payment terms, etc.)
export const invoiceDetails = pgTable('invoice_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  partnerId: uuid('partner_id'), // References a partners table (to be added)
  partnerName: text('partner_name').notNull(),
  partnerFiscalCode: text('partner_fiscal_code').notNull(),
  partnerRegistrationNumber: text('partner_registration_number'),
  partnerAddress: text('partner_address').notNull(),
  partnerCity: text('partner_city').notNull(),
  partnerCounty: text('partner_county'),
  partnerCountry: text('partner_country').default('Romania').notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentDueDays: integer('payment_due_days').default(30).notNull(),
  paymentDueDate: timestamp('payment_due_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  lines: many(invoiceLines),
  details: one(invoiceDetails),
}));

export const invoiceLineRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
  product: one(inventoryProducts, {
    fields: [invoiceLines.productId],
    references: [inventoryProducts.id],
  }),
}));

export const invoiceDetailRelations = relations(invoiceDetails, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceDetails.invoiceId],
    references: [invoices.id],
  }),
}));

// Schema validation
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  isValidated: true,   // Don't allow setting validation status during insert
  validatedAt: true,   // Don't allow setting validation timestamp during insert
  ledgerEntryId: true, // Don't allow setting ledger entry during insert
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceDetailSchema = createInsertSchema(invoiceDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for insertions and selections
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;

export type InvoiceDetail = typeof invoiceDetails.$inferSelect;
export type InsertInvoiceDetail = z.infer<typeof insertInvoiceDetailSchema>;

// Exchange Rates System
export const fx_rates = pgTable("fx_rates", {
  id: uuid("id").defaultRandom().primaryKey(),
  currency: varchar("currency", { length: 5 }).notNull(),
  rate: numeric("rate", { precision: 10, scale: 4 }).notNull(),
  // Source of the exchange rate (BNR = National Bank of Romania)
  source: varchar("source", { length: 20 }).notNull().default("BNR"),
  // Base currency (typically RON for Romanian Leu)
  baseCurrency: varchar("base_currency", { length: 5 }).notNull().default("RON"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Create a unique constraint on currency, date, and source to prevent duplicates
  uniqueRate: unique().on(table.currency, table.date, table.source, table.baseCurrency),
}));

export const insertFxRateSchema = createInsertSchema(fx_rates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FxRate = typeof fx_rates.$inferSelect;

// Document Management with Version Control
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  franchiseId: uuid("franchise_id").references(() => companies.id),
  filePath: text("file_path").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  ocrText: text("ocr_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orgIndex: index('documents_idx').on(table.companyId, table.franchiseId, table.createdAt),
}));

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id),
  content: text("content").notNull(),
  version: integer("version").default(1).notNull(),
  tag: varchar("tag", { length: 50 }),
  changeDescription: text("change_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  docVersionIndex: index('document_versions_idx').on(table.documentId, table.createdAt),
}));

export const documentRelations = relations(documents, ({ one, many }) => ({
  company: one(companies, {
    fields: [documents.companyId],
    references: [companies.id],
  }),
  franchise: one(companies, {
    fields: [documents.franchiseId],
    references: [companies.id],
  }),
  versions: many(documentVersions),
}));

export const documentVersionRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
}));

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
});

// Extended schema for document version with tag and change description
export const insertTaggedDocumentVersionSchema = insertDocumentVersionSchema.extend({
  tag: z.string().optional(),
  changeDescription: z.string().optional(),
});

export type Document = typeof documents.$inferSelect;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type InsertTaggedDocumentVersion = z.infer<typeof insertTaggedDocumentVersionSchema>;
export type InsertFxRate = z.infer<typeof insertFxRateSchema>;
