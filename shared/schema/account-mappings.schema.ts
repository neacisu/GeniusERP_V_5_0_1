/**
 * Account Mappings Schema
 * 
 * RECOMANDARE 5: Conturi contabile configurabile în DB
 * 
 * Permite configurarea planului de conturi specific fiecărei companii
 * fără a hardcoda conturile în cod
 */

import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from '../schema';

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
export const accountMappings = pgTable('account_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  
  // Tipul de operațiune contabilă
  mappingType: accountMappingTypeEnum('mapping_type').notNull(),
  
  // Contul contabil asociat
  accountCode: text('account_code').notNull(), // Ex: '5311', '4111'
  accountName: text('account_name').notNull(), // Ex: 'Casa în lei', 'Clienți'
  
  // Configurare
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  
  // Audit
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by'),
});

export const accountMappingsRelations = relations(accountMappings, ({ one }) => ({
  company: one(companies, {
    fields: [accountMappings.companyId],
    references: [companies.id],
  }),
}));

export type AccountMapping = typeof accountMappings.$inferSelect;
export type InsertAccountMapping = typeof accountMappings.$inferInsert;
