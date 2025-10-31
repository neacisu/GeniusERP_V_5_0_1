/**
 * PC_account_mappings Schema (Plan de Conturi - Account Mappings)
 * 
 * RECOMANDARE 5: Conturi contabile configurabile în DB
 * 
 * Permite configurarea planului de conturi specific fiecărei companii
 * fără a hardcoda conturile în cod
 */

import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from '../schema';
import { z } from 'zod';

/**
 * Tipuri de operațiuni contabile
 */
export const accountMappingTypeValues = [
  // Cash accounts
  'CASH_RON',
  'CASH_CURRENCY',
  'PETTY_CASH',
  
  // Bank accounts
  'BANK_PRIMARY',
  'BANK_CURRENCY',
  
  // Third party accounts
  'CUSTOMERS',
  'SUPPLIERS',
  'EMPLOYEE_ADVANCES',
  'EMPLOYEE_PAYROLL',
  'VAT_COLLECTED',
  'VAT_DEDUCTIBLE',
  'VAT_PAYABLE',
  'VAT_RECOVERABLE',
  
  // Expense accounts
  'UTILITIES',
  'SUPPLIES',
  'TRANSPORT',
  'OTHER_SERVICES',
  'BANK_FEES',
  'INTEREST_EXPENSE',
  
  // Income accounts
  'MERCHANDISE_SALES',
  'SERVICE_REVENUE',
  'INTEREST_INCOME',
  
  // Other
  'INTERNAL_TRANSFERS',
  'CASH_SHORTAGES',
  'CASH_OVERAGES',
  'EXCHANGE_DIFF_INCOME',
  'EXCHANGE_DIFF_EXPENSE',
  'SHORT_TERM_LOANS',
  'LONG_TERM_LOANS'
] as const;

export const accountMappingTypeEnum = pgEnum('account_mapping_type', accountMappingTypeValues);

/**
 * Tabela de mapări conturi contabile
 * 
 * Permite fiecărei companii să configureze propriul plan de conturi
 */
export const PC_account_mappings = pgTable('PC_account_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id),
  
  // Tipul de operațiune contabilă
  mapping_type: accountMappingTypeEnum('mapping_type').notNull(),
  
  // Contul contabil asociat
  account_code: text('account_code').notNull(), // Ex: '5311', '4111'
  account_name: text('account_name').notNull(), // Ex: 'Casa în lei', 'Clienți'
  
  // Configurare
  is_default: boolean('is_default').notNull().default(false),
  is_active: boolean('is_active').notNull().default(true),
  
  // Audit
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  created_by: uuid('created_by'),
});

export const PC_account_mappingsRelations = relations(PC_account_mappings, ({ one }) => ({
  company: one(companies, {
    fields: [PC_account_mappings.company_id],
    references: [companies.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const insertAccountMappingSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  mapping_type: z.enum(accountMappingTypeValues),
  account_code: z.string().min(1).regex(/^[0-9]{1,4}(\.[0-9]+)?$/, 'Cod cont invalid (ex: 401, 4111, 371.1)'),
  account_name: z.string().min(1),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().nullable().optional(),
});

export const selectAccountMappingSchema = insertAccountMappingSchema.extend({
  id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const updateAccountMappingSchema = insertAccountMappingSchema.partial().required({ id: true });

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type AccountMapping = typeof PC_account_mappings.$inferSelect;
export type InsertAccountMapping = z.infer<typeof insertAccountMappingSchema>;
export type SelectAccountMapping = z.infer<typeof selectAccountMappingSchema>;
export type UpdateAccountMapping = z.infer<typeof updateAccountMappingSchema>;

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================

/**
 * @deprecated Use PC_account_mappings instead
 */
export const account_mappings = PC_account_mappings;

/**
 * @deprecated Use PC_account_mappingsRelations instead
 */
export const account_mappingsRelations = PC_account_mappingsRelations;
