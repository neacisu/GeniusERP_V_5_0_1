/**
 * Notification Service
 * 
 * Service for managing collaboration notifications.
 */

import { eq, and, desc, or, SQL, sql } from 'drizzle-orm';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { Logger } from '../../../common/logger';
import { collaborationNotifications } from '../../../../shared/schema/collaboration.schema';

/**
 * Notification status types
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
  DISMISSED = 'DISMISSED'
}

/**
 * Notification query options interface
 */
export interface NotificationQueryOptions {
  limit?: number;
  offset?: number;
  status?: NotificationStatus | NotificationStatus[];
  onlyUnread?: boolean;
}

/**
 * Notification Service Class
 * 
 * Manages notification operations
 */
export class NotificationService {
  private _logger: Logger;
  
  /**
   * Constructor
   * 
   * @param drizzleService Drizzle ORM service
   */
  constructor(private drizzleService: DrizzleService) {
    this._logger = new Logger('NotificationService');
  }
  
  /**
   * Get notifications for a user
   * 
   * @param userId User ID
   * @param companyId Company ID
   * @param options Query options
   * @returns List of notifications
   */
  async getNotifications(userId: string, companyId: string, options: NotificationQueryOptions = {}) {
    try {
      const { limit = 20, offset = 0, status, onlyUnread = false } = options;
      
      // Basic conditions
      let whereConditions = and(
        eq(collaborationNotifications.userId, userId),
        eq(collaborationNotifications.companyId, companyId)
      );
      
      // Add status filter if provided
      if (status) {
        if (Array.isArray(status)) {
          // Multiple statuses
          const statusConditions = status.map(s => eq(collaborationNotifications.status, s));
          whereConditions = and(whereConditions, or(...statusConditions));
        } else {
          // Single status
          whereConditions = and(whereConditions, eq(collaborationNotifications.status, status));
        }
      } else if (onlyUnread) {
        // Show only unread if specifically requested
        whereConditions = and(whereConditions, eq(collaborationNotifications.status, NotificationStatus.UNREAD));
      }
      
      // Get notifications from database
      const userNotifications = await this.drizzleService.query(db => db
        .select()
        .from(collaborationNotifications)
        .where(whereConditions)
        .orderBy(desc(collaborationNotifications.createdAt))
        .limit(limit)
        .offset(offset)
      );
      
      // Get unread count
      const unreadCount = await this.drizzleService.query(db => db
        .select({ count: sql`count(*)` })
        .from(collaborationNotifications)
        .where(
          and(
            eq(collaborationNotifications.userId, userId),
            eq(collaborationNotifications.companyId, companyId),
            eq(collaborationNotifications.status, NotificationStatus.UNREAD)
          )
        )
      );
      
      // Map notifications to format expected by frontend
      const mappedNotifications = (userNotifications || []).map((notification: any) => {
        // Parse metadata if exists
        let metadata: Record<string, any> = {};
        try {
          if (notification.metadata) {
            metadata = typeof notification.metadata === 'string'
              ? JSON.parse(notification.metadata)
              : notification.metadata;
          }
        } catch (e) {
          this._logger.error('Error parsing notification metadata', {
            error: e,
            notificationId: notification.id
          });
        }

        // Map notification status to isRead flag
        const isRead = notification.status !== NotificationStatus.UNREAD;

        // Map server-side notification type to frontend notification type
        let frontendType: string = 'task_assigned'; // Default
        switch (notification.type) {
          case 'TASK_ASSIGNED':
            frontendType = 'task_assigned';
            break;
          case 'TASK_COMPLETED':
            frontendType = 'task_completed';
            break;
          case 'MENTION':
            frontendType = 'mention';
            break;
          case 'THREAD_REPLY':
            frontendType = 'thread_reply';
            break;
          case 'NOTE_CREATED':
            frontendType = 'note_created';
            break;
          case 'TASK_DUE_SOON':
            frontendType = 'task_due_soon';
            break;
          case 'TASK_OVERDUE':
            frontendType = 'task_overdue';
            break;
          default:
            frontendType = notification.type?.toLowerCase() || 'task_assigned';
        }

        // Map source_type to targetType
        const targetType = notification.sourceType?.toLowerCase() || 'task';

        // Extract sender info from metadata safely
        const senderId = metadata.senderId || null;
        const senderName = metadata.senderName || 'Unknown User';
        const senderAvatar = metadata.senderAvatar || null;

        return {
          id: notification.id,
          userId: notification.userId,
          type: frontendType,
          title: notification.title,
          message: notification.message,
          isRead: isRead,
          targetType: targetType,
          targetId: notification.sourceId || '',
          metadata: {
            ...metadata,
            // Add sender info if available
            sender: senderId,
            senderName: senderName,
            senderAvatar: senderAvatar
          },
          createdAt: notification.createdAt.toISOString()
        };
      });

      // Return formatted response
      return {
        status: 200,
        unreadCount: unreadCount[0]?.count || 0,
        items: mappedNotifications
      };
    } catch (error) {
      this._logger.error('Error getting notifications', { error, userId, companyId });
      
      return {
        status: 500,
        error: 'Error retrieving notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
        unreadCount: 0,
        items: []
      };
    }
  }
  
  /**
   * Mark a notification as read
   * 
   * @param id Notification ID
   * @param userId User ID
   * @returns Success status
   */
  async markAsRead(id: string, userId: string) {
    try {
      await this.drizzleService.query(db => db
        .update(collaborationNotifications)
        .set({ status: NotificationStatus.READ, updatedAt: new Date() })
        .where(
          and(
            eq(collaborationNotifications.id, id),
            eq(collaborationNotifications.userId, userId)
          )
        )
      );
      
      return { status: 200, success: true };
    } catch (error) {
      this._logger.error('Error marking notification as read', { error, id, userId });
      
      return {
        status: 500,
        success: false,
        error: 'Failed to update notification',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Create a new notification
   * 
   * @param data Notification data
   * @returns Created notification
   */
  async createNotification(data: {
    userId: string;
    companyId: string;
    type: string;
    title: string;
    message: string;
    sourceType?: string;
    sourceId?: string;
    actionType?: string;
    actionTarget?: string;
  }) {
    try {
      const result = await this.drizzleService.query(db => db
        .insert(collaborationNotifications)
        .values({
          ...data,
          status: NotificationStatus.UNREAD
        })
        .returning()
      );
      
      return { status: 201, notification: result[0] };
    } catch (error) {
      this._logger.error('Error creating notification', { error, data });
      
      return {
        status: 500,
        error: 'Failed to create notification',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Create a notification for a watched task update
   * 
   * @param watchedTask Watched task data
   * @param updaterUserId User ID who updated the task
   * @returns Success status
   */
  async createWatchedTaskNotification(wt: { 
    userId: string; 
    companyId: string;
    taskId: string;
    taskTitle: string;
    [key: string]: any;
  }, updaterUserId: string) {
    try {
      // Don't notify the updater
      if (wt.userId === updaterUserId) {
        return { status: 200, skipped: true };
      }
      
      // Create notification
      await this.createNotification({
        userId: wt.userId,
        companyId: wt.companyId,
        type: 'TASK_UPDATED',
        title: 'Task Updated',
        message: `A task you're watching has been updated: ${wt.taskTitle}`,
        sourceType: 'TASK',
        sourceId: wt.taskId,
        actionType: 'VIEW_TASK',
        actionTarget: wt.taskId
      });
      
      return { status: 201, success: true };
    } catch (error) {
      this._logger.error('Error creating watched task notification', { 
        error, 
        taskId: wt.taskId, 
        userId: wt.userId 
      });
      
      return {
        status: 500,
        success: false,
        error: 'Failed to create notification',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}