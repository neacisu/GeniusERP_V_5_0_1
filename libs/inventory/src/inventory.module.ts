/**
 * Inventory Module
 * 
 * Main entry point for the inventory module. Encapsulates all stock,
 * warehouse, transfer, NIR, and custody-related logic. Follows the multi-gestiune model
 * (depozit, magazin, custodie, transfer) as described in the Romanian inventory schema.
 */

import { Router } from 'express';
import { InventoryService } from './services/inventory.service';
import { ManageWarehouseService } from './services/manage-warehouse.service';
import { TransferStockService } from './services/transfer-stock.service';
import { CheckStockLevelsService } from './services/check-stock-levels.service';
import { NirService } from './services/nir.service';
import { ExchangeRateService } from '../integrations/services/exchange-rate.service';
import { setupInventoryRoutes } from './routes/inventory.routes';
import { log } from '../../../apps/api/src/vite';

// Controllers
import { nirController } from './controllers/nir.controller';
import { stockLevelsController } from './controllers/stock-levels.controller';
import { transferStockController } from './controllers/transfer-stock.controller';
import { warehouseController } from './controllers/warehouse.controller';
import { categoriesController } from './controllers/categories.controller';

// Services
import { CategoriesService } from './services/categories.service';

// Entity name used for audit logging
export const ENTITY_NAME = 'inventory';

export class InventoryModule {
  /**
   * Register the module components with the application
   * @returns Registered components
   */
  static register() {
    log('📦 Registering inventory module with multi-gestiune support', 'inventory-module');
    
    // Set up API routes
    const router = Router();
    
    // Mount inventory routes
    router.use('/inventory', setupInventoryRoutes());
    
    // Return registered components
    return {
      services: {
        // Core Inventory Management
        inventory: InventoryService,            // Base inventory service
        manageWarehouse: ManageWarehouseService, // Warehouse management service
        transferStock: TransferStockService,    // Stock transfer service
        checkStockLevels: CheckStockLevelsService, // Stock monitoring service
        nir: NirService,                        // NIR document service
        categories: CategoriesService,          // Category management service
        
        // Future services to be implemented:
        // stockService: null,                  // Stock tracking service
        // poService: null,                     // Purchase order service
        
        // Supporting Services
        exchangeRate: ExchangeRateService,      // For multi-currency support
      },
      controllers: {
        nir: nirController,
        stockLevels: stockLevelsController,
        transferStock: transferStockController,
        warehouse: warehouseController,
        categories: categoriesController
      },
      routes: router
    };
  }
  
  /**
   * Initialize the inventory module and return a structure report
   */
  static initialize() {
    log('📦 Initializing inventory module with multi-gestiune support', 'inventory-module');
    
    const registeredComponents = this.register();
    
    return {
      name: 'Inventory Module',
      description: 'Romanian inventory system with multi-gestiune support',
      version: '1.0.0',
      serviceCount: Object.keys(registeredComponents.services).length,
      controllerCount: Object.keys(registeredComponents.controllers).length,
      capabilities: [
        'Romanian NIR document support',
        'Multiple gestiune types (depozit, magazin, custodie, transfer)',
        'Inventory transfer with Aviz de însoțire',
        'Stock tracking with batch and expiry support',
        'Stock level monitoring and alerts',
        'Multi-currency support via BNR exchange rates',
        'Purchase orders with custody option',
        'Warehouse (gestiune) management'
      ]
    };
  }
  
  /**
   * Get the module routes for mounting in Express
   */
  static getRoutes() {
    return this.register().routes;
  }
}

// Export singleton instances for easy access
// Note: We use the instance from index.ts to avoid circular references
// import { inventoryService } from '../inventory'; - Fixat importul invalid

// Export services
export { manageWarehouseService } from './services/manage-warehouse.service';
export { transferStockService } from './services/transfer-stock.service';
export { checkStockLevelsService } from './services/check-stock-levels.service';
export { nirService } from './services/nir.service';
export { categoriesService } from './categories.service.instance';

// Export controllers
export { nirController } from './controllers/nir.controller';
export { stockLevelsController } from './controllers/stock-levels.controller';
export { transferStockController } from './controllers/transfer-stock.controller';
export { warehouseController } from './controllers/warehouse.controller';
export { categoriesController } from './controllers/categories.controller';

// Export future services (will be implemented in upcoming steps)
export const stockService = null;       // Placeholder for upcoming stock service
export const purchaseOrderService = null; // Placeholder for upcoming PO service