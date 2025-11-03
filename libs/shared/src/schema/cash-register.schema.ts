/**
 * Cash Register Schema - Romanian Accounting Standards
 * 
 * Prefix AC_ = Accounting Configuration
 * 
 * Implementează Registrul de Casă conform:
 * - OMFP 2861/2009 - Norme metodologice
 * - Legea 82/1991 - Legea contabilității
 * - Codul Fiscal - Limitări și validări pentru operațiuni de casă
 * 
 * Documente suportate:
 * - Chitanță (Cash Receipt) - Document de încasare
 * - Dispoziție de Plată (Cash Payment) - Document de plată
 * - Borderou de Depunere (Bank Deposit) - Depunere numerar la bancă
 * - Borderou de Ridicare (Bank Withdrawal) - Ridicare numerar de la bancă
 */

import { pgTable, uuid, text, timestamp, numeric, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { companies, users } from '../schema';

/**
 * Cash Register Status Enum
 */
export const cashRegisterStatusValues = ['active', 'closed', 'suspended'] as const;
export const cashRegisterStatusEnum = pgEnum('cash_register_status', cashRegisterStatusValues);

/**
 * Cash Transaction Type Enum
 * Tipuri de tranzacții conform legislației românești
 */
export const cashTransactionTypeValues = [
  'cash_receipt',          // Chitanță - încasare
  'cash_payment',          // Dispoziție de plată - plată
  'petty_cash_advance',    // Avans pentru cheltuieli
  'petty_cash_settlement', // Decontare avans
  'cash_count_adjustment', // Regularizare inventar casă
  'cash_transfer',         // Transfer între case
  'bank_deposit',          // Depunere la bancă
  'bank_withdrawal'        // Ridicare de la bancă
] as const;
export const cashTransactionTypeEnum = pgEnum('cash_transaction_type', cashTransactionTypeValues);

/**
 * Cash Transaction Purpose Enum
 * Scopuri pentru tranzacțiile de casă
 */
export const cashTransactionPurposeValues = [
  'customer_payment',      // Plată de la client
  'supplier_payment',      // Plată către furnizor
  'salary_payment',        // Plată salariu
  'expense_payment',       // Plată cheltuieli
  'advance_to_employee',   // Avans către angajat
  'advance_settlement',    // Decontare avans
  'bank_deposit',         // Depunere la bancă
  'cash_withdrawal',      // Ridicare numerar
  'refund',               // Rambursare
  'other'                 // Altele
] as const;
export const cashTransactionPurposeEnum = pgEnum('cash_transaction_purpose', cashTransactionPurposeValues);

/**
 * AC_Cash Registers Table (STANDARDIZED with AC_ prefix)
 * Registrele de casă ale companiei
 * 
 * Conform OMFP 2861/2009, fiecare entitate poate avea multiple registre de casă:
 * - Casa centrală
 * - Case secundare (magazine, puncte de lucru)
 * - Casa în valută
 */
export const AC_cash_registers = pgTable('AC_cash_registers', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  franchise_id: uuid('franchise_id'),
  
  // Identificare
  name: text('name').notNull(),
  code: text('code').notNull(),
  
  // Tip și locație
  type: text('type').notNull().default('main'), // main, secondary, currency, petty_cash
  location: text('location'),
  
  // Currency
  currency: text('currency').notNull().default('RON'),
  
  // Responsabil (Casier)
  responsible_person_id: uuid('responsible_person_id').references(() => users.id),
  responsible_person_name: text('responsible_person_name'),
  
  // Limite (conform legislației)
  daily_limit: numeric('daily_limit', { precision: 15, scale: 2 }),
  max_transaction_amount: numeric('max_transaction_amount', { precision: 15, scale: 2 }),
  
  // Sold curent (actualizat automat)
  current_balance: numeric('current_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Status
  status: cashRegisterStatusEnum('status').notNull().default('active'),
  is_active: boolean('is_active').notNull().default(true),
  
  // Date închidere (pentru case închise)
  closed_at: timestamp('closed_at'),
  closed_by: uuid('closed_by').references(() => users.id),
  closing_balance: numeric('closing_balance', { precision: 15, scale: 2 }),
  
  // Închidere zilnică (ultima zi închisă)
  last_closed_date: text('last_closed_date'),
  
  // Audit
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  created_by: uuid('created_by').references(() => users.id),
  updated_by: uuid('updated_by').references(() => users.id),
}, (table) => ({
  companyIdx: index('idx_AC_cash_registers_company').on(table.company_id),
  statusIdx: index('idx_AC_cash_registers_status').on(table.status),
  codeIdx: index('idx_AC_cash_registers_code').on(table.company_id, table.code),
}));

// Backward Compatibility Alias
export const cash_registers = AC_cash_registers;

/**
 * AC_Cash Transactions Table (STANDARDIZED with AC_ prefix)
 * Tranzacțiile de casă (Chitanțe și Dispoziții de Plată)
 */
export const AC_cash_transactions = pgTable('AC_cash_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  franchise_id: uuid('franchise_id'),
  cash_register_id: uuid('cash_register_id').notNull().references(() => AC_cash_registers.id),
  
  // Numerotare document
  document_number: text('document_number').notNull(),
  series: text('series').notNull(),
  number: numeric('number').notNull(),
  
  // Tip și scop
  transaction_type: cashTransactionTypeEnum('transaction_type').notNull(),
  transaction_purpose: cashTransactionPurposeEnum('transaction_purpose').notNull(),
  transaction_date: timestamp('transaction_date').notNull(),
  
  // Sume
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  vat_amount: numeric('vat_amount', { precision: 15, scale: 2 }).default('0'),
  vat_rate: numeric('vat_rate', { precision: 5, scale: 2 }).default('19'),
  net_amount: numeric('net_amount', { precision: 15, scale: 2 }),
  
  // Currency
  currency: text('currency').notNull().default('RON'),
  exchange_rate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
  
  // Persoană
  person_id: uuid('person_id'),
  person_name: text('person_name').notNull(),
  person_id_number: text('person_id_number'),
  person_address: text('person_address'),
  
  // Referințe
  invoice_id: uuid('invoice_id'),
  invoice_number: text('invoice_number'),
  contract_number: text('contract_number'),
  description: text('description').notNull(),
  
  // Bon fiscal
  is_fiscal_receipt: boolean('is_fiscal_receipt').notNull().default(false),
  fiscal_receipt_number: text('fiscal_receipt_number'),
  fiscal_receipt_data: text('fiscal_receipt_data'),
  
  // Solduri
  balance_before: numeric('balance_before', { precision: 15, scale: 2 }).notNull(),
  balance_after: numeric('balance_after', { precision: 15, scale: 2 }).notNull(),
  
  // Contabilizare
  is_posted: boolean('is_posted').notNull().default(false),
  posted_at: timestamp('posted_at'),
  ledger_entry_id: uuid('ledger_entry_id'),
  
  // Anulare
  is_canceled: boolean('is_canceled').notNull().default(false),
  canceled_at: timestamp('canceled_at'),
  canceled_by: uuid('canceled_by').references(() => users.id),
  cancellation_reason: text('cancellation_reason'),
  
  // Note
  notes: text('notes'),
  metadata: text('metadata'),
  
  // Audit
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  created_by: uuid('created_by').notNull().references(() => users.id),
  updated_by: uuid('updated_by').references(() => users.id),
}, (table) => ({
  companyIdx: index('idx_AC_cash_transactions_company').on(table.company_id),
  registerIdx: index('idx_AC_cash_transactions_register').on(table.cash_register_id),
  dateIdx: index('idx_AC_cash_transactions_date').on(table.transaction_date),
  typeIdx: index('idx_AC_cash_transactions_type').on(table.transaction_type),
  documentIdx: index('idx_AC_cash_transactions_document').on(table.company_id, table.series, table.number),
  personIdx: index('idx_AC_cash_transactions_person').on(table.person_id),
  invoiceIdx: index('idx_AC_cash_transactions_invoice').on(table.invoice_id),
}));

// Backward Compatibility Alias
export const cash_transactions = AC_cash_transactions;

/**
 * Relations
 */
export const AC_cash_registersRelations = relations(AC_cash_registers, ({ one, many }) => ({
  company: one(companies, {
    fields: [AC_cash_registers.company_id],
    references: [companies.id],
  }),
  responsible_person: one(users, {
    fields: [AC_cash_registers.responsible_person_id],
    references: [users.id],
  }),
  transactions: many(AC_cash_transactions),
}));

export const AC_cash_transactionsRelations = relations(AC_cash_transactions, ({ one }) => ({
  company: one(companies, {
    fields: [AC_cash_transactions.company_id],
    references: [companies.id],
  }),
  cash_register: one(AC_cash_registers, {
    fields: [AC_cash_transactions.cash_register_id],
    references: [AC_cash_registers.id],
  }),
  created_by_user: one(users, {
    fields: [AC_cash_transactions.created_by],
    references: [users.id],
  }),
}));

// Backward Compatibility Aliases
export const cashRegisterRelations = AC_cash_registersRelations;
export const cashTransactionRelations = AC_cash_transactionsRelations;

/**
 * Zod Schemas
 */
export const insertCashRegisterSchema = createInsertSchema(AC_cash_registers);
export const selectCashRegisterSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['main', 'secondary', 'currency', 'petty_cash']),
  status: z.enum(cashRegisterStatusValues),
  current_balance: z.string(),
});

export const insertCashTransactionSchema = createInsertSchema(AC_cash_transactions);
export const selectCashTransactionSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  cash_register_id: z.string().uuid(),
  document_number: z.string(),
  transaction_type: z.enum(cashTransactionTypeValues),
  transaction_purpose: z.enum(cashTransactionPurposeValues),
  amount: z.string(),
  person_name: z.string(),
});

/**
 * TypeScript Types
 */
export type ACCashRegister = typeof AC_cash_registers.$inferSelect;
export type InsertACCashRegister = z.infer<typeof insertCashRegisterSchema>;
export type ACCashTransaction = typeof AC_cash_transactions.$inferSelect;
export type InsertACCashTransaction = z.infer<typeof insertCashTransactionSchema>;

// Backward Compatibility Type Aliases
export type CashRegister = ACCashRegister;
export type InsertCashRegister = InsertACCashRegister;
export type CashTransaction = ACCashTransaction;
export type InsertCashTransaction = InsertACCashTransaction;

