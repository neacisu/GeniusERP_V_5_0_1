/**
 * Accounting Settings Schema
 * 
 * Database schema for accounting module settings including:
 * - General accounting settings
 * - VAT settings
 * - Account relationships
 * - Opening balances
 */

import { pgTable, uuid, text, timestamp, boolean, integer, decimal, jsonb, unique, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Import companies from main schema
import { companies } from '../schema';
import { users } from '../schema';

// ============================================================
// 1. ACCOUNTING SETTINGS TABLE
// ============================================================

export const accounting_settings = pgTable('accounting_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Configurări generale
  fiscal_year_start_month: integer('fiscal_year_start_month').default(1).notNull(),
  require_approval: boolean('require_approval').default(false).notNull(),
  auto_numbering: boolean('auto_numbering').default(true).notNull(),
  
  // Funcționalități activate
  enable_analytic_accounting: boolean('enable_analytic_accounting').default(false).notNull(),
  enable_multi_currency: boolean('enable_multi_currency').default(false).notNull(),
  enable_fixed_assets: boolean('enable_fixed_assets').default(false).notNull(),
  enable_cost_centers: boolean('enable_cost_centers').default(false).notNull(),
  enable_projects: boolean('enable_projects').default(false).notNull(),
  
  // Integrări externe
  enable_saft_export: boolean('enable_saft_export').default(false).notNull(),
  enable_anaf_efactura: boolean('enable_anaf_efactura').default(false).notNull(),
  anaf_api_key: text('anaf_api_key'),
  
  // Onboarding
  has_accounting_history: boolean('has_accounting_history').default(false).notNull(),
  accounting_start_date: timestamp('accounting_start_date'),
  opening_balances_imported: boolean('opening_balances_imported').default(false).notNull(),
  
  // Audit
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_by: uuid('created_by').references(() => users.id),
}, (table) => ({
  companyUnique: unique().on(table.company_id),
  companyIdx: index('idx_accounting_settings_company_id').on(table.company_id)
}));

export const accounting_settingsRelations = relations(accounting_settings, ({ one }) => ({
  company: one(companies, {
    fields: [accounting_settings.company_id],
    references: [companies.id],
  }),
  creator: one(users, {
    fields: [accounting_settings.created_by],
    references: [users.id],
  }),
}));

// ============================================================
// 2. VAT SETTINGS TABLE
// ============================================================

export const vat_settings = pgTable('vat_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Regim TVA
  vat_payer: boolean('vat_payer').default(true).notNull(),
  use_cash_vat: boolean('use_cash_vat').default(false).notNull(),
  cash_vat_threshold: decimal('cash_vat_threshold', { precision: 15, scale: 2 }).default('2250000.00').notNull(),
  
  // Cote TVA
  standard_vat_rate: integer('standard_vat_rate').default(19).notNull(),
  reduced_vat_rate_1: integer('reduced_vat_rate_1').default(9).notNull(),
  reduced_vat_rate_2: integer('reduced_vat_rate_2').default(5).notNull(),
  
  // Conturi TVA
  vat_collected_account: text('vat_collected_account').default('4427').notNull(),
  vat_deductible_account: text('vat_deductible_account').default('4426').notNull(),
  vat_payable_account: text('vat_payable_account').default('4423').notNull(),
  vat_receivable_account: text('vat_receivable_account').default('4424').notNull(),
  
  // Periodicitate declarație
  declaration_frequency: text('declaration_frequency').default('monthly').notNull(),
  
  // Validare automată CUI
  enable_vat_validation: boolean('enable_vat_validation').default(true).notNull(),
  
  // Audit
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyUnique: unique().on(table.company_id),
  companyIdx: index('idx_vat_settings_company_id').on(table.company_id)
}));

export const vat_settingsRelations = relations(vat_settings, ({ one }) => ({
  company: one(companies, {
    fields: [vat_settings.company_id],
    references: [companies.id],
  }),
}));

// ============================================================
// 3. AC_ACCOUNT_RELATIONSHIPS TABLE (Accounting Module)
// ============================================================

export const AC_account_relationships = pgTable('AC_account_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Relație contabilă
  relationship_type: text('relationship_type').notNull(),
  description: text('description'),
  
  // Contul debit
  debit_account_code: text('debit_account_code').notNull(),
  debit_account_name: text('debit_account_name'),
  
  // Contul credit
  credit_account_code: text('credit_account_code').notNull(),
  credit_account_name: text('credit_account_name'),
  
  // Configurare
  is_active: boolean('is_active').default(true).notNull(),
  priority: integer('priority').default(0).notNull(),
  
  // Condiții (JSON)
  conditions: jsonb('conditions'),
  
  // Audit
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  relationshipUnique: unique().on(table.company_id, table.relationship_type, table.debit_account_code, table.credit_account_code),
  companyIdx: index('idx_account_relationships_company_id').on(table.company_id),
  typeIdx: index('idx_account_relationships_type').on(table.relationship_type),
  priorityIdx: index('idx_account_relationships_priority').on(table.priority),
  activeIdx: index('idx_account_relationships_active').on(table.is_active).where(sql`${table.is_active} = true`),
  conditionsIdx: index('idx_account_relationships_conditions').using('gin', table.conditions),
  priorityCheckConstraint: check('AC_account_relationships_priority_check', sql`${table.priority} >= 0`),
}));

export const AC_account_relationshipsRelations = relations(AC_account_relationships, ({ one }) => ({
  company: one(companies, {
    fields: [AC_account_relationships.company_id],
    references: [companies.id],
  }),
}));

// Zod Schemas pentru validare
export const insertAccountRelationshipSchema = z.object({
  company_id: z.string().uuid(),
  relationship_type: z.string().min(1).max(100),
  description: z.string().optional(),
  debit_account_code: z.string().min(1).max(20),
  debit_account_name: z.string().max(255).optional(),
  credit_account_code: z.string().min(1).max(20),
  credit_account_name: z.string().max(255).optional(),
  is_active: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
  conditions: z.any().optional(), // JSONB - validare complexă la nivel de service
});

export const selectAccountRelationshipSchema = insertAccountRelationshipSchema.extend({
  id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const updateAccountRelationshipSchema = insertAccountRelationshipSchema.partial().extend({
  id: z.string().uuid(),
});

// TypeScript Types
export type AccountRelationship = typeof AC_account_relationships.$inferSelect;
export type InsertAccountRelationship = z.infer<typeof insertAccountRelationshipSchema>;
export type SelectAccountRelationship = z.infer<typeof selectAccountRelationshipSchema>;
export type UpdateAccountRelationship = z.infer<typeof updateAccountRelationshipSchema>;

// Backward Compatibility Aliases
export const account_relationships = AC_account_relationships;
export const account_relationshipsRelations = AC_account_relationshipsRelations;

// ============================================================
// 4. OPENING BALANCES TABLE
// ============================================================

export const opening_balances = pgTable('opening_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Cont contabil
  account_code: text('account_code').notNull(),
  account_name: text('account_name').notNull(),
  
  // Solduri
  debit_balance: decimal('debit_balance', { precision: 15, scale: 2 }).default('0.00').notNull(),
  credit_balance: decimal('credit_balance', { precision: 15, scale: 2 }).default('0.00').notNull(),
  
  // Metadata
  fiscal_year: integer('fiscal_year').notNull(),
  import_date: timestamp('import_date').defaultNow().notNull(),
  import_source: text('import_source'),
  
  // Status
  is_validated: boolean('is_validated').default(false).notNull(),
  validated_at: timestamp('validated_at'),
  validated_by: uuid('validated_by').references(() => users.id),
  
  // Audit
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_by: uuid('created_by').references(() => users.id),
}, (table) => ({
  balanceUnique: unique().on(table.company_id, table.account_code, table.fiscal_year),
  companyIdx: index('idx_opening_balances_company_id').on(table.company_id),
  fiscalYearIdx: index('idx_opening_balances_fiscal_year').on(table.fiscal_year),
  accountCodeIdx: index('idx_opening_balances_account_code').on(table.account_code),
}));

export const opening_balancesRelations = relations(opening_balances, ({ one }) => ({
  company: one(companies, {
    fields: [opening_balances.company_id],
    references: [companies.id],
  }),
  validator: one(users, {
    fields: [opening_balances.validated_by],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [opening_balances.created_by],
    references: [users.id],
  }),
}));

// ============================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================

// Accounting Settings Schemas
export const insertAccountingSettingsSchema = createInsertSchema(accounting_settings, {
  fiscal_year_start_month: z.number().int().min(1).max(12),
  anaf_api_key: z.string().optional().nullable(),
  accounting_start_date: z.date().optional().nullable(),
});

export const selectAccountingSettingsSchema = createSelectSchema(accounting_settings);

export const updateAccountingSettingsSchema = insertAccountingSettingsSchema.partial().omit({
  id: true,
  company_id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
});

// VAT Settings Schemas
export const insertVatSettingsSchema = createInsertSchema(vat_settings, {
  standard_vat_rate: z.number().int().min(0).max(100),
  reduced_vat_rate_1: z.number().int().min(0).max(100),
  reduced_vat_rate_2: z.number().int().min(0).max(100),
  cash_vat_threshold: z.string().regex(/^\d+(\.\d{1,2})?$/),
  declaration_frequency: z.enum(['monthly', 'quarterly']),
});

export const selectVatSettingsSchema = createSelectSchema(vat_settings);

export const updateVatSettingsSchema = insertVatSettingsSchema.partial().omit({
  id: true,
  company_id: true,
  created_at: true,
  updated_at: true,
});

// Account Relationships Schemas - BACKWARD COMPATIBILITY
// Folosesc noile Zod schemas cu snake_case
export const insertAccountRelationshipsSchema = insertAccountRelationshipSchema;
export const selectAccountRelationshipsSchema = selectAccountRelationshipSchema;
export const updateAccountRelationshipsSchema = updateAccountRelationshipSchema;

// Opening Balances Schemas
export const insertOpeningBalancesSchema = createInsertSchema(opening_balances, {
  account_code: z.string().min(1),
  account_name: z.string().min(1),
  fiscal_year: z.number().int().min(2000).max(2100),
  debit_balance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  credit_balance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  import_source: z.enum(['MANUAL', 'CSV', 'EXCEL', 'API']).optional().nullable(),
});

export const selectOpeningBalancesSchema = createSelectSchema(opening_balances);

export const updateOpeningBalancesSchema = insertOpeningBalancesSchema.partial().omit({
  id: true,
  company_id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
});

// ============================================================
// TYPESCRIPT TYPES
// ============================================================

export type AccountingSettings = typeof accounting_settings.$inferSelect;
export type InsertAccountingSettings = z.infer<typeof insertAccountingSettingsSchema>;
export type UpdateAccountingSettings = z.infer<typeof updateAccountingSettingsSchema>;

export type VatSettings = typeof vat_settings.$inferSelect;
export type InsertVatSettings = z.infer<typeof insertVatSettingsSchema>;
export type UpdateVatSettings = z.infer<typeof updateVatSettingsSchema>;

// AccountRelationship types moved above (after AC_account_relationships definition)

export type OpeningBalance = typeof opening_balances.$inferSelect;
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
  accounting_settings,
  vat_settings,
  account_relationships,
  opening_balances,
  accounting_settingsRelations,
  vat_settingsRelations,
  account_relationshipsRelations,
  opening_balancesRelations,
};

