/**
 * Collaboration Drizzle Service
 * 
 * This is the main service that organizes all collaboration-related drizzle services.
 * It provides centralized access to tasks, messages, threads, and watchers.
 */

import { BaseDrizzleService } from '../core/base-drizzle.service';
import { Logger } from '../../../../common/logger';
import { ThreadDrizzleService } from './thread-service';
import { MessageDrizzleService } from './message-service';
import { WatcherDrizzleService } from './watcher-service';

// Create a logger instance
const logger = new Logger('CollabDrizzleService');

/**
 * Collaboration Drizzle Service
 * 
 * Provides access to all collaboration-related database services.
 */
export class CollabDrizzleService extends BaseDrizzleService {
  // Service instances for different collaboration functionalities
  threadService: ThreadDrizzleService;
  messageService: MessageDrizzleService;
  watcherService: WatcherDrizzleService;
  
  /**
   * Constructor initializes all collaboration services
   */
  constructor() {
    super();
    logger.debug('Initializing CollabDrizzleService');
    
    try {
      this.threadService = new ThreadDrizzleService();
      logger.debug('ThreadDrizzleService initialized');
      
      this.messageService = new MessageDrizzleService();
      logger.debug('MessageDrizzleService initialized');
      
      this.watcherService = new WatcherDrizzleService();
      logger.debug('WatcherDrizzleService initialized');
      
      logger.info('CollabDrizzleService initialized successfully with all services');
    } catch (error) {
      logger.error('Failed to initialize CollabDrizzleService', error);
      throw error;
    }
  }
  
  /**
   * Get all collaboration services
   * 
   * @returns Object containing all collaboration services
   */
  getServices() {
    return {
      threadService: this.threadService,
      messageService: this.messageService,
      watcherService: this.watcherService
    };
  }
}