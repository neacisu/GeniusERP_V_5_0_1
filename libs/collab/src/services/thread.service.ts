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
} from '@geniuserp/shared/schema/collaboration.schema';
import { randomUUID } from 'crypto';
import { createModuleLogger } from "@common/logger/loki-logger";

// Create a logger instance for the thread service
const logger = createModuleLogger('ThreadService');

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
      logger.error(`Error creating thread: ${error instanceof Error ? error.message : String(error)}`);
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
      const whereCondition = and(
        eq(collaborationThreads.id, threadId),
        eq(collaborationThreads.companyId, companyId)
      );
      
      const threads = await this.db.select()
        .from(collaborationThreads)
        .where(whereCondition);
      
      return threads.length > 0 ? threads[0] : null;
    } catch (error) {
      logger.error(`Error fetching thread by ID ${threadId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
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
      
      // Build the base where condition
      const conditions = [eq(collaborationThreads.companyId, companyId)];
      
      // Add additional filter conditions
      if (category) {
        conditions.push(eq(collaborationThreads.category, category));
      }
      
      if (createdBy) {
        conditions.push(eq(collaborationThreads.createdBy, createdBy));
      }
      
      if (isPrivate !== undefined) {
        conditions.push(eq(collaborationThreads.isPrivate, isPrivate));
      }
      
      if (isClosed !== undefined) {
        conditions.push(eq(collaborationThreads.isClosed, isClosed));
      }
      
      if (search) {
        conditions.push(
          sql`(${collaborationThreads.title} ILIKE ${`%${search}%`} OR ${collaborationThreads.description} ILIKE ${`%${search}%`})`
        );
      }
      
      const whereCondition = and(...conditions);
      
      // Build and execute the query with the combined conditions
      // Use specific column references for sorting instead of dynamic property access
      let threadsResult;
      if (sortBy === 'lastMessageAt') {
        threadsResult = sortOrder === 'asc'
          ? await this.db.select().from(collaborationThreads)
              .where(whereCondition)
              .orderBy(collaborationThreads.lastMessageAt)
              .limit(limit)
              .offset(offset)
          : await this.db.select().from(collaborationThreads)
              .where(whereCondition)
              .orderBy(desc(collaborationThreads.lastMessageAt))
              .limit(limit)
              .offset(offset);
      } else if (sortBy === 'createdAt') {
        threadsResult = sortOrder === 'asc'
          ? await this.db.select().from(collaborationThreads)
              .where(whereCondition)
              .orderBy(collaborationThreads.createdAt)
              .limit(limit)
              .offset(offset)
          : await this.db.select().from(collaborationThreads)
              .where(whereCondition)
              .orderBy(desc(collaborationThreads.createdAt))
              .limit(limit)
              .offset(offset);
      } else if (sortBy === 'title') {
        threadsResult = sortOrder === 'asc'
          ? await this.db.select().from(collaborationThreads)
              .where(whereCondition)
              .orderBy(collaborationThreads.title)
              .limit(limit)
              .offset(offset)
          : await this.db.select().from(collaborationThreads)
              .where(whereCondition)
              .orderBy(desc(collaborationThreads.title))
              .limit(limit)
              .offset(offset);
      } else {
        // Default to lastMessageAt ordering
        threadsResult = sortOrder === 'asc'
          ? await this.db.select().from(collaborationThreads)
              .where(whereCondition)
              .orderBy(collaborationThreads.lastMessageAt)
              .limit(limit)
              .offset(offset)
          : await this.db.select().from(collaborationThreads)
              .where(whereCondition)
              .orderBy(desc(collaborationThreads.lastMessageAt))
              .limit(limit)
              .offset(offset);
      }
      
      // Count total matching records
      const totalResult = await this.db.select({ 
          count: sql`count(*)` 
        })
        .from(collaborationThreads)
        .where(whereCondition);
      
      const total = Number(totalResult[0]?.count || 0);
      
      return { threads: threadsResult, total };
    } catch (error) {
      logger.error(`Error fetching threads for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
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
      logger.error(`Error updating thread ${threadId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
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
      logger.error(`Error deleting thread ${threadId} for company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
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
      logger.error(`Error updating last message timestamp for thread ${threadId} in company ${companyId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}