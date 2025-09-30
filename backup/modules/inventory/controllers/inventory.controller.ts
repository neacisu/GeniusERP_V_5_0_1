/**
 * Inventory Controller
 * 
 * This controller handles warehouse and stock transfer operations with proper
 * role-based access control. It integrates the ManageWarehouseService and
 * TransferStockService into secure API endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthGuard, JwtUserData } from '../../../common/middleware/auth-guard';
import { ManageWarehouseService, manageWarehouseService } from '../services/manage-warehouse.service';
import { TransferStockService, transferStockService } from '../services/transfer-stock.service';
import { validateRequest } from '../../../common/middleware/validate-request';
import { z } from 'zod';

// Extend Express Request with user property for TypeScript
declare global {
  namespace Express {
    interface User extends JwtUserData {
      franchiseId?: string | null;
    }
  }
}

// Role constants for inventory operations
const INVENTORY_ROLES = ['inventory_manager', 'inventory_team', 'admin'];

// Create warehouse validation schema
const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name must be at least 2 characters'),
  code: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(['depozit', 'magazin', 'custodie', 'transfer']),
  is_active: z.boolean().optional().default(true)
});

// Transfer stock validation schema
const transferStockSchema = z.object({
  sourceStockId: z.string().uuid('Invalid source stock ID'),
  destinationWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  quantity: z.number().positive('Quantity must be positive'),
  documentNumber: z.string().optional(),
  notes: z.string().optional()
});

export function setupInventoryController() {
  const router = Router();

  // ===============================================
  // Warehouse Management Endpoints
  // ===============================================

  /**
   * Create a new warehouse
   * Requires inventory_manager or admin role
   */
  router.post(
    '/warehouse',
    AuthGuard.requireAuth(),
    AuthGuard.requireRoles(INVENTORY_ROLES),
    validateRequest({ body: createWarehouseSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.companyId) {
          return res.status(400).json({ 
            success: false, 
            message: 'Company ID is required'
          });
        }

        const warehouseInput = {
          company_id: req.user.companyId,
          franchise_id: (req.user as any).franchiseId || undefined,
          name: req.body.name,
          code: req.body.code,
          location: req.body.location,
          address: req.body.address,
          type: req.body.type,
          is_active: req.body.is_active
        };

        const warehouse = await manageWarehouseService.create(warehouseInput);
        console.log(`[InventoryController] Created warehouse: ${JSON.stringify(warehouse)}`);
        res.status(201).json({
          success: true,
          warehouse
        });
      } catch (error: any) {
        console.error('[InventoryController] Error creating warehouse:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create warehouse',
          error: error.message
        });
      }
    }
  );

  /**
   * Get warehouse by ID
   * Requires authentication but no special role
   */
  router.get(
    '/warehouse/:id',
    AuthGuard.requireAuth(),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const warehouse = await manageWarehouseService.getById(req.params.id);

        if (!warehouse) {
          return res.status(404).json({
            success: false,
            message: 'Warehouse not found'
          });
        }

        // Check company access (unless admin)
        const userRoles = (req.user as any).roles || [];
        if (!userRoles.includes('admin') && warehouse.company_id !== req.user?.companyId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to the requested warehouse'
          });
        }

        res.json({
          success: true,
          warehouse
        });
      } catch (error: any) {
        console.error('[InventoryController] Error fetching warehouse:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch warehouse',
          error: error.message
        });
      }
    }
  );

  /**
   * Get warehouses for company
   * Requires authentication but no special role
   */
  router.get(
    '/warehouses',
    AuthGuard.requireAuth(),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.companyId) {
          return res.status(400).json({
            success: false,
            message: 'Company ID is required'
          });
        }

        const warehouses = await manageWarehouseService.getByCompany(
          req.user.companyId,
          (req.user as any).franchiseId || undefined
        );

        res.json({
          success: true,
          warehouses
        });
      } catch (error: any) {
        console.error('[InventoryController] Error fetching warehouses:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch warehouses',
          error: error.message
        });
      }
    }
  );

  /**
   * Update warehouse
   * Requires inventory_manager or admin role
   */
  router.put(
    '/warehouse/:id',
    AuthGuard.requireAuth(),
    AuthGuard.requireRoles(INVENTORY_ROLES),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate at least one updatable field exists
        if (Object.keys(req.body).length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No fields to update'
          });
        }

        // Get existing warehouse to verify company access
        const existing = await manageWarehouseService.getById(req.params.id);

        if (!existing) {
          return res.status(404).json({
            success: false,
            message: 'Warehouse not found'
          });
        }

        // Check company access (unless admin)
        const userRoles = (req.user as any).roles || [];
        if (!userRoles.includes('admin') && existing.company_id !== req.user?.companyId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to the requested warehouse'
          });
        }

        // Update only allowed fields
        const allowedFields = ['name', 'code', 'location', 'address', 'type', 'is_active'];
        const updateData: any = {};

        allowedFields.forEach(field => {
          if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
          }
        });

        const warehouse = await manageWarehouseService.update(req.params.id, updateData);

        res.json({
          success: true,
          warehouse
        });
      } catch (error: any) {
        console.error('[InventoryController] Error updating warehouse:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update warehouse',
          error: error.message
        });
      }
    }
  );

  /**
   * Deactivate warehouse (soft delete)
   * Requires inventory_manager or admin role
   */
  router.delete(
    '/warehouse/:id',
    AuthGuard.requireAuth(),
    AuthGuard.requireRoles(INVENTORY_ROLES),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get existing warehouse to verify company access
        const existing = await manageWarehouseService.getById(req.params.id);

        if (!existing) {
          return res.status(404).json({
            success: false,
            message: 'Warehouse not found'
          });
        }

        // Check company access (unless admin)
        const userRoles = (req.user as any).roles || [];
        if (!userRoles.includes('admin') && existing.company_id !== req.user?.companyId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to the requested warehouse'
          });
        }

        const result = await manageWarehouseService.deactivate(req.params.id);

        res.json({
          success: true,
          message: 'Warehouse deactivated successfully',
          warehouse: result.warehouse
        });
      } catch (error: any) {
        console.error('[InventoryController] Error deactivating warehouse:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to deactivate warehouse',
          error: error.message
        });
      }
    }
  );

  // ===============================================
  // Stock Transfer Endpoints
  // ===============================================

  /**
   * Transfer stock between warehouses
   * Requires inventory_manager or admin role
   */
  router.post(
    '/transfer',
    AuthGuard.requireAuth(),
    AuthGuard.requireRoles(INVENTORY_ROLES),
    validateRequest({ body: transferStockSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.companyId) {
          return res.status(400).json({
            success: false,
            message: 'Company ID is required'
          });
        }

        const transferInput = {
          companyId: req.user.companyId,
          franchiseId: (req.user as any).franchiseId || undefined,
          sourceStockId: req.body.sourceStockId,
          destinationWarehouseId: req.body.destinationWarehouseId,
          quantity: req.body.quantity,
          documentNumber: req.body.documentNumber,
          notes: req.body.notes
        };

        const result = await transferStockService.transferStock(transferInput);

        res.status(201).json({
          success: true,
          transfer: result.transfer,
          sourceStock: result.sourceStock,
          destinationStock: result.destinationStock,
          product: result.product
        });
      } catch (error: any) {
        console.error('[InventoryController] Error transferring stock:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to transfer stock',
          error: error.message
        });
      }
    }
  );

  /**
   * Get transfer document by ID
   * Requires authentication but no special role
   */
  router.get(
    '/transfer/:id',
    AuthGuard.requireAuth(),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const transfer = await transferStockService.getTransferById(req.params.id);

        if (!transfer) {
          return res.status(404).json({
            success: false,
            message: 'Transfer not found'
          });
        }

        // Check company access (unless admin)
        const userRoles = (req.user as any).roles || [];
        if (!userRoles.includes('admin') && transfer.company_id !== req.user?.companyId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to the requested transfer'
          });
        }

        res.json({
          success: true,
          transfer
        });
      } catch (error: any) {
        console.error('[InventoryController] Error fetching transfer:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch transfer',
          error: error.message
        });
      }
    }
  );

  /**
   * Get all transfers for a company
   * Requires authentication but no special role
   */
  router.get(
    '/transfers',
    AuthGuard.requireAuth(),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.companyId) {
          return res.status(400).json({
            success: false,
            message: 'Company ID is required'
          });
        }

        const status = req.query.status as string | undefined;
        const transfers = await transferStockService.getTransfersByCompany(
          req.user.companyId,
          status
        );

        res.json({
          success: true,
          transfers
        });
      } catch (error: any) {
        console.error('[InventoryController] Error fetching transfers:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch transfers',
          error: error.message
        });
      }
    }
  );

  /**
   * Update transfer status
   * Requires inventory_manager or admin role
   */
  router.put(
    '/transfer/:id/status',
    AuthGuard.requireAuth(),
    AuthGuard.requireRoles(INVENTORY_ROLES),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { status } = req.body;

        if (!status || !['in_transit', 'issued', 'received', 'canceled'].includes(status)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid status value'
          });
        }

        const userId = req.user?.id;
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        const transfer = await transferStockService.updateTransferStatus(
          req.params.id,
          status,
          userId
        );

        res.json({
          success: true,
          transfer
        });
      } catch (error: any) {
        console.error('[InventoryController] Error updating transfer status:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update transfer status',
          error: error.message
        });
      }
    }
  );

  return router;
}

// Export singleton controller
export const inventoryController = setupInventoryController();