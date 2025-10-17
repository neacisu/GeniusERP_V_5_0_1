/**
 * Module Types for Invoicing
 * 
 * Define all types used in the invoicing module.
 */

/**
 * Customer information for invoices
 */
export interface Customer {
  id: string;
  name: string;
  fiscalCode: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  county?: string;
  country?: string;
  email?: string;
  phone?: string;
  iban?: string;
  bank?: string;
}

/**
 * Customer response from API
 */
export interface CustomerResponse {
  success: boolean;
  data: Customer[];
}

/**
 * Invoice Line Item
 */
export interface InvoiceItem {
  id?: string;
  productName: string;
  productCode?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount?: number;
  unit?: string;
}

/**
 * Invoice payment methods
 */
export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  CHECK = 'check',
  OTHER = 'other'
}

/**
 * Invoice statuses
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
 * Basic invoice information
 */
export interface InvoiceBasic {
  id: string;
  number?: number;
  series?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  customerName: string;
  customerFiscalCode: string;
  totalAmount: number;
  grossTotal: number;
  paidAmount?: number;
  currency: string;
}

/**
 * Full invoice details
 */
export interface Invoice extends InvoiceBasic {
  customerId: string;
  items: InvoiceItem[];
  paymentMethod: PaymentMethod;
  notes?: string;
  termsAndConditions?: string;
  subtotal: number;
  vatAmount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data for creating a new invoice
 */
export interface NewInvoiceData {
  customerId: string;
  issueDate: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  currency: string;
  exchangeRate?: number;
  paymentDetails?: string;
  vatRate?: number;
  items: InvoiceItem[];
  notes?: string;
  termsAndConditions?: string;
}

/**
 * Filters for invoice listing
 */
export interface InvoiceFilters {
  status?: InvoiceStatus;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Invoice statistic summary
 */
export interface InvoiceStatistics {
  totalDrafts: number;
  totalIssued: number;
  totalPaid: number;
  totalOverdue: number;
  totalInvoiceAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
  currency: string;
}