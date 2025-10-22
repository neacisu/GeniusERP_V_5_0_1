/**
 * Permission Query Service
 * 
 * Provides specialized database query operations for permission entities
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../../../common/logger';
import { BaseDrizzleService } from '../../core/base-drizzle.service';
import { eq, and } from 'drizzle-orm';
import { permissions, rolePermissions } from '@shared/schema/admin.schema';

// Create a logger for permission query operations
const logger = new Logger('PermissionQueryService');

/**
 * Service that handles permission query operations
 */
export class PermissionQueryService extends BaseDrizzleService {
  /**
   * Get all permissions
   * 
   * @returns Array of permissions
   */
  async getPermissions(): Promise<any[]> {
    const context = 'getPermissions';
    try {
      logger.debug(`[${context}] Getting all permissions`);
      
      return await this.query(async (db) => {
        const result = await db.select().from(permissions);
        logger.debug(`[${context}] Retrieved ${result.length} permissions`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get permissions`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      logger.error(`[${context}] Stack trace: ${errorStack || "N/A"}`);
      throw new Error(`Failed to retrieve permissions: ${errorMessage}`);
    }
  }
  
  /**
   * Get permission by ID
   * 
   * @param permissionId Permission ID
   * @returns Permission object or null if not found
   */
  async getPermissionById(permissionId: string): Promise<any | null> {
    const context = 'getPermissionById';
    try {
      logger.debug(`[${context}] Getting permission by ID: ${permissionId}`);
      
      return await this.query(async (db) => {
        const result = await db
          .select()
          .from(permissions)
          .where(eq(permissions.id, permissionId))
          .limit(1);
        
        if (!result || result.length === 0) {
          logger.debug(`[${context}] No permission found with ID: ${permissionId}`);
          return null;
        }
        
        logger.debug(`[${context}] Permission found with ID: ${permissionId}`);
        return result[0];
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get permission by ID: ${permissionId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      logger.error(`[${context}] Stack trace: ${errorStack || "N/A"}`);
      throw new Error(`Failed to retrieve permission: ${errorMessage}`);
    }
  }
  
  /**
   * Get permission by resource and action
   * 
   * @param resource Resource name
   * @param action Action name
   * @returns Permission object or null if not found
   */
  async getPermissionByResourceAction(resource: string, action: string): Promise<any | null> {
    const context = 'getPermissionByResourceAction';
    try {
      logger.debug(`[${context}] Getting permission for resource: ${resource}, action: ${action}`);
      
      return await this.query(async (db) => {
        const result = await db
          .select()
          .from(permissions)
          .where(
            and(
              eq(permissions.resource, resource),
              eq(permissions.action, action)
            )
          )
          .limit(1);
        
        if (!result || result.length === 0) {
          logger.debug(`[${context}] No permission found for resource: ${resource}, action: ${action}`);
          return null;
        }
        
        logger.debug(`[${context}] Permission found for resource: ${resource}, action: ${action}`);
        return result[0];
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get permission for resource: ${resource}, action: ${action}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      logger.error(`[${context}] Stack trace: ${errorStack || "N/A"}`);
      throw new Error(`Failed to retrieve permission by resource and action: ${errorMessage}`);
    }
  }
  
  /**
   * Get permissions by resource
   * 
   * @param resource Resource name
   * @returns Array of permissions
   */
  async getPermissionsByResource(resource: string): Promise<any[]> {
    const context = 'getPermissionsByResource';
    try {
      logger.debug(`[${context}] Getting permissions for resource: ${resource}`);
      
      return await this.query(async (db) => {
        const result = await db
          .select()
          .from(permissions)
          .where(eq(permissions.resource, resource));
        
        logger.debug(`[${context}] Retrieved ${result.length} permissions for resource: ${resource}`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get permissions for resource: ${resource}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      logger.error(`[${context}] Stack trace: ${errorStack || "N/A"}`);
      throw new Error(`Failed to retrieve permissions by resource: ${errorMessage}`);
    }
  }
}