/**
 * Sales Journal Report Types
 * 
 * Interfețe și tipuri pentru raportul Jurnal de Vânzări
 * conform OMFP 2634/2015 și Codul Fiscal
 */

import { VATCategory } from './vat-categories';

/**
 * Rând individual în jurnalul de vânzări
 */
export interface SalesJournalRow {
  // Informații document
  rowNumber: number;                    // Nr. crt
  date: Date;                           // Data facturii
  documentNumber: string;               // Serie + Număr (ex: FVS-2025/0012)
  documentType: string;                 // INVOICE, CREDIT_NOTE, etc.
  
  // Informații client
  clientName: string;                   // Denumire client
  clientFiscalCode: string;             // CUI/CIF client
  clientCountry: string;                // Țara client
  
  // Totaluri
  totalAmount: number;                  // Total document (cu TVA)
  
  // Coloane pe categorii fiscale - Livrări taxabile
  base19: number;                       // Bază impozabilă 19%
  vat19: number;                        // TVA 19%
  base9: number;                        // Bază impozabilă 9%
  vat9: number;                         // TVA 9%
  base5: number;                        // Bază impozabilă 5%
  vat5: number;                         // TVA 5%
  
  // Coloane operațiuni speciale
  exemptWithCredit: number;             // Scutit cu drept de deducere (bază)
  exemptNoCredit: number;               // Scutit fără drept de deducere (bază)
  intraCommunity: number;               // Livrări intracomunitare (bază)
  export: number;                       // Exporturi (bază)
  reverseCharge: number;                // Taxare inversă (bază)
  notSubject: number;                   // Neimpozabil (bază)
  
  // TVA la încasare (dacă aplicabil)
  isCashVAT: boolean;                   // Flag pentru TVA la încasare
  vatDeferred: number;                  // TVA neexigibilă
  vatCollected: number;                 // TVA exigibilă (inclusiv din încasări)
  
  // Referințe și observații
  relatedInvoiceNumber?: string;        // Pentru storno - factura originală
  paymentReference?: string;            // Document încasare (pentru TVA la încasare)
  notes?: string;                       // Observații
}

/**
 * Totaluri jurnal de vânzări
 */
export interface SalesJournalTotals {
  // Total general
  totalDocuments: number;               // Total documente
  totalAmount: number;                  // Total valoare (cu TVA)
  
  // Totaluri pe categorii taxabile
  totalBase19: number;
  totalVAT19: number;
  totalBase9: number;
  totalVAT9: number;
  totalBase5: number;
  totalVAT5: number;
  
  // Totaluri operațiuni speciale
  totalExemptWithCredit: number;
  totalExemptNoCredit: number;
  totalIntraCommunity: number;
  totalExport: number;
  totalReverseCharge: number;
  totalNotSubject: number;
  
  // Totaluri TVA la încasare
  totalVATDeferred: number;             // Total TVA neexigibilă
  totalVATCollected: number;            // Total TVA exigibilă
  
  // Verificare
  totalNetAmount: number;               // Total baze impozabile (toate categoriile)
  totalVATAmount: number;               // Total TVA (exigibilă + neexigibilă)
}

/**
 * Raport complet jurnal de vânzări
 */
export interface SalesJournalReport {
  // Metadate raport
  companyId: string;
  companyName: string;
  companyFiscalCode: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;                  // Ex: "Octombrie 2025"
  generatedAt: Date;
  generatedBy?: string;
  
  // Date raport
  rows: SalesJournalRow[];
  totals: SalesJournalTotals;
  
  // Tip raport
  reportType: 'DETAILED' | 'SUMMARY';   // Detaliat sau centralizat
  
  // Verificări contabile
  accountingValidation?: {
    account4427Balance: number;         // Sold cont TVA colectată
    account4428Balance: number;         // Sold cont TVA neexigibilă
    account707Balance: number;          // Sold cont venituri
    account4111Balance: number;         // Sold cont clienți
    isBalanced: boolean;                // Verificare corelații
    discrepancies?: string[];           // Liste discrepanțe
  };
}

/**
 * Parametri pentru generare jurnal
 */
export interface GenerateSalesJournalParams {
  companyId: string;
  periodStart: Date;
  periodEnd: Date;
  reportType?: 'DETAILED' | 'SUMMARY';
  includeZeroVAT?: boolean;             // Include facturi cu TVA 0
  includeCanceled?: boolean;            // Include facturi anulate
  customerFilter?: string;              // Filtru opțional după client
  categoryFilter?: VATCategory;        // Filtru opțional după categorie
}

/**
 * Opțiuni export
 */
export interface ExportOptions {
  format: 'EXCEL' | 'PDF' | 'CSV';
  includeHeader: boolean;
  includeFooter: boolean;
  includeTotals: boolean;
  landscape?: boolean;                  // Pentru PDF
  fileName?: string;
}

/**
 * Date pentru agregare pe categorie fiscală
 */
export interface CategoryAggregation {
  category: VATCategory;
  categoryName: string;
  baseAmount: number;                   // Bază impozabilă
  vatAmount: number;                    // TVA
  vatRate: number;                      // Cotă TVA
  documentCount: number;                // Număr documente
}

export default {
  SalesJournalRow,
  SalesJournalTotals,
  SalesJournalReport,
  GenerateSalesJournalParams,
  ExportOptions,
  CategoryAggregation
};

