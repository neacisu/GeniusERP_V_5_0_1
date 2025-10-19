/**
 * Accounting Schema
 * 
 * Database schema for the accounting module.
 */

import { pgTable, uuid, text, timestamp, numeric, jsonb, boolean, unique, integer, varchar, date } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

/**
 * Accounting Ledger Entries table
 * Main table for financial transactions (RAS-compliant)
 * Maps to: accounting_ledger_entries
 */
export const accountingLedgerEntries = pgTable('accounting_ledger_entries', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').notNull(),
  franchiseId: uuid('franchise_id'),
  
  // Dates
  transactionDate: timestamp('transaction_date').notNull().default(sql`now()`),
  postingDate: timestamp('posting_date').notNull().default(sql`now()`),
  documentDate: date('document_date').notNull(),
  
  // Document info
  type: varchar('type', { length: 50 }).notNull(),
  documentNumber: varchar('document_number', { length: 100 }),
  documentType: varchar('document_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  referenceTable: varchar('reference_table', { length: 100 }),
  
  // Content
  description: varchar('description', { length: 500 }),
  notes: text('notes'),
  
  // Status flags
  isPosted: boolean('is_posted').notNull().default(false),
  isDraft: boolean('is_draft').notNull().default(true),
  isSystemGenerated: boolean('is_system_generated').notNull().default(false),
  
  // Amounts
  totalAmount: numeric('total_amount', { precision: 19, scale: 4 }).notNull(),
  totalDebit: numeric('total_debit', { precision: 19, scale: 4 }).notNull(),
  totalCredit: numeric('total_credit', { precision: 19, scale: 4 }).notNull(),
  
  // Currency
  currency: varchar('currency', { length: 3 }).notNull().default('RON'),
  exchangeRate: numeric('exchange_rate', { precision: 19, scale: 6 }).notNull().default('1'),
  exchangeRateDate: date('exchange_rate_date'),
  
  // Fiscal period
  fiscalYear: integer('fiscal_year').notNull(),
  fiscalMonth: integer('fiscal_month').notNull(),
  
  // Audit trail
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at'),
  postedBy: uuid('posted_by'),
  postedAt: timestamp('posted_at'),
  reversedBy: uuid('reversed_by'),
  reversedAt: timestamp('reversed_at'),
  
  // Reversal info
  isReversal: boolean('is_reversal').notNull().default(false),
  originalEntryId: uuid('original_entry_id'),
  reversalReason: varchar('reversal_reason', { length: 500 }),
  
  // Metadata
  metadata: jsonb('metadata')
});

/**
 * Accounting Ledger Lines table
 * Detail lines for each ledger entry (double-entry accounting)
 * Maps to: accounting_ledger_lines
 */
export const accountingLedgerLines = pgTable('accounting_ledger_lines', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  ledgerEntryId: uuid('ledger_entry_id').notNull().references(() => accountingLedgerEntries.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull(),
  
  // Line details
  lineNumber: integer('line_number').notNull(),
  description: varchar('description', { length: 500 }),
  
  // Account structure (RAS)
  accountClass: integer('account_class').notNull(),
  accountGroup: integer('account_group').notNull(),
  accountNumber: varchar('account_number', { length: 20 }).notNull(),
  accountSubNumber: varchar('account_sub_number', { length: 20 }),
  fullAccountNumber: varchar('full_account_number', { length: 50 }).notNull(),
  
  // Amounts
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  debitAmount: numeric('debit_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  creditAmount: numeric('credit_amount', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Currency
  currency: varchar('currency', { length: 3 }).notNull().default('RON'),
  originalAmount: numeric('original_amount', { precision: 19, scale: 4 }),
  exchangeRate: numeric('exchange_rate', { precision: 19, scale: 6 }).notNull().default('1'),
  
  // Analytical dimensions
  departmentId: uuid('department_id'),
  projectId: uuid('project_id'),
  costCenterId: uuid('cost_center_id'),
  
  // VAT
  vatCode: varchar('vat_code', { length: 20 }),
  vatPercentage: numeric('vat_percentage', { precision: 5, scale: 2 }),
  vatAmount: numeric('vat_amount', { precision: 19, scale: 4 }),
  
  // Item linking
  itemType: varchar('item_type', { length: 50 }),
  itemId: uuid('item_id'),
  itemQuantity: numeric('item_quantity', { precision: 19, scale: 4 }),
  itemUnitPrice: numeric('item_unit_price', { precision: 19, scale: 4 }),
  
  // Metadata
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at')
});

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
 * Relations for accounting ledger entries
 */
export const accountingLedgerEntriesRelations = relations(accountingLedgerEntries, ({ many }) => ({
  lines: many(accountingLedgerLines)
}));

/**
 * Relations for accounting ledger lines
 */
export const accountingLedgerLinesRelations = relations(accountingLedgerLines, ({ one }) => ({
  entry: one(accountingLedgerEntries, {
    fields: [accountingLedgerLines.ledgerEntryId],
    references: [accountingLedgerEntries.id]
  })
}));

/**
 * @deprecated Use accountingLedgerEntriesRelations instead
 */
export const ledgerEntriesRelations = relations(ledgerEntries, ({ many }) => ({
  lines: many(ledgerLines)
}));

/**
 * @deprecated Use accountingLedgerLinesRelations instead
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

// Export types for accounting ledger entries
export type AccountingLedgerEntry = typeof accountingLedgerEntries.$inferSelect;
export type InsertAccountingLedgerEntry = typeof accountingLedgerEntries.$inferInsert;

export type AccountingLedgerLine = typeof accountingLedgerLines.$inferSelect;
export type InsertAccountingLedgerLine = typeof accountingLedgerLines.$inferInsert;

// Export types for legacy tables (deprecated)
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

export type DocumentCounter = typeof documentCounters.$inferSelect;
export type InsertDocumentCounter = typeof documentCounters.$inferInsert;

export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type InsertChartOfAccount = typeof chartOfAccounts.$inferInsert;

export default {
  // Current tables
  accountingLedgerEntries,
  accountingLedgerLines,
  accountingLedgerEntriesRelations,
  accountingLedgerLinesRelations,
  // Legacy tables (deprecated)
  ledgerEntries,
  ledgerLines,
  ledgerEntriesRelations,
  ledgerLinesRelations,
  // Other tables
  journalTypes,
  accountBalances,
  fiscalPeriods,
  documentCounters,
  chartOfAccounts,
  chartOfAccountsRelations
};