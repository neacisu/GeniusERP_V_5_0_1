/**
 * CheckStockLevelsService
 * 
 * This service monitors stock quantities and enqueues alerts when items fall below
 * their defined minimum thresholds. It uses BullMQ for async task processing.
 * This is essential for low-stock notifications and warehouse replenishment automation.
 */

import { getDrizzle } from '../../../common/drizzle/drizzle.service';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { log } from '../../../vite';
// Import the queue from the centralized BullMQ module
import { inventoryQueue } from '../../../common/bullmq';
// Keep QueueService import for backward compatibility
import { QueueService } from '../../../services/queue.service';

// Types for stock alerts
export type LowStockAlert = {
  productId: string;
  productName: string;
  productCode: string;
  warehouseId: string;
  warehouseName: string;
  currentQuantity: number;
  minThreshold: number;
  companyId: string;
  franchiseId?: string | null;
};

export type StockCheckResult = {
  alerts: LowStockAlert[];
  totalProducts: number;
  belowThreshold: number;
  timestamp: Date;
};

export class CheckStockLevelsService {
  private drizzle: any;
  
  /**
   * Create a new CheckStockLevelsService instance
   * 
   * @param stockQueue BullMQ queue for processing low stock alerts
   */
  constructor(private stockQueue?: Queue) {
    this.drizzle = {
      query: async (sql: string) => {
        const db = getDrizzle();
        // Execute the SQL without parameters (we're using string interpolation)
        return db.execute(sql);
      }
    };
  }
  
  /**
   * Check stock levels for a company across all warehouses
   * 
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID filter
   * @param warehouseId Optional warehouse ID filter
   * @returns Results of the stock check with alerts
   */
  async checkLevels(companyId: string, franchiseId?: string, warehouseId?: string): Promise<StockCheckResult> {
    log(`[CheckStockLevelsService] 🔍 Checking stock levels for company: ${companyId}`, 'inventory-stock-check');
    
    try {
      // Build query to check stock against thresholds using string interpolation for simpler testing
      let sql = `
        SELECT 
          s.id AS stock_id,
          s.product_id,
          s.warehouse_id,
          s.quantity,
          p.code AS product_code,
          p.name AS product_name,
          p.stock_alert AS min_threshold,
          w.name AS warehouse_name,
          s.company_id,
          s.franchise_id
        FROM 
          stocks s
        JOIN 
          inventory_products p ON s.product_id = p.id
        JOIN
          warehouses w ON s.warehouse_id = w.id
        WHERE 
          s.company_id = '${companyId}'
          AND p.stock_alert > 0
          AND s.quantity <= p.stock_alert
      `;
      
      // Add optional filters directly in the query
      if (franchiseId) {
        sql += ` AND s.franchise_id = '${franchiseId}'`;
      }
      
      if (warehouseId) {
        sql += ` AND s.warehouse_id = '${warehouseId}'`;
      }
      
      // Get only active warehouses
      sql += ` AND w.is_active = true`;
      
      // Log the full query for debugging
      log(`[CheckStockLevelsService] Running low stock query: ${sql}`, 'inventory-stock-check');
      
      // Execute the query (no params needed with string interpolation)
      const lowStockResult = await this.drizzle.query(sql);
      
      // Get total product count for the company (for reporting percentage)
      const totalCountResult = await this.drizzle.query(
        `SELECT COUNT(DISTINCT s.product_id) AS total 
         FROM stocks s 
         WHERE s.company_id = '${companyId}'`
      );
      
      // Safely access rows with defensive checks for both array and rows property
      const lowStockRows = Array.isArray(lowStockResult) ? lowStockResult : 
                          (lowStockResult?.rows || []);
      
      // Same defensive check for total count
      const totalCountRow = Array.isArray(totalCountResult) ? totalCountResult[0] : 
                           (totalCountResult?.rows?.[0]);
                           
      const totalProducts = totalCountRow?.total || 0;
      const alerts: LowStockAlert[] = [];
      
      // Process results and add jobs to the queue
      for (const item of lowStockRows) {
        const alert: LowStockAlert = {
          productId: item.product_id,
          productName: item.product_name,
          productCode: item.product_code,
          warehouseId: item.warehouse_id,
          warehouseName: item.warehouse_name,
          currentQuantity: parseFloat(item.quantity),
          minThreshold: parseFloat(item.min_threshold),
          companyId: item.company_id,
          franchiseId: item.franchise_id
        };
        
        alerts.push(alert);
        
        // If we have a queue, add the alert to it
        if (this.stockQueue) {
          await this.stockQueue.add('low-stock-alert', {
            id: randomUUID(),
            alert,
            timestamp: new Date().toISOString()
          }, {
            // Set job options for better reliability
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000
            },
            // Add to the job ID to ensure uniqueness
            jobId: `low-stock-${alert.productId}-${alert.warehouseId}-${new Date().getTime()}`
          });
          
          log(`[CheckStockLevelsService] ✅ Queued alert for ${item.product_name} in ${item.warehouse_name}`, 'inventory-stock-check');
        } else {
          log(`[CheckStockLevelsService] ⚠️ No queue available, alert for ${item.product_name} was not queued`, 'inventory-stock-check');
        }
      }
      
      const result: StockCheckResult = {
        alerts,
        totalProducts: parseInt(totalProducts.toString()),
        belowThreshold: alerts.length,
        timestamp: new Date()
      };
      
      log(`[CheckStockLevelsService] ✅ Found ${alerts.length} products below threshold out of ${totalProducts} total`, 'inventory-stock-check');
      
      return result;
    } catch (error: any) {
      log(`[CheckStockLevelsService] ❌ Error checking stock levels: ${error.message}`, 'inventory-stock-check-error');
      throw new Error(`Failed to check stock levels: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Create a scheduled job that checks stock levels periodically
   * 
   * @param companyId Company ID
   * @param schedulePattern Cron pattern (default: once per day at midnight)
   * @returns Job ID for the scheduled task
   */
  async scheduleRegularChecks(companyId: string, schedulePattern: string = '0 0 * * *'): Promise<string | null> {
    if (!this.stockQueue) {
      log(`[CheckStockLevelsService] ⚠️ Cannot schedule checks without a queue`, 'inventory-stock-check');
      return null;
    }
    
    try {
      const jobId = `stock-check-${companyId}`;
      
      // Remove any existing job with this ID
      try {
        await this.stockQueue.removeRepeatable('scheduled-stock-check', { jobId, pattern: schedulePattern });
      } catch (error) {
        // If job doesn't exist yet, this is ok
        log(`[CheckStockLevelsService] No existing job found to remove, continuing...`, 'inventory-stock-check');
      }
      
      // Create a new repeatable job with improved options
      await this.stockQueue.add(
        'scheduled-stock-check',
        { 
          id: randomUUID(),
          companyId,
          timestamp: new Date().toISOString() 
        },
        {
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          repeat: {
            pattern: schedulePattern
          }
        }
      );
      
      log(`[CheckStockLevelsService] ✅ Scheduled regular stock checks for company ${companyId} with pattern: ${schedulePattern}`, 'inventory-stock-check');
      
      return jobId;
    } catch (error: any) {
      log(`[CheckStockLevelsService] ❌ Error scheduling stock checks: ${error.message}`, 'inventory-stock-check-error');
      throw new Error(`Failed to schedule stock checks: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Get the list of products that are close to their minimum threshold
   * (between 100% and 120% of the threshold)
   * 
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID filter
   * @returns List of products approaching their minimum threshold
   */
  async getApproachingThreshold(companyId: string, franchiseId?: string): Promise<any[]> {
    try {
      let sql = `
        SELECT 
          s.id AS stock_id,
          s.product_id,
          s.warehouse_id,
          s.quantity,
          p.code AS product_code,
          p.name AS product_name,
          p.stock_alert AS min_threshold,
          w.name AS warehouse_name,
          s.company_id,
          s.franchise_id,
          ROUND((s.quantity / p.stock_alert) * 100, 2) AS threshold_percentage
        FROM 
          stocks s
        JOIN 
          inventory_products p ON s.product_id = p.id
        JOIN
          warehouses w ON s.warehouse_id = w.id
        WHERE 
          s.company_id = '${companyId}'
          AND p.stock_alert > 0
          AND s.quantity > p.stock_alert
          AND s.quantity <= (p.stock_alert * 1.2)
      `;
      
      // Add optional filter using string interpolation
      if (franchiseId) {
        sql += ` AND s.franchise_id = '${franchiseId}'`;
      }
      
      // Get only active warehouses
      sql += ` AND w.is_active = true`;
      
      // Sort by percentage (closest to threshold first)
      sql += ` ORDER BY threshold_percentage ASC`;
      
      // Log the full query for debugging
      log(`[CheckStockLevelsService] Running approaching threshold query: ${sql}`, 'inventory-stock-check');
      
      // Execute the query
      const result = await this.drizzle.query(sql);
      
      // Safely access rows with defensive checks for both array and rows property
      const approachingRows = Array.isArray(result) ? result : 
                             (result?.rows || []);
      
      log(`[CheckStockLevelsService] ✅ Found ${approachingRows.length} products approaching threshold`, 'inventory-stock-check');
      
      return approachingRows;
    } catch (error: any) {
      log(`[CheckStockLevelsService] ❌ Error getting approaching threshold products: ${error.message}`, 'inventory-stock-check-error');
      throw new Error(`Failed to get approaching threshold products: ${error.message || String(error)}`);
    }
  }
}

// Create and export the singleton instance
// We'll connect it to the queue later to avoid circular dependencies
export const checkStockLevelsService = new CheckStockLevelsService();

// This function will be called from the module index file to set up the queue
export function initializeCheckStockLevelsService(stockQueue?: Queue): void {
  (checkStockLevelsService as any).stockQueue = stockQueue;
}