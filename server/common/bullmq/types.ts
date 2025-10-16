/**
 * BullMQ Types
 * 
 * This file contains type definitions for BullMQ job payloads and queue names.
 * These types provide proper type checking for job data across the application.
 */

import { LowStockAlert } from '../../modules/inventory/services/check-stock-levels.service';

/**
 * Queue names used throughout the application
 * 
 * This enum provides a centralized place to define all queue names
 * to avoid string literals and ensure consistency.
 */
export enum QueueName {
  Inventory = 'inventory-queue',
  Accounting = 'accounting-queue',
  Reporting = 'reporting-queue', 
  Document = 'document-queue'
}

/**
 * Base job interface with common properties
 */
export interface BaseJobPayload {
  id: string;
  timestamp: string;
}

/**
 * Job payload for low stock alerts
 */
export interface LowStockAlertJob extends BaseJobPayload {
  alert: LowStockAlert;
}

/**
 * Job payload for scheduled stock checks
 */
export interface ScheduledStockCheckJob extends BaseJobPayload {
  companyId: string;
  franchiseId?: string;
  warehouseId?: string;
}

/**
 * Job payload for stock transfers
 */
export interface StockTransferJob extends BaseJobPayload {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  productId: string;
  quantity: number;
  companyId: string;
  franchiseId?: string;
  transferDocumentId?: string;
}

/**
 * Job payload for inventory alerts
 */
export interface InventoryAlertJob extends BaseJobPayload {
  sku: string;
  warehouseId: string;
  productId?: string; 
  productName?: string;
  currentQuantity?: number;
  minThreshold?: number;
  companyId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Job payload for balance updates
 */
export interface BalanceUpdateJob extends BaseJobPayload {
  journalEntryId: string;
  companyId: string;
}

/**
 * Job payload for account reconciliation
 */
export interface AccountReconciliationJob extends BaseJobPayload {
  accountId: string;
  companyId: string;
  startDate: string;
  endDate: string;
}

/**
 * Job payload for report generation
 */
export interface ReportGenerationJob extends BaseJobPayload {
  reportType: string;
  parameters: Record<string, any>;
  companyId: string;
  franchiseId?: string;
  userId: string;
}

/**
 * Job payload for document processing
 */
export interface DocumentProcessingJob extends BaseJobPayload {
  documentId: string;
  action: 'ocr' | 'sign' | 'archive' | 'notify';
  companyId: string;
  userId: string;
  metadata?: Record<string, any>;
}

/**
 * Union type of all job payloads
 * 
 * This is used as the generic parameter for workers that can process
 * multiple job types.
 */
export type JobPayload = 
  | LowStockAlertJob
  | ScheduledStockCheckJob
  | StockTransferJob
  | InventoryAlertJob
  | BalanceUpdateJob
  | AccountReconciliationJob
  | ReportGenerationJob
  | DocumentProcessingJob;

/**
 * Extended Accounting Job Types
 */
export interface GenerateSalesJournalJob extends BaseJobPayload {
  companyId: string;
  periodStart: string;
  periodEnd: string;
  reportType?: 'DETAILED' | 'SUMMARY';
  userId: string;
}

export interface GeneratePurchaseJournalJob extends BaseJobPayload {
  companyId: string;
  periodStart: string;
  periodEnd: string;
  reportType?: 'DETAILED' | 'SUMMARY';
  userId: string;
}

export interface ExportJournalJob extends BaseJobPayload {
  companyId: string;
  journalType: 'sales' | 'purchase' | 'bank' | 'cash';
  periodStart: string;
  periodEnd: string;
  format: 'excel' | 'pdf';
  userId: string;
}

export interface FiscalMonthCloseJob extends BaseJobPayload {
  companyId: string;
  year: number;
  month: number;
  userId: string;
  skipDepreciation?: boolean;
  skipFXRevaluation?: boolean;
  skipVAT?: boolean;
  dryRun?: boolean;
}

export interface FiscalYearCloseJob extends BaseJobPayload {
  companyId: string;
  fiscalYear: number;
  userId: string;
  dryRun?: boolean;
}

export interface VATClosureJob extends BaseJobPayload {
  companyId: string;
  periodYear: number;
  periodMonth: number;
  userId: string;
  dryRun?: boolean;
}

export interface BulkInvoiceCreateJob extends BaseJobPayload {
  companyId: string;
  invoices: any[];
  userId: string;
}

export interface BulkPaymentRecordJob extends BaseJobPayload {
  companyId: string;
  payments: any[];
  userId: string;
}

export interface DepreciationCalculateJob extends BaseJobPayload {
  companyId: string;
  periodYear: number;
  periodMonth: number;
  userId: string;
  dryRun?: boolean;
}

export interface FXRevaluationJob extends BaseJobPayload {
  companyId: string;
  periodYear: number;
  periodMonth: number;
  userId: string;
  dryRun?: boolean;
}

export interface VATTransferJob extends BaseJobPayload {
  invoiceId: string;
  companyId: string;
  paymentAmount: number;
  paymentDate: string;
  userId?: string;
}

export interface BatchExportJob extends BaseJobPayload {
  companyId: string;
  journals: ('sales' | 'purchase' | 'bank' | 'cash')[];
  periodStart: string;
  periodEnd: string;
  format: 'excel' | 'pdf';
  userId: string;
}

export interface GenerateNoteContabilJob extends BaseJobPayload {
  companyId: string;
  documentType: string;
  documentId: string;
  userId: string;
}

export interface GenerateNotePdfJob extends BaseJobPayload {
  companyId: string;
  noteId: string;
  userId: string;
}

export interface GenerateTrialBalanceJob extends BaseJobPayload {
  companyId: string;
  startDate: string;
  endDate: string;
  userId: string;
}

export interface GenerateBalanceSheetJob extends BaseJobPayload {
  companyId: string;
  date: string;
  userId: string;
}

export interface GenerateIncomeStatementJob extends BaseJobPayload {
  companyId: string;
  startDate: string;
  endDate: string;
  userId: string;
}

/**
 * Job name to payload type mapping
 * 
 * This provides a way to get the correct payload type for a given job name.
 */
export interface JobTypeMap {
  // Inventory jobs
  'low-stock-alert': LowStockAlertJob;
  'scheduled-stock-check': ScheduledStockCheckJob;
  'stock-transfer': StockTransferJob;
  'alert': InventoryAlertJob;
  
  // Accounting core jobs
  'update-balance': BalanceUpdateJob;
  'balance-update': BalanceUpdateJob;
  'account-reconciliation': AccountReconciliationJob;
  
  // Journal generation jobs
  'generate-sales-journal': GenerateSalesJournalJob;
  'generate-purchase-journal': GeneratePurchaseJournalJob;
  
  // Export jobs
  'export-journal-excel': ExportJournalJob;
  'export-journal-pdf': ExportJournalJob;
  'batch-export': BatchExportJob;
  
  // Fiscal closure jobs
  'fiscal-month-close': FiscalMonthCloseJob;
  'fiscal-year-close': FiscalYearCloseJob;
  'vat-closure': VATClosureJob;
  
  // Bulk operations
  'batch-invoice-create': BulkInvoiceCreateJob;
  'batch-payment-record': BulkPaymentRecordJob;
  
  // Periodic calculations
  'depreciation-calculate': DepreciationCalculateJob;
  'fx-revaluation': FXRevaluationJob;
  'vat-transfer': VATTransferJob;
  
  // Note contabil jobs
  'generate-note-contabil': GenerateNoteContabilJob;
  'generate-note-pdf': GenerateNotePdfJob;
  
  // Financial reports jobs
  'generate-trial-balance': GenerateTrialBalanceJob;
  'generate-balance-sheet': GenerateBalanceSheetJob;
  'generate-income-statement': GenerateIncomeStatementJob;
  
  // Reporting
  'generate-report': ReportGenerationJob;
  
  // Document processing
  'document-processing': DocumentProcessingJob;
}