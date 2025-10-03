/**
 * Purchase Journal Report Types - Jurnal de Cumpărări OMFP 2634/2015
 */

import { VATCategory } from './vat-categories';

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

