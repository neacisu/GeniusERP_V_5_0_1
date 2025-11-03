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
  company_id: string;
  franchise_id?: string;
  name: string;
  code: string;
  type?: string;
  location?: string;
  currency?: string;
  responsible_person_id?: string;
  responsible_person_name?: string;
  daily_limit?: number;
  max_transaction_amount?: number;
  userId: string; // userId rămâne camelCase pentru backwards compatibility cu auth
}

/**
 * Cash register update data
 */
export interface UpdateCashRegisterData {
  company_id: string;
  name?: string;
  location?: string;
  responsible_person_id?: string;
  responsible_person_name?: string;
  daily_limit?: number;
  max_transaction_amount?: number;
  status?: 'active' | 'closed' | 'suspended';
  is_active?: boolean;
}

/**
 * Cash receipt recording data
 */
export interface RecordCashReceiptData {
  company_id: string;
  franchise_id?: string;
  cash_register_id: string;
  amount: number;
  vat_amount?: number;
  vat_rate?: number;
  net_amount?: number;
  currency?: string;
  exchange_rate?: number;
  purpose?: CashTransactionPurpose;
  description: string;
  person_id?: string;
  person_name: string;
  person_id_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  userId: string;
  is_fiscal_receipt?: boolean;
  fiscal_receipt_number?: string;
  items?: CashTransactionItem[];
}

/**
 * Cash payment recording data
 */
export interface RecordCashPaymentData {
  company_id: string;
  franchise_id?: string;
  cash_register_id: string;
  amount: number;
  vat_amount?: number;
  vat_rate?: number;
  net_amount?: number;
  currency?: string;
  exchange_rate?: number;
  purpose?: CashTransactionPurpose;
  description: string;
  person_id?: string;
  person_name: string;
  person_id_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  userId: string;
  expense_type?: string;
}

/**
 * Cash transfer data
 */
export interface TransferCashData {
  company_id: string;
  franchise_id?: string;
  from_register_id: string;
  to_register_id: string;
  from_register_name?: string;
  to_register_name?: string;
  amount: number;
  currency?: string;
  exchange_rate?: number;
  description?: string;
  person_name: string;
  userId: string;
}

/**
 * Cash deposit to bank data
 */
export interface CashDepositToBankData {
  company_id: string;
  franchise_id?: string;
  cash_register_id: string;
  cash_register_name?: string;
  bank_account_id?: string;
  bank_account_name?: string;
  amount: number;
  currency?: string;
  exchange_rate?: number;
  description?: string;
  company_name?: string;
  person_name: string;
  userId: string;
}

/**
 * Cash withdrawal from bank data
 */
export interface CashWithdrawalFromBankData {
  company_id: string;
  franchise_id?: string;
  cash_register_id: string;
  cash_register_name?: string;
  bank_account_id?: string;
  bank_account_name?: string;
  amount: number;
  currency?: string;
  exchange_rate?: number;
  description?: string;
  company_name?: string;
  person_name: string;
  userId: string;
}

/**
 * Cash reconciliation data
 */
export interface CreateReconciliationData {
  company_id: string;
  cash_register_id: string;
  physical_count: number;
  notes?: string;
  userId: string;
}

/**
 * Cash transaction item for fiscal receipts
 */
export interface CashTransactionItem {
  description: string;
  quantity: number;
  unit_price: number;
  net_amount: number;
  vat_amount: number;
  vat_rate: number;
  gross_amount: number;
}

/**
 * Additional data for cash transactions (replaces Record<string, any>)
 */
export interface CashTransactionAdditionalData {
  expense_type?: string;
  category?: string;
  project_id?: string;
  department_id?: string;
  cost_center_id?: string;
  tags?: string[];
  custom_fields?: Record<string, string | number | boolean>;
}

/**
 * Cash register report data
 */
export interface CashRegisterReport {
  cash_register_id: string;
  period: {
    start_date: Date;
    end_date: Date;
  };
  total_receipts: number;
  total_payments: number;
  net_change: number;
  transaction_count: number;
  transactions: CashTransaction[];
}

/**
 * Daily closing report result
 */
export interface DailyClosingResult {
  success: boolean;
  closing_balance: number;
  pdf_path?: string;
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
  from_transaction_id: string;
  to_transaction_id: string;
}

/**
 * Bank transaction result
 */
export interface BankTransactionResult {
  cash_transaction_id: string;
  bank_transaction_id: string;
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
