/**
 * Role Permission Service
 * 
 * Handles the association between roles and permissions
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../../../common/logger';
import { BaseDrizzleService } from '../../core/base-drizzle.service';
import { eq, and, sql } from 'drizzle-orm';
import { rolePermissions, permissions, userRoles } from '@geniuserp/shared';
import { RoleQueryService } from '../roles/role-query.service';
import { PermissionQueryService } from './permission-query.service';

// Create a logger for role-permission operations
const logger = new Logger('RolePermissionService');

/**
 * Service that handles role-permission assignments
 */
export class RolePermissionService extends BaseDrizzleService {
  private roleQueryService: RoleQueryService;
  private permissionQueryService: PermissionQueryService;
  
  constructor() {
    super();
    this.roleQueryService = new RoleQueryService();
    this.permissionQueryService = new PermissionQueryService();
  }
  
  /**
   * Get all permissions assigned to a role
   * 
   * @param roleId Role ID
   * @returns Array of permissions
   */
  async getRolePermissions(roleId: string): Promise<any[]> {
    const context = 'getRolePermissions';
    try {
      logger.debug(`[${context}] Getting permissions for role with ID: ${roleId}`);
      
      // Verify role exists
      const role = await this.roleQueryService.getRoleById(roleId);
      if (!role) {
        const errorMessage = `Role not found with ID: ${roleId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Use a join to get the permission details
      logger.debug(`[${context}] Preparing join query for role permissions: ${roleId}`);
      return await this.query(async (db) => {
        const result = await db
          .select({
            id: permissions.id,
            name: permissions.name,
            description: permissions.description,
            resource: permissions.resource,
            action: permissions.action,
            createdAt: permissions.createdAt,
            updatedAt: permissions.updatedAt
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, roleId));
        
        logger.debug(`[${context}] Retrieved ${result.length} permissions for role ${roleId}`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get permissions for role with ID: ${roleId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      logger.error(`[${context}] Stack trace: ${errorStack || "N/A"}`);
      throw new Error(`Failed to retrieve role permissions: ${errorMessage}`);
    }
  }
  
  /**
   * Assign a permission to a role
   * 
   * @param roleId Role ID
   * @param permissionId Permission ID
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const context = 'assignPermissionToRole';
    try {
      logger.debug(`[${context}] Assigning permission ${permissionId} to role ${roleId}`);
      
      // Verify role exists
      const role = await this.roleQueryService.getRoleById(roleId);
      if (!role) {
        const errorMessage = `Role not found with ID: ${roleId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Verify permission exists
      const permission = await this.permissionQueryService.getPermissionById(permissionId);
      if (!permission) {
        const errorMessage = `Permission not found with ID: ${permissionId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // First check if this assignment already exists
      logger.debug(`[${context}] Checking if permission is already assigned to role`);
      const existingAssignment = await this.query(async (db) => {
        const result = await db
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleId),
              eq(rolePermissions.permissionId, permissionId)
            )
          )
          .limit(1);
        
        return result.length > 0;
      }, context);
      
      if (existingAssignment) {
        logger.debug(`[${context}] Permission ${permissionId} already assigned to role ${roleId}`);
        return;
      }
      
      // Create the assignment
      logger.debug(`[${context}] Creating new permission assignment in database`);
      await this.query(async (db) => {
        await db
          .insert(rolePermissions)
          .values({
            roleId: roleId,
            permissionId: permissionId
          });
        
        logger.info(`[${context}] Permission ${permissionId} assigned to role ${roleId}`);
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to assign permission ${permissionId} to role ${roleId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      logger.error(`[${context}] Stack trace: ${errorStack || "N/A"}`);
      throw new Error(`Failed to assign permission to role: ${errorMessage}`);
    }
  }
  
  /**
   * Remove a permission from a role
   * 
   * @param roleId Role ID
   * @param permissionId Permission ID
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const context = 'removePermissionFromRole';
    try {
      logger.debug(`[${context}] Removing permission ${permissionId} from role ${roleId}`);
      
      // Check if assignment exists
      const hasPermission = await this.query(async (db) => {
        const result = await db
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleId),
              eq(rolePermissions.permissionId, permissionId)
            )
          )
          .limit(1);
          
        return result.length > 0;
      }, context);
      
      if (!hasPermission) {
        logger.debug(`[${context}] Permission ${permissionId} is not assigned to role ${roleId}`);
        return;
      }
      
      // Delete the assignment
      logger.debug(`[${context}] Removing permission assignment from database`);
      await this.query(async (db) => {
        await db
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, roleId),
              eq(rolePermissions.permissionId, permissionId)
            )
          );
        
        logger.info(`[${context}] Permission ${permissionId} removed from role ${roleId}`);
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to remove permission ${permissionId} from role ${roleId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      logger.error(`[${context}] Stack trace: ${errorStack || "N/A"}`);
      throw new Error(`Failed to remove permission from role: ${errorMessage}`);
    }
  }
  
  /**
   * Check if a user has a specific permission
   * 
   * @param userId User ID
   * @param resource Resource name
   * @param action Action name (read, write, etc.)
   * @returns Boolean indicating whether the user has the permission
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const context = 'hasPermission';
    try {
      logger.debug(`[${context}] Checking if user ${userId} has permission ${action} on ${resource}`);
      
      return await this.query(async (db) => {
        // Complex query to check if user has permission through any of their roles
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(userRoles)
          .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(
            and(
              eq(userRoles.userId, userId),
              eq(permissions.resource, resource),
              eq(permissions.action, action)
            )
          );
        
        const hasPermission = result[0].count > 0;
        logger.debug(`[${context}] User ${userId} ${hasPermission ? 'has' : 'does not have'} permission ${action} on ${resource}`);
        return hasPermission;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to check permission for user ${userId}`, error);
      logger.error(`[${context}] Resource: ${resource}, Action: ${action}`);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      logger.error(`[${context}] Stack trace: ${errorStack || "N/A"}`);
      // Default to false on error for security
      return false;
    }
  }
}