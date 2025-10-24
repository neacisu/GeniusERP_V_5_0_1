/**
 * Thread Access Service
 * 
 * This service handles thread access control operations including creating, updating,
 * retrieving, and deleting thread access permissions.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { 
  threadAccess
} from '../../../../shared/schema/communications.schema';
import { createModuleLogger } from "@common/logger/loki-logger";

// Create a logger for thread access operations
const logger = createModuleLogger('ThreadAccessService');

/**
 * Service for managing thread access permissions
 */
export class ThreadAccessService {
  constructor(private db: PostgresJsDatabase) {}

  /**
   * Grant access to a thread for a user
   * 
   * @param threadId Thread ID
   * @param userId User ID
   * @param companyId Company ID
   * @param permissions Access permissions
   * @returns The created access record
   */
  async grantThreadAccess(threadId: string, userId: string, companyId: string, permissions: {
    canView?: boolean;
    canReply?: boolean;
    canAssign?: boolean;
    canDelete?: boolean;
  }) {
    try {
      logger.info(`Granting access to thread ${threadId} for user ${userId}`);
      
      // Check if access already exists
      const existingAccess = await this.getThreadAccess(threadId, userId, companyId);
      
      if (existingAccess) {
        // Update existing access
        return this.updateThreadAccess(threadId, userId, companyId, permissions);
      }
      
      // Create new access
      const [access] = await this.db.insert(threadAccess).values({
        threadId,
        userId,
        companyId,
        canView: permissions.canView !== undefined ? permissions.canView : true,
        canReply: permissions.canReply !== undefined ? permissions.canReply : false,
        canAssign: permissions.canAssign !== undefined ? permissions.canAssign : false,
        canDelete: permissions.canDelete !== undefined ? permissions.canDelete : false
      }).returning();
      
      return access;
    } catch (error) {
      logger.error(`Failed to grant thread access for thread ${threadId}, user ${userId}`, error);
      throw new Error(`Failed to grant thread access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get access record for a thread and user
   * 
   * @param threadId Thread ID
   * @param userId User ID
   * @param companyId Company ID
   * @returns The access record if found
   */
  async getThreadAccess(threadId: string, userId: string, companyId: string) {
    try {
      const result = await this.db.select()
        .from(threadAccess)
        .where(
          and(
            eq(threadAccess.threadId, threadId),
            eq(threadAccess.userId, userId),
            eq(threadAccess.companyId, companyId)
          )
        );
      
      if (result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      logger.error(`Failed to get thread access for thread ${threadId}, user ${userId}`, error);
      throw new Error(`Failed to get thread access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update access permissions for a thread and user
   * 
   * @param threadId Thread ID
   * @param userId User ID
   * @param companyId Company ID
   * @param permissions Updated permissions
   * @returns The updated access record
   */
  async updateThreadAccess(threadId: string, userId: string, companyId: string, permissions: {
    canView?: boolean;
    canReply?: boolean;
    canAssign?: boolean;
    canDelete?: boolean;
  }) {
    try {
      logger.info(`Updating access to thread ${threadId} for user ${userId}`);
      
      // Prepare update data
      const updateData: any = {};
      
      if (permissions.canView !== undefined) {
        updateData.canView = permissions.canView;
      }
      
      if (permissions.canReply !== undefined) {
        updateData.canReply = permissions.canReply;
      }
      
      if (permissions.canAssign !== undefined) {
        updateData.canAssign = permissions.canAssign;
      }
      
      if (permissions.canDelete !== undefined) {
        updateData.canDelete = permissions.canDelete;
      }
      
      // Add updated timestamp
      updateData.updatedAt = new Date();
      
      // Perform the update
      const [updatedAccess] = await this.db.update(threadAccess)
        .set(updateData)
        .where(
          and(
            eq(threadAccess.threadId, threadId),
            eq(threadAccess.userId, userId),
            eq(threadAccess.companyId, companyId)
          )
        )
        .returning();
      
      return updatedAccess;
    } catch (error) {
      logger.error(`Failed to update thread access for thread ${threadId}, user ${userId}`, error);
      throw new Error(`Failed to update thread access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove access to a thread for a user
   * 
   * @param threadId Thread ID
   * @param userId User ID
   * @param companyId Company ID
   * @returns True if access was removed
   */
  async removeThreadAccess(threadId: string, userId: string, companyId: string) {
    try {
      logger.info(`Removing access to thread ${threadId} for user ${userId}`);
      
      const result = await this.db.delete(threadAccess)
        .where(
          and(
            eq(threadAccess.threadId, threadId),
            eq(threadAccess.userId, userId),
            eq(threadAccess.companyId, companyId)
          )
        );
      
      return result && result.length > 0;
    } catch (error) {
      logger.error(`Failed to remove thread access for thread ${threadId}, user ${userId}`, error);
      throw new Error(`Failed to remove thread access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all users with access to a thread
   * 
   * @param threadId Thread ID
   * @param companyId Company ID
   * @returns Array of access records
   */
  async getThreadAccessUsers(threadId: string, companyId: string) {
    try {
      return await this.db.select()
        .from(threadAccess)
        .where(
          and(
            eq(threadAccess.threadId, threadId),
            eq(threadAccess.companyId, companyId)
          )
        );
    } catch (error) {
      logger.error(`Failed to get users with access to thread ${threadId}`, error);
      throw new Error(`Failed to get thread access users: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a user has specific permissions for a thread
   * 
   * @param threadId Thread ID
   * @param userId User ID
   * @param companyId Company ID
   * @param permission The permission to check
   * @returns True if the user has the permission
   */
  async checkThreadPermission(threadId: string, userId: string, companyId: string, permission: 'view' | 'reply' | 'assign' | 'delete') {
    try {
      const access = await this.getThreadAccess(threadId, userId, companyId);
      
      if (!access) {
        return false;
      }
      
      switch (permission) {
        case 'view':
          return access.canView;
        case 'reply':
          return access.canReply;
        case 'assign':
          return access.canAssign;
        case 'delete':
          return access.canDelete;
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Failed to check permission '${permission}' for thread ${threadId}, user ${userId}`, error);
      return false;
    }
  }
}