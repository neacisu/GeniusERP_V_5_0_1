/**
 * Accounting Schema
 * 
 * Database schema for the accounting module.
 */

import { pgTable, uuid, text, timestamp, numeric, jsonb, boolean, integer, varchar, date, decimal } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Import related tables
import { accounts, companies } from '../schema';

/**
 * Accounting Ledger Entries table
 * Main table for financial transactions (RAS-compliant)
 * Maps to: accounting_ledger_entries
 */
export const accounting_ledger_entries = pgTable('accounting_ledger_entries', {
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
  reversalEntryId: uuid('reversal_entry_id'),
  reversalReason: varchar('reversal_reason', { length: 500 }),
  
  // Metadata
  metadata: jsonb('metadata')
});

/**
 * Accounting Ledger Lines table
 * Detail lines for each ledger entry (double-entry accounting)
 * Maps to: accounting_ledger_lines
 */
export const accounting_ledger_lines = pgTable('accounting_ledger_lines', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  ledgerEntryId: uuid('ledger_entry_id').notNull().references(() => accounting_ledger_entries.id, { onDelete: 'cascade' }),
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
 * @deprecated Use accounting_ledger_entries instead
 * Legacy schema for backward compatibility
 */
export const ledger_entries = pgTable('ledger_entries', {
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
 * @deprecated Use accounting_ledger_lines instead
 * Legacy schema for backward compatibility
 */
export const ledger_lines = pgTable('ledger_lines', {
  id: uuid('id').primaryKey().notNull(),
  ledgerEntryId: uuid('ledger_entry_id').notNull().references(() => ledger_entries.id, { onDelete: 'cascade' }),
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
export const journal_types = pgTable('journal_types', {
  id: uuid('id').primaryKey().notNull(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

/**
 * Account balances table (AC_ prefix)
 * Running balances for each account
 * 
 * 🏷️  NUME TABEL: AC_account_balances
 * 📁 PREFIX: AC_ (Accounting Configuration)
 */
export const AC_account_balances = pgTable('AC_account_balances', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').notNull(),
  accountId: uuid('account_id').notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  fiscalMonth: integer('fiscal_month').notNull(),
  openingDebit: decimal('opening_debit', { precision: 15, scale: 2 }).notNull().default('0'),
  openingCredit: decimal('opening_credit', { precision: 15, scale: 2 }).notNull().default('0'),
  periodDebit: decimal('period_debit', { precision: 15, scale: 2 }).notNull().default('0'),
  periodCredit: decimal('period_credit', { precision: 15, scale: 2 }).notNull().default('0'),
  closingDebit: decimal('closing_debit', { precision: 15, scale: 2 }).notNull().default('0'),
  closingCredit: decimal('closing_credit', { precision: 15, scale: 2 }).notNull().default('0'),

  // Metadata
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

/**
 * @deprecated Use AC_account_balances instead - backward compatibility alias
 */
export const account_balances = AC_account_balances;

/**
 * Relations for AC_account_balances
 */
export const AC_account_balancesRelations = relations(AC_account_balances, ({ one }) => ({
  account: one(accounts, {
    fields: [AC_account_balances.accountId],
    references: [accounts.id]
  }),
  company: one(companies, {
    fields: [AC_account_balances.companyId],
    references: [companies.id]
  })
}));

/**
 * @deprecated Use AC_account_balancesRelations instead - backward compatibility alias
 */
export const account_balancesRelations = AC_account_balancesRelations;

/**
 * Fiscal periods table
 * Accounting periods configuration
 */
export const fiscal_periods = pgTable('fiscal_periods', {
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
 * Chart of accounts table
 */
export const chart_of_accounts = pgTable('chart_of_accounts', {
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
export const accounting_ledger_entriesRelations = relations(accounting_ledger_entries, ({ many }) => ({
  lines: many(accounting_ledger_lines)
}));

/**
 * Relations for accounting ledger lines
 */
export const accounting_ledger_linesRelations = relations(accounting_ledger_lines, ({ one }) => ({
  entry: one(accounting_ledger_entries, {
    fields: [accounting_ledger_lines.ledgerEntryId],
    references: [accounting_ledger_entries.id]
  })
}));

/**
 * @deprecated Use accounting_ledger_entriesRelations instead
 */
export const ledger_entriesRelations = relations(ledger_entries, ({ many }) => ({
  lines: many(ledger_lines)
}));

/**
 * @deprecated Use accounting_ledger_linesRelations instead
 */
export const ledger_linesRelations = relations(ledger_lines, ({ one }) => ({
  entry: one(ledger_entries, {
    fields: [ledger_lines.ledgerEntryId],
    references: [ledger_entries.id]
  })
}));

/**
 * Relations for chart of accounts
 */
export const chart_of_accountsRelations = relations(chart_of_accounts, ({ one, many }) => ({
  parent: one(chart_of_accounts, {
    fields: [chart_of_accounts.parentId],
    references: [chart_of_accounts.id]
  }),
  children: many(chart_of_accounts)
}));

// Export types for accounting ledger entries
export type AccountingLedgerEntry = typeof accounting_ledger_entries.$inferSelect;
export type InsertAccountingLedgerEntry = typeof accounting_ledger_entries.$inferInsert;

export type AccountingLedgerLine = typeof accounting_ledger_lines.$inferSelect;
export type InsertAccountingLedgerLine = typeof accounting_ledger_lines.$inferInsert;

// Export types for legacy tables (deprecated)
export type LedgerEntry = typeof ledger_entries.$inferSelect;
export type InsertLedgerEntry = typeof ledger_entries.$inferInsert;

export type LedgerLine = typeof ledger_lines.$inferSelect;
export type InsertLedgerLine = typeof ledger_lines.$inferInsert;

export type JournalType = typeof journal_types.$inferSelect;
export type InsertJournalType = typeof journal_types.$inferInsert;

export type AccountBalance = typeof AC_account_balances.$inferSelect;
export type InsertAccountBalance = typeof AC_account_balances.$inferInsert;

export type FiscalPeriod = typeof fiscal_periods.$inferSelect;
export type InsertFiscalPeriod = typeof fiscal_periods.$inferInsert;

export type ChartOfAccount = typeof chart_of_accounts.$inferSelect;
export type InsertChartOfAccount = typeof chart_of_accounts.$inferInsert;

// ============================================================
// ZOD SCHEMAS FOR AC_ACCOUNT_BALANCES
// ============================================================

// AC_account_balances Schemas
export const insertACAccountBalanceSchema = createInsertSchema(AC_account_balances, {
  fiscalYear: z.number().int().min(2000).max(2100),
  fiscalMonth: z.number().int().min(1).max(12),
  openingDebit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  openingCredit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  periodDebit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  periodCredit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  closingDebit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  closingCredit: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export const selectACAccountBalanceSchema = createSelectSchema(AC_account_balances);

export const updateACAccountBalanceSchema = insertACAccountBalanceSchema.partial().omit({
  id: true,
  companyId: true,
  accountId: true,
  createdAt: true,
  updatedAt: true,
});

// Backward compatibility aliases
export const insertAccountBalanceSchema = insertACAccountBalanceSchema;
export const selectAccountBalanceSchema = selectACAccountBalanceSchema;
export const updateAccountBalanceSchema = updateACAccountBalanceSchema;

// Export Zod types
export type InsertACAccountBalanceZod = z.infer<typeof insertACAccountBalanceSchema>;
export type SelectACAccountBalanceZod = z.infer<typeof selectACAccountBalanceSchema>;
export type UpdateACAccountBalanceZod = z.infer<typeof updateACAccountBalanceSchema>;

// Backward compatibility type aliases
export type InsertAccountBalanceZod = InsertACAccountBalanceZod;
export type SelectAccountBalanceZod = SelectACAccountBalanceZod;
export type UpdateAccountBalanceZod = UpdateACAccountBalanceZod;

// ============================================================================
// ADDITIONAL ACCOUNTING TABLES (Previously missing)
// ============================================================================

/**
 * Accounting Account Balances (Extended RAS structure)
 * Detailed balances with full Romanian accounting standard structure
 */
export const accounting_account_balances = pgTable("accounting_account_balances", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  franchiseId: uuid("franchise_id"),
  accountClass: integer("account_class").notNull(),
  accountGroup: integer("account_group").notNull(),
  accountNumber: varchar("account_number", { length: 20 }).notNull(),
  accountSubNumber: varchar("account_sub_number", { length: 20 }),
  fullAccountNumber: varchar("full_account_number", { length: 50 }).notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  fiscalMonth: integer("fiscal_month").notNull(),
  openingDebit: numeric("opening_debit", { precision: 19, scale: 4 }).notNull().default('0'),
  openingCredit: numeric("opening_credit", { precision: 19, scale: 4 }).notNull().default('0'),
  periodDebit: numeric("period_debit", { precision: 19, scale: 4 }).notNull().default('0'),
  periodCredit: numeric("period_credit", { precision: 19, scale: 4 }).notNull().default('0'),
  closingDebit: numeric("closing_debit", { precision: 19, scale: 4 }).notNull().default('0'),
  closingCredit: numeric("closing_credit", { precision: 19, scale: 4 }).notNull().default('0'),
  currency: varchar("currency", { length: 3 }).notNull().default('RON'),
  currencyClosingDebit: numeric("currency_closing_debit", { precision: 19, scale: 4 }).default('0'),
  currencyClosingCredit: numeric("currency_closing_credit", { precision: 19, scale: 4 }).default('0'),
  lastCalculatedAt: timestamp("last_calculated_at").notNull().defaultNow(),
});

/**
 * Accounting Journal Types
 * Different journal types for accounting operations
 */
export const accounting_journal_types = pgTable("accounting_journal_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  defaultDebitAccount: varchar("default_debit_account", { length: 20 }),
  defaultCreditAccount: varchar("default_credit_account", { length: 20 }),
  isSystemJournal: boolean("is_system_journal").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  autoNumberPrefix: varchar("auto_number_prefix", { length: 20 }),
  lastUsedNumber: integer("last_used_number").notNull().default(0),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at"),
});

/**
 * Journal Entries (Legacy)
 * @deprecated Use accounting_ledger_entries
 */
export const journal_entries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().notNull(),
  companyId: uuid("company_id").notNull(),
  franchiseId: uuid("franchise_id"),
  journalType: text("journal_type"),
  referenceNumber: text("reference_number"),
  entryDate: timestamp("entry_date"),
  description: text("description").notNull(),
  totalAmount: numeric("total_amount").notNull(),
  status: varchar("status", { length: 20 }).default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
});

/**
 * Journal Lines (Legacy)
 * @deprecated Use accounting_ledger_lines
 */
export const journal_lines = pgTable("journal_lines", {
  id: uuid("id").primaryKey().notNull(),
  journalEntryId: uuid("journal_entry_id").notNull(),
  accountCode: varchar("account_code", { length: 20 }).notNull(),
  description: text("description"),
  debit: numeric("debit", { precision: 15, scale: 2 }).default('0'),
  credit: numeric("credit", { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Stocks (Legacy)
 * @deprecated Use inventory_stock from inventory.schema.ts
 */
export const stocks = pgTable("stocks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").notNull(),
  warehouseId: uuid("warehouse_id"),
  quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull().default('0'),
  reservedQuantity: numeric("reserved_quantity", { precision: 15, scale: 3 }).default('0'),
  availableQuantity: numeric("available_quantity", { precision: 15, scale: 3 }).default('0'),
  averageCost: numeric("average_cost", { precision: 15, scale: 2 }).default('0'),
  totalValue: numeric("total_value", { precision: 15, scale: 2 }).default('0'),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export default {
  // Current tables
  accounting_ledger_entries,
  accounting_ledger_lines,
  accounting_ledger_entriesRelations,
  accounting_ledger_linesRelations,
  // Legacy tables (deprecated)
  ledger_entries,
  ledger_lines,
  ledger_entriesRelations,
  ledger_linesRelations,
  // Other tables
  journal_types,
  AC_account_balances, // Preferred - standardized with AC_ prefix
  account_balances, // Deprecated alias for backward compatibility
  AC_account_balancesRelations,
  account_balancesRelations, // Deprecated alias
  fiscal_periods,
  chart_of_accounts,
  chart_of_accountsRelations,
  // Newly added tables
  accounting_account_balances,
  accounting_journal_types,
  journal_entries,
  journal_lines,
  stocks
};