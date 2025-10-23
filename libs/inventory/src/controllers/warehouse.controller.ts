/**
 * Warehouse Controller
 * 
 * This controller handles HTTP requests related to warehouse management
 * in accordance with Romanian regulations and standards.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../../auth/src/constants/auth-mode.enum';
import { WarehouseService } from '../services/warehouse.service';
import { insertWarehouseSchema, warehouseTypeEnum } from '../../../../shared/schema/warehouse';
import { validateRequest } from "@common/middleware/validate-request";
import { z } from 'zod';

// Define user roles that can manage warehouses
const WAREHOUSE_MANAGER_ROLES = ['admin', 'inventory_manager', 'warehouse_manager'];
const WAREHOUSE_USER_ROLES = [...WAREHOUSE_MANAGER_ROLES, 'inventory_clerk', 'warehouse_clerk'];

export function createWarehouseController(warehouseService: WarehouseService): Router {
  const router = Router();

  /**
   * Create a new warehouse
   * 
   * @route POST /api/inventory/warehouses
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(WAREHOUSE_MANAGER_ROLES) - Requires warehouse manager role
   */
  router.post(
    '/',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(WAREHOUSE_MANAGER_ROLES),
    validateRequest({
      body: insertWarehouseSchema
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id as string;
        const warehouseData = {
          ...req.body,
          companyId: req.user?.companyId as string
        };

        const warehouse = await warehouseService.createWarehouse(warehouseData, userId);
        res.status(201).json(warehouse);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update a warehouse
   * 
   * @route PUT /api/inventory/warehouses/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(WAREHOUSE_MANAGER_ROLES) - Requires warehouse manager role
   */
  router.put(
    '/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(WAREHOUSE_MANAGER_ROLES),
    validateRequest({
      params: z.object({
        id: z.string().uuid()
      }),
      body: insertWarehouseSchema.partial()
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.id as string;
        const companyId = req.user?.companyId as string;

        // Get warehouse to check if it belongs to the user's company
        const existingWarehouse = await warehouseService.getWarehouseById(id);
        if (!existingWarehouse) {
          return res.status(404).json({ error: 'Warehouse not found' });
        }

        if (existingWarehouse.companyId !== companyId) {
          return res.status(403).json({ error: 'You do not have permission to update this warehouse' });
        }

        const warehouse = await warehouseService.updateWarehouse(id, req.body, userId);
        res.json(warehouse);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get all warehouses with filtering and pagination
   * 
   * @route GET /api/inventory/warehouses
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get(
    '/',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    validateRequest({
      query: z.object({
        search: z.string().optional(),
        type: z.enum([
          warehouseTypeEnum.DEPOZIT, 
          warehouseTypeEnum.MAGAZIN, 
          warehouseTypeEnum.CUSTODIE, 
          warehouseTypeEnum.TRANSFER
        ]).optional(),
        isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
        parentId: z.string().uuid().optional().nullable()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user?.companyId as string;
        const { search, type, isActive, page, limit, parentId } = req.query;

        const result = await warehouseService.getWarehouses({
          companyId,
          search: search as string | undefined,
          type: type as keyof typeof warehouseTypeEnum | undefined,
          isActive: isActive as boolean | undefined,
          page: page as number | undefined,
          limit: limit as number | undefined,
          parentId: parentId as string | null | undefined
        });

        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get a warehouse by ID
   * 
   * @route GET /api/inventory/warehouses/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get(
    '/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    validateRequest({
      params: z.object({
        id: z.string().uuid()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const companyId = req.user?.companyId as string;

        const warehouse = await warehouseService.getWarehouseById(id);
        if (!warehouse) {
          return res.status(404).json({ error: 'Warehouse not found' });
        }

        if (warehouse.companyId !== companyId) {
          return res.status(403).json({ error: 'You do not have permission to view this warehouse' });
        }

        res.json(warehouse);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Delete a warehouse
   * 
   * @route DELETE /api/inventory/warehouses/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(WAREHOUSE_MANAGER_ROLES) - Requires warehouse manager role
   */
  router.delete(
    '/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(WAREHOUSE_MANAGER_ROLES),
    validateRequest({
      params: z.object({
        id: z.string().uuid()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const userId = req.user?.id as string;
        const companyId = req.user?.companyId as string;

        // Get warehouse to check if it belongs to the user's company
        const existingWarehouse = await warehouseService.getWarehouseById(id);
        if (!existingWarehouse) {
          return res.status(404).json({ error: 'Warehouse not found' });
        }

        if (existingWarehouse.companyId !== companyId) {
          return res.status(403).json({ error: 'You do not have permission to delete this warehouse' });
        }

        await warehouseService.deleteWarehouse(id, userId);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get all child warehouses for a parent warehouse
   * 
   * @route GET /api/inventory/warehouses/:id/children
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get(
    '/:id/children',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    validateRequest({
      params: z.object({
        id: z.string().uuid()
      })
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;
        const companyId = req.user?.companyId as string;

        // Get parent warehouse to check if it belongs to the user's company
        const parentWarehouse = await warehouseService.getWarehouseById(id);
        if (!parentWarehouse) {
          return res.status(404).json({ error: 'Parent warehouse not found' });
        }

        if (parentWarehouse.companyId !== companyId) {
          return res.status(403).json({ error: 'You do not have permission to view this warehouse' });
        }

        const children = await warehouseService.getChildWarehouses(id, companyId);
        res.json(children);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

// Create and export a default instance
export const warehouseController = Router();