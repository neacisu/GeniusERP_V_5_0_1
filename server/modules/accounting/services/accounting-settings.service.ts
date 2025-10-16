/**
 * Accounting Settings Service
 * 
 * Consolidated service for managing all accounting settings:
 * - General settings
 * - VAT settings
 * - Account mappings
 * - Account relationships
 * - Document counters
 * - Fiscal periods
 * - Opening balances
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  accountingSettings,
  vatSettings,
  accountRelationships,
  openingBalances,
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
} from '@shared/schema';
import { accountMappings, AccountMapping, InsertAccountMapping } from '@shared/schema';
import { documentCounters, DocumentCounter } from '../schema/accounting.schema';
import { fiscalPeriods, FiscalPeriod } from '../schema/accounting.schema';
import { syntheticAccounts, SyntheticAccount } from '@shared/schema';

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
  /**
   * Get all accounting settings for a company
   */
  async getSettings(companyId: string): Promise<AllAccountingSettings> {
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

    return {
      generalSettings,
      vatSettings: vatSettingsData,
      accountMappings: accountMappingsData,
      accountRelationships: accountRelationshipsData,
      documentCounters: documentCountersData,
      fiscalPeriods: fiscalPeriodsData,
    };
  }

  /**
   * Get general accounting settings
   */
  async getGeneralSettings(companyId: string): Promise<AccountingSettings | null> {
    const [settings] = await this.query((db) =>
      db.select().from(accountingSettings).where(eq(accountingSettings.companyId, companyId)).limit(1)
    );

    return settings || null;
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
          .update(accountingSettings)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(accountingSettings.companyId, companyId))
          .returning()
      );
      return updated;
    } else {
      // Create new settings
      const [created] = await this.query((db) =>
        db
          .insert(accountingSettings)
          .values({
            companyId,
            ...data,
            createdBy: userId,
          } as InsertAccountingSettings)
          .returning()
      );
      return created;
    }
  }

  /**
   * Get VAT settings
   */
  async getVatSettings(companyId: string): Promise<VatSettings | null> {
    const [settings] = await this.query((db) =>
      db.select().from(vatSettings).where(eq(vatSettings.companyId, companyId)).limit(1)
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
    if (data.standardVatRate !== undefined && (data.standardVatRate < 0 || data.standardVatRate > 100)) {
      throw new Error('Standard VAT rate must be between 0 and 100');
    }
    if (data.reducedVatRate1 !== undefined && (data.reducedVatRate1 < 0 || data.reducedVatRate1 > 100)) {
      throw new Error('Reduced VAT rate 1 must be between 0 and 100');
    }
    if (data.reducedVatRate2 !== undefined && (data.reducedVatRate2 < 0 || data.reducedVatRate2 > 100)) {
      throw new Error('Reduced VAT rate 2 must be between 0 and 100');
    }

    // Validate VAT accounts exist in chart of accounts
    if (data.vatCollectedAccount) {
      await this.validateAccountExists(data.vatCollectedAccount);
    }
    if (data.vatDeductibleAccount) {
      await this.validateAccountExists(data.vatDeductibleAccount);
    }
    if (data.vatPayableAccount) {
      await this.validateAccountExists(data.vatPayableAccount);
    }
    if (data.vatReceivableAccount) {
      await this.validateAccountExists(data.vatReceivableAccount);
    }

    // Check if settings exist
    const existing = await this.getVatSettings(companyId);

    if (existing) {
      // Update existing settings
      const [updated] = await this.query((db) =>
        db
          .update(vatSettings)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(vatSettings.companyId, companyId))
          .returning()
      );
      return updated;
    } else {
      // Create new settings
      const [created] = await this.query((db) =>
        db
          .insert(vatSettings)
          .values({
            companyId,
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
      db.select().from(accountMappings).where(eq(accountMappings.companyId, companyId))
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
        .from(accountMappings)
        .where(and(
          eq(accountMappings.companyId, companyId), 
          sql`${accountMappings.mappingType} = ${mappingType}`
        ))
        .limit(1)
    );

    if (existing) {
      // Update existing mapping
      const [updated] = await this.query((db) =>
        db
          .update(accountMappings)
          .set({ accountCode, accountName, updatedAt: new Date() })
          .where(and(
            eq(accountMappings.companyId, companyId), 
            sql`${accountMappings.mappingType} = ${mappingType}`
          ))
          .returning()
      );
      return updated;
    } else {
      // Create new mapping
      const [created] = await this.query((db) =>
        db
          .insert(accountMappings)
          .values({
            companyId,
            mappingType,
            accountCode,
            accountName,
            isDefault: false,
            isActive: true,
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
      db.delete(accountMappings).where(and(eq(accountMappings.companyId, companyId), eq(accountMappings.isDefault, false)))
    );

    // Default mappings will be used by the system
  }

  /**
   * Get account relationships
   */
  async getAccountRelationships(companyId: string): Promise<AccountRelationship[]> {
    return this.query((db) =>
      db.select().from(accountRelationships).where(eq(accountRelationships.companyId, companyId)).orderBy(desc(accountRelationships.priority))
    );
  }

  /**
   * Create account relationship
   */
  async createAccountRelationship(
    companyId: string,
    data: Omit<InsertAccountRelationship, 'companyId'>
  ): Promise<AccountRelationship> {
    // Validate accounts exist
    await this.validateAccountExists(data.debitAccountCode);
    await this.validateAccountExists(data.creditAccountCode);

    // Validate double-entry (accounts must be different)
    if (data.debitAccountCode === data.creditAccountCode) {
      throw new Error('Debit and credit accounts must be different');
    }

    // Get account names
    const debitAccountName = await this.getAccountName(data.debitAccountCode);
    const creditAccountName = await this.getAccountName(data.creditAccountCode);

    const [created] = await this.query((db) =>
      db
        .insert(accountRelationships)
        .values({
          companyId,
          ...data,
          debitAccountName,
          creditAccountName,
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
    if (data.debitAccountCode) {
      await this.validateAccountExists(data.debitAccountCode);
    }
    if (data.creditAccountCode) {
      await this.validateAccountExists(data.creditAccountCode);
    }

    // Update account names if codes changed
    if (data.debitAccountCode) {
      data.debitAccountName = await this.getAccountName(data.debitAccountCode);
    }
    if (data.creditAccountCode) {
      data.creditAccountName = await this.getAccountName(data.creditAccountCode);
    }

    const [updated] = await this.query((db) =>
      db
        .update(accountRelationships)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(accountRelationships.id, relationshipId))
        .returning()
    );

    return updated;
  }

  /**
   * Delete account relationship
   */
  async deleteAccountRelationship(relationshipId: string): Promise<void> {
    await this.query((db) =>
      db.delete(accountRelationships).where(eq(accountRelationships.id, relationshipId))
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
    // Check if counter has been used (has lastNumber > 0)
    const [counter] = await this.query((db) =>
      db.select().from(documentCounters).where(eq(documentCounters.id, counterId)).limit(1)
    );

    if (!counter) {
      throw new Error('Seria nu a fost găsită');
    }

    if (parseInt(counter.lastNumber) > 0) {
      throw new Error('Nu se poate șterge o serie care a fost deja utilizată');
    }

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
        .from(openingBalances)
        .where(and(eq(openingBalances.companyId, companyId), eq(openingBalances.fiscalYear, fiscalYear)))
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
        .delete(openingBalances)
        .where(and(eq(openingBalances.companyId, companyId), eq(openingBalances.fiscalYear, fiscalYear)))
    );

    // Insert new balances
    const results: OpeningBalance[] = [];

    for (const balance of balances) {
      const [created] = await this.query((db) =>
        db
          .insert(openingBalances)
          .values({
            companyId,
            accountCode: balance.accountCode,
            accountName: balance.accountName,
            debitBalance: balance.debitBalance,
            creditBalance: balance.creditBalance,
            fiscalYear,
            importDate: new Date(),
            importSource,
            isValidated: false,
            createdBy: userId,
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
      const debit = parseFloat(balance.debitBalance);
      const credit = parseFloat(balance.creditBalance);

      totalDebit += debit;
      totalCredit += credit;

      // Check constraint
      if (debit > 0 && credit > 0) {
        errors.push(`Account ${balance.accountCode} has both debit and credit balance`);
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
        .update(openingBalances)
        .set({
          isValidated: true,
          validatedAt: new Date(),
          validatedBy: userId,
          updatedAt: new Date(),
        })
        .where(and(eq(openingBalances.companyId, companyId), eq(openingBalances.fiscalYear, fiscalYear)))
    );
  }

  /**
   * Helper: Validate account exists in chart of accounts
   */
  private async validateAccountExists(accountCode: string): Promise<void> {
    const [account] = await this.query((db) =>
      db.select().from(syntheticAccounts).where(eq(syntheticAccounts.code, accountCode)).limit(1)
    );

    if (!account) {
      throw new Error(`Account ${accountCode} does not exist in chart of accounts`);
    }
  }

  /**
   * Helper: Get account name by code
   */
  private async getAccountName(accountCode: string): Promise<string> {
    const [account] = await this.query((db) =>
      db.select().from(syntheticAccounts).where(eq(syntheticAccounts.code, accountCode)).limit(1)
    );

    return account?.name || accountCode;
  }
}

