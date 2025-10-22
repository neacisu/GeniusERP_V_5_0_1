/**
 * Inventory Module
 * 
 * Entry point for the inventory module - registers routers and services
 */

import { Express } from 'express';
import templateRouter from './templates/template.router';
import { InventoryModule } from './inventory.module';
import { setupInventoryRoutes } from './routes/inventory.routes';
import { categoriesController } from './controllers/categories.controller';
import { log } from '../../vite';

export function initializeInventoryModule(app: Express) {
  // Register all routers
  app.use('/api/inventory/templates', templateRouter);
  
  // Register the inventory routes with controllers like categories, warehouses, etc.
  app.use('/api/inventory', setupInventoryRoutes());
  
  // Log successful initialization
  log('📦 Inventory module registered with complete route structure', 'inventory');
  console.log('Inventory module initialized');
}