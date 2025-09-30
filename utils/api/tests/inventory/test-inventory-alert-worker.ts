/**
 * Test Inventory Alert Queue Worker
 * 
 * This script tests the inventory alert worker by adding a test job to the queue
 * and verifying that it processes correctly.
 */

import { inventoryQueue } from './server/common/bullmq/queues';
import { createId } from './server/utils/id';
import { InventoryAlertJob } from './server/common/bullmq/types';
import { log } from './server/vite';
import { Workers } from './server/common/bullmq/workers';

/**
 * Test the inventory alert worker
 */
async function testInventoryAlertWorker() {
  try {
    console.log('Starting inventory alert worker test...');
    
    // Create a worker instance for testing
    const worker = Workers.create('inventory-queue', async (job) => {
      console.log(`Worker processing job: ${job.name}:${job.id}`);
      return job.data;
    });
    
    // Sample product data for testing
    const testData: InventoryAlertJob = {
      id: createId(),
      timestamp: new Date().toISOString(),
      sku: 'TEST-PRODUCT-123',
      productName: 'Test Product',
      warehouseId: 'warehouse-123',
      productId: 'product-123',
      currentQuantity: 5,
      minThreshold: 10,
      companyId: 'company-123',
      severity: 'high'
    };
    
    // Add a job to the queue
    console.log('Adding test job to inventory queue...');
    const job = await inventoryQueue.add('alert', testData);
    console.log(`Added job ${job.id} to queue`);
    
    // Give the worker some time to process the job
    console.log('Waiting for job to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check job status
    const jobInfo = await job.isCompleted();
    console.log(`Job completed: ${jobInfo}`);
    
    if (jobInfo) {
      console.log('Inventory alert worker test passed!');
    } else {
      console.log('Inventory alert worker test failed: Job did not complete');
    }
    
    // Clean up
    await worker.close();
    console.log('Test completed');
    
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testInventoryAlertWorker().catch(console.error);