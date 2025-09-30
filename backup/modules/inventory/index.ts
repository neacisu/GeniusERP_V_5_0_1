import { Express, Router } from "express";
import { setupInventoryRoutes } from "./routes/inventory.routes";
import { InventoryService } from "./services/inventory.service";
import { storage } from "../../storage";
import { InventoryModule } from "./inventory.module";
import { QueueService } from "../../services/queue.service";
import { RedisService } from "../../services/redis.service";
import { initializeCheckStockLevelsService } from "./services/check-stock-levels.service";
import { log } from "../../vite";
// Import the centralized BullMQ module (used as a fallback if QueueService is unavailable)
import { inventoryQueue, initializeBullMQ } from "../../common/bullmq";
// Import the new inventory controller
import { inventoryController } from "./controllers/inventory.controller";

export async function initInventoryModule(app: Express) {
  // Initialize the inventory module
  const moduleInfo = InventoryModule.initialize();
  log(`🧮 ${moduleInfo.name} initialized with ${moduleInfo.serviceCount} services`, 'inventory');
  
  // Connect the CheckStockLevelsService with the stock queue
  let queueInitialized = false;
  
  // First try to use the traditional QueueService
  try {
    const redisService = new RedisService();
    const queueService = new QueueService(redisService);
    await queueService.init();
    
    // Access the BullMQ queue directly from the QueueService instance
    if (queueService['stockQueue']) { // Access using indexer notation to avoid TypeScript property access error
      initializeCheckStockLevelsService(queueService['stockQueue']);
      log(`📦 CheckStockLevelsService connected to stock queue via QueueService`, 'inventory');
      queueInitialized = true;
    } else {
      log(`⚠️ Stock queue not available from QueueService, trying direct BullMQ connection`, 'inventory');
    }
  } catch (error: any) {
    log(`⚠️ Error connecting to queue service: ${error?.message || String(error)}`, 'inventory');
    log(`🔄 Falling back to direct BullMQ initialization`, 'inventory');
  }
  
  // If traditional QueueService failed, try using the centralized BullMQ module
  if (!queueInitialized) {
    try {
      // Initialize BullMQ and get the queues
      const bullMQ = initializeBullMQ();
      
      // Connect CheckStockLevelsService to the inventory queue
      if (bullMQ.queues && inventoryQueue) {
        initializeCheckStockLevelsService(inventoryQueue);
        log(`📦 CheckStockLevelsService connected to inventory queue via direct BullMQ`, 'inventory');
        queueInitialized = true;
      } else {
        log(`⚠️ BullMQ inventory queue initialization failed`, 'inventory');
      }
    } catch (error: any) {
      log(`❌ Error initializing BullMQ: ${error?.message || String(error)}`, 'inventory');
    }
  }
  
  // If all queue connections failed, log a warning
  if (!queueInitialized) {
    log(`⚠️ All queue initialization attempts failed, CheckStockLevelsService will operate without queue support`, 'inventory');
  }
  
  // Register legacy routes for backward compatibility
  const inventoryRoutes = setupInventoryRoutes();
  app.use("/api/inventory", inventoryRoutes);
  
  // Register new RBAC-secured inventory controller routes
  app.use("/api/v1/inventory", inventoryController);
  log(`🔐 Inventory controller with RBAC registered at /api/v1/inventory`, 'inventory');
  
  // Return the router for potential chaining
  return inventoryRoutes;
}

// Export inventory service instance
export const inventoryService = new InventoryService(storage);

/**
 * Reinitialize the CheckStockLevelsService with the specified queue
 * This can be used to reconnect the service after queue reconnection or restart
 * 
 * @param stockQueue The BullMQ queue to use for stock updates
 */
export function reinitializeStockQueue(stockQueue: any): void {
  if (stockQueue) {
    initializeCheckStockLevelsService(stockQueue);
    log(`CheckStockLevelsService reconnected to queue`, 'inventory');
  }
}