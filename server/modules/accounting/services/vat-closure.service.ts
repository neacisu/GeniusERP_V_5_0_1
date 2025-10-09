/**
 * VAT Closure Service
 * 
 * Serviciu pentru închiderea automată a TVA-ului lunar/trimestrial
 * Conform Codul Fiscal (Legea 227/2015) și Procedură ANAF
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { getDrizzle } from '../../../common/drizzle';
import { JournalService, LedgerEntryType } from './journal.service';
import { AuditLogService } from './audit-log.service';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface VATClosureRequest {
  companyId: string;
  periodYear: number;
  periodMonth: number;
  userId: string;
  dryRun?: boolean;
}

export interface VATClosureResult {
  vatCollected: number; // 4427 - TVA colectată
  vatDeductible: number; // 4426 - TVA deductibilă
  vatNonDeductible: number; // 635 - TVA nedeductibilă
  vatBalance: number; // Sold net (pozitiv = de plată, negativ = de recuperat)
  isPayable: boolean; // true = de plată (4423), false = de recuperat (4424)
  ledgerEntryId?: string;
  journalNumber?: string;
  dryRun: boolean;
}

/**
 * Serviciu închidere TVA automată
 */
export class VATClosureService extends DrizzleService {
  private journalService: JournalService;
  private auditService: AuditLogService;

  // Conturi TVA conform planului de conturi românesc
  private readonly VAT_COLLECTED = '4427'; // TVA colectată
  private readonly VAT_DEDUCTIBLE = '4426'; // TVA deductibilă
  private readonly VAT_TO_PAY = '4423'; // TVA de plată
  private readonly VAT_TO_RECOVER = '4424'; // TVA de recuperat
  private readonly VAT_NON_DEDUCTIBLE = '635'; // Cheltuieli cu TVA nedeductibilă

  constructor() {
    super();
    this.journalService = new JournalService();
    this.auditService = new AuditLogService();
  }

  /**
   * Execută închiderea TVA pentru o perioadă
   */
  async closeVATPeriod(request: VATClosureRequest): Promise<VATClosureResult> {
    const { companyId, periodYear, periodMonth, userId, dryRun = false } = request;

    // Calculează intervalul perioadei
    const startDate = new Date(periodYear, periodMonth - 1, 1);
    const endDate = new Date(periodYear, periodMonth, 0); // Ultima zi a lunii

    // Obține soldurile TVA pentru perioadă
    const vatBalances = await this.getVATBalances(companyId, startDate, endDate);

    const {
      vatCollected,
      vatDeductible,
      vatNonDeductible
    } = vatBalances;

    // Calculează soldul net
    const vatBalance = vatCollected - vatDeductible;
    const isPayable = vatBalance > 0;

    // Dacă nu e dry-run, postează închiderea
    let ledgerEntryId: string | undefined;
    let journalNumber: string | undefined;

    if (!dryRun) {
      const entry = await this.postVATClosureEntry(
        companyId,
        periodYear,
        periodMonth,
        vatCollected,
        vatDeductible,
        vatNonDeductible,
        vatBalance,
        isPayable,
        userId
      );

      ledgerEntryId = entry.id;
      journalNumber = entry.journalNumber;

      // Log audit
      await this.auditService.log({
        companyId,
        userId,
        action: 'VAT_CLOSED' as any,
        severity: 'INFO' as any,
        entityType: 'ledger_entry',
        entityId: ledgerEntryId,
        description: `TVA închis: ${periodMonth}/${periodYear}`,
        metadata: {
          period: `${periodYear}-${periodMonth}`,
          vatCollected,
          vatDeductible,
          vatBalance,
          isPayable
        }
      });
    }

    return {
      vatCollected,
      vatDeductible,
      vatNonDeductible,
      vatBalance: Math.abs(vatBalance),
      isPayable,
      ledgerEntryId,
      journalNumber,
      dryRun
    };
  }

  /**
   * Obține soldurile TVA pentru o perioadă
   */
  private async getVATBalances(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    vatCollected: number;
    vatDeductible: number;
    vatNonDeductible: number;
  }> {
    const db = getDrizzle();

    try {
      // Query pentru TVA colectată (4427) - CREDIT în perioada
      const collectedResult = await db.$client.unsafe(`
        SELECT COALESCE(SUM(ll.credit_amount), 0) as total
        FROM ledger_lines ll
        JOIN ledger_entries le ON ll.ledger_entry_id = le.id
        WHERE le.company_id = $1
        AND ll.account_id LIKE '4427%'
        AND le.entry_date >= $2
        AND le.entry_date <= $3
      `, [companyId, startDate, endDate]);

      const vatCollected = Number(collectedResult[0]?.total || 0);

      // Query pentru TVA deductibilă (4426) - DEBIT în perioada
      const deductibleResult = await db.$client.unsafe(`
        SELECT COALESCE(SUM(ll.debit_amount), 0) as total
        FROM ledger_lines ll
        JOIN ledger_entries le ON ll.ledger_entry_id = le.id
        WHERE le.company_id = $1
        AND ll.account_id LIKE '4426%'
        AND le.entry_date >= $2
        AND le.entry_date <= $3
      `, [companyId, startDate, endDate]);

      const vatDeductible = Number(deductibleResult[0]?.total || 0);

      // Query pentru TVA nedeductibilă (635) - pentru informare
      const nonDeductibleResult = await db.$client.unsafe(`
        SELECT COALESCE(SUM(ll.debit_amount), 0) as total
        FROM ledger_lines ll
        JOIN ledger_entries le ON ll.ledger_entry_id = le.id
        WHERE le.company_id = $1
        AND ll.account_id LIKE '635%'
        AND le.entry_date >= $2
        AND le.entry_date <= $3
      `, [companyId, startDate, endDate]);

      const vatNonDeductible = Number(nonDeductibleResult[0]?.total || 0);

      return {
        vatCollected,
        vatDeductible,
        vatNonDeductible
      };
    } catch (error) {
      console.error('Error fetching VAT balances:', error);
      return {
        vatCollected: 0,
        vatDeductible: 0,
        vatNonDeductible: 0
      };
    }
  }

  /**
   * Postează înregistrarea contabilă pentru închiderea TVA
   */
  private async postVATClosureEntry(
    companyId: string,
    year: number,
    month: number,
    vatCollected: number,
    vatDeductible: number,
    vatNonDeductible: number,
    vatBalance: number,
    isPayable: boolean,
    userId: string
  ): Promise<any> {
    const lines = [];

    // PAS 1: Închide TVA colectată (4427)
    if (vatCollected > 0) {
      lines.push({
        accountId: this.VAT_COLLECTED,
        debitAmount: vatCollected,
        creditAmount: 0,
        description: `Închidere TVA colectată ${month}/${year}`
      });
    }

    // PAS 2: Închide TVA deductibilă (4426)
    if (vatDeductible > 0) {
      lines.push({
        accountId: this.VAT_DEDUCTIBLE,
        debitAmount: 0,
        creditAmount: vatDeductible,
        description: `Închidere TVA deductibilă ${month}/${year}`
      });
    }

    // PAS 3: Înregistrează soldul în cont de TVA de plată sau recuperat
    const absBalance = Math.abs(vatBalance);

    if (absBalance > 0.01) { // Ignoră diferențe sub 1 ban
      if (isPayable) {
        // TVA de plată (4423) - sold creditor
        lines.push({
          accountId: this.VAT_TO_PAY,
          debitAmount: 0,
          creditAmount: absBalance,
          description: `TVA de plată ${month}/${year}`
        });
      } else {
        // TVA de recuperat (4424) - sold debitor
        lines.push({
          accountId: this.VAT_TO_RECOVER,
          debitAmount: absBalance,
          creditAmount: 0,
          description: `TVA de recuperat ${month}/${year}`
        });
      }
    }

    // Verificare echilibru
    const totalDebit = lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.creditAmount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.02) {
      throw new Error(
        `Eroare echilibru TVA: Debit=${totalDebit}, Credit=${totalCredit}, Diferență=${totalDebit - totalCredit}`
      );
    }

    // Postează înregistrarea
    const entry = await this.journalService.createLedgerEntry({
      companyId,
      type: LedgerEntryType.GENERAL,
      referenceNumber: `VAT-CLOSE-${year}-${String(month).padStart(2, '0')}`,
      amount: Math.max(vatCollected, vatDeductible),
      description: `Închidere TVA ${month}/${year}`,
      userId,
      lines
    });

    return entry;
  }

  /**
   * Verifică dacă TVA-ul a fost deja închis pentru o perioadă
   */
  async isVATClosed(
    companyId: string,
    year: number,
    month: number
  ): Promise<boolean> {
    const db = getDrizzle();

    const referenceNumber = `VAT-CLOSE-${year}-${String(month).padStart(2, '0')}`;

    const result = await db.$client.unsafe(`
      SELECT id FROM ledger_entries
      WHERE company_id = $1
      AND reference_number = $2
      LIMIT 1
    `, [companyId, referenceNumber]);

    return result && result.length > 0;
  }

  /**
   * Calculează TVA-ul pentru raportul D300
   */
  async calculateD300Report(
    companyId: string,
    year: number,
    month: number
  ): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const balances = await this.getVATBalances(companyId, startDate, endDate);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      vatCollected: balances.vatCollected,
      vatDeductible: balances.vatDeductible,
      vatBalance: balances.vatCollected - balances.vatDeductible,
      isPayable: (balances.vatCollected - balances.vatDeductible) > 0,
      // Câmpuri pentru D300
      box20: balances.vatCollected, // TVA colectată
      box40: balances.vatDeductible, // TVA deductibilă
      box60: Math.max(0, balances.vatCollected - balances.vatDeductible), // TVA de plată
      box70: Math.max(0, balances.vatDeductible - balances.vatCollected) // TVA de recuperat
    };
  }
}

export default VATClosureService;

