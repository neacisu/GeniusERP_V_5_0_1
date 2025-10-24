/**
 * Business Process Management (BPM) Module
 * 
 * This module provides workflow automation capabilities for business processes
 * such as approvals, document processing, notifications, and integrations.
 */

import { Express } from 'express';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createModuleLogger } from "@common/logger/loki-logger";
import { ProcessService } from './services/process.service';
import { TriggerService } from './services/trigger.service';
import { ProcessInstanceService } from './services/process-instance.service';
import { StepExecutionService } from './services/step-execution.service';
import { ApiConnectionService } from './services/api-connection.service';
import { ScheduledJobService } from './services/scheduled-job.service';
import { initBpmServices } from './init';

// Create logger instance
const logger = createModuleLogger('BpmModule');

// Import routes
import { registerProcessRoutes } from './routes/process.routes';
import { registerTriggerRoutes } from './routes/trigger.routes';
import { registerProcessInstanceRoutes } from './routes/process-instance.routes';
import { initStepTemplateRoutes } from './routes/step-template.routes';
import { registerStepExecutionRoutes } from './routes/step-execution.routes';
import { registerApiConnectionRoutes } from './routes/api-connection.routes';
import { registerScheduledJobRoutes } from './routes/scheduled-job.routes';
import { registerBpmRoutes } from './routes/bpm.routes';

/**
 * BPM Module Class
 * 
 * Manages business process automation workflows, triggers, executions and monitoring
 */
export class BpmModule {
  private static instance: BpmModule;
  
  // Essential services
  processService!: ProcessService;
  triggerService!: TriggerService;
  processInstanceService!: ProcessInstanceService;
  stepExecutionService!: StepExecutionService;
  apiConnectionService!: ApiConnectionService;
  scheduledJobService!: ScheduledJobService;
  private db!: PostgresJsDatabase<any>;
  
  private initialized: boolean = false;
  
  private constructor() {
    // Services will be properly initialized in the initialize method
  }
  
  /**
   * Get singleton instance of BPM module
   */
  public static getInstance(): BpmModule {
    if (!BpmModule.instance) {
      BpmModule.instance = new BpmModule();
    }
    return BpmModule.instance;
  }
  
  /**
   * Initialize the BPM module and its services
   */
  public initialize(db?: PostgresJsDatabase<any>): void {
    if (this.initialized) {
      logger.warn('BPM module already initialized');
      return;
    }
    
    logger.info('Initializing BPM module...');
    
    try {
      // Store database reference
      if (db) {
        this.db = db;
      }
      
      // Initialize services
      const services = initBpmServices(db);
      
      // Store service references
      this.processService = services.processService;
      this.triggerService = services.triggerService;
      this.processInstanceService = services.processInstanceService;
      this.stepExecutionService = services.stepExecutionService;
      this.apiConnectionService = services.apiConnectionService;
      this.scheduledJobService = services.scheduledJobService;
      
      this.initialized = true;
      logger.info('BPM module initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize BPM module', { error });
      throw error;
    }
  }
  
  /**
   * Register all BPM routes with Express app
   */
  public registerRoutes(app: Express): void {
    if (!this.initialized) {
      throw new Error('BPM module must be initialized before registering routes');
    }
    
    logger.info('Registering BPM routes...');
    
    // Register general BPM routes
    registerBpmRoutes(app);
    
    // Register routes for process management
    registerProcessRoutes(app, this.processService, this.processInstanceService);
    
    // Register routes for trigger management
    registerTriggerRoutes(app, this.triggerService);
    
    // Register routes for process instance management
    registerProcessInstanceRoutes(app, this.processInstanceService);
    
    // Register routes for step template management
    initStepTemplateRoutes(app, this.db);
    
    // Register routes for step execution management
    registerStepExecutionRoutes(app, this.stepExecutionService);
    
    // Register routes for API connection management
    registerApiConnectionRoutes(app, this.apiConnectionService);
    
    // Register routes for scheduled job management
    registerScheduledJobRoutes(app, this.scheduledJobService);
    
    logger.info('BPM routes registered successfully');
  }
  
  /**
   * Start the BPM engine and scheduled tasks
   */
  public start(): void {
    if (!this.initialized) {
      throw new Error('BPM module must be initialized before starting');
    }
    
    logger.info('Starting BPM engine...');
    
    // Start scheduled job processing
    // TODO: Implement a proper scheduler with cron-like capabilities
    // For now, we'll just check for due jobs every minute
    setInterval(() => {
      this.scheduledJobService.processDueJobs()
        .then(result => {
          if (result.processed > 0) {
            logger.info(`Processed ${result.processed} scheduled jobs`, {
              processed: result.processed,
              succeeded: result.succeeded,
              failed: result.failed
            });
          }
        })
        .catch(error => {
          logger.error('Error processing scheduled jobs', { error });
        });
    }, 60000); // Check every minute
    
    logger.info('BPM engine started successfully');
  }
  
  /**
   * Stop the BPM engine and all running tasks
   */
  public stop(): void {
    if (!this.initialized) {
      return;
    }
    
    logger.info('Stopping BPM engine...');
    // TODO: Clean up any running timers, background tasks, etc.
    logger.info('BPM engine stopped successfully');
  }
}