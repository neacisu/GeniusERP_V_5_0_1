/**
 * Purchase Journal Report Types - Jurnal de Cumpărări OMFP 2634/2015
 */

import { VATCategory } from './vat-categories';

// ============================================
// Invoice Data Types
// ============================================

/**
 * Supplier Information
 */
export interface SupplierData {
  id: string;
  name: string;
  fiscalCode: string;
  vatNumber?: string; // CUI/VAT number (same as fiscalCode in many cases)
  registrationNumber?: string;
  address?: string;
  city?: string;
  county?: string;
  country?: string;
  partnerCountry?: string; // Alias for country in invoice_details
}

/**
 * Invoice Line Item
 */
export interface InvoiceItemData {
  productName: string;
  description: string | null; // Nullable in DB
  quantity: number;
  unitPrice: number;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  vatCategory?: string; // VAT category for journal grouping
  expenseType?: string; // Expense type for purchase classification
}

/**
 * Payment Terms
 */
export interface PaymentTerms {
  method: string;
  dueDays: number;
}

/**
 * Tax Rates Configuration
 */
export interface TaxRates {
  standard?: number;
  reduced?: number;
  special?: number;
}

/**
 * Invoice Data for Recording
 */
export interface InvoiceData {
  id?: string;
  companyId: string;
  franchiseId?: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  currency?: string;
  exchangeRate?: number;
  userId?: string;
  expenseType?: string;
  deductibleVat?: boolean;
  isCashVAT?: boolean;
  // Additional fields used in validation
  supplierId?: string;
  supplier?: SupplierData;
  vatRate?: number;
  items?: InvoiceItemData[];
  netTotal?: number;
  vatTotal?: number;
  grossTotal?: number;
}

/**
 * Payment Data
 */
export interface PaymentData {
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  reference?: string;
  paymentReference?: string; // DB field name
  notes?: string;
  companyId: string;
  userId?: string;
}

/**
 * Payment Record Response
 */
export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: string;
  paymentDate: Date;
  paymentMethod: string;
  reference: string | null;
  createdAt: Date;
  createdBy: string;
}

/**
 * Invoice with Lines Response
 */
export interface InvoiceWithLines {
  id: string;
  invoiceNumber: string | null; // Nullable in DB
  customerName: string | null; // Nullable in DB
  amount: string;
  totalAmount: string;
  netAmount: string | null; // Nullable in DB
  vatAmount: string | null; // Nullable in DB
  issueDate: Date;
  dueDate: Date | null;
  type: string | null; // Nullable in DB
  description: string | null;
  createdBy: string | null; // Nullable in DB
  lines: InvoiceItemData[];
}

/**
 * Supplier Invoice List Response
 */
export interface SupplierInvoiceListResponse {
  data: InvoiceWithLines[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Invoice Validation Result
 */
export interface InvoiceValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================
// Purchase Journal Report Types
// ============================================

export interface PurchaseJournalRow {
  rowNumber: number;
  date: Date;
  documentNumber: string;
  documentType: string;
  supplierName: string;
  supplierFiscalCode: string;
  supplierCountry: string;
  totalAmount: number;
  base19: number;
  vat19: number;
  base9: number;
  vat9: number;
  base5: number;
  vat5: number;
  intraCommunity: number;
  import: number;
  reverseCharge: number;
  notSubject: number;
  isCashVAT: boolean;
  vatDeferred: number;
  vatDeductible: number;
  expenseType?: string;
  notes?: string;
}

export interface PurchaseJournalTotals {
  totalDocuments: number;
  totalAmount: number;
  totalBase19: number;
  totalVAT19: number;
  totalBase9: number;
  totalVAT9: number;
  totalBase5: number;
  totalVAT5: number;
  totalIntraCommunity: number;
  totalImport: number;
  totalReverseCharge: number;
  totalNotSubject: number;
  totalVATDeferred: number;
  totalVATDeductible: number;
  totalNetAmount: number;
  totalVATAmount: number;
}

export interface PurchaseJournalReport {
  companyId: string;
  companyName: string;
  companyFiscalCode: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  generatedAt: Date;
  rows: PurchaseJournalRow[];
  totals: PurchaseJournalTotals;
  reportType: 'DETAILED' | 'SUMMARY';
  accountingValidation?: {
    account4426Balance: number;
    account4428Balance: number;
    account401Balance: number;
    isBalanced: boolean;
    discrepancies?: string[];
  };
}

export interface GeneratePurchaseJournalParams {
  companyId: string;
  periodStart: Date;
  periodEnd: Date;
  reportType?: 'DETAILED' | 'SUMMARY';
  includeZeroVAT?: boolean;
  includeCanceled?: boolean;
  supplierFilter?: string;
  categoryFilter?: VATCategory;
}

// ============================================
// Account Statement Types
// ============================================

/**
 * Supplier Account Statement Parameters
 */
export interface SupplierStatementParams {
  companyId: string;
  supplierId: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Supplier Account Statement Response
 */
export interface SupplierStatementResponse {
  supplier: SupplierData;
  period: {
    startDate: Date;
    endDate: Date;
  };
  transactions: {
    date: Date;
    description: string;
    invoiceNumber?: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  summary: {
    openingBalance: number;
    totalInvoiced: number;
    totalPaid: number;
    closingBalance: number;
  };
}

// ============================================
// Internal Helper Types
// ============================================

/**
 * Database Query Condition
 */
export interface QueryCondition {
  column: string;
  operator: string;
  value: unknown;
}

/**
 * Grouped Lines by Category
 */
export interface GroupedLines {
  category: string;
  lines: InvoiceItemData[];
}

/**
 * Export default all types
 */
export type {
  VATCategory
};

