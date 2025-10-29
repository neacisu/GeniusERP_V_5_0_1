/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Cash Register Schema - Romanian Accounting Standards
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
import { sql } from 'drizzle-orm';
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
 * Cash Registers Table
 * Registrele de casă ale companiei
 * 
 * Conform OMFP 2861/2009, fiecare entitate poate avea multiple registre de casă:
 * - Casa centrală
 * - Case secundare (magazine, puncte de lucru)
 * - Casa în valută
 */
export const cash_registers = pgTable('cash_registers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  franchiseId: uuid('franchise_id'), // Pentru lanțuri de magazine
  
  // Identificare
  name: text('name').notNull(), // Ex: "Casa Centrală", "Casa Magazin 1"
  code: text('code').notNull(), // Cod intern (ex: "CC", "CM1")
  
  // Tip și locație
  type: text('type').notNull().default('main'), // main, secondary, currency, petty_cash
  location: text('location'), // Locația fizică
  
  // Currency
  currency: text('currency').notNull().default('RON'),
  
  // Responsabil (Casier)
  responsiblePersonId: uuid('responsible_person_id').references(() => users.id),
  responsiblePersonName: text('responsible_person_name'),
  
  // Limite (conform legislației)
  dailyLimit: numeric('daily_limit', { precision: 15, scale: 2 }), // Limită zilnică de numerar
  maxTransactionAmount: numeric('max_transaction_amount', { precision: 15, scale: 2 }), // Limită per tranzacție
  
  // Sold curent (actualizat automat)
  currentBalance: numeric('current_balance', { precision: 15, scale: 2 }).notNull().default('0'),
  
  // Status
  status: cashRegisterStatusEnum('status').notNull().default('active'),
  isActive: boolean('is_active').notNull().default(true),
  
  // Date închidere (pentru case închise)
  closedAt: timestamp('closed_at'),
  closedBy: uuid('closed_by').references(() => users.id),
  closingBalance: numeric('closing_balance', { precision: 15, scale: 2 }),
  
  // Închidere zilnică (ultima zi închisă)
  lastClosedDate: text('last_closed_date'), // Format: 'YYYY-MM-DD' (tip DATE în DB)
  
  // Audit
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  companyIdx: index('cash_registers_company_idx').on(table.companyId),
  statusIdx: index('cash_registers_status_idx').on(table.status),
  codeIdx: index('cash_registers_code_idx').on(table.companyId, table.code),
}));

/**
 * Cash Transactions Table
 * Tranzacțiile de casă (Chitanțe și Dispoziții de Plată)
 * 
 * Conform OMFP 2861/2009, fiecare operațiune de casă trebuie înregistrată cu:
 * - Număr document (chitanță/dispoziție)
 * - Data și ora
 * - Suma
 * - Persoana (nume, CNP/CI când e necesar)
 * - Baza (factura, contract, etc.)
 */
export const cash_transactions = pgTable('cash_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  franchiseId: uuid('franchise_id'),
  cashRegisterId: uuid('cash_register_id').notNull().references(() => cash_registers.id),
  
  // Numerotare document (Serie + Număr)
  documentNumber: text('document_number').notNull(), // Ex: "CH-2025-00001"
  series: text('series').notNull(), // Ex: "CH" pentru chitanță, "DP" pentru dispoziție
  number: numeric('number').notNull(), // Număr secvențial în serie
  
  // Tip și scop tranzacție
  transactionType: cashTransactionTypeEnum('transaction_type').notNull(),
  transactionPurpose: cashTransactionPurposeEnum('transaction_purpose').notNull(),
  
  // Date și timp (IMPORTANT: conform legislației, data trebuie să fie astăzi)
  transactionDate: timestamp('transaction_date').notNull(),
  
  // Sume
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  vatAmount: numeric('vat_amount', { precision: 15, scale: 2 }).default('0'),
  vatRate: numeric('vat_rate', { precision: 5, scale: 2 }).default('19'), // 19% default
  netAmount: numeric('net_amount', { precision: 15, scale: 2 }),
  
  // Currency și curs
  currency: text('currency').notNull().default('RON'),
  exchangeRate: numeric('exchange_rate', { precision: 10, scale: 4 }).default('1.0000'),
  
  // Persoană (Client/Furnizor/Angajat)
  // IMPORTANT: Conform legislației, pentru anumite tranzacții este obligatoriu CNP/CI
  personId: uuid('person_id'), // Link către customers/suppliers/employees
  personName: text('person_name').notNull(), // Nume persoană (obligatoriu)
  personIdNumber: text('person_id_number'), // CNP sau Serie/Nr. CI (obligatoriu pentru plăți >5000 RON sau salarii)
  personAddress: text('person_address'), // Adresă (opțional, dar recomandat)
  
  // Baza operațiunii (Factură, Contract, etc.) - pentru urmărire și reconciliere
  invoiceId: uuid('invoice_id'), // Link către invoices
  invoiceNumber: text('invoice_number'), // Număr factură (afișat în coloana Referință)
  contractNumber: text('contract_number'), // Număr contract
  description: text('description').notNull(), // Descriere operațiune (obligatoriu)
  
  // Bon fiscal (pentru case cu POS fiscal)
  isFiscalReceipt: boolean('is_fiscal_receipt').notNull().default(false),
  fiscalReceiptNumber: text('fiscal_receipt_number'), // Număr bon fiscal
  fiscalReceiptData: text('fiscal_receipt_data'), // Date bon fiscal (JSON)
  
  // Sold înainte și după
  balanceBefore: numeric('balance_before', { precision: 15, scale: 2 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 15, scale: 2 }).notNull(),
  
  // Contabilizare
  isPosted: boolean('is_posted').notNull().default(false),
  postedAt: timestamp('posted_at'),
  ledgerEntryId: uuid('ledger_entry_id'), // Link către ledger_entries
  
  // Anulare (dacă e cazul)
  isCanceled: boolean('is_canceled').notNull().default(false),
  canceledAt: timestamp('canceled_at'),
  canceledBy: uuid('canceled_by').references(() => users.id),
  cancellationReason: text('cancellation_reason'),
  
  // Note și metadata
  notes: text('notes'),
  metadata: text('metadata'), // JSON pentru date suplimentare
  
  // Audit
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  companyIdx: index('cash_transactions_company_idx').on(table.companyId),
  registerIdx: index('cash_transactions_register_idx').on(table.cashRegisterId),
  dateIdx: index('cash_transactions_date_idx').on(table.transactionDate),
  typeIdx: index('cash_transactions_type_idx').on(table.transactionType),
  documentIdx: index('cash_transactions_document_idx').on(table.companyId, table.series, table.number),
  personIdx: index('cash_transactions_person_idx').on(table.personId),
  invoiceIdx: index('cash_transactions_invoice_idx').on(table.invoiceId),
}));

/**
 * Relations
 */
export const cashRegisterRelations = relations(cash_registers, ({ one, many }) => ({
  company: one(companies, {
    fields: [cash_registers.companyId],
    references: [companies.id],
  }),
  responsiblePerson: one(users, {
    fields: [cash_registers.responsiblePersonId],
    references: [users.id],
  }),
  transactions: many(cash_transactions),
}));

export const cashTransactionRelations = relations(cash_transactions, ({ one }) => ({
  company: one(companies, {
    fields: [cash_transactions.companyId],
    references: [companies.id],
  }),
  cashRegister: one(cash_registers, {
    fields: [cash_transactions.cashRegisterId],
    references: [cash_registers.id],
  }),
  createdByUser: one(users, {
    fields: [cash_transactions.createdBy],
    references: [users.id],
  }),
}));

/**
 * Insert schemas
 */
export const insertCashRegisterSchema = createInsertSchema(cash_registers); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertCashTransactionSchema = createInsertSchema(cash_transactions); // Fixed: removed omit() for drizzle-zod compatibility;

/**
 * Types
 */
export type CashRegister = typeof cash_registers.$inferSelect;
export type InsertCashRegister = z.infer<typeof insertCashRegisterSchema>;

export type CashTransaction = typeof cash_transactions.$inferSelect;
export type InsertCashTransaction = z.infer<typeof insertCashTransactionSchema>;

