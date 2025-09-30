/**
 * Invoicing Module Types
 * 
 * Defines the main types and interfaces used in the invoicing module.
 */

/**
 * Invoice status enum
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  SENT = 'sent',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELED = 'canceled'
}

/**
 * Invoice item interface
 */
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  productName: string;
  description?: string;
  quantity: number;
  price: number;
  unit?: string;
  discountPercent?: number;
  discountAmount?: number;
  vatRate: number;
  vatAmount?: number;
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Invoice interface
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  series?: string;
  companyId: string;
  companyName?: string; 
  companyVatNumber?: string;
  companyRegNumber?: string;
  companyAddress?: string;
  customerId: string;
  customerName: string;
  customerVatNumber?: string;
  customerRegNumber?: string;
  customerAddress?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentMethod?: string;
  netTotal: number;
  vatRate: number;
  vatAmount: number;
  grossTotal: number;
  paidAmount?: number;
  paidDate?: string;
  remainingAmount?: number;
  currency: string;
  notes?: string;
  internalNotes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
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
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Invoice summary interface
 */
export interface InvoiceSummary {
  totalCount: number;
  draftCount: number;
  validatedCount: number;
  sentCount: number;
  paidCount: number;
  overdueCount: number;
  canceledCount: number;
  totalValue: number;
  paidValue: number;
  overdueValue: number;
}