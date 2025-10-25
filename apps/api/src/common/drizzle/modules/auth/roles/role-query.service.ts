/**
 * Role Query Service
 * 
 * Provides specialized database query operations for role entities
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../../../common/logger';
import { BaseDrizzleService } from '../../core/base-drizzle.service';
import { eq, and } from 'drizzle-orm';
import { roles, userRoles } from '@geniuserp/shared';

// Create a logger for role query operations
const logger = new Logger('RoleQueryService');

/**
 * Service that handles role query operations
 */
export class RoleQueryService extends BaseDrizzleService {
  /**
   * Get all roles, optionally filtered by company ID
   * 
   * @param companyId Optional company ID filter
   * @returns Array of roles
   */
  async getRoles(companyId?: string): Promise<any[]> {
    const context = 'getRoles';
    try {
      logger.debug(`[${context}] Getting roles${companyId ? ` for company ${companyId}` : ''}`);
      
      return await this.query(async (db) => {
        logger.debug(`[${context}] Retrieving roles${companyId ? ` for company ${companyId}` : ''}`);
        
        // Build query directly to avoid Drizzle type mismatch
        const result = companyId
          ? await db.select().from(roles).where(eq(roles.companyId, companyId))
          : await db.select().from(roles);
        
        logger.debug(`[${context}] Retrieved ${result.length} roles`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get roles${companyId ? ` for company ${companyId}` : ''}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve roles: ${errorMessage}`);
    }
  }
  
  /**
   * Get a role by ID
   * 
   * @param roleId Role ID
   * @returns Role object or null if not found
   */
  async getRoleById(roleId: string): Promise<any | null> {
    const context = 'getRoleById';
    try {
      logger.debug(`[${context}] Getting role by ID: ${roleId}`);
      
      return await this.query(async (db) => {
        // Prepare query
        logger.debug(`[${context}] Preparing query for role ID: ${roleId}`);
        const result = await db
          .select()
          .from(roles)
          .where(eq(roles.id, roleId))
          .limit(1);
        
        // Process result
        if (!result || result.length === 0) {
          logger.debug(`[${context}] No role found with ID: ${roleId}`);
          return null;
        }
        
        logger.debug(`[${context}] Role found with ID: ${roleId}, name: ${result[0].name}`);
        return result[0];
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get role by ID: ${roleId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve role: ${errorMessage}`);
    }
  }
  
  /**
   * Get a role by name and company ID
   * 
   * @param name Role name
   * @param companyId Company ID
   * @returns Role object or null if not found
   */
  async getRoleByName(name: string, companyId: string): Promise<any | null> {
    const context = 'getRoleByName';
    try {
      logger.debug(`[${context}] Getting role by name: ${name} for company: ${companyId}`);
      
      return await this.query(async (db) => {
        // Prepare query
        logger.debug(`[${context}] Preparing query for role name: ${name}, company: ${companyId}`);
        const result = await db
          .select()
          .from(roles)
          .where(
            and(
              eq(roles.name, name),
              eq(roles.companyId, companyId)
            )
          )
          .limit(1);
        
        // Process result
        if (!result || result.length === 0) {
          logger.debug(`[${context}] No role found with name: ${name} for company: ${companyId}`);
          return null;
        }
        
        logger.debug(`[${context}] Role found with name: ${name}, ID: ${result[0].id}`);
        return result[0];
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get role by name: ${name} for company: ${companyId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve role by name: ${errorMessage}`);
    }
  }
  
  /**
   * Get all roles assigned to a user
   * 
   * @param userId User ID
   * @returns Array of roles
   */
  async getUserRoles(userId: string): Promise<any[]> {
    const context = 'getUserRoles';
    try {
      logger.debug(`[${context}] Getting roles for user with ID: ${userId}`);
      
      return await this.query(async (db) => {
        // Use a join to get the role details
        logger.debug(`[${context}] Preparing join query for user roles: ${userId}`);
        const result = await db
          .select({
            id: roles.id,
            name: roles.name,
            description: roles.description,
            companyId: roles.companyId,
            createdAt: roles.createdAt,
            updatedAt: roles.updatedAt
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, userId));
        
        logger.debug(`[${context}] Retrieved ${result.length} roles for user ${userId}`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get roles for user with ID: ${userId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve user roles: ${errorMessage}`);
    }
  }
}