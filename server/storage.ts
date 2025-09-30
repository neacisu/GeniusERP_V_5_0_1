import { companies, users, accounts, accountClasses, accountGroups, syntheticAccounts, analyticAccounts, 
  inventoryProducts, inventoryCategories, inventoryUnits, 
  roles, permissions, userRoles, rolePermissions, auditLogs,
  invoices, invoiceLines, invoiceDetails, invoiceStatus } from "@shared/schema";
import type { User, InsertUser, Company, InsertCompany, 
  Account, InsertAccount, AccountClass, InsertAccountClass, 
  AccountGroup, InsertAccountGroup, SyntheticAccount, InsertSyntheticAccount,
  AnalyticAccount, InsertAnalyticAccount,
  InventoryProduct, InsertInventoryProduct, InventoryCategory, InventoryUnit, 
  JournalEntry, InsertJournalEntry, JournalLine, InsertJournalLine, 
  InventoryStockMovement, InsertInventoryStockMovement,
  Role, Permission, UserRole, RolePermission,
  AuditLog, InsertAuditLog, InsertRole, InsertPermission,
  Invoice, InvoiceLine, InvoiceDetail, 
  InsertInvoice, InsertInvoiceLine, InsertInvoiceDetail } from "@shared/schema";
  
// Import insert schemas directly
import { insertRoleSchema, insertPermissionSchema, insertUserRoleSchema, insertRolePermissionSchema } from "@shared/schema";
import { eq, and, desc, sql, gte, lte, count, countDistinct, sum, max } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { getDrizzle } from './common/drizzle';

// Get the Drizzle ORM database client
const drizzleService = { 
  executeQuery: async (callback: (db: any) => Promise<any>) => {
    const db = getDrizzle();
    return await callback(db);
  } 
};

const MemoryStore = createMemoryStore(session);

// Comprehensive storage interface for all application modules
export interface IStorage {
  // User management
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User>;
  
  // Audit logging
  createAuditLog(auditLog: {
    companyId: string;
    userId?: string | null;
    action: string;
    entity: string;
    entityId: string;
    details: Record<string, any>;
  }): Promise<any>;
  getAuditLogs(options?: {
    companyId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]>;

  // RBAC - Roles Management
  getRoles(companyId?: string): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string, companyId: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, roleData: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  
  // RBAC - Permissions Management
  getPermissions(): Promise<Permission[]>;
  getPermission(id: string): Promise<Permission | undefined>;
  getPermissionByName(name: string): Promise<Permission | undefined>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  
  // RBAC - User-Role Assignment
  getUserRoles(userId: string): Promise<Role[]>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;
  
  // RBAC - Role-Permission Assignment
  getRolePermissions(roleId: string): Promise<Permission[]>;
  assignPermissionToRole(roleId: string, permissionId: string): Promise<void>;
  removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
  
  // Company settings
  getCompany(): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, companyData: Partial<InsertCompany>): Promise<Company>;
  
  // Romanian Chart of Accounts
  // 1. Account Classes (top level)
  getAccountClasses(): Promise<AccountClass[]>;
  getAccountClass(id: string): Promise<AccountClass | undefined>;
  getAccountClassByCode(code: string): Promise<AccountClass | undefined>;
  createAccountClass(accountClass: InsertAccountClass): Promise<AccountClass>;
  updateAccountClass(id: string, accountClassData: Partial<InsertAccountClass>): Promise<AccountClass>;
  
  // 2. Account Groups (second level)
  getAccountGroups(): Promise<AccountGroup[]>;
  getAccountGroupsByClass(classId: string): Promise<AccountGroup[]>;
  getAccountGroup(id: string): Promise<AccountGroup | undefined>;
  getAccountGroupByCode(code: string): Promise<AccountGroup | undefined>;
  createAccountGroup(accountGroup: InsertAccountGroup): Promise<AccountGroup>;
  updateAccountGroup(id: string, accountGroupData: Partial<InsertAccountGroup>): Promise<AccountGroup>;
  
  // 3. Synthetic Accounts (third level - Grade 1 and 2)
  getSyntheticAccounts(): Promise<SyntheticAccount[]>;
  getSyntheticAccountsByGroup(groupId: string): Promise<SyntheticAccount[]>;
  getSyntheticAccountsByGrade(grade: number): Promise<SyntheticAccount[]>;
  getSyntheticAccount(id: string): Promise<SyntheticAccount | undefined>;
  getSyntheticAccountByCode(code: string): Promise<SyntheticAccount | undefined>;
  createSyntheticAccount(syntheticAccount: InsertSyntheticAccount): Promise<SyntheticAccount>;
  updateSyntheticAccount(id: string, syntheticAccountData: Partial<InsertSyntheticAccount>): Promise<SyntheticAccount>;
  
  // 4. Analytic Accounts (fourth level - most detailed)
  getAnalyticAccounts(): Promise<AnalyticAccount[]>;
  getAnalyticAccountsBySynthetic(syntheticId: string): Promise<AnalyticAccount[]>;
  getAnalyticAccount(id: string): Promise<AnalyticAccount | undefined>;
  getAnalyticAccountByCode(code: string): Promise<AnalyticAccount | undefined>;
  createAnalyticAccount(analyticAccount: InsertAnalyticAccount): Promise<AnalyticAccount>;
  updateAnalyticAccount(id: string, analyticAccountData: Partial<InsertAnalyticAccount>): Promise<AnalyticAccount>;
  
  // Legacy Chart of Accounts - maintained for compatibility
  getAccounts(): Promise<Account[]>;
  getAccountsByClass(classCode: string): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, accountData: Partial<InsertAccount>): Promise<Account>;
  
  // Journal entries
  getJournalEntries(): Promise<JournalEntry[]>;
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry, lines: InsertJournalLine[]): Promise<JournalEntry>;
  
  // Inventory
  getProducts(): Promise<InventoryProduct[]>;
  getProduct(id: string): Promise<InventoryProduct | undefined>;
  createProduct(product: InsertInventoryProduct): Promise<InventoryProduct>;
  updateProduct(id: string, productData: Partial<InsertInventoryProduct>): Promise<InventoryProduct>;
  getCategories(): Promise<InventoryCategory[]>;
  getUnits(): Promise<InventoryUnit[]>;
  createStockMovement(movement: InsertInventoryStockMovement): Promise<InventoryStockMovement>;
  
  // Invoicing
  getInvoices(companyId: string, filters?: {
    status?: string;
    series?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceBySeriesAndNumber(series: string, number: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice, details: InsertInvoiceDetail, lines: InsertInvoiceLine[]): Promise<Invoice>;
  updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: string): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  getNextInvoiceNumber(series: string): Promise<number>;
  
  // Session management
  sessionStore: any;
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User Management
  async getUsers(): Promise<User[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(users).orderBy(users.username);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    return drizzleService.executeQuery(async (db) => {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    });
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    return drizzleService.executeQuery(async (db) => {
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    });
  }

  // RBAC - Roles Management
  async getRoles(companyId?: string): Promise<Role[]> {
    return drizzleService.executeQuery(async (db) => {
      if (companyId) {
        return await db.select().from(roles).where(eq(roles.companyId, companyId)).orderBy(roles.name);
      }
      return await db.select().from(roles).orderBy(roles.name);
    });
  }

  async getRole(id: string): Promise<Role | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [role] = await db.select().from(roles).where(eq(roles.id, id));
      return role || undefined;
    });
  }

  async getRoleByName(name: string, companyId: string): Promise<Role | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [role] = await db
        .select()
        .from(roles)
        .where(and(eq(roles.name, name), eq(roles.companyId, companyId)));
      return role || undefined;
    });
  }

  async createRole(role: InsertRole): Promise<Role> {
    return drizzleService.executeQuery(async (db) => {
      const [newRole] = await db.insert(roles).values(role).returning();
      return newRole;
    });
  }

  async updateRole(id: string, roleData: Partial<InsertRole>): Promise<Role> {
    return drizzleService.executeQuery(async (db) => {
      const [updatedRole] = await db
        .update(roles)
        .set(roleData)
        .where(eq(roles.id, id))
        .returning();
      return updatedRole;
    });
  }

  async deleteRole(id: string): Promise<void> {
    return drizzleService.executeQuery(async (db) => {
      await db.delete(roles).where(eq(roles.id, id));
    });
  }

  // RBAC - Permissions Management
  async getPermissions(): Promise<Permission[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(permissions).orderBy(permissions.name);
    });
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
      return permission || undefined;
    });
  }

  async getPermissionByName(name: string): Promise<Permission | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [permission] = await db.select().from(permissions).where(eq(permissions.name, name));
      return permission || undefined;
    });
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    return drizzleService.executeQuery(async (db) => {
      const [newPermission] = await db.insert(permissions).values(permission).returning();
      return newPermission;
    });
  }

  // RBAC - User-Role Assignment
  async getUserRoles(userId: string): Promise<Role[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db
        .select({
          id: roles.id,
          name: roles.name,
          companyId: roles.companyId,
          description: roles.description,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));
    });
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    return drizzleService.executeQuery(async (db) => {
      await db
        .insert(userRoles)
        .values({ userId, roleId })
        .onConflictDoNothing();
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    return drizzleService.executeQuery(async (db) => {
      await db
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
    });
  }

  // RBAC - Role-Permission Assignment
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          resource: permissions.resource,
          action: permissions.action,
          createdAt: permissions.createdAt,
          updatedAt: permissions.updatedAt
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));
    });
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    return drizzleService.executeQuery(async (db) => {
      await db
        .insert(rolePermissions)
        .values({ roleId, permissionId })
        .onConflictDoNothing();
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    return drizzleService.executeQuery(async (db) => {
      await db
        .delete(rolePermissions)
        .where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permissionId)));
    });
  }

  // Company Settings
  async getCompany(): Promise<Company | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [company] = await db.select().from(companies).limit(1);
      return company || undefined;
    });
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    return drizzleService.executeQuery(async (db) => {
      const [newCompany] = await db.insert(companies).values(company).returning();
      return newCompany;
    });
  }

  async updateCompany(id: string, companyData: Partial<InsertCompany>): Promise<Company> {
    return drizzleService.executeQuery(async (db) => {
      const [updatedCompany] = await db
        .update(companies)
        .set(companyData)
        .where(eq(companies.id, id))
        .returning();
      return updatedCompany;
    });
  }

  // Romanian Chart of Accounts
  // 1. Account Classes (top level)
  async getAccountClasses(): Promise<AccountClass[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(accountClasses).orderBy(accountClasses.code);
    });
  }

  async getAccountClass(id: string): Promise<AccountClass | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [accountClass] = await db.select().from(accountClasses).where(eq(accountClasses.id, id));
      return accountClass || undefined;
    });
  }

  async getAccountClassByCode(code: string): Promise<AccountClass | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [accountClass] = await db.select().from(accountClasses).where(eq(accountClasses.code, code));
      return accountClass || undefined;
    });
  }

  async createAccountClass(accountClass: InsertAccountClass): Promise<AccountClass> {
    return drizzleService.executeQuery(async (db) => {
      const [newAccountClass] = await db.insert(accountClasses).values(accountClass).returning();
      return newAccountClass;
    });
  }

  async updateAccountClass(id: string, accountClassData: Partial<InsertAccountClass>): Promise<AccountClass> {
    return drizzleService.executeQuery(async (db) => {
      const [updatedAccountClass] = await db
        .update(accountClasses)
        .set(accountClassData)
        .where(eq(accountClasses.id, id))
        .returning();
      return updatedAccountClass;
    });
  }

  // 2. Account Groups (second level)
  async getAccountGroups(): Promise<AccountGroup[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(accountGroups).orderBy(accountGroups.code);
    });
  }

  async getAccountGroupsByClass(classId: string): Promise<AccountGroup[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db
        .select()
        .from(accountGroups)
        .where(eq(accountGroups.classId, classId))
        .orderBy(accountGroups.code);
    });
  }

  async getAccountGroup(id: string): Promise<AccountGroup | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [accountGroup] = await db.select().from(accountGroups).where(eq(accountGroups.id, id));
      return accountGroup || undefined;
    });
  }

  async getAccountGroupByCode(code: string): Promise<AccountGroup | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [accountGroup] = await db.select().from(accountGroups).where(eq(accountGroups.code, code));
      return accountGroup || undefined;
    });
  }

  async createAccountGroup(accountGroup: InsertAccountGroup): Promise<AccountGroup> {
    return drizzleService.executeQuery(async (db) => {
      const [newAccountGroup] = await db.insert(accountGroups).values(accountGroup).returning();
      return newAccountGroup;
    });
  }

  async updateAccountGroup(id: string, accountGroupData: Partial<InsertAccountGroup>): Promise<AccountGroup> {
    return drizzleService.executeQuery(async (db) => {
      const [updatedAccountGroup] = await db
        .update(accountGroups)
        .set(accountGroupData)
        .where(eq(accountGroups.id, id))
        .returning();
      return updatedAccountGroup;
    });
  }

  // 3. Synthetic Accounts (third level - Grade 1 and 2)
  async getSyntheticAccounts(): Promise<SyntheticAccount[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(syntheticAccounts).orderBy(syntheticAccounts.code);
    });
  }

  async getSyntheticAccountsByGroup(groupId: string): Promise<SyntheticAccount[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db
        .select()
        .from(syntheticAccounts)
        .where(eq(syntheticAccounts.groupId, groupId))
        .orderBy(syntheticAccounts.code);
    });
  }

  async getSyntheticAccountsByGrade(grade: number): Promise<SyntheticAccount[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db
        .select()
        .from(syntheticAccounts)
        .where(eq(syntheticAccounts.grade, grade))
        .orderBy(syntheticAccounts.code);
    });
  }

  async getSyntheticAccount(id: string): Promise<SyntheticAccount | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [syntheticAccount] = await db.select().from(syntheticAccounts).where(eq(syntheticAccounts.id, id));
      return syntheticAccount || undefined;
    });
  }

  async getSyntheticAccountByCode(code: string): Promise<SyntheticAccount | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [syntheticAccount] = await db.select().from(syntheticAccounts).where(eq(syntheticAccounts.code, code));
      return syntheticAccount || undefined;
    });
  }

  async createSyntheticAccount(syntheticAccount: InsertSyntheticAccount): Promise<SyntheticAccount> {
    return drizzleService.executeQuery(async (db) => {
      const [newSyntheticAccount] = await db.insert(syntheticAccounts).values(syntheticAccount).returning();
      return newSyntheticAccount;
    });
  }

  async updateSyntheticAccount(id: string, syntheticAccountData: Partial<InsertSyntheticAccount>): Promise<SyntheticAccount> {
    return drizzleService.executeQuery(async (db) => {
      const [updatedSyntheticAccount] = await db
        .update(syntheticAccounts)
        .set(syntheticAccountData)
        .where(eq(syntheticAccounts.id, id))
        .returning();
      return updatedSyntheticAccount;
    });
  }

  // 4. Analytic Accounts (fourth level - most detailed)
  async getAnalyticAccounts(): Promise<AnalyticAccount[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(analyticAccounts).orderBy(analyticAccounts.code);
    });
  }

  async getAnalyticAccountsBySynthetic(syntheticId: string): Promise<AnalyticAccount[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db
        .select()
        .from(analyticAccounts)
        .where(eq(analyticAccounts.syntheticId, syntheticId))
        .orderBy(analyticAccounts.code);
    });
  }

  async getAnalyticAccount(id: string): Promise<AnalyticAccount | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [analyticAccount] = await db.select().from(analyticAccounts).where(eq(analyticAccounts.id, id));
      return analyticAccount || undefined;
    });
  }

  async getAnalyticAccountByCode(code: string): Promise<AnalyticAccount | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [analyticAccount] = await db.select().from(analyticAccounts).where(eq(analyticAccounts.code, code));
      return analyticAccount || undefined;
    });
  }

  async createAnalyticAccount(analyticAccount: InsertAnalyticAccount): Promise<AnalyticAccount> {
    return drizzleService.executeQuery(async (db) => {
      const [newAnalyticAccount] = await db.insert(analyticAccounts).values(analyticAccount).returning();
      return newAnalyticAccount;
    });
  }

  async updateAnalyticAccount(id: string, analyticAccountData: Partial<InsertAnalyticAccount>): Promise<AnalyticAccount> {
    return drizzleService.executeQuery(async (db) => {
      const [updatedAnalyticAccount] = await db
        .update(analyticAccounts)
        .set(analyticAccountData)
        .where(eq(analyticAccounts.id, id))
        .returning();
      return updatedAnalyticAccount;
    });
  }

  // Legacy Chart of Accounts - maintained for compatibility
  async getAccounts(): Promise<Account[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(accounts).orderBy(accounts.code);
    });
  }

  async getAccountsByClass(classCode: string): Promise<Account[]> {
    return drizzleService.executeQuery(async (db) => {
      // First get the class id based on the code
      const [accountClass] = await db
        .select()
        .from(accountClasses)
        .where(eq(accountClasses.code, classCode));
      
      if (!accountClass) {
        return [];
      }
      
      // Then get all accounts with that class id
      return await db
        .select()
        .from(accounts)
        .where(eq(accounts.classId, accountClass.id))
        .orderBy(accounts.code);
    });
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
      return account || undefined;
    });
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    return drizzleService.executeQuery(async (db) => {
      const [newAccount] = await db.insert(accounts).values(account).returning();
      return newAccount;
    });
  }

  async updateAccount(id: string, accountData: Partial<InsertAccount>): Promise<Account> {
    return drizzleService.executeQuery(async (db) => {
      const [updatedAccount] = await db
        .update(accounts)
        .set(accountData)
        .where(eq(accounts.id, id))
        .returning();
      return updatedAccount;
    });
  }

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.query.journalEntries.findMany({
        with: {
          lines: true,
          createdByUser: true,
        },
        orderBy: desc(sql`journal_entries.created_at`),
      });
    });
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    return drizzleService.executeQuery(async (db) => {
      return await db.query.journalEntries.findFirst({
        where: eq(sql`journal_entries.id`, id),
        with: {
          lines: true,
          createdByUser: true,
        },
      });
    });
  }

  async createJournalEntry(entry: InsertJournalEntry, lines: InsertJournalLine[]): Promise<JournalEntry> {
    return drizzleService.executeQuery(async (db) => {
      // Create the journal entry
      const [journalEntry] = await db
        .insert(sql`journal_entries`)
        .values(entry)
        .returning();
      
      // Add journal ID to each line
      const linesWithJournalId = lines.map(line => ({
        ...line,
        journalId: journalEntry.id,
      }));
      
      // Insert all lines
      await db.insert(sql`journal_lines`).values(linesWithJournalId);
      
      // Return the full journal entry with lines
      return await this.getJournalEntry(journalEntry.id) as JournalEntry;
    });
  }

  // Inventory
  async getProducts(): Promise<InventoryProduct[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(inventoryProducts).orderBy(inventoryProducts.code);
    });
  }

  async getProduct(id: string): Promise<InventoryProduct | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [product] = await db.select().from(inventoryProducts).where(eq(inventoryProducts.id, id));
      return product || undefined;
    });
  }

  async createProduct(product: InsertInventoryProduct): Promise<InventoryProduct> {
    return drizzleService.executeQuery(async (db) => {
      const [newProduct] = await db.insert(inventoryProducts).values(product).returning();
      return newProduct;
    });
  }

  async updateProduct(id: string, productData: Partial<InsertInventoryProduct>): Promise<InventoryProduct> {
    return drizzleService.executeQuery(async (db) => {
      const [updatedProduct] = await db
        .update(inventoryProducts)
        .set(productData)
        .where(eq(inventoryProducts.id, id))
        .returning();
      return updatedProduct;
    });
  }

  async getCategories(): Promise<InventoryCategory[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(inventoryCategories);
    });
  }

  async getUnits(): Promise<InventoryUnit[]> {
    return drizzleService.executeQuery(async (db) => {
      return await db.select().from(inventoryUnits);
    });
  }

  async createStockMovement(movement: InsertInventoryStockMovement): Promise<InventoryStockMovement> {
    return drizzleService.executeQuery(async (db) => {
      const [newMovement] = await db
        .insert(sql`inventory_stock_movements`)
        .values(movement)
        .returning();
      return newMovement;
    });
  }
  
  // Invoicing
  async getInvoices(companyId: string, filters?: {
    status?: string;
    series?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Invoice[]> {
    return drizzleService.executeQuery(async (db) => {
      let query = db.select().from(invoices)
        .where(eq(invoices.companyId, companyId))
        .orderBy(desc(invoices.createdAt));
      
      // Apply filters
      if (filters) {
        if (filters.status) {
          query = query.where(eq(invoices.status, filters.status as any));
        }
        
        if (filters.series) {
          query = query.where(eq(invoices.series, filters.series));
        }
        
        if (filters.fromDate) {
          query = query.where(gte(invoices.createdAt, filters.fromDate));
        }
        
        if (filters.toDate) {
          query = query.where(lte(invoices.createdAt, filters.toDate));
        }
        
        if (filters.limit) {
          query = query.limit(filters.limit);
        }
        
        if (filters.offset) {
          query = query.offset(filters.offset || 0);
        }
      }
      
      return await query;
    });
  }
  
  async getInvoice(id: string): Promise<Invoice | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
      return invoice || undefined;
    });
  }
  
  async getInvoiceBySeriesAndNumber(series: string, number: number): Promise<Invoice | undefined> {
    return drizzleService.executeQuery(async (db) => {
      const [invoice] = await db.select()
        .from(invoices)
        .where(and(
          eq(invoices.series, series),
          eq(invoices.number, number)
        ));
      return invoice || undefined;
    });
  }
  
  async createInvoice(invoice: InsertInvoice, details: InsertInvoiceDetail, lines: InsertInvoiceLine[]): Promise<Invoice> {
    return drizzleService.executeQuery(async (db) => {
      // Start a transaction to ensure all-or-nothing insertion
      return await db.transaction(async (tx) => {
        // 1. Insert the invoice first
        const [newInvoice] = await tx.insert(invoices).values(invoice).returning();
        
        // 2. Insert invoice details
        await tx.insert(invoiceDetails).values({
          ...details,
          invoiceId: newInvoice.id
        });
        
        // 3. Insert invoice lines
        for (const line of lines) {
          await tx.insert(invoiceLines).values({
            ...line,
            invoiceId: newInvoice.id
          });
        }
        
        return newInvoice;
      });
    });
  }
  
  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    return drizzleService.executeQuery(async (db) => {
      // Ensure we're not changing series/number of an issued invoice
      if ((invoiceData.series || invoiceData.number) && invoiceData.status !== 'draft') {
        const currentInvoice = await this.getInvoice(id);
        if (currentInvoice && currentInvoice.status !== 'draft') {
          throw new Error('Cannot change series or number of a non-draft invoice');
        }
      }
      
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          ...invoiceData,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, id))
        .returning();
      return updatedInvoice;
    });
  }
  
  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    return drizzleService.executeQuery(async (db) => {
      // Get current invoice to check if the status transition is valid
      const currentInvoice = await this.getInvoice(id);
      if (!currentInvoice) {
        throw new Error('Invoice not found');
      }
      
      // Enforce the status lifecycle: draft -> issued -> sent -> canceled
      const currentStatus = currentInvoice.status;
      
      // Validate status transition
      if (status === 'issued' && currentStatus !== 'draft') {
        throw new Error('Only draft invoices can be issued');
      } else if (status === 'sent' && currentStatus !== 'issued') {
        throw new Error('Only issued invoices can be sent');
      } else if (status === 'canceled' && !['issued', 'sent'].includes(currentStatus)) {
        throw new Error('Only issued or sent invoices can be canceled');
      } else if (status === 'draft' && currentStatus !== 'draft') {
        throw new Error('Cannot revert to draft status');
      }
      
      // If transitioning from draft to issued, allocate a number
      if (status === 'issued' && currentStatus === 'draft') {
        // Make sure we have a series
        if (!currentInvoice.series) {
          throw new Error('Invoice series must be set before issuing');
        }
        
        // Get the next invoice number
        const nextNumber = await this.getNextInvoiceNumber(currentInvoice.series);
        
        // Update the invoice with the series, number, and status
        const [updatedInvoice] = await db
          .update(invoices)
          .set({
            status: status as any,
            number: nextNumber,
            updatedAt: new Date()
          })
          .where(eq(invoices.id, id))
          .returning();
        
        return updatedInvoice;
      } else {
        // Normal status update
        const [updatedInvoice] = await db
          .update(invoices)
          .set({
            status: status as any,
            updatedAt: new Date()
          })
          .where(eq(invoices.id, id))
          .returning();
        
        return updatedInvoice;
      }
    });
  }
  
  async deleteInvoice(id: string): Promise<void> {
    return drizzleService.executeQuery(async (db) => {
      // Get the invoice to check if it can be deleted
      const invoice = await this.getInvoice(id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Draft invoices can be deleted
      if (invoice.status === 'draft') {
        // Soft delete by setting deletedAt
        await db
          .update(invoices)
          .set({
            deletedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(invoices.id, id));
        return;
      }
      
      // For issued invoices, check if it's the last one in the series
      if (invoice.status === 'issued') {
        // Get the latest invoice with the same series
        const [latestInvoice] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.series, invoice.series!))
          .orderBy(desc(invoices.number))
          .limit(1);
        
        // If this is the last invoice in the series and not sent/canceled
        if (latestInvoice && latestInvoice.id === invoice.id &&
            !['sent', 'canceled'].includes(invoice.status)) {
          // Soft delete by setting deletedAt
          await db
            .update(invoices)
            .set({
              deletedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(invoices.id, id));
          return;
        }
      }
      
      // If we get here, the invoice can't be deleted
      throw new Error(
        'Only draft invoices or the last issued invoice (if not sent or canceled) can be deleted'
      );
    });
  }
  
  async getNextInvoiceNumber(series: string): Promise<number> {
    return drizzleService.executeQuery(async (db) => {
      // Find the highest number for this series
      const [result] = await db
        .select({ maxNumber: max(invoices.number) })
        .from(invoices)
        .where(eq(invoices.series, series));
      
      // Return next number or start from 1
      return (result.maxNumber || 0) + 1;
    });
  }

  // Audit Logging
  async createAuditLog(auditLog: {
    companyId: string;
    userId?: string | null;
    action: string;
    entity: string;
    entityId: string;
    details: Record<string, any>;
  }): Promise<any> {
    return drizzleService.executeQuery(async (db) => {
      // Set timestamp if not provided
      const logEntry = {
        ...auditLog,
        createdAt: new Date(),
        userId: auditLog.userId || null,
      };
      
      const [newLog] = await db.insert(auditLogs).values(logEntry).returning();
      return newLog;
    });
  }

  async getAuditLogs(options?: {
    companyId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    return drizzleService.executeQuery(async (db) => {
      let query = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
      
      if (options) {
        const filters = [];
        if (options.companyId) {
          filters.push(eq(auditLogs.companyId, options.companyId));
        }
        if (options.entity) {
          filters.push(eq(auditLogs.entity, options.entity));
        }
        if (options.entityId) {
          filters.push(eq(auditLogs.entityId, options.entityId));
        }
        if (options.action) {
          filters.push(eq(auditLogs.action, options.action));
        }
        if (options.userId) {
          filters.push(eq(auditLogs.userId, options.userId));
        }
        
        if (filters.length > 0) {
          query = query.where(and(...filters));
        }
        
        if (options.limit) {
          query = query.limit(options.limit);
        }
        
        if (options.offset) {
          query = query.offset(options.offset);
        }
      }
      
      return await query;
    });
  }
}

export const storage = new DatabaseStorage();
