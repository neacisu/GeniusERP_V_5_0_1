/**
 * Note Contabil Type Definitions
 * 
 * Type definitions for accounting notes (Note Contabile) service
 * Supporting Romanian accounting system double-entry bookkeeping
 */

/**
 * Account Entry in a Note Contabil
 */
export interface AccountEntry {
  accountCode: string;
  debit: number;
  credit: number;
  description: string;
  costCenter?: string;
  projectCode?: string;
}

/**
 * Note Contabil Data for creation
 */
export interface NoteContabilData {
  id?: string;
  number?: string;
  date: Date;
  description: string;
  entries: AccountEntry[];
  documentId?: string;
  documentType?: string;
  companyId: string;
  userId: string;
  currencyCode?: string;
  exchangeRate?: number;
  validated?: boolean;
}

/**
 * Created Note Contabil Response
 */
export interface CreatedNote {
  id: string;
  number: string;
  date: Date;
  description: string;
  companyId: string;
  documentId: string | null;
  documentType: string | null;
  currencyCode: string;
  exchangeRate: number;
  validated: boolean;
  createdAt: Date;
  createdBy: string;
  entries: AccountEntry[];
}

/**
 * Note Contabil Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  message: string;
  errors: string[];
}

/**
 * Note Contabil Details (full note with relations)
 */
export interface NoteDetails {
  id: string;
  number: string;
  date: Date;
  description: string;
  companyId: string;
  documentId: string | null;
  documentType: string | null;
  currencyCode: string;
  exchangeRate: number;
  validated: boolean;
  createdAt: Date;
  createdBy: string;
  entries: AccountEntry[];
}

/**
 * Note Contabil List Item (summary for listing)
 */
export interface NoteListItem {
  id: string;
  number: string;
  date: Date;
  description: string;
  documentType: string | null;
  totalDebit: number;
  totalCredit: number;
  validated: boolean;
  createdAt: Date;
}

/**
 * Approved Note Response
 */
export interface ApprovedNote {
  success: boolean;
  message: string;
  noteId: string;
}

/**
 * Bulk Validation Response
 */
export interface BulkValidationResponse {
  success: boolean;
  data?: {
    validatedCount: number;
    notes: string[];
  };
  errors?: string[];
}

/**
 * Invoice Line for Note Generation
 */
export interface InvoiceLine {
  quantity: number;
  unitPrice: number;
  vatRate: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
}

/**
 * Invoice for Note Generation
 */
export interface InvoiceForNote {
  id: string;
  number: string;
  date: Date;
  supplierId?: string;
  customerId?: string;
  lines: InvoiceLine[];
  totalNet: number;
  totalVat: number;
  totalAmount: number;
}

/**
 * Ledger Entry for mapping
 */
export interface LedgerEntryForNote {
  id: string;
  journalNumber: string;
  entryDate: Date;
  description: string;
  documentType: string;
  amount: string;
  validated: boolean;
  createdAt: Date;
}
