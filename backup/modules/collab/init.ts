/**
 * Collaboration Module Initialization
 * 
 * This file initializes and configures all services for the Collaboration module.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { getDrizzle } from '../../common/drizzle';
import { TaskService } from './services/task.service';
import { NoteService } from './services/note.service';
import { ThreadService } from './services/thread.service';
import { MessageService } from './services/message.service';
import { WatcherService } from './services/watcher.service';

/**
 * Initialize all Collaboration module services
 * 
 * @param db Optional Drizzle database instance (for testing)
 * @returns Object containing all initialized services
 */
export function initCollabServices(db?: PostgresJsDatabase<any>) {
  // Use provided db or get a new connection
  const dbInstance = db || getDrizzle();
  
  // Initialize services with database connection
  const taskService = new TaskService(dbInstance);
  const noteService = new NoteService(dbInstance);
  const threadService = new ThreadService(dbInstance);
  const messageService = new MessageService(dbInstance);
  const watcherService = new WatcherService(dbInstance);
  
  // Return all services
  return {
    taskService,
    noteService,
    threadService,
    messageService,
    watcherService
  };
}