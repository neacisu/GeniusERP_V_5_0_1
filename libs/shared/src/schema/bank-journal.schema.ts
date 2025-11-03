/**
 * Bank Journal Schema - Romanian Accounting Standards
 * 
 * Prefix AC_ = Accounting Configuration
 * 
 * Cont 5121 - Conturi la bănci în lei
 * Cont 5124 - Conturi la bănci în valută
 * 
 * Documente: Extras de cont bancar, Ordine de plată (OP), Dispoziții de încasare
 */

import { pgTable, uuid, text, timestamp, numeric, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { companies, users } from '../schema';

/**
 * Bank Transaction Type Enum
 */
export const bankTransactionTypeValues = [
  'incoming_payment',
  'outgoing_payment',
  'bank_fee',
  'bank_interest',
  'transfer_between_accounts',
  'loan_disbursement',
  'loan_repayment',
  'foreign_exchange',
  'other'
] as const;
export const bankTransactionTypeEnum = pgEnum('bank_transaction_type', bankTransactionTypeValues);

/**
 * Bank Payment Method Enum
 */
export const bankPaymentMethodValues = [
  'bank_transfer',
  'direct_debit',
  'card_payment',
  'standing_order',
  'online_banking',
  'mobile_banking',
  'other'
] as const;
export const bankPaymentMethodEnum = pgEnum('bank_payment_method', bankPaymentMethodValues);

/**
 * AC_Bank Accounts Table (STANDARDIZED with AC_ prefix)
 */
export const AC_bank_accounts = pgTable('AC_bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  account_name: text('account_name').notNull(),
  account_number: text('account_number').notNull(), // IBAN
  bank_name: text('bank_name').notNull(),
  bank_code: text('bank_code'),
  currency: text('currency').notNull().default('RON'),
  
  current_balance: numeric('current_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  
  is_active: boolean('is_active').notNull().default(true),
  
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  created_by: uuid('created_by').references(() => users.id),
}, (table) => ({
  companyIdx: index('idx_AC_bank_accounts_company').on(table.company_id),
  accountNumberIdx: index('idx_AC_bank_accounts_number').on(table.account_number),
}));

// Backward Compatibility
export const bank_accounts = AC_bank_accounts;

/**
 * AC_Bank Transactions Table (STANDARDIZED with AC_ prefix)
 */
export const AC_bank_transactions = pgTable('AC_bank_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  bank_account_id: uuid('bank_account_id').notNull().references(() => AC_bank_accounts.id),
  
  reference_number: text('reference_number').notNull(),
  transaction_type: bankTransactionTypeEnum('transaction_type').notNull(),
  payment_method: bankPaymentMethodEnum('payment_method'),
  
  transaction_date: timestamp('transaction_date').notNull(),
  value_date: timestamp('value_date'),
  
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('RON'),
  exchange_rate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
  
  description: text('description').notNull(),
  payer_name: text('payer_name'),
  payee_name: text('payee_name'),
  
  // Referințe
  invoice_number: text('invoice_number'),
  invoice_id: uuid('invoice_id'),
  contract_number: text('contract_number'),
  
  balance_before: numeric('balance_before', { precision: 15, scale: 2 }).notNull(),
  balance_after: numeric('balance_after', { precision: 15, scale: 2 }).notNull(),
  
  is_posted: boolean('is_posted').notNull().default(false),
  ledger_entry_id: uuid('ledger_entry_id'),
  
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  created_by: uuid('created_by').notNull().references(() => users.id),
}, (table) => ({
  companyIdx: index('idx_AC_bank_transactions_company').on(table.company_id),
  accountIdx: index('idx_AC_bank_transactions_account').on(table.bank_account_id),
  dateIdx: index('idx_AC_bank_transactions_date').on(table.transaction_date),
}));

// Backward Compatibility
export const bank_transactions = AC_bank_transactions;

export const AC_bank_accountsRelations = relations(AC_bank_accounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [AC_bank_accounts.company_id],
    references: [companies.id],
  }),
  transactions: many(AC_bank_transactions),
}));

export const AC_bank_transactionsRelations = relations(AC_bank_transactions, ({ one }) => ({
  company: one(companies, {
    fields: [AC_bank_transactions.company_id],
    references: [companies.id],
  }),
  bank_account: one(AC_bank_accounts, {
    fields: [AC_bank_transactions.bank_account_id],
    references: [AC_bank_accounts.id],
  }),
}));

// Backward Compatibility
export const bankAccountRelations = AC_bank_accountsRelations;
export const bankTransactionRelations = AC_bank_transactionsRelations;

// Zod Schemas
export const insertBankAccountSchema = createInsertSchema(AC_bank_accounts);
export const insertBankTransactionSchema = createInsertSchema(AC_bank_transactions);

// TypeScript Types
export type ACBankAccount = typeof AC_bank_accounts.$inferSelect;
export type InsertACBankAccount = z.infer<typeof insertBankAccountSchema>;
export type ACBankTransaction = typeof AC_bank_transactions.$inferSelect;
export type InsertACBankTransaction = z.infer<typeof insertBankTransactionSchema>;

// Backward Compatibility
export type BankAccount = ACBankAccount;
export type InsertBankAccount = InsertACBankAccount;
export type BankTransaction = ACBankTransaction;
export type InsertBankTransaction = InsertACBankTransaction;

