/**
 * Foreign Exchange Revaluation Service
 * 
 * Motor automat pentru reevaluarea sold

urilor în valută conform OMFP 1802/2014
 * Calculează diferențe de curs la cursul BNR pentru sfârșitul perioadei
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { getDrizzle } from "@common/drizzle";
import { JournalService, LedgerEntryType } from './journal.service';
import { AuditLogService } from './audit-log.service';
import { eq, and, sql, ne, isNull } from 'drizzle-orm';
import { RedisService } from '../../../services/redis.service';

export interface FXRevaluationRequest {
  companyId: string;
  periodYear: number;
  periodMonth: number;
  userId: string;
  currency?: string; // Specific currency or all
  dryRun?: boolean;
}

export interface FXRevaluationItem {
  accountId: string;
  accountName: string;
  currency: string;
  foreignAmount: number;
  previousRateRON: number; // Valoare în RON la cursul anterior
  currentRate: number; // Cursul BNR curent
  currentRateRON: number; // Valoare în RON la cursul curent
  difference: number; // Diferența în RON
  isGain: boolean; // true = câștig (765), false = pierdere (665)
}

export interface FXRevaluationResult {
  totalGains: number;
  totalLosses: number;
  netDifference: number;
  itemCount: number;
  items: FXRevaluationItem[];
  ledgerEntryId?: string;
  journalNumber?: string;
  dryRun: boolean;
}

interface BNRExchangeRate {
  currency: string;
  rate: number;
  date: Date;
}

/**
 * Serviciu reevaluare valutară automată
 */
export class FXRevaluationService extends DrizzleService {
  private journalService: JournalService;
  private auditService: AuditLogService;
  private redisService: RedisService;

  // Conturi conform OMFP 1802/2014
  private readonly FX_GAIN_ACCOUNT = '765'; // Venituri din diferențe de curs valutar
  private readonly FX_LOSS_ACCOUNT = '665'; // Cheltuieli din diferențe de curs valutar

  constructor() {
    super();
    this.journalService = new JournalService();
    this.auditService = new AuditLogService();
    this.redisService = new RedisService();
  }

  /**
   * Ensure Redis connection
   */
  private async ensureRedisConnection(): Promise<void> {
    if (!this.redisService.isConnected()) {
      await this.redisService.connect();
    }
  }

  /**
   * Execută reevaluarea valutară pentru sfârșitul perioadei
   */
  async revalueForeignCurrency(
    request: FXRevaluationRequest
  ): Promise<FXRevaluationResult> {
    const { companyId, periodYear, periodMonth, userId, currency, dryRun = false } = request;

    // Calculează ultima zi a perioadei
    const periodEndDate = new Date(periodYear, periodMonth, 0); // Ultima zi a lunii

    // Obține cursurile BNR pentru sfârșitul perioadei
    const exchangeRates = await this.getBNRExchangeRates(periodEndDate, currency);

    if (exchangeRates.length === 0) {
      console.warn('⚠️ Nu există cursuri BNR pentru data:', periodEndDate);
      return {
        totalGains: 0,
        totalLosses: 0,
        netDifference: 0,
        itemCount: 0,
        items: [],
        dryRun
      };
    }

    // Obține soldurile în valută pentru toate conturile relevante
    const foreignBalances = await this.getForeignCurrencyBalances(
      companyId,
      periodEndDate,
      currency
    );

    if (foreignBalances.length === 0) {
      return {
        totalGains: 0,
        totalLosses: 0,
        netDifference: 0,
        itemCount: 0,
        items: [],
        dryRun
      };
    }

    // Calculează reevaluarea pentru fiecare sold
    const revaluationItems: FXRevaluationItem[] = [];
    let totalGains = 0;
    let totalLosses = 0;

    for (const balance of foreignBalances) {
      const rate = exchangeRates.find(r => r.currency === balance.currency);
      if (!rate) {
        console.warn(`⚠️ Curs BNR lipsă pentru ${balance.currency}`);
        continue;
      }

      const currentRateRON = balance.foreignAmount * rate.rate;
      const difference = currentRateRON - balance.previousRateRON;

      // Doar dacă există diferență semnificativă (> 0.01 RON)
      if (Math.abs(difference) > 0.01) {
        const isGain = difference > 0;

        revaluationItems.push({
          accountId: balance.accountId,
          accountName: balance.accountName,
          currency: balance.currency,
          foreignAmount: balance.foreignAmount,
          previousRateRON: balance.previousRateRON,
          currentRate: rate.rate,
          currentRateRON,
          difference: Math.abs(difference),
          isGain
        });

        if (isGain) {
          totalGains += Math.abs(difference);
        } else {
          totalLosses += Math.abs(difference);
        }
      }
    }

    const netDifference = totalGains - totalLosses;

    // Dacă nu e dry-run și există diferențe, postează înregistrarea
    let ledgerEntryId: string | undefined;
    let journalNumber: string | undefined;

    if (!dryRun && revaluationItems.length > 0) {
      const entry = await this.postRevaluationEntry(
        companyId,
        periodYear,
        periodMonth,
        revaluationItems,
        totalGains,
        totalLosses,
        userId
      );

      ledgerEntryId = entry.id;
      journalNumber = entry.journalNumber;

      // Log audit
      await this.auditService.log({
        companyId,
        userId,
        action: 'FX_REVALUATION_POSTED' as any,
        severity: 'INFO' as any,
        entityType: 'ledger_entry',
        entityId: ledgerEntryId!, // Guaranteed to be set at line 171 within same if block
        description: `Reevaluare valutară postată: ${periodMonth}/${periodYear}`,
        metadata: {
          period: `${periodYear}-${periodMonth}`,
          totalGains,
          totalLosses,
          netDifference,
          accountCount: revaluationItems.length
        }
      });
    }

    return {
      totalGains,
      totalLosses,
      netDifference,
      itemCount: revaluationItems.length,
      items: revaluationItems,
      ledgerEntryId,
      journalNumber,
      dryRun
    };
  }

  /**
   * Obține cursurile BNR pentru o dată specifică
   */
  private async getBNRExchangeRates(
    date: Date,
    specificCurrency?: string
  ): Promise<BNRExchangeRate[]> {
    await this.ensureRedisConnection();
    
    // Create cache key based on date and currency
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = specificCurrency 
      ? `acc:fx:bnr-rates:${dateStr}:${specificCurrency}`
      : `acc:fx:bnr-rates:${dateStr}:all`;
    
    // Check cache first (TTL: 24h - rates update daily)
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<BNRExchangeRate[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // TODO: Implementare API BNR real
    // Pentru moment, returnez cursuri hardcoded pentru testare
    
    const mockRates: BNRExchangeRate[] = [
      { currency: 'EUR', rate: 4.9758, date },
      { currency: 'USD', rate: 4.5123, date },
      { currency: 'GBP', rate: 5.7234, date }
    ];

    let rates: BNRExchangeRate[];
    if (specificCurrency) {
      rates = mockRates.filter(r => r.currency === specificCurrency);
    } else {
      rates = mockRates;
    }
    
    // Cache for 24 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, rates, 86400);
    }

    return rates;

    /* IMPLEMENTARE REALĂ - DE ACTIVAT CÂND API BNR ESTE DISPONIBIL:
    
    const db = getDrizzle();
    
    try {
      // Verifică dacă există cursuri stocate pentru data respectivă
      const storedRates = await db.$client.unsafe(`
        SELECT currency, rate, rate_date as date
        FROM exchange_rates
        WHERE rate_date = $1
        ${specificCurrency ? 'AND currency = $2' : ''}
        ORDER BY currency
      `, specificCurrency ? [date, specificCurrency] : [date]);

      if (storedRates && storedRates.length > 0) {
        return storedRates;
      }

      // Dacă nu există, fetch de la BNR și stochează
      const bnrRates = await this.fetchBNRRates(date);
      
      // Stochează în DB pentru cache
      for (const rate of bnrRates) {
        await db.$client.unsafe(`
          INSERT INTO exchange_rates (currency, rate, rate_date, source)
          VALUES ($1, $2, $3, 'BNR')
          ON CONFLICT (currency, rate_date) DO UPDATE
          SET rate = EXCLUDED.rate, updated_at = NOW()
        `, [rate.currency, rate.rate, date]);
      }

      return bnrRates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return [];
    }
    */
  }

  /**
   * Obține soldurile în valută pentru toate conturile relevante
   * Enhanced cu Redis caching (TTL: 5 minute)
   */
  private async getForeignCurrencyBalances(
    companyId: string,
    asOfDate: Date,
    specificCurrency?: string
  ): Promise<any[]> {
    await this.ensureRedisConnection();
    
    // Create cache key
    const dateStr = asOfDate.toISOString().split('T')[0];
    const cacheKey = specificCurrency
      ? `acc:fx:balances:${companyId}:${dateStr}:${specificCurrency}`
      : `acc:fx:balances:${companyId}:${dateStr}:all`;
    
    // Check cache first (TTL: 5 minutes)
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<any[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const db = getDrizzle();

    // Conturi care pot avea solduri în valută:
    // 512x - Conturi bancare în valută
    // 401 - Furnizori (cu facturi în valută)
    // 411 - Clienți (cu facturi în valută)

    try {
      // Query pentru solduri bancare în valută
      const bankBalances = await db.$client.unsafe(`
        SELECT 
          ba.id as account_id,
          '512' || SUBSTRING(ba.iban, 1, 1) as account_code,
          'Cont bancar ' || ba.bank_name as account_name,
          ba.currency,
          COALESCE(ba.balance, 0) as foreign_amount,
          COALESCE(ba.balance_ron, 0) as previous_rate_ron
        FROM bank_accounts ba
        WHERE ba.company_id = $1
        AND ba.currency != 'RON'
        ${specificCurrency ? 'AND ba.currency = $2' : ''}
        AND COALESCE(ba.balance, 0) != 0
      `, specificCurrency ? [companyId, specificCurrency] : [companyId]);

      // Query pentru facturile clienți în valută neîncasate
      const customerBalances = await db.$client.unsafe(`
        SELECT 
          '4111' as account_code,
          '4111' as account_id,
          'Clienți - ' || i.currency as account_name,
          i.currency,
          SUM(i.amount) as foreign_amount,
          SUM(i.amount * COALESCE(i.exchange_rate, 1)) as previous_rate_ron
        FROM invoices i
        WHERE i.company_id = $1
        AND i.currency != 'RON'
        ${specificCurrency ? 'AND i.currency = $2' : ''}
        AND i.status != 'paid'
        AND i.type = 'customer_invoice'
        AND i.date <= $${specificCurrency ? '3' : '2'}
        GROUP BY i.currency
        HAVING SUM(i.amount) != 0
      `, specificCurrency 
        ? [companyId, specificCurrency, asOfDate]
        : [companyId, asOfDate]);

      // Combinăm rezultatele
      const balances = [...(bankBalances || []), ...(customerBalances || [])];
      
      // Cache for 5 minutes
      if (this.redisService.isConnected()) {
        await this.redisService.setCached(cacheKey, balances, 300);
      }
      
      return balances;
    } catch (error) {
      console.error('Error fetching foreign currency balances:', error);
      return [];
    }
  }

  /**
   * Postează înregistrarea contabilă pentru reevaluare
   */
  private async postRevaluationEntry(
    companyId: string,
    year: number,
    month: number,
    items: FXRevaluationItem[],
    totalGains: number,
    totalLosses: number,
    userId: string
  ): Promise<any> {
    const lines = [];

    // Grupează câștigurile și pierderile
    const gainsByAccount = new Map<string, number>();
    const lossesByAccount = new Map<string, number>();

    for (const item of items) {
      if (item.isGain) {
        // Debit cont activ/pasiv (crește valoarea)
        lines.push({
          accountId: item.accountId,
          debitAmount: item.difference,
          creditAmount: 0,
          description: `Câștig curs valutar ${item.currency} - ${month}/${year}`
        });

        // Acumulează pentru cont venituri
        gainsByAccount.set(
          this.FX_GAIN_ACCOUNT,
          (gainsByAccount.get(this.FX_GAIN_ACCOUNT) || 0) + item.difference
        );
      } else {
        // Credit cont activ/pasiv (scade valoarea)
        lines.push({
          accountId: item.accountId,
          debitAmount: 0,
          creditAmount: item.difference,
          description: `Pierdere curs valutar ${item.currency} - ${month}/${year}`
        });

        // Acumulează pentru cont cheltuieli
        lossesByAccount.set(
          this.FX_LOSS_ACCOUNT,
          (lossesByAccount.get(this.FX_LOSS_ACCOUNT) || 0) + item.difference
        );
      }
    }

    // Adaugă linia pentru venituri (765)
    if (totalGains > 0) {
      lines.push({
        accountId: this.FX_GAIN_ACCOUNT,
        debitAmount: 0,
        creditAmount: totalGains,
        description: `Venituri diferențe curs ${month}/${year}`
      });
    }

    // Adaugă linia pentru cheltuieli (665)
    if (totalLosses > 0) {
      lines.push({
        accountId: this.FX_LOSS_ACCOUNT,
        debitAmount: totalLosses,
        creditAmount: 0,
        description: `Cheltuieli diferențe curs ${month}/${year}`
      });
    }

    const netAmount = Math.abs(totalGains - totalLosses);

    // Postează înregistrarea
    const entry = await this.journalService.createLedgerEntry({
      companyId,
      type: LedgerEntryType.GENERAL,
      referenceNumber: `REEVAL-${year}-${String(month).padStart(2, '0')}`,
      amount: netAmount,
      description: `Reevaluare valutară ${month}/${year} - ${items.length} conturi`,
      userId,
      lines
    });

    return entry;
  }

  /**
   * Verifică dacă reevaluarea a fost deja postată pentru o perioadă
   */
  async isRevaluationPosted(
    companyId: string,
    year: number,
    month: number
  ): Promise<boolean> {
    const db = getDrizzle();

    const referenceNumber = `REEVAL-${year}-${String(month).padStart(2, '0')}`;

    const result = await db.$client.unsafe(`
      SELECT id FROM ledger_entries
      WHERE company_id = $1
      AND reference_number = $2
      LIMIT 1
    `, [companyId, referenceNumber]);

    return result && result.length > 0;
  }
}

export default FXRevaluationService;

