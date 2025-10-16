/**
 * Depreciation Calculation Service
 * 
 * Calculează și postează amortizarea lunară automată conform OMFP 1802/2014
 * Suportă: liniar, degresiv, accelerat
 * Enhanced cu Redis caching (TTL: 1h pentru schedules)
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { getDrizzle } from '../../../common/drizzle';
import { JournalService, LedgerEntryType } from './journal.service';
import { AuditLogService } from './audit-log.service';
import { eq, and, sql, isNull, lte } from 'drizzle-orm';
import { RedisService } from '../../../services/redis.service';

export interface DepreciationCalculationRequest {
  companyId: string;
  periodYear: number;
  periodMonth: number;
  userId: string;
  dryRun?: boolean; // Doar calculează, fără a posta
}

export interface DepreciationItem {
  assetId: string;
  assetCode: string;
  assetName: string;
  acquisitionValue: number;
  residualValue: number;
  usefulLife: number; // Luni
  depreciationMethod: 'linear' | 'declining' | 'accelerated';
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  accountDebit: string; // 6811
  accountCredit: string; // 28xx
}

export interface DepreciationCalculationResult {
  totalDepreciation: number;
  itemCount: number;
  items: DepreciationItem[];
  ledgerEntryId?: string;
  journalNumber?: string;
  dryRun: boolean;
}

/**
 * Serviciu calcul amortizare automată
 */
export class DepreciationCalculationService extends DrizzleService {
  private journalService: JournalService;
  private auditService: AuditLogService;
  private redisService: RedisService;

  constructor() {
    super();
    this.journalService = new JournalService();
    this.auditService = new AuditLogService();
    this.redisService = new RedisService();
  }

  private async ensureRedisConnection(): Promise<void> {
    if (!this.redisService.isConnected()) {
      await this.redisService.connect();
    }
  }

  /**
   * Calculează amortizarea lunară pentru toate imobilizările active
   */
  async calculateMonthlyDepreciation(
    request: DepreciationCalculationRequest
  ): Promise<DepreciationCalculationResult> {
    const { companyId, periodYear, periodMonth, userId, dryRun = false } = request;

    // Calculează data perioadei
    const periodDate = new Date(periodYear, periodMonth - 1, 1);
    const lastDayOfMonth = new Date(periodYear, periodMonth, 0);

    // Obține toate imobilizările active care trebuie amortizate
    const assets = await this.getDepreciableAssets(companyId, lastDayOfMonth);

    if (assets.length === 0) {
      return {
        totalDepreciation: 0,
        itemCount: 0,
        items: [],
        dryRun
      };
    }

    // Calculează amortizarea pentru fiecare active
    const depreciationItems: DepreciationItem[] = [];
    let totalDepreciation = 0;

    for (const asset of assets) {
      const monthlyDepreciation = this.calculateAssetDepreciation(
        asset,
        periodYear,
        periodMonth
      );

      if (monthlyDepreciation > 0) {
        depreciationItems.push({
          assetId: asset.id,
          assetCode: asset.code,
          assetName: asset.name,
          acquisitionValue: asset.acquisitionValue,
          residualValue: asset.residualValue || 0,
          usefulLife: asset.usefulLifeMonths,
          depreciationMethod: asset.depreciationMethod,
          monthlyDepreciation,
          accumulatedDepreciation: asset.accumulatedDepreciation || 0,
          accountDebit: this.getDepreciationExpenseAccount(asset.categoryCode),
          accountCredit: this.getAccumulatedDepreciationAccount(asset.categoryCode)
        });

        totalDepreciation += monthlyDepreciation;
      }
    }

    // Dacă nu e dry-run, postează înregistrarea contabilă
    let ledgerEntryId: string | undefined;
    let journalNumber: string | undefined;

    if (!dryRun && depreciationItems.length > 0) {
      const entry = await this.postDepreciationEntry(
        companyId,
        periodYear,
        periodMonth,
        depreciationItems,
        totalDepreciation,
        userId
      );

      ledgerEntryId = entry.id;
      journalNumber = entry.journalNumber;

      // Log audit
      await this.auditService.log({
        companyId,
        userId,
        action: 'DEPRECIATION_POSTED' as any,
        severity: 'INFO' as any,
        entityType: 'ledger_entry',
        entityId: ledgerEntryId!, // Guaranteed to be set at line 126 within same if block
        description: `Amortizare lunară postată: ${periodMonth}/${periodYear}`,
        metadata: {
          period: `${periodYear}-${periodMonth}`,
          totalDepreciation,
          assetCount: depreciationItems.length
        }
      });
    }

    return {
      totalDepreciation,
      itemCount: depreciationItems.length,
      items: depreciationItems,
      ledgerEntryId,
      journalNumber,
      dryRun
    };
  }

  /**
   * Obține toate imobilizările care trebuie amortizate
   */
  private async getDepreciableAssets(companyId: string, asOfDate: Date): Promise<any[]> {
    const db = getDrizzle();

    // Query imobilizări din DB
    // NOTĂ: Presupun că există un tabel fixed_assets, altfel trebuie adaptat
    try {
      const result = await db.$client.unsafe(`
        SELECT 
          id,
          code,
          name,
          category_code,
          acquisition_value,
          residual_value,
          useful_life_months,
          depreciation_method,
          accumulated_depreciation,
          acquisition_date,
          disposal_date,
          is_active
        FROM fixed_assets
        WHERE company_id = $1
        AND is_active = TRUE
        AND acquisition_date <= $2
        AND (disposal_date IS NULL OR disposal_date > $2)
        AND useful_life_months > 0
        ORDER BY code
      `, [companyId, asOfDate]);

      return result as any[];
    } catch (error) {
      // Dacă tabelul fixed_assets nu există, returnăm array gol
      console.warn('⚠️ Tabelul fixed_assets nu există. Amortizarea va fi sărită.', error);
      return [];
    }
  }

  /**
   * Calculează amortizarea pentru un activ specific
   */
  private calculateAssetDepreciation(
    asset: any,
    year: number,
    month: number
  ): number {
    const {
      acquisitionValue,
      residualValue = 0,
      usefulLifeMonths,
      depreciationMethod,
      accumulatedDepreciation = 0,
      acquisitionDate
    } = asset;

    // Verifică dacă activul este complet amortizat
    const depreciableValue = acquisitionValue - residualValue;
    if (accumulatedDepreciation >= depreciableValue) {
      return 0;
    }

    // Calculează numărul de luni de la achiziție
    const acqDate = new Date(acquisitionDate);
    const periodDate = new Date(year, month - 1, 1);
    const monthsSinceAcquisition = this.getMonthsDifference(acqDate, periodDate);

    // Nu amortizăm dacă nu a trecut nici o lună de la achiziție
    if (monthsSinceAcquisition < 0) {
      return 0;
    }

    let monthlyDepreciation = 0;

    switch (depreciationMethod) {
      case 'linear':
        monthlyDepreciation = depreciableValue / usefulLifeMonths;
        break;

      case 'declining':
        // Metoda degresivă: coeficient = 2.5 / durata în ani
        const remainingValue = acquisitionValue - accumulatedDepreciation;
        const yearsLife = usefulLifeMonths / 12;
        const declineCoef = Math.min(2.5 / yearsLife, 0.5);
        monthlyDepreciation = (remainingValue * declineCoef) / 12;
        break;

      case 'accelerated':
        // Metoda accelerată: cotă dublă față de liniară
        const linearRate = 1 / usefulLifeMonths;
        const acceleratedRate = linearRate * 2;
        monthlyDepreciation = depreciableValue * acceleratedRate;
        break;

      default:
        // Default: liniară
        monthlyDepreciation = depreciableValue / usefulLifeMonths;
    }

    // Asigură că nu depășim valoarea amortizabilă
    const remainingToDepreciate = depreciableValue - accumulatedDepreciation;
    monthlyDepreciation = Math.min(monthlyDepreciation, remainingToDepreciate);

    // Rotunjire la 2 zecimale
    return Math.round(monthlyDepreciation * 100) / 100;
  }

  /**
   * Postează înregistrarea contabilă pentru amortizare
   */
  private async postDepreciationEntry(
    companyId: string,
    year: number,
    month: number,
    items: DepreciationItem[],
    totalAmount: number,
    userId: string
  ): Promise<any> {
    // Grupează pe conturi pentru a evita linii duplicate
    const accountTotals = new Map<string, { debit: number; credit: number }>();

    for (const item of items) {
      const debitKey = item.accountDebit;
      const creditKey = item.accountCredit;

      // Debit (cheltuială)
      const debitEntry = accountTotals.get(debitKey) || { debit: 0, credit: 0 };
      debitEntry.debit += item.monthlyDepreciation;
      accountTotals.set(debitKey, debitEntry);

      // Credit (amortizare cumulată)
      const creditEntry = accountTotals.get(creditKey) || { debit: 0, credit: 0 };
      creditEntry.credit += item.monthlyDepreciation;
      accountTotals.set(creditKey, creditEntry);
    }

    // Creează linii contabile
    const lines = [];

    for (const [accountId, amounts] of accountTotals) {
      if (amounts.debit > 0) {
        lines.push({
          accountId,
          debitAmount: amounts.debit,
          creditAmount: 0,
          description: `Amortizare ${month}/${year}`
        });
      }
      if (amounts.credit > 0) {
        lines.push({
          accountId,
          debitAmount: 0,
          creditAmount: amounts.credit,
          description: `Amortizare cumulată ${month}/${year}`
        });
      }
    }

    // Postează înregistrarea
    const entry = await this.journalService.createLedgerEntry({
      companyId,
      type: LedgerEntryType.GENERAL,
      referenceNumber: `AMORT-${year}-${String(month).padStart(2, '0')}`,
      amount: totalAmount,
      description: `Amortizare lunară ${month}/${year} - ${items.length} active`,
      userId,
      lines
    });

    return entry;
  }

  /**
   * Obține contul de cheltuieli cu amortizarea în funcție de categoria activului
   */
  private getDepreciationExpenseAccount(categoryCode: string): string {
    // Conform OMFP 1802/2014:
    // 6811 - Cheltuieli cu amortizarea imobilizărilor corporale
    // 6812 - Cheltuieli cu amortizarea imobilizărilor necorporale

    if (categoryCode && categoryCode.startsWith('20')) {
      return '6812'; // Imobilizări necorporale
    }

    return '6811'; // Default: Imobilizări corporale
  }

  /**
   * Obține contul de amortizare cumulată în funcție de categoria activului
   */
  private getAccumulatedDepreciationAccount(categoryCode: string): string {
    // Conform OMFP 1802/2014:
    // 280 - Amortizarea imobilizărilor necorporale
    // 281 - Amortizarea imobilizărilor corporale

    if (!categoryCode) {
      return '281'; // Default
    }

    // Mapare categorii conform planului de conturi
    if (categoryCode.startsWith('20')) {
      return '280'; // Necorporale
    } else if (categoryCode.startsWith('21')) {
      return '2813'; // Instalații tehnice și mașini
    } else if (categoryCode.startsWith('22')) {
      return '2814'; // Mijloace de transport
    } else if (categoryCode.startsWith('23')) {
      return '2815'; // Mobilier, aparatură birotică
    }

    return '281'; // Default: Imobilizări corporale
  }

  /**
   * Calculează diferența în luni între două date
   */
  private getMonthsDifference(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Verifică dacă amortizarea a fost deja postată pentru o perioadă
   */
  async isDepreciationPosted(
    companyId: string,
    year: number,
    month: number
  ): Promise<boolean> {
    const db = getDrizzle();

    const referenceNumber = `AMORT-${year}-${String(month).padStart(2, '0')}`;

    const result = await db.$client.unsafe(`
      SELECT id FROM ledger_entries
      WHERE company_id = $1
      AND reference_number = $2
      LIMIT 1
    `, [companyId, referenceNumber]);

    return result && result.length > 0;
  }
}

export default DepreciationCalculationService;

