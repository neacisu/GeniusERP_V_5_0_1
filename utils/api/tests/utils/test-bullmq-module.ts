/**
 * Test BullMQ Module
 * 
 * This script tests the centralized BullMQ implementation for managing job queues.
 * It verifies that queues can be created and jobs can be processed.
 */

import { initializeBullMQ, inventoryQueue, closeBullMQ } from './server/common/bullmq';
import { randomUUID } from 'crypto';
import { log } from './server/vite';

// Function to wait for a specified amount of time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testBullMQModule() {
  log('Starting BullMQ module test...', 'test');
  
  try {
    // Initialize the BullMQ system
    const bullMQ = initializeBullMQ();
    log(`BullMQ system initialized with ${Object.keys(bullMQ.queues).length} queues`, 'test');
    
    // Now add a test job to the inventory queue
    const jobId = randomUUID();
    
    log(`Adding test job with ID ${jobId} to inventory queue...`, 'test');
    
    await inventoryQueue.add('low-stock-alert', {
      id: jobId,
      timestamp: new Date().toISOString(),
      alert: {
        productId: 'test-product-id',
        productName: 'Test Product',
        productCode: 'TP-123',
        warehouseId: 'test-warehouse-id',
        warehouseName: 'Test Warehouse',
        currentQuantity: 5,
        minThreshold: 10,
        companyId: 'test-company-id',
        franchiseId: null
      }
    });
    
    log('Test job added successfully', 'test');
    
    // Wait for a moment to allow job processing
    log('Waiting for job processing...', 'test');
    await wait(2000);
    
    // Get job count from the queue
    const jobCounts = await inventoryQueue.getJobCounts('completed', 'failed', 'active', 'waiting');
    log(`Job counts: ${JSON.stringify(jobCounts)}`, 'test');
    
    // Clean up
    log('Cleaning up...', 'test');
    await closeBullMQ();
    
    log('BullMQ module test completed successfully', 'test');
  } catch (error: any) {
    log(`❌ Test failed: ${error.message}`, 'test-error');
    console.error('Test error:', error);
  }
}

// Run the test
testBullMQModule().catch(error => {
  console.error('Unhandled test error:', error);
  process.exit(1);
});