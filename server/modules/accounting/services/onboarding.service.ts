/**
 * Onboarding Service
 * 
 * Service for onboarding companies with accounting history:
 * - Start onboarding process
 * - Import chart of accounts
 * - Import opening balances
 * - Validate balances
 * - Finalize onboarding
 * 
 * Enhanced cu Redis caching (TTL: 5min pentru status - apelat frecvent în UI!)
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
import { RedisService } from '../../../services/redis.service';
import * as XLSX from 'xlsx';

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
  private redisService: RedisService;

  constructor() {
    super();
    this.settingsService = new AccountingSettingsService();
    this.redisService = new RedisService();
  }

  private async ensureRedisConnection(): Promise<void> {
    if (!this.redisService.isConnected()) {
      await this.redisService.connect();
    }
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

    // Invalidate onboarding status cache
    await this.ensureRedisConnection();
    if (this.redisService.isConnected()) {
      await this.redisService.invalidatePattern(`acc:onboarding:status:${companyId}:*`);
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

    // Invalidate onboarding status cache
    await this.ensureRedisConnection();
    if (this.redisService.isConnected()) {
      await this.redisService.invalidatePattern(`acc:onboarding:status:${companyId}:*`);
    }

    return result;
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

    // Invalidate onboarding status cache
    await this.ensureRedisConnection();
    if (this.redisService.isConnected()) {
      await this.redisService.invalidatePattern(`acc:onboarding:status:${companyId}:*`);
    }

    return settings;
  }

  /**
   * Get onboarding status for a company
   */
  async getOnboardingStatus(companyId: string, fiscalYear: number): Promise<OnboardingStatus> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:onboarding:status:${companyId}:${fiscalYear}`;
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<OnboardingStatus>(cacheKey);
      if (cached) {
        return cached;
      }
    }

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

    const status = {
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

    // Cache for 5 minutes (frequently accessed in UI progress bars)
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, status, 300);
    }

    return status;
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

  /**
   * Parse Excel file and extract column headers
   */
  parseExcelHeaders(fileBuffer: Buffer): { columns: string[]; preview: any[][] } {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON with header row
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length === 0) {
      throw new Error('Fișierul Excel este gol');
    }
    
    // First row is headers
    const columns = data[0].map((col: any) => String(col || '').trim());
    
    // Get first 5 rows as preview (excluding header)
    const preview = data.slice(1, 6);
    
    return { columns, preview };
  }

  /**
   * Parse Excel file with column mapping for opening balances
   */
  parseExcelWithMapping(
    fileBuffer: Buffer,
    columnMapping: {
      accountCode: string;
      accountName: string;
      debit: string;
      credit: string;
    }
  ): ImportBalanceData[] {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON with headers
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
    
    if (data.length === 0) {
      throw new Error('Fișierul Excel nu conține date');
    }
    
    const balances: ImportBalanceData[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        const accountCode = String(row[columnMapping.accountCode] || '').trim();
        const accountName = String(row[columnMapping.accountName] || '').trim();
        const debit = String(row[columnMapping.debit] || '0').trim();
        const credit = String(row[columnMapping.credit] || '0').trim();
        
        // Skip empty rows
        if (!accountCode && !accountName) {
          continue;
        }
        
        // Skip if both debit and credit are zero
        if (parseFloat(debit) === 0 && parseFloat(credit) === 0) {
          continue;
        }
        
        balances.push({
          accountCode,
          accountName,
          debitBalance: debit,
          creditBalance: credit,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Eroare necunoscută';
        throw new Error(`Eroare la procesarea rândului ${i + 2}: ${errorMsg}`);
      }
    }
    
    if (balances.length === 0) {
      throw new Error('Nu s-au găsit înregistrări valide în fișierul Excel');
    }
    
    return balances;
  }

  /**
   * Generate Excel template with sample data
   */
  generateExcelTemplate(): Buffer {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Define template data with headers and examples
    const templateData = [
      // Header row with instructions
      ['TEMPLATE SOLDURI INIȚIALE - Completați datele mai jos'],
      [],
      // Column headers
      ['Cod Cont', 'Denumire Cont', 'Debit', 'Credit', 'Observații (opțional)'],
      // Instructions row
      ['(obligatoriu)', '(obligatoriu)', '(obligatoriu)', '(obligatoriu)', '(facultativ)'],
      [],
      // Example data - Active (Class 1-3)
      ['1012', 'Capital social subscris varsat', '0', '100000', 'Capital social la înființare'],
      ['1068', 'Alte rezerve', '0', '25000', 'Rezerve legale'],
      ['2131', 'Echipamente tehnologice', '150000', '0', 'Mașini și utilaje'],
      ['2814', 'Amortizarea echipamentelor', '0', '45000', 'Amortizare cumulată'],
      ['3011', 'Materii prime', '75000', '0', 'Stoc materii prime'],
      ['3021', 'Materiale consumabile', '15000', '0', 'Materiale auxiliare'],
      [],
      // Example data - Passive (Class 4)
      ['4011', 'Furnizori', '0', '35000', 'Furnizori facturi neachitate'],
      ['4111', 'Clienți', '42000', '0', 'Clienți facturi neîncasate'],
      ['4211', 'Personal - salarii datorate', '0', '18000', 'Salarii luna precedentă'],
      ['4311', 'Contribuții asigurări sociale', '0', '6500', 'CAS/CASS/șomaj'],
      ['4426', 'TVA deductibilă', '9500', '0', 'TVA de recuperat'],
      ['4427', 'TVA colectată', '0', '11400', 'TVA de plată'],
      [],
      // Example data - Banking (Class 5)
      ['5121', 'Conturi la bănci în lei', '125000', '0', 'Sold curent BCR'],
      ['5311', 'Casa în lei', '8000', '0', 'Numerar în casă'],
      [],
      // Example data - Income/Expenses (Class 6-7)
      ['6024', 'Cheltuieli cu materiile prime', '0', '0', 'Se va completa la final de an'],
      ['7011', 'Venituri din vânzarea produselor', '0', '0', 'Se va completa la final de an'],
      [],
      // Empty rows for user data
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ];
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 },  // Cod Cont
      { wch: 35 },  // Denumire Cont
      { wch: 15 },  // Debit
      { wch: 15 },  // Credit
      { wch: 40 },  // Observații
    ];
    
    // Merge cells for title
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Solduri Inițiale');
    
    // Add instructions sheet
    const instructionsData = [
      ['INSTRUCȚIUNI DE UTILIZARE'],
      [],
      ['1. Completați coloanele obligatorii:'],
      ['   - Cod Cont: Codul contului sintetic (ex: 1012, 5121)'],
      ['   - Denumire Cont: Numele complet al contului'],
      ['   - Debit: Soldul debitor (dacă este cazul, altfel 0)'],
      ['   - Credit: Soldul creditor (dacă este cazul, altfel 0)'],
      [],
      ['2. Coloane facultative:'],
      ['   - Observații: Note suplimentare despre cont'],
      [],
      ['3. Reguli importante:'],
      ['   - Total Debit TREBUIE să fie egal cu Total Credit'],
      ['   - Nu introduceți sume negative'],
      ['   - Folosiți doar cifre pentru Debit și Credit (fără simboluri)'],
      ['   - Puteți șterge rândurile cu exemple și adăuga propriile date'],
      [],
      ['4. După completare:'],
      ['   - Salvați fișierul'],
      ['   - Încărcați în aplicație la Pasul 2 - Import Solduri'],
      ['   - Mapați coloanele (dacă aveți nume diferite)'],
      ['   - Importați datele'],
      [],
      ['5. Exemplu de calcul balanță:'],
      ['   DEBIT: 150000 + 75000 + 15000 + 42000 + 9500 + 125000 + 8000 = 424,500'],
      ['   CREDIT: 100000 + 25000 + 45000 + 35000 + 18000 + 6500 + 11400 = 240,900'],
      ['   ⚠️ În exemplul de mai sus, balanța NU este echilibrată!'],
      ['   ✅ Asigurați-vă că suma totală Debit = suma totală Credit'],
    ];
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucțiuni');
    
    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return buffer;
  }
}

