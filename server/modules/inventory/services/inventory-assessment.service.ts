/**
 * Inventory Assessment Service
 * 
 * This service implements inventory assessment functionality
 */

import { v4 as uuidv4 } from 'uuid';
import type postgres from 'postgres';

// Get PostgreSQL connection pool from global
// Note: Pool is now a postgres-js Sql instance, not Neon Pool
// @ts-ignore - Pool is defined in server/db.ts and attached to global
const pool = globalThis.pool as ReturnType<typeof postgres>;

export class InventoryAssessmentService {
  constructor() {}

  /**
   * Create a new inventory assessment document
   */
  async createAssessment(data: any, userId: string, companyId: string): Promise<any> {
    console.log(`[inventory-assessment] Creating assessment with data:`, JSON.stringify(data, null, 2));
    
    const client = await pool.connect();
    
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
      
      const result = await client.query(query, values);
      console.log(`[inventory-assessment] Assessment created successfully`);
      
      return result.rows[0];
    } catch (error) {
      console.error(`[inventory-assessment] Error creating assessment:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Initialize assessment with products from stock
   */
  async initializeAssessmentItems(
    assessmentId: string, 
    warehouseId: string, 
    companyId: string, 
    userId: string
  ): Promise<any> {
    console.log(`[inventory-assessment] Initializing assessment items for assessment: ${assessmentId}`);
    
    try {
      const client = await pool.connect();
      
      try {
        // Get assessment details first
        const assessmentQuery = `
          SELECT * FROM inventory_assessments 
          WHERE id = $1
        `;
        
        const assessmentResult = await client.query(assessmentQuery, [assessmentId]);
        
        if (assessmentResult.rows.length === 0) {
          throw new Error(`Assessment not found: ${assessmentId}`);
        }
        
        const assessment = assessmentResult.rows[0];
      
        // Verify assessment status is DRAFT
        if (assessment.status !== 'draft') {
          throw new Error(`Assessment must be in DRAFT status to initialize items. Current status: ${assessment.status}`);
        }
        
        console.log(`[inventory-assessment] Assessment warehouse ID: ${warehouseId}`);
        
        // Get all products with stock in the warehouse - using parameterized query
        console.log(`[inventory-assessment] Getting stock items for warehouse ${warehouseId}`);
        
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
        
        const stocksResult = await client.query(stocksQuery, [warehouseId]);
        let stockItems = stocksResult.rows;
        
        console.log(`[inventory-assessment] Found ${stockItems.length} stock items in stocks table`);
        
        // If no items found in stocks, try the inventory_stock table (backup)
        if (stockItems.length === 0) {
          console.log(`[inventory-assessment] No items in stocks table, trying inventory_stock table`);
          
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
          
          const inventoryStockResult = await client.query(inventoryStockQuery, [warehouseId, companyId]);
          stockItems = inventoryStockResult.rows;
          console.log(`[inventory-assessment] Found ${stockItems.length} stock items in inventory_stock table`);
        }
        
        // Create assessment items for each stock item
        let assessmentItems = [];
        let successCount = 0;
        let errorCount = 0;
        
        if (stockItems.length === 0) {
          console.log(`[inventory-assessment] No stock items found for warehouse: ${warehouseId}`);
          
          // Update assessment status to IN_PROGRESS even with no items
          // This allows the user to proceed to the next step
          const updateStatusQuery = `
            UPDATE inventory_assessments
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
          `;
          
          await client.query(updateStatusQuery, ['in_progress', assessmentId]);
          
          return {
            assessment: {
              ...assessment,
              status: 'in_progress'
            },
            items: []
          };
        }
        
        // Process each stock item and create an assessment item
        console.log(`[inventory-assessment] Processing ${stockItems.length} stock items`);
        
        for (const item of stockItems) {
          console.log(`[inventory-assessment] Processing stock item for ${item.product_name || 'unknown product'}`);
          
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
            const insertResult = await client.query(insertQuery, [
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
            
            const assessmentItem = insertResult.rows[0];
            console.log(`[inventory-assessment] Item created with ID: ${assessmentItem.id}`);
            
            assessmentItems.push(assessmentItem);
            successCount++;
          } catch (insertError) {
            console.error(`[inventory-assessment] Error inserting item:`, insertError);
            errorCount++;
            // Continue with next item instead of failing the entire process
          }
        }
      
        // After processing all items, update assessment status to IN_PROGRESS
        console.log(`[inventory-assessment] Processed items with success: ${successCount}, errors: ${errorCount}`);
        
        if (successCount === 0 && errorCount > 0) {
          // All inserts failed - this is a real problem
          throw new Error(`Failed to insert any assessment items. Please check the error logs.`);
        }
        
        // Update assessment status to IN_PROGRESS using direct SQL
        console.log(`[inventory-assessment] Updating assessment status to IN_PROGRESS`);
        const updateStatusQuery = `
          UPDATE inventory_assessments
          SET status = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        
        const updateResult = await client.query(updateStatusQuery, ['in_progress', assessmentId]);
        
        if (updateResult.rows.length === 0) {
          throw new Error(`Failed to update assessment status to IN_PROGRESS`);
        }
        
        const updatedAssessment = updateResult.rows[0];
        
        // Return the result
        return {
          assessment: updatedAssessment,
          items: assessmentItems
        };
      } finally {
        // Always release the database client
        client.release();
      }
    } catch (error) {
      console.error(`[inventory-assessment] Error in initializeAssessmentItems:`, error);
      throw error;
    }
  }
  
  /**
   * Get assessment by ID
   */
  async getAssessmentById(assessmentId: string): Promise<any> {
    console.log(`[inventory-assessment] Getting assessment details for ID: ${assessmentId}`);
    
    try {
      const client = await pool.connect();
      try {
        const query = `
          SELECT * FROM inventory_assessments 
          WHERE id = $1
        `;
        
        const result = await client.query(query, [assessmentId]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return result.rows[0];
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`[inventory-assessment] Error in getAssessmentById:`, error);
      throw error;
    }
  }

  /**
   * Get assessment with items
   */
  async getAssessmentWithItems(assessmentId: string): Promise<any> {
    console.log(`[inventory-assessment] Getting assessment details with items for ID: ${assessmentId}`);
    
    try {
      // Get the assessment first
      const assessment = await this.getAssessmentById(assessmentId);
      if (!assessment) {
        return null;
      }
      
      // Get the items
      const client = await pool.connect();
      try {
        const query = `
          SELECT * FROM inventory_assessment_items 
          WHERE assessment_id = $1
        `;
        
        const result = await client.query(query, [assessmentId]);
        const items = result.rows;
        
        return {
          assessment,
          items
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`[inventory-assessment] Error in getAssessmentWithItems:`, error);
      throw error;
    }
  }
}