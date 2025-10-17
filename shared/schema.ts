import { pgTable, text, serial, integer, boolean, timestamp, uuid, varchar, decimal, jsonb, primaryKey, index, pgEnum, unique, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export CRM models for shared usage across the application
// Notă: CRM Activity este exportat ca Activity principal
export * from "../server/modules/crm/schema/crm.schema";
export * from "../server/modules/crm/schema/financial-data.schema";

// Export HR models for shared usage across the application
export * from "../server/modules/hr/schema/hr.schema";
export * from "../server/modules/hr/schema/documents.schema";
export * from "../server/modules/hr/schema/cor.schema";
export * from "../server/modules/hr/schema/settings.schema";

// Export Accounting models for shared usage across the application
export * from "../server/modules/accounting/schema";

// Export Analytics models for shared usage across the application
export * from "../server/modules/analytics/schema/analytics.schema";
export * from "../server/modules/analytics/schema/predictive.schema";

// Export Integrations models for shared usage across the application
export * from "../server/modules/integrations/schema/integrations.schema";

// Export E-commerce models for shared usage across the application
// Using ONLY the new schema from shared/schema/ecommerce.schema.ts (with transaction_type)
export * from "./schema/ecommerce.schema";

// Export Collaboration models for shared usage across the application
// Notă: Activity din Collaboration e redenumit în CollaborationActivity pentru a evita conflicte cu CRM
export * from "./schema/collaboration.schema";

// Export Invoicing models for shared usage across the application
export * from "../server/modules/invoicing/schema/invoice.schema";
export * from "./schema/invoice-numbering.schema";

// Export Warehouse models for shared usage across the application
// Notă: Se exportă explicit pentru a evita conflicte cu inventory-assessment.ts
export { warehouses, insertWarehouseSchema, warehouseTypeEnumType, type Warehouse, type InsertWarehouse } from "./schema/warehouse";

// Export Cash Register models for shared usage across the application
export * from "./schema/cash-register.schema";

// Export Bank Journal models for shared usage across the application
export * from "./schema/bank-journal.schema";

// Export Communications models for shared usage across the application
// Notă: contacts redenumit în communicationsContacts pentru a evita conflicte cu CRM
export {
  CommunicationChannel,
  MessageDirection,
  MessageStatus,
  SentimentType,
  channelEnum,
  directionEnum,
  statusEnum,
  sentimentEnum,
  messageThreads,
  messages,
  contacts as communicationsContacts,
  channelConfigurations,
  messageAccess,
  threadAccess,
  insertMessageThreadSchema,
  insertMessageSchema,
  insertContactSchema as insertCommunicationsContactSchema,
  insertChannelConfigSchema,
  type MessageThread,
  type Message,
  type Contact as CommunicationsContact,
  type ChannelConfig,
  type MessageThreadInsert,
  type MessageInsert,
  type ContactInsert as CommunicationsContactInsert,
  type ChannelConfigInsert
} from "./schema/communications.schema";

// Export Marketing models for shared usage across the application
export * from "./schema/marketing.schema";

// Export Account Mappings models for shared usage across the application
export * from "./schema/account-mappings.schema";

// Export Accounting Settings models for shared usage across the application
export * from "./schema/accounting-settings.schema";

// Export BPM models for shared usage across the application
export * from "./schema/bpm.schema";

// Export Audit models for shared usage across the application
export * from "../server/modules/audit/schema/audit.schema";

// Export Settings models for shared usage across the application
export * from "../server/modules/settings/schema/settings.schema";

// Export Admin models for shared usage across the application
export * from "./schema/admin.schema";

// Export Company models for shared usage across the application
export * from "../server/modules/company/schema/company.schema";

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
  // Multi-Factor Authentication fields
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: text("mfa_secret"),
  mfaBackupCodes: text("mfa_backup_codes"), // JSON array of backup codes
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

export const insertUserSchema = createInsertSchema(users); // Fixed: removed omit() for drizzle-zod compatibility

export const insertRoleSchema = createInsertSchema(roles); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertPermissionSchema = createInsertSchema(permissions); // Fixed: removed omit() for drizzle-zod compatibility;

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
  // TVA la încasare (Cash VAT) - applicable pentru firme înscrise în registrul special
  useCashVAT: boolean("use_cash_vat").default(false),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies); // Fixed: removed omit() for drizzle-zod compatibility;

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
// @ts-ignore - Referință circulară validă în Drizzle ORM (parentId referențiază syntheticAccounts.id)
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
  parentId: uuid("parent_id").references((): any => syntheticAccounts.id), // For Grade 2 accounts - explicit return type
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
// @ts-ignore - Referință circulară validă în Drizzle ORM (parentId referențiază accounts.id)
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // A (Active), P (Passive), B (Bifunctional)
  classId: uuid("class_id").notNull().references(() => accountClasses.id),
  parentId: uuid("parent_id").references((): any => accounts.id), // Self-reference - explicit return type
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

// Journal Entries and Transactions (Note Contabile)
// Adapted for Romanian Accounting Standards (OMFP 1802/2014)
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  date: timestamp("date").notNull(),
  number: text("number"), // Număr notă contabilă (ex: NC-202510-001)
  reference: text("reference"), // Referință document sursă
  description: text("description"),
  totalDebit: decimal("total_debit", { precision: 15, scale: 2 }).default("0").notNull(),
  totalCredit: decimal("total_credit", { precision: 15, scale: 2 }).default("0").notNull(),
  
  // Romanian Accounting Standards fields
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, approved, posted, cancelled
  documentType: varchar("document_type", { length: 50 }), // invoice, receipt, payment, etc.
  documentId: uuid("document_id"),
  
  // Validation fields (required by Romanian law)
  validated: boolean("validated").default(false).notNull(),
  validatedAt: timestamp("validated_at"),
  validatedBy: uuid("validated_by").references(() => users.id),
  
  // Currency fields (for foreign currency transactions)
  currencyCode: varchar("currency_code", { length: 3 }).default("RON").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1.0000").notNull(),
  
  // Posting date (data înregistrării în contabilitate)
  postedAt: timestamp("posted_at"),
  
  // Cancellation fields
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: uuid("cancelled_by").references(() => users.id),
  cancellationReason: text("cancellation_reason"),
  
  // Audit fields
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
// @ts-ignore - Referință circulară validă în Drizzle ORM (parentId referențiază inventoryCategories.id)
export const inventoryCategories = pgTable("inventory_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(), // Adăugare constrângere de unicitate
  description: text("description"),
  parentId: uuid("parent_id").references((): any => inventoryCategories.id), // Self-reference - explicit return type
  isActive: boolean("is_active").default(true),
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
export const insertAccountClassSchema = createInsertSchema(accountClasses); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertAccountGroupSchema = createInsertSchema(accountGroups); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertSyntheticAccountSchema = createInsertSchema(syntheticAccounts); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertAnalyticAccountSchema = createInsertSchema(analyticAccounts); // Fixed: removed omit() for drizzle-zod compatibility;

// Legacy account schema validation (maintained for compatibility)
export const insertAccountSchema = createInsertSchema(accounts); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertJournalEntrySchema = createInsertSchema(journalEntries); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertJournalLineSchema = createInsertSchema(journalLines); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertInventoryProductSchema = createInsertSchema(inventoryProducts); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertInventoryStockMovementSchema = createInsertSchema(inventoryStockMovements); // Fixed: removed omit() for drizzle-zod compatibility;

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

export const insertAuditLogSchema = createInsertSchema(auditLogs); // Fixed: removed omit() for drizzle-zod compatibility;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Romanian Invoicing System
// Invoicing status enum: Draft -> Issued -> Sent -> Canceled
export const invoiceStatus = pgEnum('invoice_status', ['draft', 'issued', 'sent', 'canceled']);

// VAT Category enum - Categorii fiscale conform legislației române
// Used pentru jurnalul de vânzări și raportare fiscală
export const vatCategory = pgEnum('vat_category', [
  'STANDARD_19',        // Livrări taxabile cota standard 19%
  'REDUCED_9',          // Livrări taxabile cota redusă 9%
  'REDUCED_5',          // Livrări taxabile cota redusă 5%
  'EXEMPT_WITH_CREDIT', // Scutit cu drept de deducere (ex: export, livrări intracomunitare)
  'EXEMPT_NO_CREDIT',   // Scutit fără drept de deducere (ex: operațiuni art.292)
  'REVERSE_CHARGE',     // Taxare inversă
  'NOT_SUBJECT',        // Neimpozabil
  'ZERO_RATE'           // Cota zero (cazuri speciale)
]);

// Invoices table with Romanian compliance requirements
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  franchiseId: uuid('franchise_id'),
  
  // Invoice numbering
  invoiceNumber: text('invoice_number'), // Full invoice number (e.g., "FDI-2024-00001")
  series: varchar('series', { length: 8 }),
  number: integer('number'), // Allocated only when status = issued
  
  // Customer information
  customerId: uuid('customer_id'), // Reference to customer/partner
  customerName: text('customer_name'),
  
  // Dates
  date: timestamp('date').defaultNow().notNull(), // Invoice date
  issueDate: timestamp('issue_date').defaultNow().notNull(), // Issue date (required for Romanian invoicing)
  dueDate: timestamp('due_date'), // Payment due date
  
  // Amounts
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(), // Gross amount (with VAT)
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(), // Same as amount (for backward compatibility)
  netAmount: decimal('net_amount', { precision: 15, scale: 2 }), // Net amount (without VAT)
  vatAmount: decimal('vat_amount', { precision: 15, scale: 2 }), // VAT amount
  
  // Currency
  currency: varchar('currency', { length: 5 }).default('RON').notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 4 }).default('1.0000').notNull(),
  
  // Status and type
  status: invoiceStatus('status').default('draft').notNull(),
  type: text('type'), // 'INVOICE', 'CREDIT_NOTE', 'PROFORMA', etc.
  
  // TVA la încasare (Cash VAT) - pentru facturi individuale
  // Dacă true, TVA devine exigibilă doar la momentul încasării
  isCashVAT: boolean('is_cash_vat').default(false),
  
  // References
  relatedInvoiceId: uuid('related_invoice_id'), // For credit notes - reference to original invoice
  
  // Additional information
  description: text('description'),
  notes: text('notes'),
  
  // Version control
  version: integer('version').default(1).notNull(),
  
  // Accounting validation fields for Note Contabil generation
  isValidated: boolean('is_validated').default(false).notNull(),
  validatedAt: timestamp('validated_at'),
  ledgerEntryId: uuid('ledger_entry_id'), // Reference to the accounting ledger entry (Note Contabil)
  
  // Audit fields
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete for audit purposes
}, (table) => ({
  companyIndex: index('invoice_company_idx').on(table.companyId, table.franchiseId, table.createdAt),
  customerIndex: index('invoice_customer_idx').on(table.customerId),
  dateIndex: index('invoice_date_idx').on(table.date),
  statusIndex: index('invoice_status_idx').on(table.status),
  uniqueSeriesNumber: unique('invoice_series_number_unique').on(table.series, table.number),
  validationIndex: index('invoice_validation_idx').on(table.isValidated, table.validatedAt),
}));

// Note: Invoice items are now defined in server/modules/invoicing/schema/invoice.schema.ts
// The invoice_lines table has been unified into invoice_items

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
export const invoiceRelations = relations(invoices, ({ one }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  details: one(invoiceDetails),
  // Note: items relation is defined in server/modules/invoicing/schema/invoice.schema.ts
}));

export const invoiceDetailRelations = relations(invoiceDetails, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceDetails.invoiceId],
    references: [invoices.id],
  }),
}));

// Schema validation
export const insertInvoiceSchema = createInsertSchema(invoices); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertInvoiceDetailSchema = createInsertSchema(invoiceDetails); // Fixed: removed omit() for drizzle-zod compatibility;

// Types for insertions and selections
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceDetail = typeof invoiceDetails.$inferSelect;
export type InsertInvoiceDetail = z.infer<typeof insertInvoiceDetailSchema>;

// Note: InvoiceItem types are exported from server/modules/invoicing/schema/invoice.schema.ts

// Invoice Payments - Tracking plăți pentru facturi
export const invoicePayments = pgTable('invoice_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  
  // Payment details
  paymentDate: timestamp('payment_date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(), // bank_transfer, cash, card, etc.
  
  // Reference documents
  paymentReference: text('payment_reference'), // Număr chitanță, OP, extras bancar
  bankTransactionId: uuid('bank_transaction_id'), // Link către tranzacție bancară
  cashTransactionId: uuid('cash_transaction_id'), // Link către tranzacție casă
  
  // TVA transfer tracking (pentru TVA la încasare)
  vatTransferLedgerId: uuid('vat_transfer_ledger_id'), // Link către nota contabilă de transfer TVA
  vatAmountTransferred: decimal('vat_amount_transferred', { precision: 15, scale: 2 }), // Suma TVA transferată 4428->4427
  
  // Notes and metadata
  notes: text('notes'),
  metadata: jsonb('metadata'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index('invoice_payments_invoice_idx').on(table.invoiceId),
  companyIdx: index('invoice_payments_company_idx').on(table.companyId),
  dateIdx: index('invoice_payments_date_idx').on(table.paymentDate),
}));

export const invoicePaymentRelations = relations(invoicePayments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoicePayments.invoiceId],
    references: [invoices.id],
  }),
  company: one(companies, {
    fields: [invoicePayments.companyId],
    references: [companies.id],
  }),
}));

export const insertInvoicePaymentSchema = createInsertSchema(invoicePayments); // Fixed: removed omit() for drizzle-zod compatibility;

export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type InsertInvoicePayment = z.infer<typeof insertInvoicePaymentSchema>;

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

export const insertFxRateSchema = createInsertSchema(fx_rates); // Fixed: removed omit() for drizzle-zod compatibility;

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

export const insertDocumentSchema = createInsertSchema(documents); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertDocumentVersionSchema = createInsertSchema(documentVersions); // Fixed: removed omit() for drizzle-zod compatibility;

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
