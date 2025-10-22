/**
 * Sales Journal Data Types
 * 
 * Type definitions for sales journal service based on Drizzle inferred types
 * from shared/schema.ts and accounting.schema.ts
 */

import type { Invoice, InvoiceDetail, InvoiceItem, InvoicePayment } from '@shared/schema';
import type { SQL } from 'drizzle-orm';

/**
 * Invoice data with extended properties for display/manipulation
 * Extends base Invoice type from Drizzle schema
 */
export interface InvoiceData extends Invoice {
  lines?: InvoiceItem[];
  details?: InvoiceDetail;
  payments?: InvoicePayment[];
  // Allow additional computed fields
  [key: string]: unknown;
}

/**
 * Invoice item data (from invoice_items table)
 */
export type InvoiceItemData = InvoiceItem;

/**
 * Customer/Partner data structure
 */
export interface CustomerData {
  id?: string;
  name?: string;
  customerName?: string;
  fiscalCode?: string;
  cui?: string;
  taxId?: string;
  registrationNumber?: string;
  regCom?: string;
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
}

/**
 * Tax rates configuration
 */
export interface TaxRatesData {
  standard?: number;
  reduced?: number;
  zero?: number;
}

/**
 * Payment terms configuration
 */
export interface PaymentTermsData {
  method?: string;
  dueDays?: number;
}

/**
 * Ledger entry data for accounting operations
 */
export interface LedgerEntryInputData {
  companyId: string;
  franchiseId?: string;
  type: string;
  referenceNumber: string;
  amount: number;
  description: string;
  userId?: string;
  lines: LedgerLineInputData[];
}

/**
 * Ledger line data for double-entry accounting
 */
export interface LedgerLineInputData {
  accountId: string;
  accountNumber?: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

/**
 * Where clause conditions type for Drizzle queries
 */
export type WhereCondition = SQL<unknown> | undefined;

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Report response structure
 */
export interface ReportData {
  companyId: string;
  period: { start?: Date; end?: Date };
  transactions: unknown[];
  openingBalance: number;
  closingBalance: number;
  totalSales?: number;
}

/**
 * Simple return types for stub methods
 */
export interface SimpleReturnData {
  [key: string]: unknown;
}
