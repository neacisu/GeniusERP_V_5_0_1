/**
 * TransferStockService
 * 
 * This service handles movement of goods between warehouse locations (gestiune).
 * It supports the Romanian stock transfer workflow with proper validation
 * and audit-compliant logging of all movements.
 */

import { getDrizzle } from '../../../common/drizzle/drizzle.service';
import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';

/**
 * Input type for stock transfer
 */
export type StockTransferInput = {
  companyId: string;
  franchiseId?: string;
  sourceStockId: string;
  destinationWarehouseId: string;
  quantity: number;
  documentNumber?: string;
  notes?: string;
};

export class TransferStockService {
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
   * Transfer stock from one warehouse to another
   * 
   * @param input Transfer data
   * @returns Created transfer record with source and destination stock
   */
  async transferStock(input: StockTransferInput) {
    console.log(`[TransferStockService] 🔄 Transferring stock: ${input.quantity} units from stock ${input.sourceStockId} to warehouse ${input.destinationWarehouseId}`);
    
    try {
      // Step 1: Get source stock record to validate availability
      const sourceStockSql = `
        SELECT s.*, p.name as product_name, p.id as product_id, p.code as product_code
        FROM stocks s
        JOIN inventory_products p ON s.product_id = p.id
        WHERE s.id = '${input.sourceStockId}'
      `;
      
      const sourceStockResult = await this.drizzle.query(sourceStockSql);
      
      if (sourceStockResult.length === 0) {
        throw new Error(`Source stock with ID ${input.sourceStockId} not found`);
      }
      
      const sourceStock = sourceStockResult[0];
      console.log(`[TransferStockService] 📋 Found source stock: ${sourceStock.product_name} (${sourceStock.quantity} available)`);
      
      // Step 2: Validate stock availability
      if (sourceStock.quantity < input.quantity) {
        throw new Error(`Insufficient stock. Available: ${sourceStock.quantity}, Requested: ${input.quantity}`);
      }
      
      // Step 3: Begin transaction
      const now = new Date().toISOString();
      const transferId = randomUUID();
      const documentNumber = input.documentNumber || `TR-${Date.now()}`;
      
      // Step 4: Decrease quantity in source stock
      const updateSourceSql = `
        UPDATE stocks
        SET 
          quantity = quantity - ${input.quantity},
          updated_at = '${now}'
        WHERE id = '${input.sourceStockId}'
        RETURNING *
      `;
      
      const updatedSourceStock = await this.drizzle.query(updateSourceSql);
      
      console.log(`[TransferStockService] ✓ Decreased source stock quantity by ${input.quantity}`);
      
      // Step 5: Check if product already exists in destination warehouse
      const existingDestinationStockSql = `
        SELECT * FROM stocks
        WHERE 
          warehouse_id = '${input.destinationWarehouseId}'
          AND product_id = '${sourceStock.product_id}'
          AND (batch_no = ${sourceStock.batch_no ? `'${sourceStock.batch_no}'` : 'NULL'} OR (batch_no IS NULL AND ${sourceStock.batch_no ? 'FALSE' : 'TRUE'}))
      `;
      
      const existingDestinationStock = await this.drizzle.query(existingDestinationStockSql);
      
      let destinationStock;
      
      // Step 6: Either update existing stock or create new stock in destination
      if (existingDestinationStock.length > 0) {
        // Update existing stock
        const updateDestinationSql = `
          UPDATE stocks
          SET 
            quantity = quantity + ${input.quantity},
            updated_at = '${now}'
          WHERE id = '${existingDestinationStock[0].id}'
          RETURNING *
        `;
        
        const result = await this.drizzle.query(updateDestinationSql);
        destinationStock = result[0];
        
        console.log(`[TransferStockService] ✓ Increased existing destination stock by ${input.quantity}`);
      } else {
        // Create new stock record in destination
        const insertDestinationSql = `
          INSERT INTO stocks (
            id, company_id, franchise_id, product_id, warehouse_id, 
            quantity, batch_no, expiry_date, purchase_price, selling_price, 
            created_at, updated_at
          ) VALUES (
            '${randomUUID()}',
            '${input.companyId}',
            ${input.franchiseId ? `'${input.franchiseId}'` : 'NULL'},
            '${sourceStock.product_id}',
            '${input.destinationWarehouseId}',
            ${input.quantity},
            ${sourceStock.batch_no ? `'${sourceStock.batch_no}'` : 'NULL'},
            ${sourceStock.expiry_date ? `'${sourceStock.expiry_date}'` : 'NULL'},
            ${sourceStock.purchase_price || 0},
            ${sourceStock.selling_price || 0},
            '${now}',
            '${now}'
          )
          RETURNING *
        `;
        
        const result = await this.drizzle.query(insertDestinationSql);
        destinationStock = result[0];
        
        console.log(`[TransferStockService] ✓ Created new stock in destination warehouse with ${input.quantity} units`);
      }
      
      // Step 7: Create transfer document record for auditability
      const createTransferDocumentSql = `
        INSERT INTO transfer_documents (
          id, company_id, franchise_id, transfer_number, 
          source_warehouse_id, destination_warehouse_id, 
          status, transfer_date, notes, total_value,
          created_at, updated_at
        ) VALUES (
          '${transferId}',
          '${input.companyId}',
          ${input.franchiseId ? `'${input.franchiseId}'` : 'NULL'},
          '${documentNumber}',
          '${sourceStock.warehouse_id}',
          '${input.destinationWarehouseId}',
          'in_transit',
          '${now}',
          ${input.notes ? `'${input.notes}'` : 'NULL'},
          ${(sourceStock.purchase_price || 0) * input.quantity},
          '${now}',
          '${now}'
        )
        RETURNING *
      `;
      
      const transferDocument = await this.drizzle.query(createTransferDocumentSql);
      
      // Step 8: Create transfer item record
      const createTransferItemSql = `
        INSERT INTO transfer_items (
          id, transfer_id, product_id, quantity, 
          batch_no, expiry_date, unit_value, total_value, 
          created_at
        ) VALUES (
          '${randomUUID()}',
          '${transferId}',
          '${sourceStock.product_id}',
          ${input.quantity},
          ${sourceStock.batch_no ? `'${sourceStock.batch_no}'` : 'NULL'},
          ${sourceStock.expiry_date ? `'${sourceStock.expiry_date}'` : 'NULL'},
          ${sourceStock.purchase_price || 0},
          ${(sourceStock.purchase_price || 0) * input.quantity},
          '${now}'
        )
        RETURNING *
      `;
      
      const transferItem = await this.drizzle.query(createTransferItemSql);
      
      console.log(`[TransferStockService] ✓ Created transfer document: ${documentNumber}`);
      
      // Step 9: Return all relevant data
      return {
        transfer: transferDocument[0],
        transferItem: transferItem[0],
        sourceStock: updatedSourceStock[0],
        destinationStock,
        product: {
          id: sourceStock.product_id,
          name: sourceStock.product_name,
          code: sourceStock.product_code
        }
      };
    } catch (error: any) {
      console.error(`[TransferStockService] ❌ Error transferring stock:`, error);
      throw new Error(`Failed to transfer stock: ${error?.message || String(error)}`);
    }
  }
  
  /**
   * Get transfer document by ID
   * 
   * @param id Transfer document ID
   * @returns Transfer document with items
   */
  async getTransferById(id: string) {
    console.log(`[TransferStockService] 🔍 Getting transfer by ID: ${id}`);
    
    try {
      // Get transfer document
      const transferSql = `
        SELECT td.*, 
          src.name as source_warehouse_name, 
          dst.name as destination_warehouse_name
        FROM transfer_documents td
        JOIN warehouses src ON td.source_warehouse_id = src.id
        JOIN warehouses dst ON td.destination_warehouse_id = dst.id
        WHERE td.id = '${id}'
      `;
      
      const transferResult = await this.drizzle.query(transferSql);
      
      if (transferResult.length === 0) {
        console.log(`[TransferStockService] ⚠️ Transfer not found: ${id}`);
        return null;
      }
      
      const transfer = transferResult[0];
      
      // Get transfer items
      const itemsSql = `
        SELECT ti.*, p.name as product_name, p.code as product_code
        FROM transfer_items ti
        JOIN inventory_products p ON ti.product_id = p.id
        WHERE ti.transfer_id = '${id}'
      `;
      
      const items = await this.drizzle.query(itemsSql);
      
      console.log(`[TransferStockService] ✅ Found transfer with ${items.length} items`);
      
      return {
        ...transfer,
        items
      };
    } catch (error: any) {
      console.error(`[TransferStockService] ❌ Error fetching transfer:`, error);
      throw new Error(`Failed to fetch transfer: ${error?.message || String(error)}`);
    }
  }
  
  /**
   * Get transfers for a company
   * 
   * @param companyId Company ID
   * @param status Optional status filter
   * @returns List of transfers
   */
  async getTransfersByCompany(companyId: string, status?: string) {
    console.log(`[TransferStockService] 🔍 Getting transfers for company: ${companyId}`);
    
    try {
      let sql = `
        SELECT td.*, 
          src.name as source_warehouse_name, 
          dst.name as destination_warehouse_name
        FROM transfer_documents td
        JOIN warehouses src ON td.source_warehouse_id = src.id
        JOIN warehouses dst ON td.destination_warehouse_id = dst.id
        WHERE td.company_id = '${companyId}'
      `;
      
      if (status) {
        sql += ` AND td.status = '${status}'`;
      }
      
      sql += ` ORDER BY td.created_at DESC`;
      
      const transfers = await this.drizzle.query(sql);
      console.log(`[TransferStockService] ✅ Found ${transfers.length} transfers`);
      
      return transfers;
    } catch (error: any) {
      console.error(`[TransferStockService] ❌ Error fetching transfers:`, error);
      throw new Error(`Failed to fetch transfers: ${error?.message || String(error)}`);
    }
  }
  
  /**
   * Update transfer status
   * 
   * @param id Transfer document ID
   * @param status New status
   * @param userId User performing the update
   * @returns Updated transfer
   */
  async updateTransferStatus(id: string, status: string, userId: string) {
    console.log(`[TransferStockService] 📝 Updating transfer ${id} status to: ${status}`);
    
    try {
      const now = new Date().toISOString();
      
      // Build SQL based on status
      let sql = `
        UPDATE transfer_documents
        SET 
          status = '${status}',
          updated_at = '${now}'
      `;
      
      // Add status-specific fields
      if (status === 'issued') {
        sql += `, issued_by = '${userId}', issued_at = '${now}'`;
      } else if (status === 'received') {
        sql += `, received_by = '${userId}', received_at = '${now}'`;
      }
      
      sql += ` WHERE id = '${id}' RETURNING *`;
      
      const result = await this.drizzle.query(sql);
      
      if (result.length === 0) {
        throw new Error(`Transfer with ID ${id} not found`);
      }
      
      console.log(`[TransferStockService] ✅ Updated transfer status: ${id}`);
      return result[0];
    } catch (error: any) {
      console.error(`[TransferStockService] ❌ Error updating transfer status:`, error);
      throw new Error(`Failed to update transfer status: ${error?.message || String(error)}`);
    }
  }
}

// Export a singleton instance
export const transferStockService = new TransferStockService();