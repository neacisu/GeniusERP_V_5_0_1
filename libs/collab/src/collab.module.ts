/**
 * Collaboration Module
 * 
 * This module provides team collaboration capabilities including task management,
 * notes, internal discussions, assignment tracking, and status monitoring.
 */

import { Express, Request, Response, Router } from 'express';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createModuleLogger } from "@common/logger/loki-logger";
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { initCollabServices } from './init';
import { initCollabControllers } from './controllers/init';
import { TaskService } from './services/task.service';
import { NoteService } from './services/note.service';
import { CommunityService } from './services/community.service';
import { ActivityService } from './services/activity.service';
import { NotificationService } from './services/notification.service';
import { ThreadDrizzleService } from '../../common/drizzle/modules/collab/thread-service';
import { MessageDrizzleService } from '../../common/drizzle/modules/collab/message-service';
import { WatcherDrizzleService } from '../../common/drizzle/modules/collab/watcher-service';
import { TaskController } from './controllers/task.controller';
import { NoteController } from './controllers/note.controller';
import { ThreadController } from './controllers/thread.controller';
import { MessageController } from './controllers/message.controller';
import { WatcherController } from './controllers/watcher.controller';
import { CommunityController } from './controllers/community.controller';
import { ActivityController } from './controllers/activity.controller';
import { NotificationController } from './controllers/notification.controller';
import { registerTaskRoutes } from './routes/task.routes';
import { registerNoteRoutes } from './routes/note.routes';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtAuthMode } from '../auth/constants/auth-mode.enum';

// Create a logger instance for the collaboration module
const logger = createModuleLogger('CollabModule');

/**
 * Collaboration Module Class
 * 
 * Manages team collaboration, task tracking, notes, and internal discussions
 */
export class CollabModule {
  private static instance: CollabModule;
  
  // Services
  taskService!: TaskService;
  noteService!: NoteService;
  threadService!: ThreadDrizzleService;
  messageService!: MessageDrizzleService;
  watcherService!: WatcherDrizzleService;
  communityService!: CommunityService;
  activityService!: ActivityService;
  notificationService!: NotificationService;
  
  // Controllers
  taskController!: TaskController;
  noteController!: NoteController;
  threadController!: ThreadController;
  messageController!: MessageController;
  watcherController!: WatcherController;
  communityController!: CommunityController;
  activityController!: ActivityController;
  notificationController!: NotificationController;
  
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
  public initialize(db?: DrizzleService | PostgresJsDatabase<any>): void {
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
      this.communityService = services.communityService;
      this.activityService = services.activityService;
      this.notificationService = services.notificationService;
      
      // Initialize controllers with services
      const controllers = initCollabControllers(services);
      
      // Store controller references
      this.taskController = controllers.taskController;
      this.noteController = controllers.noteController;
      this.threadController = controllers.threadController;
      this.messageController = controllers.messageController;
      this.watcherController = controllers.watcherController;
      this.communityController = controllers.communityController;
      this.activityController = controllers.activityController;
      this.notificationController = controllers.notificationController;
      
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
    
    // Register task routes using the consistent controller-based approach
    // Pass the already initialized controller instance to avoid duplication
    registerTaskRoutes(app, this.taskService, this.taskController);
    
    // Use note controller that was already initialized
    const noteRouter = registerNoteRoutes(this.noteController);
    app.use('/api/collaboration/notes', noteRouter);
    
    // Create routers for remaining controllers
    const threadsRouter = Router();
    const messagesRouter = Router();
    const watchersRouter = Router();
    const communityRouter = Router();
    const activityRouter = Router();
    const notificationsRouter = Router();
    
    // Register controller routes on their respective routers
    this.threadController.registerRoutes(threadsRouter);
    this.messageController.registerRoutes(messagesRouter);
    this.watcherController.registerRoutes(watchersRouter);
    this.communityController.registerRoutes(communityRouter);
    this.activityController.registerRoutes(activityRouter);
    this.notificationController.registerRoutes(notificationsRouter);
    
    // Mount routers on their base paths
    app.use('/api/collaboration/threads', threadsRouter);
    app.use('/api/collaboration/messages', messagesRouter);
    app.use('/api/collaboration/watchers', watchersRouter);
    app.use('/api/collaboration/community', communityRouter);
    app.use('/api/collaboration/activity', activityRouter);
    app.use('/api/collaboration/notifications', notificationsRouter);
    
    // Add test endpoint for tasks (with authentication)
    app.post('/api/collab/task', AuthGuard.protect(JwtAuthMode.REQUIRED), (req, res) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        
        logger.info(`Task placeholder request received - User: ${userId}, Company: ${companyId}`);
        
        return res.status(200).json({
          message: "Collaboration task creation placeholder",
          timestamp: new Date().toISOString(),
          requestData: req.body,
          context: {
            userId,
            companyId
          }
        });
      } catch (error) {
        logger.error(`Error in POST /api/collab/task: ${error instanceof Error ? error.message : String(error)}`);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
    
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