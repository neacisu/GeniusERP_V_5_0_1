/**
 * Test Real Inventory Alert Processing
 * 
 * This script tests the full inventory alert pipeline by:
 * 1. Creating a real inventory alert job
 * 2. Adding it to the queue
 * 3. Using the actual worker implementation
 * 
 * This tests the integration between the queue, worker and notification service.
 */

import { inventoryQueue } from './server/common/bullmq/queues';
import { createId } from './server/utils/id';
import { InventoryAlertJob } from './server/common/bullmq/types';
import { Workers } from './server/common/bullmq/workers';
import { getNotificationService } from './server/common/services/registry';

/**
 * Test the full inventory alert pipeline with real implementation
 */
async function testRealInventoryAlert() {
  try {
    console.log('Starting real inventory alert pipeline test...');
    
    // Get the notification service
    const notificationService = getNotificationService();
    console.log('Notification service available:', !!notificationService);
    
    // Create the workers with the real implementation
    const workers = Workers.createAll();
    console.log('Workers created');
    
    // Use a real company ID from your database for proper testing
    const companyId = process.env.TEST_COMPANY_ID || 'company-123';
    
    // Critical severity test case - zero stock
    const criticalAlert: InventoryAlertJob = {
      id: createId(),
      timestamp: new Date().toISOString(),
      sku: 'CRIT-PROD-001',
      productName: 'Critical Stock Product',
      warehouseId: 'warehouse-main',
      productId: 'product-001',
      currentQuantity: 0,  // Zero stock = critical severity
      minThreshold: 10,
      companyId,
      severity: 'critical'
    };
    
    // High severity test case - very low stock
    const highAlert: InventoryAlertJob = {
      id: createId(),
      timestamp: new Date().toISOString(),
      sku: 'HIGH-PROD-002',
      productName: 'High Alert Product',
      warehouseId: 'warehouse-main',
      productId: 'product-002',
      currentQuantity: 2,  // Very low stock = high severity
      minThreshold: 10,
      companyId,
      severity: 'high'
    };
    
    // Medium severity test case - low stock
    const mediumAlert: InventoryAlertJob = {
      id: createId(),
      timestamp: new Date().toISOString(),
      sku: 'MED-PROD-003',
      productName: 'Medium Alert Product',
      warehouseId: 'warehouse-main',
      productId: 'product-003',
      currentQuantity: 5,  // Low stock = medium severity
      minThreshold: 10,
      companyId,
      severity: 'medium'
    };
    
    // Add jobs to queue
    console.log('Adding test jobs to inventory queue...');
    
    const criticalJob = await inventoryQueue.add('alert', criticalAlert);
    console.log(`Added critical job ${criticalJob.id} to queue`);
    
    const highJob = await inventoryQueue.add('alert', highAlert);
    console.log(`Added high priority job ${highJob.id} to queue`);
    
    const mediumJob = await inventoryQueue.add('alert', mediumAlert);
    console.log(`Added medium priority job ${mediumJob.id} to queue`);
    
    // Give the worker time to process the jobs
    console.log('Waiting for jobs to be processed (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check job statuses
    const criticalCompleted = await criticalJob.isCompleted();
    const highCompleted = await highJob.isCompleted();
    const mediumCompleted = await mediumJob.isCompleted();
    
    console.log('Job results:');
    console.log(`- Critical alert job completed: ${criticalCompleted}`);
    console.log(`- High alert job completed: ${highCompleted}`);
    console.log(`- Medium alert job completed: ${mediumCompleted}`);
    
    if (criticalCompleted && highCompleted && mediumCompleted) {
      console.log('All inventory alert jobs completed successfully! 🎉');
    } else {
      console.log('Some jobs failed to complete.');
    }
    
    // Clean up
    console.log('Closing worker connections...');
    await workers.inventoryWorker.close();
    
    console.log('Test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
}

// Run the test
testRealInventoryAlert().catch(console.error);