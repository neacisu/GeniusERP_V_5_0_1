/**
 * Fiscal Closure Service - Orchestrator Principal
 * 
 * Coordonează procesul complet de închidere fiscală lunară și anuală
 * conform OMFP 1802/2014 și Legii Contabilității nr. 82/1991
 * 
 * ENHANCED WITH:
 * - BullMQ async processing for long-running closures
 * - Progress tracking via job status
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { AccountingPeriodsService, PeriodStatus } from './accounting-periods.service';
import { DepreciationCalculationService } from './depreciation-calculation.service';
import { FXRevaluationService } from './fx-revaluation.service';
import { VATClosureService } from './vat-closure.service';
import { YearEndClosureService, ProfitTaxAdjustments, ProfitDistribution } from './year-end-closure.service';
import { AuditLogService } from './audit-log.service';
import { accountingQueueService } from './accounting-queue.service';
import { log } from '../../../vite';

export interface MonthEndClosureRequest {
  companyId: string;
  year: number;
  month: number;
  userId: string;
  skipDepreciation?: boolean;
  skipFXRevaluation?: boolean;
  skipVAT?: boolean;
  dryRun?: boolean;
}

export interface MonthEndClosureResult {
  success: boolean;
  periodId?: string;
  steps: {
    depreciation?: any;
    fxRevaluation?: any;
    vatClosure?: any;
  };
  errors: string[];
  warnings: string[];
}

export interface YearEndClosureRequest {
  companyId: string;
  fiscalYear: number;
  userId: string;
  taxAdjustments?: ProfitTaxAdjustments;
  profitDistribution?: ProfitDistribution;
  dryRun?: boolean;
}

export interface YearEndClosureFullResult {
  success: boolean;
  yearEndResult: any;
  errors: string[];
  warnings: string[];
}

/**
 * Orchestrator principal pentru închideri fiscale
 */
export class FiscalClosureService extends DrizzleService {
  private periodsService: AccountingPeriodsService;
  private depreciationService: DepreciationCalculationService;
  private fxService: FXRevaluationService;
  private vatService: VATClosureService;
  private yearEndService: YearEndClosureService;
  private auditService: AuditLogService;

  constructor() {
    super();
    this.periodsService = new AccountingPeriodsService();
    this.depreciationService = new DepreciationCalculationService();
    this.fxService = new FXRevaluationService();
    this.vatService = new VATClosureService();
    this.yearEndService = new YearEndClosureService();
    this.auditService = new AuditLogService();
  }

  /**
   * ÎNCHIDERE DE LUNĂ - Procedură completă
   * 
   * Pași conform OMFP 1802/2014:
   * 1. Validări preliminare
   * 2. Calcul și postare amortizare lunară
   * 3. Reevaluare solduri în valută
   * 4. Închidere TVA (colectată/deductibilă → de plată/recuperat)
   * 5. Blocare perioadă (soft-close)
   */
  async closeMonth(request: MonthEndClosureRequest): Promise<MonthEndClosureResult> {
    const { companyId, year, month, userId, dryRun = false } = request;
    const errors: string[] = [];
    const warnings: string[] = [];
    const steps: any = {};

    try {
      console.log(`\n🔄 Începe închiderea lunii ${month}/${year} pentru compania ${companyId}`);

      // ============================================================
      // PAS 0: VALIDĂRI PRELIMINARE
      // ============================================================
      console.log('\n📋 PAS 0: Validări preliminare...');

      // Verifică dacă perioada există
      const period = await this.periodsService.getPeriodByDate(
        companyId,
        new Date(year, month - 1, 15) // Mijlocul lunii
      );

      if (!period) {
        // Creează perioada automat dacă nu există
        console.log(`⚠️ Perioadă ${month}/${year} nu există. Se creează automat...`);
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const newPeriod = await this.periodsService.createPeriod({
          companyId,
          year,
          month,
          startDate,
          endDate,
          status: 'open'
        });

        console.log(`✅ Perioadă creată: ${newPeriod.id}`);
      } else if (period.status === 'hard_close') {
        errors.push(`Perioada ${month}/${year} este hard-closed și nu poate fi modificată.`);
        return { success: false, errors, warnings, steps };
      }

      // Verifică că lunile anterioare sunt închise
      if (month > 1) {
        const previousMonth = month - 1;
        const prevPeriod = await this.periodsService.getPeriodByDate(
          companyId,
          new Date(year, previousMonth - 1, 15)
        );

        if (prevPeriod && prevPeriod.status === 'open') {
          warnings.push(
            `Perioada anterioară ${previousMonth}/${year} nu este închisă. ` +
            `Se recomandă închiderea secvențială.`
          );
        }
      }

      // ============================================================
      // PAS 1: CALCUL ȘI POSTARE AMORTIZARE
      // ============================================================
      if (!request.skipDepreciation) {
        console.log('\n💰 PAS 1: Calcul amortizare lunară...');

        try {
          // Verifică dacă amortizarea a fost deja postată
          const alreadyPosted = await this.depreciationService.isDepreciationPosted(
            companyId,
            year,
            month
          );

          if (alreadyPosted) {
            warnings.push(`Amortizarea pentru ${month}/${year} a fost deja postată.`);
            console.log('⚠️ Amortizare deja postată, se sare acest pas.');
          } else {
            const depResult = await this.depreciationService.calculateMonthlyDepreciation({
              companyId,
              periodYear: year,
              periodMonth: month,
              userId,
              dryRun
            });

            steps.depreciation = depResult;

            if (depResult.itemCount === 0) {
              console.log('ℹ️ Nu există imobilizări de amortizat.');
            } else {
              console.log(
                `✅ Amortizare calculată: ${depResult.itemCount} active, ` +
                `total ${depResult.totalDepreciation} RON`
              );
            }
          }
        } catch (error) {
          const errMsg = `Eroare la calculul amortizării: ${(error as Error).message}`;
          errors.push(errMsg);
          console.error('❌', errMsg);
        }
      }

      // ============================================================
      // PAS 2: REEVALUARE VALUTARĂ
      // ============================================================
      if (!request.skipFXRevaluation) {
        console.log('\n💱 PAS 2: Reevaluare solduri în valută...');

        try {
          const alreadyPosted = await this.fxService.isRevaluationPosted(companyId, year, month);

          if (alreadyPosted) {
            warnings.push(`Reevaluarea valutară pentru ${month}/${year} a fost deja postată.`);
            console.log('⚠️ Reevaluare deja postată, se sare acest pas.');
          } else {
            const fxResult = await this.fxService.revalueForeignCurrency({
              companyId,
              periodYear: year,
              periodMonth: month,
              userId,
              dryRun
            });

            steps.fxRevaluation = fxResult;

            if (fxResult.itemCount === 0) {
              console.log('ℹ️ Nu există solduri în valută de reevaluat.');
            } else {
              console.log(
                `✅ Reevaluare valutară: ${fxResult.itemCount} conturi, ` +
                `câștiguri ${fxResult.totalGains} RON, pierderi ${fxResult.totalLosses} RON`
              );
            }
          }
        } catch (error) {
          const errMsg = `Eroare la reevaluarea valutară: ${(error as Error).message}`;
          errors.push(errMsg);
          console.error('❌', errMsg);
        }
      }

      // ============================================================
      // PAS 3: ÎNCHIDERE TVA
      // ============================================================
      if (!request.skipVAT) {
        console.log('\n📊 PAS 3: Închidere TVA...');

        try {
          const alreadyClosed = await this.vatService.isVATClosed(companyId, year, month);

          if (alreadyClosed) {
            warnings.push(`TVA pentru ${month}/${year} a fost deja închis.`);
            console.log('⚠️ TVA deja închis, se sare acest pas.');
          } else {
            const vatResult = await this.vatService.closeVATPeriod({
              companyId,
              periodYear: year,
              periodMonth: month,
              userId,
              dryRun
            });

            steps.vatClosure = vatResult;

            console.log(
              `✅ TVA închis: colectat ${vatResult.vatCollected} RON, ` +
              `deductibil ${vatResult.vatDeductible} RON, ` +
              `${vatResult.isPayable ? 'de plată' : 'de recuperat'} ${vatResult.vatBalance} RON`
            );
          }
        } catch (error) {
          const errMsg = `Eroare la închiderea TVA: ${(error as Error).message}`;
          errors.push(errMsg);
          console.error('❌', errMsg);
        }
      }

      // ============================================================
      // PAS 4: BLOCARE PERIOADĂ (SOFT-CLOSE)
      // ============================================================
      if (!dryRun && period && errors.length === 0) {
        console.log('\n🔒 PAS 4: Blocare perioadă (soft-close)...');

        try {
          await this.periodsService.updatePeriodStatus(
            companyId,
            period.id,
            {
              status: 'soft_close',
              closedBy: userId,
              reason: `Închidere automată lună ${month}/${year}`
            }
          );

          console.log(`✅ Perioada ${month}/${year} blocată (soft-close).`);
        } catch (error) {
          const errMsg = `Eroare la blocarea perioadei: ${(error as Error).message}`;
          warnings.push(errMsg);
          console.warn('⚠️', errMsg);
        }
      }

      // ============================================================
      // FINALIZARE
      // ============================================================
      const success = errors.length === 0;

      console.log('\n' + '='.repeat(60));
      if (success) {
        console.log(`✅ ÎNCHIDERE LUNĂ ${month}/${year} FINALIZATĂ CU SUCCES!`);
      } else {
        console.log(`❌ ÎNCHIDERE LUNĂ ${month}/${year} FINALIZATĂ CU ERORI!`);
      }
      console.log('='.repeat(60) + '\n');

      return {
        success,
        periodId: period?.id,
        steps,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Eroare generală: ${(error as Error).message}`);
      console.error('❌ Eroare critică:', error);

      return {
        success: false,
        errors,
        warnings,
        steps
      };
    }
  }

  /**
   * ÎNCHIDERE DE AN - Procedură completă
   * 
   * Pași conform OMFP 1802/2014:
   * 1. Verificare că toate lunile sunt închise
   * 2. Închidere P&L (clase 6 și 7 → 121)
   * 3. Calcul și înregistrare impozit profit
   * 4. Repartizare profit conform hotărâre AGA
   * 5. Blocare perioadă an fiscal (hard-close)
   */
  async closeYear(request: YearEndClosureRequest): Promise<YearEndClosureFullResult> {
    const { companyId, fiscalYear, userId, taxAdjustments, profitDistribution, dryRun = false } = request;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log(`\n🔄 Începe închiderea anului fiscal ${fiscalYear} pentru compania ${companyId}`);

      // ============================================================
      // PAS 0: VALIDĂRI PRELIMINARE
      // ============================================================
      console.log('\n📋 PAS 0: Validări preliminare...');

      // Verifică că luna 12 este închisă (soft-close)
      const december = await this.periodsService.getPeriodByDate(
        companyId,
        new Date(fiscalYear, 11, 15)
      );

      if (!december) {
        errors.push(`Luna decembrie ${fiscalYear} nu există. Creați perioada mai întâi.`);
        return { success: false, yearEndResult: null, errors, warnings };
      }

      if (december.status === 'open') {
        errors.push(
          `Luna decembrie ${fiscalYear} nu este închisă. ` +
          `Închideți luna decembrie înainte de închiderea anuală.`
        );
        return { success: false, yearEndResult: null, errors, warnings };
      }

      // Verifică dacă anul a fost deja închis
      const alreadyClosed = await this.yearEndService.isYearClosed(companyId, fiscalYear);

      if (alreadyClosed) {
        errors.push(`Anul fiscal ${fiscalYear} a fost deja închis.`);
        return { success: false, yearEndResult: null, errors, warnings };
      }

      // ============================================================
      // PAS 1-4: EXECUTARE ÎNCHIDERE AN
      // ============================================================
      console.log(`\n💼 Execută închiderea fiscală pentru anul ${fiscalYear}...`);

      const yearEndResult = await this.yearEndService.closeFiscalYear(
        {
          companyId,
          fiscalYear,
          userId,
          dryRun
        },
        taxAdjustments,
        profitDistribution
      );

      console.log('\n📊 Rezultat închidere an:');
      console.log(`   - Venituri totale: ${yearEndResult.totalRevenue} RON`);
      console.log(`   - Cheltuieli totale: ${yearEndResult.totalExpenses} RON`);
      console.log(`   - Profit contabil: ${yearEndResult.accountingProfit} RON`);
      console.log(`   - Profit impozabil: ${yearEndResult.taxableProfit} RON`);
      console.log(`   - Impozit profit: ${yearEndResult.profitTaxAmount} RON`);
      console.log(`   - Profit net: ${yearEndResult.netProfit} RON`);

      // ============================================================
      // PAS 5: BLOCARE PERIOADĂ (HARD-CLOSE)
      // ============================================================
      if (!dryRun && errors.length === 0) {
        console.log('\n🔒 PAS 5: Blocare an fiscal (hard-close)...');

        // Marchează toate lunile anului ca hard-close
        for (let month = 1; month <= 12; month++) {
          const period = await this.periodsService.getPeriodByDate(
            companyId,
            new Date(fiscalYear, month - 1, 15)
          );

          if (period) {
            await this.periodsService.updatePeriodStatus(
              companyId,
              period.id,
              {
                status: 'hard_close',
                closedBy: userId,
                reason: `Închidere finală an fiscal ${fiscalYear}`
              }
            );
          }
        }

        console.log(`✅ Toate lunile anului ${fiscalYear} marcate ca hard-close.`);
      }

      // ============================================================
      // FINALIZARE
      // ============================================================
      const success = errors.length === 0;

      console.log('\n' + '='.repeat(60));
      if (success) {
        console.log(`✅ ÎNCHIDERE AN FISCAL ${fiscalYear} FINALIZATĂ CU SUCCES!`);
      } else {
        console.log(`❌ ÎNCHIDERE AN FISCAL ${fiscalYear} FINALIZATĂ CU ERORI!`);
      }
      console.log('='.repeat(60) + '\n');

      return {
        success,
        yearEndResult,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Eroare generală: ${(error as Error).message}`);
      console.error('❌ Eroare critică:', error);

      return {
        success: false,
        yearEndResult: null,
        errors,
        warnings
      };
    }
  }

  /**
   * Redeschide o perioadă închisă (doar admin)
   */
  async reopenPeriod(
    companyId: string,
    periodId: string,
    userId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.periodsService.updatePeriodStatus(
        companyId,
        periodId,
        {
          status: 'open',
          closedBy: userId,
          reason
        }
      );

      await this.auditService.log({
        companyId,
        userId,
        action: 'PERIOD_REOPENED' as any,
        severity: 'CRITICAL' as any,
        entityType: 'fiscal_periods',
        entityId: periodId,
        description: `Perioadă redeschisă: ${reason}`,
        metadata: { periodId, reason }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
  
  /**
   * ============================================================================
   * BULLMQ ASYNC OPERATIONS
   * ============================================================================
   */
  
  /**
   * Queue month-end closure as async job
   * Returns job ID for tracking
   */
  async closeMonthAsync(request: MonthEndClosureRequest): Promise<{ jobId: string; message: string }> {
    try {
      log(`Queueing async month-end closure for ${request.year}-${request.month}`, 'fiscal-closure-async');
      
      const job = await accountingQueueService.queueMonthClose({
        companyId: request.companyId,
        year: request.year,
        month: request.month,
        userId: request.userId,
        skipDepreciation: request.skipDepreciation,
        skipFXRevaluation: request.skipFXRevaluation,
        skipVAT: request.skipVAT,
        dryRun: request.dryRun
      });
      
      return {
        jobId: job.id!,
        message: `Month-end closure queued. Job ID: ${job.id}`
      };
    } catch (error: any) {
      log(`Error queueing month-end closure: ${error.message}`, 'fiscal-closure-error');
      throw error;
    }
  }
  
  /**
   * Queue year-end closure as async job
   * Returns job ID for tracking
   */
  async closeYearAsync(request: YearEndClosureRequest): Promise<{ jobId: string; message: string }> {
    try {
      log(`Queueing async year-end closure for fiscal year ${request.fiscalYear}`, 'fiscal-closure-async');
      
      const job = await accountingQueueService.queueYearClose({
        companyId: request.companyId,
        fiscalYear: request.fiscalYear,
        userId: request.userId,
        dryRun: request.dryRun
      });
      
      return {
        jobId: job.id!,
        message: `Year-end closure queued. Job ID: ${job.id}`
      };
    } catch (error: any) {
      log(`Error queueing year-end closure: ${error.message}`, 'fiscal-closure-error');
      throw error;
    }
  }
}

export default FiscalClosureService;

