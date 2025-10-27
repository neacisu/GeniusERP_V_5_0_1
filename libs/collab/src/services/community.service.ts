/**
 * Community Service
 * 
 * This service handles operations related to the community section of the collaboration module,
 * including threads categorized for different purposes like resources, events, ideas, etc.
 */

import { eq, and, sql, desc, asc, like } from "drizzle-orm";
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { getDrizzleInstance } from "@common/drizzle/db";
import { createModuleLogger } from "@common/logger/loki-logger";
import { 
  collaborationThreads, 
  collaborationMessages,
  CollaborationThread,
  NewCollaborationThread
} from '@geniuserp/shared/schema/collaboration.schema';
import { ThreadService } from './thread.service';

// Create a logger instance for the community service
const logger = createModuleLogger('CommunityService');

/**
 * Community categories enum
 */
export enum CommunityCategory {
  ANUNTURI = 'ANUNTURI',
  INTREBARI = 'INTREBARI',
  IDEI = 'IDEI',
  EVENIMENTE = 'EVENIMENTE',
  RESURSE = 'RESURSE',
  TUTORIALE = 'TUTORIALE'
}

/**
 * Community thread filtering options
 */
export interface CommunityThreadOptions {
  category?: CommunityCategory;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'oldest' | 'popular';
}

/**
 * Community service class
 */
export class CommunityService {
  private threadService: any; // Accept both ThreadService and ThreadDrizzleService
  
  /**
   * Create an instance of CommunityService
   * 
   * @param db Database connection
   * @param threadService Thread service (optional)
   */
  constructor(
    private readonly drizzleService: DrizzleService,
    threadService?: any
  ) {
    // Since ThreadService still expects a database instance,
    // we get it from getDrizzleInstance()
    this.threadService = threadService || new ThreadService(getDrizzleInstance());
    logger.info('Community service initialized');
  }

  /**
   * Get community threads with optional filtering
   * 
   * @param companyId Company ID
   * @param options Filter options
   * @returns Threads that match the filter criteria
   */
  async getCommunityThreads(companyId: string, options?: CommunityThreadOptions): Promise<{
    threads: CollaborationThread[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      logger.info(`Getting community threads for company ${companyId} with options: ${JSON.stringify(options)}`);
      
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      const category = options?.category;
      const search = options?.search;
      const sort = options?.sort || 'newest';
      
      // Build conditions for the query
      const conditions = [
        eq(collaborationThreads.companyId, companyId),
        category ? eq(collaborationThreads.category, category) : sql`1=1`,
        search ? like(collaborationThreads.title, `%${search}%`) : sql`1=1`
      ];

      // Count total results using DrizzleService
      const countResult = await this.drizzleService.query(db => db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(collaborationThreads)
        .where(and(...conditions))
      );
        
      const total = countResult[0]?.count || 0;
      
      // Build the main query using DrizzleService
      const results = await this.drizzleService.query(db => {
        let query = db
          .select({
            thread: collaborationThreads,
            replyCount: sql<number>`count(${collaborationMessages.id})`.mapWith(Number)
          })
          .from(collaborationThreads)
          .leftJoin(
            collaborationMessages,
            eq(collaborationThreads.id, collaborationMessages.threadId)
          )
          .where(and(...conditions))
          .groupBy(collaborationThreads.id);
          
        // Apply sorting
        if (sort === 'newest') {
          query = query.orderBy(desc(collaborationThreads.createdAt));
        } else if (sort === 'oldest') {
          query = query.orderBy(asc(collaborationThreads.createdAt));
        } else if (sort === 'popular') {
          query = query.orderBy(desc(sql<number>`count(${collaborationMessages.id})`));
        }
        
        // Apply pagination
        query = query.limit(limit).offset(offset);
        
        return query;
      });
      
      // Convert to expected format
      const threads = results.map((result: any) => ({
        ...result.thread,
        replyCount: result.replyCount
      }));
      
      return {
        threads,
        total,
        limit,
        offset
      };
    } catch (error) {
      logger.error(`Error getting community threads: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Create a new community thread
   * 
   * @param threadData Thread data
   * @returns Created thread
   */
  async createCommunityThread(threadData: NewCollaborationThread, userId: string): Promise<CollaborationThread> {
    try {
      logger.info(`Creating community thread for company ${threadData.companyId} in category ${threadData.category}`);
      // Delegate to thread service
      return this.threadService.createThread(threadData, userId);
    } catch (error) {
      logger.error(`Error creating community thread: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get a community thread by ID
   * 
   * @param threadId Thread ID
   * @param companyId Company ID (for security)
   * @returns Thread if found
   */
  async getCommunityThreadById(threadId: string, companyId: string): Promise<CollaborationThread | null> {
    try {
      logger.info(`Getting community thread ${threadId} for company ${companyId}`);
      const thread = await this.threadService.getThreadById(threadId, companyId);
      
      // Security check already done by getThreadById with companyId filter
      return thread;
    } catch (error) {
      logger.error(`Error getting community thread: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update a community thread
   * 
   * @param threadId Thread ID
   * @param threadData Updated thread data
   * @param companyId Company ID (for security)
   * @returns Updated thread if successful
   */
  async updateCommunityThread(
    threadId: string, 
    threadData: Partial<NewCollaborationThread>, 
    companyId: string,
    userId: string
  ): Promise<CollaborationThread | null> {
    try {
      logger.info(`Updating community thread ${threadId} for company ${companyId}`);
      // First check if the thread exists and belongs to the company
      const thread = await this.getCommunityThreadById(threadId, companyId);
      
      if (!thread) {
        return null;
      }
      
      // Delegate to thread service for update (params: threadId, companyId, updates, userId)
      return this.threadService.updateThread(threadId, companyId, threadData, userId);
    } catch (error) {
      logger.error(`Error updating community thread: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Delete a community thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID (for security)
   * @returns True if deletion was successful
   */
  async deleteCommunityThread(threadId: string, companyId: string): Promise<boolean> {
    try {
      logger.info(`Deleting community thread ${threadId} for company ${companyId}`);
      // First check if the thread exists and belongs to the company
      const thread = await this.getCommunityThreadById(threadId, companyId);
      
      if (!thread) {
        return false;
      }
      
      // Delegate to thread service for deletion
      return this.threadService.deleteThread(threadId, companyId);
    } catch (error) {
      logger.error(`Error deleting community thread: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

// Factory function for compatibility with legacy code
export const createCommunityService = (
  drizzleService: DrizzleService,
  threadService?: ThreadService
): CommunityService => {
  return new CommunityService(drizzleService, threadService);
};