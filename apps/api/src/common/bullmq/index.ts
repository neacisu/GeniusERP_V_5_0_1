/**
 * BullMQ Module
 * 
 * This module centralizes BullMQ queues and workers for the application.
 * It provides a unified API for interacting with job queues across modules.
 */

import { QueueName } from './types';
import Queues, { inventoryQueue, accountingQueue, reportingQueue, documentQueue } from './queues';
import { Workers, createAllWorkers } from './workers';

// Re-export everything for convenient imports
export * from './types';
export * from './queues';
export * from './workers';

// Singleton instance of all workers
let workersInstance: ReturnType<typeof createAllWorkers> | null = null;

/**
 * Initialize BullMQ system with queues and workers
 * @returns Object containing all initialized queues and workers
 */
export function initializeBullMQ() {
  console.log('Initializing BullMQ system...', 'bullmq');
  
  try {
    // Create all workers if they don't exist
    if (!workersInstance) {
      workersInstance = createAllWorkers();
      console.log('✅ All BullMQ workers initialized successfully', 'bullmq');
    }
    
    return {
      queues: Queues,
      workers: workersInstance
    };
  } catch (error: any) {
    console.log(`❌ Failed to initialize BullMQ system: ${error.message}`, 'bullmq-error');
    console.error('BullMQ initialization error:', error);
    
    // Return queues only, as they might still work
    return {
      queues: Queues,
      workers: null
    };
  }
}

/**
 * Close all queues and workers
 */
export async function closeBullMQ() {
  console.log('Closing BullMQ system...', 'bullmq');
  
  const closePromises: Promise<any>[] = [];
  
  // Close all queues
  Object.values(Queues).forEach(queue => {
    closePromises.push(queue.close().catch(err => {
      console.log(`Failed to close queue: ${err.message}`, 'bullmq-error');
    }));
  });
  
  // Close all workers
  if (workersInstance) {
    Object.values(workersInstance).forEach(worker => {
      closePromises.push(worker.close().catch(err => {
        console.log(`Failed to close worker: ${err.message}`, 'bullmq-error');
      }));
    });
    
    workersInstance = null;
  }
  
  await Promise.all(closePromises);
  console.log('✅ BullMQ system closed successfully', 'bullmq');
}

// Export a singleton instance for easy access
export default {
  initialize: initializeBullMQ,
  close: closeBullMQ,
  Queues,
  Workers
};