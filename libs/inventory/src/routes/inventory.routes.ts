/**
 * Inventory Routes
 * 
 * This file contains all the routes for the inventory module.
 * It wires up the dedicated controllers to specific route endpoints,
 * ensuring separation of concerns and proper authentication.
 */

import { Router } from 'express';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../../auth/src/constants/auth-mode.enum';
import { UserRole } from '../../../auth/src/types';
import { validateRequest } from "@common/middleware/validate-request";
import { addCompanyFilter } from '../../../auth/src/middleware/company-access.middleware';
import { z } from 'zod';

// Import controllers
import { nirController } from '../controllers/nir.controller';
import { stockLevelsController } from '../controllers/stock-levels.controller';
import { transferStockController } from '../controllers/transfer-stock.controller';
import { categoriesController } from '../controllers/categories.controller';
import { productsController } from '../controllers/products.controller';
import { unitsController } from '../controllers/units.controller';
import { stockItemsController } from '../controllers/stock-items.controller';
import { createInventoryAssessmentController } from '../controllers/inventory-assessment.controller';
import { createWarehouseController } from '../controllers/warehouse.controller';
import { InventoryAssessmentService } from '../services/inventory-assessment.service';
import { InventoryValuationService } from '../services/inventory-valuation.service';
import { WarehouseService } from '../services/warehouse.service';
import { DrizzleService } from "@common/drizzle/drizzle.service";

// Role constants for inventory operations
const INVENTORY_ROLES = [UserRole.ADMIN, UserRole.USER];

const transferStockSchema = z.object({
  sourceStockId: z.string().uuid('Invalid source stock ID'),
  destinationWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  quantity: z.number().positive('Quantity must be positive'),
  documentNumber: z.string().optional(),
  notes: z.string().optional()
});

export function setupInventoryRoutes() {
  const router = Router();
  
  // Initialize services for inventory assessment
  const drizzleService = new DrizzleService();
  const inventoryValuationService = new InventoryValuationService(drizzleService);
  const inventoryAssessmentService = new InventoryAssessmentService();
  
  // Create controller instance for inventory assessment
  const assessmentController = createInventoryAssessmentController(
    inventoryAssessmentService,
    inventoryValuationService
  );
  
  // ===============================================
  // NIR Document Endpoints
  // ===============================================
  
  // Create NIR document
  router.post(
    '/nir',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_ROLES),
    (req, res, next) => nirController.createNirDocument(req, res, next)
  );
  
  // Get NIR document by ID
  router.get(
    '/nir/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res, next) => nirController.getNirDocument(req, res, next)
  );
  
  // Update NIR document status
  router.put(
    '/nir/:id/status',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_ROLES),
    (req, res, next) => nirController.updateNirStatus(req, res, next)
  );
  
  // Get all NIR documents for a company
  router.get(
    '/nir',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res, next) => nirController.getNirDocuments(req, res, next)
  );

  // ===============================================
  // Warehouse Management Endpoints
  // ===============================================
  
  // Initialize warehouse service
  const warehouseService = new WarehouseService(drizzleService);
  const newWarehouseController = createWarehouseController(warehouseService);
  
  // Mount the new warehouse controller with company access validation
  router.use('/warehouses', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    addCompanyFilter as any, // Type compatibility with Express middleware
    newWarehouseController
  );

  // ===============================================
  // Stock Transfer Endpoints
  // ===============================================
  
  // Transfer stock between warehouses
  router.post(
    '/transfer',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_ROLES),
    validateRequest({ body: transferStockSchema }),
    (req, res, next) => transferStockController.transferStock(req, res, next)
  );
  
  // Get transfer document by ID
  router.get(
    '/transfer/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res, next) => transferStockController.getTransferById(req, res, next)
  );
  
  // Get all transfers for a company
  router.get(
    '/transfers',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res, next) => transferStockController.getTransfersByCompany(req, res, next)
  );
  
  // Update transfer status
  router.put(
    '/transfer/:id/status',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_ROLES),
    (req, res, next) => transferStockController.updateTransferStatus(req, res, next)
  );

  // ===============================================
  // Stock Level Checking Endpoints
  // ===============================================
  
  // Check stock levels for a company and send notifications for low stock
  router.post(
    '/check-stock-levels',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_ROLES),
    (req, res, next) => stockLevelsController.checkStockLevels(req, res, next)
  );
  
  // Get products approaching their minimum threshold
  router.get(
    '/stock/low',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res, next) => stockLevelsController.getLowStockProducts(req, res, next)
  );
  
  // Configure stock level thresholds for products
  router.post(
    '/stock/threshold',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_ROLES),
    (req, res, next) => stockLevelsController.setStockThreshold(req, res, next)
  );
  
  // Get notification settings for stock levels
  router.get(
    '/stock/notifications',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res, next) => stockLevelsController.getNotificationSettings(req, res, next)
  );
  
  // Update notification settings for stock levels
  router.put(
    '/stock/notifications',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_ROLES),
    (req, res, next) => stockLevelsController.updateNotificationSettings(req, res, next)
  );

  // ===============================================
  // Category Management Endpoints
  // ===============================================
  
  // Mount category controller
  router.use('/categories', categoriesController);

  // ===============================================
  // Product Management Endpoints
  // ===============================================
  
  // Mount products controller
  router.use('/products', productsController);
  
  // ===============================================
  // Units Management Endpoints
  // ===============================================
  
  // Mount units controller
  router.use('/units', unitsController);

  // ===============================================
  // Stock Items Endpoints
  // ===============================================
  
  // Get all stock items for a company
  router.get(
    '/stock-items',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res, next) => stockItemsController.getStockItems(req, res, next)
  );
  
  // Get stock item by ID
  router.get(
    '/stock-items/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    (req, res, next) => stockItemsController.getStockItemById(req, res, next)
  );
  
  // Check stock levels for particular warehouse or all warehouses
  router.post(
    '/stock-items/check-levels',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_ROLES),
    (req, res, next) => stockItemsController.checkStockLevels(req, res, next)
  );

  // ===============================================
  // Inventory Assessment (Inventariere) Endpoints
  // ===============================================
  
  // Mount the assessment controller
  router.use('/assessments', assessmentController);

  return router;
}