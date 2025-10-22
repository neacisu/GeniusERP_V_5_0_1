/**
 * Message Drizzle Service
 * 
 * Refactored service for managing thread messages in the Collaboration module
 * using BaseDrizzleService for database operations with enhanced error handling
 * and comprehensive logging.
 */

import { BaseDrizzleService } from '../core/base-drizzle.service';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  collaborationMessages,
  NewCollaborationMessage,
  CollaborationMessage
} from '@geniuserp/shared';
import { randomUUID } from 'crypto';
import { Logger } from '../../../../common/logger';
import { ThreadDrizzleService } from './thread-service';

// Create a logger instance for the message service
const logger = new Logger('MessageDrizzleService');

/**
 * Message Service Class
 * 
 * Manages messages in discussion threads using DrizzleService.
 */
export class MessageDrizzleService extends BaseDrizzleService {
  private threadService: ThreadDrizzleService;
  
  /**
   * Constructor initializes the thread service dependency
   */
  constructor() {
    super();
    this.threadService = new ThreadDrizzleService();
  }
  
  /**
   * Create a new message in a thread
   * 
   * @param message Message data
   * @param userId User ID creating the message
   * @returns Created message
   */
  async createMessage(message: NewCollaborationMessage, userId: string): Promise<CollaborationMessage> {
    const context = 'createMessage';
    try {
      logger.debug(`[${context}] Creating new message for thread ${message.threadId} by user ${userId}`);
      
      const messageId = message.id || randomUUID();
      const now = new Date();
      
      return await this.transaction(async (tx) => {
        // Create the message
        const createdMessages = await tx.insert(collaborationMessages)
          .values({
            ...message,
            id: messageId,
            userId,
            createdAt: now,
            updatedAt: now
          })
          .returning();
        
        if (createdMessages.length === 0) {
          const error = new Error('Failed to create message');
          logger.error(`[${context}] ${error.message} for thread ${message.threadId}`);
          throw error;
        }
        
        // Update thread's last message timestamp
        await this.threadService.updateLastMessageTimestamp(message.threadId, message.companyId);
        
        logger.info(`[${context}] Message created successfully with ID ${messageId} for thread ${message.threadId}`);
        return createdMessages[0];
      });
    } catch (error) {
      logger.error(`[${context}] Error creating message for thread ${message.threadId}: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Message details: ${JSON.stringify({ ...message, content: message.content?.substring(0, 50) + '...' })}`);
      throw error;
    }
  }
  
  /**
   * Get a message by ID
   * 
   * @param messageId Message ID
   * @param companyId Company ID
   * @returns Message or null if not found
   */
  async getMessageById(messageId: string, companyId: string): Promise<CollaborationMessage | null> {
    const context = 'getMessageById';
    try {
      logger.debug(`[${context}] Fetching message ${messageId} for company ${companyId}`);
      
      return await this.query(async (db) => {
        const messages = await db.select()
          .from(collaborationMessages)
          .where(and(
            eq(collaborationMessages.id, messageId),
            eq(collaborationMessages.companyId, companyId)
          ));
        
        const message = messages.length > 0 ? messages[0] : null;
        
        if (message) {
          logger.info(`[${context}] Found message ${messageId} for company ${companyId}`);
        } else {
          logger.info(`[${context}] Message ${messageId} not found for company ${companyId}`);
        }
        
        return message;
      });
    } catch (error) {
      logger.error(`[${context}] Error fetching message ${messageId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get all messages for a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @param options Query options (limit, offset, sort)
   * @returns List of messages
   */
  async getMessagesByThreadId(threadId: string, companyId: string, options: {
    limit?: number;
    offset?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ messages: CollaborationMessage[]; total: number }> {
    const context = 'getMessagesByThreadId';
    try {
      const {
        limit = 50,
        offset = 0,
        sortOrder = 'asc' // Default to oldest first
      } = options;
      
      logger.debug(`[${context}] Fetching messages for thread ${threadId} in company ${companyId} with options: ${JSON.stringify(options)}`);
      
      return await this.query(async (db) => {
        // Build the where condition
        const whereCondition = and(
          eq(collaborationMessages.threadId, threadId),
          eq(collaborationMessages.companyId, companyId)
        );
        
        // Execute the query with the appropriate ordering
        const messagesResult = sortOrder === 'asc' 
          ? await db.select().from(collaborationMessages)
              .where(whereCondition)
              .orderBy(collaborationMessages.createdAt)
              .limit(limit)
              .offset(offset)
          : await db.select().from(collaborationMessages)
              .where(whereCondition)
              .orderBy(desc(collaborationMessages.createdAt))
              .limit(limit)
              .offset(offset);
        
        // Count total matching records
        const totalResult = await db.select({ 
            count: sql`count(*)` 
          })
          .from(collaborationMessages)
          .where(whereCondition);
        
        const total = Number(totalResult[0]?.count || 0);
        
        logger.info(`[${context}] Found ${messagesResult.length} messages for thread ${threadId}, total: ${total}`);
        
        return { 
          messages: messagesResult, 
          total 
        };
      });
    } catch (error) {
      logger.error(`[${context}] Error fetching messages for thread ${threadId} in company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update a message
   * 
   * @param messageId Message ID
   * @param companyId Company ID
   * @param updates Message updates
   * @param userId User ID making the update
   * @returns Updated message
   */
  async updateMessage(
    messageId: string,
    companyId: string,
    updates: Partial<NewCollaborationMessage>,
    userId: string
  ): Promise<CollaborationMessage> {
    const context = 'updateMessage';
    try {
      logger.debug(`[${context}] Updating message ${messageId} for company ${companyId} by user ${userId}`);
      
      return await this.query(async (db) => {
        const updatedMessages = await db.update(collaborationMessages)
          .set({
            ...updates,
            isEdited: true,
            updatedAt: new Date(),
            editedBy: userId
          })
          .where(and(
            eq(collaborationMessages.id, messageId),
            eq(collaborationMessages.companyId, companyId)
          ))
          .returning();
        
        if (updatedMessages.length === 0) {
          const error = new Error(`Message not found: ${messageId}`);
          logger.error(`[${context}] ${error.message} for company ${companyId}`);
          throw error;
        }
        
        logger.info(`[${context}] Message ${messageId} updated successfully by user ${userId}`);
        return updatedMessages[0];
      });
    } catch (error) {
      logger.error(`[${context}] Error updating message ${messageId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
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
  async deleteMessage(messageId: string, companyId: string): Promise<boolean> {
    const context = 'deleteMessage';
    try {
      logger.debug(`[${context}] Deleting message ${messageId} for company ${companyId}`);
      
      return await this.query(async (db) => {
        const result = await db.delete(collaborationMessages)
          .where(and(
            eq(collaborationMessages.id, messageId),
            eq(collaborationMessages.companyId, companyId)
          ))
          .returning();
        
        const deleted = result.length > 0;
        
        if (deleted) {
          logger.info(`[${context}] Message ${messageId} deleted successfully for company ${companyId}`);
        } else {
          logger.info(`[${context}] No message with ID ${messageId} found to delete for company ${companyId}`);
        }
        
        return deleted;
      });
    } catch (error) {
      logger.error(`[${context}] Error deleting message ${messageId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get replies to a specific message
   * 
   * @param messageId Message ID to find replies for
   * @param companyId Company ID
   * @returns List of reply messages
   */
  async getReplies(messageId: string, companyId: string): Promise<CollaborationMessage[]> {
    const context = 'getReplies';
    try {
      logger.debug(`[${context}] Fetching replies for message ${messageId} in company ${companyId}`);
      
      return await this.query(async (db) => {
        const replies = await db.select()
          .from(collaborationMessages)
          .where(and(
            eq(collaborationMessages.replyToId, messageId),
            eq(collaborationMessages.companyId, companyId)
          ))
          .orderBy(collaborationMessages.createdAt);
        
        logger.info(`[${context}] Found ${replies.length} replies for message ${messageId} in company ${companyId}`);
        
        return replies;
      });
    } catch (error) {
      logger.error(`[${context}] Error fetching replies for message ${messageId} in company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}