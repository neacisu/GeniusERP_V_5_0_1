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
 * Job name to payload type mapping
 * 
 * This provides a way to get the correct payload type for a given job name.
 */
export interface JobTypeMap {
  'low-stock-alert': LowStockAlertJob;
  'scheduled-stock-check': ScheduledStockCheckJob;
  'stock-transfer': StockTransferJob;
  'update-balance': BalanceUpdateJob;
  'account-reconciliation': AccountReconciliationJob;
  'generate-report': ReportGenerationJob;
  'document-processing': DocumentProcessingJob;
  'alert': InventoryAlertJob;
}