/**
 * TransferStockService
 * 
 * This service handles movement of goods between warehouse locations (gestiune).
 * It supports the Romanian stock transfer workflow with proper validation
 * and audit-compliant logging of all movements.
 */

import { DrizzleService } from "@common/drizzle";
import { randomUUID } from 'crypto';
import { Services, logAction } from "@common/services/registry";
import { AuditAction } from '../../../modules/audit/services/audit.service';
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
  userId?: string; // User ID for audit logging
};

export class TransferStockService {
  private drizzle: DrizzleService;
  
  constructor() {
    this.drizzle = new DrizzleService();
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
      const now = new Date().toISOString();
      const transferId = randomUUID();
      const documentNumber = input.documentNumber || `TRF-${Date.now()}`;
      
      // Step 1: Get source stock
      const sourceStockSql = `
        SELECT s.*, p.name as product_name
        FROM stocks s
        JOIN inventory_products p ON s.product_id = p.id
        WHERE s.id = '${input.sourceStockId}'
      `;
      
      const sourceStockResult = await this.drizzle.executeQuery(sourceStockSql);
      
      if (sourceStockResult.length === 0) {
        throw new Error('Source stock not found');
      }
      
      const sourceStock = sourceStockResult[0];
      
      // Step 2: Validate quantity
      if (sourceStock.quantity < input.quantity) {
        throw new Error(`Insufficient stock. Available: ${sourceStock.quantity}, Requested: ${input.quantity}`);
      }
      
      // Step 3: Update source stock
      const updateSourceSql = `
        UPDATE stocks
        SET quantity = quantity - ${input.quantity},
            updated_at = '${now}'
        WHERE id = '${input.sourceStockId}'
        RETURNING *
      `;
      
      const updatedSourceStock = await this.drizzle.executeQuery(updateSourceSql);
      
      // Step 4: Check if destination stock exists
      const checkDestinationSql = `
        SELECT *
        FROM stocks
        WHERE product_id = '${sourceStock.product_id}'
        AND warehouse_id = '${input.destinationWarehouseId}'
      `;
      
      const destinationStockResult = await this.drizzle.executeQuery(checkDestinationSql);
      let destinationStock;
      
      if (destinationStockResult.length > 0) {
        // Update existing stock
        const updateDestinationSql = `
          UPDATE stocks
          SET quantity = quantity + ${input.quantity},
              updated_at = '${now}'
          WHERE id = '${destinationStockResult[0].id}'
          RETURNING *
        `;
        
        const result = await this.drizzle.executeQuery(updateDestinationSql);
        destinationStock = result[0];
        
        console.log(`[TransferStockService] ✓ Updated existing stock in destination warehouse with ${input.quantity} units`);
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
        
        const result = await this.drizzle.executeQuery(insertDestinationSql);
        destinationStock = result[0];
        
        console.log(`[TransferStockService] ✓ Created new stock in destination warehouse with ${input.quantity} units`);
      }
      
      // Step 5: Create transfer document record for auditability
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
      
      const transferDocument = await this.drizzle.executeQuery(createTransferDocumentSql);
      
      // Step 6: Create transfer item record
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
      
      const transferItem = await this.drizzle.executeQuery(createTransferItemSql);
      
      console.log(`[TransferStockService] ✓ Created transfer document: ${documentNumber}`);
      
      // Step 7: Log audit event
      if (input.userId) {
        try {
          await logAction({
            companyId: input.companyId,
            userId: input.userId,
            action: AuditAction.CREATE,
            entity: 'stock_transfer',
            entityId: transferId,
            details: {
              sourceWarehouseId: sourceStock.warehouse_id,
              destinationWarehouseId: input.destinationWarehouseId,
              productId: sourceStock.product_id,
              productName: sourceStock.product_name,
              quantity: input.quantity,
              documentNumber,
              transferId
            }
          });
          console.log(`[TransferStockService] ✓ Logged audit event for transfer creation: ${transferId}`);
        } catch (auditError) {
          console.error(`[TransferStockService] ❌ Error logging audit event:`, auditError);
          // Continue execution even if audit logging fails
        }
      }
      
      return {
        transfer: transferDocument[0],
        sourceStock: updatedSourceStock[0],
        destinationStock,
        product: {
          id: sourceStock.product_id,
          name: sourceStock.product_name
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
      
      const transferResult = await this.drizzle.executeQuery(transferSql);
      
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
      
      const items = await this.drizzle.executeQuery(itemsSql);
      
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
      
      const transfers = await this.drizzle.executeQuery(sql);
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
   * @param id Transfer ID
   * @param status New status
   * @param userId User ID for audit logging
   * @returns Updated transfer
   */
  async updateTransferStatus(id: string, status: string, userId: string) {
    console.log(`[TransferStockService] 📝 Updating transfer ${id} status to: ${status}`);
    
    try {
      const now = new Date().toISOString();
      
      // Update transfer status
      const updateSql = `
        UPDATE transfer_documents
        SET status = '${status}',
            updated_at = '${now}'
        WHERE id = '${id}'
        RETURNING *
      `;
      
      const result = await this.drizzle.executeQuery(updateSql);
      
      if (result.length === 0) {
        throw new Error('Transfer not found');
      }
      
      // Log audit event for the status update
      try {
        // Get the company ID from the transfer document
        const companyIdQuery = `
          SELECT company_id FROM transfer_documents WHERE id = '${id}'
        `;
        const companyResult = await this.drizzle.executeQuery(companyIdQuery);
        if (companyResult.length > 0) {
          const companyId = companyResult[0].company_id;
          
          await logAction({
            companyId,
            userId,
            action: AuditAction.UPDATE,
            entity: 'stock_transfer',
            entityId: id,
            details: {
              status,
              previousStatus: result[0].status !== status ? result[0].status : 'unknown',
              updatedAt: new Date().toISOString(),
              transferId: id
            }
          });
          console.log(`[TransferStockService] ✓ Logged audit event for transfer status update: ${id}`);
        }
      } catch (auditError) {
        console.error(`[TransferStockService] ❌ Error logging audit event:`, auditError);
        // Continue execution even if audit logging fails
      }
      
      return result[0];
    } catch (error: any) {
      console.error(`[TransferStockService] ❌ Error updating transfer status:`, error);
      throw new Error(`Failed to update transfer status: ${error?.message || String(error)}`);
    }
  }
}

// Export a singleton instance
export const transferStockService = new TransferStockService();