/**
 * Accounting Queue Service
 * 
 * Wrapper peste BullMQ accounting queue pentru toate operațiunile de contabilitate.
 * Oferă metode de adăugare joburi cu retry strategies, priority management și progress tracking.
 */

import { Job, JobsOptions } from 'bullmq';
import { accountingQueue } from "@common/bullmq/queues";
import { 
  BalanceUpdateJob, 
  AccountReconciliationJob,
  ReportGenerationJob 
} from "@common/bullmq/types";

/**
 * Extended job types pentru accounting
 */

// Sales Journal Job
export interface GenerateSalesJournalJob {
  id: string;
  timestamp: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  reportType?: 'DETAILED' | 'SUMMARY';
  userId: string;
}

// Purchase Journal Job
export interface GeneratePurchaseJournalJob {
  id: string;
  timestamp: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  reportType?: 'DETAILED' | 'SUMMARY';
  userId: string;
}

// Export Job
export interface ExportJournalJob {
  id: string;
  timestamp: string;
  companyId: string;
  journalType: 'sales' | 'purchase' | 'bank' | 'cash';
  periodStart: string;
  periodEnd: string;
  format: 'excel' | 'pdf';
  userId: string;
}

// Fiscal Closure Job
export interface FiscalMonthCloseJob {
  id: string;
  timestamp: string;
  companyId: string;
  year: number;
  month: number;
  userId: string;
  skipDepreciation?: boolean;
  skipFXRevaluation?: boolean;
  skipVAT?: boolean;
  dryRun?: boolean;
}

export interface FiscalYearCloseJob {
  id: string;
  timestamp: string;
  companyId: string;
  fiscalYear: number;
  userId: string;
  dryRun?: boolean;
}

// VAT Closure Job
export interface VATClosureJob {
  id: string;
  timestamp: string;
  companyId: string;
  periodYear: number;
  periodMonth: number;
  userId: string;
  dryRun?: boolean;
}

// Bulk Operations Jobs
export interface BulkInvoiceCreateJob {
  id: string;
  timestamp: string;
  companyId: string;
  invoices: any[];
  userId: string;
}

export interface BulkPaymentRecordJob {
  id: string;
  timestamp: string;
  companyId: string;
  payments: any[];
  userId: string;
}

// Depreciation Job
export interface DepreciationCalculateJob {
  id: string;
  timestamp: string;
  companyId: string;
  periodYear: number;
  periodMonth: number;
  userId: string;
  dryRun?: boolean;
}

// FX Revaluation Job
export interface FXRevaluationJob {
  id: string;
  timestamp: string;
  companyId: string;
  periodYear: number;
  periodMonth: number;
  userId: string;
  dryRun?: boolean;
}

// VAT Transfer Job (pentru TVA la încasare)
export interface VATTransferJob {
  id: string;
  timestamp: string;
  invoiceId: string;
  companyId: string;
  paymentAmount: number;
  paymentDate: string;
  userId?: string;
}

// Batch Export Job
export interface BatchExportJob {
  id: string;
  timestamp: string;
  companyId: string;
  journals: ('sales' | 'purchase' | 'bank' | 'cash')[];
  periodStart: string;
  periodEnd: string;
  format: 'excel' | 'pdf';
  userId: string;
}

// Note Contabil Jobs
export interface GenerateNoteContabilJob {
  id: string;
  timestamp: string;
  companyId: string;
  documentType: string;
  documentId: string;
  userId: string;
}

export interface GenerateNotePdfJob {
  id: string;
  timestamp: string;
  companyId: string;
  noteId: string;
  userId: string;
}

export interface GenerateTrialBalanceJob {
  id: string;
  timestamp: string;
  companyId: string;
  startDate: string;
  endDate: string;
  userId: string;
}

export interface GenerateBalanceSheetJob {
  id: string;
  timestamp: string;
  companyId: string;
  date: string;
  userId: string;
}

export interface GenerateIncomeStatementJob {
  id: string;
  timestamp: string;
  companyId: string;
  startDate: string;
  endDate: string;
  userId: string;
}

/**
 * Job priority levels
 */
export enum JobPriority {
  CRITICAL = 1,    // Fiscal closures, important calculations
  HIGH = 5,        // Invoice creation, payment recording
  NORMAL = 10,     // Journal generation
  LOW = 20         // Exports, reports
}

/**
 * Accounting Queue Service
 */
export class AccountingQueueService {
  /**
   * Default job options with retry strategy
   */
  private getDefaultOptions(priority: JobPriority = JobPriority.NORMAL): JobsOptions {
    return {
      priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep for 24 hours
        count: 1000
      },
      removeOnFail: {
        age: 7 * 24 * 3600 // Keep failed jobs for 7 days
      }
    };
  }

  /**
   * Critical job options (more retries, higher priority)
   */
  private getCriticalOptions(): JobsOptions {
    return {
      ...this.getDefaultOptions(JobPriority.CRITICAL),
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000
      }
    };
  }

  /**
   * ============================================================================
   * BALANCE & RECONCILIATION JOBS
   * ============================================================================
   */

  /**
   * Queue balance update job
   */
  async queueBalanceUpdate(data: Omit<BalanceUpdateJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: BalanceUpdateJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('balance-update', job, this.getDefaultOptions(JobPriority.HIGH));
  }

  /**
   * Queue account reconciliation job
   */
  async queueAccountReconciliation(data: Omit<AccountReconciliationJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: AccountReconciliationJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('account-reconciliation', job, this.getDefaultOptions(JobPriority.NORMAL));
  }

  /**
   * ============================================================================
   * JOURNAL GENERATION JOBS
   * ============================================================================
   */

  /**
   * Queue sales journal generation
   */
  async queueSalesJournalGeneration(data: Omit<GenerateSalesJournalJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: GenerateSalesJournalJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('generate-sales-journal', job, this.getDefaultOptions(JobPriority.NORMAL));
  }

  /**
   * Queue purchase journal generation
   */
  async queuePurchaseJournalGeneration(data: Omit<GeneratePurchaseJournalJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: GeneratePurchaseJournalJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('generate-purchase-journal', job, this.getDefaultOptions(JobPriority.NORMAL));
  }

  /**
   * ============================================================================
   * EXPORT JOBS
   * ============================================================================
   */

  /**
   * Queue journal export (Excel/PDF)
   */
  async queueJournalExport(data: Omit<ExportJournalJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: ExportJournalJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('export-journal-' + data.format, job, this.getDefaultOptions(JobPriority.LOW));
  }

  /**
   * Queue batch export (multiple journals)
   */
  async queueBatchExport(data: Omit<BatchExportJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: BatchExportJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('batch-export', job, this.getDefaultOptions(JobPriority.LOW));
  }

  /**
   * ============================================================================
   * FISCAL CLOSURE JOBS
   * ============================================================================
   */

  /**
   * Queue fiscal month closure
   */
  async queueMonthClose(data: Omit<FiscalMonthCloseJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: FiscalMonthCloseJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('fiscal-month-close', job, this.getCriticalOptions());
  }

  /**
   * Queue fiscal year closure
   */
  async queueYearClose(data: Omit<FiscalYearCloseJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: FiscalYearCloseJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('fiscal-year-close', job, this.getCriticalOptions());
  }

  /**
   * Queue VAT closure
   */
  async queueVATClosure(data: Omit<VATClosureJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: VATClosureJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('vat-closure', job, this.getCriticalOptions());
  }

  /**
   * ============================================================================
   * BULK OPERATIONS JOBS
   * ============================================================================
   */

  /**
   * Queue bulk invoice creation
   */
  async queueBulkInvoiceCreate(data: Omit<BulkInvoiceCreateJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: BulkInvoiceCreateJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('batch-invoice-create', job, this.getDefaultOptions(JobPriority.HIGH));
  }

  /**
   * Queue bulk payment recording
   */
  async queueBulkPaymentRecord(data: Omit<BulkPaymentRecordJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: BulkPaymentRecordJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('batch-payment-record', job, this.getDefaultOptions(JobPriority.HIGH));
  }

  /**
   * ============================================================================
   * PERIODIC CALCULATION JOBS
   * ============================================================================
   */

  /**
   * Queue depreciation calculation
   */
  async queueDepreciationCalculate(data: Omit<DepreciationCalculateJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: DepreciationCalculateJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('depreciation-calculate', job, this.getDefaultOptions(JobPriority.HIGH));
  }

  /**
   * Queue FX revaluation
   */
  async queueFXRevaluation(data: Omit<FXRevaluationJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: FXRevaluationJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('fx-revaluation', job, this.getDefaultOptions(JobPriority.HIGH));
  }

  /**
   * Queue VAT transfer (pentru TVA la încasare)
   */
  async queueVATTransfer(data: Omit<VATTransferJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: VATTransferJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('vat-transfer', job, this.getDefaultOptions(JobPriority.HIGH));
  }

  /**
   * ============================================================================
   * NOTE CONTABIL JOBS
   * ============================================================================
   */

  /**
   * Queue note contabil generation
   */
  async queueGenerateNoteContabil(data: Omit<GenerateNoteContabilJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: GenerateNoteContabilJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('generate-note-contabil', job, this.getDefaultOptions(JobPriority.HIGH));
  }

  /**
   * Queue note contabil PDF generation
   */
  async queueGenerateNotePdf(data: Omit<GenerateNotePdfJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: GenerateNotePdfJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('generate-note-pdf', job, this.getDefaultOptions(JobPriority.LOW));
  }

  /**
   * ============================================================================
   * FINANCIAL REPORTS JOBS
   * ============================================================================
   */

  /**
   * Queue trial balance generation
   */
  async queueGenerateTrialBalance(data: Omit<GenerateTrialBalanceJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: GenerateTrialBalanceJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('generate-trial-balance', job, this.getDefaultOptions(JobPriority.NORMAL));
  }

  /**
   * Queue balance sheet generation
   */
  async queueGenerateBalanceSheet(data: Omit<GenerateBalanceSheetJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: GenerateBalanceSheetJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('generate-balance-sheet', job, this.getDefaultOptions(JobPriority.NORMAL));
  }

  /**
   * Queue income statement generation
   */
  async queueGenerateIncomeStatement(data: Omit<GenerateIncomeStatementJob, 'id' | 'timestamp'>): Promise<Job> {
    const job: GenerateIncomeStatementJob = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...data
    };

    return await accountingQueue.add('generate-income-statement', job, this.getDefaultOptions(JobPriority.NORMAL));
  }

  /**
   * ============================================================================
   * UTILITY METHODS
   * ============================================================================
   */

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | undefined> {
    return await accountingQueue.getJob(jobId);
  }

  /**
   * Get job state
   */
  async getJobState(jobId: string): Promise<string | 'unknown'> {
    const job = await this.getJob(jobId);
    if (!job) return 'unknown';
    return await job.getState();
  }

  /**
   * Cancel/remove a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      accountingQueue.getWaitingCount(),
      accountingQueue.getActiveCount(),
      accountingQueue.getCompletedCount(),
      accountingQueue.getFailedCount(),
      accountingQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  }

  /**
   * Clean old jobs
   */
  async cleanOldJobs(grace: number = 24 * 3600 * 1000): Promise<void> {
    await accountingQueue.clean(grace, 1000, 'completed');
    await accountingQueue.clean(7 * 24 * 3600 * 1000, 1000, 'failed'); // Keep failed for 7 days
  }

  /**
   * Generate unique job ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const accountingQueueService = new AccountingQueueService();

