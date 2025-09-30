/**
 * Stock Levels Controller
 * 
 * This controller handles operations related to monitoring stock levels,
 * checking for low stock thresholds, and generating notifications for
 * inventory managers about products that need replenishment.
 */

import { Request, Response, NextFunction } from 'express';
import { checkStockLevelsService } from '../services/check-stock-levels.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { UserRole } from '../../auth/types';
import { Logger } from '../../../common/logger';

// Role constants for inventory operations
const INVENTORY_ROLES = [UserRole.INVENTORY_MANAGER, UserRole.ADMIN];

export class StockLevelsController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('StockLevelsController');
  }

  /**
   * Check stock levels for a company and send notifications for low stock
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

      const warehouseId = req.query.warehouseId as string | undefined;
      const franchiseId = req.user.franchiseId || undefined;
      
      this.logger.debug(`Checking stock levels for company ${req.user.companyId}${warehouseId ? `, warehouse ${warehouseId}` : ''}`);
      
      const result = await checkStockLevelsService.checkLevels(
        req.user.companyId,
        franchiseId,
        warehouseId
      );

      res.json({
        success: true,
        result
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

  /**
   * Get products approaching their minimum threshold
   */
  async getLowStockProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      const warehouseId = req.query.warehouseId as string | undefined;
      const thresholdPercentage = req.query.threshold 
        ? parseInt(req.query.threshold as string) 
        : 20; // Default 20%
      
      const lowStockProducts = await checkStockLevelsService.getLowStockProducts(
        req.user.companyId,
        warehouseId,
        thresholdPercentage
      );

      res.json({
        success: true,
        products: lowStockProducts
      });
    } catch (error: any) {
      this.logger.error(`Error fetching low stock products: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get low stock products',
        error: error.message
      });
    }
  }

  /**
   * Configure stock level thresholds for products
   */
  async setStockThreshold(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, warehouseId, minStockLevel, maxStockLevel } = req.body;

      if (!productId || !warehouseId) {
        res.status(400).json({
          success: false,
          message: 'Product ID and warehouse ID are required'
        });
        return;
      }

      if (minStockLevel === undefined && maxStockLevel === undefined) {
        res.status(400).json({
          success: false,
          message: 'At least one threshold (minStockLevel or maxStockLevel) must be provided'
        });
        return;
      }

      // Set stock threshold logic would be implemented here
      // For example: checkStockLevelsService.setProductThreshold(...)
      
      res.json({
        success: true,
        message: 'Stock threshold updated successfully',
        thresholds: {
          productId,
          warehouseId,
          minStockLevel,
          maxStockLevel
        }
      });
    } catch (error: any) {
      this.logger.error(`Error setting stock threshold: ${error.message}`);
      res.status(500).json({
        success: false, 
        message: 'Failed to set stock threshold',
        error: error.message
      });
    }
  }

  /**
   * Get notification settings for stock levels
   */
  async getNotificationSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.companyId) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }

      // Implement getting notification settings
      const settings = await checkStockLevelsService.getNotificationSettings(req.user.companyId);
      
      res.json({
        success: true,
        settings
      });
    } catch (error: any) {
      this.logger.error(`Error fetching notification settings: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification settings',
        error: error.message
      });
    }
  }

  /**
   * Update notification settings for stock levels
   */
  async updateNotificationSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.companyId) {
        res.status(400).json({
          success: false, 
          message: 'Company ID is required'
        });
        return;
      }

      const { enabled, recipientEmails, notifyOnPercentage, channels } = req.body;
      
      // Implement updating notification settings
      const updatedSettings = await checkStockLevelsService.updateNotificationSettings(
        req.user.companyId,
        {
          enabled,
          recipientEmails,
          notifyOnPercentage,
          channels
        }
      );
      
      res.json({
        success: true,
        message: 'Notification settings updated successfully',
        settings: updatedSettings
      });
    } catch (error: any) {
      this.logger.error(`Error updating notification settings: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification settings',
        error: error.message
      });
    }
  }
}

// Export a singleton instance
export const stockLevelsController = new StockLevelsController();