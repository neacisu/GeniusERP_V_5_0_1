/**
 * User Query Service
 * 
 * Provides specialized database query operations for user entities
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../../../common/logger';
import { BaseDrizzleService } from '../../core/base-drizzle.service';
import { SQL, eq, and, or, sql } from 'drizzle-orm';
import { users, User, UserStatus } from '@shared/schema/admin.schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Create a logger for user query operations
const logger = new Logger('UserQueryService');

/**
 * Service that handles user query operations
 */
export class UserQueryService extends BaseDrizzleService {
  /**
   * Get user by username
   * 
   * @param username Username to search for
   * @returns User object or null if not found
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const context = 'getUserByUsername';
    try {
      logger.debug(`[${context}] Getting user by username: ${username}`);
      
      return await this.query(async (db) => {
        // Prepare query
        logger.debug(`[${context}] Preparing query for username: ${username}`);
        const result = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
        
        // Log query result
        if (!result || result.length === 0) {
          logger.debug(`[${context}] No user found with username: ${username}`);
          return null;
        }
        
        logger.debug(`[${context}] User found with username: ${username}, ID: ${result[0].id}`);
        return result[0];
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get user by username: ${username}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve user by username: ${errorMessage}`);
    }
  }
  
  /**
   * Get user by ID
   * 
   * @param userId User ID to search for
   * @returns User object or null if not found
   */
  async getUserById(userId: string): Promise<User | null> {
    const context = 'getUserById';
    try {
      logger.debug(`[${context}] Getting user by ID: ${userId}`);
      
      return await this.query(async (db) => {
        // Prepare query
        logger.debug(`[${context}] Preparing query for user ID: ${userId}`);
        const result = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        // Log query result
        if (!result || result.length === 0) {
          logger.debug(`[${context}] No user found with ID: ${userId}`);
          return null;
        }
        
        logger.debug(`[${context}] User found with ID: ${userId}, username: ${result[0].username}`);
        return result[0];
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get user by ID: ${userId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve user by ID: ${errorMessage}`);
    }
  }
  
  /**
   * Get all users with optional filtering
   * 
   * @param options Filter options
   * @returns Array of users
   */
  async getUsers(options: {
    companyId?: string;
    status?: UserStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<User[]> {
    const context = 'getUsers';
    try {
      const { companyId, status, limit = 100, offset = 0 } = options;
      logger.debug(`[${context}] Getting users with options: ${JSON.stringify(options)}`);
      
      return await this.query(async (db) => {
        // Build query with filters - avoid reassignment to fix type issues
        logger.debug(`[${context}] Building query with filters: companyId=${companyId}, status=${status}`);
        
        // Build conditions array
        const conditions: SQL<unknown>[] = [];
        
        if (companyId) {
          logger.debug(`[${context}] Adding company filter: ${companyId}`);
          conditions.push(eq(users.company_id, companyId));
        }
        
        if (status) {
          logger.debug(`[${context}] Adding status filter: ${status}`);
          conditions.push(eq(users.status, status));
        }
        
        logger.debug(`[${context}] Applying pagination: limit=${limit}, offset=${offset}`);
        
        // Build query directly to avoid type mismatch
        const result = conditions.length > 0
          ? await db.select().from(users).where(and(...conditions)).limit(limit).offset(offset)
          : await db.select().from(users).limit(limit).offset(offset);
        
        logger.debug(`[${context}] Retrieved ${result.length} users`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get users with options: ${JSON.stringify(options)}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve users: ${errorMessage}`);
    }
  }
}