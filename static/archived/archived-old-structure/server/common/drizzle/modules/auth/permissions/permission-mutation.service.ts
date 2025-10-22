/**
 * Permission Mutation Service
 * 
 * Provides specialized database mutation operations for permission entities
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../../../common/logger';
import { BaseDrizzleService } from '../../core/base-drizzle.service';
import { eq, and } from 'drizzle-orm';
import { permissions } from '@shared/schema/admin.schema';
import { PermissionQueryService } from './permission-query.service';

// Create a logger for permission mutation operations
const logger = new Logger('PermissionMutationService');

/**
 * Service that handles permission mutation operations (create, update, delete)
 */
export class PermissionMutationService extends BaseDrizzleService {
  private permissionQueryService: PermissionQueryService;
  
  constructor() {
    super();
    this.permissionQueryService = new PermissionQueryService();
  }
  
  /**
   * Create a new permission
   * 
   * @param permissionData Permission data
   * @returns Created permission
   */
  async createPermission(permissionData: any): Promise<any> {
    const context = 'createPermission';
    try {
      // Validate input
      if (!permissionData.name || !permissionData.resource || !permissionData.action) {
        const errorMessage = 'Permission name, resource, and action are required';
        logger.error(`[${context}] Validation error: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      logger.debug(`[${context}] Creating new permission: ${permissionData.name} for resource: ${permissionData.resource}, action: ${permissionData.action}`);
      
      // Check if a permission with the same resource and action already exists
      const existingPermission = await this.permissionQueryService.getPermissionByResourceAction(
        permissionData.resource,
        permissionData.action
      );
      
      if (existingPermission) {
        const errorMessage = `Permission already exists for resource: ${permissionData.resource}, action: ${permissionData.action}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Create permission
      logger.debug(`[${context}] Inserting permission into database`);
      return await this.query(async (db) => {
        const [newPermission] = await db
          .insert(permissions)
          .values({
            ...permissionData,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning();
        
        logger.info(`[${context}] Permission created successfully with ID: ${newPermission.id}`);
        logger.debug(`[${context}] Created permission details: name=${newPermission.name}, resource=${newPermission.resource}, action=${newPermission.action}`);
        return newPermission;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to create permission`, error);
      logger.error(`[${context}] Permission data: ${JSON.stringify(permissionData)}`);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to create permission: ${errorMessage}`);
    }
  }
  
  /**
   * Update an existing permission
   * 
   * @param permissionId Permission ID
   * @param permissionData Permission data to update
   * @returns Updated permission
   */
  async updatePermission(permissionId: string, permissionData: any): Promise<any> {
    const context = 'updatePermission';
    try {
      logger.debug(`[${context}] Updating permission with ID: ${permissionId}`);
      
      // Check if permission exists
      const existingPermission = await this.permissionQueryService.getPermissionById(permissionId);
      if (!existingPermission) {
        const errorMessage = `Permission not found with ID: ${permissionId}`;
        logger.warn(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // If resource and action are being updated, check for duplicates
      if (permissionData.resource && permissionData.action && 
          (permissionData.resource !== existingPermission.resource || 
           permissionData.action !== existingPermission.action)) {
        logger.debug(`[${context}] Checking for duplicate permission: resource=${permissionData.resource}, action=${permissionData.action}`);
        
        const duplicatePermission = await this.permissionQueryService.getPermissionByResourceAction(
          permissionData.resource,
          permissionData.action
        );
        
        if (duplicatePermission && duplicatePermission.id !== permissionId) {
          const errorMessage = `Permission already exists for resource: ${permissionData.resource}, action: ${permissionData.action}`;
          logger.warn(`[${context}] ${errorMessage}`);
          throw new Error(errorMessage);
        }
      }
      
      // Update permission
      logger.debug(`[${context}] Updating permission in database: ${permissionId}`);
      return await this.query(async (db) => {
        const [updatedPermission] = await db
          .update(permissions)
          .set({
            ...permissionData,
            updated_at: new Date()
          })
          .where(eq(permissions.id, permissionId))
          .returning();
        
        logger.info(`[${context}] Permission updated successfully with ID: ${updatedPermission.id}`);
        logger.debug(`[${context}] Updated permission details: name=${updatedPermission.name}, resource=${updatedPermission.resource}, action=${updatedPermission.action}`);
        return updatedPermission;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to update permission with ID: ${permissionId}`, error);
      logger.error(`[${context}] Update data: ${JSON.stringify(permissionData)}`);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to update permission: ${errorMessage}`);
    }
  }
}