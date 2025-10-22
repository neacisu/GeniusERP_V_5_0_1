/**
 * Role Mutation Service
 * 
 * Provides specialized database mutation operations for role entities
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../../../common/logger';
import { BaseDrizzleService } from '../../core/base-drizzle.service';
import { eq, and } from 'drizzle-orm';
import { roles, userRoles } from '@shared/schema/admin.schema';
import { RoleQueryService } from './role-query.service';

// Create a logger for role mutation operations
const logger = new Logger('RoleMutationService');

/**
 * Service that handles role mutation operations (create, update, delete)
 */
export class RoleMutationService extends BaseDrizzleService {
  private roleQueryService: RoleQueryService;
  
  constructor() {
    super();
    this.roleQueryService = new RoleQueryService();
  }
  
  /**
   * Create a new role
   * 
   * @param roleData Role data
   * @returns Created role
   */
  async createRole(roleData: any): Promise<any> {
    const context = 'createRole';
    try {
      // Validate input
      if (!roleData.name || !roleData.company_id) {
        const errorMessage = 'Role name and company_id are required';
        logger.error(`[${context}] Validation error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      logger.debug(`[${context}] Creating new role: ${roleData.name} for company: ${roleData.company_id}`);
      
      // Verify that a role with the same name doesn't exist for this company
      const existingRole = await this.roleQueryService.getRoleByName(roleData.name, roleData.company_id);
      if (existingRole) {
        const errorMessage = `Role with name ${roleData.name} already exists for company ${roleData.company_id}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Create role
      logger.debug(`[${context}] Inserting role into database`);
      return await this.query(async (db) => {
        const [newRole] = await db
          .insert(roles)
          .values({
            ...roleData,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning();
        
        logger.info(`[${context}] Role created successfully with ID: ${newRole.id}`);
        logger.debug(`[${context}] Created role details: name=${newRole.name}, company=${newRole.company_id}`);
        return newRole;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to create role`, error);
      logger.error(`[${context}] Role data: ${JSON.stringify(roleData)}`);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to create role: ${errorMessage}`);
    }
  }
  
  /**
   * Update an existing role
   * 
   * @param roleId Role ID
   * @param roleData Role data to update
   * @returns Updated role
   */
  async updateRole(roleId: string, roleData: any): Promise<any> {
    const context = 'updateRole';
    try {
      logger.debug(`[${context}] Updating role with ID: ${roleId}`);
      
      // Check if role exists
      const existingRole = await this.roleQueryService.getRoleById(roleId);
      if (!existingRole) {
        const errorMessage = `Role not found with ID: ${roleId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // If name is being updated, check for duplicates
      if (roleData.name && roleData.name !== existingRole.name) {
        logger.debug(`[${context}] Checking for duplicate role name: ${roleData.name}`);
        const duplicateRole = await this.roleQueryService.getRoleByName(
          roleData.name, 
          roleData.company_id || existingRole.company_id
        );
        
        if (duplicateRole && duplicateRole.id !== roleId) {
          const errorMessage = `Role with name ${roleData.name} already exists for this company`;
          logger.warn(`[${context}] ${errorMessage}`);
          throw new Error(errorMessage);
        }
      }
      
      // Update role
      logger.debug(`[${context}] Updating role in database: ${roleId}`);
      return await this.query(async (db) => {
        const [updatedRole] = await db
          .update(roles)
          .set({
            ...roleData,
            updated_at: new Date()
          })
          .where(eq(roles.id, roleId))
          .returning();
        
        logger.info(`[${context}] Role updated successfully with ID: ${updatedRole.id}`);
        logger.debug(`[${context}] Updated role details: name=${updatedRole.name}`);
        return updatedRole;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to update role with ID: ${roleId}`, error);
      logger.error(`[${context}] Update data: ${JSON.stringify(roleData)}`);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to update role: ${errorMessage}`);
    }
  }
  
  /**
   * Delete a role
   * 
   * @param roleId Role ID
   * @returns Success indicator
   */
  async deleteRole(roleId: string): Promise<boolean> {
    const context = 'deleteRole';
    try {
      logger.debug(`[${context}] Deleting role with ID: ${roleId}`);
      
      // Check if role exists
      const existingRole = await this.roleQueryService.getRoleById(roleId);
      if (!existingRole) {
        const errorMessage = `Role not found with ID: ${roleId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Delete role
      return await this.transaction(async (tx) => {
        // First, delete all user role assignments
        logger.debug(`[${context}] Removing all user associations for role: ${roleId}`);
        await tx
          .delete(userRoles)
          .where(eq(userRoles.role_id, roleId));
        
        // Then delete the role itself
        logger.debug(`[${context}] Deleting role from database: ${roleId}`);
        const deleteResult = await tx
          .delete(roles)
          .where(eq(roles.id, roleId))
          .returning({ id: roles.id });
        
        const success = deleteResult.length > 0;
        if (success) {
          logger.info(`[${context}] Role deleted successfully with ID: ${roleId}`);
        } else {
          logger.warn(`[${context}] No role was deleted with ID: ${roleId}`);
        }
        return success;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to delete role with ID: ${roleId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to delete role: ${errorMessage}`);
    }
  }
}