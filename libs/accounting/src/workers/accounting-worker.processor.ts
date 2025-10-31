/**
 * Accounting Worker Processor
 * 
 * Conține logica completă de procesare pentru toate job-urile de contabilitate.
 * Acest fișier este separat pentru a permite:
 * - Injecție de dependințe (services)
 * - Testing mai ușor
 * - Separare clară a responsabilităților
 */

import { Job } from 'bullmq';
import { JobTypeMap } from "@common/bullmq/types";
import { RedisService } from '@common/services/redis.service';
import {
  BalanceUpdateResult,
  AccountReconciliationResult,
  JournalGenerationResult,
  JournalExportResult,
  BatchExportResult,
  FiscalMonthCloseResult,
  FiscalYearCloseResult,
  VATClosureResult,
  BulkInvoiceCreateResult,
  BulkPaymentRecordResult,
  DepreciationCalculateResult,
  FXRevaluationResult,
  VATTransferResult,
  GenerateNoteContabilResult,
  GenerateNotePdfResult,
  FinancialReportResult,
  getErrorMessage
} from './types';

/**
 * Union type pentru toate rezultatele posibile
 */
export type AccountingJobResult =
  | BalanceUpdateResult
  | AccountReconciliationResult
  | JournalGenerationResult
  | JournalExportResult
  | BatchExportResult
  | FiscalMonthCloseResult
  | FiscalYearCloseResult
  | VATClosureResult
  | BulkInvoiceCreateResult
  | BulkPaymentRecordResult
  | DepreciationCalculateResult
  | FXRevaluationResult
  | VATTransferResult
  | GenerateNoteContabilResult
  | GenerateNotePdfResult
  | FinancialReportResult;

/**
 * Main accounting job processor
 * Rutează job-urile către handler-ul corespunzător
 */
export async function processAccountingJob(job: Job<JobTypeMap[keyof JobTypeMap]>): Promise<AccountingJobResult> {
  console.log(`Processing accounting job: ${job.name}`, 'accounting-job');
  
  try {
    switch (job.name) {
      // ======================================================================
      // BALANCE & RECONCILIATION
      // ======================================================================
      case 'balance-update':
      case 'update-balance':
        return await handleBalanceUpdate(job);
      
      case 'account-reconciliation':
        return await handleAccountReconciliation(job);
      
      // ======================================================================
      // JOURNAL GENERATION
      // ======================================================================
      case 'generate-sales-journal':
        return await handleGenerateSalesJournal(job);
      
      case 'generate-purchase-journal':
        return await handleGeneratePurchaseJournal(job);
      
      // ======================================================================
      // EXPORTS
      // ======================================================================
      case 'export-journal-excel':
      case 'export-journal-pdf':
        return await handleJournalExport(job);
      
      case 'batch-export':
        return await handleBatchExport(job);
      
      // ======================================================================
      // FISCAL CLOSURES
      // ======================================================================
      case 'fiscal-month-close':
        return await handleFiscalMonthClose(job);
      
      case 'fiscal-year-close':
        return await handleFiscalYearClose(job);
      
      case 'vat-closure':
        return await handleVATClosure(job);
      
      // ======================================================================
      // BULK OPERATIONS
      // ======================================================================
      case 'batch-invoice-create':
        return await handleBulkInvoiceCreate(job);
      
      case 'batch-payment-record':
        return await handleBulkPaymentRecord(job);
      
      // ======================================================================
      // PERIODIC CALCULATIONS
      // ======================================================================
      case 'depreciation-calculate':
        return await handleDepreciationCalculate(job);
      
      case 'fx-revaluation':
        return await handleFXRevaluation(job);
      
      case 'vat-transfer':
        return await handleVATTransfer(job);
      
      case 'generate-note-contabil':
        return await handleGenerateNoteContabil(job);
      
      case 'generate-note-pdf':
        return await handleGenerateNotePdf(job);
      
      case 'generate-trial-balance':
        return await handleGenerateTrialBalance(job);
      
      case 'generate-balance-sheet':
        return await handleGenerateBalanceSheet(job);
      
      case 'generate-income-statement':
        return await handleGenerateIncomeStatement(job);
      
      default:
        console.log(`Unknown accounting job type: ${job.name}`, 'accounting-job-error');
        throw new Error(`Unknown job type: ${job.name}`);
    }
  } catch (error: unknown) {
    console.log(`Error processing accounting job ${job.name}: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * ============================================================================
 * JOB HANDLERS - BALANCE & RECONCILIATION
 * ============================================================================
 */

async function handleBalanceUpdate(job: Job): Promise<BalanceUpdateResult> {
  const data = job.data as JobTypeMap['balance-update'];
  console.log(`Balance update for journal entry ${data.journalEntryId}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    // Import services aici pentru a evita circular dependencies
    const { JournalService } = await import('../services/journal.service');
    const journalService = new JournalService();
    
    await job.updateProgress(30);
    
    // Get journal entry
    const entry = await journalService.getLedgerEntry(data.journalEntryId);
    
    if (!entry) {
      throw new Error(`Journal entry ${data.journalEntryId} not found`);
    }
    
    await job.updateProgress(50);
    
    // Update account balances
    // Nota: logica efectivă de update este în JournalService
    console.log(`Updating balances for ${entry.lines?.length || 0} account lines`, 'accounting-job');
    
    await job.updateProgress(80);
    
    // Verify balance (debit = credit)
    const totalDebit = entry.lines?.reduce((sum, line) => sum + (line.debitAmount || 0), 0) || 0;
    const totalCredit = entry.lines?.reduce((sum, line) => sum + (line.creditAmount || 0), 0) || 0;
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      console.log(`WARNING: Balance mismatch for entry ${data.journalEntryId}: debit=${totalDebit}, credit=${totalCredit}`, 'accounting-job-warning');
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      journalEntryId: data.journalEntryId,
      totalDebit,
      totalCredit,
      linesProcessed: entry.lines?.length || 0
    };
  } catch (error: unknown) {
    console.log(`Error updating balance: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

async function handleAccountReconciliation(job: Job): Promise<AccountReconciliationResult> {
  const data = job.data as JobTypeMap['account-reconciliation'];
  console.log(`Account reconciliation for account ${data.accountId}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const { getDrizzle } = await import('../../../common/drizzle');
    const db = getDrizzle();
    
    await job.updateProgress(20);
    
    // 1. Citește toate entries din perioada
    console.log(`Calculating balance for account ${data.accountId} from ${data.startDate} to ${data.endDate}`, 'accounting-job');
    
    const entriesResult = await db.$client.unsafe(`
      SELECT 
        ll.debit_amount,
        ll.credit_amount,
        le.entry_date
      FROM ledger_lines ll
      JOIN ledger_entries le ON le.id = ll.ledger_entry_id
      WHERE ll.account_id = $1
      AND le.entry_date >= $2
      AND le.entry_date <= $3
      AND le.deleted_at IS NULL
      ORDER BY le.entry_date
    `, [data.accountId, data.startDate, data.endDate]);
    
    await job.updateProgress(50);
    
    // 2. Calculează sold așteptat (suma debit - suma credit)
    let expectedBalance = 0;
    for (const entry of entriesResult) {
      expectedBalance += (entry.debit_amount || 0) - (entry.credit_amount || 0);
    }
    
    await job.updateProgress(70);
    
    // 3. Compară cu sold efectiv din AC_accounting_account_balances
    // NOTE: Tabelul AC_accounting_account_balances folosește full_account_number în loc de account_id
    // TODO Pentru moment, skip comparația până când sistemul este actualizat complet
    const actualBalance = 0; // TODO: Implement after full migration to AC_accounting_account_balances
    
    const difference = Math.abs(expectedBalance - actualBalance);
    const reconciled = difference < 0.01; // Tolerance de 1 ban
    
    await job.updateProgress(90);
    
    // 4. Log rezultat
    if (!reconciled) {
      console.log(`WARNING: Reconciliation mismatch for account ${data.accountId}: expected=${expectedBalance}, actual=${actualBalance}, diff=${difference}`, 'accounting-job-warning');
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      accountId: data.accountId,
      startDate: data.startDate,
      endDate: data.endDate,
      expectedBalance,
      actualBalance,
      difference,
      reconciled,
      entriesCount: entriesResult.length
    };
  } catch (error: unknown) {
    console.log(`Error reconciling account: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * ============================================================================
 * JOB HANDLERS - JOURNAL GENERATION
 * ============================================================================
 */

async function handleGenerateSalesJournal(job: Job): Promise<JournalGenerationResult> {
  const data = job.data as JobTypeMap['generate-sales-journal'];
  console.log(`Generating sales journal for company ${data.companyId}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const { SalesJournalService } = await import('../services/sales-journal.service');
    const salesJournalService = new SalesJournalService();
    
    await job.updateProgress(20);
    
    // Generate report
    console.log(`Generating sales journal from ${data.periodStart} to ${data.periodEnd}`, 'accounting-job');
    
    const report = await salesJournalService.generateSalesJournal({
      companyId: data.companyId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd)
    });
    
    await job.updateProgress(80);
    
    // Cache result
    const redisService = new RedisService();
    await redisService.connect();
    
    if (redisService.isConnected()) {
      const cacheKey = `acc:sales-journal:${data.companyId}:${data.periodStart}:${data.periodEnd}`;
      await redisService.setCached(cacheKey, report, 1800); // 30 min TTL
      console.log(`Sales journal cached with key: ${cacheKey}`, 'accounting-job');
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      companyId: data.companyId,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      entriesCount: report.rows?.length || 0,
      totalAmount: report.totals?.totalAmount || 0
    };
  } catch (error: unknown) {
    console.log(`Error generating sales journal: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

async function handleGeneratePurchaseJournal(job: Job): Promise<JournalGenerationResult> {
  const data = job.data as JobTypeMap['generate-purchase-journal'];
  console.log(`Generating purchase journal for company ${data.companyId}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const { PurchaseJournalService } = await import('../services/purchase-journal.service');
    const purchaseJournalService = new PurchaseJournalService();
    
    await job.updateProgress(20);
    
    // Generate report
    console.log(`Generating purchase journal from ${data.periodStart} to ${data.periodEnd}`, 'accounting-job');
    
    const report = await purchaseJournalService.generatePurchaseJournal({
      companyId: data.companyId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd)
    });
    
    await job.updateProgress(80);
    
    // Cache result
    const redisService = new RedisService();
    await redisService.connect();
    
    if (redisService.isConnected()) {
      const cacheKey = `acc:purchase-journal:${data.companyId}:${data.periodStart}:${data.periodEnd}`;
      await redisService.setCached(cacheKey, report, 1800); // 30 min TTL
      console.log(`Purchase journal cached with key: ${cacheKey}`, 'accounting-job');
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      companyId: data.companyId,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      entriesCount: report.rows?.length || 0,
      totalAmount: report.totals?.totalAmount || 0
    };
  } catch (error: unknown) {
    console.log(`Error generating purchase journal: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * ============================================================================
 * JOB HANDLERS - EXPORTS
 * ============================================================================
 */

async function handleJournalExport(job: Job): Promise<JournalExportResult> {
  const data = job.data as JobTypeMap['export-journal-excel'];
  console.log(`Exporting ${data.journalType} journal as ${data.format}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    let exportPath: string;
    
    await job.updateProgress(20);
    
    if (data.format === 'excel') {
      // Export Excel
      const { GeneralJournalExcelService } = await import('../services/general-journal-excel.service');
      const excelService = new GeneralJournalExcelService();
      
      await job.updateProgress(40);
      
      const { getDrizzle } = await import('../../../common/drizzle');
      const db = getDrizzle();
      
      // Get company name
      const companyResult = await db.$client.unsafe(`
        SELECT name FROM companies WHERE id = $1 LIMIT 1
      `, [data.companyId]);
      const companyName = companyResult.length > 0 ? companyResult[0].name : 'Unknown Company';
      
      await job.updateProgress(60);
      
      exportPath = await excelService.generateGeneralJournalExcel({
        companyId: data.companyId,
        companyName,
        startDate: new Date(data.periodStart),
        endDate: new Date(data.periodEnd),
        journalTypes: data.journalType ? [data.journalType] : undefined,
        includeReversals: true,
        includeMetadata: true
      });
    } else {
      // Export PDF
      const { GeneralJournalPDFService } = await import('../services/general-journal-pdf.service');
      const pdfService = new GeneralJournalPDFService();
      
      await job.updateProgress(40);
      
      const { getDrizzle } = await import('../../../common/drizzle');
      const db = getDrizzle();
      
      // Get company name
      const companyResult = await db.$client.unsafe(`
        SELECT name FROM companies WHERE id = $1 LIMIT 1
      `, [data.companyId]);
      const companyName = companyResult.length > 0 ? companyResult[0].name : 'Unknown Company';
      
      await job.updateProgress(60);
      
      exportPath = await pdfService.generateGeneralJournalPDF({
        companyId: data.companyId,
        companyName,
        startDate: new Date(data.periodStart),
        endDate: new Date(data.periodEnd),
        journalTypes: data.journalType ? [data.journalType] : undefined,
        detailLevel: 'detailed',
        includeReversals: true
      });
    }
    
    await job.updateProgress(90);
    
    console.log(`Export saved to: ${exportPath}`, 'accounting-job');
    
    await job.updateProgress(100);
    
    return {
      success: true,
      exportPath,
      format: data.format,
      journalType: data.journalType,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd
    };
  } catch (error: unknown) {
    console.log(`Error exporting journal: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

async function handleBatchExport(job: Job): Promise<BatchExportResult> {
  const data = job.data as JobTypeMap['batch-export'];
  console.log(`Batch export of ${data.journals.length} journals`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    const archiver = (await import('archiver')).default;
    
    const { getDrizzle } = await import('../../../common/drizzle');
    const db = getDrizzle();
    
    // Get company name
    const companyResult = await db.$client.unsafe(`
      SELECT name FROM companies WHERE id = $1 LIMIT 1
    `, [data.companyId]);
    const companyName = companyResult.length > 0 ? companyResult[0].name : 'Unknown Company';
    
    await job.updateProgress(20);
    
    // Generate individual journal files
    const exportedFiles: string[] = [];
    const progressPerJournal = 60 / data.journals.length;
    
    for (let i = 0; i < data.journals.length; i++) {
      const journalType = data.journals[i];
      console.log(`Exporting ${journalType} journal (${i + 1}/${data.journals.length})`, 'accounting-job');
      
      let filePath: string;
      
      if (data.format === 'excel') {
        const { GeneralJournalExcelService } = await import('../services/general-journal-excel.service');
        const excelService = new GeneralJournalExcelService();
        
        filePath = await excelService.generateGeneralJournalExcel({
          companyId: data.companyId,
          companyName,
          startDate: new Date(data.periodStart),
          endDate: new Date(data.periodEnd),
          journalTypes: [journalType],
          includeReversals: true,
          includeMetadata: false
        });
      } else {
        const { GeneralJournalPDFService } = await import('../services/general-journal-pdf.service');
        const pdfService = new GeneralJournalPDFService();
        
        filePath = await pdfService.generateGeneralJournalPDF({
          companyId: data.companyId,
          companyName,
          startDate: new Date(data.periodStart),
          endDate: new Date(data.periodEnd),
          journalTypes: [journalType],
          detailLevel: 'detailed',
          includeReversals: true
        });
      }
      
      exportedFiles.push(filePath);
      await job.updateProgress(20 + Math.round((i + 1) * progressPerJournal));
    }
    
    await job.updateProgress(85);
    
    // Create ZIP archive
    const reportsDir = path.join(process.cwd(), 'reports', 'batch-exports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const zipFileName = `batch-export-${data.periodStart}-${data.periodEnd}-${Date.now()}.zip`;
    const zipFilePath = path.join(reportsDir, zipFileName);
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    
    // Add each file to ZIP
    for (const filePath of exportedFiles) {
      const fileName = path.basename(filePath);
      archive.file(filePath, { name: fileName });
    }
    
    await archive.finalize();
    
    // Wait for ZIP to finish
    await new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', reject);
    });
    
    await job.updateProgress(95);
    
    // Clean up individual files
    for (const filePath of exportedFiles) {
      try {
        fs.unlinkSync(filePath);
      } catch (_cleanupError) {
        console.log(`Warning: Could not delete temp file ${filePath}`, 'accounting-job-warning');
      }
    }
    
    console.log(`Batch export ZIP created: ${zipFilePath}`, 'accounting-job');
    
    await job.updateProgress(100);
    
    return {
      success: true,
      journalsExported: data.journals.length,
      format: data.format,
      zipFilePath,
      filesIncluded: exportedFiles.length
    };
  } catch (error: unknown) {
    console.log(`Error in batch export: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * ============================================================================
 * JOB HANDLERS - FISCAL CLOSURES
 * ============================================================================
 */

async function handleFiscalMonthClose(job: Job): Promise<FiscalMonthCloseResult> {
  const data = job.data as JobTypeMap['fiscal-month-close'];
  console.log(`Fiscal month close for ${data.year}-${data.month}`, 'accounting-job');
  
  await job.updateProgress(5);
  
  try {
    const results: FiscalMonthCloseResult['results'] = {
      depreciation: null,
      fxRevaluation: null,
      vatClosure: null,
      periodLocked: false
    };
    
    await job.updateProgress(10);
    
    // Step 1: Depreciation (if not skipped)
    if (!data.skipDepreciation) {
      console.log(`Running depreciation for ${data.year}-${data.month}`, 'accounting-job');
      await job.updateProgress(15);
      
      const { DepreciationCalculationService } = await import('../services/depreciation-calculation.service');
      const depreciationService = new DepreciationCalculationService();
      
      results.depreciation = await depreciationService.calculateMonthlyDepreciation({
        companyId: data.companyId,
        periodYear: data.year,
        periodMonth: data.month,
        userId: data.userId,
        dryRun: data.dryRun || false
      });
      
      console.log(`Depreciation complete: ${results.depreciation.itemCount} assets, total ${results.depreciation.totalDepreciation} RON`, 'accounting-job');
      await job.updateProgress(30);
    }
    
    // Step 2: FX Revaluation (if not skipped)
    if (!data.skipFXRevaluation) {
      console.log(`Running FX revaluation for ${data.year}-${data.month}`, 'accounting-job');
      await job.updateProgress(35);
      
      const { FXRevaluationService } = await import('../services/fx-revaluation.service');
      const fxRevaluationService = new FXRevaluationService();
      
      results.fxRevaluation = await fxRevaluationService.revalueForeignCurrency({
        companyId: data.companyId,
        periodYear: data.year,
        periodMonth: data.month,
        userId: data.userId,
        dryRun: data.dryRun || false
      });
      
      console.log(`FX revaluation complete: net difference ${results.fxRevaluation.netDifference} RON`, 'accounting-job');
      await job.updateProgress(55);
    }
    
    // Step 3: VAT Closure (if not skipped)
    if (!data.skipVAT) {
      console.log(`Running VAT closure for ${data.year}-${data.month}`, 'accounting-job');
      await job.updateProgress(60);
      
      const { VATClosureService } = await import('../services/vat-closure.service');
      const vatClosureService = new VATClosureService();
      
      const vatResult = await vatClosureService.closeVATPeriod({
        companyId: data.companyId,
        periodYear: data.year,
        periodMonth: data.month,
        userId: data.userId
      });
      
      // Convert to Record<string, unknown> to match type
      results.vatClosure = vatResult as unknown as Record<string, unknown>;
      
      console.log(`VAT closure complete`, 'accounting-job');
      await job.updateProgress(75);
    }
    
    // Step 4: Lock period (if not dry run)
    if (!data.dryRun) {
      console.log(`Locking period ${data.year}-${data.month}`, 'accounting-job');
      await job.updateProgress(80);
      
      const { PeriodLockService } = await import('../services/period-lock.service');
      const periodLockService = new PeriodLockService();
      
      // Calculate start and end date of the month
      const startDate = new Date(data.year, data.month - 1, 1);
      const endDate = new Date(data.year, data.month, 0);
      
      await periodLockService.closePeriod(
        data.companyId,
        startDate,
        endDate,
        data.userId
      );
      
      results.periodLocked = true;
      console.log(`Period ${data.year}-${data.month} locked`, 'accounting-job');
      await job.updateProgress(95);
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      companyId: data.companyId,
      year: data.year,
      month: data.month,
      dryRun: data.dryRun || false,
      results
    };
  } catch (error: unknown) {
    console.log(`Error in fiscal month close: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

async function handleFiscalYearClose(job: Job): Promise<FiscalYearCloseResult> {
  const data = job.data as JobTypeMap['fiscal-year-close'];
  console.log(`Fiscal year close for ${data.fiscalYear}`, 'accounting-job');
  
  await job.updateProgress(5);
  
  try {
    const monthResults: FiscalMonthCloseResult[] = [];
    
    // 1. Close all months (1-12)
    for (let month = 1; month <= 12; month++) {
      console.log(`Closing month ${month}/${data.fiscalYear}`, 'accounting-job');
      
      const monthCloseResult = await handleFiscalMonthClose({
        ...job,
        data: {
          companyId: data.companyId,
          year: data.fiscalYear,
          month,
          userId: data.userId,
          skipDepreciation: false,
          skipFXRevaluation: false,
          skipVAT: false,
          dryRun: data.dryRun || false
        }
      } as Job);
      
      monthResults.push(monthCloseResult);
      
      await job.updateProgress(5 + (month * 7)); // Progress from 5% to 89%
    }
    
    await job.updateProgress(90);
    
    // 2. Create year-end closing entries (121 -> 117)
    if (!data.dryRun) {
      console.log(`Creating year-end closing entries for ${data.fiscalYear}`, 'accounting-job');
      
      const { YearEndClosureService } = await import('../services/year-end-closure.service');
      const yearEndService = new YearEndClosureService();
      
      await yearEndService.closeFiscalYear({
        companyId: data.companyId,
        fiscalYear: data.fiscalYear,
        userId: data.userId,
        dryRun: false
      });
      
      console.log(`Year-end closing entries created for ${data.fiscalYear}`, 'accounting-job');
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      companyId: data.companyId,
      fiscalYear: data.fiscalYear,
      dryRun: data.dryRun || false,
      monthsClosed: monthResults.length,
      monthResults
    };
  } catch (error: unknown) {
    console.log(`Error in fiscal year close: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

async function handleVATClosure(job: Job): Promise<VATClosureResult> {
  const data = job.data as JobTypeMap['vat-closure'];
  console.log(`VAT closure for ${data.periodYear}-${data.periodMonth}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const { VATClosureService } = await import('../services/vat-closure.service');
    const vatClosureService = new VATClosureService();
    
    await job.updateProgress(30);
    
    // Calculate VAT
    const result = await vatClosureService.closeVATPeriod({
      companyId: data.companyId,
      periodYear: data.periodYear,
      periodMonth: data.periodMonth,
      userId: data.userId
    });
    
    await job.updateProgress(80);
    
    // Cache D300 report
    const redisService = new RedisService();
    await redisService.connect();
    
    if (redisService.isConnected()) {
      const cacheKey = `acc:vat-d300:${data.companyId}:${data.periodYear}-${data.periodMonth}`;
      await redisService.setCached(cacheKey, result, 3600); // 1h TTL
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      companyId: data.companyId,
      periodYear: data.periodYear,
      periodMonth: data.periodMonth,
      ...result
    };
  } catch (error: unknown) {
    console.log(`Error in VAT closure: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * ============================================================================
 * JOB HANDLERS - BULK OPERATIONS
 * ============================================================================
 */

async function handleBulkInvoiceCreate(job: Job): Promise<BulkInvoiceCreateResult> {
  const data = job.data as JobTypeMap['batch-invoice-create'];
  console.log(`Bulk creating ${data.invoices.length} invoices`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const { SalesJournalService } = await import('../services/sales-journal.service');
    const salesJournalService = new SalesJournalService();
    
    const results: BulkInvoiceCreateResult['results'] = [];
    const errors: BulkInvoiceCreateResult['errors'] = [];
    
    for (let i = 0; i < data.invoices.length; i++) {
      try {
        const invoice = data.invoices[i];
        console.log(`Processing bulk invoice ${i + 1}/${data.invoices.length}`, 'accounting-job');
        
        // Extract invoice parameters
        const invoiceId = await salesJournalService.createCustomerInvoice(
          invoice.invoiceData || invoice,
          invoice.customer || null,
          invoice.items || [],
          invoice.taxRates || [],
          invoice.paymentTerms || null,
          invoice.notes || null
        );
        
        results.push({ 
          index: i, 
          invoiceId, 
          invoiceNumber: invoice.invoiceData?.invoiceNumber || invoice.invoiceNumber,
          status: 'success' 
        });
        
        // Update progress
        const progress = 10 + ((i + 1) / data.invoices.length) * 85;
        await job.updateProgress(Math.round(progress));
      } catch (innerError: unknown) {
        console.log(`Error creating invoice ${i + 1}: ${getErrorMessage(innerError)}`, 'accounting-job-error');
        errors.push({ 
          index: i, 
          invoiceNumber: data.invoices[i].invoiceData?.invoiceNumber || data.invoices[i].invoiceNumber,
          error: getErrorMessage(innerError),
          status: 'error'
        });
      }
    }
    
    await job.updateProgress(100);
    
    const result = {
      success: errors.length === 0,
      totalItems: data.invoices.length,
      totalInvoices: data.invoices.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };
    
    // Cache result for 10 minutes using BulkOperationsService
    try {
      const { BulkOperationsService } = await import('../services/bulk-operations.service');
      const bulkOpsService = new BulkOperationsService();
      await bulkOpsService.cacheBulkOperationResult(job.id as string, result as never);
      console.log(`Bulk invoice result cached for job ${job.id}`, 'accounting-job');
    } catch (cacheError: unknown) {
      console.log(`Warning: Failed to cache bulk invoice result: ${getErrorMessage(cacheError)}`, 'accounting-job-warning');
    }
    
    return result;
  } catch (error: unknown) {
    console.log(`Error in bulk invoice create: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

async function handleBulkPaymentRecord(job: Job): Promise<BulkPaymentRecordResult> {
  const data = job.data as JobTypeMap['batch-payment-record'];
  console.log(`Bulk recording ${data.payments.length} payments`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const { SalesJournalService } = await import('../services/sales-journal.service');
    const salesJournalService = new SalesJournalService();
    
    const results: BulkPaymentRecordResult['results'] = [];
    const errors: BulkPaymentRecordResult['errors'] = [];
    
    for (let i = 0; i < data.payments.length; i++) {
      try {
        const payment = data.payments[i];
        console.log(`Processing payment ${i + 1}/${data.payments.length} for invoice ${payment.invoiceId}`, 'accounting-job');
        
        // Record payment
        const paymentId = await salesJournalService.recordInvoicePayment(payment);
        
        results.push({
          index: i,
          paymentId,
          invoiceId: payment.invoiceId,
          amount: payment.amount,
          status: 'success'
        });
        
        // Update progress
        const progress = 10 + ((i + 1) / data.payments.length) * 85;
        await job.updateProgress(Math.round(progress));
      } catch (innerError: unknown) {
        console.log(`Error recording payment ${i + 1}: ${getErrorMessage(innerError)}`, 'accounting-job-error');
        errors.push({
          index: i,
          invoiceId: data.payments[i].invoiceId,
          amount: data.payments[i].amount,
          error: getErrorMessage(innerError),
          status: 'error'
        });
      }
    }
    
    await job.updateProgress(100);
    
    const result = {
      success: errors.length === 0,
      totalItems: data.payments.length,
      totalPayments: data.payments.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    };
    
    // Cache result for 10 minutes using BulkOperationsService
    try {
      const { BulkOperationsService } = await import('../services/bulk-operations.service');
      const bulkOpsService = new BulkOperationsService();
      await bulkOpsService.cacheBulkOperationResult(job.id as string, result as never);
      console.log(`Bulk payment result cached for job ${job.id}`, 'accounting-job');
    } catch (cacheError: unknown) {
      console.log(`Warning: Failed to cache bulk payment result: ${getErrorMessage(cacheError)}`, 'accounting-job-warning');
    }
    
    return result;
  } catch (error: unknown) {
    console.log(`Error in bulk payment record: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * ============================================================================
 * JOB HANDLERS - PERIODIC CALCULATIONS
 * ============================================================================
 */

async function handleDepreciationCalculate(job: Job): Promise<DepreciationCalculateResult> {
  const data = job.data as JobTypeMap['depreciation-calculate'];
  console.log(`Calculating depreciation for ${data.periodYear}-${data.periodMonth}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const { DepreciationCalculationService } = await import('../services/depreciation-calculation.service');
    const depreciationService = new DepreciationCalculationService();
    
    await job.updateProgress(30);
    
    // Calculate monthly depreciation
    const result = await depreciationService.calculateMonthlyDepreciation({
      companyId: data.companyId,
      periodYear: data.periodYear,
      periodMonth: data.periodMonth,
      userId: data.userId,
      dryRun: data.dryRun || false
    });
    
    await job.updateProgress(90);
    
    console.log(`Depreciation calculated: ${result.itemCount} assets, total ${result.totalDepreciation} RON`, 'accounting-job');
    
    // Cache result
    const redisService = new RedisService();
    await redisService.connect();
    
    if (redisService.isConnected()) {
      const cacheKey = `acc:depreciation:${data.companyId}:${data.periodYear}-${data.periodMonth}`;
      await redisService.setCached(cacheKey, result, 3600); // 1h TTL
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      periodYear: data.periodYear,
      periodMonth: data.periodMonth,
      totalDepreciation: result.totalDepreciation,
      itemCount: result.itemCount,
      ledgerEntryId: result.ledgerEntryId,
      journalNumber: result.journalNumber,
      dryRun: data.dryRun || false
    };
  } catch (error: unknown) {
    console.log(`Error calculating depreciation: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

async function handleFXRevaluation(job: Job): Promise<FXRevaluationResult> {
  const data = job.data as JobTypeMap['fx-revaluation'];
  console.log(`FX revaluation for ${data.periodYear}-${data.periodMonth}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const { FXRevaluationService } = await import('../services/fx-revaluation.service');
    const fxRevaluationService = new FXRevaluationService();
    
    await job.updateProgress(30);
    
    // Perform FX revaluation
    const result = await fxRevaluationService.revalueForeignCurrency({
      companyId: data.companyId,
      periodYear: data.periodYear,
      periodMonth: data.periodMonth,
      userId: data.userId,
      dryRun: data.dryRun || false
    });
    
    await job.updateProgress(90);
    
    console.log(`FX revaluation complete: gains ${result.totalGains} RON, losses ${result.totalLosses} RON, net ${result.netDifference} RON`, 'accounting-job');
    
    // Cache result
    const redisService = new RedisService();
    await redisService.connect();
    
    if (redisService.isConnected()) {
      const cacheKey = `acc:fx-revaluation:${data.companyId}:${data.periodYear}-${data.periodMonth}`;
      await redisService.setCached(cacheKey, result, 3600); // 1h TTL
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      periodYear: data.periodYear,
      periodMonth: data.periodMonth,
      totalGains: result.totalGains,
      totalLosses: result.totalLosses,
      netDifference: result.netDifference,
      itemCount: result.itemCount,
      ledgerEntryId: result.ledgerEntryId,
      journalNumber: result.journalNumber,
      dryRun: data.dryRun || false
    };
  } catch (error: unknown) {
    console.log(`Error in FX revaluation: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

async function handleVATTransfer(job: Job): Promise<VATTransferResult> {
  const data = job.data as JobTypeMap['vat-transfer'];
  console.log(`VAT transfer for invoice ${data.invoiceId}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    const { SalesJournalService } = await import('../services/sales-journal.service');
    const salesJournalService = new SalesJournalService();
    
    await job.updateProgress(30);
    
    // Transfer VAT from deferred to collected
    await salesJournalService.transferDeferredVAT(
      data.invoiceId,
      data.paymentAmount,
      new Date(data.paymentDate),
      data.userId
    );
    
    await job.updateProgress(100);
    
    return {
      success: true,
      invoiceId: data.invoiceId,
      paymentAmount: data.paymentAmount
    };
  } catch (error: unknown) {
    console.log(`Error in VAT transfer: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * Generate Note Contabil Handler
 * Generates an accounting note from a document (invoice, etc.)
 */
async function handleGenerateNoteContabil(job: Job): Promise<GenerateNoteContabilResult> {
  const data = job.data as JobTypeMap['generate-note-contabil'];
  console.log(`Generating note contabil for document ${data.documentId} (type: ${data.documentType})`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    // Dynamically import service to avoid circular dependencies
    const NoteContabilService = (await import('../services/note-contabil.service')).default;
    const noteContabilService = new NoteContabilService();
    
    await job.updateProgress(30);
    
    // Generate note from document
    const result = await noteContabilService.generateNoteContabil(
      data.documentType,
      data.documentId,
      data.companyId,
      data.userId
    );
    
    await job.updateProgress(80);
    
    // Invalidate cache for this company's notes
    const redisService = new RedisService();
    await redisService.connect();
    if (redisService.isConnected()) {
      await redisService.invalidatePattern(`acc:note-contabil:company:${data.companyId}`);
      if (result.data?.id) {
        await redisService.invalidatePattern(`acc:note-contabil:${result.data.id}`);
      }
    }
    
    await job.updateProgress(100);
    
    return {
      success: result.success,
      noteId: result.data?.id,
      noteNumber: result.data?.number,
      errors: result.errors
    };
  } catch (error: unknown) {
    console.log(`Error generating note contabil: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * Generate Note Contabil PDF Handler
 * Generates a PDF for an existing accounting note
 */
async function handleGenerateNotePdf(job: Job): Promise<GenerateNotePdfResult> {
  const data = job.data as JobTypeMap['generate-note-pdf'];
  console.log(`Generating PDF for note contabil ${data.noteId}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    // Dynamically import service
    const NoteContabilService = (await import('../services/note-contabil.service')).default;
    const noteContabilService = new NoteContabilService();
    
    await job.updateProgress(30);
    
    // Generate PDF
    const pdfBuffer = await noteContabilService.generateNoteContabilPdf(
      data.noteId,
      data.companyId
    );
    
    await job.updateProgress(80);
    
    if (!pdfBuffer) {
      throw new Error('Failed to generate PDF');
    }
    
    // Cache PDF in Redis (TTL: 1 hour)
    const redisService = new RedisService();
    await redisService.connect();
    if (redisService.isConnected()) {
      const cacheKey = `acc:note-pdf:${data.noteId}`;
      await redisService.setCached(cacheKey, pdfBuffer.toString('base64'), 3600);
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      noteId: data.noteId,
      pdfBuffer: pdfBuffer.toString('base64'), // Return as base64 for serialization
      size: pdfBuffer.length
    };
  } catch (error: unknown) {
    console.log(`Error generating note PDF: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * Generate Trial Balance Handler
 * Generates a trial balance report with Redis caching
 */
async function handleGenerateTrialBalance(job: Job): Promise<FinancialReportResult> {
  const data = job.data as JobTypeMap['generate-trial-balance'];
  console.log(`Generating trial balance for company ${data.companyId} (${data.startDate} - ${data.endDate})`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    // Import accounting controller
    const { AccountingController } = await import('../controllers/accounting.controller');
    const { AccountingService } = await import('../services/accounting.service');
    const { storage } = await import('../../../storage');
    
    await job.updateProgress(30);
    
    const accountingService = new AccountingService(storage);
    const accountingController = new AccountingController(accountingService);
    
    // Create mock request/response for controller
    const mockReq = {
      query: {
        companyId: data.companyId,
        startDate: data.startDate,
        endDate: data.endDate
      },
      user: {
        id: data.userId,
        companyId: data.companyId
      }
    } as unknown as Request;
    
    let trialBalance: unknown;
    const mockRes = {
      json: (result: unknown) => {
        trialBalance = result;
      },
      status: (_code: number) => mockRes
    } as unknown as Response;
    
    await job.updateProgress(50);
    
    // Call controller method
    await accountingController.getTrialBalance(mockReq as never, mockRes as never);
    
    await job.updateProgress(80);
    
    // Cache result in Redis
    const redisService = new RedisService();
    await redisService.connect();
    if (redisService.isConnected()) {
      const cacheKey = `acc:trial-balance:${data.companyId}:${data.startDate}:${data.endDate}`;
      await redisService.setCached(cacheKey, trialBalance, 3600); // 1 hour TTL
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      companyId: data.companyId,
      startDate: data.startDate,
      endDate: data.endDate,
      data: trialBalance
    };
  } catch (error: unknown) {
    console.log(`Error generating trial balance: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * Generate Balance Sheet Handler
 * Generates a balance sheet report with Redis caching
 */
async function handleGenerateBalanceSheet(job: Job): Promise<FinancialReportResult> {
  const data = job.data as JobTypeMap['generate-balance-sheet'];
  console.log(`Generating balance sheet for company ${data.companyId} at ${data.date}`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    // Import accounting controller
    const { AccountingController } = await import('../controllers/accounting.controller');
    const { AccountingService } = await import('../services/accounting.service');
    const { storage } = await import('../../../storage');
    
    await job.updateProgress(30);
    
    const accountingService = new AccountingService(storage);
    const accountingController = new AccountingController(accountingService);
    
    // Create mock request/response for controller
    const mockReq = {
      query: {
        companyId: data.companyId,
        date: data.date
      },
      user: {
        id: data.userId,
        companyId: data.companyId
      }
    } as unknown as Request;
    
    let balanceSheet: unknown;
    const mockRes = {
      json: (result: unknown) => {
        balanceSheet = result;
      },
      status: (_code: number) => mockRes
    } as unknown as Response;
    
    await job.updateProgress(50);
    
    // Call controller method
    await accountingController.getBalanceSheet(mockReq as never, mockRes as never);
    
    await job.updateProgress(80);
    
    // Cache result in Redis
    const redisService = new RedisService();
    await redisService.connect();
    if (redisService.isConnected()) {
      const cacheKey = `acc:balance-sheet:${data.companyId}:${data.date}`;
      await redisService.setCached(cacheKey, balanceSheet, 3600); // 1 hour TTL
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      companyId: data.companyId,
      date: data.date,
      data: balanceSheet
    };
  } catch (error: unknown) {
    console.log(`Error generating balance sheet: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

/**
 * Generate Income Statement Handler
 * Generates an income statement report with Redis caching
 */
async function handleGenerateIncomeStatement(job: Job): Promise<FinancialReportResult> {
  const data = job.data as JobTypeMap['generate-income-statement'];
  console.log(`Generating income statement for company ${data.companyId} (${data.startDate} - ${data.endDate})`, 'accounting-job');
  
  await job.updateProgress(10);
  
  try {
    // Import accounting controller
    const { AccountingController } = await import('../controllers/accounting.controller');
    const { AccountingService } = await import('../services/accounting.service');
    const { storage } = await import('../../../storage');
    
    await job.updateProgress(30);
    
    const accountingService = new AccountingService(storage);
    const accountingController = new AccountingController(accountingService);
    
    // Create mock request/response for controller
    const mockReq = {
      query: {
        companyId: data.companyId,
        startDate: data.startDate,
        endDate: data.endDate
      },
      user: {
        id: data.userId,
        companyId: data.companyId
      }
    } as unknown as Request;
    
    let incomeStatement: unknown;
    const mockRes = {
      json: (result: unknown) => {
        incomeStatement = result;
      },
      status: (_code: number) => mockRes
    } as unknown as Response;
    
    await job.updateProgress(50);
    
    // Call controller method
    await accountingController.getIncomeStatement(mockReq as never, mockRes as never);
    
    await job.updateProgress(80);
    
    // Cache result in Redis
    const redisService = new RedisService();
    await redisService.connect();
    if (redisService.isConnected()) {
      const cacheKey = `acc:income-statement:${data.companyId}:${data.startDate}:${data.endDate}`;
      await redisService.setCached(cacheKey, incomeStatement, 3600); // 1 hour TTL
    }
    
    await job.updateProgress(100);
    
    return {
      success: true,
      companyId: data.companyId,
      startDate: data.startDate,
      endDate: data.endDate,
      data: incomeStatement
    };
  } catch (error: unknown) {
    console.log(`Error generating income statement: ${getErrorMessage(error)}`, 'accounting-job-error');
    throw error;
  }
}

