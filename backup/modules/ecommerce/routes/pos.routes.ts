/**
 * POS Router
 * 
 * This router handles routes related to Point of Sale (POS) integration.
 */

import { Router, Request, Response } from 'express';
import { POSIntegrationService } from '../services/pos-integration.service';
import { AuthGuard } from '../../../common/middleware/auth-guard';
import { Logger } from '../../../common/logger';

// Create a logger
const logger = new Logger('POSRouter');

export class POSRouter {
  private router: Router;
  private posService: POSIntegrationService;

  constructor(posService: POSIntegrationService) {
    this.router = Router();
    this.posService = posService;
    this.setupRoutes();
    logger.info('POSRouter initialized');
  }

  /**
   * Get the router
   * 
   * @returns Express router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Setup routes
   */
  private setupRoutes() {
    // Connect to a POS system
    this.router.post('/connect', AuthGuard.requireRoles(['ecommerce_admin', 'ecommerce_manager']), this.connectPosSystem.bind(this));
    
    // Check POS connection status
    this.router.get('/status/:posSystem', AuthGuard.requireRoles(['ecommerce_admin', 'ecommerce_manager', 'ecommerce_user']), this.checkPosConnection.bind(this));
    
    // Import orders from POS
    this.router.post('/import-orders', AuthGuard.requireRoles(['ecommerce_admin', 'ecommerce_manager']), this.importOrders.bind(this));
    
    // Export products to POS
    this.router.post('/export-products', AuthGuard.requireRoles(['ecommerce_admin', 'ecommerce_manager']), this.exportProducts.bind(this));
    
    // Sync inventory with POS
    this.router.post('/sync-inventory', AuthGuard.requireRoles(['ecommerce_admin', 'ecommerce_manager']), this.syncInventory.bind(this));
  }

  /**
   * Connect to a POS system
   * 
   * @param req Request
   * @param res Response
   */
  private async connectPosSystem(req: Request, res: Response) {
    try {
      const { posSystem, connectionDetails } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      // Validate required fields
      if (!posSystem || !connectionDetails) {
        return res.status(400).json({
          success: false,
          message: 'POS system and connection details are required'
        });
      }
      
      // Connect to POS system
      const connectionResult = await this.posService.connectPosSystem(
        posSystem,
        connectionDetails,
        companyId,
        userId
      );
      
      res.json({
        success: true,
        data: connectionResult
      });
    } catch (error) {
      logger.error('Failed to connect to POS system', error);
      res.status(500).json({
        success: false,
        message: `Failed to connect to POS system: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Check POS connection status
   * 
   * @param req Request
   * @param res Response
   */
  private async checkPosConnection(req: Request, res: Response) {
    try {
      const { posSystem } = req.params;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const companyId = req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      // Check POS connection
      const connectionStatus = await this.posService.checkPosConnection(posSystem, companyId);
      
      res.json({
        success: true,
        data: connectionStatus
      });
    } catch (error) {
      logger.error(`Failed to check connection to POS system ${req.params.posSystem}`, error);
      res.status(500).json({
        success: false,
        message: `Failed to check POS connection: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Import orders from POS
   * 
   * @param req Request
   * @param res Response
   */
  private async importOrders(req: Request, res: Response) {
    try {
      const { posSystem, orders } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      // Validate required fields
      if (!posSystem || !orders || !Array.isArray(orders)) {
        return res.status(400).json({
          success: false,
          message: 'POS system and orders array are required'
        });
      }
      
      // Import orders from POS
      const importedOrders = await this.posService.importOrders(
        posSystem,
        orders,
        companyId,
        userId
      );
      
      res.json({
        success: true,
        data: {
          posSystem,
          importedCount: importedOrders.length,
          importedOrders
        }
      });
    } catch (error) {
      logger.error('Failed to import orders from POS', error);
      res.status(500).json({
        success: false,
        message: `Failed to import orders from POS: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Export products to POS
   * 
   * @param req Request
   * @param res Response
   */
  private async exportProducts(req: Request, res: Response) {
    try {
      const { posSystem, productIds } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      // Validate required fields
      if (!posSystem || !productIds || !Array.isArray(productIds)) {
        return res.status(400).json({
          success: false,
          message: 'POS system and product IDs array are required'
        });
      }
      
      // Export products to POS
      const exportResult = await this.posService.exportProducts(
        posSystem,
        productIds,
        companyId,
        userId
      );
      
      res.json({
        success: true,
        data: exportResult
      });
    } catch (error) {
      logger.error('Failed to export products to POS', error);
      res.status(500).json({
        success: false,
        message: `Failed to export products to POS: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Sync inventory with POS
   * 
   * @param req Request
   * @param res Response
   */
  private async syncInventory(req: Request, res: Response) {
    try {
      const { posSystem, inventoryUpdates } = req.body;
      
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID and User ID are required'
        });
      }
      
      // Validate required fields
      if (!posSystem || !inventoryUpdates || !Array.isArray(inventoryUpdates)) {
        return res.status(400).json({
          success: false,
          message: 'POS system and inventory updates array are required'
        });
      }
      
      // Sync inventory with POS
      const syncResult = await this.posService.syncInventory(
        posSystem,
        inventoryUpdates,
        companyId,
        userId
      );
      
      res.json({
        success: true,
        data: syncResult
      });
    } catch (error) {
      logger.error('Failed to sync inventory with POS', error);
      res.status(500).json({
        success: false,
        message: `Failed to sync inventory with POS: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}