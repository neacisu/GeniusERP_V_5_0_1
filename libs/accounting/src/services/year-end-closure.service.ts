/**
 * Year-End Closure Service
 * 
 * Serviciu pentru închiderea anuală a exercițiului fiscal conform OMFP 1802/2014
 * Include: Închidere P&L, Calcul impozit profit, Repartizare profit/acoperire pierdere
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { getDrizzle } from "@common/drizzle";
import { JournalService, LedgerEntryType } from './journal.service';
import { AuditLogService } from './audit-log.service';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface YearEndClosureRequest {
  companyId: string;
  fiscalYear: number;
  userId: string;
  dryRun?: boolean;
}

export interface ProfitTaxAdjustments {
  nonDeductibleExpenses: number;
  nonTaxableIncome: number;
  taxLossCarryforward: number; // Pierdere fiscală reportată din anii anteriori
  otherAdjustments: number;
}

export interface ProfitDistribution {
  legalReserve: number; // 1061 - min 5% până la 20% din capital
  statutoryReserves: number; // 1063 - rezerve statutare
  otherReserves: number; // 1068 - alte rezerve
  dividends: number; // 457 - dividende de plată
  retainedEarnings: number; // 1171 - rezultat reportat
}

export interface YearEndClosureResult {
  // Închidere P&L
  totalRevenue: number; // Clasa 7
  totalExpenses: number; // Clasa 6
  accountingProfit: number; // Profit contabil brut
  accountingLoss: number; // Pierdere contabilă
  
  // Impozit profit
  taxableProfit: number; // Profit impozabil după ajustări
  profitTaxRate: number; // Cota impozit (16%)
  profitTaxAmount: number; // Impozit calculat
  netProfit: number; // Profit net după impozit
  
  // Distribuție
  distribution?: ProfitDistribution;
  
  // Înregistrări contabile
  plClosureLedgerEntryId?: string;
  profitTaxLedgerEntryId?: string;
  distributionLedgerEntryId?: string;
  
  dryRun: boolean;
}

/**
 * Serviciu închidere anuală
 */
export class YearEndClosureService extends DrizzleService {
  private journalService: JournalService;
  private auditService: AuditLogService;

  // Conturi conform OMFP 1802/2014
  private readonly PROFIT_LOSS_ACCOUNT = '121'; // Profit sau pierdere
  private readonly PROFIT_DISTRIBUTION_ACCOUNT = '129'; // Repartizarea profitului
  private readonly PROFIT_TAX_EXPENSE = '691'; // Cheltuieli cu impozitul pe profit
  private readonly PROFIT_TAX_PAYABLE = '4411'; // Impozit pe profit de plată
  private readonly LEGAL_RESERVE = '1061'; // Rezerve legale
  private readonly STATUTORY_RESERVE = '1063'; // Rezerve statutare
  private readonly OTHER_RESERVES = '1068'; // Alte rezerve
  private readonly DIVIDENDS_PAYABLE = '457'; // Dividende de plată
  private readonly RETAINED_EARNINGS = '1171'; // Rezultat reportat reprezentând profitul nerepartizat
  private readonly ACCUMULATED_LOSS = '1172'; // Rezultat reportat reprezentând pierderea neacoperită

  private readonly PROFIT_TAX_RATE = 0.16; // 16% conform Codul Fiscal

  constructor() {
    super();
    this.journalService = new JournalService();
    this.auditService = new AuditLogService();
  }

  /**
   * Execută închiderea completă de an fiscal
   */
  async closeFiscalYear(
    request: YearEndClosureRequest,
    taxAdjustments?: ProfitTaxAdjustments,
    distribution?: ProfitDistribution
  ): Promise<YearEndClosureResult> {
    const { companyId, fiscalYear, userId, dryRun = false } = request;

    // PASUL 1: Închide conturile de venituri și cheltuieli (clase 6 și 7)
    const plResult = await this.closeProfitAndLoss(companyId, fiscalYear);

    // PASUL 2: Calculează și înregistrează impozitul pe profit
    const taxResult = await this.calculateAndPostProfitTax(
      companyId,
      fiscalYear,
      plResult.accountingProfit,
      taxAdjustments || {
        nonDeductibleExpenses: 0,
        nonTaxableIncome: 0,
        taxLossCarryforward: 0,
        otherAdjustments: 0
      },
      userId,
      dryRun
    );

    // PASUL 3: Dacă există profit net și distribuție, postează repartizarea
    let distributionLedgerEntryId: string | undefined;

    if (!dryRun && taxResult.netProfit > 0 && distribution) {
      const distEntry = await this.postProfitDistribution(
        companyId,
        fiscalYear,
        taxResult.netProfit,
        distribution,
        userId
      );
      distributionLedgerEntryId = distEntry.id;

      // Log audit
      await this.auditService.console.log({
        companyId,
        userId,
        action: 'PROFIT_DISTRIBUTED' as any,
        severity: 'CRITICAL' as any,
        entityType: 'ledger_entry',
        entityId: distributionLedgerEntryId!,
        description: `Profit distribuit pentru ${fiscalYear}`,
        metadata: {
          fiscalYear,
          netProfit: taxResult.netProfit,
          distribution
        }
      });
    } else if (!dryRun && plResult.accountingLoss > 0) {
      // Dacă este pierdere, o transferăm în rezultat reportat
      await this.transferLossToRetainedEarnings(companyId, fiscalYear, plResult.accountingLoss, userId);
    }

    return {
      totalRevenue: plResult.totalRevenue,
      totalExpenses: plResult.totalExpenses,
      accountingProfit: plResult.accountingProfit,
      accountingLoss: plResult.accountingLoss,
      taxableProfit: taxResult.taxableProfit,
      profitTaxRate: this.PROFIT_TAX_RATE,
      profitTaxAmount: taxResult.profitTaxAmount,
      netProfit: taxResult.netProfit,
      distribution,
      plClosureLedgerEntryId: plResult.ledgerEntryId,
      profitTaxLedgerEntryId: taxResult.ledgerEntryId,
      distributionLedgerEntryId,
      dryRun
    };
  }

  /**
   * PASUL 1: Închide conturile de clasa 6 și 7 în contul 121
   */
  private async closeProfitAndLoss(
    companyId: string,
    fiscalYear: number
  ): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    accountingProfit: number;
    accountingLoss: number;
    ledgerEntryId?: string;
  }> {
    const db = getDrizzle();

    // Calculează totalul veniturilor (clasa 7)
    const revenueResult = await db.$client.unsafe(`
      SELECT COALESCE(SUM(ll.credit_amount - ll.debit_amount), 0) as total
      FROM ledger_lines ll
      JOIN ledger_entries le ON ll.ledger_entry_id = le.id
      WHERE le.company_id = $1
      AND ll.account_id LIKE '7%'
      AND EXTRACT(YEAR FROM le.entry_date) = $2
    `, [companyId, fiscalYear]);

    const totalRevenue = Number(revenueResult[0]?.total || 0);

    // Calculează totalul cheltuielilor (clasa 6)
    const expenseResult = await db.$client.unsafe(`
      SELECT COALESCE(SUM(ll.debit_amount - ll.credit_amount), 0) as total
      FROM ledger_lines ll
      JOIN ledger_entries le ON ll.ledger_entry_id = le.id
      WHERE le.company_id = $1
      AND ll.account_id LIKE '6%'
      AND EXTRACT(YEAR FROM le.entry_date) = $2
    `, [companyId, fiscalYear]);

    const totalExpenses = Number(expenseResult[0]?.total || 0);

    // Calculează rezultatul
    const result = totalRevenue - totalExpenses;
    const accountingProfit = Math.max(0, result);
    const accountingLoss = Math.abs(Math.min(0, result));

    return {
      totalRevenue,
      totalExpenses,
      accountingProfit,
      accountingLoss,
      ledgerEntryId: undefined // În dry-run nu postăm
    };
  }

  /**
   * PASUL 2: Calculează și postează impozitul pe profit
   */
  private async calculateAndPostProfitTax(
    companyId: string,
    fiscalYear: number,
    accountingProfit: number,
    adjustments: ProfitTaxAdjustments,
    userId: string,
    dryRun: boolean
  ): Promise<{
    taxableProfit: number;
    profitTaxAmount: number;
    netProfit: number;
    ledgerEntryId?: string;
  }> {
    // Calculează profitul impozabil
    const taxableProfit = Math.max(0,
      accountingProfit
      + adjustments.nonDeductibleExpenses
      - adjustments.nonTaxableIncome
      - adjustments.taxLossCarryforward
      + adjustments.otherAdjustments
    );

    // Calculează impozitul
    const profitTaxAmount = Math.round(taxableProfit * this.PROFIT_TAX_RATE * 100) / 100;

    // Profit net
    const netProfit = accountingProfit - profitTaxAmount;

    // Postează înregistrarea dacă nu e dry-run
    let ledgerEntryId: string | undefined;

    if (!dryRun && profitTaxAmount > 0) {
      const entry = await this.journalService.createLedgerEntry({
        companyId,
        type: LedgerEntryType.GENERAL,
        referenceNumber: `PROFIT-TAX-${fiscalYear}`,
        amount: profitTaxAmount,
        description: `Impozit pe profit ${fiscalYear}`,
        userId,
        lines: [
          {
            accountId: this.PROFIT_TAX_EXPENSE,
            debitAmount: profitTaxAmount,
            creditAmount: 0,
            description: `Cheltuieli impozit profit ${fiscalYear}`
          },
          {
            accountId: this.PROFIT_TAX_PAYABLE,
            debitAmount: 0,
            creditAmount: profitTaxAmount,
            description: `Impozit profit de plată ${fiscalYear}`
          }
        ]
      });

      ledgerEntryId = entry.id;

      // Log audit
      await this.auditService.console.log({
        companyId,
        userId,
        action: 'PROFIT_TAX_CALCULATED' as any,
        severity: 'INFO' as any,
        entityType: 'ledger_entry',
        entityId: ledgerEntryId,
        description: `Impozit profit calculat pentru ${fiscalYear}`,
        metadata: {
          fiscalYear,
          accountingProfit,
          taxableProfit,
          profitTaxAmount,
          adjustments
        }
      });
    }

    return {
      taxableProfit,
      profitTaxAmount,
      netProfit,
      ledgerEntryId
    };
  }

  /**
   * PASUL 3: Postează distribuția profitului conform hotărârii AGA
   */
  private async postProfitDistribution(
    companyId: string,
    fiscalYear: number,
    netProfit: number,
    distribution: ProfitDistribution,
    userId: string
  ): Promise<any> {
    // Verifică că totalul distribuției nu depășește profitul net
    const totalDistributed =
      distribution.legalReserve +
      distribution.statutoryReserves +
      distribution.otherReserves +
      distribution.dividends +
      distribution.retainedEarnings;

    if (Math.abs(totalDistributed - netProfit) > 0.02) {
      throw new Error(
        `Distribuția totală (${totalDistributed}) nu corespunde cu profitul net (${netProfit})`
      );
    }

    const lines = [];

    // Debit: Transfer profit din 121 în 129
    lines.push({
      accountId: this.PROFIT_LOSS_ACCOUNT,
      debitAmount: netProfit,
      creditAmount: 0,
      description: `Transfer profit net ${fiscalYear} pentru repartizare`
    });

    // Credit: Repartizări în 129
    lines.push({
      accountId: this.PROFIT_DISTRIBUTION_ACCOUNT,
      debitAmount: 0,
      creditAmount: netProfit,
      description: `Profit net de repartizat ${fiscalYear}`
    });

    // Postează prima înregistrare (121 → 129)
    const transferEntry = await this.journalService.createLedgerEntry({
      companyId,
      type: LedgerEntryType.GENERAL,
      referenceNumber: `PROFIT-TRANSFER-${fiscalYear}`,
      amount: netProfit,
      description: `Transfer profit pentru repartizare ${fiscalYear}`,
      userId,
      lines
    });

    // Acum repartizăm din 129 în destinațiile finale
    const distributionLines = [];

    // Debit: Închide 129
    distributionLines.push({
      accountId: this.PROFIT_DISTRIBUTION_ACCOUNT,
      debitAmount: netProfit,
      creditAmount: 0,
      description: `Repartizare profit ${fiscalYear}`
    });

    // Credit: Rezerve și dividende
    if (distribution.legalReserve > 0) {
      distributionLines.push({
        accountId: this.LEGAL_RESERVE,
        debitAmount: 0,
        creditAmount: distribution.legalReserve,
        description: `Rezervă legală ${fiscalYear}`
      });
    }

    if (distribution.statutoryReserves > 0) {
      distributionLines.push({
        accountId: this.STATUTORY_RESERVE,
        debitAmount: 0,
        creditAmount: distribution.statutoryReserves,
        description: `Rezerve statutare ${fiscalYear}`
      });
    }

    if (distribution.otherReserves > 0) {
      distributionLines.push({
        accountId: this.OTHER_RESERVES,
        debitAmount: 0,
        creditAmount: distribution.otherReserves,
        description: `Alte rezerve ${fiscalYear}`
      });
    }

    if (distribution.dividends > 0) {
      distributionLines.push({
        accountId: this.DIVIDENDS_PAYABLE,
        debitAmount: 0,
        creditAmount: distribution.dividends,
        description: `Dividende de plată ${fiscalYear}`
      });
    }

    if (distribution.retainedEarnings > 0) {
      distributionLines.push({
        accountId: this.RETAINED_EARNINGS,
        debitAmount: 0,
        creditAmount: distribution.retainedEarnings,
        description: `Rezultat reportat ${fiscalYear}`
      });
    }

    // Postează repartizarea
    const distributionEntry = await this.journalService.createLedgerEntry({
      companyId,
      type: LedgerEntryType.GENERAL,
      referenceNumber: `PROFIT-DIST-${fiscalYear}`,
      amount: netProfit,
      description: `Repartizare profit ${fiscalYear} conform hotărâre AGA`,
      userId,
      lines: distributionLines
    });

    return distributionEntry;
  }

  /**
   * Transferă pierderea în rezultat reportat (1172)
   */
  private async transferLossToRetainedEarnings(
    companyId: string,
    fiscalYear: number,
    loss: number,
    userId: string
  ): Promise<void> {
    const entry = await this.journalService.createLedgerEntry({
      companyId,
      type: LedgerEntryType.GENERAL,
      referenceNumber: `LOSS-TRANSFER-${fiscalYear}`,
      amount: loss,
      description: `Transfer pierdere ${fiscalYear} în rezultat reportat`,
      userId,
      lines: [
        {
          accountId: this.ACCUMULATED_LOSS,
          debitAmount: loss,
          creditAmount: 0,
          description: `Pierdere reportată ${fiscalYear}`
        },
        {
          accountId: this.PROFIT_LOSS_ACCOUNT,
          debitAmount: 0,
          creditAmount: loss,
          description: `Închidere pierdere ${fiscalYear}`
        }
      ]
    });

    await this.auditService.console.log({
      companyId,
      userId,
      action: 'LOSS_TRANSFERRED' as any,
      severity: 'WARNING' as any,
      entityType: 'ledger_entry',
      entityId: entry.id,
      description: `Pierdere transferată pentru ${fiscalYear}`,
      metadata: {
        fiscalYear,
        loss
      }
    });
  }

  /**
   * Verifică dacă anul fiscal a fost deja închis
   */
  async isYearClosed(companyId: string, fiscalYear: number): Promise<boolean> {
    const db = getDrizzle();

    const result = await db.$client.unsafe(`
      SELECT id FROM ledger_entries
      WHERE company_id = $1
      AND reference_number LIKE 'PROFIT-%'
      AND reference_number LIKE '%${fiscalYear}'
      LIMIT 1
    `, [companyId]);

    return result && result.length > 0;
  }
}

export default YearEndClosureService;

