/**
 * User Mutation Service
 * 
 * Provides specialized database mutation operations for user entities
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../../../common/logger';
import { BaseDrizzleService } from '../../core/base-drizzle.service';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema/admin.schema';
import { User, UserStatus } from '@shared/schema/admin.schema';
import { UserQueryService } from './user-query.service';

// Create a logger for user mutation operations
const logger = new Logger('UserMutationService');

/**
 * Service that handles user mutation operations (create, update, delete)
 */
export class UserMutationService extends BaseDrizzleService {
  private userQueryService: UserQueryService;
  
  constructor() {
    super();
    this.userQueryService = new UserQueryService();
  }
  
  /**
   * Create a new user
   * 
   * @param userData User data to insert with hashed password
   * @returns Created user object
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const context = 'createUser';
    try {
      // Validate input
      if (!userData.username) {
        const error = new Error('Username is required');
        logger.error(`[${context}] Validation error: ${error.message}`);
        throw error;
      }
      
      logger.debug(`[${context}] Creating new user with username: ${userData.username}`);
      
      // Check if username already exists
      const existingUser = await this.userQueryService.getUserByUsername(userData.username);
      if (existingUser) {
        const errorMessage = `Username already exists: ${userData.username}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Ensure required fields
      if (!userData.password || !userData.email) {
        const errorMessage = 'Password and email are required';
        logger.warn(`[${context}] Validation error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Create user in database
      logger.debug(`[${context}] Inserting user into database`);
      return await this.query(async (db) => {
        const [newUser] = await db
          .insert(users)
          .values({
            username: userData.username!,  // Validated above
            email: userData.email!,        // Validated above
            password: userData.password!,  // Validated above
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role || 'user',
            status: userData.status || UserStatus.ACTIVE,
            company_id: userData.company_id
          })
          .returning();
        
        logger.info(`[${context}] User created successfully with ID: ${newUser.id}`);
        logger.debug(`[${context}] Created user details: username=${newUser.username}, email=${newUser.email}`);
        return newUser;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to create user`, error);
      logger.error(`[${context}] User data: ${JSON.stringify({...userData, password: '[REDACTED]'})}`);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to create user: ${errorMessage}`);
    }
  }
  
  /**
   * Update an existing user
   * 
   * @param userId User ID to update
   * @param userData User data to update (partial)
   * @returns Updated user object
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const context = 'updateUser';
    try {
      logger.debug(`[${context}] Updating user with ID: ${userId}`);
      
      // Check if user exists
      const existingUser = await this.userQueryService.getUserById(userId);
      if (!existingUser) {
        const errorMessage = `User not found with ID: ${userId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Update user in database
      logger.debug(`[${context}] Updating user in database: ${userId}`);
      return await this.query(async (db) => {
        const [updatedUser] = await db
          .update(users)
          .set({
            ...userData,
            updated_at: new Date()
          })
          .where(eq(users.id, userId))
          .returning();
        
        logger.info(`[${context}] User updated successfully with ID: ${updatedUser.id}`);
        logger.debug(`[${context}] Updated user details: username=${updatedUser.username}`);
        return updatedUser;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to update user with ID: ${userId}`, error);
      logger.error(`[${context}] Update data: ${JSON.stringify({...userData, password: userData.password ? '[REDACTED]' : undefined})}`);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to update user: ${errorMessage}`);
    }
  }
  
  /**
   * Update user's password
   * 
   * @param userId User ID
   * @param hashedPassword Already hashed password
   * @returns Updated user
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    const context = 'updatePassword';
    try {
      logger.debug(`[${context}] Updating password for user with ID: ${userId}`);
      
      // Update user password
      const updatedUser = await this.updateUser(userId, { password: hashedPassword });
      logger.info(`[${context}] Password updated successfully for user ${userId}`);
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to update password for user with ID: ${userId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to update password: ${errorMessage}`);
    }
  }
}