/**
 * Cash Register Types - Romanian Accounting Standards
 * 
 * Tipuri pentru operațiuni de casă conform OMFP 2634/2015 și Legea 70/2015
 */

import { CashTransaction, CashRegister, cashTransactionPurposeValues } from '@geniuserp/shared/schema/cash-register.schema';

// Type for transaction purpose
export type CashTransactionPurpose = typeof cashTransactionPurposeValues[number];

/**
 * Extended CashRegister with additional fields for business logic
 */
export interface CashRegisterWithClosing extends Omit<CashRegister, 'lastClosedDate'> {
  lastClosedDate?: string | null;
}

/**
 * Cash register creation data
 */
export interface CreateCashRegisterData {
  companyId: string;
  franchiseId?: string;
  name: string;
  code: string;
  type?: string;
  location?: string;
  currency?: string;
  responsiblePersonId?: string;
  responsiblePersonName?: string;
  dailyLimit?: number;
  maxTransactionAmount?: number;
  userId: string;
}

/**
 * Cash register update data
 */
export interface UpdateCashRegisterData {
  companyId: string;
  name?: string;
  location?: string;
  responsiblePersonId?: string;
  responsiblePersonName?: string;
  dailyLimit?: number;
  maxTransactionAmount?: number;
  status?: 'active' | 'closed' | 'suspended';
  isActive?: boolean;
}

/**
 * Cash receipt recording data
 */
export interface RecordCashReceiptData {
  companyId: string;
  franchiseId?: string;
  cashRegisterId: string;
  amount: number;
  vatAmount?: number;
  vatRate?: number;
  netAmount?: number;
  currency?: string;
  exchangeRate?: number;
  purpose?: CashTransactionPurpose;
  description: string;
  personId?: string;
  personName: string;
  personIdNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  userId: string;
  isFiscalReceipt?: boolean;
  fiscalReceiptNumber?: string;
  items?: CashTransactionItem[];
}

/**
 * Cash payment recording data
 */
export interface RecordCashPaymentData {
  companyId: string;
  franchiseId?: string;
  cashRegisterId: string;
  amount: number;
  vatAmount?: number;
  vatRate?: number;
  netAmount?: number;
  currency?: string;
  exchangeRate?: number;
  purpose?: CashTransactionPurpose;
  description: string;
  personId?: string;
  personName: string;
  personIdNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  userId: string;
  expenseType?: string;
}

/**
 * Cash transfer data
 */
export interface TransferCashData {
  companyId: string;
  franchiseId?: string;
  fromRegisterId: string;
  toRegisterId: string;
  fromRegisterName?: string;
  toRegisterName?: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  description?: string;
  personName: string;
  userId: string;
}

/**
 * Cash deposit to bank data
 */
export interface CashDepositToBankData {
  companyId: string;
  franchiseId?: string;
  cashRegisterId: string;
  cashRegisterName?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  description?: string;
  companyName?: string;
  personName: string;
  userId: string;
}

/**
 * Cash withdrawal from bank data
 */
export interface CashWithdrawalFromBankData {
  companyId: string;
  franchiseId?: string;
  cashRegisterId: string;
  cashRegisterName?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  description?: string;
  companyName?: string;
  personName: string;
  userId: string;
}

/**
 * Cash reconciliation data
 */
export interface CreateReconciliationData {
  companyId: string;
  cashRegisterId: string;
  physicalCount: number;
  notes?: string;
  userId: string;
}

/**
 * Cash transaction item for fiscal receipts
 */
export interface CashTransactionItem {
  description: string;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  grossAmount: number;
}

/**
 * Additional data for cash transactions (replaces Record<string, any>)
 */
export interface CashTransactionAdditionalData {
  expenseType?: string;
  category?: string;
  projectId?: string;
  departmentId?: string;
  costCenterId?: string;
  tags?: string[];
  customFields?: Record<string, string | number | boolean>;
}

/**
 * Cash register report data
 */
export interface CashRegisterReport {
  cashRegisterId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalReceipts: number;
  totalPayments: number;
  netChange: number;
  transactionCount: number;
  transactions: CashTransaction[];
}

/**
 * Daily closing report result
 */
export interface DailyClosingResult {
  success: boolean;
  closingBalance: number;
  pdfPath?: string;
}

/**
 * Cash register balance as of date
 */
export interface CashRegisterBalance {
  balance: number;
  currency: string;
}

/**
 * Cash register list response
 */
export interface CashRegisterListResponse {
  data: CashRegister[];
  total: number;
}

/**
 * Cash transactions list response
 */
export interface CashTransactionsListResponse {
  data: CashTransaction[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Cash transfer result
 */
export interface CashTransferResult {
  fromTransactionId: string;
  toTransactionId: string;
}

/**
 * Bank transaction result
 */
export interface BankTransactionResult {
  cashTransactionId: string;
  bankTransactionId: string;
}

/**
 * Async reconciliation job result
 */
export interface ReconciliationJobResult {
  jobId: string;
  message: string;
}

/**
 * Transaction validation result
 */
export interface TransactionValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Drizzle SQL condition type (replaces any[])
 */
export type SQLCondition = ReturnType<typeof import('drizzle-orm').eq> | ReturnType<typeof import('drizzle-orm').and>;
