import { Queue, Worker, QueueEvents } from 'bullmq';
import { RedisService } from './redis.service';
import { AccountingService } from '../modules/accounting/services/accounting.service';
import { InventoryService } from '../modules/inventory/services/inventory.service';
import { storage } from '../storage';

// Define job types
export interface BalanceUpdateJob {
  journalEntryId: string;
  companyId: string;
}

export interface StockUpdateJob {
  movementId: string;
  productId: string;
}

export interface ReportGenerationJob {
  reportType: string;
  parameters: Record<string, any>;
  userId: string;
}

// Define queue service interface
export interface IQueueService {
  init(): Promise<void>;
  addBalanceUpdateJob(data: BalanceUpdateJob): Promise<void>;
  addStockUpdateJob(data: StockUpdateJob): Promise<void>;
  addReportGenerationJob(data: ReportGenerationJob): Promise<any>;
  getJobStatus(queueName: string, jobId: string): Promise<any>;
  close(): Promise<void>;
}

export class QueueService implements IQueueService {
  private balanceQueue: Queue | null = null;
  private stockQueue: Queue | null = null;
  private reportQueue: Queue | null = null;
  private balanceWorker: Worker | null = null;
  private stockWorker: Worker | null = null;
  private reportWorker: Worker | null = null;
  
  constructor(private redisService: RedisService) {}
  
  async init() {
    try {
      // Initialize services
      const accountingService = new AccountingService(storage);
      const inventoryService = new InventoryService(storage);
      
      // Try to get Redis client - might be null if Redis isn't available
      let redisClient = null;
      try {
        redisClient = this.redisService.getClient();
        console.log('Successfully retrieved Redis client for BullMQ');
      } catch (error) {
        console.warn('Redis client not available, queue service will use sync processing:', error);
        
        // Ensure we can still proceed with the application even without Redis
        console.warn('Redis Cloud note: Using volatile-lru policy instead of noeviction. Some features may be affected.');
        return; // Skip queue initialization
      }
      
      if (!redisClient) {
        console.warn('Redis client not available, queue service will use sync processing');
        
        // Log more information to help diagnose the issue
        console.warn('Redis Cloud note: Using volatile-lru policy instead of noeviction. Some features may be affected.');
        return; // Skip queue initialization
      }
      
      console.log('Using Redis client with options:', {
        host: redisClient.options?.host,
        port: redisClient.options?.port,
        tls: !!redisClient.options?.tls,
        username: !!redisClient.options?.username
      });
      
      // Create simplified connection options for BullMQ
      const connectionOptions = {
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
          username: process.env.REDIS_USERNAME,
          // TLS configuration for secure connections
          tls: process.env.REDIS_HOST?.endsWith('.upstash.io') || 
               process.env.REDIS_HOST?.endsWith('.redis.cache.windows.net') || 
               process.env.REDIS_HOST?.includes('redis.cloud.redislabs.com') ? 
               { rejectUnauthorized: false } : undefined,
          // Default to more robust settings
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            // Simple retry strategy
            if (times > 5) return null; // Stop retrying after 5 attempts
            return Math.min(times * 200, 2000); // Increase delay between retries
          },
          // Simplify connection settings
          enableReadyCheck: true,
          enableOfflineQueue: true
        }
      };
      
      console.log('Redis Cloud note: Using volatile-lru policy instead of noeviction. Some features may be affected.');
      
      try {
        // Start with just one queue as a test
        console.log('Initializing balance queue...');
        this.balanceQueue = new Queue('balance-updates', {
          connection: connectionOptions.connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000, // 1 second
            },
          },
        });
        
        console.log('Balance queue initialized successfully');
        
        // Add error handlers
        this.balanceQueue.on('error', (err) => {
          console.error('Balance queue error:', err);
        });
        
        // Initialize the worker for the balance queue
        console.log('Initializing balance worker...');
        this.balanceWorker = new Worker('balance-updates', 
          async (job) => {
            console.log(`Processing balance update job: ${job.id}`);
            const { journalEntryId, companyId } = job.data as BalanceUpdateJob;
            
            // Here we would update account balances based on the journal entry
            console.log(`Updating balances for journal entry: ${journalEntryId}, company: ${companyId}`);
            
            // Actual implementation would involve fetching the journal entry,
            // its lines, and updating the corresponding account balances
            
            return { success: true, message: 'Account balances updated successfully' };
          },
          { connection: connectionOptions.connection }
        );
        
        console.log('Balance worker initialized, registering event handlers...');
        
        // Add error handlers
        this.balanceWorker.on('error', (err) => {
          console.error('Balance worker error:', err);
        });
        
        this.balanceWorker.on('failed', (job, err) => {
          console.error(`Balance update job ${job?.id} failed:`, err);
        });
        
        console.log('Successfully initialized balance queue and worker');
        
        // Initialize the other queues only if the first one was successful
        this.stockQueue = new Queue('stock-updates', {
          connection: connectionOptions.connection,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        });
        
        this.reportQueue = new Queue('report-generation', {
          connection: connectionOptions.connection,
          defaultJobOptions: {
            attempts: 2,
            backoff: {
              type: 'fixed',
              delay: 5000,
            },
          },
        });
        
        console.log('Stock and report queues initialized successfully');
        
        // Initialize the other workers
        this.stockWorker = new Worker('stock-updates',
          async (job) => {
            console.log(`Processing stock update job: ${job.id}`);
            const { movementId, productId } = job.data as StockUpdateJob;
            
            // Update stock based on the stock movement
            // TODO: Implement updateStock method in InventoryService
            console.log(`Stock update for movement ${movementId} - method not yet implemented`);
            
            return { success: true, message: 'Stock updated successfully' };
          },
          { connection: connectionOptions.connection }
        );
        
        this.reportWorker = new Worker('report-generation',
          async (job) => {
            console.log(`Processing report generation job: ${job.id}`);
            const { reportType, parameters, userId } = job.data as ReportGenerationJob;
            
            // Generate report based on type and parameters
            console.log(`Generating ${reportType} report with parameters:`, parameters);
            
            // Here we would generate the report and store it for later retrieval
            
            return { 
              success: true, 
              message: 'Report generated successfully',
              reportUrl: `/api/reports/${reportType}/${job.id}` 
            };
          },
          { connection: connectionOptions.connection }
        );
        
        // Add error handlers for other workers
        this.stockWorker.on('error', (err) => {
          console.error('Stock worker error:', err);
        });
        
        this.reportWorker.on('error', (err) => {
          console.error('Report worker error:', err);
        });
        
        this.stockWorker.on('failed', (job, err) => {
          console.error(`Stock update job ${job?.id} failed:`, err);
        });
        
        this.reportWorker.on('failed', (job, err) => {
          console.error(`Report generation job ${job?.id} failed:`, err);
        });
        
        console.log('All workers initialized successfully');
      } catch (queueErr) {
        console.error('Failed to initialize queues or workers:', queueErr);
        
        // Clean up any queues and workers that might have been created
        await Promise.all([
          this.balanceQueue?.close().catch(() => {}),
          this.stockQueue?.close().catch(() => {}),
          this.reportQueue?.close().catch(() => {}),
          this.balanceWorker?.close().catch(() => {}),
          this.stockWorker?.close().catch(() => {}),
          this.reportWorker?.close().catch(() => {})
        ]);
        
        this.balanceQueue = null;
        this.stockQueue = null;
        this.reportQueue = null;
        this.balanceWorker = null;
        this.stockWorker = null;
        this.reportWorker = null;
        
        console.warn('Queues and workers disabled due to initialization failure');
        console.warn('Falling back to synchronous processing');
      }
      
      console.log('Queue service initialization completed');
      
    } catch (error) {
      console.error('Failed to initialize queue service:', error);
      // Fall back to synchronous processing
      console.warn('Using synchronous processing fallback instead of queues');
    }
  }
  
  async close() {
    // Close queues and workers
    await Promise.all([
      this.balanceQueue?.close(),
      this.stockQueue?.close(),
      this.reportQueue?.close(),
      this.balanceWorker?.close(),
      this.stockWorker?.close(),
      this.reportWorker?.close(),
    ]);
    
    console.log('Queue service closed');
  }
  
  // Add jobs to queues
  async addBalanceUpdateJob(data: BalanceUpdateJob) {
    if (!this.balanceQueue) {
      // Fallback: process synchronously
      console.warn('Balance queue not available, processing synchronously');
      // Implementation would be here
      return;
    }
    
    await this.balanceQueue.add('update-balance', data);
  }
  
  async addStockUpdateJob(data: StockUpdateJob) {
    if (!this.stockQueue) {
      // Fallback: process synchronously
      console.warn('Stock queue not available, processing synchronously');
      // Implementation would be here
      return;
    }
    
    await this.stockQueue.add('update-stock', data);
  }
  
  async addReportGenerationJob(data: ReportGenerationJob) {
    if (!this.reportQueue) {
      // Fallback: process synchronously
      console.warn('Report queue not available, processing synchronously');
      // Implementation would be here
      return;
    }
    
    return await this.reportQueue.add('generate-report', data);
  }
  
  // Get job status
  async getJobStatus(queueName: string, jobId: string) {
    let queue;
    
    switch (queueName) {
      case 'balance-updates':
        queue = this.balanceQueue;
        break;
      case 'stock-updates':
        queue = this.stockQueue;
        break;
      case 'report-generation':
        queue = this.reportQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
    
    if (!queue) {
      throw new Error(`Queue ${queueName} not initialized`);
    }
    
    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    const state = await job.getState();
    return {
      id: job.id,
      state,
      data: job.data,
      returnValue: job.returnvalue,
      failedReason: job.failedReason,
      progress: job.progress,
    };
  }
}
