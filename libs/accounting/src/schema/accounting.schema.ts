/**
 * Accounting Schema
 * 
 * Database schema for the accounting module.
 */

import { pgTable, uuid, text, timestamp, numeric, jsonb, boolean, unique, integer, varchar, date } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Import standardized schemas from shared
import {
  // AC_accounting_ledger_entries & lines
  AC_accounting_ledger_entries,
  AC_accounting_ledger_entriesRelations,
  AC_accounting_ledger_lines,
  AC_accounting_ledger_linesRelations,
  accounting_ledger_entries, // deprecated alias
  accounting_ledger_lines, // deprecated alias
  accounting_ledger_entriesRelations, // deprecated alias
  accounting_ledger_linesRelations, // deprecated alias
  ACAccountingLedgerEntry,
  InsertACAccountingLedgerEntry,
  ACAccountingLedgerLine,
  InsertACAccountingLedgerLine,
  insertACAccountingLedgerEntrySchema,
  selectACAccountingLedgerEntrySchema,
  updateACAccountingLedgerEntrySchema,
  insertACAccountingLedgerLineSchema,
  selectACAccountingLedgerLineSchema,
  updateACAccountingLedgerLineSchema,
  // AC_accounting_account_balances
  AC_accounting_account_balances,
  AC_accounting_account_balancesRelations,
  AC_account_balances, // deprecated alias
  AC_account_balancesRelations, // deprecated alias
  account_balances, // deprecated alias
  account_balancesRelations, // deprecated alias
  insertACAccountBalanceSchema,
  selectACAccountBalanceSchema,
  updateACAccountBalanceSchema,
  insertAccountBalanceSchema, // deprecated alias
  selectAccountBalanceSchema, // deprecated alias
  updateAccountBalanceSchema, // deprecated alias
  // AC_journal_types
  AC_journal_types, // Preferred - standardized with AC_ prefix
  accounting_journal_types, // deprecated alias
  ACJournalType,
  InsertACJournalType,
  insertACJournalTypeSchema,
  selectACJournalTypeSchema,
  updateACJournalTypeSchema
} from '../../../shared/src/schema/accounting.schema';

// Types are defined locally in this file

// Preferred exports with AC_ prefix
export const ACAccountingLedgerEntries = AC_accounting_ledger_entries;
export const ACAccountingLedgerLines = AC_accounting_ledger_lines;
export const ACAccountingLedgerEntriesRelations = AC_accounting_ledger_entriesRelations;
export const ACAccountingLedgerLinesRelations = AC_accounting_ledger_linesRelations;
export const ACAccountBalances = AC_accounting_account_balances;
export const ACAccountBalancesRelations = AC_accounting_account_balancesRelations;
export const ACJournalTypes = AC_journal_types;

// Backward compatibility aliases
export const accountingLedgerEntries = accounting_ledger_entries;
export const accountingLedgerLines = accounting_ledger_lines;
export const accountingLedgerEntriesRelations = accounting_ledger_entriesRelations;
export const accountingLedgerLinesRelations = accounting_ledger_linesRelations;
export const accountBalances = account_balances;
export const accountBalancesRelations = account_balancesRelations;
export const journalTypes = accounting_journal_types; // Now points to AC_journal_types via alias

/**
 * @deprecated Use accountingLedgerEntries instead
 * Legacy schema for backward compatibility
 */
export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey().notNull(),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  type: text('type').notNull(),
  referenceNumber: text('reference_number'),
  journalNumber: text('journal_number'),
  entryDate: timestamp('entry_date'),
  documentDate: timestamp('document_date'),
  amount: numeric('amount').notNull(),
  description: text('description').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  createdBy: uuid('created_by')
});

/**
 * @deprecated Use accountingLedgerLines instead
 * Legacy schema for backward compatibility
 */
export const ledgerLines = pgTable('ledger_lines', {
  id: uuid('id').primaryKey().notNull(),
  ledgerEntryId: uuid('ledger_entry_id').notNull().references(() => ledgerEntries.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  debitAmount: numeric('debit_amount').notNull().default('0'),
  creditAmount: numeric('credit_amount').notNull().default('0'),
  description: text('description'),
  metadata: jsonb('metadata'),
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
  status: text('status').notNull().default('open'), // 'open', 'soft_close', 'hard_close'
  isClosed: boolean('is_closed').notNull().default(false),
  closedAt: timestamp('closed_at'),
  closedBy: uuid('closed_by'),
  reopenedAt: timestamp('reopened_at'),
  reopenedBy: uuid('reopened_by'),
  reopeningReason: text('reopening_reason'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

/**
 * Document counters table
 * Sequential numbering for journals and documents
 */
export const documentCounters = pgTable('document_counters', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').notNull(), // Nu facem foreign key - poate să nu existe în companies
  counterType: text('counter_type').notNull(), // 'JOURNAL', 'INVOICE', 'RECEIPT'
  series: text('series').notNull(), // 'JV', 'SA', 'PU', 'CA', 'BA'
  year: numeric('year').notNull(),
  lastNumber: numeric('last_number').notNull().default('0'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => {
  return {
    uniqueCounter: unique().on(table.companyId, table.counterType, table.series, table.year)
  };
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
 * Relations for chart of accounts
 */
export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  parent: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentId],
    references: [chartOfAccounts.id]
  }),
  children: many(chartOfAccounts)
}));

// Re-export types from shared
export type { ACAccountingLedgerEntry, InsertACAccountingLedgerEntry };
export type { ACAccountingLedgerLine, InsertACAccountingLedgerLine };
export type { ACJournalType, InsertACJournalType };

// Backward compatibility aliases
export type AccountingLedgerEntry = ACAccountingLedgerEntry;
export type InsertAccountingLedgerEntry = InsertACAccountingLedgerEntry;
export type AccountingLedgerLine = ACAccountingLedgerLine;
export type InsertAccountingLedgerLine = InsertACAccountingLedgerLine;
export type JournalType = ACJournalType; // Backward compatibility
export type InsertJournalType = InsertACJournalType; // Backward compatibility

export type AccountBalance = typeof accountBalances.$inferSelect;
export type InsertAccountBalance = typeof accountBalances.$inferInsert;

export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;
export type InsertFiscalPeriod = typeof fiscalPeriods.$inferInsert;

export type DocumentCounter = typeof documentCounters.$inferSelect;
export type InsertDocumentCounter = typeof documentCounters.$inferInsert;

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type InsertChartOfAccount = typeof chartOfAccounts.$inferInsert;

export default {
  // AC_ prefix tables (preferred)
  ACAccountingLedgerEntries,
  ACAccountingLedgerLines,
  ACAccountingLedgerEntriesRelations,
  ACAccountingLedgerLinesRelations,
  ACAccountBalances,
  ACAccountBalancesRelations,
  ACJournalTypes,
  // Current tables (backward compatibility)
  accountingLedgerEntries,
  accountingLedgerLines,
  accountingLedgerEntriesRelations,
  accountingLedgerLinesRelations,
  // Legacy tables (deprecated)
  ledgerEntries,
  ledgerLines,
  // AC_journal_types - imported from shared
  AC_journal_types, // re-export from shared
  accounting_journal_types, // re-export from shared (deprecated)
  insertACJournalTypeSchema,
  selectACJournalTypeSchema,
  updateACJournalTypeSchema,
  // Account balances
  AC_accounting_account_balances, // re-export from shared
  AC_accounting_account_balancesRelations,
  AC_account_balances, // deprecated alias
  AC_account_balancesRelations, // deprecated alias
  account_balances, // deprecated alias
  account_balancesRelations, // deprecated alias
  insertACAccountBalanceSchema,
  selectACAccountBalanceSchema,
  updateACAccountBalanceSchema,
  insertAccountBalanceSchema, // deprecated alias
  selectAccountBalanceSchema, // deprecated alias
  updateAccountBalanceSchema, // deprecated alias
  // Zod schemas for ledger entries/lines
  insertACAccountingLedgerEntrySchema,
  selectACAccountingLedgerEntrySchema,
  updateACAccountingLedgerEntrySchema,
  insertACAccountingLedgerLineSchema,
  selectACAccountingLedgerLineSchema,
  updateACAccountingLedgerLineSchema,
  // Other tables
  fiscalPeriods,
  documentCounters,
  chartOfAccounts,
  chartOfAccountsRelations,
};