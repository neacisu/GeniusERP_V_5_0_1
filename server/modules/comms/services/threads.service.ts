/**
 * Threads Service
 * 
 * This service handles message thread operations including creating, updating,
 * retrieving, and deleting threads.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, count } from 'drizzle-orm';
import { 
  messageThreads,
  messages,
  CommunicationChannel,
  MessageStatus
} from '../../../../shared/schema/communications.schema';
import { Logger } from '../../../common/logger';

// Create a logger for thread operations
const logger = new Logger('ThreadsService');

/**
 * Service for managing communication threads
 */
export class ThreadsService {
  constructor(private db: PostgresJsDatabase) {}

  /**
   * Create a new message thread
   * 
   * @param companyId The company ID
   * @param data Thread data
   * @returns The created thread
   */
  async createThread(companyId: string, data: {
    subject?: string;
    channel: CommunicationChannel;
    externalThreadId?: string;
    status?: MessageStatus;
    assignedTo?: string;
    customerId?: string;
    contactId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      logger.info(`Creating new thread for company ${companyId}`);
      
      const [thread] = await this.db.insert(messageThreads).values({
        companyId,
        subject: data.subject,
        channel: data.channel,
        externalThreadId: data.externalThreadId,
        status: data.status || MessageStatus.NEW,
        lastMessageAt: new Date(),
        assignedTo: data.assignedTo,
        customerId: data.customerId,
        contactId: data.contactId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : '{}'
      }).returning();
      
      return thread;
    } catch (error) {
      logger.error(`Failed to create thread for company ${companyId}`, error);
      throw new Error(`Failed to create thread: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a thread by ID
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @returns The thread
   */
  async getThreadById(threadId: string, companyId: string) {
    try {
      const threads = await this.db.select()
        .from(messageThreads)
        .where(
          and(
            eq(messageThreads.id, threadId),
            eq(messageThreads.companyId, companyId)
          )
        );
      
      if (threads.length === 0) {
        return null;
      }
      
      return threads[0];
    } catch (error) {
      logger.error(`Failed to get thread ${threadId}`, error);
      throw new Error(`Failed to get thread: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get threads for a company with message count
   * 
   * @param companyId Company ID
   * @param filter Filter options
   * @returns Array of threads with message count
   */
  async getThreadsWithMessageCount(companyId: string, filter?: {
    channel?: CommunicationChannel;
    status?: MessageStatus;
    assignedTo?: string;
    customerId?: string;
    contactId?: string;
  }) {
    try {
      // Start building the query
      let query = this.db.select({
        thread: messageThreads,
        messageCount: count(messages.id)
      })
        .from(messageThreads)
        .leftJoin(messages, eq(messageThreads.id, messages.threadId))
        .where(eq(messageThreads.companyId, companyId))
        .groupBy(messageThreads.id);
      
      // Apply filters if provided
      if (filter) {
        if (filter.channel) {
          query = query.where(eq(messageThreads.channel, filter.channel));
        }
        
        if (filter.status) {
          query = query.where(eq(messageThreads.status, filter.status));
        }
        
        if (filter.assignedTo) {
          query = query.where(eq(messageThreads.assignedTo, filter.assignedTo));
        }
        
        if (filter.customerId) {
          query = query.where(eq(messageThreads.customerId, filter.customerId));
        }
        
        if (filter.contactId) {
          query = query.where(eq(messageThreads.contactId, filter.contactId));
        }
      }
      
      // Execute the query and order by most recent message
      const result = await query.orderBy(desc(messageThreads.lastMessageAt));
      
      // Transform the result to a more usable format
      return result.map(item => ({
        ...item.thread,
        messageCount: Number(item.messageCount)
      }));
    } catch (error) {
      logger.error(`Failed to get threads for company ${companyId}`, error);
      throw new Error(`Failed to get threads: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @param data Update data
   * @returns The updated thread
   */
  async updateThread(threadId: string, companyId: string, data: {
    subject?: string;
    status?: MessageStatus;
    assignedTo?: string;
    customerId?: string;
    contactId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      logger.info(`Updating thread ${threadId}`);
      
      // Prepare update data
      const updateData: any = {};
      
      if (data.subject !== undefined) {
        updateData.subject = data.subject;
      }
      
      if (data.status !== undefined) {
        updateData.status = data.status;
      }
      
      if (data.assignedTo !== undefined) {
        updateData.assignedTo = data.assignedTo;
      }
      
      if (data.customerId !== undefined) {
        updateData.customerId = data.customerId;
      }
      
      if (data.contactId !== undefined) {
        updateData.contactId = data.contactId;
      }
      
      if (data.metadata !== undefined) {
        updateData.metadata = JSON.stringify(data.metadata);
      }
      
      // Add updated timestamp
      updateData.updatedAt = new Date();
      
      // Perform the update
      const [updatedThread] = await this.db.update(messageThreads)
        .set(updateData)
        .where(
          and(
            eq(messageThreads.id, threadId),
            eq(messageThreads.companyId, companyId)
          )
        )
        .returning();
      
      return updatedThread;
    } catch (error) {
      logger.error(`Failed to update thread ${threadId}`, error);
      throw new Error(`Failed to update thread: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a thread and all its messages
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @returns True if deleted
   */
  async deleteThread(threadId: string, companyId: string) {
    try {
      logger.info(`Deleting thread ${threadId}`);
      
      // First delete all messages in the thread
      await this.db.delete(messages)
        .where(
          and(
            eq(messages.threadId, threadId),
            eq(messages.companyId, companyId)
          )
        );
      
      // Then delete the thread itself
      const result = await this.db.delete(messageThreads)
        .where(
          and(
            eq(messageThreads.id, threadId),
            eq(messageThreads.companyId, companyId)
          )
        );
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error(`Failed to delete thread ${threadId}`, error);
      throw new Error(`Failed to delete thread: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update the last message timestamp for a thread
   * 
   * @param threadId Thread ID
   * @param timestamp Timestamp to set
   */
  async updateLastMessageTimestamp(threadId: string, timestamp: Date = new Date()) {
    try {
      await this.db.update(messageThreads)
        .set({
          lastMessageAt: timestamp,
          updatedAt: new Date()
        })
        .where(eq(messageThreads.id, threadId));
    } catch (error) {
      logger.error(`Failed to update last message timestamp for thread ${threadId}`, error);
      // We don't throw here as this is a background update
    }
  }
}