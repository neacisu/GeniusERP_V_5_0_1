/**
 * Bulk Operations Service
 * 
 * Service pentru procesare în batch a operațiunilor de contabilitate:
 * - Bulk invoice creation
 * - Bulk payment recording
 * - Bulk account reconciliation
 * - Batch exports
 * 
 * Toate operațiunile sunt procesate asincron prin BullMQ pentru:
 * - Performanță optimă
 * - Progress tracking
 * - Retry logic automat
 * - Error handling granular
 */

import { accountingQueueService } from './accounting-queue.service';
import { log } from '../../../vite';

/**
 * Rezultat operațiune bulk
 */
export interface BulkOperationResult {
  success: boolean;
  jobId?: string;
  totalItems: number;
  message?: string;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

/**
 * Progress info pentru bulk operation
 */
export interface BulkOperationProgress {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  successCount?: number;
  errorCount?: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

/**
 * Invoice data pentru bulk creation
 */
export interface BulkInvoiceData {
  // Basic invoice info
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  
  // Customer info
  customerId: string;
  customerName?: string;
  customerFiscalCode?: string;
  
  // Items
  items: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    accountCode?: string;
  }>;
  
  // Totals
  subtotal?: number;
  vatAmount?: number;
  total?: number;
  
  // Optional
  currency?: string;
  notes?: string;
  paymentTerms?: string;
}

/**
 * Payment data pentru bulk recording
 */
export interface BulkPaymentData {
  // Payment info
  paymentDate: string;
  paymentAmount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHECK' | 'OTHER';
  
  // Reference
  invoiceId: string;
  invoiceNumber?: string;
  
  // Bank details (if applicable)
  bankAccount?: string;
  transactionReference?: string;
  
  // Optional
  notes?: string;
  exchangeRate?: number;
}

/**
 * Bulk Operations Service
 */
export class BulkOperationsService {
  /**
   * ============================================================================
   * BULK INVOICE OPERATIONS
   * ============================================================================
   */
  
  /**
   * Create multiple invoices in bulk
   * Validează toate datele înainte de a queue job-ul
   * 
   * @param companyId Company ID
   * @param invoices Array of invoice data
   * @param userId User ID performing the operation
   * @returns Bulk operation result with job ID for tracking
   */
  async bulkCreateInvoices(
    companyId: string,
    invoices: BulkInvoiceData[],
    userId: string
  ): Promise<BulkOperationResult> {
    try {
      log(`Bulk creating ${invoices.length} invoices for company ${companyId}`, 'bulk-operations');
      
      // Validare rapidă (fail fast)
      const validationErrors = this.validateInvoices(invoices);
      
      if (validationErrors.length > 0) {
        return {
          success: false,
          totalItems: invoices.length,
          message: 'Validation failed for some invoices',
          errors: validationErrors
        };
      }
      
      // Queue job pentru procesare bulk
      const job = await accountingQueueService.queueBulkInvoiceCreate({
        companyId,
        invoices: invoices as any[], // Type conversion for job payload
        userId
      });
      
      log(`Bulk invoice creation job queued: ${job.id}`, 'bulk-operations');
      
      return {
        success: true,
        jobId: job.id,
        totalItems: invoices.length,
        message: `Job queued successfully. Track progress using job ID: ${job.id}`
      };
    } catch (error: any) {
      log(`Error queueing bulk invoice creation: ${error.message}`, 'bulk-operations-error');
      return {
        success: false,
        totalItems: invoices.length,
        message: `Failed to queue bulk operation: ${error.message}`
      };
    }
  }
  
  /**
   * Validate invoices array
   * Returns array of validation errors
   */
  private validateInvoices(invoices: BulkInvoiceData[]): Array<{ index: number; error: string }> {
    const errors: Array<{ index: number; error: string }> = [];
    
    invoices.forEach((invoice, index) => {
      // Validate customer
      if (!invoice.customerId) {
        errors.push({ index, error: 'Missing customerId' });
      }
      
      // Validate items
      if (!invoice.items || invoice.items.length === 0) {
        errors.push({ index, error: 'No items provided' });
      }
      
      // Validate each item
      invoice.items?.forEach((item, itemIndex) => {
        if (!item.description) {
          errors.push({ index, error: `Item ${itemIndex}: Missing description` });
        }
        if (item.quantity <= 0) {
          errors.push({ index, error: `Item ${itemIndex}: Invalid quantity` });
        }
        if (item.unitPrice < 0) {
          errors.push({ index, error: `Item ${itemIndex}: Invalid unit price` });
        }
      });
      
      // Validate date
      if (!invoice.invoiceDate) {
        errors.push({ index, error: 'Missing invoice date' });
      }
    });
    
    return errors;
  }
  
  /**
   * ============================================================================
   * BULK PAYMENT OPERATIONS
   * ============================================================================
   */
  
  /**
   * Record multiple payments in bulk
   * 
   * @param companyId Company ID
   * @param payments Array of payment data
   * @param userId User ID performing the operation
   * @returns Bulk operation result with job ID
   */
  async bulkRecordPayments(
    companyId: string,
    payments: BulkPaymentData[],
    userId: string
  ): Promise<BulkOperationResult> {
    try {
      log(`Bulk recording ${payments.length} payments for company ${companyId}`, 'bulk-operations');
      
      // Validare rapidă
      const validationErrors = this.validatePayments(payments);
      
      if (validationErrors.length > 0) {
        return {
          success: false,
          totalItems: payments.length,
          message: 'Validation failed for some payments',
          errors: validationErrors
        };
      }
      
      // Queue job
      const job = await accountingQueueService.queueBulkPaymentRecord({
        companyId,
        payments: payments as any[],
        userId
      });
      
      log(`Bulk payment recording job queued: ${job.id}`, 'bulk-operations');
      
      return {
        success: true,
        jobId: job.id,
        totalItems: payments.length,
        message: `Job queued successfully. Track progress using job ID: ${job.id}`
      };
    } catch (error: any) {
      log(`Error queueing bulk payment recording: ${error.message}`, 'bulk-operations-error');
      return {
        success: false,
        totalItems: payments.length,
        message: `Failed to queue bulk operation: ${error.message}`
      };
    }
  }
  
  /**
   * Validate payments array
   */
  private validatePayments(payments: BulkPaymentData[]): Array<{ index: number; error: string }> {
    const errors: Array<{ index: number; error: string }> = [];
    
    payments.forEach((payment, index) => {
      if (!payment.invoiceId) {
        errors.push({ index, error: 'Missing invoiceId' });
      }
      
      if (!payment.paymentDate) {
        errors.push({ index, error: 'Missing payment date' });
      }
      
      if (payment.paymentAmount <= 0) {
        errors.push({ index, error: 'Invalid payment amount' });
      }
      
      if (!payment.paymentMethod) {
        errors.push({ index, error: 'Missing payment method' });
      }
    });
    
    return errors;
  }
  
  /**
   * ============================================================================
   * BULK RECONCILIATION OPERATIONS
   * ============================================================================
   */
  
  /**
   * Reconcile multiple accounts in bulk
   * Creează job-uri separate pentru fiecare cont (permite paralelizare)
   * 
   * @param companyId Company ID
   * @param accountIds Array of account IDs to reconcile
   * @param startDate Period start date
   * @param endDate Period end date
   * @returns Result with multiple job IDs
   */
  async bulkReconcileAccounts(
    companyId: string,
    accountIds: string[],
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    jobIds: string[];
    totalAccounts: number;
  }> {
    try {
      log(`Bulk reconciling ${accountIds.length} accounts for company ${companyId}`, 'bulk-operations');
      
      // Creează job separat pentru fiecare cont (permite procesare în paralel)
      const jobs = await Promise.all(
        accountIds.map(accountId =>
          accountingQueueService.queueAccountReconciliation({
            accountId,
            companyId,
            startDate,
            endDate
          })
        )
      );
      
      const jobIds = jobs.map(job => job.id).filter((id): id is string => id !== undefined);
      
      log(`Created ${jobIds.length} reconciliation jobs`, 'bulk-operations');
      
      return {
        success: true,
        jobIds,
        totalAccounts: accountIds.length
      };
    } catch (error: any) {
      log(`Error queueing bulk reconciliation: ${error.message}`, 'bulk-operations-error');
      return {
        success: false,
        jobIds: [],
        totalAccounts: accountIds.length
      };
    }
  }
  
  /**
   * ============================================================================
   * BATCH EXPORT OPERATIONS
   * ============================================================================
   */
  
  /**
   * Export multiple journals in a single batch
   * Generează un ZIP cu toate jurnalele solicitate
   * 
   * @param companyId Company ID
   * @param journals Types of journals to export
   * @param periodStart Period start date
   * @param periodEnd Period end date
   * @param format Export format (excel or pdf)
   * @param userId User ID
   * @returns Job ID for tracking
   */
  async batchExportJournals(
    companyId: string,
    journals: ('sales' | 'purchase' | 'bank' | 'cash')[],
    periodStart: string,
    periodEnd: string,
    format: 'excel' | 'pdf',
    userId: string
  ): Promise<{
    success: boolean;
    jobId?: string;
    message?: string;
  }> {
    try {
      log(`Batch export of ${journals.length} journals for company ${companyId}`, 'bulk-operations');
      
      if (journals.length === 0) {
        return {
          success: false,
          message: 'No journals specified for export'
        };
      }
      
      // Queue batch export job
      const job = await accountingQueueService.queueBatchExport({
        companyId,
        journals,
        periodStart,
        periodEnd,
        format,
        userId
      });
      
      log(`Batch export job queued: ${job.id}`, 'bulk-operations');
      
      return {
        success: true,
        jobId: job.id,
        message: `Batch export queued. Track progress using job ID: ${job.id}`
      };
    } catch (error: any) {
      log(`Error queueing batch export: ${error.message}`, 'bulk-operations-error');
      return {
        success: false,
        message: `Failed to queue batch export: ${error.message}`
      };
    }
  }
  
  /**
   * ============================================================================
   * JOB STATUS & TRACKING
   * ============================================================================
   */
  
  /**
   * Get status and progress of a bulk operation job
   * 
   * @param jobId Job ID to track
   * @returns Progress information
   */
  async getBulkOperationProgress(jobId: string): Promise<BulkOperationProgress | null> {
    try {
      const job = await accountingQueueService.getJob(jobId);
      
      if (!job) {
        return null;
      }
      
      const state = await accountingQueueService.getJobState(jobId);
      const progress = typeof job.progress === 'number' ? job.progress : 0;
      
      // Extract additional info from job data/result
      const jobData = job.data as any;
      const jobResult = job.returnvalue as any;
      
      return {
        jobId: job.id!,
        status: state as any,
        progress,
        totalItems: jobData?.invoices?.length || jobData?.payments?.length || 0,
        processedItems: jobResult?.successCount || 0,
        successCount: jobResult?.successCount,
        errorCount: jobResult?.errorCount,
        errors: jobResult?.errors
      };
    } catch (error: any) {
      log(`Error getting bulk operation progress: ${error.message}`, 'bulk-operations-error');
      return null;
    }
  }
  
  /**
   * Cancel a running bulk operation
   * 
   * @param jobId Job ID to cancel
   * @returns Success status
   */
  async cancelBulkOperation(jobId: string): Promise<boolean> {
    try {
      await accountingQueueService.cancelJob(jobId);
      log(`Bulk operation cancelled: ${jobId}`, 'bulk-operations');
      return true;
    } catch (error: any) {
      log(`Error cancelling bulk operation: ${error.message}`, 'bulk-operations-error');
      return false;
    }
  }
}

// Export singleton instance
export const bulkOperationsService = new BulkOperationsService();

