/**
 * Shopify Router
 * 
 * This router handles routes related to Shopify integration.
 */

import { Router, Request, Response } from 'express';
import { ShopifyIntegrationService } from '../services/shopify-integration.service';
import { AuthGuard } from '../../../common/middleware/auth-guard.js';
import { Logger } from '../../../common/logger.js';

// Create a logger
const logger = new Logger('ShopifyRouter');

export class ShopifyRouter {
  private router: Router;
  private shopifyService: ShopifyIntegrationService;

  constructor(shopifyService: ShopifyIntegrationService) {
    this.router = Router();
    this.shopifyService = shopifyService;
    this.setupRoutes();
    logger.info('ShopifyRouter initialized');
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
    // Get integration status
    this.router.get('/status', AuthGuard.requireAuth(), this.getIntegrationStatus.bind(this));
    
    // Save Shopify credentials
    this.router.post('/credentials', AuthGuard.requireAuth(), this.saveCredentials.bind(this));
    
    // Verify Shopify credentials
    this.router.post('/verify-credentials', AuthGuard.requireAuth(), this.verifyCredentials.bind(this));
    
    // Enable/disable integration
    this.router.put('/enabled', AuthGuard.requireAuth(), this.setIntegrationEnabled.bind(this));
    
    // Sync products from Shopify
    this.router.post('/sync/products', AuthGuard.requireAuth(), this.syncProducts.bind(this));
    
    // Import orders from Shopify
    this.router.post('/import/orders', AuthGuard.requireAuth(), this.importOrders.bind(this));
    
    // Shopify webhook endpoint (no auth required for this endpoint)
    this.router.post('/webhook/:type', this.handleWebhook.bind(this));
  }

  /**
   * Get integration status
   * 
   * @param req Request
   * @param res Response
   */
  private async getIntegrationStatus(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      
      const status = await this.shopifyService.getIntegrationStatus(companyId as string);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Failed to get integration status', error);
      res.status(500).json({
        success: false,
        message: `Failed to get integration status: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Save Shopify credentials
   * 
   * @param req Request
   * @param res Response
   */
  private async saveCredentials(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      const credentials = req.body;
      
      // Validate credentials
      if (!credentials.shopName || !credentials.accessToken) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: shopName and accessToken'
        });
      }
      
      const integration = await this.shopifyService.saveShopifyCredentials(companyId as string, credentials);
      
      res.json({
        success: true,
        data: {
          id: integration.id,
          name: integration.name,
          enabled: integration.enabled,
          syncStatus: integration.syncStatus,
          updatedAt: integration.updatedAt
        }
      });
    } catch (error) {
      logger.error('Failed to save Shopify credentials', error);
      res.status(500).json({
        success: false,
        message: `Failed to save Shopify credentials: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Verify Shopify credentials
   * 
   * @param req Request
   * @param res Response
   */
  private async verifyCredentials(req: Request, res: Response) {
    try {
      const credentials = req.body;
      
      // Validate credentials
      if (!credentials.shopName || !credentials.accessToken) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: shopName and accessToken'
        });
      }
      
      const isValid = await this.shopifyService.verifyCredentials(credentials);
      
      res.json({
        success: true,
        data: {
          valid: isValid
        }
      });
    } catch (error) {
      logger.error('Failed to verify Shopify credentials', error);
      res.status(500).json({
        success: false,
        message: `Failed to verify Shopify credentials: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Enable/disable integration
   * 
   * @param req Request
   * @param res Response
   */
  private async setIntegrationEnabled(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Invalid request. Expected "enabled" boolean field'
        });
      }
      
      const integration = await this.shopifyService.setIntegrationEnabled(companyId as string, enabled);
      
      res.json({
        success: true,
        data: {
          id: integration.id,
          enabled: integration.enabled,
          updatedAt: integration.updatedAt
        }
      });
    } catch (error) {
      logger.error('Failed to update integration status', error);
      res.status(500).json({
        success: false,
        message: `Failed to update integration status: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Sync products from Shopify
   * 
   * @param req Request
   * @param res Response
   */
  private async syncProducts(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId } = req.user;
      
      // Start sync process
      const syncResult = await this.shopifyService.syncProducts(companyId as string);
      
      res.json({
        success: true,
        data: syncResult
      });
    } catch (error) {
      logger.error('Failed to sync products from Shopify', error);
      res.status(500).json({
        success: false,
        message: `Failed to sync products: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Import orders from Shopify
   * 
   * @param req Request
   * @param res Response
   */
  private async importOrders(req: Request, res: Response) {
    try {
      // Ensure req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
      }
      
      const { companyId, userId } = req.user;
      
      // Start import process
      const importResult = await this.shopifyService.importOrders(companyId as string, userId as string);
      
      res.json({
        success: true,
        data: importResult
      });
    } catch (error) {
      logger.error('Failed to import orders from Shopify', error);
      res.status(500).json({
        success: false,
        message: `Failed to import orders: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * Handle Shopify webhook
   * 
   * @param req Request
   * @param res Response
   */
  private async handleWebhook(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const data = req.body;
      
      // TODO: Verify webhook signature
      // const hmac = req.headers['x-shopify-hmac-sha256'];
      
      // Handle different webhook types
      switch (type) {
        case 'products':
          logger.info('Received product webhook from Shopify');
          // Handle product update
          break;
        case 'orders':
          logger.info('Received order webhook from Shopify');
          // Handle order update
          break;
        default:
          logger.warn(`Received unknown webhook type: ${type}`);
      }
      
      // Respond with 200 to acknowledge receipt
      res.status(200).send();
    } catch (error) {
      logger.error(`Failed to handle Shopify webhook: ${req.params.type}`, error);
      // Still respond with 200 to prevent Shopify from retrying
      res.status(200).send();
    }
  }
}