/**
 * Invoicing Module Types
 * 
 * Defines the main types and interfaces used in the invoicing module.
 */

/**
 * Invoice status enum
 * Matches the database enum: invoice_status
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  SENT = 'sent',
  CANCELED = 'canceled',
  PAID = 'paid'
}

/**
 * Invoice item interface
 * Maps to invoice_items table in DB
 */
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  productName: string;
  productCode?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  discount?: number;
  sequence: number;
  notes?: string;
  vatCategory?: string;
  vatCode?: string;
  originalItemId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice interface
 * Maps to invoices table in DB
 * Note: customer* and company* fields come from invoice_details table
 */
export interface Invoice {
  id: string;
  companyId: string;
  franchiseId?: string;
  invoiceNumber?: string;
  series?: string;
  number?: number;
  customerId?: string;
  customerName?: string;
  date: string;
  issueDate: string;
  dueDate?: string;
  amount: number;
  totalAmount: number;
  netAmount?: number;
  vatAmount?: number;
  currency: string;
  exchangeRate: number;
  status: InvoiceStatus;
  type?: string;
  isCashVat?: boolean;
  relatedInvoiceId?: string;
  description?: string;
  notes?: string;
  version: number;
  isValidated: boolean;
  validatedAt?: string;
  ledgerEntryId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  
  // From invoice_details relation
  customerVatNumber?: string;
  customerRegNumber?: string;
  customerAddress?: string;
  companyName?: string;
  companyVatNumber?: string;
  companyRegNumber?: string;
  companyAddress?: string;
  paymentMethod?: string;
  paidAmount?: number;
  paidDate?: string;
  remainingAmount?: number;
  
  // Relations
  items?: InvoiceItem[];
}

/**
 * Payment interface
 */
export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice customer interface
 */
export interface InvoiceCustomer {
  id: string;
  name: string;
  vatNumber?: string;
  regNumber?: string;
  address?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice template interface
 */
export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  layout: any; // JSON structure representing the template
  createdAt: string;
  updatedAt: string;
}

/**
 * Recurring invoice interface
 */
export interface RecurringInvoice {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextGenerationDate: string;
  isActive: boolean;
  template: any; // JSON structure representing the invoice template
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice filters interface
 */
export interface InvoiceFilters {
  status?: InvoiceStatus | string;
  customer?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  searchQuery?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  paymentMethod?: string;
}

/**
 * Invoice summary interface
 */
export interface InvoiceSummary {
  totalCount: number;
  draftCount: number;
  issuedCount: number;
  sentCount: number;
  paidCount: number;
  canceledCount: number;
  totalValue: number;
  paidValue: number;
}

/**
 * Invoice statistics interface
 */
export interface InvoiceStatistics {
  totalInvoices: number;
  totalPending: number;
  totalValidated: number;
  totalIssued: number;
  totalPaid: number;
  totalOverdue: number;
  totalAmount: number;
  totalVat: number;
  pendingAmount: number;
  overdueAmount: number;
  avgPaymentDelay: number;
}

/**
 * Additional types for API responses
 */
export interface PaginatedInvoices {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AccountingPreview {
  debitAccount: string;
  creditAccount: string;
  amount: number;
  description: string;
}

export interface ValidationResult {
  success: boolean;
  message: string;
  journalEntryId?: string;
  errors?: string[];
}