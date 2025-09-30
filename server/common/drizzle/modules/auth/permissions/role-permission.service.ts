/**
 * Role Permission Service
 * 
 * Handles the association between roles and permissions
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../../../common/logger';
import { BaseDrizzleService } from '../../core/base-drizzle.service';
import { eq, and, or, sql } from 'drizzle-orm';
import { rolePermissions, permissions, userRoles } from '@shared/schema/admin.schema';
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
            created_at: permissions.created_at,
            updated_at: permissions.updated_at
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
          .where(eq(rolePermissions.role_id, roleId));
        
        logger.debug(`[${context}] Retrieved ${result.length} permissions for role ${roleId}`);
        return result;
      }, context);
    } catch (error) {
      logger.error(`[${context}] Failed to get permissions for role with ID: ${roleId}`, error);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      throw new Error(`Failed to retrieve role permissions: ${error.message}`);
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
              eq(rolePermissions.role_id, roleId),
              eq(rolePermissions.permission_id, permissionId)
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
            role_id: roleId,
            permission_id: permissionId
          });
        
        logger.info(`[${context}] Permission ${permissionId} assigned to role ${roleId}`);
      }, context);
    } catch (error) {
      logger.error(`[${context}] Failed to assign permission ${permissionId} to role ${roleId}`, error);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      throw new Error(`Failed to assign permission to role: ${error.message}`);
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
      
      // Verify the assignment exists
      const hasPermission = await this.query(async (db) => {
        const result = await db
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.role_id, roleId),
              eq(rolePermissions.permission_id, permissionId)
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
              eq(rolePermissions.role_id, roleId),
              eq(rolePermissions.permission_id, permissionId)
            )
          );
        
        logger.info(`[${context}] Permission ${permissionId} removed from role ${roleId}`);
      }, context);
    } catch (error) {
      logger.error(`[${context}] Failed to remove permission ${permissionId} from role ${roleId}`, error);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      throw new Error(`Failed to remove permission from role: ${error.message}`);
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
          .innerJoin(rolePermissions, eq(userRoles.role_id, rolePermissions.role_id))
          .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
          .where(
            and(
              eq(userRoles.user_id, userId),
              eq(permissions.resource, resource),
              eq(permissions.action, action)
            )
          );
        
        const hasPermission = result[0].count > 0;
        logger.debug(`[${context}] User ${userId} ${hasPermission ? 'has' : 'does not have'} permission ${action} on ${resource}`);
        return hasPermission;
      }, context);
    } catch (error) {
      logger.error(`[${context}] Failed to check permission for user ${userId}`, error);
      logger.error(`[${context}] Resource: ${resource}, Action: ${action}`);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      // Default to false on error for security
      return false;
    }
  }
}