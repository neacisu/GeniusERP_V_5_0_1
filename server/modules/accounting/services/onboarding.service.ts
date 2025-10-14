/**
 * Onboarding Service
 * 
 * Service for onboarding companies with accounting history:
 * - Start onboarding process
 * - Import chart of accounts
 * - Import opening balances
 * - Validate balances
 * - Finalize onboarding
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { eq, and } from 'drizzle-orm';
import {
  accountingSettings,
  openingBalances,
  syntheticAccounts,
  AccountingSettings,
  OpeningBalance,
  InsertSyntheticAccount,
} from '@shared/schema';
import { AccountingSettingsService } from './accounting-settings.service';

export interface OnboardingStatus {
  started: boolean;
  startDate: Date | null;
  chartOfAccountsImported: boolean;
  chartAccountsCount: number;
  openingBalancesImported: boolean;
  openingBalancesCount: number;
  openingBalancesValidated: boolean;
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
  completed: boolean;
  completedAt: Date | null;
}

export interface ImportAccountData {
  code: string;
  name: string;
  description?: string;
  accountFunction: 'A' | 'P' | 'B';
  grade: number;
  groupId: string;
  parentId?: string | null;
}

export interface ImportBalanceData {
  accountCode: string;
  accountName: string;
  debitBalance: string;
  creditBalance: string;
}

export class OnboardingService extends DrizzleService {
  private settingsService: AccountingSettingsService;

  constructor() {
    super();
    this.settingsService = new AccountingSettingsService();
  }

  /**
   * Start onboarding process for a company with accounting history
   */
  async startOnboarding(
    companyId: string,
    startDate: Date,
    fiscalYear: number,
    userId: string
  ): Promise<AccountingSettings> {
    // Check if settings already exist
    const existing = await this.settingsService.getGeneralSettings(companyId);

    if (existing && existing.hasAccountingHistory) {
      throw new Error('Onboarding already started for this company');
    }

    // Update or create settings
    const settings = await this.settingsService.updateGeneralSettings(
      companyId,
      {
        hasAccountingHistory: true,
        accountingStartDate: startDate,
        openingBalancesImported: false,
        fiscalYearStartMonth: startDate.getMonth() + 1,
      },
      userId
    );

    return settings;
  }

  /**
   * Import chart of accounts from external data
   */
  async importChartOfAccounts(
    companyId: string,
    accounts: ImportAccountData[]
  ): Promise<void> {
    // Validate all required fields
    for (const account of accounts) {
      if (!account.code || !account.name || !account.accountFunction || !account.grade || !account.groupId) {
        throw new Error(`Invalid account data: ${JSON.stringify(account)}`);
      }

      if (!['A', 'P', 'B'].includes(account.accountFunction)) {
        throw new Error(`Invalid account function: ${account.accountFunction}. Must be A, P, or B`);
      }

      if (account.grade < 1 || account.grade > 3) {
        throw new Error(`Invalid grade: ${account.grade}. Must be 1, 2, or 3`);
      }
    }

    // Check for duplicate codes
    const codes = accounts.map((a) => a.code);
    const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate account codes found: ${duplicates.join(', ')}`);
    }

    // Import accounts
    for (const account of accounts) {
      // Check if account already exists
      const [existing] = await this.query((db) =>
        db.select().from(syntheticAccounts).where(eq(syntheticAccounts.code, account.code)).limit(1)
      );

      if (!existing) {
        // Insert new account
        await this.query((db) =>
          db.insert(syntheticAccounts).values({
            id: crypto.randomUUID(),
            code: account.code,
            name: account.name,
            description: account.description || null,
            accountFunction: account.accountFunction,
            grade: account.grade,
            groupId: account.groupId,
            parentId: account.parentId || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as InsertSyntheticAccount)
        );
      }
    }
  }

  /**
   * Import opening balances
   */
  async importOpeningBalances(
    companyId: string,
    balances: ImportBalanceData[],
    fiscalYear: number,
    importSource: 'MANUAL' | 'CSV' | 'EXCEL' | 'API',
    userId: string
  ): Promise<OpeningBalance[]> {
    // Use AccountingSettingsService to import balances
    const imported = await this.settingsService.importOpeningBalances(
      companyId,
      balances,
      fiscalYear,
      importSource,
      userId
    );

    // Update settings to mark opening balances as imported
    await this.settingsService.updateGeneralSettings(
      companyId,
      {
        openingBalancesImported: true,
      },
      userId
    );

    return imported;
  }

  /**
   * Validate opening balances
   */
  async validateOpeningBalances(
    companyId: string,
    fiscalYear: number
  ): Promise<{
    isValid: boolean;
    totalDebit: number;
    totalCredit: number;
    difference: number;
    errors: string[];
  }> {
    const validation = await this.settingsService.validateOpeningBalances(companyId, fiscalYear);

    return {
      isValid: validation.isBalanced,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
      difference: validation.difference,
      errors: validation.errors,
    };
  }

  /**
   * Finalize onboarding process
   */
  async finalizeOnboarding(
    companyId: string,
    fiscalYear: number,
    userId: string
  ): Promise<AccountingSettings> {
    // Validate opening balances
    const validation = await this.validateOpeningBalances(companyId, fiscalYear);

    if (!validation.isValid) {
      throw new Error(
        `Cannot finalize onboarding. Opening balances are not balanced. Errors: ${validation.errors.join(', ')}`
      );
    }

    // Mark opening balances as validated
    await this.settingsService.markOpeningBalancesAsValidated(companyId, fiscalYear, userId);

    // Update settings to mark onboarding as complete
    const settings = await this.settingsService.updateGeneralSettings(
      companyId,
      {
        hasAccountingHistory: true,
        openingBalancesImported: true,
      },
      userId
    );

    return settings;
  }

  /**
   * Get onboarding status for a company
   */
  async getOnboardingStatus(companyId: string, fiscalYear: number): Promise<OnboardingStatus> {
    // Get settings
    const settings = await this.settingsService.getGeneralSettings(companyId);

    // Get opening balances
    const balances = await this.settingsService.getOpeningBalances(companyId, fiscalYear);

    // Get chart of accounts count (for this company's custom accounts)
    // Note: We're counting all synthetic accounts since they're shared
    const accountsCount = await this.query((db) =>
      db.select().from(syntheticAccounts)
    );

    // Validate balances if imported
    let validation = {
      isBalanced: false,
      totalDebit: 0,
      totalCredit: 0,
      difference: 0,
    };

    if (balances.length > 0) {
      validation = await this.settingsService.validateOpeningBalances(companyId, fiscalYear);
    }

    // Check if any balance is validated
    const hasValidatedBalance = balances.some((b) => b.isValidated);

    return {
      started: settings?.hasAccountingHistory || false,
      startDate: settings?.accountingStartDate || null,
      chartOfAccountsImported: accountsCount.length > 0,
      chartAccountsCount: accountsCount.length,
      openingBalancesImported: settings?.openingBalancesImported || false,
      openingBalancesCount: balances.length,
      openingBalancesValidated: hasValidatedBalance,
      isBalanced: validation.isBalanced,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
      difference: validation.difference,
      completed: (settings?.hasAccountingHistory && settings?.openingBalancesImported && hasValidatedBalance) || false,
      completedAt: hasValidatedBalance ? (balances.find((b) => b.validatedAt)?.validatedAt || null) : null,
    };
  }

  /**
   * Helper: Parse CSV data for chart of accounts import
   */
  parseChartOfAccountsCSV(csvData: string): ImportAccountData[] {
    const lines = csvData.trim().split('\n');
    const accounts: ImportAccountData[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map((p) => p.trim().replace(/^"/, '').replace(/"$/, ''));

      if (parts.length < 6) {
        throw new Error(`Invalid CSV format at line ${i + 1}`);
      }

      accounts.push({
        code: parts[0],
        name: parts[1],
        description: parts[2] || undefined,
        accountFunction: parts[3] as 'A' | 'P' | 'B',
        grade: parseInt(parts[4], 10),
        groupId: parts[5],
        parentId: parts[6] || null,
      });
    }

    return accounts;
  }

  /**
   * Helper: Parse CSV data for opening balances import
   */
  parseOpeningBalancesCSV(csvData: string): ImportBalanceData[] {
    const lines = csvData.trim().split('\n');
    const balances: ImportBalanceData[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map((p) => p.trim().replace(/^"/, '').replace(/"$/, ''));

      if (parts.length < 4) {
        throw new Error(`Invalid CSV format at line ${i + 1}`);
      }

      const debit = parts[2] || '0';
      const credit = parts[3] || '0';

      // Skip if both are zero
      if (parseFloat(debit) === 0 && parseFloat(credit) === 0) {
        continue;
      }

      balances.push({
        accountCode: parts[0],
        accountName: parts[1],
        debitBalance: debit,
        creditBalance: credit,
      });
    }

    return balances;
  }
}

