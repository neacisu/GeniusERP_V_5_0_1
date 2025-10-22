/**
 * User Role Service
 * 
 * Handles the association between users and roles
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../../../common/logger';
import { BaseDrizzleService } from '../../core/base-drizzle.service';
import { eq, and } from 'drizzle-orm';
import { userRoles } from '@shared/schema/admin.schema';
import { UserQueryService } from '../users/user-query.service';
import { RoleQueryService } from './role-query.service';

// Create a logger for user-role operations
const logger = new Logger('UserRoleService');

/**
 * Service that handles user-role assignments
 */
export class UserRoleService extends BaseDrizzleService {
  private userQueryService: UserQueryService;
  private roleQueryService: RoleQueryService;
  
  constructor() {
    super();
    this.userQueryService = new UserQueryService();
    this.roleQueryService = new RoleQueryService();
  }
  
  /**
   * Assign a role to a user
   * 
   * @param userId User ID
   * @param roleId Role ID
   * @param assignedBy User ID who is assigning the role (defaults to 'system')
   */
  async assignRoleToUser(userId: string, roleId: string, assignedBy: string = 'system'): Promise<void> {
    const context = 'assignRoleToUser';
    try {
      logger.debug(`[${context}] Assigning role ${roleId} to user ${userId}`);
      
      // Verify user exists
      const user = await this.userQueryService.getUserById(userId);
      if (!user) {
        const errorMessage = `User not found with ID: ${userId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Verify role exists
      const role = await this.roleQueryService.getRoleById(roleId);
      if (!role) {
        const errorMessage = `Role not found with ID: ${roleId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // First check if this assignment already exists
      logger.debug(`[${context}] Checking if role ${roleId} is already assigned to user ${userId}`);
      const existingAssignment = await this.query(async (db) => {
        const result = await db
          .select()
          .from(userRoles)
          .where(
            and(
              eq(userRoles.user_id, userId),
              eq(userRoles.role_id, roleId)
            )
          )
          .limit(1);
        
        return result.length > 0;
      }, context);
      
      if (existingAssignment) {
        logger.debug(`[${context}] Role ${roleId} already assigned to user ${userId}`);
        return;
      }
      
      // Create the assignment
      logger.debug(`[${context}] Creating new role assignment in database`);
      await this.query(async (db) => {
        await db
          .insert(userRoles)
          .values({
            user_id: userId,
            role_id: roleId,
            assigned_by: assignedBy
          });
        
        logger.info(`[${context}] Role ${roleId} assigned to user ${userId} by ${assignedBy}`);
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to assign role ${roleId} to user ${userId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to assign role to user: ${errorMessage}`);
    }
  }
  
  /**
   * Remove a role from a user
   * 
   * @param userId User ID
   * @param roleId Role ID
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const context = 'removeRoleFromUser';
    try {
      logger.debug(`[${context}] Removing role ${roleId} from user ${userId}`);
      
      // Verify the assignment exists
      const hasRole = await this.query(async (db) => {
        const result = await db
          .select()
          .from(userRoles)
          .where(
            and(
              eq(userRoles.user_id, userId),
              eq(userRoles.role_id, roleId)
            )
          )
          .limit(1);
          
        return result.length > 0;
      }, context);
      
      if (!hasRole) {
        logger.debug(`[${context}] Role ${roleId} is not assigned to user ${userId}`);
        return;
      }
      
      // Delete the assignment
      logger.debug(`[${context}] Removing role assignment from database`);
      await this.query(async (db) => {
        await db
          .delete(userRoles)
          .where(
            and(
              eq(userRoles.user_id, userId),
              eq(userRoles.role_id, roleId)
            )
          );
        
        logger.info(`[${context}] Role ${roleId} removed from user ${userId}`);
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to remove role ${roleId} from user ${userId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to remove role from user: ${errorMessage}`);
    }
  }
  
  /**
   * Get all users assigned to a role
   * 
   * @param roleId Role ID
   * @returns Array of user IDs
   */
  async getRoleUsers(roleId: string): Promise<string[]> {
    const context = 'getRoleUsers';
    try {
      logger.debug(`[${context}] Getting users for role with ID: ${roleId}`);
      
      // Verify role exists
      const role = await this.roleQueryService.getRoleById(roleId);
      if (!role) {
        const errorMessage = `Role not found with ID: ${roleId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Get user IDs
      return await this.query(async (db) => {
        const result = await db
          .select({ user_id: userRoles.user_id })
          .from(userRoles)
          .where(eq(userRoles.role_id, roleId));
        
        const userIds = result.map(r => r.user_id);
        logger.debug(`[${context}] Retrieved ${userIds.length} users for role ${roleId}`);
        return userIds;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get users for role with ID: ${roleId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve role users: ${errorMessage}`);
    }
  }
}