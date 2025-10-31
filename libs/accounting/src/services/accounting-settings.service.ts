/**
 * Accounting Settings Service
 * 
 * Consolidated service for managing all accounting settings with Redis caching:
 * - General settings (TTL: 6h)
 * - VAT settings (TTL: 6h)
 * - Account mappings (TTL: 24h)
 * - Account relationships (TTL: 12h)
 * - Document counters (TTL: 1h)
 * - Fiscal periods (TTL: 24h)
 * - Opening balances (no cache - frequently updated)
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { eq, and, desc, sql, like } from 'drizzle-orm';
import { RedisService } from '@common/services/redis.service';
import {
  accounting_settings,
  vat_settings,
  AC_account_relationships,
  opening_balances,
  AccountingSettings,
  VatSettings,
  AccountRelationship,
  OpeningBalance,
  InsertAccountingSettings,
  InsertVatSettings,
  InsertAccountRelationship,
  InsertOpeningBalance,
  UpdateAccountingSettings,
  UpdateVatSettings,
  UpdateAccountRelationship,
  synthetic_accounts,
  invoices,
  PC_account_mappings,
  AccountMapping,
  InsertAccountMapping,
} from '@geniuserp/shared';
import { 
  documentCounters, 
  DocumentCounter, 
  fiscalPeriods, 
  FiscalPeriod, 
  ledgerEntries,
} from '../schema/accounting.schema';

export interface AllAccountingSettings {
  generalSettings: AccountingSettings | null;
  vatSettings: VatSettings | null;
  accountMappings: AccountMapping[];
  accountRelationships: AccountRelationship[];
  documentCounters: DocumentCounter[];
  fiscalPeriods: FiscalPeriod[];
}

export interface OpeningBalancesValidation {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
  errors: string[];
}

export class AccountingSettingsService extends DrizzleService {
  private redisService: RedisService;

  constructor() {
    super();
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
   * Get all accounting settings for a company with Redis caching
   */
  async getSettings(companyId: string): Promise<AllAccountingSettings> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:settings:all:${companyId}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AllAccountingSettings>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    // Fetch all settings in parallel
    const [
      generalSettings,
      vatSettingsData,
      accountMappingsData,
      accountRelationshipsData,
      documentCountersData,
      fiscalPeriodsData,
    ] = await Promise.all([
      this.getGeneralSettings(companyId),
      this.getVatSettings(companyId),
      this.getAccountMappings(companyId),
      this.getAccountRelationships(companyId),
      this.getDocumentCounters(companyId),
      this.getFiscalPeriods(companyId),
    ]);

    const settings = {
      generalSettings,
      vatSettings: vatSettingsData,
      accountMappings: accountMappingsData,
      accountRelationships: accountRelationshipsData,
      documentCounters: documentCountersData,
      fiscalPeriods: fiscalPeriodsData,
    };

    // Cache for 6 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, settings, 21600);
    }

    return settings;
  }

  /**
   * Get general accounting settings with Redis caching
   */
  async getGeneralSettings(companyId: string): Promise<AccountingSettings | null> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:settings:general:${companyId}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AccountingSettings | null>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }
    const [settings] = await this.query((db) =>
      db.select().from(accounting_settings).where(eq(accounting_settings.company_id, companyId)).limit(1)
    );

    const result = settings || null;

    // Cache for 6 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, result, 21600);
    }

    return result;
  }

  /**
   * Invalidate all settings cache for a company
   */
  async invalidateSettingsCache(companyId: string): Promise<void> {
    await this.ensureRedisConnection();
    
    if (this.redisService.isConnected()) {
      await this.redisService.invalidatePattern(`acc:settings:*:${companyId}`);
    }
  }

  /**
   * Update general accounting settings
   */
  async updateGeneralSettings(
    companyId: string,
    data: UpdateAccountingSettings,
    userId: string
  ): Promise<AccountingSettings> {
    // Check if settings exist
    const existing = await this.getGeneralSettings(companyId);

    if (existing) {
      // Update existing settings
      const [updated] = await this.query((db) =>
        db
          .update(accounting_settings)
          .set({ ...data, updated_at: new Date() })
          .where(eq(accounting_settings.company_id, companyId))
          .returning()
      );
      
      // Invalidate cache
      await this.invalidateSettingsCache(companyId);
      
      return updated;
    } else {
      // Create new settings
      const [created] = await this.query((db) =>
        db
          .insert(accounting_settings)
          .values({
            company_id: companyId,
            ...data,
            created_by: userId,
          } as InsertAccountingSettings)
          .returning()
      );
      
      // Invalidate cache
      await this.invalidateSettingsCache(companyId);
      
      return created;
    }
  }

  /**
   * Get VAT settings
   */
  async getVatSettings(companyId: string): Promise<VatSettings | null> {
    const [settings] = await this.query((db) =>
      db.select().from(vat_settings).where(eq(vat_settings.company_id, companyId)).limit(1)
    );

    return settings || null;
  }

  /**
   * Update VAT settings
   */
  async updateVatSettings(
    companyId: string,
    data: UpdateVatSettings
  ): Promise<VatSettings> {
    // Validate VAT rates
    if (data.standard_vat_rate !== undefined && (data.standard_vat_rate < 0 || data.standard_vat_rate > 100)) {
      throw new Error('Standard VAT rate must be between 0 and 100');
    }
    if (data.reduced_vat_rate_1 !== undefined && (data.reduced_vat_rate_1 < 0 || data.reduced_vat_rate_1 > 100)) {
      throw new Error('Reduced VAT rate 1 must be between 0 and 100');
    }
    if (data.reduced_vat_rate_2 !== undefined && (data.reduced_vat_rate_2 < 0 || data.reduced_vat_rate_2 > 100)) {
      throw new Error('Reduced VAT rate 2 must be between 0 and 100');
    }

    // Validate VAT accounts exist in chart of accounts
    if (data.vat_collected_account) {
      await this.validateAccountExists(data.vat_collected_account);
    }
    if (data.vat_deductible_account) {
      await this.validateAccountExists(data.vat_deductible_account);
    }
    if (data.vat_payable_account) {
      await this.validateAccountExists(data.vat_payable_account);
    }
    if (data.vat_receivable_account) {
      await this.validateAccountExists(data.vat_receivable_account);
    }

    // Check if settings exist
    const existing = await this.getVatSettings(companyId);

    if (existing) {
      // Update existing settings
      const [updated] = await this.query((db) =>
        db
          .update(vat_settings)
          .set({ ...data, updated_at: new Date() })
          .where(eq(vat_settings.company_id, companyId))
          .returning()
      );
      return updated;
    } else {
      // Create new settings
      const [created] = await this.query((db) =>
        db
          .insert(vat_settings)
          .values({
            company_id: companyId,
            ...data,
          } as InsertVatSettings)
          .returning()
      );
      return created;
    }
  }

  /**
   * Get account mappings
   */
  async getAccountMappings(companyId: string): Promise<AccountMapping[]> {
    return this.query((db) =>
      db.select().from(PC_account_mappings).where(eq(PC_account_mappings.company_id, companyId))
    );
  }

  /**
   * Update account mapping
   */
  async updateAccountMapping(
    companyId: string,
    mappingType: string,
    accountCode: string
  ): Promise<AccountMapping> {
    // Validate account exists
    await this.validateAccountExists(accountCode);

    // Get account name
    const accountName = await this.getAccountName(accountCode);

    // Check if mapping exists
    const [existing] = await this.query((db) =>
      db
        .select()
        .from(PC_account_mappings)
        .where(and(
          eq(PC_account_mappings.company_id, companyId), 
          sql`${PC_account_mappings.mapping_type} = ${mappingType}`
        ))
        .limit(1)
    );

    if (existing) {
      // Update existing mapping
      const [updated] = await this.query((db) =>
        db
          .update(PC_account_mappings)
          .set({ account_code: accountCode, account_name: accountName, updated_at: new Date() })
          .where(and(
            eq(PC_account_mappings.company_id, companyId), 
            sql`${PC_account_mappings.mapping_type} = ${mappingType}`
          ))
          .returning()
      );
      return updated;
    } else {
      // Create new mapping
      const [created] = await this.query((db) =>
        db
          .insert(PC_account_mappings)
          .values({
            company_id: companyId,
            mapping_type: mappingType,
            account_code: accountCode,
            account_name: accountName,
            is_default: false,
            is_active: true,
          } as InsertAccountMapping)
          .returning()
      );
      return created;
    }
  }

  /**
   * Reset account mappings to default
   */
  async resetAccountMappingsToDefault(companyId: string): Promise<void> {
    // Delete all custom mappings
    await this.query((db) =>
      db.delete(PC_account_mappings).where(and(eq(PC_account_mappings.company_id, companyId), eq(PC_account_mappings.is_default, false)))
    );

    // Default mappings will be used by the system
  }

  /**
   * Get account relationships
   */
  async getAccountRelationships(companyId: string): Promise<AccountRelationship[]> {
    return this.query((db) =>
      db.select().from(AC_account_relationships).where(eq(AC_account_relationships.company_id, companyId)).orderBy(desc(AC_account_relationships.priority))
    );
  }

  /**
   * Create account relationship
   */
  async createAccountRelationship(
    companyId: string,
    data: Omit<InsertAccountRelationship, 'company_id'>
  ): Promise<AccountRelationship> {
    // Validate accounts exist
    await this.validateAccountExists(data.debit_account_code);
    await this.validateAccountExists(data.credit_account_code);

    // Validate double-entry (accounts must be different)
    if (data.debit_account_code === data.credit_account_code) {
      throw new Error('Debit and credit accounts must be different');
    }

    // Get account names
    const debit_account_name = await this.getAccountName(data.debit_account_code);
    const credit_account_name = await this.getAccountName(data.credit_account_code);

    const [created] = await this.query((db) =>
      db
        .insert(AC_account_relationships)
        .values({
          company_id: companyId,
          ...data,
          debit_account_name,
          credit_account_name,
        } as InsertAccountRelationship)
        .returning()
    );

    return created;
  }

  /**
   * Update account relationship
   */
  async updateAccountRelationship(
    relationshipId: string,
    data: UpdateAccountRelationship
  ): Promise<AccountRelationship> {
    // Validate accounts if provided
    if (data.debit_account_code) {
      await this.validateAccountExists(data.debit_account_code);
    }
    if (data.credit_account_code) {
      await this.validateAccountExists(data.credit_account_code);
    }

    // Update account names if codes changed
    if (data.debit_account_code) {
      data.debit_account_name = await this.getAccountName(data.debit_account_code);
    }
    if (data.credit_account_code) {
      data.credit_account_name = await this.getAccountName(data.credit_account_code);
    }

    const [updated] = await this.query((db) =>
      db
        .update(AC_account_relationships)
        .set({ ...data, updated_at: new Date() })
        .where(eq(AC_account_relationships.id, relationshipId))
        .returning()
    );

    return updated;
  }

  /**
   * Delete account relationship
   */
  async deleteAccountRelationship(relationshipId: string): Promise<void> {
    await this.query((db) =>
      db.delete(AC_account_relationships).where(eq(AC_account_relationships.id, relationshipId))
    );
  }

  /**
   * Get document counters
   */
  async getDocumentCounters(companyId: string): Promise<DocumentCounter[]> {
    return this.query((db) =>
      db.select().from(documentCounters).where(eq(documentCounters.companyId, companyId))
    );
  }

  /**
   * Update document counter series
   */
  async updateDocumentCounterSeries(
    companyId: string,
    counterType: string,
    series: string,
    year: number
  ): Promise<DocumentCounter> {
    // Check if counter exists
    const [existing] = await this.query((db) =>
      db
        .select()
        .from(documentCounters)
        .where(
          and(
            eq(documentCounters.companyId, companyId),
            eq(documentCounters.counterType, counterType),
            eq(documentCounters.series, series),
            eq(documentCounters.year, year.toString())
          )
        )
        .limit(1)
    );

    if (existing) {
      return existing;
    } else {
      // Create new counter
      const [created] = await this.query((db) =>
        db
          .insert(documentCounters)
          .values({
            id: crypto.randomUUID(),
            companyId,
            counterType,
            series,
            year: year.toString(),
            lastNumber: '0',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
      );
      return created;
    }
  }

  /**
   * Create new document counter series
   */
  async createDocumentCounterSeries(
    companyId: string,
    counterType: string,
    series: string,
    year: number
  ): Promise<DocumentCounter> {
    // Check if series already exists
    const [existing] = await this.query((db) =>
      db
        .select()
        .from(documentCounters)
        .where(
          and(
            eq(documentCounters.companyId, companyId),
            eq(documentCounters.counterType, counterType),
            eq(documentCounters.series, series),
            eq(documentCounters.year, year.toString())
          )
        )
        .limit(1)
    );

    if (existing) {
      throw new Error(`Seria ${series} pentru ${counterType} și anul ${year} există deja`);
    }

    // Create new counter
    const [created] = await this.query((db) =>
      db
        .insert(documentCounters)
        .values({
          id: crypto.randomUUID(),
          companyId,
          counterType,
          series,
          year: year.toString(),
          lastNumber: '0',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
    );
    
    return created;
  }

  /**
   * Delete document counter series
   */
  async deleteDocumentCounterSeries(counterId: string): Promise<void> {
    // Get counter details
    const [counter] = await this.query((db) =>
      db.select().from(documentCounters).where(eq(documentCounters.id, counterId)).limit(1)
    );

    if (!counter) {
      throw new Error('Seria nu a fost găsită');
    }

    const { series, year, companyId } = counter;

    // Check if any invoices exist with this series
    const invoiceCount = await this.query((db) =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(
          and(
            eq(invoices.companyId, companyId),
            eq(invoices.series, series)
          )
        )
    );

    const invoiceTotal = Number(invoiceCount[0]?.count || 0);

    if (invoiceTotal > 0) {
      throw new Error(
        `Nu se poate șterge seria ${series}/${year}. Există ${invoiceTotal} facturi emise cu această serie. Ștergeți mai întâi documentele.`
      );
    }

    // Check if any journal entries exist with this series
    // Journal numbers are formatted as: SERIES/YEAR/NUMBER (ex: JV/2025/00001)
    const journalPattern = `${series}/${year}/%`;
    
    const journalCount = await this.query((db) =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(ledgerEntries)
        .where(
          and(
            eq(ledgerEntries.companyId, companyId),
            like(ledgerEntries.journalNumber, journalPattern)
          )
        )
    );

    const journalTotal = Number(journalCount[0]?.count || 0);

    if (journalTotal > 0) {
      throw new Error(
        `Nu se poate șterge seria ${series}/${year}. Există ${journalTotal} înregistrări în jurnal cu această serie. Ștergeți mai întâi documentele.`
      );
    }

    // If no documents found, allow deletion
    await this.query((db) =>
      db.delete(documentCounters).where(eq(documentCounters.id, counterId))
    );
  }

  /**
   * Get fiscal periods
   */
  async getFiscalPeriods(companyId: string): Promise<FiscalPeriod[]> {
    return this.query((db) =>
      db.select().from(fiscalPeriods).where(eq(fiscalPeriods.companyId, companyId)).orderBy(desc(fiscalPeriods.year), desc(fiscalPeriods.month))
    );
  }

  /**
   * Get opening balances
   */
  async getOpeningBalances(companyId: string, fiscalYear: number): Promise<OpeningBalance[]> {
    return this.query((db) =>
      db
        .select()
        .from(opening_balances)
        .where(and(eq(opening_balances.company_id, companyId), eq(opening_balances.fiscal_year, fiscalYear)))
    );
  }

  /**
   * Import opening balances
   */
  async importOpeningBalances(
    companyId: string,
    balances: Array<{
      accountCode: string;
      accountName: string;
      debitBalance: string;
      creditBalance: string;
    }>,
    fiscalYear: number,
    importSource: 'MANUAL' | 'CSV' | 'EXCEL' | 'API',
    userId: string
  ): Promise<OpeningBalance[]> {
    // Validate all accounts exist
    for (const balance of balances) {
      await this.validateAccountExists(balance.accountCode);
    }

    // Validate balance constraint (only one of debit or credit can be non-zero)
    for (const balance of balances) {
      const debit = parseFloat(balance.debitBalance);
      const credit = parseFloat(balance.creditBalance);

      if (debit > 0 && credit > 0) {
        throw new Error(`Account ${balance.accountCode} cannot have both debit and credit balance`);
      }
    }

    // Delete existing balances for this year
    await this.query((db) =>
      db
        .delete(opening_balances)
        .where(and(eq(opening_balances.company_id, companyId), eq(opening_balances.fiscal_year, fiscalYear)))
    );

    // Insert new balances
    const results: OpeningBalance[] = [];

    for (const balance of balances) {
      const [created] = await this.query((db) =>
        db
          .insert(opening_balances)
          .values({
            company_id: companyId,
            account_code: balance.accountCode,
            account_name: balance.accountName,
            debit_balance: balance.debitBalance,
            credit_balance: balance.creditBalance,
            fiscal_year: fiscalYear,
            import_date: new Date(),
            import_source: importSource,
            is_validated: false,
            created_by: userId,
          } as InsertOpeningBalance)
          .returning()
      );
      results.push(created);
    }

    return results;
  }

  /**
   * Validate opening balances (check if total debit = total credit)
   */
  async validateOpeningBalances(companyId: string, fiscalYear: number): Promise<OpeningBalancesValidation> {
    const balances = await this.getOpeningBalances(companyId, fiscalYear);

    let totalDebit = 0;
    let totalCredit = 0;
    const errors: string[] = [];

    for (const balance of balances) {
      const debit = parseFloat(balance.debit_balance);
      const credit = parseFloat(balance.credit_balance);

      totalDebit += debit;
      totalCredit += credit;

      // Check constraint
      if (debit > 0 && credit > 0) {
        errors.push(`Account ${balance.account_code} has both debit and credit balance`);
      }
    }

    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01; // Allow for rounding errors

    if (!isBalanced) {
      errors.push(`Total debit (${totalDebit.toFixed(2)}) does not equal total credit (${totalCredit.toFixed(2)})`);
    }

    return {
      totalDebit,
      totalCredit,
      difference,
      isBalanced,
      errors,
    };
  }

  /**
   * Mark opening balances as validated
   */
  async markOpeningBalancesAsValidated(
    companyId: string,
    fiscalYear: number,
    userId: string
  ): Promise<void> {
    // First validate
    const validation = await this.validateOpeningBalances(companyId, fiscalYear);

    if (!validation.isBalanced) {
      throw new Error(`Opening balances are not balanced. Difference: ${validation.difference.toFixed(2)}`);
    }

    // Mark as validated
    await this.query((db) =>
      db
        .update(opening_balances)
        .set({
          is_validated: true,
          validated_at: new Date(),
          validated_by: userId,
          updated_at: new Date(),
        })
        .where(and(eq(opening_balances.company_id, companyId), eq(opening_balances.fiscal_year, fiscalYear)))
    );
  }

  /**
   * Helper: Validate account exists in chart of accounts and is active
   */
  private async validateAccountExists(accountCode: string): Promise<void> {
    const [account] = await this.query((db) =>
      db.select().from(synthetic_accounts).where(
        and(
          eq(synthetic_accounts.code, accountCode),
          eq(synthetic_accounts.is_active, true)
        )
      ).limit(1)
    );

    if (!account) {
      throw new Error(`Account ${accountCode} does not exist or is not active in chart of accounts`);
    }
  }

  /**
   * Helper: Get account name by code (only active accounts)
   */
  private async getAccountName(accountCode: string): Promise<string> {
    const [account] = await this.query((db) =>
      db.select().from(synthetic_accounts).where(
        and(
          eq(synthetic_accounts.code, accountCode),
          eq(synthetic_accounts.is_active, true)
        )
      ).limit(1)
    );

    return account?.name || accountCode;
  }
}

