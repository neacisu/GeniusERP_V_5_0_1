/**
 * Test CheckStockLevelsService with BullMQ Queue
 * 
 * This script tests that the CheckStockLevelsService properly integrates with
 * the BullMQ queue system for processing low stock alerts.
 */

import { CheckStockLevelsService, initializeCheckStockLevelsService } from './server/modules/inventory/services/check-stock-levels.service';
import { log } from './server/vite';
import { inventoryQueue, stockQueue, initializeBullMQ, closeBullMQ } from './server/common/bullmq';
import { randomUUID } from 'crypto';

// Function to wait for a specified amount of time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Set up a mock drizzle instance for testing
class MockDrizzle {
  async query(sql: string) {
    // Return mock data that simulates products below threshold
    if (sql.includes('s.quantity <= p.stock_alert')) {
      return {
        rows: [
          {
            stock_id: randomUUID(),
            product_id: randomUUID(),
            warehouse_id: randomUUID(),
            quantity: 5,
            product_code: 'TEST-001',
            product_name: 'Test Product',
            min_threshold: 10,
            warehouse_name: 'Test Warehouse',
            company_id: 'test-company',
            franchise_id: null
          }
        ]
      };
    } 
    // Return mock data for total count
    else if (sql.includes('COUNT(DISTINCT s.product_id)')) {
      return {
        rows: [
          {
            total: 42
          }
        ]
      };
    }
    return { rows: [] };
  }
}

async function testCheckStockLevelsQueue() {
  log('Starting CheckStockLevelsService queue test...', 'test');
  
  try {
    // Initialize BullMQ
    const bullMQ = initializeBullMQ();
    log('BullMQ system initialized', 'test');
    
    // Create a test instance of CheckStockLevelsService with our mock drizzle
    const checkStockService = new CheckStockLevelsService(stockQueue);
    // Replace the drizzle instance with our mock
    (checkStockService as any).drizzle = new MockDrizzle();
    
    log('CheckStockLevelsService prepared with mock data', 'test');
    
    // Run the checkLevels method to test queue integration
    const result = await checkStockService.checkLevels('test-company');
    
    log(`CheckStockLevelsService found ${result.alerts.length} alerts`, 'test');
    log(`Total products checked: ${result.totalProducts}`, 'test');
    
    // Wait for queue processing
    log('Waiting for queue processing...', 'test');
    await wait(2000);
    
    // Check queue status
    const jobCounts = await inventoryQueue.getJobCounts('completed', 'failed', 'active', 'waiting');
    log(`Queue job counts: ${JSON.stringify(jobCounts)}`, 'test');
    
    // Test schedule method
    const scheduleJobId = await checkStockService.scheduleRegularChecks('test-company', '*/5 * * * *');
    log(`Scheduled job ID: ${scheduleJobId}`, 'test');
    
    // Clean up
    log('Cleaning up...', 'test');
    await inventoryQueue.removeRepeatable('scheduled-stock-check', { 
      jobId: 'stock-check-test-company', 
      pattern: '*/5 * * * *' 
    });
    
    await closeBullMQ();
    
    log('CheckStockLevelsService queue test completed successfully', 'test');
  } catch (error: any) {
    log(`❌ Test failed: ${error.message}`, 'test-error');
    console.error('Test error:', error);
  }
}

// Run the test
testCheckStockLevelsQueue().catch(error => {
  console.error('Unhandled test error:', error);
  process.exit(1);
});