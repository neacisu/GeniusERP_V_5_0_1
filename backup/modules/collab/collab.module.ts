/**
 * Collaboration Module
 * 
 * This module provides team collaboration capabilities including task management,
 * notes, internal discussions, assignment tracking, and status monitoring.
 */

import { Express } from 'express';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Logger } from '../../common/logger';

// Create a logger instance for the collaboration module
const logger = new Logger('CollabModule');
import { Module } from '../../types/module';
import { initCollabServices } from './init';
import { TaskService } from './services/task.service';
import { NoteService } from './services/note.service';
import { ThreadService } from './services/thread.service';
import { MessageService } from './services/message.service';
import { WatcherService } from './services/watcher.service';

// Import routes
import { registerTaskRoutes } from './routes/task.routes';
import { registerNoteRoutes } from './routes/note.routes';
import { registerThreadRoutes } from './routes/thread.routes';
import { registerMessageRoutes } from './routes/message.routes';
import { registerWatcherRoutes } from './routes/watcher.routes';

/**
 * Collaboration Module Class
 * 
 * Manages team collaboration, task tracking, notes, and internal discussions
 */
export class CollabModule implements Module {
  private static instance: CollabModule;
  
  taskService: TaskService;
  noteService: NoteService;
  threadService: ThreadService;
  messageService: MessageService;
  watcherService: WatcherService;
  
  private initialized: boolean = false;
  
  private constructor() {}
  
  /**
   * Get singleton instance of Collaboration module
   */
  public static getInstance(): CollabModule {
    if (!CollabModule.instance) {
      CollabModule.instance = new CollabModule();
    }
    return CollabModule.instance;
  }
  
  /**
   * Initialize the Collaboration module and its services
   */
  public initialize(db?: PostgresJsDatabase<any>): void {
    if (this.initialized) {
      logger.warn('Collaboration module already initialized');
      return;
    }
    
    logger.info('Initializing Collaboration module...');
    
    try {
      // Initialize services
      const services = initCollabServices(db);
      
      // Store service references
      this.taskService = services.taskService;
      this.noteService = services.noteService;
      this.threadService = services.threadService;
      this.messageService = services.messageService;
      this.watcherService = services.watcherService;
      
      this.initialized = true;
      logger.info('Collaboration module initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Collaboration module', { error });
      throw error;
    }
  }
  
  /**
   * Register all Collaboration routes with Express app
   */
  public registerRoutes(app: Express): void {
    if (!this.initialized) {
      throw new Error('Collaboration module must be initialized before registering routes');
    }
    
    logger.info('Registering Collaboration routes...');
    
    // Register routes for each service
    registerTaskRoutes(app, this.taskService);
    registerNoteRoutes(app, this.noteService);
    registerThreadRoutes(app, this.threadService);
    registerMessageRoutes(app, this.messageService);
    registerWatcherRoutes(app, this.watcherService);
    
    logger.info('Collaboration routes registered successfully');
  }
  
  /**
   * Start the Collaboration module background processes
   */
  public start(): void {
    if (!this.initialized) {
      throw new Error('Collaboration module must be initialized before starting');
    }
    
    logger.info('Starting Collaboration processes...');
    // Any background processes would be started here
    logger.info('Collaboration processes started successfully');
  }
  
  /**
   * Stop the Collaboration module background processes
   */
  public stop(): void {
    if (!this.initialized) {
      return;
    }
    
    logger.info('Stopping Collaboration processes...');
    // Any background processes would be stopped here
    logger.info('Collaboration processes stopped successfully');
  }
}