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
      logger.error(`[${context}] Failed to get user by username: ${username}`, error);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      throw new Error(`Failed to retrieve user by username: ${error.message}`);
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
      logger.error(`[${context}] Failed to get user by ID: ${userId}`, error);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      throw new Error(`Failed to retrieve user by ID: ${error.message}`);
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
      logger.debug(`[${context}] Getting users with options:`, options);
      
      return await this.query(async (db) => {
        // Build query with filters
        logger.debug(`[${context}] Building query with filters: companyId=${companyId}, status=${status}`);
        let query = db.select().from(users);
        
        // Apply filters
        const conditions: SQL<unknown>[] = [];
        
        if (companyId) {
          logger.debug(`[${context}] Adding company filter: ${companyId}`);
          conditions.push(eq(users.company_id, companyId));
        }
        
        if (status) {
          logger.debug(`[${context}] Adding status filter: ${status}`);
          conditions.push(eq(users.status, status));
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        
        // Apply pagination
        logger.debug(`[${context}] Applying pagination: limit=${limit}, offset=${offset}`);
        query = query.limit(limit).offset(offset);
        
        // Execute query
        const result = await query;
        logger.debug(`[${context}] Retrieved ${result.length} users`);
        return result;
      }, context);
    } catch (error) {
      logger.error(`[${context}] Failed to get users with options:`, options, error);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      throw new Error(`Failed to retrieve users: ${error.message}`);
    }
  }
}