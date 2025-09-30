/**
 * ManageWarehouseService
 * 
 * This service handles the creation and management of warehouse locations ("gestiuni")
 * including their types (depozit, magazin, custodie, transfer) according to the
 * Romanian multi-gestiune model (Section 2.2.2.3).
 */

import { getDrizzle } from '../../../common/drizzle/drizzle.service';
import { randomUUID } from 'crypto';
import { gestiuneTypeEnum } from '../schema/inventory.schema';

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
  private drizzle: any;
  
  constructor() {
    this.drizzle = {
      query: async (sql: string) => {
        const db = getDrizzle();
        return db.execute(sql);
      }
    };
  }
  
  /**
   * Create a new warehouse (gestiune)
   * 
   * @param input Warehouse data to create
   * @returns Created warehouse object
   */
  async create(input: WarehouseInput) {
    console.log(`[ManageWarehouseService] 🏭 Creating warehouse: ${input.name} (type: ${input.type})`);
    
    try {
      const id = randomUUID();
      const now = new Date().toISOString();
      
      // Generate code if not provided
      const code = input.code || input.name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      // Execute SQL insertion using the query method
      const sql = `
        INSERT INTO warehouses (
          id, company_id, franchise_id, name, code, location, address, type, is_active, created_at, updated_at
        ) VALUES (
          '${id}',
          '${input.company_id}',
          ${input.franchise_id ? `'${input.franchise_id}'` : 'NULL'},
          '${input.name}',
          '${code}',
          ${input.location ? `'${input.location}'` : 'NULL'},
          ${input.address ? `'${input.address}'` : 'NULL'},
          '${input.type}',
          ${input.is_active !== undefined ? input.is_active : true},
          '${now}',
          '${now}'
        ) RETURNING *`;
      
      const result = await this.drizzle.query(sql);
      
      const warehouse = result[0];
      console.log(`[ManageWarehouseService] ✅ Created warehouse with ID: ${warehouse.id}`);
      
      return warehouse;
    } catch (error) {
      console.error(`[ManageWarehouseService] ❌ Error creating warehouse:`, error);
      throw new Error(`Failed to create warehouse: ${error}`);
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
      const result = await this.drizzle.query(sql);
      
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
      
      const result = await this.drizzle.query(sql);
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
        
      const result = await this.drizzle.query(sql);
      
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
      
      const result = await this.drizzle.query(sql);
      
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