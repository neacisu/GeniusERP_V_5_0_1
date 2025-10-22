/**
 * CheckStockLevelsService
 * 
 * This service monitors stock quantities and enqueues alerts when items fall below
 * their defined minimum thresholds. It uses BullMQ for async task processing and
 * integrates with the NotificationService for real-time alerting.
 * This is essential for low-stock notifications and warehouse replenishment automation.
 */

import { getDrizzle, DrizzleService } from "@common/drizzle";
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { log } from '../../../vite';
// Import the queue from the centralized BullMQ module
import { inventoryQueue } from "@common/bullmq";
// Keep QueueService import for backward compatibility
import { QueueService } from '../../../services/queue.service';
// Import notification service for alerting
import { Services } from "@common/services/registry";
import { NotificationType, NotificationPriority } from "@common/services/notification.service";
import { eq, and, lte, gt } from 'drizzle-orm';

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

// Notification settings type
export type NotificationSettings = {
  enabled: boolean;
  recipientEmails: string[];
  notifyOnPercentage: number;
  channels: string[];
};

export class CheckStockLevelsService {
  private drizzle: DrizzleService;
  
  // Track notification settings in memory with company ID as key
  private notificationSettingsCache: Map<string, NotificationSettings> = new Map();
  
  // Default notification settings
  private readonly DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    recipientEmails: [],
    notifyOnPercentage: 20,
    channels: ['email', 'in-app']
  };
  
  /**
   * Create a new CheckStockLevelsService instance
   * 
   * @param stockQueue BullMQ queue for processing low stock alerts
   */
  constructor(private stockQueue?: Queue) {
    this.drizzle = new DrizzleService();
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
          p.sku AS product_code,
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
      const lowStockResult = await this.drizzle.executeQuery(sql);
      
      // Get total product count for the company (for reporting percentage)
      const totalCountResult = await this.drizzle.executeQuery(
        `SELECT COUNT(DISTINCT s.product_id) AS total 
         FROM stocks s 
         WHERE s.company_id = '${companyId}'`
      );
      
      // Safely access rows with defensive checks for both array and rows property
      const lowStockRows = Array.isArray(lowStockResult) ? lowStockResult : 
                          ((lowStockResult as any)?.rows || []);
      
      // Same defensive check for total count
      const totalCountRow = Array.isArray(totalCountResult) ? totalCountResult[0] : 
                           ((totalCountResult as any)?.rows?.[0]);
                           
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
        
        // Determine the severity based on how far below threshold
        const percentageBelowThreshold = (alert.minThreshold - alert.currentQuantity) / alert.minThreshold * 100;
        let priority = NotificationPriority.MEDIUM;
        let severity = 'medium';
        
        if (percentageBelowThreshold >= 50) {
          priority = NotificationPriority.CRITICAL;
          severity = 'critical';
        } else if (percentageBelowThreshold >= 25) {
          priority = NotificationPriority.HIGH;
          severity = 'high';
        } else if (percentageBelowThreshold < 10) {
          priority = NotificationPriority.LOW;
          severity = 'low';
        }
        
        // Add job to the BullMQ alert queue for processing
        try {
          // Use the inventoryQueue from the centralized BullMQ module
          await inventoryQueue.add('alert', {
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            sku: alert.productCode,
            warehouseId: alert.warehouseId,
            productId: alert.productId,
            productName: alert.productName,
            currentQuantity: alert.currentQuantity,
            minThreshold: alert.minThreshold,
            companyId: alert.companyId,
            severity: severity as any  // Cast to match the enum values in InventoryAlertJob
          }, {
            // Set job options for better reliability
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000
            },
            // Add to the job ID to ensure uniqueness
            jobId: `inventory-alert-${alert.productId}-${alert.warehouseId}-${new Date().getTime()}`
          });
          
          log(`[CheckStockLevelsService] ✅ Queued inventory alert job for ${item.product_name} with severity ${severity}`, 'inventory-stock-check');
        } catch (error: any) {
          log(`[CheckStockLevelsService] ⚠️ Failed to enqueue alert job: ${error?.message || String(error)}`, 'inventory-stock-check-error');
          
          // Fallback to direct notification if queuing fails
          try {
            // Send notification through the notification service as a fallback
            await Services.notification.notifyCompany(alert.companyId, {
              title: `Low Stock Alert: ${alert.productName}`,
              message: `Product ${alert.productName} (${alert.productCode}) in warehouse ${alert.warehouseName} is below minimum threshold. Current quantity: ${alert.currentQuantity}, Minimum threshold: ${alert.minThreshold}`,
              type: NotificationType.WARNING,
              priority,
              metadata: {
                productId: alert.productId,
                warehouseId: alert.warehouseId,
                currentQuantity: alert.currentQuantity,
                minThreshold: alert.minThreshold,
                percentageBelowThreshold: Math.round(percentageBelowThreshold)
              },
              actionUrl: `/inventory/products/${alert.productId}`
            });
            
            log(`[CheckStockLevelsService] ✅ Sent direct notification for ${item.product_name} (fallback)`, 'inventory-stock-check');
          } catch (notifyError: any) {
            log(`[CheckStockLevelsService] ⚠️ Failed to send fallback notification: ${notifyError?.message || String(notifyError)}`, 'inventory-stock-check-error');
          }
        }
        
        // If we have a queue, add the alert to it (keep for backward compatibility)
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
   * (between 100% and 120% of the threshold) and optionally send notifications
   * 
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID filter
   * @param sendNotifications Whether to send notifications (default: false)
   * @returns List of products approaching their minimum threshold
   */
  async getApproachingThreshold(companyId: string, franchiseId?: string, sendNotifications: boolean = false): Promise<any[]> {
    try {
      let sql = `
        SELECT 
          s.id AS stock_id,
          s.product_id,
          s.warehouse_id,
          s.quantity,
          p.sku AS product_code,
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
          AND s.quantity <= (p.stock_alert * 3.0)
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
      const result = await this.drizzle.executeQuery(sql);
      
      // Safely access rows with defensive checks for both array and rows property
      const approachingRows = Array.isArray(result) ? result : 
                             ((result as any)?.rows || []);
      
      log(`[CheckStockLevelsService] ✅ Found ${approachingRows.length} products approaching threshold`, 'inventory-stock-check');
      
      // Send notifications if requested
      if (sendNotifications && approachingRows.length > 0) {
        for (const item of approachingRows) {
          try {
            // Calculate how close to threshold (lower percentage means closer)
            const thresholdPercentage = parseFloat(item.threshold_percentage);
            let priority = NotificationPriority.LOW;
            
            // If less than 105% of threshold, use medium priority
            if (thresholdPercentage < 105) {
              priority = NotificationPriority.MEDIUM;
            }
            
            // Send notification via NotificationService
            await Services.notification.notifyCompany(item.company_id, {
              title: `Stock Level Warning: ${item.product_name}`,
              message: `Product ${item.product_name} (${item.product_code}) in warehouse ${item.warehouse_name} is approaching minimum threshold. Current quantity: ${item.quantity}, Minimum threshold: ${item.min_threshold}`,
              type: NotificationType.INFO,
              priority,
              metadata: {
                productId: item.product_id,
                warehouseId: item.warehouse_id,
                currentQuantity: parseFloat(item.quantity),
                minThreshold: parseFloat(item.min_threshold),
                thresholdPercentage: thresholdPercentage
              },
              actionUrl: `/inventory/products/${item.product_id}`
            });
            
            log(`[CheckStockLevelsService] ✅ Sent approaching threshold notification for ${item.product_name}`, 'inventory-stock-check');
          } catch (error: any) {
            log(`[CheckStockLevelsService] ⚠️ Failed to send approaching threshold notification: ${error?.message || String(error)}`, 'inventory-stock-check-error');
          }
        }
      }
      
      return approachingRows;
    } catch (error: any) {
      log(`[CheckStockLevelsService] ❌ Error getting approaching threshold products: ${error.message}`, 'inventory-stock-check-error');
      throw new Error(`Failed to get approaching threshold products: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Get low stock products based on threshold percentage
   * 
   * @param companyId Company ID to check
   * @param warehouseId Optional warehouse filter 
   * @param thresholdPercentage Percentage threshold (products with percentage <= this value will be returned)
   * @returns List of products below the specified threshold percentage
   */
  async getLowStockProducts(companyId: string, warehouseId?: string, thresholdPercentage: number = 20): Promise<any[]> {
    try {
      log(`[CheckStockLevelsService] Getting low stock products for company ${companyId} (threshold: ${thresholdPercentage}%)`, 'inventory-stock-check');
      
      let sql = `
        SELECT 
          s.id AS stock_id,
          s.product_id,
          s.warehouse_id,
          s.quantity,
          p.sku AS product_code,
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
          AND ((s.quantity / p.stock_alert) * 100) <= ${thresholdPercentage}
      `;
      
      // Add warehouse filter if provided
      if (warehouseId) {
        sql += ` AND s.warehouse_id = '${warehouseId}'`;
      }
      
      // Get only active warehouses
      sql += ` AND w.is_active = true`;
      
      // Sort by percentage (lowest percentage first)
      sql += ` ORDER BY threshold_percentage ASC`;
      
      // Execute the query
      const result = await this.drizzle.executeQuery(sql);
      
      // Safely access rows with defensive checks
      const lowStockProducts = Array.isArray(result) ? result : ((result as any)?.rows || []);
      
      log(`[CheckStockLevelsService] ✅ Found ${lowStockProducts.length} products below ${thresholdPercentage}% threshold`, 'inventory-stock-check');
      
      return lowStockProducts;
    } catch (error: any) {
      log(`[CheckStockLevelsService] ❌ Error getting low stock products: ${error.message}`, 'inventory-stock-check-error');
      throw new Error(`Failed to get low stock products: ${error.message || String(error)}`);
    }
  }
  
  /**
   * Get notification settings for a company
   * 
   * @param companyId Company ID
   * @returns The company's notification settings or default settings if none found
   */
  async getNotificationSettings(companyId: string): Promise<NotificationSettings> {
    try {
      log(`[CheckStockLevelsService] Getting notification settings for company ${companyId}`, 'inventory-settings');
      
      // Check if settings already exist in memory cache
      if (this.notificationSettingsCache.has(companyId)) {
        return this.notificationSettingsCache.get(companyId) as NotificationSettings;
      }
      
      // Try to load settings from company_settings table
      const settingsQuery = `
        SELECT metadata
        FROM company_settings
        WHERE company_id = '${companyId}'
        AND key = 'inventory_stock_notifications'
        LIMIT 1
      `;
      
      try {
        const result = await this.drizzle.executeQuery(settingsQuery);
        const rows = Array.isArray(result) ? result : ((result as any)?.rows || []);
        
        if (rows.length > 0 && rows[0].metadata) {
          // Parse settings from metadata JSON
          const settings = typeof rows[0].metadata === 'string' 
            ? JSON.parse(rows[0].metadata) 
            : rows[0].metadata;
            
          // Validate and merge with defaults
          const validatedSettings: NotificationSettings = {
            enabled: settings.enabled !== undefined ? Boolean(settings.enabled) : this.DEFAULT_NOTIFICATION_SETTINGS.enabled,
            recipientEmails: Array.isArray(settings.recipientEmails) ? settings.recipientEmails : this.DEFAULT_NOTIFICATION_SETTINGS.recipientEmails,
            notifyOnPercentage: typeof settings.notifyOnPercentage === 'number' ? settings.notifyOnPercentage : this.DEFAULT_NOTIFICATION_SETTINGS.notifyOnPercentage,
            channels: Array.isArray(settings.channels) ? settings.channels : this.DEFAULT_NOTIFICATION_SETTINGS.channels
          };
          
          // Cache for future use
          this.notificationSettingsCache.set(companyId, validatedSettings);
          
          log(`[CheckStockLevelsService] ✅ Loaded notification settings for company ${companyId}`, 'inventory-settings');
          return validatedSettings;
        }
      } catch (error: any) {
        // If there's an error querying, log it but don't fail - we'll return defaults
        log(`[CheckStockLevelsService] ⚠️ Error querying notification settings: ${error.message}`, 'inventory-settings-error');
      }
      
      // Return default settings if none found
      this.notificationSettingsCache.set(companyId, { ...this.DEFAULT_NOTIFICATION_SETTINGS });
      log(`[CheckStockLevelsService] ℹ️ Using default notification settings for company ${companyId}`, 'inventory-settings');
      return { ...this.DEFAULT_NOTIFICATION_SETTINGS };
    } catch (error: any) {
      log(`[CheckStockLevelsService] ❌ Error getting notification settings: ${error.message}`, 'inventory-settings-error');
      // Return default settings on error
      return { ...this.DEFAULT_NOTIFICATION_SETTINGS };
    }
  }
  
  /**
   * Update notification settings for a company
   * 
   * @param companyId Company ID
   * @param settings New notification settings
   * @returns Updated notification settings
   */
  async updateNotificationSettings(companyId: string, settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      log(`[CheckStockLevelsService] Updating notification settings for company ${companyId}`, 'inventory-settings');
      
      // Get current settings (or defaults if none exist)
      const currentSettings = await this.getNotificationSettings(companyId);
      
      // Merge with provided settings
      const updatedSettings: NotificationSettings = {
        enabled: settings.enabled !== undefined ? Boolean(settings.enabled) : currentSettings.enabled,
        recipientEmails: settings.recipientEmails || currentSettings.recipientEmails,
        notifyOnPercentage: settings.notifyOnPercentage !== undefined ? settings.notifyOnPercentage : currentSettings.notifyOnPercentage,
        channels: settings.channels || currentSettings.channels
      };
      
      // Validate email format for recipient emails
      if (updatedSettings.recipientEmails && updatedSettings.recipientEmails.length > 0) {
        // Basic email validation - could be enhanced
        updatedSettings.recipientEmails = updatedSettings.recipientEmails.filter(email => 
          typeof email === 'string' && email.includes('@') && email.includes('.'));
      }
      
      // Save settings to company_settings table
      const upsertQuery = `
        INSERT INTO company_settings (company_id, key, metadata, created_at, updated_at)
        VALUES ('${companyId}', 'inventory_stock_notifications', '${JSON.stringify(updatedSettings)}', NOW(), NOW())
        ON CONFLICT (company_id, key) 
        DO UPDATE SET 
          metadata = '${JSON.stringify(updatedSettings)}',
          updated_at = NOW()
        RETURNING *
      `;
      
      try {
        await this.drizzle.executeQuery(upsertQuery);
        log(`[CheckStockLevelsService] ✅ Saved notification settings for company ${companyId}`, 'inventory-settings');
      } catch (error: any) {
        // If there's an error saving, log it but continue (we'll still update in-memory cache)
        log(`[CheckStockLevelsService] ⚠️ Error saving notification settings: ${error.message}`, 'inventory-settings-error');
      }
      
      // Update cache
      this.notificationSettingsCache.set(companyId, updatedSettings);
      
      return updatedSettings;
    } catch (error: any) {
      log(`[CheckStockLevelsService] ❌ Error updating notification settings: ${error.message}`, 'inventory-settings-error');
      throw new Error(`Failed to update notification settings: ${error.message || String(error)}`);
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