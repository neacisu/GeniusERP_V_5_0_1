/**
 * Messages Service
 * 
 * This service handles message operations including creating, updating,
 * retrieving, and deleting messages within threads.
 */

import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import { 
  messages, 
  messageThreads,
  CommunicationChannel, 
  MessageDirection, 
  MessageStatus,
  SentimentType
} from '../../../../shared/schema/communications.schema';
import { Logger } from '../../../common/logger';
import { ThreadsService } from './threads.service';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';

// Create a logger for message operations
const logger = new Logger('MessagesService');

/**
 * Service for managing communication messages
 */
export class MessagesService {
  private threadsService: ThreadsService;

  constructor(private drizzleService: DrizzleService) {
    this.threadsService = new ThreadsService(drizzleService.db);
  }

  /**
   * Create a new message in a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @param data Message data
   * @returns The created message
   */
  async createMessage(threadId: string, companyId: string, data: {
    channel: CommunicationChannel;
    direction: MessageDirection;
    status?: MessageStatus;
    fromEmail?: string;
    fromName?: string;
    fromPhone?: string;
    toEmail?: string;
    toName?: string;
    toPhone?: string;
    subject?: string;
    body: string;
    bodyHtml?: string;
    sentiment?: SentimentType;
    sentimentScore?: number;
    externalMessageId?: string;
    externalConversationId?: string;
    isFlagged?: boolean;
    metadata?: Record<string, any>;
    createdBy?: string;
  }) {
    try {
      logger.info(`Creating message in thread ${threadId} for company ${companyId}`);
      
      return await this.drizzleService.transaction(async (tx) => {
        // Create the message
        const [message] = await tx.insert(messages).values({
          threadId,
          companyId,
          channel: data.channel,
          direction: data.direction,
          status: data.status || MessageStatus.NEW,
          fromEmail: data.fromEmail,
          fromName: data.fromName,
          fromPhone: data.fromPhone,
          toEmail: data.toEmail,
          toName: data.toName,
          toPhone: data.toPhone,
          subject: data.subject,
          body: data.body,
          bodyHtml: data.bodyHtml,
          sentiment: data.sentiment,
          sentimentScore: data.sentimentScore,
          externalMessageId: data.externalMessageId,
          externalConversationId: data.externalConversationId,
          isFlagged: data.isFlagged || false,
          metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
          createdBy: data.createdBy
        }).returning();
        
        // Update the thread's last message timestamp
        await this.threadsService.updateLastMessageTimestamp(threadId);
        
        return message;
      });
    } catch (error) {
      logger.error(`Failed to create message in thread ${threadId}`, error);
      throw new Error(`Failed to create message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get messages for a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @param filter Filter options
   * @returns Array of messages
   */
  async getThreadMessages(threadId: string, companyId: string, filter?: {
    direction?: MessageDirection;
    status?: MessageStatus;
    limit?: number;
    offset?: number;
  }) {
    try {
      return await this.drizzleService.transaction(async (db) => {
        // Start building the query
        let query = db.select()
          .from(messages)
          .where(
            and(
              eq(messages.threadId, threadId),
              eq(messages.companyId, companyId)
            )
          );
        
        // Apply filters if provided
        if (filter) {
          if (filter.direction) {
            query = query.where(eq(messages.direction, filter.direction));
          }
          
          if (filter.status) {
            query = query.where(eq(messages.status, filter.status));
          }
        }
        
        // Add ordering, limit and offset
        query = query.orderBy(desc(messages.createdAt));
        
        if (filter?.limit) {
          query = query.limit(filter.limit);
        }
        
        if (filter?.offset) {
          query = query.offset(filter.offset);
        }
        
        // Execute the query
        return await query;
      });
    } catch (error) {
      logger.error(`Failed to get messages for thread ${threadId}`, error);
      throw new Error(`Failed to get thread messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a message by ID
   * 
   * @param messageId Message ID
   * @param companyId Company ID
   * @returns The message
   */
  async getMessageById(messageId: string, companyId: string) {
    try {
      return await this.drizzleService.transaction(async (db) => {
        const result = await db.select()
          .from(messages)
          .where(
            and(
              eq(messages.id, messageId),
              eq(messages.companyId, companyId)
            )
          );
        
        if (result.length === 0) {
          return null;
        }
        
        return result[0];
      });
    } catch (error) {
      logger.error(`Failed to get message ${messageId}`, error);
      throw new Error(`Failed to get message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update a message
   * 
   * @param messageId Message ID
   * @param companyId Company ID
   * @param data Update data
   * @returns The updated message
   */
  async updateMessage(messageId: string, companyId: string, data: {
    status?: MessageStatus;
    sentiment?: SentimentType;
    sentimentScore?: number;
    isFlagged?: boolean;
    readAt?: Date;
    deliveredAt?: Date;
    metadata?: Record<string, any>;
    updatedBy?: string;
  }) {
    try {
      logger.info(`Updating message ${messageId}`);
      
      return await this.drizzleService.transaction(async (db) => {
        // Prepare update data
        const updateData: any = {};
        
        if (data.status !== undefined) {
          updateData.status = data.status;
        }
        
        if (data.sentiment !== undefined) {
          updateData.sentiment = data.sentiment;
        }
        
        if (data.sentimentScore !== undefined) {
          updateData.sentimentScore = data.sentimentScore;
        }
        
        if (data.isFlagged !== undefined) {
          updateData.isFlagged = data.isFlagged;
        }
        
        if (data.readAt !== undefined) {
          updateData.readAt = data.readAt;
        }
        
        if (data.deliveredAt !== undefined) {
          updateData.deliveredAt = data.deliveredAt;
        }
        
        if (data.metadata !== undefined) {
          updateData.metadata = JSON.stringify(data.metadata);
        }
        
        if (data.updatedBy !== undefined) {
          updateData.updatedBy = data.updatedBy;
        }
        
        // Add updated timestamp
        updateData.updatedAt = new Date();
        
        // Perform the update
        const [updatedMessage] = await db.update(messages)
          .set(updateData)
          .where(
            and(
              eq(messages.id, messageId),
              eq(messages.companyId, companyId)
            )
          )
          .returning();
        
        return updatedMessage;
      });
    } catch (error) {
      logger.error(`Failed to update message ${messageId}`, error);
      throw new Error(`Failed to update message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Mark a message as read
   * 
   * @param messageId Message ID
   * @param companyId Company ID
   * @param userId User ID who read the message
   * @returns The updated message
   */
  async markMessageAsRead(messageId: string, companyId: string, userId: string) {
    try {
      return await this.updateMessage(messageId, companyId, {
        status: MessageStatus.READ,
        readAt: new Date(),
        updatedBy: userId
      });
    } catch (error) {
      logger.error(`Failed to mark message ${messageId} as read`, error);
      throw error;
    }
  }

  /**
   * Delete a message
   * 
   * @param messageId Message ID
   * @param companyId Company ID
   * @returns True if deleted
   */
  async deleteMessage(messageId: string, companyId: string) {
    try {
      logger.info(`Deleting message ${messageId}`);
      
      return await this.drizzleService.transaction(async (db) => {
        const result = await db.delete(messages)
          .where(
            and(
              eq(messages.id, messageId),
              eq(messages.companyId, companyId)
            )
          );
        
        return result && result.length > 0;
      });
    } catch (error) {
      logger.error(`Failed to delete message ${messageId}`, error);
      throw new Error(`Failed to delete message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search messages across threads
   * 
   * @param companyId Company ID
   * @param query Search query
   * @returns Array of messages matching the search
   */
  async searchMessages(companyId: string, query: string) {
    try {
      return await this.drizzleService.transaction(async (db) => {
        // This is a simple implementation that can be enhanced with full-text search
        const result = await db.select({
          message: messages,
          thread: messageThreads
        })
          .from(messages)
          .leftJoin(messageThreads, eq(messages.threadId, messageThreads.id))
          .where(
            and(
              eq(messages.companyId, companyId),
              (
                // Search in subject or body
                db.sql`${messages.subject} ILIKE ${"%" + query + "%"} OR
                ${messages.body} ILIKE ${"%" + query + "%"} OR
                ${messages.fromName} ILIKE ${"%" + query + "%"} OR
                ${messages.fromEmail} ILIKE ${"%" + query + "%"}`
              )
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(50);
        
        // Transform the result to include thread information
        return result.map((item: any) => ({
          ...item.message,
          thread: item.thread
        }));
      });
    } catch (error) {
      logger.error(`Failed to search messages for company ${companyId}`, error);
      throw new Error(`Failed to search messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}