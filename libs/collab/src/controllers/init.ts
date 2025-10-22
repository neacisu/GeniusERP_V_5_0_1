/**
 * Collaboration Controllers Initialization
 * 
 * This file initializes all controllers for the collaboration module.
 */

import { TaskService } from '../services/task.service';
import { NoteService } from '../services/note.service';
import { ActivityService } from '../services/activity.service';
import { NotificationService } from '../services/notification.service';
import { ThreadDrizzleService } from "@common/drizzle/modules/collab/thread-service";
import { MessageDrizzleService } from "@common/drizzle/modules/collab/message-service";
import { WatcherDrizzleService } from "@common/drizzle/modules/collab/watcher-service";

import {
  // Modern class controllers
  TaskController,
  NoteController,
  ThreadController,
  MessageController,
  WatcherController,
  CommunityController,
  ActivityController,
  NotificationController,
  
  // Legacy compatibility wrapper
  createTaskController,
  LegacyTaskController,
  createCommunityController
} from './index';

/**
 * Interface for all collaboration services needed by controllers
 */
interface CollabServices {
  taskService: TaskService;
  noteService: NoteService;
  threadService: ThreadDrizzleService;
  messageService: MessageDrizzleService;
  watcherService: WatcherDrizzleService;
  communityService: any;
  activityService: ActivityService;
  notificationService: NotificationService;
}

/**
 * Interface for all collaboration controllers
 */
export interface CollabControllers {
  // Modern class controllers
  taskController: TaskController; 
  noteController: NoteController;
  threadController: ThreadController;
  messageController: MessageController;
  watcherController: WatcherController;
  communityController: CommunityController;
  activityController: ActivityController;
  notificationController: NotificationController;
  
  // Legacy compatibility controllers (for backward compatibility)
  legacyTaskController: LegacyTaskController;
}

/**
 * Initialize all collaboration controllers
 * 
 * @param services Collaboration services
 * @returns All initialized controllers
 */
export function initCollabControllers(services: CollabServices): CollabControllers {
  // Create modern class-based controller instances
  const taskController = new TaskController(services.taskService);
  const noteController = new NoteController(services.noteService);
  const threadController = new ThreadController(services.threadService);
  const messageController = new MessageController(services.messageService);
  const watcherController = new WatcherController(services.watcherService);
  const communityController = new CommunityController(services.communityService);
  const activityController = new ActivityController(services.activityService);
  const notificationController = new NotificationController(services.notificationService);
  
  // Create the legacy compatibility wrappers for backward compatibility
  const legacyTaskController = createTaskController(services.taskService);
  // For future use, modern controller can be created using this factory
  // const modernTaskController = createModernTaskController(services.taskService);

  return {
    taskController,
    noteController,
    threadController,
    messageController,
    watcherController,
    communityController,
    activityController,
    notificationController,
    legacyTaskController
  };
}