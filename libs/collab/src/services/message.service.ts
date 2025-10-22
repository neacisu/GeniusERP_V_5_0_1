/**
 * Message Service
 * 
 * Service for managing thread messages in the Collaboration module.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  collaborationMessages,
  NewCollaborationMessage,
  CollaborationMessage
} from '../../../../shared/schema/collaboration.schema';
import { randomUUID } from 'crypto';
import { Logger } from "@common/logger";

// Create a logger instance for the message service
const logger = new Logger('MessageService');
import { ThreadService } from './thread.service';

/**
 * Message Service Class
 * 
 * Manages messages in discussion threads.
 */
export class MessageService {
  private threadService: ThreadService;
  
  /**
   * Constructor
   * 
   * @param db Drizzle database instance
   */
  constructor(private db: PostgresJsDatabase<any>) {
    this.threadService = new ThreadService(db);
  }
  
  /**
   * Create a new message in a thread
   * 
   * @param message Message data
   * @param userId User ID creating the message
   * @returns Created message
   */
  async createMessage(message: NewCollaborationMessage, userId: string): Promise<CollaborationMessage> {
    try {
      const messageId = message.id || randomUUID();
      const now = new Date();
      
      // Create the message
      const createdMessages = await this.db.insert(collaborationMessages)
        .values({
          ...message,
          id: messageId,
          userId,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      if (createdMessages.length === 0) {
        throw new Error('Failed to create message');
      }
      
      // Update thread's last message timestamp
      await this.threadService.updateLastMessageTimestamp(message.threadId, message.companyId);
      
      return createdMessages[0];
    } catch (error) {
      logger.error(`Error creating message: ${error instanceof Error ? error.message : String(error)}`);
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
    try {
      const messages = await this.db.select()
        .from(collaborationMessages)
        .where(and(
          eq(collaborationMessages.id, messageId),
          eq(collaborationMessages.companyId, companyId)
        ));
      
      return messages.length > 0 ? messages[0] : null;
    } catch (error) {
      logger.error(`Error fetching message ${messageId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
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
    try {
      const {
        limit = 50,
        offset = 0,
        sortOrder = 'asc' // Default to oldest first
      } = options;
      
      // Build the where condition
      const whereCondition = and(
        eq(collaborationMessages.threadId, threadId),
        eq(collaborationMessages.companyId, companyId)
      );
      
      // Execute the query with the appropriate ordering
      const messagesResult = sortOrder === 'asc' 
        ? await this.db.select().from(collaborationMessages)
            .where(whereCondition)
            .orderBy(collaborationMessages.createdAt)
            .limit(limit)
            .offset(offset)
        : await this.db.select().from(collaborationMessages)
            .where(whereCondition)
            .orderBy(desc(collaborationMessages.createdAt))
            .limit(limit)
            .offset(offset);
      
      // Count total matching records
      const totalResult = await this.db.select({ 
          count: sql`count(*)` 
        })
        .from(collaborationMessages)
        .where(whereCondition);
      
      const total = Number(totalResult[0]?.count || 0);
      
      return { 
        messages: messagesResult, 
        total 
      };
    } catch (error) {
      logger.error(`Error fetching messages for thread ${threadId} in company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
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
    try {
      const updatedMessages = await this.db.update(collaborationMessages)
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
        throw new Error(`Message not found: ${messageId}`);
      }
      
      return updatedMessages[0];
    } catch (error) {
      logger.error(`Error updating message ${messageId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
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
    try {
      const result = await this.db.delete(collaborationMessages)
        .where(and(
          eq(collaborationMessages.id, messageId),
          eq(collaborationMessages.companyId, companyId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error(`Error deleting message ${messageId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
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
    try {
      return await this.db.select()
        .from(collaborationMessages)
        .where(and(
          eq(collaborationMessages.replyToId, messageId),
          eq(collaborationMessages.companyId, companyId)
        ))
        .orderBy(collaborationMessages.createdAt);
    } catch (error) {
      logger.error(`Error fetching replies for message ${messageId} in company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}