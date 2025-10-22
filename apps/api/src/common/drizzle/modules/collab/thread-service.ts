/**
 * Thread Drizzle Service
 * 
 * Refactored service for managing discussion threads in the Collaboration module
 * using BaseDrizzleService for database operations with enhanced error handling
 * and comprehensive logging.
 */

import { BaseDrizzleService } from '../core/base-drizzle.service';
import { eq, and, desc, sql, isNull, or, like } from 'drizzle-orm';
import {
  collaborationThreads,
  collaborationMessages,
  NewCollaborationThread,
  CollaborationThread
} from '@geniuserp/shared';
import { randomUUID } from 'crypto';
import { Logger } from '../../../../common/logger';

// Create a logger instance for the thread service
const logger = new Logger('ThreadDrizzleService');

/**
 * Thread Drizzle Service Class
 * 
 * Manages discussion threads for team collaboration using DrizzleService.
 */
export class ThreadDrizzleService extends BaseDrizzleService {
  /**
   * Create a new discussion thread
   * 
   * @param thread Thread data
   * @param userId User ID creating the thread
   * @returns Created thread
   */
  async createThread(thread: NewCollaborationThread, userId: string): Promise<CollaborationThread> {
    const context = 'createThread';
    try {
      logger.debug(`[${context}] Creating new thread "${thread.title}" by user ${userId}`);
      
      const threadId = thread.id || randomUUID();
      const now = new Date();
      
      return await this.query(async (db) => {
        // Create the thread
        const createdThreads = await db.insert(collaborationThreads)
          .values({
            ...thread,
            id: threadId,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            lastMessageAt: now
          })
          .returning();
        
        if (createdThreads.length === 0) {
          const error = new Error('Failed to create thread');
          logger.error(`[${context}] ${error.message} for title "${thread.title}"`);
          throw error;
        }
        
        logger.info(`[${context}] Thread ${threadId} created successfully with title "${thread.title}"`);
        return createdThreads[0];
      });
    } catch (error) {
      logger.error(`[${context}] Error creating thread: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Thread details: ${JSON.stringify({ ...thread, title: thread.title })}`);
      throw error;
    }
  }
  
  /**
   * Get a thread by ID
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @returns Thread or null if not found
   */
  async getThreadById(threadId: string, companyId: string): Promise<CollaborationThread | null> {
    const context = 'getThreadById';
    try {
      logger.debug(`[${context}] Fetching thread ${threadId} for company ${companyId}`);
      
      return await this.query(async (db) => {
        const threads = await db.select()
          .from(collaborationThreads)
          .where(and(
            eq(collaborationThreads.id, threadId),
            eq(collaborationThreads.companyId, companyId)
          ));
        
        const thread = threads.length > 0 ? threads[0] : null;
        
        if (thread) {
          logger.info(`[${context}] Found thread ${threadId} with title "${thread.title}"`);
        } else {
          logger.info(`[${context}] Thread ${threadId} not found for company ${companyId}`);
        }
        
        return thread;
      });
    } catch (error) {
      logger.error(`[${context}] Error fetching thread ${threadId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get threads for a company
   * 
   * @param companyId Company ID
   * @param options Query options (limit, offset, search, category)
   * @returns List of threads and total count
   */
  async getThreads(
    companyId: string, 
    options: {
      limit?: number;
      offset?: number;
      search?: string;
      category?: string;
      isPrivate?: boolean;
      isClosed?: boolean;
      sort?: 'newest' | 'oldest' | 'lastActivity';
      tags?: string[];
    } = {}
  ): Promise<{ threads: CollaborationThread[]; total: number }> {
    const context = 'getThreads';
    try {
      const {
        limit = 10,
        offset = 0,
        search,
        category,
        isPrivate,
        isClosed,
        sort = 'newest',
        tags = []
      } = options;
      
      logger.debug(`[${context}] Fetching threads for company ${companyId} with options: ${JSON.stringify(options)}`);
      
      return await this.query(async (db) => {
        // Build base conditions
        const conditions = [
          eq(collaborationThreads.companyId, companyId)
        ];
        
        // Add search condition if provided
        if (search) {
          const searchCondition = or(
            like(collaborationThreads.title, `%${search}%`),
            like(collaborationThreads.description, `%${search}%`)
          );
          if (searchCondition) {
            conditions.push(searchCondition);
          }
        }
        
        // Add category filter if provided
        if (category) {
          conditions.push(eq(collaborationThreads.category, category));
        }
        
        // Add visibility filter if provided
        if (isPrivate !== undefined) {
          conditions.push(eq(collaborationThreads.isPrivate, isPrivate));
        }
        
        // Add closed status filter if provided
        if (isClosed !== undefined) {
          conditions.push(eq(collaborationThreads.isClosed, isClosed));
        }
        
        // Build the combined WHERE condition
        const whereCondition = and(...conditions);
        
        // Apply appropriate sorting
        let orderByClause;
        switch (sort) {
          case 'newest':
            orderByClause = desc(collaborationThreads.createdAt);
            break;
          case 'oldest':
            orderByClause = collaborationThreads.createdAt;
            break;
          case 'lastActivity':
            orderByClause = desc(collaborationThreads.lastMessageAt);
            break;
          default:
            orderByClause = desc(collaborationThreads.createdAt);
        }
        
        // Execute the query
        const threadsResult = await db.select()
          .from(collaborationThreads)
          .where(whereCondition)
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset);
        
        // Filter by tags if provided (done after query since arrays require post-processing)
        let filteredThreads = threadsResult;
        if (tags.length > 0) {
          filteredThreads = threadsResult.filter(thread => {
            const threadTags = (thread.tags as string[]) || [];
            return tags.some(tag => threadTags.includes(tag));
          });
        }
        
        // Count total matching records
        const totalResult = await db.select({ 
            count: sql`count(*)` 
          })
          .from(collaborationThreads)
          .where(whereCondition);
        
        const total = Number(totalResult[0]?.count || 0);
        
        logger.info(`[${context}] Found ${filteredThreads.length} threads for company ${companyId}, total: ${total}`);
        
        return { 
          threads: filteredThreads, 
          total 
        };
      });
    } catch (error) {
      logger.error(`[${context}] Error fetching threads for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Query options: ${JSON.stringify(options)}`);
      throw error;
    }
  }
  
  /**
   * Update a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @param updates Thread updates
   * @param userId User ID making the update
   * @returns Updated thread
   */
  async updateThread(
    threadId: string,
    companyId: string,
    updates: Partial<NewCollaborationThread>,
    userId: string
  ): Promise<CollaborationThread> {
    const context = 'updateThread';
    try {
      logger.debug(`[${context}] Updating thread ${threadId} for company ${companyId} by user ${userId}`);
      logger.debug(`[${context}] Update fields: ${Object.keys(updates).join(', ')}`);
      
      return await this.query(async (db) => {
        const updatedThreads = await db.update(collaborationThreads)
          .set({
            ...updates,
            updatedAt: new Date(),
            updatedBy: userId
          })
          .where(and(
            eq(collaborationThreads.id, threadId),
            eq(collaborationThreads.companyId, companyId)
          ))
          .returning();
        
        if (updatedThreads.length === 0) {
          const error = new Error(`Thread not found: ${threadId}`);
          logger.error(`[${context}] ${error.message} for company ${companyId}`);
          throw error;
        }
        
        logger.info(`[${context}] Thread ${threadId} updated successfully by user ${userId}`);
        return updatedThreads[0];
      });
    } catch (error) {
      logger.error(`[${context}] Error updating thread ${threadId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Delete a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @returns True if deleted
   */
  async deleteThread(threadId: string, companyId: string): Promise<boolean> {
    const context = 'deleteThread';
    try {
      logger.debug(`[${context}] Deleting thread ${threadId} for company ${companyId}`);
      
      return await this.transaction(async (tx) => {
        // First delete all messages in the thread
        await tx.delete(collaborationMessages)
          .where(and(
            eq(collaborationMessages.threadId, threadId),
            eq(collaborationMessages.companyId, companyId)
          ));
        
        // Then delete the thread itself
        const result = await tx.delete(collaborationThreads)
          .where(and(
            eq(collaborationThreads.id, threadId),
            eq(collaborationThreads.companyId, companyId)
          ))
          .returning();
        
        const deleted = result.length > 0;
        
        if (deleted) {
          logger.info(`[${context}] Thread ${threadId} and all its messages deleted successfully for company ${companyId}`);
        } else {
          logger.info(`[${context}] No thread with ID ${threadId} found to delete for company ${companyId}`);
        }
        
        return deleted;
      });
    } catch (error) {
      logger.error(`[${context}] Error deleting thread ${threadId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update the last message timestamp for a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @returns Success flag
   */
  async updateLastMessageTimestamp(threadId: string, companyId: string): Promise<boolean> {
    const context = 'updateLastMessageTimestamp';
    try {
      logger.debug(`[${context}] Updating last message timestamp for thread ${threadId}`);
      
      return await this.query(async (db) => {
        const now = new Date();
        
        const result = await db.update(collaborationThreads)
          .set({
            lastMessageAt: now,
            updatedAt: now
          })
          .where(and(
            eq(collaborationThreads.id, threadId),
            eq(collaborationThreads.companyId, companyId)
          ))
          .returning();
        
        const success = result.length > 0;
        
        if (success) {
          logger.info(`[${context}] Last message timestamp updated successfully for thread ${threadId}`);
        } else {
          logger.warn(`[${context}] Failed to update last message timestamp: Thread not found with ID ${threadId}`);
        }
        
        return success;
      });
    } catch (error) {
      logger.error(`[${context}] Error updating last message timestamp for thread ${threadId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get message count for a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @returns Message count
   */
  async getMessageCount(threadId: string, companyId: string): Promise<number> {
    const context = 'getMessageCount';
    try {
      logger.debug(`[${context}] Counting messages for thread ${threadId} in company ${companyId}`);
      
      return await this.query(async (db) => {
        const result = await db.select({ 
            count: sql`count(*)` 
          })
          .from(collaborationMessages)
          .where(and(
            eq(collaborationMessages.threadId, threadId),
            eq(collaborationMessages.companyId, companyId)
          ));
        
        const count = Number(result[0]?.count || 0);
        logger.info(`[${context}] Thread ${threadId} has ${count} messages`);
        
        return count;
      });
    } catch (error) {
      logger.error(`[${context}] Error counting messages for thread ${threadId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Add a participant to a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @param userId User ID to add as participant
   * @returns Updated thread
   */
  async addParticipant(threadId: string, companyId: string, userId: string): Promise<CollaborationThread> {
    const context = 'addParticipant';
    try {
      logger.debug(`[${context}] Adding user ${userId} as participant to thread ${threadId}`);
      
      return await this.query(async (db) => {
        // First fetch the thread to get current participants
        const threads = await db.select()
          .from(collaborationThreads)
          .where(and(
            eq(collaborationThreads.id, threadId),
            eq(collaborationThreads.companyId, companyId)
          ));
        
        if (threads.length === 0) {
          const error = new Error(`Thread not found: ${threadId}`);
          logger.error(`[${context}] ${error.message} for company ${companyId}`);
          throw error;
        }
        
        const thread = threads[0];
        const participants = Array.isArray(thread.participants) ? thread.participants as string[] : [];
        
        // Only add if not already a participant
        if (!participants.includes(userId)) {
          const updatedParticipants: string[] = [...participants, userId];
          
          const updatedThreads = await db.update(collaborationThreads)
            .set({
              participants: updatedParticipants,
              updatedAt: new Date()
            })
            .where(and(
              eq(collaborationThreads.id, threadId),
              eq(collaborationThreads.companyId, companyId)
            ))
            .returning();
          
          logger.info(`[${context}] User ${userId} added as participant to thread ${threadId}`);
          return updatedThreads[0];
        }
        
        logger.info(`[${context}] User ${userId} is already a participant in thread ${threadId}`);
        return thread;
      });
    } catch (error) {
      logger.error(`[${context}] Error adding participant to thread: ${error instanceof Error ? error.message : String(error)}`);
      logger.error(`[${context}] Details: threadId=${threadId}, userId=${userId}, companyId=${companyId}`);
      throw error;
    }
  }
}