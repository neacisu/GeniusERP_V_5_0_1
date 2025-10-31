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
  
  // Journal Type - NEW: Link to AC_journal_types
  journalTypeId: uuid('journal_type_id'),
  
  // Dates
  transactionDate: timestamp('transaction_date').notNull().default(sql`now()`),
  postingDate: timestamp('posting_date').notNull().default(sql`now()`),
  documentDate: date('document_date').notNull(),
  
  // Document info
  type: varchar('type', { length: 50 }).notNull(), // @deprecated - use journalTypeId instead
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
 * Account Balances table (AC_ prefix)
 * Solduri contabile cu structură completă RAS (Romanian Accounting Standards)
 * 
 * 🏷️  NUME TABEL: AC_accounting_account_balances
 * 📁 PREFIX: AC_ (Accounting Configuration)
 * 
 * Acest tabel stochează soldurile lunare agregate pentru fiecare cont contabil,
 * conform structurii RAS. Include suport pentru:
 * - Multi-valută (RON, EUR, USD, etc.)
 * - Multi-franchiză (sedii secundare)
 * - Solduri de deschidere, mișcări perioadă, solduri de închidere
 * - Urmărire pe clase, grupe și conturi analitice
 */
export const AC_accounting_account_balances = pgTable('AC_accounting_account_balances', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').notNull(),
  franchise_id: uuid('franchise_id'),
  
  // Structură cont RAS (Romanian Accounting Standards)
  account_class: integer('account_class').notNull(),
  account_group: integer('account_group').notNull(),
  account_number: varchar('account_number', { length: 20 }).notNull(),
  account_sub_number: varchar('account_sub_number', { length: 20 }),
  full_account_number: varchar('full_account_number', { length: 50 }).notNull(),
  
  // Perioadă fiscală
  fiscal_year: integer('fiscal_year').notNull(),
  fiscal_month: integer('fiscal_month').notNull(),
  
  // Solduri RON (monedă națională)
  opening_debit: numeric('opening_debit', { precision: 19, scale: 4 }).notNull().default('0'),
  opening_credit: numeric('opening_credit', { precision: 19, scale: 4 }).notNull().default('0'),
  period_debit: numeric('period_debit', { precision: 19, scale: 4 }).notNull().default('0'),
  period_credit: numeric('period_credit', { precision: 19, scale: 4 }).notNull().default('0'),
  closing_debit: numeric('closing_debit', { precision: 19, scale: 4 }).notNull().default('0'),
  closing_credit: numeric('closing_credit', { precision: 19, scale: 4 }).notNull().default('0'),
  
  // Suport multi-valută
  currency: varchar('currency', { length: 3 }).notNull().default('RON'),
  currency_closing_debit: numeric('currency_closing_debit', { precision: 19, scale: 4 }).default('0'),
  currency_closing_credit: numeric('currency_closing_credit', { precision: 19, scale: 4 }).default('0'),
  
  // Metadata
  last_calculated_at: timestamp('last_calculated_at').notNull().default(sql`now()`)
});

/**
 * @deprecated Use AC_accounting_account_balances instead - backward compatibility alias
 */
export const AC_account_balances = AC_accounting_account_balances;

/**
 * @deprecated Use AC_accounting_account_balances instead - backward compatibility alias
 */
export const account_balances = AC_accounting_account_balances;

/**
 * @deprecated Use AC_accounting_account_balances instead - old name before refactoring
 */
export const accounting_account_balances = AC_accounting_account_balances;

/**
 * Relations for AC_accounting_account_balances
 */
export const AC_accounting_account_balancesRelations = relations(AC_accounting_account_balances, ({ one }) => ({
  company: one(companies, {
    fields: [AC_accounting_account_balances.company_id],
    references: [companies.id]
  })
}));

/**
 * @deprecated Use AC_accounting_account_balancesRelations instead - backward compatibility alias
 */
export const AC_account_balancesRelations = AC_accounting_account_balancesRelations;

/**
 * @deprecated Use AC_accounting_account_balancesRelations instead - backward compatibility alias
 */
export const account_balancesRelations = AC_accounting_account_balancesRelations;

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
export const accounting_ledger_entriesRelations = relations(accounting_ledger_entries, ({ many, one }) => ({
  lines: many(accounting_ledger_lines),
  journalType: one(AC_journal_types, {
    fields: [accounting_ledger_entries.journalTypeId],
    references: [AC_journal_types.id]
  })
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

// AC_journal_types types
export type ACJournalType = typeof AC_journal_types.$inferSelect;
export type InsertACJournalType = typeof AC_journal_types.$inferInsert;

// Backward compatibility type aliases (deprecated - use AC* versions)
export type JournalType = ACJournalType;
export type InsertJournalType = InsertACJournalType;
export type AccountingJournalType = ACJournalType;
export type InsertAccountingJournalType = InsertACJournalType;

// Export types for AC_accounting_account_balances
export type ACAccountBalance = typeof AC_accounting_account_balances.$inferSelect;
export type InsertACAccountBalance = typeof AC_accounting_account_balances.$inferInsert;

// Backward compatibility type aliases (deprecated)
export type AccountBalance = ACAccountBalance;
export type InsertAccountBalance = InsertACAccountBalance;

export type FiscalPeriod = typeof fiscal_periods.$inferSelect;
export type InsertFiscalPeriod = typeof fiscal_periods.$inferInsert;

export type ChartOfAccount = typeof chart_of_accounts.$inferSelect;
export type InsertChartOfAccount = typeof chart_of_accounts.$inferInsert;

// ============================================================
// ZOD SCHEMAS FOR AC_ACCOUNTING_ACCOUNT_BALANCES
// ============================================================

// AC_accounting_account_balances Schemas
export const insertACAccountBalanceSchema = createInsertSchema(AC_accounting_account_balances, {
  fiscal_year: z.number().int().min(2000).max(2100),
  fiscal_month: z.number().int().min(1).max(12),
  account_class: z.number().int().min(1).max(9),
  account_group: z.number().int().min(10).max(99),
  account_number: z.string().min(1).max(20),
  account_sub_number: z.string().max(20).optional(),
  full_account_number: z.string().min(1).max(50),
  opening_debit: z.string().regex(/^\d+(\.\d{1,4})?$/),
  opening_credit: z.string().regex(/^\d+(\.\d{1,4})?$/),
  period_debit: z.string().regex(/^\d+(\.\d{1,4})?$/),
  period_credit: z.string().regex(/^\d+(\.\d{1,4})?$/),
  closing_debit: z.string().regex(/^\d+(\.\d{1,4})?$/),
  closing_credit: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currency: z.string().length(3).default('RON'),
  currency_closing_debit: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  currency_closing_credit: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
});

export const selectACAccountBalanceSchema = createSelectSchema(AC_accounting_account_balances);

export const updateACAccountBalanceSchema = insertACAccountBalanceSchema.partial().omit({
  id: true,
  company_id: true,
  last_calculated_at: true,
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
// ADDITIONAL ACCOUNTING TABLES
// ============================================================================

/**
 * Accounting Journal Types (AC_ prefix)
 * Different journal types for accounting operations
 * 
 * 🏷️  NUME TABEL: AC_journal_types
 * 📁 PREFIX: AC_ (Accounting Configuration)
 * 
 * Tipuri de jurnale contabile conform RAS:
 * - GENJ: Jurnal General (General Journal)
 * - SALE: Jurnal Vânzări (Sales Journal)
 * - PURCH: Jurnal Achiziții (Purchase Journal)
 * - BANK: Jurnal Bănci (Bank Journal)
 * - CASH: Jurnal Casă (Cash Journal)
 * 
 * NOTE: Numerotarea se face în document_counters, nu aici
 */
export const AC_journal_types = pgTable("AC_journal_types", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid("company_id").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  default_debit_account: varchar("default_debit_account", { length: 20 }),
  default_credit_account: varchar("default_credit_account", { length: 20 }),
  is_system_journal: boolean("is_system_journal").notNull().default(false),
  is_active: boolean("is_active").notNull().default(true),
  // @deprecated: auto_number_prefix moved to document_counters.series
  // @deprecated: last_used_number moved to document_counters.last_number
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
  updated_by: uuid("updated_by"),
  updated_at: timestamp("updated_at"),
});

/**
 * @deprecated Use AC_journal_types instead - backward compatibility alias
 */
export const accounting_journal_types = AC_journal_types;

/**
 * Relations for AC_journal_types
 */
export const AC_journal_typesRelations = relations(AC_journal_types, ({ many }) => ({
  ledgerEntries: many(accounting_ledger_entries)
}));

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

// ============================================================
// ZOD SCHEMAS FOR AC_JOURNAL_TYPES
// ============================================================

// AC_journal_types Schemas
export const insertACJournalTypeSchema = createInsertSchema(AC_journal_types, {
  code: z.string().max(20).regex(/^[A-Z0-9_]+$/, "Codul trebuie să fie uppercase alfanumeric"),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  default_debit_account: z.string().max(20).optional(),
  default_credit_account: z.string().max(20).optional(),
  is_system_journal: z.boolean().default(false),
  is_active: z.boolean().default(true),
  // REMOVED: auto_number_prefix, last_used_number (moved to document_counters)
});

export const selectACJournalTypeSchema = createSelectSchema(AC_journal_types);

export const updateACJournalTypeSchema = insertACJournalTypeSchema.partial().omit({
  id: true,
  company_id: true,
  created_by: true,
  created_at: true,
});

// Backward compatibility aliases
export const insertAccountingJournalTypeSchema = insertACJournalTypeSchema;
export const selectAccountingJournalTypeSchema = selectACJournalTypeSchema;
export const updateAccountingJournalTypeSchema = updateACJournalTypeSchema;

// Export Zod types
export type InsertACJournalTypeZod = z.infer<typeof insertACJournalTypeSchema>;
export type SelectACJournalTypeZod = z.infer<typeof selectACJournalTypeSchema>;
export type UpdateACJournalTypeZod = z.infer<typeof updateACJournalTypeSchema>;

// Backward compatibility type aliases
export type InsertAccountingJournalTypeZod = InsertACJournalTypeZod;
export type SelectAccountingJournalTypeZod = SelectACJournalTypeZod;
export type UpdateAccountingJournalTypeZod = UpdateACJournalTypeZod;

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
  // Account balances
  AC_accounting_account_balances, // Preferred - standardized with AC_ prefix and full RAS structure
  AC_account_balances, // Deprecated alias for backward compatibility
  account_balances, // Deprecated alias for backward compatibility
  accounting_account_balances, // Deprecated alias for backward compatibility
  AC_accounting_account_balancesRelations,
  AC_account_balancesRelations, // Deprecated alias
  account_balancesRelations, // Deprecated alias
  // Fiscal periods & chart of accounts
  fiscal_periods,
  chart_of_accounts,
  chart_of_accountsRelations,
  // Journal types
  AC_journal_types, // Preferred - standardized with AC_ prefix
  accounting_journal_types, // Deprecated alias for backward compatibility
  AC_journal_typesRelations,
  // Legacy journal tables
  journal_entries,
  journal_lines,
  stocks
};