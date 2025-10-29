/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Invoicing Schema
 * 
 * Complete invoicing system for Romanian accounting standards.
 * Includes invoices, partner details, and payment tracking.
 * 
 * Tables:
 * - invoices: Main invoice records with ANAF compliance
 * - invoice_details: Partner/customer information per invoice
 * - invoice_payments: Payment tracking with VAT transfer support
 * 
 * All structures match PostgreSQL DB exactly.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { invoice_status } from './enums';

// Forward references (resolved when schemas combined)
declare const companies: any;
declare const users: any;
declare const crm_customers: any;
declare const invoice_items: any;
declare const bank_transactions: any;
declare const cash_transactions: any;

// ============================================================================
// INVOICING TABLES
// ============================================================================

/**
 * Invoices table
 * Main invoice records with full ANAF compliance
 * Supports: regular invoices, proforma, credit notes
 */
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').notNull(),
  franchise_id: uuid('franchise_id'),
  
  // Invoice numbering
  invoice_number: text('invoice_number'),
  series: varchar('series', { length: 8 }),
  number: integer('number'),
  
  // Customer
  customer_id: uuid('customer_id'),
  customer_name: text('customer_name'),
  
  // Dates
  date: timestamp('date').notNull().default(sql`now()`),
  issue_date: timestamp('issue_date').notNull().default(sql`now()`),
  due_date: timestamp('due_date'),
  
  // Amounts
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  total_amount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  net_amount: numeric('net_amount', { precision: 15, scale: 2 }),
  vat_amount: numeric('vat_amount', { precision: 15, scale: 2 }),
  net_total: numeric('net_total', { precision: 15, scale: 2 }),
  vat_total: numeric('vat_total', { precision: 15, scale: 2 }),
  gross_total: numeric('gross_total', { precision: 15, scale: 2 }),
  
  // Currency
  currency: varchar('currency', { length: 5 }).notNull().default('RON'),
  exchange_rate: numeric('exchange_rate', { precision: 10, scale: 4 }).notNull().default('1.0000'),
  
  // Status and type
  status: invoice_status('status').notNull().default('draft'),
  type: text('type'), // 'INVOICE', 'CREDIT_NOTE', 'PROFORMA'
  
  // VAT
  is_cash_vat: boolean('is_cash_vat').default(false),
  
  // Relations
  related_invoice_id: uuid('related_invoice_id'), // For credit notes
  
  // Content
  description: text('description'),
  notes: text('notes'),
  
  // Versioning
  version: integer('version').notNull().default(1),
  
  // Validation
  is_validated: boolean('is_validated').notNull().default(false),
  validated_at: timestamp('validated_at'),
  validated_by: uuid('validated_by'),
  
  // Accounting link
  ledger_entry_id: uuid('ledger_entry_id'),
  
  // Audit trail
  created_by: uuid('created_by'),
  updated_by: uuid('updated_by'),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`),
  deleted_at: timestamp('deleted_at')
}, (table) => ({
  invoice_number_idx: index('invoices_invoice_number_idx').on(table.invoice_number),
  company_idx: index('invoices_company_idx').on(table.company_id),
  franchise_idx: index('invoices_franchise_idx').on(table.franchise_id),
  customer_idx: index('invoices_customer_idx').on(table.customer_id),
  date_idx: index('invoices_date_idx').on(table.date),
  status_idx: index('invoices_status_idx').on(table.status),
  series_number_idx: index('invoices_series_number_idx').on(table.series, table.number),
  company_date_idx: index('invoices_company_date_idx').on(table.company_id, table.date),
}));

/**
 * Invoice Details table
 * Partner/customer detailed information per invoice
 * Required for ANAF e-Factura compliance
 */
export const invoice_details = pgTable('invoice_details', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  invoice_id: uuid('invoice_id').notNull(),
  
  // Partner identification
  partner_id: uuid('partner_id'),
  partner_name: text('partner_name').notNull(),
  partner_fiscal_code: text('partner_fiscal_code').notNull(),
  partner_registration_number: text('partner_registration_number'),
  
  // Partner address
  partner_address: text('partner_address').notNull(),
  partner_city: text('partner_city').notNull(),
  partner_county: text('partner_county'),
  partner_country: text('partner_country').notNull().default('Romania'),
  
  // Payment terms
  payment_method: text('payment_method').notNull(),
  payment_due_days: integer('payment_due_days').notNull().default(30),
  payment_due_date: timestamp('payment_due_date'),
  
  // Additional info
  notes: text('notes'),
  
  // Audit
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  invoice_idx: index('invoice_details_invoice_idx').on(table.invoice_id),
  partner_idx: index('invoice_details_partner_idx').on(table.partner_id),
  fiscal_code_idx: index('invoice_details_fiscal_code_idx').on(table.partner_fiscal_code),
}));

/**
 * Invoice Payments table
 * Payment tracking with VAT transfer support for cash-basis VAT
 */
export const invoice_payments = pgTable('invoice_payments', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  invoice_id: uuid('invoice_id').notNull(),
  company_id: uuid('company_id').notNull(),
  
  // Payment details
  payment_date: timestamp('payment_date').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  payment_method: text('payment_method').notNull(),
  payment_reference: text('payment_reference'),
  
  // Transaction links
  bank_transaction_id: uuid('bank_transaction_id'),
  cash_transaction_id: uuid('cash_transaction_id'),
  
  // VAT transfer (for cash-basis VAT)
  vat_transfer_ledger_id: uuid('vat_transfer_ledger_id'),
  vat_amount_transferred: numeric('vat_amount_transferred', { precision: 15, scale: 2 }),
  
  // Additional info
  notes: text('notes'),
  metadata: jsonb('metadata'),
  
  // Audit
  created_by: uuid('created_by'),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  invoice_idx: index('invoice_payments_invoice_idx').on(table.invoice_id),
  company_idx: index('invoice_payments_company_idx').on(table.company_id),
  payment_date_idx: index('invoice_payments_payment_date_idx').on(table.payment_date),
  bank_transaction_idx: index('invoice_payments_bank_transaction_idx').on(table.bank_transaction_id),
  cash_transaction_idx: index('invoice_payments_cash_transaction_idx').on(table.cash_transaction_id),
}));

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Invoices Relations
 */
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.company_id],
    references: [companies.id],
  }),
  franchise: one(companies, {
    fields: [invoices.franchise_id],
    references: [companies.id],
  }),
  customer: one(crm_customers, {
    fields: [invoices.customer_id],
    references: [crm_customers.id],
  }),
  details: one(invoice_details),
  payments: many(invoice_payments),
  items: many(invoice_items),
  relatedInvoice: one(invoices, {
    fields: [invoices.related_invoice_id],
    references: [invoices.id],
  }),
  validatedByUser: one(users, {
    fields: [invoices.validated_by],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.created_by],
    references: [users.id],
  }),
}));

/**
 * Invoice Details Relations
 */
export const invoice_detailsRelations = relations(invoice_details, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoice_details.invoice_id],
    references: [invoices.id],
  }),
  partner: one(crm_customers, {
    fields: [invoice_details.partner_id],
    references: [crm_customers.id],
  }),
}));

/**
 * Invoice Payments Relations
 */
export const invoice_paymentsRelations = relations(invoice_payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoice_payments.invoice_id],
    references: [invoices.id],
  }),
  company: one(companies, {
    fields: [invoice_payments.company_id],
    references: [companies.id],
  }),
  bankTransaction: one(bank_transactions, {
    fields: [invoice_payments.bank_transaction_id],
    references: [bank_transactions.id],
  }),
  cashTransaction: one(cash_transactions, {
    fields: [invoice_payments.cash_transaction_id],
    references: [cash_transactions.id],
  }),
  createdByUser: one(users, {
    fields: [invoice_payments.created_by],
    references: [users.id],
  }),
}));

// Note: Forward references will be resolved by Drizzle when schemas are combined

