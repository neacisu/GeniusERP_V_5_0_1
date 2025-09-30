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
import { ExchangeRateService } from '../integrations/services/exchange-rate.service';
import { log } from '../../vite';

// Entity name used for audit logging
export const ENTITY_NAME = 'inventory';

export class InventoryModule {
  /**
   * Register the module components with the application
   * @returns Registered components
   */
  static register() {
    log('📦 Registering inventory module with multi-gestiune support', 'inventory-module');
    
    // Return registered components
    return {
      services: {
        // Core Inventory Management
        inventory: InventoryService,            // Base inventory service
        manageWarehouse: ManageWarehouseService, // Warehouse management service
        transferStock: TransferStockService,    // Stock transfer service
        checkStockLevels: CheckStockLevelsService, // Stock monitoring service
        
        // Future services to be implemented:
        // nirService: null,                    // NIR document service
        // stockService: null,                  // Stock tracking service
        // poService: null,                     // Purchase order service
        
        // Supporting Services
        exchangeRate: ExchangeRateService,      // For multi-currency support
      },
      // routes will be added in future
    };
  }
  
  /**
   * Initialize the inventory module and return a structure report
   */
  static initialize() {
    log('📦 Initializing inventory module with multi-gestiune support', 'inventory-module');
    
    const registeredServices = this.register();
    
    return {
      name: 'Inventory Module',
      description: 'Romanian inventory system with multi-gestiune support',
      version: '1.0.0',
      serviceCount: Object.keys(registeredServices.services).length,
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
}

// Export singleton instances for easy access
// Note: We use the instance from index.ts to avoid circular references
export { inventoryService } from '../inventory';

// Export services
export { manageWarehouseService } from './services/manage-warehouse.service';
export { transferStockService } from './services/transfer-stock.service';
export { checkStockLevelsService } from './services/check-stock-levels.service';

// Export future services (will be implemented in upcoming steps)
export const nirService = null;         // Placeholder for upcoming NIR service
export const stockService = null;       // Placeholder for upcoming stock service
export const purchaseOrderService = null; // Placeholder for upcoming PO service