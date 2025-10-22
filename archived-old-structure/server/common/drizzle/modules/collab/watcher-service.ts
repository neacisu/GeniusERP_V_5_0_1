/**
 * Watcher Drizzle Service
 * 
 * Refactored service for managing task watchers in the Collaboration module
 * using BaseDrizzleService for database operations with enhanced error handling
 * and comprehensive logging.
 */

import { BaseDrizzleService } from '../core/base-drizzle.service';
import { eq, and } from 'drizzle-orm';
import {
  taskWatchers
} from '../../../../../shared/schema/collaboration.schema';
import { randomUUID } from 'crypto';
import { Logger } from '../../../../common/logger';

// Create a logger instance for the watcher service
const logger = new Logger('WatcherDrizzleService');

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
 * Watcher Drizzle Service Class
 * 
 * Manages task watchers for tracking and notifications using DrizzleService.
 */
export class WatcherDrizzleService extends BaseDrizzleService {
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
    const context = 'addWatcher';
    try {
      logger.debug(`[${context}] Adding user ${userId} as watcher for task ${taskId} in company ${companyId}`);
      
      return await this.query(async (db) => {
        // First check if this user is already watching the task
        const existingWatchers = await db.select()
          .from(taskWatchers)
          .where(and(
            eq(taskWatchers.taskId, taskId),
            eq(taskWatchers.companyId, companyId),
            eq(taskWatchers.userId, userId)
          ));
        
        // If already watching, just return the existing record
        if (existingWatchers.length > 0) {
          const watcher = existingWatchers[0];
          logger.info(`[${context}] User ${userId} is already watching task ${taskId}, returning existing record`);
          return {
            ...watcher,
            notificationPreference: normalizeNotificationPreference(watcher.notificationPreference)
          };
        }
        
        // Add the watcher
        const newWatcherId = randomUUID();
        const createdWatchers = await db.insert(taskWatchers)
          .values({
            id: newWatcherId,
            taskId,
            companyId,
            userId,
            notificationPreference,
            createdAt: new Date()
          })
          .returning();
        
        if (createdWatchers.length === 0) {
          const error = new Error('Failed to add watcher');
          logger.error(`[${context}] ${error.message} for task ${taskId} and user ${userId}`);
          throw error;
        }
        
        const watcher = createdWatchers[0];
        logger.info(`[${context}] Added user ${userId} as watcher for task ${taskId} with ID ${newWatcherId}`);
        
        return {
          ...watcher,
          notificationPreference: normalizeNotificationPreference(watcher.notificationPreference)
        };
      });
    } catch (error) {
      logger.error(`[${context}] Error adding watcher: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Details: taskId=${taskId}, userId=${userId}, companyId=${companyId}`);
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
    const context = 'removeWatcher';
    try {
      logger.debug(`[${context}] Removing user ${userId} as watcher from task ${taskId} in company ${companyId}`);
      
      return await this.query(async (db) => {
        const result = await db.delete(taskWatchers)
          .where(and(
            eq(taskWatchers.taskId, taskId),
            eq(taskWatchers.companyId, companyId),
            eq(taskWatchers.userId, userId)
          ))
          .returning();
        
        const removed = result.length > 0;
        
        if (removed) {
          logger.info(`[${context}] Successfully removed user ${userId} as watcher from task ${taskId}`);
        } else {
          logger.info(`[${context}] No watcher found for user ${userId} and task ${taskId} to remove`);
        }
        
        return removed;
      });
    } catch (error) {
      logger.error(`[${context}] Error removing watcher: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Details: taskId=${taskId}, userId=${userId}, companyId=${companyId}`);
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
    const context = 'getWatchersByTaskId';
    try {
      logger.debug(`[${context}] Fetching watchers for task ${taskId} in company ${companyId}`);
      
      return await this.query(async (db) => {
        const watchers = await db.select()
          .from(taskWatchers)
          .where(and(
            eq(taskWatchers.taskId, taskId),
            eq(taskWatchers.companyId, companyId)
          ));
        
        logger.info(`[${context}] Found ${watchers.length} watchers for task ${taskId}`);
        
        // Normalize notification preferences for each watcher
        return watchers.map(watcher => ({
          ...watcher,
          notificationPreference: normalizeNotificationPreference(watcher.notificationPreference)
        }));
      });
    } catch (error) {
      logger.error(`[${context}] Error fetching watchers by task ID: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Details: taskId=${taskId}, companyId=${companyId}`);
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
    const context = 'getWatchedTaskIds';
    try {
      logger.debug(`[${context}] Fetching tasks watched by user ${userId} in company ${companyId}`);
      
      return await this.query(async (db) => {
        const watchers = await db.select({
          taskId: taskWatchers.taskId
        })
          .from(taskWatchers)
          .where(and(
            eq(taskWatchers.userId, userId),
            eq(taskWatchers.companyId, companyId)
          ));
        
        const taskIds = watchers.map(w => w.taskId);
        logger.info(`[${context}] Found ${taskIds.length} tasks watched by user ${userId}`);
        
        return taskIds;
      });
    } catch (error) {
      logger.error(`[${context}] Error fetching watched task IDs: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Details: userId=${userId}, companyId=${companyId}`);
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
    const context = 'updateWatcherPreferences';
    try {
      logger.debug(`[${context}] Updating notification preferences for user ${userId} on task ${taskId}`);
      
      return await this.query(async (db) => {
        const updatedWatchers = await db.update(taskWatchers)
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
          logger.info(`[${context}] No watcher found for user ${userId} and task ${taskId} to update`);
          return null;
        }
        
        const watcher = updatedWatchers[0];
        logger.info(`[${context}] Successfully updated notification preferences for user ${userId} on task ${taskId}`);
        
        return {
          ...watcher,
          notificationPreference: normalizeNotificationPreference(watcher.notificationPreference)
        };
      });
    } catch (error) {
      logger.error(`[${context}] Error updating watcher preferences: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Details: taskId=${taskId}, userId=${userId}, companyId=${companyId}`);
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
    const context = 'isWatching';
    try {
      logger.debug(`[${context}] Checking if user ${userId} is watching task ${taskId} in company ${companyId}`);
      
      return await this.query(async (db) => {
        const watchers = await db.select()
          .from(taskWatchers)
          .where(and(
            eq(taskWatchers.taskId, taskId),
            eq(taskWatchers.companyId, companyId),
            eq(taskWatchers.userId, userId)
          ));
        
        const isWatching = watchers.length > 0;
        logger.info(`[${context}] User ${userId} ${isWatching ? 'is' : 'is not'} watching task ${taskId}`);
        
        return isWatching;
      });
    } catch (error) {
      logger.error(`[${context}] Error checking if user is watching task: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Details: taskId=${taskId}, userId=${userId}, companyId=${companyId}`);
      throw error;
    }
  }
}