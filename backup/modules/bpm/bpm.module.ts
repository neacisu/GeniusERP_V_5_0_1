/**
 * Business Process Management (BPM) Module
 * 
 * This module provides workflow automation capabilities for business processes
 * such as approvals, document processing, notifications, and integrations.
 */

import { Express } from 'express';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Logger } from '../../common/logger';
import { ProcessService } from './services/process.service';
import { initBpmServices } from './init';

// Create logger instance
const logger = new Logger('BpmModule');

// Import routes
import { registerProcessRoutes } from './routes/process.routes';
import { registerTriggerRoutes } from './routes/trigger.routes';
import { registerProcessInstanceRoutes } from './routes/process-instance.routes';
import { registerStepTemplateRoutes } from './routes/step-template.routes';
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
  
  // Essential service
  processService!: ProcessService;
  
  private initialized: boolean = false;
  
  private constructor() {
    // Service will be properly initialized in the initialize method
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
      // Initialize services
      const services = initBpmServices(db);
      
      // Store service references
      this.processService = services.processService;
      
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
    
    // Register routes for the process service
    registerProcessRoutes(app, this.processService);
    
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
    logger.info('BPM engine stopped successfully');
  }
}