/**
 * Collaboration Module Initialization
 * 
 * This file initializes and configures all services for the Collaboration module.
 * All services use the DrizzleService pattern for consistent database access.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { Logger } from '../../common/logger';
import { TaskService } from './services/task.service';
import { NoteService } from './services/note.service';
import { CommunityService } from './services/community.service';
import { ActivityService } from './services/activity.service';
import { NotificationService } from './services/notification.service';

// Create a logger for the initialization process
const logger = new Logger('CollabServicesInit');

/**
 * Initialize all Collaboration module services
 * 
 * @param db Optional DrizzleService or PostgresJsDatabase instance (for testing)
 * @returns Object containing all initialized services
 */
export function initCollabServices(db?: DrizzleService | PostgresJsDatabase<any>) {
  logger.info('Initializing Collaboration Module Services');
  
  // Create the DrizzleService instance
  let drizzleService: DrizzleService;
  
  if (!db) {
    // Create a new instance if none provided
    logger.debug('Creating new DrizzleService instance');
    drizzleService = new DrizzleService();
  } else if (db instanceof DrizzleService) {
    // Use the provided DrizzleService
    logger.debug('Using provided DrizzleService instance');
    drizzleService = db;
  } else {
    // Create a new DrizzleService with the provided database
    logger.debug('Creating DrizzleService with provided database connection');
    drizzleService = new DrizzleService();
  }
  
  try {
    // Initialize all services with DrizzleService for consistent access pattern
    logger.debug('Initializing Task Service');
    const taskService = new TaskService(drizzleService);
    
    logger.debug('Initializing Note Service');
    const noteService = new NoteService(drizzleService);
    
    logger.debug('Initializing Activity Service');
    const activityService = new ActivityService(drizzleService);
    
    logger.debug('Initializing Notification Service');
    const notificationService = new NotificationService(drizzleService);
    
    // Use CollabDrizzleService for thread, message, and watcher services
    logger.debug('Getting thread, message, and watcher services from CollabDrizzleService');
    const collabServices = drizzleService.collab.getServices();
    
    // Extract services from CollabDrizzleService
    const threadService = collabServices.threadService;
    const messageService = collabServices.messageService;
    const watcherService = collabServices.watcherService;
    
    logger.debug('Initializing Community Service');
    const communityService = new CommunityService(drizzleService, threadService);
    
    logger.info('All Collaboration Module Services initialized successfully');
    
    // Return all services
    return {
      taskService,
      noteService,
      threadService,
      messageService,
      watcherService,
      communityService,
      activityService,
      notificationService
    };
  } catch (error) {
    logger.error('Failed to initialize Collaboration Module Services', error);
    throw error;
  }
}