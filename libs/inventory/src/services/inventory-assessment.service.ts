/**
 * Inventory Assessment Service
 * 
 * This service implements inventory assessment functionality
 */

import { v4 as uuidv4 } from 'uuid';
import type postgres from 'postgres';
import type {
  CreateAssessmentData,
  InventoryAssessment,
  InventoryAssessmentItem,
  AssessmentWithItems,
  ProcessDifferencesResult
} from './types/inventory-assessment.types';

// Get PostgreSQL connection pool from global
// Note: Pool is now a postgres-js Sql instance, not Neon Pool
const pool = globalThis.pool as ReturnType<typeof postgres>;

export class InventoryAssessmentService {
  constructor() {}

  /**
   * Create a new inventory assessment document
   */
  async createAssessment(data: CreateAssessmentData, userId: string, companyId: string): Promise<InventoryAssessment> {
    console.log(`Creating assessment with data: ${JSON.stringify(data, null, 2)}`, 'inventory-assessment');
    
    try {
      // Set default values and prepare data
      const assessmentId = uuidv4();
      const timestamp = new Date();
      
      const insertData = {
        id: assessmentId,
        name: data.name || 'Inventariere',
        company_id: companyId,
        warehouse_id: data.warehouseId,
        assessment_type: data.assessmentType || data.type || 'annual',
        status: 'draft',
        start_date: data.startDate ? new Date(data.startDate) : timestamp,
        end_date: data.endDate ? new Date(data.endDate) : null,
        commission_order_number: data.commissionOrderNumber || '',
        legal_basis: data.legalBasis || 'OMFP 2861/2009, Legea contabilității 82/1991',
        assessment_number: data.assessmentNumber || data.name || '',
        document_number: data.documentNumber || '',
        valuation_method: data.valuationMethod || 'WEIGHTED_AVERAGE',
        notes: data.notes || '',
        created_by: userId,
        created_at: timestamp,
        updated_at: timestamp
      };
      
      const query = `
        INSERT INTO inventory_assessments (
          id, name, company_id, warehouse_id, assessment_type,
          status, start_date, end_date, commission_order_number,
          legal_basis, assessment_number, document_number, valuation_method,
          notes, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *
      `;
      
      const values = [
        insertData.id,
        insertData.name,
        insertData.company_id,
        insertData.warehouse_id,
        insertData.assessment_type,
        insertData.status,
        insertData.start_date,
        insertData.end_date,
        insertData.commission_order_number,
        insertData.legal_basis,
        insertData.assessment_number,
        insertData.document_number,
        insertData.valuation_method,
        insertData.notes,
        insertData.created_by,
        insertData.created_at,
        insertData.updated_at
      ];
      
      const [result] = await pool.unsafe(query, values);
      console.log('Assessment created successfully', 'inventory-assessment');
      
      return result as unknown as InventoryAssessment;
    } catch (error) {
      console.error('[inventory-assessment] Error creating assessment:', error);
      throw error;
    }
  }

  /**
   * Initialize assessment with products from stock
   */
  async initializeAssessmentItems(
    assessmentId: string, 
    warehouseId: string, 
    companyId: string, 
    _userId: string
  ): Promise<AssessmentWithItems> {
    console.log(`Initializing assessment items for assessment: ${assessmentId}`, 'inventory-assessment');
    
    try {
      // Get assessment details first
      const assessmentQuery = `
        SELECT * FROM inventory_assessments 
        WHERE id = $1
      `;
      
      const assessmentResult = await pool.unsafe(assessmentQuery, [assessmentId]);
      
      if (assessmentResult.length === 0) {
        throw new Error(`Assessment not found: ${assessmentId}`);
      }
      
      const assessment = assessmentResult[0];
    
      // Verify assessment status is DRAFT
      if (assessment.status !== 'draft') {
        throw new Error(`Assessment must be in DRAFT status to initialize items. Current status: ${assessment.status}`);
      }
      
      console.log(`Assessment warehouse ID: ${warehouseId}`, 'inventory-assessment');
      
      // Get all products with stock in the warehouse - using parameterized query
      console.log(`Getting stock items for warehouse ${warehouseId}`, 'inventory-assessment');
      
      // First try getting items from the stocks table
      const stocksQuery = `
        SELECT 
          p.id as product_id, 
          p.name as product_name,
          p.sku as product_code,
          COALESCE(u.name, 'buc') as unit_of_measure,
          SUM(s.quantity) as theoretical_quantity,
          COALESCE(SUM(s.quantity * s.purchase_price), 0) as theoretical_value
        FROM 
          stocks s
        JOIN 
          inventory_products p ON s.product_id = p.id
        LEFT JOIN 
          inventory_units u ON p.unit_id = u.id
        WHERE 
          s.warehouse_id = $1
          AND s.quantity > 0
        GROUP BY 
          p.id, p.name, p.sku, u.name
      `;
      
      const stockItems = await pool.unsafe(stocksQuery, [warehouseId]);
      let stockItemsList = stockItems;
      
      console.log(`Found ${stockItemsList.length} stock items in stocks table`, 'inventory-assessment');
      
      // If no items found in stocks, try the inventory_stock table (backup)
      if (stockItemsList.length === 0) {
        console.log('No items in stocks table, trying inventory_stock table', 'inventory-assessment');
        
        const inventoryStockQuery = `
          SELECT 
            s.product_id, 
            p.name as product_name,
            p.code as product_code,
            s.quantity as theoretical_quantity,
            p.unit_of_measure,
            COALESCE(s.value, 0) as theoretical_value
          FROM 
            inventory_stock s
          JOIN 
            inventory_products p ON s.product_id = p.id
          WHERE 
            s.warehouse_id = $1 AND s.company_id = $2
            AND s.quantity > 0
        `;
        
        stockItemsList = await pool.unsafe(inventoryStockQuery, [warehouseId, companyId]);
        console.log(`Found ${stockItemsList.length} stock items in inventory_stock table`, 'inventory-assessment');
      }
      
      // Create assessment items for each stock item
      const assessmentItems = [];
      let successCount = 0;
      let errorCount = 0;
      
      if (stockItemsList.length === 0) {
        console.log(`No stock items found for warehouse: ${warehouseId}`, 'inventory-assessment');
        
        // Update assessment status to IN_PROGRESS even with no items
        // This allows the user to proceed to the next step
        const updateStatusQuery = `
          UPDATE inventory_assessments
          SET status = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        
        await pool.unsafe(updateStatusQuery, ['in_progress', assessmentId]);
        
        return {
          assessment: {
            ...assessment,
            status: 'in_progress'
          } as unknown as InventoryAssessment,
          items: []
        };
      }
      
      // Process each stock item and create an assessment item
      console.log(`Processing ${stockItemsList.length} stock items`, 'inventory-assessment');
      
      for (const item of stockItemsList) {
        console.log(`Processing stock item for ${item.product_name || 'unknown product'}`, 'inventory-assessment');
        
        try {
          // Generate a UUID for the item
          const itemId = uuidv4();
          
          // Build INSERT query with explicit CAST for numeric values
          const insertQuery = `
            INSERT INTO inventory_assessment_items (
              id, assessment_id, product_id, accounting_quantity, actual_quantity,
              unit_of_measure, accounting_value, actual_value, difference_quantity,
              difference_value, result_type, is_processed, notes, created_at
            ) VALUES (
              $1, $2, $3, 
              CAST($4 AS NUMERIC), CAST($5 AS NUMERIC),
              $6, 
              CAST($7 AS NUMERIC), CAST($8 AS NUMERIC), 
              CAST($9 AS NUMERIC), CAST($10 AS NUMERIC),
              $11, $12, $13, NOW()
            ) RETURNING *
          `;
          
          // Execute the insert with safe values
          const insertResult = await pool.unsafe(insertQuery, [
            itemId,
            assessmentId,
            item.product_id,
            parseFloat(item.theoretical_quantity) || 0,
            0, // actual_quantity
            item.unit_of_measure || 'buc',
            parseFloat(item.theoretical_value) || 0,
            0, // actual_value
            0, // difference_quantity
            0, // difference_value
            'MATCH', // result_type
            false, // is_processed
            `${item.product_code || ''} - ${item.product_name || 'Produs necunoscut'}`
          ]);
          
          const assessmentItem = insertResult[0];
          console.log(`Item created with ID: ${assessmentItem.id}`, 'inventory-assessment');
          
          assessmentItems.push(assessmentItem);
          successCount++;
        } catch (insertError) {
          console.error('[inventory-assessment] Error inserting item:', insertError);
          errorCount++;
          // Continue with next item instead of failing the entire process
        }
      }
    
      // After processing all items, update assessment status to IN_PROGRESS
      console.log(`Processed items with success: ${successCount}, errors: ${errorCount}`, 'inventory-assessment');
      
      if (successCount === 0 && errorCount > 0) {
        // All inserts failed - this is a real problem
        throw new Error(`Failed to insert any assessment items. Please check the error logs.`);
      }
      
      // Update assessment status to IN_PROGRESS using direct SQL
      console.log('Updating assessment status to IN_PROGRESS', 'inventory-assessment');
      const updateStatusQuery = `
        UPDATE inventory_assessments
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      const updateResult = await pool.unsafe(updateStatusQuery, ['in_progress', assessmentId]);
      
      if (updateResult.length === 0) {
        throw new Error(`Failed to update assessment status to IN_PROGRESS`);
      }
      
      const updatedAssessment = updateResult[0];
      
      // Return the result
      return {
        assessment: updatedAssessment as unknown as InventoryAssessment,
        items: assessmentItems as unknown as InventoryAssessmentItem[]
      };
    } catch (error) {
      console.error('[inventory-assessment] Error in initializeAssessmentItems:', error);
      throw error;
    }
  }
  
  /**
   * Get assessment by ID
   */
  async getAssessmentById(assessmentId: string): Promise<InventoryAssessment | null> {
    console.log(`Getting assessment details for ID: ${assessmentId}`, 'inventory-assessment');
    
    try {
      const query = `
        SELECT * FROM inventory_assessments 
        WHERE id = $1
      `;
      
      const result = await pool.unsafe(query, [assessmentId]);
      
      if (result.length === 0) {
        return null;
      }
      
      return result[0] as unknown as InventoryAssessment;
    } catch (error) {
      console.error('[inventory-assessment] Error in getAssessmentById:', error);
      throw error;
    }
  }

  /**
   * Get assessment with items
   */
  async getAssessmentWithItems(assessmentId: string): Promise<AssessmentWithItems | null> {
    console.log(`Getting assessment details with items for ID: ${assessmentId}`, 'inventory-assessment');
    
    try {
      // Get the assessment first
      const assessment = await this.getAssessmentById(assessmentId);
      if (!assessment) {
        return null;
      }
      
      // Get the items
      const query = `
        SELECT * FROM inventory_assessment_items 
        WHERE assessment_id = $1
      `;
      
      const items = await pool.unsafe(query, [assessmentId]);
      
      return {
        assessment,
        items: items as unknown as InventoryAssessmentItem[]
      };
    } catch (error) {
      console.error('[inventory-assessment] Error in getAssessmentWithItems:', error);
      throw error;
    }
  }
  /**
   * Update assessment status
   * Placeholder method - implementation needed
   */
  async updateAssessmentStatus(assessmentId: string, status: string, _userId: string): Promise<InventoryAssessment> {
    console.log(`Updating assessment ${assessmentId} status to ${status}`, 'inventory-assessment');
    
    try {
      const query = `
        UPDATE inventory_assessments
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pool.unsafe(query, [status, assessmentId]);
      
      if (result.length === 0) {
        throw new Error(`Assessment not found: ${assessmentId}`);
      }
      
      return result[0] as unknown as InventoryAssessment;
    } catch (error) {
      console.error('[inventory-assessment] Error updating assessment status:', error);
      throw error;
    }
  }

  /**
   * Record actual item count
   * Placeholder method - implementation needed
   */
  async recordItemCount(
    itemId: string, 
    actualQuantity: number, 
    notes: string | null, 
    countedBy: string, 
    _userId: string
  ): Promise<InventoryAssessmentItem> {
    console.log(`Recording item count for ${itemId}: ${actualQuantity}`, 'inventory-assessment');
    
    try {
      const query = `
        UPDATE inventory_assessment_items
        SET actual_quantity = $1, 
            difference_quantity = accounting_quantity - $1,
            notes = $2,
            counted_by = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await pool.unsafe(query, [actualQuantity, notes, countedBy, itemId]);
      
      if (result.length === 0) {
        throw new Error(`Assessment item not found: ${itemId}`);
      }
      
      return result[0] as unknown as InventoryAssessmentItem;
    } catch (error) {
      console.error('[inventory-assessment] Error recording item count:', error);
      throw error;
    }
  }

  /**
   * Process inventory differences
   * Placeholder method - implementation needed
   */
  async processInventoryDifferences(assessmentId: string, _userId: string): Promise<ProcessDifferencesResult> {
    console.log(`Processing inventory differences for ${assessmentId}`, 'inventory-assessment');
    
    try {
      // This would typically:
      // 1. Calculate all differences
      // 2. Create accounting entries for surpluses/deficits
      // 3. Update stock levels
      // 4. Mark assessment as processed
      
      // For now, just return a placeholder
      return {
        success: true,
        message: 'Inventory differences processing not yet fully implemented',
        assessmentId
      };
    } catch (error) {
      console.error('[inventory-assessment] Error processing inventory differences:', error);
      throw error;
    }
  }
}
