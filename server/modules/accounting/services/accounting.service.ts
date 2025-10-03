import { IStorage } from "../../../storage";
import { DrizzleService } from "../../../common/drizzle/drizzle.service";
import {
  AccountClass, AccountGroup, SyntheticAccount, AnalyticAccount,
  JournalEntry, JournalLine,
  InsertJournalEntry, InsertJournalLine
} from "@shared/schema";

export class AccountingService {
  private drizzleService: DrizzleService;

  constructor(private storage: IStorage) {
    this.drizzleService = new DrizzleService();
  }
  
  // Account Classes
  async getAccountClasses(): Promise<AccountClass[]> {
    return this.storage.getAccountClasses();
  }
  
  async getAccountClass(id: string): Promise<AccountClass | undefined> {
    return this.storage.getAccountClass(id);
  }
  
  async getAccountClassByCode(code: string): Promise<AccountClass | undefined> {
    return this.storage.getAccountClassByCode(code);
  }
  
  // Account Groups
  async getAccountGroups(): Promise<AccountGroup[]> {
    return this.storage.getAccountGroups();
  }
  
  async getAccountGroupsByClass(classId: string): Promise<AccountGroup[]> {
    return this.storage.getAccountGroupsByClass(classId);
  }
  
  async getAccountGroup(id: string): Promise<AccountGroup | undefined> {
    return this.storage.getAccountGroup(id);
  }
  
  // Synthetic Accounts
  async getSyntheticAccounts(): Promise<SyntheticAccount[]> {
    return this.storage.getSyntheticAccounts();
  }
  
  async getSyntheticAccountsByGroup(groupId: string): Promise<SyntheticAccount[]> {
    return this.storage.getSyntheticAccountsByGroup(groupId);
  }
  
  async getSyntheticAccountsByGrade(grade: number): Promise<SyntheticAccount[]> {
    return this.storage.getSyntheticAccountsByGrade(grade);
  }
  
  async getSyntheticAccount(id: string): Promise<SyntheticAccount | undefined> {
    return this.storage.getSyntheticAccount(id);
  }
  
  // Analytic Accounts
  async getAnalyticAccounts(): Promise<AnalyticAccount[]> {
    return this.storage.getAnalyticAccounts();
  }
  
  async getAnalyticAccountsBySynthetic(syntheticId: string): Promise<AnalyticAccount[]> {
    return this.storage.getAnalyticAccountsBySynthetic(syntheticId);
  }
  
  async getAnalyticAccount(id: string): Promise<AnalyticAccount | undefined> {
    return this.storage.getAnalyticAccount(id);
  }
  
  async createAnalyticAccount(accountData: any): Promise<AnalyticAccount> {
    return this.storage.createAnalyticAccount(accountData);
  }
  
  // All Accounts (legacy accounts table - for forms and dropdowns)
  async getAllAccounts(): Promise<any[]> {
    return this.storage.getAccounts();
  }
  
  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    return this.storage.getJournalEntries();
  }
  
  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    return this.storage.getJournalEntry(id);
  }
  
  async createJournalEntry(entry: InsertJournalEntry, lines: InsertJournalLine[]): Promise<JournalEntry> {
    // Validate the journal entry
    this.validateJournalEntry(lines);
    
    // Create the journal entry
    return this.storage.createJournalEntry(entry, lines);
  }
  
  private validateJournalEntry(lines: InsertJournalLine[]): void {
    // Check if the journal entry is balanced
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const line of lines) {
      totalDebit += Number(line.debit || 0);
      totalCredit += Number(line.credit || 0);
    }
    
    if (totalDebit !== totalCredit) {
      throw new Error(`Journal entry is not balanced. Total debit: ${totalDebit}, Total credit: ${totalCredit}`);
    }
    
    // Check if the journal entry has at least two lines
    if (lines.length < 2) {
      throw new Error("Journal entry must have at least two lines");
    }
  }

  /**
   * Get all suppliers for a company
   */
  async getSuppliers(companyId: string): Promise<any[]> {
    // Get suppliers from CRM companies table where isSupplier is true
    const query = `
      SELECT
        id,
        name,
        cui,
        vat_number as "vatNumber",
        registration_number as "registrationNumber",
        address,
        city,
        country,
        postal_code as "postalCode",
        phone,
        email,
        website,
        custom_fields as "customFields",
        analythic_401 as "analythic401",
        analythic_4111 as "analythic4111",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM crm_companies
      WHERE company_id = $1 AND is_supplier = true
      ORDER BY name ASC
    `;

    return this.drizzleService.executeQuery(query, [companyId]);
  }

  /**
   * Get supplier by ID for a company
   */
  async getSupplier(supplierId: string, companyId: string): Promise<any> {
    const query = `
      SELECT
        id,
        name,
        cui,
        vat_number as "vatNumber",
        registration_number as "registrationNumber",
        address,
        city,
        country,
        postal_code as "postalCode",
        phone,
        email,
        website,
        custom_fields as "customFields",
        analythic_401 as "analythic401",
        analythic_4111 as "analythic4111",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM crm_companies
      WHERE id = $1 AND company_id = $2 AND is_supplier = true
    `;

    const result = await this.drizzleService.executeQuery(query, [supplierId, companyId]);
    return result[0] || null;
  }
}