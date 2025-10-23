import { IStorage } from "../../../../apps/api/src/storage";
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { and, eq } from "drizzle-orm";
import {
  AccountClass, AccountGroup, SyntheticAccount, AnalyticAccount,
  JournalEntry,
  InsertJournalEntry, InsertJournalLine
} from "../../../shared/src/schema";
import { RedisService } from "@common/services/redis.service";

/**
 * Accounting Service with Redis caching for Chart of Accounts
 * Cache TTLs:
 * - Account classes: 24h (86400s) - rarely change
 * - Account groups: 24h (86400s) - rarely change
 * - Synthetic accounts: 12h (43200s) - occasionally updated
 * - Analytic accounts: 12h (43200s) - frequently updated
 */
export class AccountingService {
  private drizzleService: DrizzleService;
  private redisService: RedisService;

  constructor(private storage: IStorage) {
    this.drizzleService = new DrizzleService();
    this.redisService = new RedisService();
  }
  
  /**
   * Initialize Redis connection (call before first use)
   */
  private async ensureRedisConnection(): Promise<void> {
    if (!this.redisService.isConnected()) {
      await this.redisService.connect();
    }
  }
  
  // Account Classes
  async getAccountClasses(): Promise<AccountClass[]> {
    await this.ensureRedisConnection();
    
    const cacheKey = 'acc:chart:classes:all';
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AccountClass[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const classes = await this.storage.getAccountClasses();
    
    // Cache for 24 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, classes, 86400);
    }
    
    return classes;
  }
  
  async getAccountClass(id: string): Promise<AccountClass | undefined> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:chart:class:${id}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AccountClass>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const accountClass = await this.storage.getAccountClass(id);
    
    // Cache for 24 hours
    if (accountClass && this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, accountClass, 86400);
    }
    
    return accountClass;
  }
  
  async getAccountClassByCode(code: string): Promise<AccountClass | undefined> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:chart:class:code:${code}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AccountClass>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const accountClass = await this.storage.getAccountClassByCode(code);
    
    // Cache for 24 hours
    if (accountClass && this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, accountClass, 86400);
    }
    
    return accountClass;
  }
  
  // Account Groups
  async getAccountGroups(): Promise<AccountGroup[]> {
    await this.ensureRedisConnection();
    
    const cacheKey = 'acc:chart:groups:all';
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AccountGroup[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const groups = await this.storage.getAccountGroups();
    
    // Cache for 24 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, groups, 86400);
    }
    
    return groups;
  }
  
  async getAccountGroupsByClass(classId: string): Promise<AccountGroup[]> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:chart:groups:class:${classId}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AccountGroup[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const groups = await this.storage.getAccountGroupsByClass(classId);
    
    // Cache for 24 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, groups, 86400);
    }
    
    return groups;
  }
  
  async getAccountGroup(id: string): Promise<AccountGroup | undefined> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:chart:group:${id}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AccountGroup>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const group = await this.storage.getAccountGroup(id);
    
    // Cache for 24 hours
    if (group && this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, group, 86400);
    }
    
    return group;
  }
  
  // Synthetic Accounts
  async getSyntheticAccounts(): Promise<SyntheticAccount[]> {
    await this.ensureRedisConnection();
    
    const cacheKey = 'acc:chart:synthetic:all';
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<SyntheticAccount[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const accounts = await this.storage.getSyntheticAccounts();
    
    // Cache for 12 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, accounts, 43200);
    }
    
    return accounts;
  }
  
  async getSyntheticAccountsByGroup(groupId: string): Promise<SyntheticAccount[]> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:chart:synthetic:group:${groupId}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<SyntheticAccount[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const accounts = await this.storage.getSyntheticAccountsByGroup(groupId);
    
    // Cache for 12 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, accounts, 43200);
    }
    
    return accounts;
  }
  
  async getSyntheticAccountsByGrade(grade: number): Promise<SyntheticAccount[]> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:chart:synthetic:grade:${grade}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<SyntheticAccount[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const accounts = await this.storage.getSyntheticAccountsByGrade(grade);
    
    // Cache for 12 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, accounts, 43200);
    }
    
    return accounts;
  }
  
  async getSyntheticAccount(id: string): Promise<SyntheticAccount | undefined> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:chart:synthetic:${id}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<SyntheticAccount>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const account = await this.storage.getSyntheticAccount(id);
    
    // Cache for 12 hours
    if (account && this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, account, 43200);
    }
    
    return account;
  }
  
  // Analytic Accounts
  async getAnalyticAccounts(): Promise<AnalyticAccount[]> {
    await this.ensureRedisConnection();
    
    const cacheKey = 'acc:chart:analytic:all';
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AnalyticAccount[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const accounts = await this.storage.getAnalyticAccounts();
    
    // Cache for 12 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, accounts, 43200);
    }
    
    return accounts;
  }
  
  async getAnalyticAccountsBySynthetic(syntheticId: string): Promise<AnalyticAccount[]> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:chart:analytic:synthetic:${syntheticId}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AnalyticAccount[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const accounts = await this.storage.getAnalyticAccountsBySynthetic(syntheticId);
    
    // Cache for 12 hours
    if (this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, accounts, 43200);
    }
    
    return accounts;
  }
  
  async getAnalyticAccount(id: string): Promise<AnalyticAccount | undefined> {
    await this.ensureRedisConnection();
    
    const cacheKey = `acc:chart:analytic:${id}`;
    
    if (this.redisService.isConnected()) {
      const cached = await this.redisService.getCached<AnalyticAccount>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const account = await this.storage.getAnalyticAccount(id);
    
    // Cache for 12 hours
    if (account && this.redisService.isConnected()) {
      await this.redisService.setCached(cacheKey, account, 43200);
    }
    
    return account;
  }
  
  async createAnalyticAccount(accountData: any): Promise<AnalyticAccount> {
    const account = await this.storage.createAnalyticAccount(accountData);
    
    // Invalidate cache after create
    await this.ensureRedisConnection();
    if (this.redisService.isConnected()) {
      await this.redisService.invalidatePattern('acc:chart:analytic:*');
    }
    
    return account;
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
    // Get suppliers from CRM companies table where isSupplier is true using Drizzle ORM
    const { crm_companies } = await import('../../../crm/src/schema/crm.schema');
    
    return this.drizzleService.db
      .select()
      .from(crm_companies)
      .where(and(
        eq(crm_companies.companyId, companyId),
        eq(crm_companies.isSupplier, true)
      ))
      .orderBy(crm_companies.name);
  }

  /**
   * Get supplier by ID for a company
   */
  async getSupplier(supplierId: string, companyId: string): Promise<any> {
    // Get supplier using Drizzle ORM
    const { crm_companies } = await import('../../../crm/src/schema/crm.schema');
    
    const result = await this.drizzleService.db
      .select()
      .from(crm_companies)
      .where(and(
        eq(crm_companies.id, supplierId),
        eq(crm_companies.companyId, companyId),
        eq(crm_companies.isSupplier, true)
      ))
      .limit(1);
    
    return result[0] || null;
  }
}