/**
 * NIR Service
 * 
 * This service handles operations related to NIR (Notă de Intrare Recepție) documents
 * according to Romanian accounting standards. It supports different warehouse types
 * (gestiune) and their specific NIR requirements.
 */

import { DrizzleService } from "../../../common/drizzle";
import { randomUUID } from "crypto";
import {
  InsertNirDocument,
  InsertNirItem,
  gestiuneTypeEnum,
  nirStatusEnum
} from "../schema/inventory.schema";

// Define simplified types for use in this service
type NirDocument = {
  id: string;
  nirNumber: string;
  companyId: string;
  franchiseId?: string;
  warehouseId: string;
  warehouseType: string;
  supplierId: string;
  supplierInvoiceNumber?: string;
  receiptDate: Date;
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  totalValueNoVat: number;
  totalVat: number;
  totalValueWithVat: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

type NirItem = {
  id: string;
  nirId: string;
  productId: string;
  quantity: number;
  purchasePrice: number;
  purchasePriceWithVat?: number;
  sellingPrice?: number;
  sellingPriceWithVat?: number;
  vatRate: number;
  vatValue: number;
  totalValueNoVat: number;
  totalValueWithVat: number;
  batchNo?: string;
  expiryDate?: Date;
  createdAt: Date;
  [key: string]: any;
};

/**
 * Service for managing NIR (Notă de Intrare Recepție) documents
 */
export class NirService {
  constructor(private drizzleService: DrizzleService) {}

  /**
   * Get database client
   */
  get db() {
    return this.drizzleService.db;
  }
  
  /**
   * Get drizzle service instance
   */
  get drizzle() {
    return this.drizzleService;
  }

  /**
   * Create a new NIR document with its items
   * @param nirData NIR document data
   * @param items NIR items
   * @returns Created NIR document
   */
  async createNirDocument(nirData: InsertNirDocument, items: InsertNirItem[]): Promise<NirDocument> {
    console.log(`[NirService] 📄 Creating NIR document ${nirData.nirNumber}`);
    
    try {
      // Use raw SQL queries for database operations
      const nirId = randomUUID();
      const createdAt = new Date();
      
      // Create the NIR document using simple query
      const sql = `
        INSERT INTO nir_documents (
          id, company_id, franchise_id, nir_number, supplier_id, supplier_invoice_number,
          warehouse_id, warehouse_type, is_custody, status, receipt_date,
          total_value_no_vat, total_vat, total_value_with_vat, created_at, updated_at,
          currency, exchange_rate
        ) VALUES (
          '${nirId}',
          '${nirData.companyId}',
          ${nirData.franchiseId ? `'${nirData.franchiseId}'` : 'NULL'},
          '${nirData.nirNumber}',
          '${nirData.supplierId}',
          ${nirData.supplierInvoiceNumber ? `'${nirData.supplierInvoiceNumber}'` : 'NULL'},
          '${nirData.warehouseId}',
          '${nirData.warehouseType}',
          ${nirData.isCustody || false},
          '${nirData.status || 'draft'}',
          '${new Date(nirData.receiptDate || new Date()).toISOString()}',
          ${nirData.totalValueNoVat || 0},
          ${nirData.totalVat || 0},
          ${nirData.totalValueWithVat || 0},
          '${createdAt.toISOString()}',
          '${createdAt.toISOString()}',
          '${nirData.currency || 'RON'}',
          ${nirData.exchangeRate || 1}
        )
        RETURNING *`;
      
      console.log('[NirService] 🔍 Executing SQL:', sql.substring(0, 100) + '...');
      const nirResult = await this.drizzle.query(sql);
      console.log('[NirService] ✅ SQL executed successfully');
      
      const nirDoc = nirResult[0];
      
      console.log(`[NirService] ✅ Created NIR document: ${nirId}`);
      
      // Create NIR items
      for (const item of items) {
        const itemId = randomUUID();
        
        const itemSql = `
          INSERT INTO nir_items (
            id, nir_id, product_id, quantity, batch_no, expiry_date,
            purchase_price, purchase_price_with_vat, selling_price, selling_price_with_vat,
            vat_rate, vat_value, total_value_no_vat, total_value_with_vat, created_at
          ) VALUES (
            '${itemId}',
            '${nirId}',
            '${item.productId}',
            ${item.quantity},
            ${item.batchNo ? `'${item.batchNo}'` : 'NULL'},
            ${item.expiryDate ? `'${new Date(item.expiryDate).toISOString()}'` : 'NULL'},
            ${item.purchasePrice},
            ${item.purchasePriceWithVat || 'NULL'},
            ${item.sellingPrice || 'NULL'},
            ${item.sellingPriceWithVat || 'NULL'},
            ${item.vatRate || 19},
            ${item.vatValue || 0},
            ${item.totalValueNoVat || 0},
            ${item.totalValueWithVat || 0},
            '${createdAt.toISOString()}'
          )
        `;
        
        console.log('[NirService] 🔍 Executing item SQL:', itemSql.substring(0, 100) + '...');
        await this.drizzle.query(itemSql);
        console.log('[NirService] ✅ Item SQL executed successfully');
        
        // Update stock based on warehouse type
        await this.updateStock(nirDoc, item);
      }
      
      return nirDoc;
    } catch (error) {
      console.error(`[NirService] ❌ Error creating NIR document:`, error);
      throw new Error(`Failed to create NIR document: ${error}`);
    }
  }
  
  /**
   * Updates stock based on warehouse type and NIR item
   * Different warehouse types have different stock updating rules
   * @param nirDoc NIR document
   * @param item NIR item
   */
  private async updateStock(nirDoc: NirDocument, item: InsertNirItem) {
    try {
      // Print out received nirDoc for debugging
      console.log('[NirService] 🔍 NIR Document received:', JSON.stringify(nirDoc, null, 2));
      
      // Use properties from the DB object which may be in snake_case
      const dbWarehouseId = nirDoc.warehouse_id || nirDoc.warehouseId;
      const dbCompanyId = nirDoc.company_id || nirDoc.companyId;
      const dbFranchiseId = nirDoc.franchise_id || nirDoc.franchiseId;
      
      if (!dbWarehouseId) {
        console.error('[NirService] ❌ No warehouse ID found in NIR document:', nirDoc);
        throw new Error('Warehouse ID is undefined');
      }
      
      // Get warehouse details
      const warehouseSql = `SELECT * FROM warehouses WHERE id = '${dbWarehouseId}'`;
      const warehouseResult = await this.drizzle.query(warehouseSql);
      console.log('[NirService] ✅ Warehouse SQL executed successfully');
      
      if (!warehouseResult || warehouseResult.length === 0) {
        throw new Error(`Warehouse ${dbWarehouseId} not found`);
      }
      
      const warehouse = warehouseResult[0];
      
      // Find existing stock
      const stockSql = `SELECT * FROM stocks WHERE product_id = '${item.productId}' AND warehouse_id = '${dbWarehouseId}'`;
      const stockResult = await this.drizzle.query(stockSql);
      console.log('[NirService] ✅ Stock SQL executed successfully');
      
      const quantity = parseFloat(item.quantity.toString());
      const existingStock = stockResult && stockResult.length > 0 ? stockResult[0] : null;
      
      const now = new Date().toISOString();
      const stockId = existingStock ? existingStock.id : randomUUID();
      
      // Different warehouse types have different stock handling rules
      switch (warehouse.type) {
        case 'depozit': // Regular warehouse - track quantity and cost
          if (existingStock) {
            // Calculate new average cost and update
            const oldQuantity = parseFloat(existingStock.quantity);
            // Calculate the value using quantity and purchase price since total_value is not in the table
            const oldValue = oldQuantity * parseFloat(existingStock.purchase_price || '0');
            const newValue = parseFloat(item.totalValueNoVat?.toString() || '0');
            const newTotalQuantity = oldQuantity + quantity;
            const newAverageCost = newTotalQuantity > 0 ? (oldValue + newValue) / newTotalQuantity : 0;
            
            const updateSql = `
              UPDATE stocks
              SET quantity = quantity + ${quantity},
                  purchase_price = ${newAverageCost},
                  updated_at = '${now}'
              WHERE id = '${existingStock.id}'
            `;
            
            await this.drizzle.query(updateSql);
            console.log('[NirService] ✅ Updated existing stock in depozit warehouse');
          } else {
            // Create new stock entry
            const insertSql = `
              INSERT INTO stocks (
                id, company_id, franchise_id, product_id, warehouse_id,
                quantity, batch_no, expiry_date, purchase_price, selling_price,
                created_at, updated_at
              ) VALUES (
                '${stockId}',
                '${nirDoc.companyId}',
                ${nirDoc.franchiseId ? `'${nirDoc.franchiseId}'` : 'NULL'},
                '${item.productId}',
                '${dbWarehouseId}',
                ${quantity},
                ${item.batchNo ? `'${item.batchNo}'` : 'NULL'},
                ${item.expiryDate ? `'${new Date(item.expiryDate).toISOString()}'` : 'NULL'},
                ${item.purchasePrice || 0},
                ${item.sellingPrice || 0},
                '${now}',
                '${now}'
              )
            `;
            
            await this.drizzle.query(insertSql);
            console.log('[NirService] ✅ Created new stock in depozit warehouse');
          }
          break;
          
        case 'magazin': // Store - track with selling price
          if (existingStock) {
            const updateSql = `
              UPDATE stocks
              SET quantity = quantity + ${quantity},
                  selling_price = ${item.sellingPrice || 0},
                  updated_at = '${now}'
              WHERE id = '${existingStock.id}'
            `;
            
            await this.drizzle.query(updateSql);
            console.log('[NirService] ✅ Updated existing stock in magazin warehouse');
          } else {
            const insertSql = `
              INSERT INTO stocks (
                id, company_id, franchise_id, product_id, warehouse_id,
                quantity, batch_no, expiry_date, purchase_price, selling_price,
                created_at, updated_at
              ) VALUES (
                '${stockId}',
                '${nirDoc.companyId}',
                ${nirDoc.franchiseId ? `'${nirDoc.franchiseId}'` : 'NULL'},
                '${item.productId}',
                '${dbWarehouseId}',
                ${quantity},
                ${item.batchNo ? `'${item.batchNo}'` : 'NULL'},
                ${item.expiryDate ? `'${new Date(item.expiryDate).toISOString()}'` : 'NULL'},
                ${item.purchasePrice || 0},
                ${item.sellingPrice || 0},
                '${now}',
                '${now}'
              )
            `;
            
            await this.drizzle.query(insertSql);
            console.log('[NirService] ✅ Created new stock in magazin warehouse');
          }
          break;
          
        case 'custodie': // Custody - special tracking
          if (existingStock) {
            const updateSql = `
              UPDATE stocks
              SET quantity = quantity + ${quantity},
                  updated_at = '${now}'
              WHERE id = '${existingStock.id}'
            `;
            
            await this.drizzle.query(updateSql);
            console.log('[NirService] ✅ Updated existing stock in custodie warehouse');
          } else {
            const insertSql = `
              INSERT INTO stocks (
                id, company_id, franchise_id, product_id, warehouse_id,
                quantity, batch_no, expiry_date, purchase_price,
                created_at, updated_at
              ) VALUES (
                '${stockId}',
                '${nirDoc.companyId}',
                ${nirDoc.franchiseId ? `'${nirDoc.franchiseId}'` : 'NULL'},
                '${item.productId}',
                '${dbWarehouseId}',
                ${quantity},
                ${item.batchNo ? `'${item.batchNo}'` : 'NULL'},
                ${item.expiryDate ? `'${new Date(item.expiryDate).toISOString()}'` : 'NULL'},
                0, /* No cost for custody items */
                '${now}',
                '${now}'
              )
            `;
            
            await this.drizzle.query(insertSql);
            console.log('[NirService] ✅ Created new stock in custodie warehouse');
          }
          break;
          
        case 'transfer': // Virtual warehouse for transfers
          // Transfer warehouses don't use NIR documents directly
          console.log(`[NirService] ⚠️ Creating NIR for transfer warehouse is unusual`);
          if (existingStock) {
            const updateSql = `
              UPDATE stocks
              SET quantity = quantity + ${quantity},
                  updated_at = '${now}'
              WHERE id = '${existingStock.id}'
            `;
            
            await this.drizzle.query(updateSql);
            console.log('[NirService] ✅ Updated existing stock in transfer warehouse');
          } else {
            const insertSql = `
              INSERT INTO stocks (
                id, company_id, franchise_id, product_id, warehouse_id,
                quantity, batch_no, expiry_date, purchase_price,
                created_at, updated_at
              ) VALUES (
                '${stockId}',
                '${nirDoc.companyId}',
                ${nirDoc.franchiseId ? `'${nirDoc.franchiseId}'` : 'NULL'},
                '${item.productId}',
                '${dbWarehouseId}',
                ${quantity},
                ${item.batchNo ? `'${item.batchNo}'` : 'NULL'},
                ${item.expiryDate ? `'${new Date(item.expiryDate).toISOString()}'` : 'NULL'},
                ${item.purchasePrice || 0},
                '${now}',
                '${now}'
              )
            `;
            
            await this.drizzle.query(insertSql);
            console.log('[NirService] ✅ Created new stock in transfer warehouse');
          }
          break;
      }
      
      console.log(`[NirService] ✅ Updated stock for product ${item.productId} in ${warehouse.type} warehouse`);
    } catch (error) {
      console.error(`[NirService] ❌ Error updating stock:`, error);
      throw error;
    }
  }
  
  /**
   * Get a NIR document by ID with all its items
   * @param nirId NIR document ID
   * @returns NIR document with items
   */
  async getNirDocument(nirId: string): Promise<{ document: NirDocument, items: NirItem[] }> {
    console.log(`[NirService] 🔍 Fetching NIR document: ${nirId}`);
    
    try {
      const documentSql = `SELECT * FROM nir_documents WHERE id = '${nirId}'`;
      const documentResult = await this.drizzle.query(documentSql);
      console.log('[NirService] ✅ Document SQL executed successfully');
      
      if (!documentResult || documentResult.length === 0) {
        throw new Error(`NIR document ${nirId} not found`);
      }
      
      const document = documentResult[0];
      
      const itemsSql = `SELECT * FROM nir_items WHERE nir_id = '${nirId}'`;
      const itemsResult = await this.drizzle.query(itemsSql);
      console.log('[NirService] ✅ Items SQL executed successfully');
      
      const items = itemsResult || [];
      
      console.log(`[NirService] ✅ Found NIR document with ${items.length} items`);
      
      return { document, items };
    } catch (error) {
      console.error(`[NirService] ❌ Error getting NIR document:`, error);
      throw new Error(`Failed to get NIR document: ${error}`);
    }
  }
  
  /**
   * Update NIR document status
   * @param nirId NIR document ID
   * @param status New status
   * @returns Updated NIR document
   */
  async updateNirStatus(nirId: string, status: typeof nirStatusEnum.enumValues[number]): Promise<NirDocument> {
    console.log(`[NirService] 📝 Updating NIR ${nirId} status to ${status}`);
    
    try {
      const now = new Date().toISOString();
      
      // Build update SQL
      let updateSql = `
        UPDATE nir_documents
        SET status = '${status}', 
            updated_at = '${now}'
      `;
      
      // Add approvedAt if status is 'approved'
      if (status === 'approved') {
        updateSql += `, approved_at = '${now}'`;
      }
      
      updateSql += ` WHERE id = '${nirId}' RETURNING *`;
      
      console.log('[NirService] 🔍 Executing update SQL:', updateSql.substring(0, 100) + '...');
      const result = await this.drizzle.query(updateSql);
      console.log('[NirService] ✅ Update SQL executed successfully');
      
      if (!result || result.length === 0) {
        throw new Error(`NIR document ${nirId} not found`);
      }
      
      const updatedDoc = result[0];
      
      console.log(`[NirService] ✅ Updated NIR status to ${updatedDoc.status}`);
      
      return updatedDoc;
    } catch (error) {
      console.error(`[NirService] ❌ Error updating NIR status:`, error);
      throw new Error(`Failed to update NIR status: ${error}`);
    }
  }
}

// Export a singleton instance
export const nirService = new NirService(new DrizzleService());