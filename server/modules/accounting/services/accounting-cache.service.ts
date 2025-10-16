/**
 * Accounting Cache Service
 * 
 * Wrapper peste RedisService specific pentru modulul de contabilitate.
 * Oferă cache management inteligent cu:
 * - Cache key generation strategy
 * - TTL management per tip de date
 * - Invalidation patterns
 * - Cache warming pentru date critice
 */

import { RedisService } from '../../../services/redis.service';

/**
 * Cache TTL constants (în secunde)
 */
export const CacheTTL = {
  // Reference data (long-lived)
  ACCOUNT_CLASSES: 24 * 3600,      // 24 ore - se schimbă rar
  ACCOUNT_GROUPS: 24 * 3600,       // 24 ore
  SYNTHETIC_ACCOUNTS: 12 * 3600,   // 12 ore
  ANALYTIC_ACCOUNTS: 12 * 3600,    // 12 ore
  
  // Company settings
  ACCOUNTING_SETTINGS: 6 * 3600,   // 6 ore - pot fi modificate
  FISCAL_SETTINGS: 6 * 3600,       // 6 ore
  
  // Transactional data (short-lived)
  ACCOUNT_BALANCE: 5 * 60,         // 5 minute - se modifică frecvent
  TRIAL_BALANCE: 30 * 60,          // 30 minute
  
  // Reports (medium-lived)
  SALES_JOURNAL: 30 * 60,          // 30 minute
  PURCHASE_JOURNAL: 30 * 60,       // 30 minute
  GENERAL_LEDGER: 30 * 60,         // 30 minute
  VAT_REPORT: 60 * 60,             // 1 oră
  
  // Heavy calculations (long cache)
  FISCAL_CLOSURE: 2 * 3600,        // 2 ore - proces greu
  DEPRECIATION: 2 * 3600,          // 2 ore
  
  // Temporary data (very short)
  JOB_RESULT: 10 * 60,             // 10 minute - rezultate temporare
  EXPORT_FILE: 15 * 60             // 15 minute - fișiere export
} as const;

/**
 * Cache key prefixes pentru organizare și invalidare
 */
export const CachePrefix = {
  ACCOUNT_CLASS: 'acc:class',
  ACCOUNT_GROUP: 'acc:group',
  SYNTHETIC_ACCOUNT: 'acc:synthetic',
  ANALYTIC_ACCOUNT: 'acc:analytic',
  ACCOUNT_BALANCE: 'acc:balance',
  TRIAL_BALANCE: 'acc:trial-balance',
  SETTINGS: 'acc:settings',
  SALES_JOURNAL: 'acc:sales-journal',
  PURCHASE_JOURNAL: 'acc:purchase-journal',
  GENERAL_LEDGER: 'acc:general-ledger',
  VAT_REPORT: 'acc:vat-report',
  FISCAL_CLOSURE: 'acc:fiscal-closure',
  JOB_RESULT: 'acc:job-result'
} as const;

/**
 * Interface pentru cache statistics
 */
export interface CacheStats {
  totalKeys: number;
  hitRate: number;
  missRate: number;
  memoryUsage?: number;
}

/**
 * Accounting Cache Service
 */
export class AccountingCacheService {
  private redis: RedisService;
  
  constructor() {
    this.redis = new RedisService();
  }
  
  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    await this.redis.connect();
  }
  
  /**
   * ============================================================================
   * CHART OF ACCOUNTS CACHING
   * ============================================================================
   */
  
  /**
   * Get cached account classes
   */
  async getAccountClasses(companyId?: string): Promise<any[] | null> {
    const key = companyId 
      ? `${CachePrefix.ACCOUNT_CLASS}:${companyId}` 
      : `${CachePrefix.ACCOUNT_CLASS}:all`;
    return await this.redis.getCached<any[]>(key);
  }
  
  /**
   * Cache account classes
   */
  async setAccountClasses(data: any[], companyId?: string): Promise<void> {
    const key = companyId 
      ? `${CachePrefix.ACCOUNT_CLASS}:${companyId}` 
      : `${CachePrefix.ACCOUNT_CLASS}:all`;
    await this.redis.setCached(key, data, CacheTTL.ACCOUNT_CLASSES);
  }
  
  /**
   * Invalidate account classes cache
   */
  async invalidateAccountClasses(companyId?: string): Promise<void> {
    const pattern = companyId 
      ? `${CachePrefix.ACCOUNT_CLASS}:${companyId}*` 
      : `${CachePrefix.ACCOUNT_CLASS}:*`;
    await this.redis.invalidatePattern(pattern);
  }
  
  /**
   * Get cached synthetic accounts
   */
  async getSyntheticAccounts(companyId: string): Promise<any[] | null> {
    const key = `${CachePrefix.SYNTHETIC_ACCOUNT}:${companyId}`;
    return await this.redis.getCached<any[]>(key);
  }
  
  /**
   * Cache synthetic accounts
   */
  async setSyntheticAccounts(companyId: string, data: any[]): Promise<void> {
    const key = `${CachePrefix.SYNTHETIC_ACCOUNT}:${companyId}`;
    await this.redis.setCached(key, data, CacheTTL.SYNTHETIC_ACCOUNTS);
  }
  
  /**
   * Invalidate synthetic accounts cache
   */
  async invalidateSyntheticAccounts(companyId: string): Promise<void> {
    const pattern = `${CachePrefix.SYNTHETIC_ACCOUNT}:${companyId}*`;
    await this.redis.invalidatePattern(pattern);
  }
  
  /**
   * ============================================================================
   * ACCOUNT BALANCES CACHING
   * ============================================================================
   */
  
  /**
   * Get cached account balance
   */
  async getAccountBalance(
    companyId: string, 
    accountId: string, 
    date?: Date
  ): Promise<number | null> {
    const dateStr = date ? date.toISOString().split('T')[0] : 'current';
    const key = `${CachePrefix.ACCOUNT_BALANCE}:${companyId}:${accountId}:${dateStr}`;
    return await this.redis.getCached<number>(key);
  }
  
  /**
   * Cache account balance
   */
  async setAccountBalance(
    companyId: string, 
    accountId: string, 
    balance: number,
    date?: Date
  ): Promise<void> {
    const dateStr = date ? date.toISOString().split('T')[0] : 'current';
    const key = `${CachePrefix.ACCOUNT_BALANCE}:${companyId}:${accountId}:${dateStr}`;
    await this.redis.setCached(key, balance, CacheTTL.ACCOUNT_BALANCE);
  }
  
  /**
   * Invalidate account balances
   * Folosit după crearea unui ledger entry care afectează soldurile
   */
  async invalidateAccountBalances(
    companyId: string, 
    accountIds: string[]
  ): Promise<void> {
    // Invalidate pentru fiecare cont afectat
    for (const accountId of accountIds) {
      const pattern = `${CachePrefix.ACCOUNT_BALANCE}:${companyId}:${accountId}:*`;
      await this.redis.invalidatePattern(pattern);
    }
  }
  
  /**
   * ============================================================================
   * TRIAL BALANCE CACHING
   * ============================================================================
   */
  
  /**
   * Get cached trial balance
   */
  async getTrialBalance(
    companyId: string, 
    year: number, 
    month: number
  ): Promise<any | null> {
    const key = `${CachePrefix.TRIAL_BALANCE}:${companyId}:${year}-${month}`;
    return await this.redis.getCached<any>(key);
  }
  
  /**
   * Cache trial balance
   */
  async setTrialBalance(
    companyId: string, 
    year: number, 
    month: number, 
    data: any
  ): Promise<void> {
    const key = `${CachePrefix.TRIAL_BALANCE}:${companyId}:${year}-${month}`;
    await this.redis.setCached(key, data, CacheTTL.TRIAL_BALANCE);
  }
  
  /**
   * Invalidate trial balance pentru o perioadă
   */
  async invalidateTrialBalance(
    companyId: string, 
    year?: number, 
    month?: number
  ): Promise<void> {
    const pattern = year && month
      ? `${CachePrefix.TRIAL_BALANCE}:${companyId}:${year}-${month}`
      : `${CachePrefix.TRIAL_BALANCE}:${companyId}:*`;
    await this.redis.invalidatePattern(pattern);
  }
  
  /**
   * ============================================================================
   * SETTINGS CACHING
   * ============================================================================
   */
  
  /**
   * Get cached accounting settings
   */
  async getSettings(companyId: string): Promise<any | null> {
    const key = `${CachePrefix.SETTINGS}:${companyId}`;
    return await this.redis.getCached<any>(key);
  }
  
  /**
   * Cache accounting settings
   */
  async setSettings(companyId: string, settings: any): Promise<void> {
    const key = `${CachePrefix.SETTINGS}:${companyId}`;
    await this.redis.setCached(key, settings, CacheTTL.ACCOUNTING_SETTINGS);
  }
  
  /**
   * Invalidate settings cache
   */
  async invalidateSettings(companyId: string): Promise<void> {
    const pattern = `${CachePrefix.SETTINGS}:${companyId}`;
    await this.redis.invalidatePattern(pattern);
  }
  
  /**
   * ============================================================================
   * JOURNAL REPORTS CACHING
   * ============================================================================
   */
  
  /**
   * Get cached sales journal
   */
  async getSalesJournal(
    companyId: string, 
    periodStart: string, 
    periodEnd: string
  ): Promise<any | null> {
    const key = `${CachePrefix.SALES_JOURNAL}:${companyId}:${periodStart}:${periodEnd}`;
    return await this.redis.getCached<any>(key);
  }
  
  /**
   * Cache sales journal
   */
  async setSalesJournal(
    companyId: string, 
    periodStart: string, 
    periodEnd: string, 
    data: any
  ): Promise<void> {
    const key = `${CachePrefix.SALES_JOURNAL}:${companyId}:${periodStart}:${periodEnd}`;
    await this.redis.setCached(key, data, CacheTTL.SALES_JOURNAL);
  }
  
  /**
   * Invalidate sales journal pentru o perioadă sau toată compania
   */
  async invalidateSalesJournal(companyId: string, period?: string): Promise<void> {
    const pattern = period
      ? `${CachePrefix.SALES_JOURNAL}:${companyId}:${period}*`
      : `${CachePrefix.SALES_JOURNAL}:${companyId}:*`;
    await this.redis.invalidatePattern(pattern);
  }
  
  /**
   * Get cached purchase journal
   */
  async getPurchaseJournal(
    companyId: string, 
    periodStart: string, 
    periodEnd: string
  ): Promise<any | null> {
    const key = `${CachePrefix.PURCHASE_JOURNAL}:${companyId}:${periodStart}:${periodEnd}`;
    return await this.redis.getCached<any>(key);
  }
  
  /**
   * Cache purchase journal
   */
  async setPurchaseJournal(
    companyId: string, 
    periodStart: string, 
    periodEnd: string, 
    data: any
  ): Promise<void> {
    const key = `${CachePrefix.PURCHASE_JOURNAL}:${companyId}:${periodStart}:${periodEnd}`;
    await this.redis.setCached(key, data, CacheTTL.PURCHASE_JOURNAL);
  }
  
  /**
   * Invalidate purchase journal
   */
  async invalidatePurchaseJournal(companyId: string, period?: string): Promise<void> {
    const pattern = period
      ? `${CachePrefix.PURCHASE_JOURNAL}:${companyId}:${period}*`
      : `${CachePrefix.PURCHASE_JOURNAL}:${companyId}:*`;
    await this.redis.invalidatePattern(pattern);
  }
  
  /**
   * ============================================================================
   * VAT REPORTS CACHING
   * ============================================================================
   */
  
  /**
   * Get cached VAT report (D300)
   */
  async getVATReport(
    companyId: string, 
    year: number, 
    month: number
  ): Promise<any | null> {
    const key = `${CachePrefix.VAT_REPORT}:${companyId}:${year}-${month}`;
    return await this.redis.getCached<any>(key);
  }
  
  /**
   * Cache VAT report
   */
  async setVATReport(
    companyId: string, 
    year: number, 
    month: number, 
    data: any
  ): Promise<void> {
    const key = `${CachePrefix.VAT_REPORT}:${companyId}:${year}-${month}`;
    await this.redis.setCached(key, data, CacheTTL.VAT_REPORT);
  }
  
  /**
   * Invalidate VAT report
   */
  async invalidateVATReport(
    companyId: string, 
    year?: number, 
    month?: number
  ): Promise<void> {
    const pattern = year && month
      ? `${CachePrefix.VAT_REPORT}:${companyId}:${year}-${month}`
      : `${CachePrefix.VAT_REPORT}:${companyId}:*`;
    await this.redis.invalidatePattern(pattern);
  }
  
  /**
   * ============================================================================
   * JOB RESULTS CACHING
   * ============================================================================
   */
  
  /**
   * Cache job result (temporar - pentru polling)
   */
  async setJobResult(jobId: string, result: any): Promise<void> {
    const key = `${CachePrefix.JOB_RESULT}:${jobId}`;
    await this.redis.setCached(key, result, CacheTTL.JOB_RESULT);
  }
  
  /**
   * Get cached job result
   */
  async getJobResult(jobId: string): Promise<any | null> {
    const key = `${CachePrefix.JOB_RESULT}:${jobId}`;
    return await this.redis.getCached<any>(key);
  }
  
  /**
   * ============================================================================
   * BULK INVALIDATION
   * ============================================================================
   */
  
  /**
   * Invalidate toate cache-urile pentru o companie (nuclear option)
   * Folosit în scenarii excepționale (ex: import date, migration)
   */
  async invalidateAllCompanyCache(companyId: string): Promise<void> {
    await this.redis.invalidatePattern(`acc:*:${companyId}:*`);
  }
  
  /**
   * Invalidate caches după crearea unui ledger entry
   * Invalidează solduri, balanțe, jurnale afectate
   */
  async invalidateAfterLedgerEntry(
    companyId: string,
    affectedAccounts: string[],
    entryDate: Date
  ): Promise<void> {
    // Invalidate balances pentru conturile afectate
    await this.invalidateAccountBalances(companyId, affectedAccounts);
    
    // Invalidate trial balance pentru luna și lunile următoare
    const year = entryDate.getFullYear();
    const month = entryDate.getMonth() + 1;
    await this.invalidateTrialBalance(companyId, year, month);
    
    // Invalidate jurnale pentru perioada
    const period = `${year}-${String(month).padStart(2, '0')}`;
    await this.invalidateSalesJournal(companyId, period);
    await this.invalidatePurchaseJournal(companyId, period);
    
    // Invalidate VAT report dacă e perioada curentă
    await this.invalidateVATReport(companyId, year, month);
  }
  
  /**
   * ============================================================================
   * CACHE METRICS
   * ============================================================================
   */
  
  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const metrics = await this.redis.getMetrics();
    return {
      totalKeys: metrics.totalKeys,
      hitRate: metrics.hitRate,
      missRate: 100 - metrics.hitRate,
      memoryUsage: metrics.memoryUsage
    };
  }
  
  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.redis.isConnected();
  }
}

// Export singleton instance
export const accountingCacheService = new AccountingCacheService();

