/**
 * Accounting Schema
 * 
 * Database schema for the accounting module.
 */

import { pgTable, uuid, text, timestamp, numeric, json, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Ledger entries table
 * Main table for financial transactions
 */
export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey().notNull(),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  type: text('type').notNull(),
  referenceNumber: text('reference_number'),
  amount: numeric('amount').notNull(),
  description: text('description').notNull(),
  metadata: jsonb('metadata'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  createdBy: uuid('created_by')
});

/**
 * Ledger lines table
 * Detail lines for each ledger entry (double-entry accounting)
 */
export const ledgerLines = pgTable('ledger_lines', {
  id: uuid('id').primaryKey().notNull(),
  ledgerEntryId: uuid('ledger_entry_id').notNull().references(() => ledgerEntries.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  debitAmount: numeric('debit_amount').notNull().default('0'),
  creditAmount: numeric('credit_amount').notNull().default('0'),
  description: text('description'),
  metadata: jsonb('metadata'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

/**
 * Journal types table
 * Types of specialized journals in Romanian accounting
 */
export const journalTypes = pgTable('journal_types', {
  id: uuid('id').primaryKey().notNull(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

/**
 * Account balances table
 * Running balances for each account
 */
export const accountBalances = pgTable('account_balances', {
  id: uuid('id').primaryKey().notNull(),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  accountId: text('account_id').notNull(),
  periodYear: numeric('period_year').notNull(),
  periodMonth: numeric('period_month').notNull(),
  openingDebit: numeric('opening_debit').notNull().default('0'),
  openingCredit: numeric('opening_credit').notNull().default('0'),
  periodDebit: numeric('period_debit').notNull().default('0'),
  periodCredit: numeric('period_credit').notNull().default('0'),
  closingDebit: numeric('closing_debit').notNull().default('0'),
  closingCredit: numeric('closing_credit').notNull().default('0'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

/**
 * Fiscal periods table
 * Accounting periods configuration
 */
export const fiscalPeriods = pgTable('fiscal_periods', {
  id: uuid('id').primaryKey().notNull(),
  companyId: uuid('company_id').notNull(),
  year: numeric('year').notNull(),
  month: numeric('month').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isClosed: numeric('is_closed').notNull().default('0'),
  closedAt: timestamp('closed_at'),
  closedBy: uuid('closed_by'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

/**
 * Chart of accounts table
 */
export const chartOfAccounts = pgTable('chart_of_accounts', {
  id: uuid('id').primaryKey().notNull(),
  companyId: uuid('company_id'),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  accountClass: numeric('account_class').notNull(),
  accountGroup: numeric('account_group').notNull(),
  accountType: text('account_type').notNull(),
  isActive: numeric('is_active').notNull().default('1'),
  parentId: uuid('parent_id'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

/**
 * Relations for ledger entries
 */
export const ledgerEntriesRelations = relations(ledgerEntries, ({ many }) => ({
  lines: many(ledgerLines)
}));

/**
 * Relations for ledger lines
 */
export const ledgerLinesRelations = relations(ledgerLines, ({ one }) => ({
  entry: one(ledgerEntries, {
    fields: [ledgerLines.ledgerEntryId],
    references: [ledgerEntries.id]
  })
}));

/**
 * Relations for chart of accounts
 */
export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  parent: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentId],
    references: [chartOfAccounts.id]
  }),
  children: many(chartOfAccounts)
}));

// Export types
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = typeof ledgerEntries.$inferInsert;

export type LedgerLine = typeof ledgerLines.$inferSelect;
export type InsertLedgerLine = typeof ledgerLines.$inferInsert;

export type JournalType = typeof journalTypes.$inferSelect;
export type InsertJournalType = typeof journalTypes.$inferInsert;

export type AccountBalance = typeof accountBalances.$inferSelect;
export type InsertAccountBalance = typeof accountBalances.$inferInsert;

export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;
export type InsertFiscalPeriod = typeof fiscalPeriods.$inferInsert;

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type InsertChartOfAccount = typeof chartOfAccounts.$inferInsert;

export default {
  ledgerEntries,
  ledgerLines,
  journalTypes,
  accountBalances,
  fiscalPeriods,
  chartOfAccounts,
  ledgerEntriesRelations,
  ledgerLinesRelations,
  chartOfAccountsRelations
};