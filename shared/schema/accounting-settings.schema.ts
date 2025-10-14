/**
 * Accounting Settings Schema
 * 
 * Database schema for accounting module settings including:
 * - General accounting settings
 * - VAT settings
 * - Account relationships
 * - Opening balances
 */

import { pgTable, uuid, text, timestamp, boolean, integer, decimal, jsonb, unique, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Import companies from main schema
import { companies } from '../schema';
import { users } from '../schema';

// ============================================================
// 1. ACCOUNTING SETTINGS TABLE
// ============================================================

export const accountingSettings = pgTable('accounting_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Configurări generale
  fiscalYearStartMonth: integer('fiscal_year_start_month').default(1).notNull(),
  requireApproval: boolean('require_approval').default(false).notNull(),
  autoNumbering: boolean('auto_numbering').default(true).notNull(),
  
  // Funcționalități activate
  enableAnalyticAccounting: boolean('enable_analytic_accounting').default(false).notNull(),
  enableMultiCurrency: boolean('enable_multi_currency').default(false).notNull(),
  enableFixedAssets: boolean('enable_fixed_assets').default(false).notNull(),
  enableCostCenters: boolean('enable_cost_centers').default(false).notNull(),
  enableProjects: boolean('enable_projects').default(false).notNull(),
  
  // Integrări externe
  enableSaftExport: boolean('enable_saft_export').default(false).notNull(),
  enableAnafEfactura: boolean('enable_anaf_efactura').default(false).notNull(),
  anafApiKey: text('anaf_api_key'),
  
  // Onboarding
  hasAccountingHistory: boolean('has_accounting_history').default(false).notNull(),
  accountingStartDate: timestamp('accounting_start_date'),
  openingBalancesImported: boolean('opening_balances_imported').default(false).notNull(),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  companyUnique: unique().on(table.companyId),
  companyIdx: index('idx_accounting_settings_company_id').on(table.companyId)
}));

export const accountingSettingsRelations = relations(accountingSettings, ({ one }) => ({
  company: one(companies, {
    fields: [accountingSettings.companyId],
    references: [companies.id],
  }),
  creator: one(users, {
    fields: [accountingSettings.createdBy],
    references: [users.id],
  }),
}));

// ============================================================
// 2. VAT SETTINGS TABLE
// ============================================================

export const vatSettings = pgTable('vat_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Regim TVA
  vatPayer: boolean('vat_payer').default(true).notNull(),
  useCashVat: boolean('use_cash_vat').default(false).notNull(),
  cashVatThreshold: decimal('cash_vat_threshold', { precision: 15, scale: 2 }).default('2250000.00').notNull(),
  
  // Cote TVA
  standardVatRate: integer('standard_vat_rate').default(19).notNull(),
  reducedVatRate1: integer('reduced_vat_rate_1').default(9).notNull(),
  reducedVatRate2: integer('reduced_vat_rate_2').default(5).notNull(),
  
  // Conturi TVA
  vatCollectedAccount: text('vat_collected_account').default('4427').notNull(),
  vatDeductibleAccount: text('vat_deductible_account').default('4426').notNull(),
  vatPayableAccount: text('vat_payable_account').default('4423').notNull(),
  vatReceivableAccount: text('vat_receivable_account').default('4424').notNull(),
  
  // Periodicitate declarație
  declarationFrequency: text('declaration_frequency').default('monthly').notNull(),
  
  // Validare automată CUI
  enableVatValidation: boolean('enable_vat_validation').default(true).notNull(),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyUnique: unique().on(table.companyId),
  companyIdx: index('idx_vat_settings_company_id').on(table.companyId)
}));

export const vatSettingsRelations = relations(vatSettings, ({ one }) => ({
  company: one(companies, {
    fields: [vatSettings.companyId],
    references: [companies.id],
  }),
}));

// ============================================================
// 3. ACCOUNT RELATIONSHIPS TABLE
// ============================================================

export const accountRelationships = pgTable('account_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Relație contabilă
  relationshipType: text('relationship_type').notNull(),
  description: text('description'),
  
  // Contul debit
  debitAccountCode: text('debit_account_code').notNull(),
  debitAccountName: text('debit_account_name'),
  
  // Contul credit
  creditAccountCode: text('credit_account_code').notNull(),
  creditAccountName: text('credit_account_name'),
  
  // Configurare
  isActive: boolean('is_active').default(true).notNull(),
  priority: integer('priority').default(0).notNull(),
  
  // Condiții (JSON)
  conditions: jsonb('conditions'),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  relationshipUnique: unique().on(table.companyId, table.relationshipType, table.debitAccountCode, table.creditAccountCode),
  companyIdx: index('idx_account_relationships_company_id').on(table.companyId),
  typeIdx: index('idx_account_relationships_type').on(table.relationshipType),
  priorityIdx: index('idx_account_relationships_priority').on(table.priority),
}));

export const accountRelationshipsRelations = relations(accountRelationships, ({ one }) => ({
  company: one(companies, {
    fields: [accountRelationships.companyId],
    references: [companies.id],
  }),
}));

// ============================================================
// 4. OPENING BALANCES TABLE
// ============================================================

export const openingBalances = pgTable('opening_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Cont contabil
  accountCode: text('account_code').notNull(),
  accountName: text('account_name').notNull(),
  
  // Solduri
  debitBalance: decimal('debit_balance', { precision: 15, scale: 2 }).default('0.00').notNull(),
  creditBalance: decimal('credit_balance', { precision: 15, scale: 2 }).default('0.00').notNull(),
  
  // Metadata
  fiscalYear: integer('fiscal_year').notNull(),
  importDate: timestamp('import_date').defaultNow().notNull(),
  importSource: text('import_source'),
  
  // Status
  isValidated: boolean('is_validated').default(false).notNull(),
  validatedAt: timestamp('validated_at'),
  validatedBy: uuid('validated_by').references(() => users.id),
  
  // Audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  balanceUnique: unique().on(table.companyId, table.accountCode, table.fiscalYear),
  companyIdx: index('idx_opening_balances_company_id').on(table.companyId),
  fiscalYearIdx: index('idx_opening_balances_fiscal_year').on(table.fiscalYear),
  accountCodeIdx: index('idx_opening_balances_account_code').on(table.accountCode),
}));

export const openingBalancesRelations = relations(openingBalances, ({ one }) => ({
  company: one(companies, {
    fields: [openingBalances.companyId],
    references: [companies.id],
  }),
  validator: one(users, {
    fields: [openingBalances.validatedBy],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [openingBalances.createdBy],
    references: [users.id],
  }),
}));

// ============================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================

// Accounting Settings Schemas
export const insertAccountingSettingsSchema = createInsertSchema(accountingSettings, {
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  anafApiKey: z.string().optional().nullable(),
  accountingStartDate: z.date().optional().nullable(),
});

export const selectAccountingSettingsSchema = createSelectSchema(accountingSettings);

export const updateAccountingSettingsSchema = insertAccountingSettingsSchema.partial().omit({
  id: true,
  companyId: true,
  createdAt: true,
  createdBy: true,
});

// VAT Settings Schemas
export const insertVatSettingsSchema = createInsertSchema(vatSettings, {
  standardVatRate: z.number().int().min(0).max(100),
  reducedVatRate1: z.number().int().min(0).max(100),
  reducedVatRate2: z.number().int().min(0).max(100),
  cashVatThreshold: z.string().regex(/^\d+(\.\d{1,2})?$/),
  declarationFrequency: z.enum(['monthly', 'quarterly']),
});

export const selectVatSettingsSchema = createSelectSchema(vatSettings);

export const updateVatSettingsSchema = insertVatSettingsSchema.partial().omit({
  id: true,
  companyId: true,
  createdAt: true,
});

// Account Relationships Schemas
export const insertAccountRelationshipsSchema = createInsertSchema(accountRelationships, {
  relationshipType: z.string().min(1),
  debitAccountCode: z.string().min(1),
  creditAccountCode: z.string().min(1),
  priority: z.number().int().min(0),
  conditions: z.record(z.string(), z.any()).optional().nullable(),
});

export const selectAccountRelationshipsSchema = createSelectSchema(accountRelationships);

export const updateAccountRelationshipsSchema = insertAccountRelationshipsSchema.partial().omit({
  id: true,
  companyId: true,
  createdAt: true,
});

// Opening Balances Schemas
export const insertOpeningBalancesSchema = createInsertSchema(openingBalances, {
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  fiscalYear: z.number().int().min(2000).max(2100),
  debitBalance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  creditBalance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  importSource: z.enum(['MANUAL', 'CSV', 'EXCEL', 'API']).optional().nullable(),
});

export const selectOpeningBalancesSchema = createSelectSchema(openingBalances);

export const updateOpeningBalancesSchema = insertOpeningBalancesSchema.partial().omit({
  id: true,
  companyId: true,
  createdAt: true,
  createdBy: true,
});

// ============================================================
// TYPESCRIPT TYPES
// ============================================================

export type AccountingSettings = typeof accountingSettings.$inferSelect;
export type InsertAccountingSettings = z.infer<typeof insertAccountingSettingsSchema>;
export type UpdateAccountingSettings = z.infer<typeof updateAccountingSettingsSchema>;

export type VatSettings = typeof vatSettings.$inferSelect;
export type InsertVatSettings = z.infer<typeof insertVatSettingsSchema>;
export type UpdateVatSettings = z.infer<typeof updateVatSettingsSchema>;

export type AccountRelationship = typeof accountRelationships.$inferSelect;
export type InsertAccountRelationship = z.infer<typeof insertAccountRelationshipsSchema>;
export type UpdateAccountRelationship = z.infer<typeof updateAccountRelationshipsSchema>;

export type OpeningBalance = typeof openingBalances.$inferSelect;
export type InsertOpeningBalance = z.infer<typeof insertOpeningBalancesSchema>;
export type UpdateOpeningBalance = z.infer<typeof updateOpeningBalancesSchema>;

// ============================================================
// ENUMS AND CONSTANTS
// ============================================================

export const DECLARATION_FREQUENCY = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
} as const;

export const IMPORT_SOURCE = {
  MANUAL: 'MANUAL',
  CSV: 'CSV',
  EXCEL: 'EXCEL',
  API: 'API',
} as const;

export const RELATIONSHIP_TYPES = {
  CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
  SUPPLIER_PAYMENT: 'SUPPLIER_PAYMENT',
  CUSTOMER_INVOICE: 'CUSTOMER_INVOICE',
  SUPPLIER_INVOICE: 'SUPPLIER_INVOICE',
  SALARY_PAYMENT: 'SALARY_PAYMENT',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASH_WITHDRAWAL: 'CASH_WITHDRAWAL',
  CASH_DEPOSIT: 'CASH_DEPOSIT',
} as const;

// Export all
export default {
  accountingSettings,
  vatSettings,
  accountRelationships,
  openingBalances,
  accountingSettingsRelations,
  vatSettingsRelations,
  accountRelationshipsRelations,
  openingBalancesRelations,
};

