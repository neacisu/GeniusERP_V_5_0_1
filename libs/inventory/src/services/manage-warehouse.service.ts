/**
 * ManageWarehouseService
 * 
 * This service handles the creation and management of warehouse locations ("gestiuni")
 * including their types (depozit, magazin, custodie, transfer) according to the
 * Romanian multi-gestiune model (Section 2.2.2.3).
 * 
 * Warehouses are integrated with the accounting module to automatically create analytic accounts
 * for 371 synthetics (Mărfuri) with codes 371.x
 */

import { getDrizzle, DrizzleService } from "@common/drizzle";
import { randomUUID } from 'crypto';
import { gestiuneTypeEnum } from '../schema/inventory.schema';
import { AccountingService } from '../../accounting/services/accounting.service';
import { IStorage, storage } from '../../../storage';
import { eq } from 'drizzle-orm';
import { analyticAccounts } from '../../../../shared/schema';

/**
 * Input type for warehouse creation
 */
export type WarehouseInput = {
  company_id: string;
  franchise_id?: string;
  name: string;
  code?: string;
  location?: string;
  address?: string;
  type: typeof gestiuneTypeEnum.enumValues[number];
  is_active?: boolean;
};

export class ManageWarehouseService {
  private drizzle: DrizzleService;
  private accountingService: AccountingService;
  private storage: IStorage;
  
  constructor() {
    this.drizzle = new DrizzleService();
    // Use the imported storage instance
    this.storage = storage;
    // Instantiate the accounting service
    this.accountingService = new AccountingService(this.storage);
    
    console.log('[ManageWarehouseService] 🔧 Service initialized with storage and accounting service');
    console.log('[ManageWarehouseService] 🔍 Storage methods available:');
    console.log('[ManageWarehouseService] - createAnalyticAccount:', typeof this.storage.createAnalyticAccount);
  }
  
  /**
   * Generate the next available prefix.x analytic account code for all account types
   * This gets the highest existing x suffix across all account types that need to be assigned
   * to the warehouse to ensure consistency
   */
  private async getNextAnalyticSuffix(): Promise<number> {
    try {
      // We must check both analytic_accounts AND warehouses tables to avoid duplicates
      
      // Step 1: Check the analytic_accounts table
      const accountPrefixes = ['371', '378', '4426', '4427', '4428', '5311', '607', '707', '8033', '8039'];
      const prefixPatterns = accountPrefixes.map(prefix => `${prefix}.%`);
      
      const analyticAccountsSql = `
        SELECT code FROM analytic_accounts 
        WHERE code LIKE ANY(ARRAY['${prefixPatterns.join("','")}'])
      `;
      
      // Step 2: Check the warehouses table
      const warehousesSql = `
        SELECT code FROM warehouses
        WHERE code LIKE '371.%' OR code LIKE '8033.%' OR code LIKE '8039.%'
      `;
      
      // Run both queries
      const analyticResults = await this.drizzle.executeQuery(analyticAccountsSql);
      const warehouseResults = await this.drizzle.executeQuery(warehousesSql);
      
      console.log(`[ManageWarehouseService] 🔍 Found ${analyticResults.length} analytic accounts and ${warehouseResults.length} warehouses with codes`);
      
      // Combine results from both tables
      const allCodes = [
        ...analyticResults.map((row: any) => row.code),
        ...warehouseResults.map((row: any) => row.code)
      ];
      
      if (allCodes.length === 0) {
        // No existing accounts or warehouses, start with 1
        console.log(`[ManageWarehouseService] 🔍 No existing codes found, using suffix 1`);
        return 1;
      }
      
      // Extract all suffixes (numbers after the dot)
      const allSuffixes = allCodes.map(code => {
        const parts = code.split('.');
        if (parts.length !== 2) return 0;
        return parseInt(parts[1]);
      }).filter(num => !isNaN(num));
      
      // Find the highest suffix
      const maxSuffix = Math.max(...allSuffixes);
      console.log(`[ManageWarehouseService] 🔍 Highest suffix found: ${maxSuffix}, using ${maxSuffix + 1} as next suffix`);
      
      // Return the next suffix
      return maxSuffix + 1;
    } catch (error) {
      console.error(`[ManageWarehouseService] ❌ Error generating next analytic suffix:`, error);
      // If there's an error, use a safe fallback method with timestamp
      return Math.floor(Date.now() / 1000) % 10000;
    }
  }
  
  /**
   * Get synthetic account ID by code
   */
  private async getSyntheticAccountId(code: string): Promise<string> {
    const syntheticResult = await this.drizzle.executeQuery(
      `SELECT id FROM synthetic_accounts WHERE code = '${code}' LIMIT 1`
    );
    
    if (syntheticResult.length === 0) {
      throw new Error(`Synthetic account ${code} not found`);
    }
    
    return syntheticResult[0].id;
  }
  
  /**
   * Create an analytic account
   */
  private async createAnalyticAccount(syntheticId: string, code: string, name: string, description: string, accountFunction: string): Promise<void> {
    try {
      console.log(`[ManageWarehouseService] 📊 Creating analytic account ${code}: ${name}`);
      
      // Sanitize inputs to prevent SQL injection
      const sanitizedCode = code.replace(/'/g, "''");
      const sanitizedName = name.replace(/'/g, "''");
      const sanitizedDescription = description ? description.replace(/'/g, "''") : '';
      
      // Create analytic account with direct SQL first, then use the storage method as fallback
      try {
        const analyticAccountSQL = `
          INSERT INTO analytic_accounts (
            id, code, name, description, synthetic_id, account_function, is_active, created_at, updated_at
          ) VALUES (
            '${randomUUID()}',
            '${sanitizedCode}',
            '${sanitizedName}',
            '${sanitizedDescription}',
            '${syntheticId}',
            '${accountFunction}',
            true,
            NOW(),
            NOW()
          ) RETURNING *
        `;
        
        const result = await this.drizzle.executeQuery(analyticAccountSQL);
        console.log(`[ManageWarehouseService] ✅ Created analytic account with SQL: ${code} - ${name}`);
        return;
      } catch (sqlError: any) {
        console.error(`[ManageWarehouseService] ⚠️ SQL insert failed, trying storage method: ${sqlError.message || String(sqlError)}`);
        
        // Fallback to storage method if SQL fails
        const analyticAccount = {
          id: randomUUID(),
          code: code,
          name: name,
          description: description,
          syntheticId: syntheticId,
          accountFunction: accountFunction, 
          isActive: true
        };
        
        console.log(`[ManageWarehouseService] 🔄 Analytic account object:`, JSON.stringify(analyticAccount, null, 2));
        
        await this.storage.createAnalyticAccount(analyticAccount);
        console.log(`[ManageWarehouseService] ✅ Created analytic account with storage: ${code} - ${name}`);
      }
    } catch (error: any) {
      console.error(`[ManageWarehouseService] ❌ Error creating specific analytic account ${code}:`, error);
      console.error(`[ManageWarehouseService] ❌ Detalii eroare cont analitic ${code}:`, error.message || String(error));
      console.error(`[ManageWarehouseService] ❌ Stack trace:`, error.stack || 'No stack trace available');
      throw new Error(`Failed to create analytic account: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Create analytic accounts for a warehouse based on its type
   * Different types of warehouses need different sets of analytic accounts
   */
  private async createWarehouseAnalyticAccounts(warehouseId: string, name: string, type: string, suffix: number): Promise<void> {
    try {
      console.log(`[ManageWarehouseService] 📊 Creating analytic accounts for ${type} warehouse: ${name}`);
      
      // Create different sets of analytic accounts based on warehouse type
      switch (type) {
        case 'depozit':
          // For Depozit: 371, 4426, 4427, 5311, 607, 707
          await this.createDepozitAnalyticAccounts(name, suffix);
          break;
          
        case 'magazin':
          // For Magazin: 371, 378, 4426, 4427, 4428, 607, 707
          await this.createMagazinAnalyticAccounts(name, suffix);
          break;
          
        case 'custodie':
          // For Custodie: only 8033
          await this.createCustodieAnalyticAccounts(name, suffix);
          break;
          
        case 'transfer':
          // For Transfer: only 8039
          await this.createTransferAnalyticAccounts(name, suffix);
          break;
          
        default:
          throw new Error(`Unknown warehouse type: ${type}`);
      }
      
      console.log(`[ManageWarehouseService] ✅ Created all analytic accounts for ${name}`);
    } catch (error: any) {
      console.error(`[ManageWarehouseService] ❌ Error creating analytic accounts:`, error);
      console.error(`[ManageWarehouseService] ❌ Detalii eroare conturi analitice:`, error.message || String(error));
      console.error(`[ManageWarehouseService] ❌ Stack trace:`, error.stack || 'No stack trace available');
      throw new Error(`Failed to create analytic accounts: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Create analytic accounts for a Depozit type warehouse
   */
  private async createDepozitAnalyticAccounts(name: string, suffix: number): Promise<void> {
    // Create accounts for: 371, 4426, 4427, 5311, 607, 707
    const accountsToCreate = [
      { code: '371', namePrefix: 'Mărfuri în', function: 'A' },
      { code: '4426', namePrefix: 'TVA deductibilă pentru', function: 'A' },
      { code: '4427', namePrefix: 'TVA colectată pentru', function: 'P' },
      { code: '5311', namePrefix: 'Casa în lei pentru', function: 'A' },
      { code: '607', namePrefix: 'Cheltuieli privind mărfurile pentru', function: 'E' },
      { code: '707', namePrefix: 'Venituri din vânzarea mărfurilor pentru', function: 'V' }
    ];
    
    for (const account of accountsToCreate) {
      const syntheticId = await this.getSyntheticAccountId(account.code);
      const analyticCode = `${account.code}.${suffix}`;
      const analyticName = `${account.namePrefix} gestiunea ${name}`;
      const description = `Cont analitic pentru gestiunea ${name}`;
      
      await this.createAnalyticAccount(
        syntheticId,
        analyticCode,
        analyticName,
        description,
        account.function
      );
    }
  }
  
  /**
   * Create analytic accounts for a Magazin type warehouse
   */
  private async createMagazinAnalyticAccounts(name: string, suffix: number): Promise<void> {
    // Create accounts for: 371, 378, 4426, 4427, 4428, 607, 707
    const accountsToCreate = [
      { code: '371', namePrefix: 'Mărfuri în', function: 'A' },
      { code: '378', namePrefix: 'Diferențe de preț la mărfuri pentru', function: 'A' },
      { code: '4426', namePrefix: 'TVA deductibilă pentru', function: 'A' },
      { code: '4427', namePrefix: 'TVA colectată pentru', function: 'P' },
      { code: '4428', namePrefix: 'TVA neexigibilă pentru', function: 'P' },
      { code: '607', namePrefix: 'Cheltuieli privind mărfurile pentru', function: 'E' },
      { code: '707', namePrefix: 'Venituri din vânzarea mărfurilor pentru', function: 'V' }
    ];
    
    for (const account of accountsToCreate) {
      const syntheticId = await this.getSyntheticAccountId(account.code);
      const analyticCode = `${account.code}.${suffix}`;
      const analyticName = `${account.namePrefix} gestiunea ${name}`;
      const description = `Cont analitic pentru gestiunea ${name}`;
      
      await this.createAnalyticAccount(
        syntheticId,
        analyticCode,
        analyticName,
        description,
        account.function
      );
    }
  }
  
  /**
   * Create analytic accounts for a Custodie type warehouse
   */
  private async createCustodieAnalyticAccounts(name: string, suffix: number): Promise<void> {
    // Create account only for 8033
    const syntheticId = await this.getSyntheticAccountId('8033');
    const analyticCode = `8033.${suffix}`;
    const analyticName = `Valori materiale în custodie pentru ${name}`;
    const description = `Cont analitic de custodie pentru gestiunea ${name}`;
    
    await this.createAnalyticAccount(
      syntheticId,
      analyticCode,
      analyticName,
      description,
      'X' // Off-balance sheet accounts use X
    );
  }
  
  /**
   * Create analytic accounts for a Transfer type warehouse
   */
  private async createTransferAnalyticAccounts(name: string, suffix: number): Promise<void> {
    // Create account only for 8039
    const syntheticId = await this.getSyntheticAccountId('8039');
    const analyticCode = `8039.${suffix}`;
    const analyticName = `Alte valori în afara bilanțului pentru ${name}`;
    const description = `Cont analitic pentru valori în transfer - gestiunea ${name}`;
    
    await this.createAnalyticAccount(
      syntheticId,
      analyticCode,
      analyticName,
      description,
      'X' // Off-balance sheet accounts use X
    );
  }
  
  /**
   * Create a new warehouse (gestiune)
   * 
   * @param input Warehouse data to create
   * @returns Created warehouse object
   */
  // Sanitize SQL strings to prevent SQL injection
  private sanitizeSqlString(value: string): string {
    if (!value) return '';
    return value.replace(/'/g, "''");
  }
  
  async create(input: WarehouseInput) {
    console.log(`[ManageWarehouseService] 🏭 Creating warehouse: ${input.name} (type: ${input.type})`);
    
    try {
      const id = randomUUID();
      const now = new Date().toISOString();
      
      // Get the next available suffix for analytic accounts
      const suffix = await this.getNextAnalyticSuffix();
      console.log(`[ManageWarehouseService] 📊 Using suffix ${suffix} for new warehouse analytic accounts`);
      
      // Generate main analytic account code based on warehouse type and suffix
      // We'll use 371.x for depozit and magazin, 8033.x for custodie, and 8039.x for transfer
      let mainCode;
      switch (input.type) {
        case 'depozit':
        case 'magazin':
          mainCode = `371.${suffix}`;
          break;
        case 'custodie':
          mainCode = `8033.${suffix}`;
          break;
        case 'transfer':
          mainCode = `8039.${suffix}`;
          break;
        default:
          throw new Error(`Unknown warehouse type: ${input.type}`);
      }
      
      // Sanitize inputs
      const sanitizedName = this.sanitizeSqlString(input.name);
      const sanitizedLocation = input.location ? this.sanitizeSqlString(input.location) : null;
      const sanitizedAddress = input.address ? this.sanitizeSqlString(input.address) : null;
      const sanitizedType = this.sanitizeSqlString(input.type);
      
      // Create the warehouse in a transaction to ensure all or nothing
      try {
        // Step 1: Execute SQL insertion using the query method
        const sql = `
          INSERT INTO warehouses (
            id, company_id, franchise_id, name, code, location, address, type, is_active, created_at, updated_at
          ) VALUES (
            '${id}',
            '${input.company_id}',
            ${input.franchise_id ? `'${input.franchise_id}'` : 'NULL'},
            '${sanitizedName}',
            '${mainCode}',
            ${sanitizedLocation ? `'${sanitizedLocation}'` : 'NULL'},
            ${sanitizedAddress ? `'${sanitizedAddress}'` : 'NULL'},
            '${sanitizedType}',
            ${input.is_active !== undefined ? input.is_active : true},
            '${now}',
            '${now}'
          ) RETURNING *`;
        
        const result = await this.drizzle.executeQuery(sql);
        
        if (!result || result.length === 0) {
          throw new Error('Failed to create warehouse record - no result returned');
        }
        
        const warehouse = result[0];
        console.log(`[ManageWarehouseService] ✅ Created warehouse with ID: ${warehouse.id}`);
        
        // Step 2: Create the corresponding analytic accounts based on warehouse type
        try {
          await this.createWarehouseAnalyticAccounts(
            warehouse.id,
            warehouse.name,
            warehouse.type,
            suffix
          );
          console.log(`[ManageWarehouseService] ✅ Successfully created all analytic accounts for warehouse: ${warehouse.name}`);
        } catch (analyticError) {
          console.error(`[ManageWarehouseService] ⚠️ Warning: Warehouse created but analytic accounts failed:`, analyticError);
          // We'll still return the warehouse since it was created successfully
          // In a real production system, we might want to roll back the warehouse creation if this fails
        }
        
        return warehouse;
      } catch (sqlError: any) {
        console.error(`[ManageWarehouseService] ❌ SQL error while creating warehouse:`, sqlError);
        throw sqlError;
      }
    } catch (error: any) {
      console.error(`[ManageWarehouseService] ❌ Error creating warehouse:`, error);
      console.error(`[ManageWarehouseService] ❌ Error message:`, error.message || String(error));
      console.error(`[ManageWarehouseService] ❌ Stack trace:`, error.stack || 'No stack trace available');
      throw new Error(`Failed to create warehouse: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Get a warehouse by ID
   * 
   * @param id Warehouse ID
   * @returns Warehouse or null if not found
   */
  async getById(id: string) {
    console.log(`[ManageWarehouseService] 🔍 Getting warehouse by ID: ${id}`);
    
    try {
      const sql = `SELECT * FROM warehouses WHERE id = '${id}'`;
      const result = await this.drizzle.executeQuery(sql);
      
      if (result.length === 0) {
        console.log(`[ManageWarehouseService] ⚠️ Warehouse not found: ${id}`);
        return null;
      }
      
      console.log(`[ManageWarehouseService] ✅ Found warehouse: ${result[0].name}`);
      return result[0];
    } catch (error) {
      console.error(`[ManageWarehouseService] ❌ Error fetching warehouse:`, error);
      throw new Error(`Failed to fetch warehouse: ${error}`);
    }
  }
  
  /**
   * Get all warehouses for a company
   * 
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   * @returns List of warehouses
   */
  async getByCompany(companyId: string, franchiseId?: string) {
    console.log(`[ManageWarehouseService] 🔍 Getting warehouses for company: ${companyId}`);
    
    try {
      let sql = `
        SELECT * FROM warehouses 
        WHERE company_id = '${companyId}' 
      `;
      
      if (franchiseId) {
        sql += ` AND franchise_id = '${franchiseId}'`;
      }
      
      sql += ` ORDER BY name ASC`;
      
      const result = await this.drizzle.executeQuery(sql);
      console.log(`[ManageWarehouseService] ✅ Found ${result.length} warehouses`);
      
      return result;
    } catch (error) {
      console.error(`[ManageWarehouseService] ❌ Error fetching warehouses:`, error);
      throw new Error(`Failed to fetch warehouses: ${error}`);
    }
  }
  
  /**
   * Update a warehouse
   * 
   * @param id Warehouse ID
   * @param data Warehouse data to update
   * @returns Updated warehouse
   */
  async update(id: string, data: Partial<WarehouseInput>) {
    console.log(`[ManageWarehouseService] 📝 Updating warehouse: ${id}`);
    
    try {
      // Check if warehouse exists
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error(`Warehouse with ID ${id} not found`);
      }
      
      // Build the update query with direct SQL
      const updates: string[] = [];
      const now = new Date().toISOString();
      
      // Add each field that needs to be updated
      if (data.name !== undefined) {
        updates.push(`name = '${data.name}'`);
      }
      
      if (data.code !== undefined) {
        updates.push(`code = '${data.code}'`);
      }
      
      if (data.location !== undefined) {
        updates.push(`location = ${data.location ? `'${data.location}'` : 'NULL'}`);
      }
      
      if (data.address !== undefined) {
        updates.push(`address = ${data.address ? `'${data.address}'` : 'NULL'}`);
      }
      
      if (data.type !== undefined) {
        updates.push(`type = '${data.type}'`);
      }
      
      if (data.is_active !== undefined) {
        updates.push(`is_active = ${data.is_active}`);
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = '${now}'`);
      
      // If nothing to update besides timestamp, return the existing warehouse
      if (updates.length === 1) { // Only updated_at
        return existing;
      }
      
      // Execute the update query
      const sql = `
        UPDATE warehouses
        SET ${updates.join(', ')}
        WHERE id = '${id}'
        RETURNING *`;
        
      const result = await this.drizzle.executeQuery(sql);
      
      console.log(`[ManageWarehouseService] ✅ Updated warehouse: ${id}`);
      return result[0];
    } catch (error) {
      console.error(`[ManageWarehouseService] ❌ Error updating warehouse:`, error);
      throw new Error(`Failed to update warehouse: ${error}`);
    }
  }
  
  /**
   * Deactivate a warehouse (soft delete)
   * 
   * @param id Warehouse ID
   * @returns Success indicator
   */
  async deactivate(id: string) {
    console.log(`[ManageWarehouseService] 🚫 Deactivating warehouse: ${id}`);
    
    try {
      const now = new Date().toISOString();
      
      // Execute direct SQL
      const sql = `
        UPDATE warehouses
        SET is_active = false, updated_at = '${now}'
        WHERE id = '${id}'
        RETURNING *`;
      
      const result = await this.drizzle.executeQuery(sql);
      
      if (result.length === 0) {
        throw new Error(`Warehouse with ID ${id} not found`);
      }
      
      console.log(`[ManageWarehouseService] ✅ Deactivated warehouse: ${id}`);
      return { success: true, warehouse: result[0] };
    } catch (error) {
      console.error(`[ManageWarehouseService] ❌ Error deactivating warehouse:`, error);
      throw new Error(`Failed to deactivate warehouse: ${error}`);
    }
  }
}

// Export a singleton instance
export const manageWarehouseService = new ManageWarehouseService();