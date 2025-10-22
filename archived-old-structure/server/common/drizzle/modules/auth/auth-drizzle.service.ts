/**
 * Auth Drizzle Service
 * 
 * Main service for authentication-related database operations
 * that aggregates the specialized auth services.
 */

import { Logger } from '../../../../common/logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';
import { User as UserType } from '@shared/schema/admin.schema';
import { UserQueryService } from './users/user-query.service';
import { UserMutationService } from './users/user-mutation.service';

// Create a logger for the main auth service
const logger = new Logger('AuthDrizzleService');

/**
 * Service that provides a unified interface for authentication-related database operations
 */
export class AuthDrizzleService extends BaseDrizzleService {
  private userQueryService: UserQueryService;
  private userMutationService: UserMutationService;
  
  constructor() {
    super();
    this.userQueryService = new UserQueryService();
    this.userMutationService = new UserMutationService();
  }
  
  /**
   * Get user by username
   * 
   * @param username Username to search for
   * @returns User object or null if not found
   */
  async getUserByUsername(username: string): Promise<UserType | null> {
    const context = 'getUserByUsername';
    try {
      logger.debug(`[${context}] Delegating to UserQueryService`);
      return await this.userQueryService.getUserByUsername(username);
    } catch (error) {
      logger.error(`[${context}] Error in AuthDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get user by ID
   * 
   * @param userId User ID to search for
   * @returns User object or null if not found
   */
  async getUserById(userId: string): Promise<UserType | null> {
    const context = 'getUserById';
    try {
      logger.debug(`[${context}] Delegating to UserQueryService`);
      return await this.userQueryService.getUserById(userId);
    } catch (error) {
      logger.error(`[${context}] Error in AuthDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Create a new user
   * 
   * @param userData User data to insert with hashed password
   * @returns Created user object
   */
  async createUser(userData: Partial<UserType>): Promise<UserType> {
    const context = 'createUser';
    try {
      logger.debug(`[${context}] Delegating to UserMutationService`);
      return await this.userMutationService.createUser(userData);
    } catch (error) {
      logger.error(`[${context}] Error in AuthDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Update an existing user
   * 
   * @param userId User ID to update
   * @param userData User data to update (partial)
   * @returns Updated user object
   */
  async updateUser(userId: string, userData: Partial<UserType>): Promise<UserType> {
    const context = 'updateUser';
    try {
      logger.debug(`[${context}] Delegating to UserMutationService`);
      return await this.userMutationService.updateUser(userId, userData);
    } catch (error) {
      logger.error(`[${context}] Error in AuthDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Update user's password
   * 
   * @param userId User ID
   * @param hashedPassword Already hashed password
   * @returns Updated user
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<UserType> {
    const context = 'updatePassword';
    try {
      logger.debug(`[${context}] Delegating to UserMutationService`);
      return await this.userMutationService.updatePassword(userId, hashedPassword);
    } catch (error) {
      logger.error(`[${context}] Error in AuthDrizzleService wrapper`, error);
      throw error;
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
    limit?: number;
    offset?: number;
  } = {}): Promise<UserType[]> {
    const context = 'getUsers';
    try {
      logger.debug(`[${context}] Delegating to UserQueryService`);
      return await this.userQueryService.getUsers(options);
    } catch (error) {
      logger.error(`[${context}] Error in AuthDrizzleService wrapper`, error);
      throw error;
    }
  }
}