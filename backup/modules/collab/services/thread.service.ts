/**
 * Thread Service
 * 
 * Service for managing discussion threads in the Collaboration module.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  collaborationThreads,
  NewCollaborationThread,
  CollaborationThread
} from '../../../../shared/schema/collaboration.schema';
import { randomUUID } from 'crypto';
import { Logger } from '../../../common/logger';

// Create a logger instance for the thread service
const logger = new Logger('ThreadService');

/**
 * Thread Service Class
 * 
 * Manages discussion threads for team collaboration.
 */
export class ThreadService {
  /**
   * Constructor
   * 
   * @param db Drizzle database instance
   */
  constructor(private db: PostgresJsDatabase<any>) {}
  
  /**
   * Create a new discussion thread
   * 
   * @param thread Thread data
   * @param userId User ID creating the thread
   * @returns Created thread
   */
  async createThread(thread: NewCollaborationThread, userId: string): Promise<CollaborationThread> {
    try {
      const threadId = thread.id || randomUUID();
      const now = new Date();
      
      // Create the thread
      const createdThreads = await this.db.insert(collaborationThreads)
        .values({
          ...thread,
          id: threadId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
          lastMessageAt: now
        })
        .returning();
      
      if (createdThreads.length === 0) {
        throw new Error('Failed to create thread');
      }
      
      return createdThreads[0];
    } catch (error) {
      logger.error('Error creating thread', { error, threadData: thread });
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
    try {
      const threads = await this.db.select()
        .from(collaborationThreads)
        .where(and(
          eq(collaborationThreads.id, threadId),
          eq(collaborationThreads.companyId, companyId)
        ));
      
      return threads.length > 0 ? threads[0] : null;
    } catch (error) {
      logger.error('Error fetching thread by ID', { error, threadId, companyId });
      throw error;
    }
  }
  
  /**
   * Get all threads for a company
   * 
   * @param companyId Company ID
   * @param options Query options (limit, offset, sort, filter)
   * @returns List of threads
   */
  async getThreads(companyId: string, options: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
    createdBy?: string;
    isPrivate?: boolean;
    isClosed?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ threads: CollaborationThread[]; total: number }> {
    try {
      const {
        limit = 20,
        offset = 0,
        category,
        search,
        createdBy,
        isPrivate,
        isClosed,
        sortBy = 'lastMessageAt',
        sortOrder = 'desc'
      } = options;
      
      // Build query conditions
      let query = this.db.select()
        .from(collaborationThreads)
        .where(eq(collaborationThreads.companyId, companyId));
      
      // Apply filters
      if (category) {
        query = query.where(eq(collaborationThreads.category, category));
      }
      
      if (createdBy) {
        query = query.where(eq(collaborationThreads.createdBy, createdBy));
      }
      
      if (isPrivate !== undefined) {
        query = query.where(eq(collaborationThreads.isPrivate, isPrivate));
      }
      
      if (isClosed !== undefined) {
        query = query.where(eq(collaborationThreads.isClosed, isClosed));
      }
      
      if (search) {
        query = query.where(
          sql`(${collaborationThreads.title} ILIKE ${`%${search}%`} OR ${collaborationThreads.description} ILIKE ${`%${search}%`})`
        );
      }
      
      // Count total matching records
      const totalQuery = this.db.select({ count: this.db.fn.count() })
        .from(collaborationThreads)
        .where(eq(collaborationThreads.companyId, companyId));
      
      // Apply the same filters to the count query
      if (category) {
        totalQuery.where(eq(collaborationThreads.category, category));
      }
      
      if (createdBy) {
        totalQuery.where(eq(collaborationThreads.createdBy, createdBy));
      }
      
      if (isPrivate !== undefined) {
        totalQuery.where(eq(collaborationThreads.isPrivate, isPrivate));
      }
      
      if (isClosed !== undefined) {
        totalQuery.where(eq(collaborationThreads.isClosed, isClosed));
      }
      
      if (search) {
        totalQuery.where(
          sql`(${collaborationThreads.title} ILIKE ${`%${search}%`} OR ${collaborationThreads.description} ILIKE ${`%${search}%`})`
        );
      }
      
      // Apply sorting
      if (sortOrder === 'asc') {
        query = query.orderBy(collaborationThreads[sortBy]);
      } else {
        query = query.orderBy(desc(collaborationThreads[sortBy]));
      }
      
      // Apply pagination
      query = query.limit(limit).offset(offset);
      
      // Execute queries
      const [threads, totalResult] = await Promise.all([
        query,
        totalQuery
      ]);
      
      const total = Number(totalResult[0]?.count || 0);
      
      return { threads, total };
    } catch (error) {
      logger.error('Error fetching threads', { error, companyId, options });
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
    try {
      const updatedThreads = await this.db.update(collaborationThreads)
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
        throw new Error(`Thread not found: ${threadId}`);
      }
      
      return updatedThreads[0];
    } catch (error) {
      logger.error('Error updating thread', { error, threadId, companyId, updates });
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
    try {
      const result = await this.db.delete(collaborationThreads)
        .where(and(
          eq(collaborationThreads.id, threadId),
          eq(collaborationThreads.companyId, companyId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error deleting thread', { error, threadId, companyId });
      throw error;
    }
  }
  
  /**
   * Update thread's last message timestamp
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @returns Updated thread
   */
  async updateLastMessageTimestamp(threadId: string, companyId: string): Promise<void> {
    try {
      await this.db.update(collaborationThreads)
        .set({
          lastMessageAt: new Date()
        })
        .where(and(
          eq(collaborationThreads.id, threadId),
          eq(collaborationThreads.companyId, companyId)
        ));
    } catch (error) {
      logger.error('Error updating thread last message timestamp', { error, threadId, companyId });
      throw error;
    }
  }
}