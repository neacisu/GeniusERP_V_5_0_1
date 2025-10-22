/**
 * Bank Journal Schema - Romanian Accounting Standards
 * 
 * Cont 5121 - Conturi la bănci în lei
 * Cont 5124 - Conturi la bănci în valută
 * 
 * Documente: Extras de cont bancar, Ordine de plată (OP), Dispoziții de încasare
 */

import { pgTable, uuid, text, timestamp, numeric, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
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
 * Bank Accounts Table
 */
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  
  accountName: text('account_name').notNull(),
  accountNumber: text('account_number').notNull(), // IBAN
  bankName: text('bank_name').notNull(),
  bankCode: text('bank_code'), // Cod BIC/SWIFT
  currency: text('currency').notNull().default('RON'),
  
  currentBalance: numeric('current_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  
  isActive: boolean('is_active').notNull().default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  companyIdx: index('bank_accounts_company_idx').on(table.companyId),
  accountNumberIdx: index('bank_accounts_number_idx').on(table.accountNumber),
}));

/**
 * Bank Transactions Table
 */
export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  bankAccountId: uuid('bank_account_id').notNull().references(() => bankAccounts.id),
  
  referenceNumber: text('reference_number').notNull(),
  transactionType: bankTransactionTypeEnum('transaction_type').notNull(),
  paymentMethod: bankPaymentMethodEnum('payment_method'),
  
  transactionDate: timestamp('transaction_date').notNull(),
  valueDate: timestamp('value_date'),
  
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('RON'),
  exchangeRate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
  
  description: text('description').notNull(),
  payerName: text('payer_name'),
  payeeName: text('payee_name'),
  
  // Referințe la documente sursă
  invoiceNumber: text('invoice_number'),
  invoiceId: uuid('invoice_id'),
  contractNumber: text('contract_number'),
  
  balanceBefore: numeric('balance_before', { precision: 15, scale: 2 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 15, scale: 2 }).notNull(),
  
  isPosted: boolean('is_posted').notNull().default(false),
  ledgerEntryId: uuid('ledger_entry_id'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
}, (table) => ({
  companyIdx: index('bank_transactions_company_idx').on(table.companyId),
  accountIdx: index('bank_transactions_account_idx').on(table.bankAccountId),
  dateIdx: index('bank_transactions_date_idx').on(table.transactionDate),
}));

export const bankAccountRelations = relations(bankAccounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [bankAccounts.companyId],
    references: [companies.id],
  }),
  transactions: many(bankTransactions),
}));

export const bankTransactionRelations = relations(bankTransactions, ({ one }) => ({
  company: one(companies, {
    fields: [bankTransactions.companyId],
    references: [companies.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [bankTransactions.bankAccountId],
    references: [bankAccounts.id],
  }),
}));

export const insertBankAccountSchema = createInsertSchema(bankAccounts); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertBankTransactionSchema = createInsertSchema(bankTransactions); // Fixed: removed omit() for drizzle-zod compatibility;

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof insertBankAccountSchema.type;

export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = typeof insertBankTransactionSchema.type;

