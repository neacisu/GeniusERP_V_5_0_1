/**
 * Stock Items Controller
 * 
 * This controller handles operations related to stock items, including
 * querying current stock levels, managing stock movements, and 
 * processing inventory adjustments.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../../auth/src/constants/auth-mode.enum';
import { UserRole } from '../../../auth/src/types';
import { Logger } from "@common/logger";
import { DrizzleService } from "@common/drizzle";

// Role constants for inventory operations
const INVENTORY_ROLES = [UserRole.INVENTORY_MANAGER, UserRole.ADMIN];

export class StockItemsController {
  private logger: Logger;
  private drizzle: DrizzleService;

  constructor() {
    this.logger = new Logger('StockItemsController');
    this.drizzle = new DrizzleService();
  }

  /**
   * Get all stock items for a company
   */
  async getStockItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const warehouseId = req.query.warehouseId as string | undefined;
      const franchiseId = req.user.franchiseId || undefined;
      
      this.logger.debug(`Fetching stock items for company ${req.user.companyId}${warehouseId ? `, warehouse ${warehouseId}` : ''}`);
      
      // Build the SQL query
      // Acum putem folosi tabelul stock_reservations pentru a calcula cantitatea rezervată
      let sql = `
        SELECT 
          s.id,
          s.product_id AS "productId",
          s.warehouse_id AS "warehouseId",
          s.quantity,
          COALESCE(
            (SELECT SUM(sr.reservation_quantity) 
             FROM stock_reservations sr 
             WHERE sr.stock_id = s.id AND sr.is_active = true),
            0
          ) AS "reservedQuantity",
          COALESCE(s.purchase_price, 0) AS "purchasePrice",
          COALESCE(s.selling_price, 0) AS "sellingPrice",
          s.created_at AS "createdAt",
          s.updated_at AS "updatedAt"
        FROM 
          stocks s
        JOIN
          warehouses w ON s.warehouse_id = w.id
        WHERE 
          w.company_id = '${req.user.companyId}'
      `;
      
      // Add warehouse filter if specified
      if (warehouseId) {
        sql += ` AND s.warehouse_id = '${warehouseId}'`;
      }
      
      // Add franchise filter if specified
      if (franchiseId) {
        sql += ` AND w.franchise_id = '${franchiseId}'`;
      }
      
      // Add order by clause
      sql += ` ORDER BY s.updated_at DESC`;
      
      // Execute the query using executeQuery instead of query
      const stockItems = await this.drizzle.executeQuery(sql);
      
      // Return array directly to match frontend expectations
      res.json(stockItems || []);
    } catch (error: any) {
      this.logger.error(`Error fetching stock items: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock items',
        error: error.message
      });
    }
  }

  /**
   * Get stock item by ID
   */
  async getStockItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stockItemId = req.params.id;
      
      if (!stockItemId) {
        res.status(400).json({
          success: false,
          message: 'Stock item ID is required'
        });
        return;
      }

      const sql = `
        SELECT 
          s.id,
          s.product_id AS "productId",
          s.warehouse_id AS "warehouseId",
          s.quantity,
          COALESCE(
            (SELECT SUM(sr.reservation_quantity) 
             FROM stock_reservations sr 
             WHERE sr.stock_id = s.id AND sr.is_active = true),
            0
          ) AS "reservedQuantity",
          COALESCE(s.purchase_price, 0) AS "purchasePrice",
          COALESCE(s.selling_price, 0) AS "sellingPrice",
          s.created_at AS "createdAt",
          s.updated_at AS "updatedAt",
          w.name AS "warehouseName",
          p.name AS "productName",
          p.code AS "productCode"
        FROM 
          stocks s
        JOIN
          warehouses w ON s.warehouse_id = w.id
        JOIN
          inventory_products p ON s.product_id = p.id
        WHERE 
          s.id = '${stockItemId}'
      `;
      
      const result = await this.drizzle.executeQuery(sql);
      
      if (!result || result.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Stock item not found'
        });
        return;
      }

      const stockItem = result[0];
      
      // Check company access (unless admin)
      if (req.user && 
          !req.user.roles?.includes(UserRole.ADMIN) && 
          stockItem.company_id !== req.user.companyId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to the requested stock item'
        });
        return;
      }

      res.json({
        success: true,
        stockItem
      });
    } catch (error: any) {
      this.logger.error(`Error fetching stock item: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock item',
        error: error.message
      });
    }
  }

  /**
   * Check stock levels for a particular warehouse or all warehouses
   */
  async checkStockLevels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const warehouseId = req.body.warehouseId;
      this.logger.debug(`Checking stock levels for ${warehouseId ? `warehouse ${warehouseId}` : 'all warehouses'}`);
      
      // For now, just return success. In a real implementation, this would trigger
      // stock level checks and potentially send notifications
      res.json({
        success: true,
        message: 'Stock level check initiated',
        warehouseId: warehouseId || 'all'
      });
    } catch (error: any) {
      this.logger.error(`Error checking stock levels: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to check stock levels',
        error: error.message
      });
    }
  }
}

// Export a singleton instance
export const stockItemsController = new StockItemsController();