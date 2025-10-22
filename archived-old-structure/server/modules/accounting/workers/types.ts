/**
 * Accounting Worker Result Types
 * 
 * Tipuri TypeScript pentru rezultatele job-urilor de contabilitate
 */

/**
 * Rezultat generic de succes
 */
export interface BaseJobResult {
  success: boolean;
}

/**
 * Rezultat pentru balance update
 */
export interface BalanceUpdateResult extends BaseJobResult {
  journalEntryId: string;
  totalDebit: number;
  totalCredit: number;
  linesProcessed: number;
}

/**
 * Rezultat pentru account reconciliation
 */
export interface AccountReconciliationResult extends BaseJobResult {
  accountId: string;
  startDate: string;
  endDate: string;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  reconciled: boolean;
  entriesCount: number;
}

/**
 * Rezultat pentru generare jurnale
 */
export interface JournalGenerationResult extends BaseJobResult {
  companyId: string;
  periodStart: string;
  periodEnd: string;
  entriesCount: number;
  totalAmount: number;
}

/**
 * Rezultat pentru export jurnale
 */
export interface JournalExportResult extends BaseJobResult {
  exportPath: string;
  format: 'excel' | 'pdf';
  journalType: string;
  periodStart: string;
  periodEnd: string;
}

/**
 * Rezultat pentru batch export
 */
export interface BatchExportResult extends BaseJobResult {
  journalsExported: number;
  format: 'excel' | 'pdf';
  zipFilePath: string;
  filesIncluded: number;
}

/**
 * Rezultate pentru operațiile periodice de închidere lunară
 */
export interface MonthCloseOperationResult {
  itemCount?: number;
  totalDepreciation?: number;
  totalGains?: number;
  totalLosses?: number;
  netDifference?: number;
  ledgerEntryId?: string;
  journalNumber?: string;
}

/**
 * Rezultat pentru fiscal month close
 */
export interface FiscalMonthCloseResult extends BaseJobResult {
  companyId: string;
  year: number;
  month: number;
  dryRun: boolean;
  results: {
    depreciation: MonthCloseOperationResult | null;
    fxRevaluation: MonthCloseOperationResult | null;
    vatClosure: Record<string, unknown> | null;
    periodLocked: boolean;
  };
}

/**
 * Rezultat pentru fiscal year close
 */
export interface FiscalYearCloseResult extends BaseJobResult {
  companyId: string;
  fiscalYear: number;
  dryRun: boolean;
  monthsClosed: number;
  monthResults: FiscalMonthCloseResult[];
}

/**
 * Rezultat pentru VAT closure
 */
export interface VATClosureResult extends BaseJobResult {
  companyId: string;
  periodYear: number;
  periodMonth: number;
  [key: string]: unknown; // Alte proprietăți din VATClosureService
}

/**
 * Rezultat item pentru bulk operations
 */
export interface BulkOperationItemResult {
  index: number;
  status: 'success' | 'error';
  invoiceId?: string;
  invoiceNumber?: string;
  paymentId?: string;
  amount?: number;
  error?: string;
}

/**
 * Rezultat pentru bulk invoice create
 */
export interface BulkInvoiceCreateResult extends BaseJobResult {
  totalItems: number;
  totalInvoices: number;
  successCount: number;
  errorCount: number;
  results: BulkOperationItemResult[];
  errors?: BulkOperationItemResult[];
}

/**
 * Rezultat pentru bulk payment record
 */
export interface BulkPaymentRecordResult extends BaseJobResult {
  totalItems: number;
  totalPayments: number;
  successCount: number;
  errorCount: number;
  results: BulkOperationItemResult[];
  errors?: BulkOperationItemResult[];
}

/**
 * Rezultat pentru depreciation calculate
 */
export interface DepreciationCalculateResult extends BaseJobResult {
  periodYear: number;
  periodMonth: number;
  totalDepreciation: number;
  itemCount: number;
  ledgerEntryId?: string;
  journalNumber?: string;
  dryRun: boolean;
}

/**
 * Rezultat pentru FX revaluation
 */
export interface FXRevaluationResult extends BaseJobResult {
  periodYear: number;
  periodMonth: number;
  totalGains: number;
  totalLosses: number;
  netDifference: number;
  itemCount: number;
  ledgerEntryId?: string;
  journalNumber?: string;
  dryRun: boolean;
}

/**
 * Rezultat pentru VAT transfer
 */
export interface VATTransferResult extends BaseJobResult {
  invoiceId: string;
  paymentAmount: number;
}

/**
 * Rezultat pentru generate note contabil
 */
export interface GenerateNoteContabilResult extends BaseJobResult {
  noteId?: string;
  noteNumber?: string;
  errors?: unknown[];
}

/**
 * Rezultat pentru generate note PDF
 */
export interface GenerateNotePdfResult extends BaseJobResult {
  noteId: string;
  pdfBuffer: string; // Base64 encoded
  size: number;
}

/**
 * Rezultat pentru rapoarte financiare
 */
export interface FinancialReportResult extends BaseJobResult {
  companyId: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  data: unknown;
}

/**
 * Tipuri pentru query results din baza de date
 */
export interface LedgerEntryQueryRow {
  debit_amount: string | number;
  credit_amount: string | number;
  entry_date: Date | string;
}

export interface AccountBalanceQueryRow {
  balance: string | number;
}

export interface CompanyQueryRow {
  name: string;
}

/**
 * Tip pentru errori cu mesaj
 */
export interface ErrorWithMessage {
  message: string;
  [key: string]: unknown;
}

/**
 * Type guard pentru a verifica dacă un error are mesaj
 */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Helper pentru a obține mesajul de eroare
 */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}
