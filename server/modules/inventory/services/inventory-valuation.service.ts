/**
 * Inventory Valuation Service
 * 
 * This service implements inventory valuation methods according to Romanian accounting standards
 * as defined in OMFP 1802/2014 and OMFP 2861/2009. It supports:
 * 
 * - FIFO (First In, First Out) - "primul intrat, primul ieșit"
 * - LIFO (Last In, First Out) - "ultimul intrat, primul ieșit"
 * - Weighted Average Cost - "costul mediu ponderat"
 * 
 * The service provides both current stock valuation and historical valuation tracking
 * required for Romanian fiscal reporting and audits.
 */

import { desc, eq, and, sql, asc, lt, gte } from 'drizzle-orm';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
import { 
  insertBatchSchema,
  insertValuationSchema,
  inventoryBatches,
  inventoryValuations,
  inventoryValuationMethodEnum
} from '../../../../shared/schema/inventory-assessment';
import { generateDateBasedCode } from '../../../utils/code-generator';
import { z } from 'zod';

export class InventoryValuationService {
  constructor(
    private readonly db: DrizzleService
  ) {}

  /**
   * Calculate stock value using FIFO method
   * "primul intrat, primul ieșit" - according to Romanian accounting standards
   * 
   * @param productId - Product ID to calculate value for
   * @param warehouseId - Warehouse ID to calculate value for
   * @param date - Optional date for historical valuation
   */
  async calculateFIFOValue(
    productId: string, 
    warehouseId: string, 
    date?: Date
  ): Promise<{
    quantity: number;
    value: number;
    averageUnitValue: number;
    batches: Array<{
      id: string;
      purchaseDate: Date;
      quantity: number;
      unitValue: number;
      totalValue: number;
    }>
  }> {
    // Get all batches for the product in the warehouse, sorted by purchase date (oldest first)
    let batchesQuery = this.db.select({
      id: inventoryBatches.id,
      purchaseDate: inventoryBatches.purchaseDate,
      purchasePrice: inventoryBatches.purchasePrice,
      remainingQuantity: inventoryBatches.remainingQuantity
    })
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.productId, productId),
        eq(inventoryBatches.warehouseId, warehouseId),
        sql`${inventoryBatches.remainingQuantity} > 0`
      )
    )
    .orderBy(asc(inventoryBatches.purchaseDate));
    
    // Apply date filter for historical valuation if specified
    if (date) {
      batchesQuery = batchesQuery.where(lt(inventoryBatches.purchaseDate, date));
    }
    
    const batches = await batchesQuery;
    
    let totalQuantity = 0;
    let totalValue = 0;
    const batchesWithValues = batches.map(batch => {
      const quantity = Number(batch.remainingQuantity);
      const unitValue = Number(batch.purchasePrice);
      const totalBatchValue = quantity * unitValue;
      
      totalQuantity += quantity;
      totalValue += totalBatchValue;
      
      return {
        id: batch.id,
        purchaseDate: batch.purchaseDate,
        quantity,
        unitValue,
        totalValue: totalBatchValue
      };
    });
    
    const averageUnitValue = totalQuantity > 0 ? totalValue / totalQuantity : 0;
    
    return {
      quantity: totalQuantity,
      value: totalValue,
      averageUnitValue,
      batches: batchesWithValues
    };
  }

  /**
   * Calculate stock value using LIFO method
   * "ultimul intrat, primul ieșit" - according to Romanian accounting standards
   * 
   * @param productId - Product ID to calculate value for
   * @param warehouseId - Warehouse ID to calculate value for
   * @param date - Optional date for historical valuation
   */
  async calculateLIFOValue(
    productId: string, 
    warehouseId: string, 
    date?: Date
  ): Promise<{
    quantity: number;
    value: number;
    averageUnitValue: number;
    batches: Array<{
      id: string;
      purchaseDate: Date;
      quantity: number;
      unitValue: number;
      totalValue: number;
    }>
  }> {
    // Get all batches for the product in the warehouse, sorted by purchase date (newest first)
    let batchesQuery = this.db.select({
      id: inventoryBatches.id,
      purchaseDate: inventoryBatches.purchaseDate,
      purchasePrice: inventoryBatches.purchasePrice,
      remainingQuantity: inventoryBatches.remainingQuantity
    })
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.productId, productId),
        eq(inventoryBatches.warehouseId, warehouseId),
        sql`${inventoryBatches.remainingQuantity} > 0`
      )
    )
    .orderBy(desc(inventoryBatches.purchaseDate));
    
    // Apply date filter for historical valuation if specified
    if (date) {
      batchesQuery = batchesQuery.where(lt(inventoryBatches.purchaseDate, date));
    }
    
    const batches = await batchesQuery;
    
    let totalQuantity = 0;
    let totalValue = 0;
    const batchesWithValues = batches.map(batch => {
      const quantity = Number(batch.remainingQuantity);
      const unitValue = Number(batch.purchasePrice);
      const totalBatchValue = quantity * unitValue;
      
      totalQuantity += quantity;
      totalValue += totalBatchValue;
      
      return {
        id: batch.id,
        purchaseDate: batch.purchaseDate,
        quantity,
        unitValue,
        totalValue: totalBatchValue
      };
    });
    
    const averageUnitValue = totalQuantity > 0 ? totalValue / totalQuantity : 0;
    
    return {
      quantity: totalQuantity,
      value: totalValue,
      averageUnitValue,
      batches: batchesWithValues
    };
  }

  /**
   * Calculate stock value using Weighted Average Method
   * "costul mediu ponderat" - according to Romanian accounting standards
   * 
   * @param productId - Product ID to calculate value for
   * @param warehouseId - Warehouse ID to calculate value for
   * @param date - Optional date for historical valuation
   */
  async calculateWeightedAverageValue(
    productId: string, 
    warehouseId: string, 
    date?: Date
  ): Promise<{
    quantity: number;
    value: number;
    averageUnitValue: number;
  }> {
    // Get all batches for the product in the warehouse
    let batchesQuery = this.db.select({
      purchasePrice: inventoryBatches.purchasePrice,
      remainingQuantity: inventoryBatches.remainingQuantity
    })
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.productId, productId),
        eq(inventoryBatches.warehouseId, warehouseId),
        sql`${inventoryBatches.remainingQuantity} > 0`
      )
    );
    
    // Apply date filter for historical valuation if specified
    if (date) {
      batchesQuery = batchesQuery.where(lt(inventoryBatches.purchaseDate, date));
    }
    
    const batches = await batchesQuery;
    
    let totalQuantity = 0;
    let totalValue = 0;
    
    for (const batch of batches) {
      const quantity = Number(batch.remainingQuantity);
      const unitValue = Number(batch.purchasePrice);
      
      totalQuantity += quantity;
      totalValue += quantity * unitValue;
    }
    
    const averageUnitValue = totalQuantity > 0 ? totalValue / totalQuantity : 0;
    
    return {
      quantity: totalQuantity,
      value: totalValue,
      averageUnitValue
    };
  }

  /**
   * Get the latest valuation for a product in a warehouse
   * 
   * @param productId - Product ID
   * @param warehouseId - Warehouse ID
   */
  async getLatestValuation(productId: string, warehouseId: string): Promise<any> {
    const [valuation] = await this.db.select()
      .from(inventoryValuations)
      .where(
        and(
          eq(inventoryValuations.productId, productId),
          eq(inventoryValuations.warehouseId, warehouseId)
        )
      )
      .orderBy(desc(inventoryValuations.valuationDate))
      .limit(1);
    
    return valuation;
  }

  /**
   * Calculate stock value using the specified method
   * 
   * @param productId - Product ID
   * @param warehouseId - Warehouse ID
   * @param method - Valuation method (FIFO, LIFO, weighted_average)
   * @param date - Optional date for historical valuation
   */
  async calculateStockValue(
    productId: string,
    warehouseId: string,
    method: keyof typeof inventoryValuationMethodEnum,
    date?: Date
  ): Promise<{
    quantity: number;
    value: number;
    averageUnitValue: number;
    method: keyof typeof inventoryValuationMethodEnum;
    batches?: Array<{
      id: string;
      purchaseDate: Date;
      quantity: number;
      unitValue: number;
      totalValue: number;
    }>
  }> {
    switch (method) {
      case inventoryValuationMethodEnum.FIFO:
        const fifoResult = await this.calculateFIFOValue(productId, warehouseId, date);
        return {
          ...fifoResult,
          method
        };
      
      case inventoryValuationMethodEnum.LIFO:
        const lifoResult = await this.calculateLIFOValue(productId, warehouseId, date);
        return {
          ...lifoResult,
          method
        };
      
      case inventoryValuationMethodEnum.WEIGHTED_AVERAGE:
        const avgResult = await this.calculateWeightedAverageValue(productId, warehouseId, date);
        return {
          ...avgResult,
          method,
          batches: [] // Weighted average doesn't track individual batches
        };
      
      default:
        throw new Error(`Unsupported valuation method: ${method}`);
    }
  }

  /**
   * Save a valuation record for audit and historical tracking purposes
   * Required for Romanian accounting compliance and reporting
   * 
   * @param data - Valuation data to save
   * @param userId - User ID who performed the valuation
   */
  async saveValuation(data: {
    companyId: string;
    productId: string;
    warehouseId: string;
    method: keyof typeof inventoryValuationMethodEnum;
    quantity: number;
    unitValue: number;
    totalValue: number;
    valuationDate?: Date;
    referenceDocument?: string;
    referenceId?: string;
    notes?: string;
    assessmentId?: string;
  }, userId: string): Promise<any> {
    const valuationDate = data.valuationDate || new Date();
    
    // Generate reference document number if not provided
    const referenceDocument = data.referenceDocument || 
      generateDateBasedCode('VAL', valuationDate, '', 1);
    
    const valuation = {
      ...data,
      valuationDate,
      referenceDocument,
      createdBy: userId
    };
    
    // Validate with Zod schema
    const validatedData = insertValuationSchema.parse(valuation);
    
    const [result] = await this.db.insertInto(inventoryValuations)
      .values(validatedData)
      .returning();
    
    // Log the valuation for audit purposes
    await AuditService.log({
      action: AuditAction.CREATE,
      entity: 'valuation',
      entityId: result.id,
      userId,
      companyId: result.companyId,
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        method: data.method,
        quantity: data.quantity,
        totalValue: data.totalValue
      }
    });
    
    return result;
  }

  /**
   * Get valuation history for a product in a warehouse
   * 
   * @param productId - Product ID
   * @param warehouseId - Warehouse ID
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   */
  async getValuationHistory(
    productId: string,
    warehouseId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    let query = this.db.select()
      .from(inventoryValuations)
      .where(
        and(
          eq(inventoryValuations.productId, productId),
          eq(inventoryValuations.warehouseId, warehouseId)
        )
      )
      .orderBy(desc(inventoryValuations.valuationDate));
    
    // Apply date range filters if specified
    if (startDate) {
      query = query.where(gte(inventoryValuations.valuationDate, startDate));
    }
    
    if (endDate) {
      query = query.where(lt(inventoryValuations.valuationDate, endDate));
    }
    
    return query;
  }

  /**
   * Create a new batch record when receiving stock
   * Used for FIFO/LIFO tracking
   * 
   * @param data - Batch data
   * @param userId - User ID who created the batch
   */
  async createBatch(data: {
    companyId: string;
    productId: string;
    warehouseId: string;
    batchNumber: string;
    purchasePrice: number;
    quantity: number;
    purchaseDate: Date;
    expiryDate?: Date;
    supplier?: string;
    invoiceNumber?: string;
    notes?: string;
  }, userId: string): Promise<any> {
    // Set the remaining quantity to the initial quantity
    const batchData = {
      ...data,
      remainingQuantity: data.quantity,
      createdBy: userId
    };
    
    // Validate with Zod schema
    const validatedData = insertBatchSchema.parse(batchData);
    
    const [batch] = await this.db.insertInto(inventoryBatches)
      .values(validatedData)
      .returning();
    
    // Log the batch creation for audit purposes
    await AuditService.log({
      action: AuditAction.CREATE,
      entity: 'batch',
      entityId: batch.id,
      userId,
      companyId: batch.companyId,
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice
      }
    });
    
    return batch;
  }

  /**
   * Update batch quantities when stock is consumed
   * Used for FIFO/LIFO inventory management
   * 
   * @param productId - Product ID
   * @param warehouseId - Warehouse ID
   * @param quantity - Quantity to consume
   * @param method - FIFO or LIFO method
   * @param userId - User ID who is consuming the stock
   */
  async consumeStock(
    productId: string,
    warehouseId: string,
    quantity: number,
    method: 'FIFO' | 'LIFO',
    userId: string
  ): Promise<{
    success: boolean;
    consumedQuantity: number;
    consumedValue: number;
    remainingToConsume: number;
    batchesUpdated: any[];
  }> {
    if (quantity <= 0) {
      throw new Error('Quantity to consume must be positive');
    }
    
    // Get batches based on the selected method
    let batches;
    if (method === 'FIFO') {
      // Get oldest batches first for FIFO
      batches = await this.db.select()
        .from(inventoryBatches)
        .where(
          and(
            eq(inventoryBatches.productId, productId),
            eq(inventoryBatches.warehouseId, warehouseId),
            sql`${inventoryBatches.remainingQuantity} > 0`
          )
        )
        .orderBy(asc(inventoryBatches.purchaseDate));
    } else {
      // Get newest batches first for LIFO
      batches = await this.db.select()
        .from(inventoryBatches)
        .where(
          and(
            eq(inventoryBatches.productId, productId),
            eq(inventoryBatches.warehouseId, warehouseId),
            sql`${inventoryBatches.remainingQuantity} > 0`
          )
        )
        .orderBy(desc(inventoryBatches.purchaseDate));
    }
    
    let remainingToConsume = quantity;
    let consumedValue = 0;
    const batchesUpdated = [];
    
    // Consume from batches one by one until the required quantity is reached
    for (const batch of batches) {
      if (remainingToConsume <= 0) break;
      
      const batchRemaining = Number(batch.remainingQuantity);
      const consumeFromBatch = Math.min(batchRemaining, remainingToConsume);
      
      // Update the batch remaining quantity
      const newRemaining = batchRemaining - consumeFromBatch;
      const [updatedBatch] = await this.db.update(inventoryBatches)
        .set({
          remainingQuantity: newRemaining,
          updatedAt: new Date()
        })
        .where(eq(inventoryBatches.id, batch.id))
        .returning();
      
      // Calculate the value consumed from this batch
      const batchValue = consumeFromBatch * Number(batch.purchasePrice);
      consumedValue += batchValue;
      
      // Add to the list of updated batches
      batchesUpdated.push({
        id: batch.id,
        quantityConsumed: consumeFromBatch,
        valueConsumed: batchValue,
        remainingQuantity: newRemaining
      });
      
      // Update how much more needs to be consumed
      remainingToConsume -= consumeFromBatch;
    }
    
    // Log the stock consumption for audit purposes
    await AuditService.log({
      action: AuditAction.UPDATE,
      entity: 'stock',
      entityId: `${productId}-${warehouseId}`,
      userId,
      companyId: batchesUpdated.length > 0 ? batchesUpdated[0].companyId : warehouseId.split('-')[0], // Get companyId from batch or extract from warehouseId
      data: {
        productId,
        warehouseId,
        quantityRequested: quantity,
        quantityConsumed: quantity - remainingToConsume,
        valueConsumed: consumedValue,
        method,
        batchesUpdated: batchesUpdated.map(b => b.id)
      }
    });
    
    return {
      success: remainingToConsume === 0,
      consumedQuantity: quantity - remainingToConsume,
      consumedValue,
      remainingToConsume,
      batchesUpdated
    };
  }

  /**
   * Update product and stock records with the latest valuation
   * 
   * @param productId - Product ID
   * @param warehouseId - Warehouse ID
   * @param method - Valuation method
   * @param userId - User ID
   */
  async updateProductValuation(
    productId: string,
    warehouseId: string,
    method: keyof typeof inventoryValuationMethodEnum,
    userId: string
  ): Promise<any> {
    // Calculate the current value using the specified method
    const valuation = await this.calculateStockValue(productId, warehouseId, method);
    
    // Get company ID (required for the valuation record)
    const [product] = await this.db.select({ companyId: inventoryBatches.companyId })
      .from(inventoryBatches)
      .where(eq(inventoryBatches.productId, productId))
      .limit(1);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found in any batch records`);
    }
    
    // Save the valuation record
    return this.saveValuation({
      companyId: product.companyId,
      productId,
      warehouseId,
      method,
      quantity: valuation.quantity,
      unitValue: valuation.averageUnitValue,
      totalValue: valuation.value,
      valuationDate: new Date(),
      notes: `Automatic valuation using ${method} method`
    }, userId);
  }
}