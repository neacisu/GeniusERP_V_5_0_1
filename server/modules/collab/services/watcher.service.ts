/**
 * Watcher Service
 * 
 * Service for managing task watchers in the Collaboration module.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import {
  taskWatchers
} from '../../../../shared/schema/collaboration.schema';
import { randomUUID } from 'crypto';
import { Logger } from '../../../common/logger';

// Create a logger instance for the watcher service
const logger = new Logger('WatcherService');

/**
 * TaskWatcher type for the API
 */
export interface TaskWatcher {
  id: string;
  taskId: string;
  companyId: string;
  userId: string;
  notificationPreference: Record<string, any>;
  createdAt: Date | null;
}

// Helper function to convert unknown type to Record<string, any>
function normalizeNotificationPreference(pref: unknown): Record<string, any> {
  if (typeof pref === 'object' && pref !== null) {
    return pref as Record<string, any>;
  }
  return { enabled: true }; // Default value
}

/**
 * Watcher Service Class
 * 
 * Manages task watchers for tracking and notifications.
 */
export class WatcherService {
  /**
   * Constructor
   * 
   * @param db Drizzle database instance
   */
  constructor(private db: PostgresJsDatabase<any>) {}
  
  /**
   * Add a watcher to a task
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @param userId User ID to add as a watcher
   * @param notificationPreference Notification preferences
   * @returns Created watcher record
   */
  async addWatcher(
    taskId: string,
    companyId: string,
    userId: string,
    notificationPreference: Record<string, any> = { enabled: true }
  ): Promise<TaskWatcher> {
    try {
      // First check if this user is already watching the task
      const existingWatchers = await this.db.select()
        .from(taskWatchers)
        .where(and(
          eq(taskWatchers.taskId, taskId),
          eq(taskWatchers.companyId, companyId),
          eq(taskWatchers.userId, userId)
        ));
      
      // If already watching, just return the existing record
      if (existingWatchers.length > 0) {
        const watcher = existingWatchers[0];
        return {
          ...watcher,
          notificationPreference: normalizeNotificationPreference(watcher.notificationPreference)
        };
      }
      
      // Add the watcher
      const createdWatchers = await this.db.insert(taskWatchers)
        .values({
          id: randomUUID(),
          taskId,
          companyId,
          userId,
          notificationPreference,
          createdAt: new Date()
        })
        .returning();
      
      if (createdWatchers.length === 0) {
        throw new Error('Failed to add watcher');
      }
      
      const watcher = createdWatchers[0];
      return {
        ...watcher,
        notificationPreference: normalizeNotificationPreference(watcher.notificationPreference)
      };
    } catch (error) {
      logger.error('Error adding watcher', { error, taskId, userId });
      throw error;
    }
  }
  
  /**
   * Remove a watcher from a task
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @param userId User ID to remove as a watcher
   * @returns Success status
   */
  async removeWatcher(taskId: string, companyId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db.delete(taskWatchers)
        .where(and(
          eq(taskWatchers.taskId, taskId),
          eq(taskWatchers.companyId, companyId),
          eq(taskWatchers.userId, userId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error removing watcher', { error, taskId, userId });
      throw error;
    }
  }
  
  /**
   * Get all watchers for a task
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @returns List of watchers
   */
  async getWatchersByTaskId(taskId: string, companyId: string): Promise<TaskWatcher[]> {
    try {
      const watchers = await this.db.select()
        .from(taskWatchers)
        .where(and(
          eq(taskWatchers.taskId, taskId),
          eq(taskWatchers.companyId, companyId)
        ));
      
      // Normalize notification preferences for each watcher
      return watchers.map(watcher => ({
        ...watcher,
        notificationPreference: normalizeNotificationPreference(watcher.notificationPreference)
      }));
    } catch (error) {
      logger.error('Error fetching watchers by task ID', { error, taskId, companyId });
      throw error;
    }
  }
  
  /**
   * Get all tasks watched by a user
   * 
   * @param userId User ID
   * @param companyId Company ID
   * @returns List of task IDs being watched
   */
  async getWatchedTaskIds(userId: string, companyId: string): Promise<string[]> {
    try {
      const watchers = await this.db.select({
        taskId: taskWatchers.taskId
      })
        .from(taskWatchers)
        .where(and(
          eq(taskWatchers.userId, userId),
          eq(taskWatchers.companyId, companyId)
        ));
      
      return watchers.map(w => w.taskId);
    } catch (error) {
      logger.error('Error fetching watched task IDs', { error, userId, companyId });
      throw error;
    }
  }
  
  /**
   * Update watcher notification preferences
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @param userId User ID
   * @param notificationPreference Updated notification preferences
   * @returns Updated watcher record or null if not found
   */
  async updateWatcherPreferences(
    taskId: string,
    companyId: string,
    userId: string,
    notificationPreference: Record<string, any>
  ): Promise<TaskWatcher | null> {
    try {
      const updatedWatchers = await this.db.update(taskWatchers)
        .set({
          notificationPreference
        })
        .where(and(
          eq(taskWatchers.taskId, taskId),
          eq(taskWatchers.companyId, companyId),
          eq(taskWatchers.userId, userId)
        ))
        .returning();
      
      if (updatedWatchers.length === 0) {
        return null;
      }
      
      const watcher = updatedWatchers[0];
      return {
        ...watcher,
        notificationPreference: normalizeNotificationPreference(watcher.notificationPreference)
      };
    } catch (error) {
      logger.error('Error updating watcher preferences', { error, taskId, userId });
      throw error;
    }
  }
  
  /**
   * Check if a user is watching a task
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @param userId User ID
   * @returns Boolean indicating if the user is watching the task
   */
  async isWatching(taskId: string, companyId: string, userId: string): Promise<boolean> {
    try {
      const watchers = await this.db.select()
        .from(taskWatchers)
        .where(and(
          eq(taskWatchers.taskId, taskId),
          eq(taskWatchers.companyId, companyId),
          eq(taskWatchers.userId, userId)
        ));
      
      return watchers.length > 0;
    } catch (error) {
      logger.error('Error checking if user is watching task', { error, taskId, userId });
      throw error;
    }
  }
}