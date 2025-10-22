/**
 * Inventory Service
 * 
 * This service handles the core operations for inventory management,
 * following Romanian accounting standards for stock and warehouse management.
 */

import { IStorage } from "../../../storage";
import { CurrencyService } from "../../integrations/services/currency.service";
import { DrizzleService } from "@common/drizzle";
import { randomUUID } from "crypto";

export class InventoryService {
  private drizzle: DrizzleService;
  
  constructor(
    private storage?: IStorage
  ) {
    this.drizzle = new DrizzleService();
  }

  /**
   * Create a new warehouse (gestiune)
   * 
   * @param warehouseData Warehouse data to create
   * @returns Created warehouse
   */
  async createWarehouse(warehouseData: any) {
    console.log(`[InventoryService] 🏭 Creating warehouse: ${warehouseData.name}`);
    
    try {
      // Add required fields
      const warehouse = {
        ...warehouseData,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Use direct SQL for now since we're working on the Drizzle ORM definitions
      const result = await this.drizzle.executeQuery(
        `INSERT INTO warehouses (
          id, company_id, franchise_id, name, code, location, address, type, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING *`,
        [
          warehouse.id,
          warehouse.companyId,
          warehouse.franchiseId || null,
          warehouse.name,
          warehouse.code,
          warehouse.location || null,
          warehouse.address || null,
          warehouse.type,
          warehouse.isActive !== undefined ? warehouse.isActive : true,
          warehouse.createdAt,
          warehouse.updatedAt
        ]
      );
      
      // Using any as a temporary workaround for the type issues
      const resultAny = result as any;
      console.log(`[InventoryService] ✅ Created warehouse with ID: ${warehouse.id}`);
      return resultAny.rows[0];
    } catch (error) {
      console.error(`[InventoryService] ❌ Error creating warehouse:`, error);
      throw new Error(`Failed to create warehouse: ${error}`);
    }
  }
  
  /**
   * Get all warehouses for a company
   * 
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   * @returns List of warehouses
   */
  async getWarehouses(companyId: string, franchiseId?: string) {
    console.log(`[InventoryService] 🔍 Getting warehouses for company: ${companyId}`);
    
    try {
      let query = `
        SELECT * FROM warehouses 
        WHERE company_id = $1 
      `;
      
      const params: any[] = [companyId];
      
      if (franchiseId) {
        query += ` AND franchise_id = $2`;
        params.push(franchiseId);
      }
      
      query += ` ORDER BY name ASC`;
      
      const result = await this.drizzle.executeQuery(query, params);
      
      // Using any here as a temporary workaround for the type issues
      const resultAny = result as any;
      console.log(`[InventoryService] ✅ Found ${resultAny.rows.length} warehouses`);
      
      return resultAny.rows;
    } catch (error) {
      console.error(`[InventoryService] ❌ Error getting warehouses:`, error);
      throw new Error(`Failed to get warehouses: ${error}`);
    }
  }
  
  /**
   * Get a warehouse by ID
   * 
   * @param warehouseId Warehouse ID
   * @returns Warehouse or null if not found
   */
  async getWarehouse(warehouseId: string) {
    console.log(`[InventoryService] 🔍 Getting warehouse: ${warehouseId}`);
    
    try {
      const result = await this.drizzle.executeQuery(
        `SELECT * FROM warehouses WHERE id = $1`,
        [warehouseId]
      );
      
      // Using any as a temporary workaround for the type issues
      const resultAny = result as any;
      
      if (resultAny.rows.length === 0) {
        return null;
      }
      
      return resultAny.rows[0];
    } catch (error) {
      console.error(`[InventoryService] ❌ Error getting warehouse:`, error);
      throw new Error(`Failed to get warehouse: ${error}`);
    }
  }
  
  /**
   * Update a warehouse
   * 
   * @param warehouseId Warehouse ID
   * @param warehouseData Warehouse data to update
   * @returns Updated warehouse
   */
  async updateWarehouse(warehouseId: string, warehouseData: any) {
    console.log(`[InventoryService] 📝 Updating warehouse: ${warehouseId}`);
    
    try {
      // First, check if the warehouse exists
      const existingWarehouse = await this.getWarehouse(warehouseId);
      
      if (!existingWarehouse) {
        throw new Error(`Warehouse with ID ${warehouseId} not found`);
      }
      
      // Build the update query with only the fields that are provided
      let updateFields = '';
      const params: any[] = [];
      let paramIndex = 1;
      
      if (warehouseData.name !== undefined) {
        updateFields += `name = $${paramIndex}, `;
        params.push(warehouseData.name);
        paramIndex++;
      }
      
      if (warehouseData.code !== undefined) {
        updateFields += `code = $${paramIndex}, `;
        params.push(warehouseData.code);
        paramIndex++;
      }
      
      if (warehouseData.location !== undefined) {
        updateFields += `location = $${paramIndex}, `;
        params.push(warehouseData.location);
        paramIndex++;
      }
      
      if (warehouseData.address !== undefined) {
        updateFields += `address = $${paramIndex}, `;
        params.push(warehouseData.address);
        paramIndex++;
      }
      
      if (warehouseData.type !== undefined) {
        updateFields += `type = $${paramIndex}, `;
        params.push(warehouseData.type);
        paramIndex++;
      }
      
      if (warehouseData.isActive !== undefined) {
        updateFields += `is_active = $${paramIndex}, `;
        params.push(warehouseData.isActive);
        paramIndex++;
      }
      
      // Add the updatedAt field
      updateFields += `updated_at = $${paramIndex}, `;
      params.push(new Date());
      paramIndex++;
      
      // Remove the trailing comma and space
      updateFields = updateFields.slice(0, -2);
      
      // Add the warehouse ID as the last parameter
      params.push(warehouseId);
      
      // Execute the update query
      const result = await this.drizzle.executeQuery(
        `UPDATE warehouses SET ${updateFields} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      
      // Using any as a temporary workaround for the type issues
      const resultAny = result as any;
      console.log(`[InventoryService] ✅ Updated warehouse with ID: ${warehouseId}`);
      return resultAny.rows[0];
    } catch (error) {
      console.error(`[InventoryService] ❌ Error updating warehouse:`, error);
      throw new Error(`Failed to update warehouse: ${error}`);
    }
  }
  
  /**
   * Get stock information for a product in all warehouses or a specific warehouse
   * 
   * @param productId Product ID
   * @param companyId Company ID
   * @param warehouseId Optional warehouse ID to filter by
   * @returns Stock information
   */
  async getProductStock(productId: string, companyId: string, warehouseId?: string) {
    console.log(`[InventoryService] 🔍 Getting stock for product: ${productId}`);
    
    try {
      let query = `
        SELECT s.*, w.name as warehouse_name, w.type as warehouse_type 
        FROM stocks s
        JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.product_id = $1 AND s.company_id = $2
      `;
      
      const params: any[] = [productId, companyId];
      
      if (warehouseId) {
        query += ` AND s.warehouse_id = $3`;
        params.push(warehouseId);
      }
      
      const result = await this.drizzle.executeQuery(query, params);
      
      // Using any as a temporary workaround for the type issues
      const resultAny = result as any;
      console.log(`[InventoryService] ✅ Found ${resultAny.rows.length} stock entries`);
      
      return resultAny.rows;
    } catch (error) {
      console.error(`[InventoryService] ❌ Error getting product stock:`, error);
      throw new Error(`Failed to get product stock: ${error}`);
    }
  }
  
  /**
   * Get all stock in a warehouse
   * 
   * @param warehouseId Warehouse ID
   * @param companyId Company ID
   * @returns Stock information for all products in the warehouse
   */
  async getWarehouseStock(warehouseId: string, companyId: string) {
    console.log(`[InventoryService] 🔍 Getting all stock in warehouse: ${warehouseId}`);
    
    try {
      const query = `
        SELECT s.*, p.name as product_name, p.code as product_code, u.abbreviation as unit
        FROM stocks s
        JOIN inventory_products p ON s.product_id = p.id
        LEFT JOIN inventory_units u ON p.unit_id = u.id
        WHERE s.warehouse_id = $1 AND s.company_id = $2
        ORDER BY p.name ASC
      `;
      
      const result = await this.drizzle.executeQuery(query, [warehouseId, companyId]);
      console.log(`[InventoryService] ✅ Found ${result.rows.length} products in warehouse`);
      
      return result.rows;
    } catch (error) {
      console.error(`[InventoryService] ❌ Error getting warehouse stock:`, error);
      throw new Error(`Failed to get warehouse stock: ${error}`);
    }
  }
  
  /**
   * Convert an amount from one currency to another using exchange rates
   * 
   * @param amount Amount to convert
   * @param fromCurrency Source currency
   * @param toCurrency Target currency
   * @param date Optional date for the exchange rate (defaults to today)
   * @returns Converted amount with precision
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string, date?: Date): Promise<number> {
    // If the currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    // Use the static CurrencyService method
    return CurrencyService.convert(amount, fromCurrency, toCurrency);
  }
  
  /**
   * Manage reserved stock quantities
   * 
   * @param productId Product ID
   * @param warehouseId Warehouse ID
   * @param quantity Quantity to reserve (positive) or release (negative)
   * @returns Updated stock information
   */
  async reserveStock(productId: string, warehouseId: string, quantity: number) {
    console.log(`[InventoryService] 🔒 Reserving ${quantity} units of product ${productId} in warehouse ${warehouseId}`);
    
    try {
      // First, check if there's enough stock
      const stockResult = await this.drizzle.executeQuery(
        `SELECT * FROM stocks WHERE product_id = $1 AND warehouse_id = $2`,
        [productId, warehouseId]
      );
      
      if (stockResult.rows.length === 0) {
        throw new Error(`No stock found for product ${productId} in warehouse ${warehouseId}`);
      }
      
      const stock = stockResult.rows[0];
      const availableQuantity = parseFloat(stock.quantity) - parseFloat(stock.quantity_reserved);
      
      // If reserving (positive quantity), check if there's enough available
      if (quantity > 0 && availableQuantity < quantity) {
        throw new Error(`Not enough available stock. Requested: ${quantity}, Available: ${availableQuantity}`);
      }
      
      // Update the reserved quantity
      const result = await this.drizzle.executeQuery(
        `UPDATE stocks 
         SET quantity_reserved = quantity_reserved + $1, updated_at = $2
         WHERE product_id = $3 AND warehouse_id = $4
         RETURNING *`,
        [quantity, new Date(), productId, warehouseId]
      );
      
      console.log(`[InventoryService] ✅ Reserved stock updated`);
      return result.rows[0];
    } catch (error) {
      console.error(`[InventoryService] ❌ Error reserving stock:`, error);
      throw new Error(`Failed to reserve stock: ${error}`);
    }
  }
}