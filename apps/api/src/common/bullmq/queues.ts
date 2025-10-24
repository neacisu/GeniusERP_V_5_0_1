/**
 * BullMQ Queue Definitions
 * 
 * This file centralizes the queue definitions for the entire application.
 * It exports named queue instances that can be imported directly by services.
 * 
 * By centralizing queue definitions, we ensure consistent configuration
 * and avoid duplicated connection logic across the application.
 */

import { Queue, QueueOptions } from 'bullmq';
import { QueueName } from './types';
import { log } from '../../vite';
import { RedisService } from '@common/services/redis.service';

// Get a Redis connection instance
let redisConnection: any;

try {
  const redisService = new RedisService();
  // Connect to Redis and get the client
  redisService.connect().then(client => {
    if (client) {
      redisConnection = client;
      log('Redis connection established for BullMQ queues', 'bullmq');
    } else {
      log('Redis connection not available, using fallback options', 'bullmq');
    }
  });
} catch (error: any) {
  log(`⚠️ Failed to establish Redis connection for BullMQ: ${error.message}`, 'bullmq-error');
  console.error('Redis connection error:', error);
}

// Default connection options for BullMQ
export const defaultConnectionOptions = {
  connection: redisConnection || {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: 0, // default Redis database
  }
};

// Default options for all queues
export const defaultQueueOptions: QueueOptions = {
  connection: defaultConnectionOptions.connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours (in seconds)
      count: 1000     // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days (in seconds)
    },
  }
};

// Function to create a queue with standardized error logging
function createQueue(name: string, options: Partial<QueueOptions> = {}): Queue {
  const queue = new Queue(name, {
    ...defaultQueueOptions,
    ...options
  });
  
  queue.on('error', (error) => {
    log(`[Queue:${name}] ❌ Error: ${error.message}`, 'queue-error');
    console.error(`Queue ${name} error:`, error);
  });
  
  log(`[Queue:${name}] ✅ Initialized successfully`, 'queue');
  return queue;
}

// Create and export queue instances
// These will be lazy-instantiated when first imported

// Convert existing 'stock-updates' queue to 'inventory' queue with aliases
export const inventoryQueue = createQueue(QueueName.Inventory);
export const stockQueue = inventoryQueue; // Alias for backward compatibility

export const accountingQueue = createQueue(QueueName.Accounting);
export const balanceQueue = accountingQueue; // Alias for backward compatibility

export const reportingQueue = createQueue(QueueName.Reporting);
export const reportQueue = reportingQueue; // Alias for backward compatibility

export const documentQueue = createQueue(QueueName.Document);

// Export a unified Queues object that contains all queues
export const Queues = {
  [QueueName.Inventory]: inventoryQueue,
  [QueueName.Accounting]: accountingQueue,
  [QueueName.Reporting]: reportingQueue,
  [QueueName.Document]: documentQueue,
  
  // Aliases for backward compatibility
  'stock-updates': stockQueue,
  'balance-updates': balanceQueue,
  'report-generation': reportQueue
};

// Export the queue map for programmatic access
export default Queues;