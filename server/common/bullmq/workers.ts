/**
 * BullMQ Worker Definitions
 * 
 * This file centralizes worker creation and job processing for all queues.
 * It exports functions to create workers with standardized error handling.
 */

import { Job, Processor, Worker, WorkerOptions } from 'bullmq';
import { QueueName, JobPayload, JobTypeMap } from './types';
import { log } from '../../vite';
import { defaultConnectionOptions } from './queues';
import { getNotificationService } from '../../common/services/registry';
import { NotificationType, NotificationPriority } from '../services/notification.service';

// Default options for all workers
export const defaultWorkerOptions: WorkerOptions = {
  connection: defaultConnectionOptions.connection,
  autorun: true,
  concurrency: 5,
  lockDuration: 30000,
  maxStalledCount: 3,
};

/**
 * Create a worker with standardized error handling and logging
 * 
 * @param queueName Name of the queue to process
 * @param processor Function that processes jobs from the queue
 * @param options Additional worker options
 * @returns Worker instance
 */
export function createWorker<T = JobPayload>(
  queueName: string,
  processor: Processor<T>,
  options: Partial<WorkerOptions> = {}
): Worker<T> {
  // Create a new worker with specified options
  const worker = new Worker<T>(
    queueName, 
    wrapProcessor(queueName, processor), 
    {
      ...defaultWorkerOptions,
      ...options
    }
  );
  
  // Add standardized error and event handling
  worker.on('error', (error) => {
    log(`[Worker:${queueName}] ❌ Error: ${error.message}`, 'worker-error');
    console.error(`Worker ${queueName} error:`, error);
  });
  
  worker.on('failed', (job, error) => {
    const jobId = job?.id || 'unknown';
    const jobName = job?.name || 'unknown';
    log(`[Worker:${queueName}] ❌ Job ${jobName}:${jobId} failed: ${error.message}`, 'worker-job-failed');
    console.error(`Job ${jobName}:${jobId} failed:`, error);
  });
  
  worker.on('completed', (job) => {
    const jobId = job?.id || 'unknown';
    const jobName = job?.name || 'unknown';
    log(`[Worker:${queueName}] ✅ Job ${jobName}:${jobId} completed successfully`, 'worker-job-completed');
  });
  
  worker.on('active', (job) => {
    const jobId = job?.id || 'unknown';
    const jobName = job?.name || 'unknown';
    log(`[Worker:${queueName}] 🔄 Processing job ${jobName}:${jobId}`, 'worker-job-active');
  });
  
  log(`[Worker:${queueName}] ✅ Worker initialized successfully`, 'worker');
  return worker;
}

/**
 * Wrap a processor function with standardized logging and error handling
 * 
 * @param queueName Name of the queue
 * @param processor The job processor function
 * @returns Wrapped processor function
 */
function wrapProcessor<T>(queueName: string, processor: Processor<T>): Processor<T> {
  return async (job: Job<T>) => {
    try {
      log(`[Worker:${queueName}] 🔄 Processing job ${job.name}:${job.id}`, 'worker-job-processing');
      
      // Process the job with the provided processor
      const result = await processor(job);
      
      log(`[Worker:${queueName}] ✅ Job ${job.name}:${job.id} completed`, 'worker-job-completed');
      return result;
    } catch (error: any) {
      log(`[Worker:${queueName}] ❌ Job ${job.name}:${job.id} failed: ${error.message}`, 'worker-job-failed');
      // Re-throw the error to let BullMQ handle it
      throw error;
    }
  };
}

/**
 * Create all required workers for the application
 * 
 * @returns Object containing all worker instances
 */
export function createAllWorkers() {
  return {
    // Inventory worker - handles stock-related jobs
    inventoryWorker: createWorker<JobTypeMap[keyof JobTypeMap]>(QueueName.Inventory, async (job) => {
      log(`Processing inventory job: ${job.name}`, 'inventory-job');
      
      try {
        switch (job.name) {
          case 'low-stock-alert': {
            const data = job.data as JobTypeMap['low-stock-alert'];
            log(`Low stock alert for product ${data.alert.productName}`, 'inventory-job');
            // Implementation would be here
            break;
          }
          case 'scheduled-stock-check': {
            const data = job.data as JobTypeMap['scheduled-stock-check'];
            log(`Scheduled stock check for company ${data.companyId}`, 'inventory-job');
            // Implementation would be here
            break;
          }
          case 'stock-transfer': {
            const data = job.data as JobTypeMap['stock-transfer'];
            log(`Stock transfer from ${data.sourceWarehouseId} to ${data.targetWarehouseId}`, 'inventory-job');
            // Implementation would be here
            break;
          }
          case 'alert': {
            const data = job.data as JobTypeMap['alert'];
            const severityLabel = data.severity ? data.severity.toUpperCase() : 'UNKNOWN';
            
            log(`[${severityLabel}] Inventory alert for product ${data.productName || data.sku} in warehouse ${data.warehouseId}`, 'inventory-alert');
            
            // Get the notification service from the registry (using imported function)
            const notificationService = getNotificationService();
            
            if (data.companyId) {
              // Create the notification based on severity - using NotificationType enum
              const notification = {
                title: `Inventory Alert: ${data.productName || data.sku}`,
                message: `Stock level for ${data.productName || data.sku} is ${data.currentQuantity} units, which is ${data.severity === 'critical' ? 'critically low' : 'below recommended threshold'} (min: ${data.minThreshold}).`,
                type: data.severity === 'critical' ? NotificationType.ERROR : (data.severity === 'high' ? NotificationType.WARNING : NotificationType.INFO),
                priority: (data.severity === 'critical' ? NotificationPriority.CRITICAL : (data.severity === 'high' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM)),
                metadata: {
                  warehouseId: data.warehouseId,
                  productId: data.productId,
                  sku: data.sku,
                  currentQuantity: data.currentQuantity,
                  minThreshold: data.minThreshold,
                  timestamp: new Date().toISOString()
                },
                actionUrl: `/inventory/products/${data.productId || data.sku}`
              };
              
              // Send the notification to the company
              await notificationService.notifyCompany(data.companyId, notification);
              
              log(`Notification sent to company ${data.companyId} for product ${data.productName || data.sku}`, 'inventory-alert');
            } else {
              log(`Cannot send notification: missing company ID for product ${data.productName || data.sku}`, 'inventory-alert-error');
            }
            
            break;
          }
          default:
            log(`Unknown job type: ${job.name}`, 'inventory-job-error');
        }
        
        return { success: true, jobName: job.name, jobId: job.id };
      } catch (error: any) {
        log(`Error processing inventory job: ${error.message}`, 'inventory-job-error');
        throw error; // Re-throw to mark the job as failed
      }
    }),
    
    // Accounting worker - handles accounting-related jobs
    accountingWorker: createWorker<JobTypeMap[keyof JobTypeMap]>(QueueName.Accounting, async (job) => {
      // Import processor dinamically to avoid circular dependencies
      const { processAccountingJob } = await import('../../modules/accounting/workers/accounting-worker.processor');
      return await processAccountingJob(job);
    }),
    
    // Reporting worker - handles report generation jobs
    reportingWorker: createWorker<JobTypeMap[keyof JobTypeMap]>(QueueName.Reporting, async (job) => {
      log(`Processing reporting job: ${job.name}`, 'reporting-job');
      
      try {
        switch (job.name) {
          case 'generate-report': {
            const data = job.data as JobTypeMap['generate-report'];
            log(`Generating ${data.reportType} report`, 'reporting-job');
            // Implementation would be here
            
            // Return the report URL for clients to fetch the report
            return { 
              success: true, 
              jobName: job.name,
              jobId: job.id,
              reportUrl: `/api/reports/${data.reportType}/${job.id}` 
            };
          }
          default:
            log(`Unknown job type: ${job.name}`, 'reporting-job-error');
        }
        
        return { success: true, jobName: job.name, jobId: job.id };
      } catch (error: any) {
        log(`Error processing reporting job: ${error.message}`, 'reporting-job-error');
        throw error; // Re-throw to mark the job as failed
      }
    }),
    
    // Document worker - handles document processing jobs
    documentWorker: createWorker<JobTypeMap[keyof JobTypeMap]>(QueueName.Document, async (job) => {
      log(`Processing document job: ${job.name}`, 'document-job');
      
      try {
        switch (job.name) {
          case 'document-processing': {
            const data = job.data as JobTypeMap['document-processing'];
            log(`Processing document ${data.documentId} with action ${data.action}`, 'document-job');
            // Implementation would be here
            break;
          }
          default:
            log(`Unknown job type: ${job.name}`, 'document-job-error');
        }
        
        return { success: true, jobName: job.name, jobId: job.id };
      } catch (error: any) {
        log(`Error processing document job: ${error.message}`, 'document-job-error');
        throw error; // Re-throw to mark the job as failed
      }
    })
  };
}

// Export a factory function to create workers when needed
export const Workers = {
  create: createWorker,
  createAll: createAllWorkers
};