/**
 * Activity Service
 * 
 * Service for managing collaboration activity streams.
 */

import { eq, and, desc, sql, count } from 'drizzle-orm';
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { createModuleLogger } from "@common/logger/loki-logger";
import { collaborationActivities } from '@geniuserp/shared/schema/collaboration.schema';

/**
 * Activity item type enum
 */
export enum ActivityType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  NOTE_CREATED = 'NOTE_CREATED',
  NOTE_UPDATED = 'NOTE_UPDATED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  THREAD_CREATED = 'THREAD_CREATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
}

/**
 * Activity query options
 */
export interface ActivityQueryOptions {
  limit?: number;
  offset?: number;
  userId?: string;
  includeTypes?: ActivityType[];
}

/**
 * Activity Service Class
 * 
 * Handles activity stream operations.
 */
export class ActivityService {
  private _logger: ReturnType<typeof createModuleLogger>;
  
  /**
   * Constructor
   * 
   * @param drizzleService Drizzle ORM service
   */
  constructor(private drizzleService: DrizzleService) {
    this._logger = createModuleLogger('ActivityService');
  }
  
  /**
   * Get recent activity for a company
   * 
   * @param companyId Company ID
   * @param options Query options
   * @returns Activity items
   */
  async getCompanyActivity(companyId: string, options: ActivityQueryOptions = {}) {
    try {
      this._logger.debug('Getting company activity', { companyId, options });
      
      const { limit = 10, offset = 0, userId, includeTypes } = options;
      
      // Build where conditions
      let whereConditions = and(
        eq(collaborationActivities.companyId, companyId)
      );
      
      // Add user filter if specified
      if (userId) {
        whereConditions = and(
          whereConditions,
          eq(collaborationActivities.userId, userId)
        );
      }
      
      // Add type filter if specified
      if (includeTypes && includeTypes.length > 0) {
        // Using the proper Drizzle ORM syntax for IN conditions
        whereConditions = and(
          whereConditions,
          sql`${collaborationActivities.type} IN (${sql.join(includeTypes.map(t => sql`${t}`), sql`, `)})`
        );
      }
      
      // Get activities from database
      this._logger.debug(`Executing activity query with conditions for company: ${companyId}`);
      
      const activityItems = await this.drizzleService.query(db => 
        db.select()
          .from(collaborationActivities)
          .where(whereConditions)
          .orderBy(desc(collaborationActivities.createdAt))
          .limit(limit)
          .offset(offset)
      );
      
      this._logger.debug(`Activity query results: ${activityItems?.length || 0} items found`);
      
      // Transform database records to the format expected by the frontend
      const mappedItems = (activityItems || []).map((item: any) => {
        // Try to parse JSON data
        let itemData: Record<string, any> = {};
        try {
          if (item.data) {
            itemData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          }
        } catch (e) {
          this._logger.error('Error parsing activity data JSON', { error: e, itemId: item.id });
        }

        // Map object type to expected frontend type
        let activityType: string;
        switch (item.objectType) {
          case 'TASK': activityType = 'task'; break;
          case 'NOTE': activityType = 'note'; break;
          case 'THREAD': activityType = 'thread'; break;
          case 'MESSAGE': activityType = 'message'; break;
          default: activityType = 'task';
        }
        
        // Get activity action from type
        let action: string;
        switch (item.type) {
          case 'TASK_CREATED': action = 'created'; break;
          case 'TASK_COMPLETED': action = 'completed'; break;
          case 'TASK_ASSIGNED': action = 'assigned'; break;
          case 'NOTE_CREATED': action = 'created'; break;
          case 'NOTE_UPDATED': action = 'updated'; break;
          case 'THREAD_CREATED': action = 'started'; break;
          case 'MESSAGE_SENT': action = 'sent'; break;
          default: action = 'updated';
        }

        // Return the mapped activity in the format expected by the frontend
        return {
          id: item.id,
          type: activityType,
          action: action,
          title: item.title || 'Untitled activity',
          description: itemData?.description || '',
          userId: item.userId,
          userName: itemData?.userName || 'Unknown User',
          userAvatar: itemData?.userAvatar || undefined,
          targetId: item.objectId,
          createdAt: item.createdAt.toISOString(),
          metadata: itemData
        };
      });

      this._logger.debug(`Activity mapped results: ${mappedItems.length} items mapped`);
      
      return {
        status: 200,
        items: mappedItems
      };
    } catch (error) {
      this._logger.error('Error getting company activity', { error, companyId });
      
      return {
        status: 500,
        error: 'Error retrieving activity stream',
        message: error instanceof Error ? error.message : 'Unknown error',
        items: []
      };
    }
  }
  
  /**
   * Record task activity
   * 
   * @param task Task data
   * @param type Activity type
   * @param userId User ID
   * @param companyId Company ID
   */
  async recordTaskActivity(task: { id: string; title: string; [key: string]: any }, type: ActivityType, userId: string, companyId: string) {
    try {
      // Create activity record
      await this.drizzleService.query(db => 
        db.insert(collaborationActivities).values({
          type,
          userId,
          companyId,
          objectId: task.id,
          objectType: 'TASK',
          title: task.title,
          data: JSON.stringify(task)
        })
      );
      
      return true;
    } catch (error) {
      this._logger.error('Error recording task activity', { error, type, taskId: task.id });
      return false;
    }
  }
  
  /**
   * Record note activity
   * 
   * @param note Note data
   * @param type Activity type
   * @param userId User ID
   * @param companyId Company ID
   */
  async recordNoteActivity(note: { id: string; title?: string; [key: string]: any }, type: ActivityType, userId: string, companyId: string) {
    try {
      // Create activity record
      await this.drizzleService.query(db => 
        db.insert(collaborationActivities).values({
          type,
          userId,
          companyId,
          objectId: note.id,
          objectType: 'NOTE',
          title: note.title || 'Untitled Note',
          data: JSON.stringify(note)
        })
      );
      
      return true;
    } catch (error) {
      this._logger.error('Error recording note activity', { error, type, noteId: note.id });
      return false;
    }
  }
  
  /**
   * Record thread activity
   * 
   * @param thread Thread data
   * @param type Activity type
   * @param userId User ID
   * @param companyId Company ID
   */
  async recordThreadActivity(thread: { id: string; title?: string; [key: string]: any }, type: ActivityType, userId: string, companyId: string) {
    try {
      // Create activity record
      await this.drizzleService.query(db => 
        db.insert(collaborationActivities).values({
          type,
          userId,
          companyId,
          objectId: thread.id,
          objectType: 'THREAD',
          title: thread.title || 'Untitled Thread',
          data: JSON.stringify(thread)
        })
      );
      
      return true;
    } catch (error) {
      this._logger.error('Error recording thread activity', { error, type, threadId: thread.id });
      return false;
    }
  }
  
  /**
   * Record message activity
   * 
   * @param message Message data
   * @param type Activity type
   * @param userId User ID
   * @param companyId Company ID
   */
  async recordMessageActivity(message: { id: string; content?: string; [key: string]: any }, type: ActivityType, userId: string, companyId: string) {
    try {
      // Create activity record
      await this.drizzleService.query(db => 
        db.insert(collaborationActivities).values({
          type,
          userId,
          companyId,
          objectId: message.id,
          objectType: 'MESSAGE',
          title: message.content?.substring(0, 50) || 'New Message',
          data: JSON.stringify(message)
        })
      );
      
      return true;
    } catch (error) {
      this._logger.error('Error recording message activity', { error, type, messageId: message.id });
      return false;
    }
  }
  
  /**
   * Count activities for a company
   * 
   * @param companyId Company ID
   * @returns Count of activities
   */
  async countActivities(companyId: string) {
    try {
      const result = await this.drizzleService.query(db => 
        db.select({ count: count() })
          .from(collaborationActivities)
          .where(eq(collaborationActivities.companyId, companyId))
      );
        
      return {
        count: result[0]?.count || 0,
        companyId
      };
    } catch (error) {
      this._logger.error('Error counting activities', { error, companyId });
      return {
        error: 'Failed to count activities',
        count: 0,
        companyId
      };
    }
  }
}