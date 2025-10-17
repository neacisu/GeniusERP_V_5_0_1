/**
 * Message Access Service
 * 
 * This service handles message access control operations including creating, updating,
 * retrieving, and deleting message access permissions.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { 
  messageAccess
} from '../../../../shared/schema/communications.schema';
import { Logger } from '../../../common/logger';

// Create a logger for message access operations
const logger = new Logger('MessageAccessService');

/**
 * Service for managing message access permissions
 */
export class MessageAccessService {
  constructor(private db: PostgresJsDatabase) {}

  /**
   * Grant access to a message for a user
   * 
   * @param messageId Message ID
   * @param userId User ID
   * @param companyId Company ID
   * @param permissions Access permissions
   * @returns The created access record
   */
  async grantMessageAccess(messageId: string, userId: string, companyId: string, permissions: {
    canView?: boolean;
    canReply?: boolean;
    canDelete?: boolean;
  }) {
    try {
      logger.info(`Granting access to message ${messageId} for user ${userId}`);
      
      // Check if access already exists
      const existingAccess = await this.getMessageAccess(messageId, userId, companyId);
      
      if (existingAccess) {
        // Update existing access
        return this.updateMessageAccess(messageId, userId, companyId, permissions);
      }
      
      // Create new access
      const [access] = await this.db.insert(messageAccess).values({
        messageId,
        userId,
        companyId,
        canView: permissions.canView !== undefined ? permissions.canView : true,
        canReply: permissions.canReply !== undefined ? permissions.canReply : false,
        canDelete: permissions.canDelete !== undefined ? permissions.canDelete : false
      }).returning();
      
      return access;
    } catch (error) {
      logger.error(`Failed to grant message access for message ${messageId}, user ${userId}`, error);
      throw new Error(`Failed to grant message access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get access record for a message and user
   * 
   * @param messageId Message ID
   * @param userId User ID
   * @param companyId Company ID
   * @returns The access record if found
   */
  async getMessageAccess(messageId: string, userId: string, companyId: string) {
    try {
      const result = await this.db.select()
        .from(messageAccess)
        .where(
          and(
            eq(messageAccess.messageId, messageId),
            eq(messageAccess.userId, userId),
            eq(messageAccess.companyId, companyId)
          )
        );
      
      if (result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      logger.error(`Failed to get message access for message ${messageId}, user ${userId}`, error);
      throw new Error(`Failed to get message access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update access permissions for a message and user
   * 
   * @param messageId Message ID
   * @param userId User ID
   * @param companyId Company ID
   * @param permissions Updated permissions
   * @returns The updated access record
   */
  async updateMessageAccess(messageId: string, userId: string, companyId: string, permissions: {
    canView?: boolean;
    canReply?: boolean;
    canDelete?: boolean;
  }) {
    try {
      logger.info(`Updating access to message ${messageId} for user ${userId}`);
      
      // Prepare update data
      const updateData: any = {};
      
      if (permissions.canView !== undefined) {
        updateData.canView = permissions.canView;
      }
      
      if (permissions.canReply !== undefined) {
        updateData.canReply = permissions.canReply;
      }
      
      if (permissions.canDelete !== undefined) {
        updateData.canDelete = permissions.canDelete;
      }
      
      // Add updated timestamp
      updateData.updatedAt = new Date();
      
      // Perform the update
      const [updatedAccess] = await this.db.update(messageAccess)
        .set(updateData)
        .where(
          and(
            eq(messageAccess.messageId, messageId),
            eq(messageAccess.userId, userId),
            eq(messageAccess.companyId, companyId)
          )
        )
        .returning();
      
      return updatedAccess;
    } catch (error) {
      logger.error(`Failed to update message access for message ${messageId}, user ${userId}`, error);
      throw new Error(`Failed to update message access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove access to a message for a user
   * 
   * @param messageId Message ID
   * @param userId User ID
   * @param companyId Company ID
   * @returns True if access was removed
   */
  async removeMessageAccess(messageId: string, userId: string, companyId: string) {
    try {
      logger.info(`Removing access to message ${messageId} for user ${userId}`);
      
      const result = await this.db.delete(messageAccess)
        .where(
          and(
            eq(messageAccess.messageId, messageId),
            eq(messageAccess.userId, userId),
            eq(messageAccess.companyId, companyId)
          )
        );
      
      return result && result.length > 0;
    } catch (error) {
      logger.error(`Failed to remove message access for message ${messageId}, user ${userId}`, error);
      throw new Error(`Failed to remove message access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all users with access to a message
   * 
   * @param messageId Message ID
   * @param companyId Company ID
   * @returns Array of access records
   */
  async getMessageAccessUsers(messageId: string, companyId: string) {
    try {
      return await this.db.select()
        .from(messageAccess)
        .where(
          and(
            eq(messageAccess.messageId, messageId),
            eq(messageAccess.companyId, companyId)
          )
        );
    } catch (error) {
      logger.error(`Failed to get users with access to message ${messageId}`, error);
      throw new Error(`Failed to get message access users: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a user has specific permissions for a message
   * 
   * @param messageId Message ID
   * @param userId User ID
   * @param companyId Company ID
   * @param permission The permission to check
   * @returns True if the user has the permission
   */
  async checkMessagePermission(messageId: string, userId: string, companyId: string, permission: 'view' | 'reply' | 'delete') {
    try {
      const access = await this.getMessageAccess(messageId, userId, companyId);
      
      if (!access) {
        return false;
      }
      
      switch (permission) {
        case 'view':
          return access.canView;
        case 'reply':
          return access.canReply;
        case 'delete':
          return access.canDelete;
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Failed to check permission '${permission}' for message ${messageId}, user ${userId}`, error);
      return false;
    }
  }

  /**
   * Bulk grant message access to multiple users
   * 
   * @param messageId Message ID
   * @param userIds Array of user IDs
   * @param companyId Company ID
   * @param permissions Access permissions
   * @returns Array of created access records
   */
  async bulkGrantMessageAccess(messageId: string, userIds: string[], companyId: string, permissions: {
    canView?: boolean;
    canReply?: boolean;
    canDelete?: boolean;
  }) {
    try {
      logger.info(`Bulk granting access to message ${messageId} for ${userIds.length} users`);
      
      const results = [];
      
      // Process each user individually to handle existing access
      for (const userId of userIds) {
        const access = await this.grantMessageAccess(messageId, userId, companyId, permissions);
        results.push(access);
      }
      
      return results;
    } catch (error) {
      logger.error(`Failed to bulk grant message access for message ${messageId}`, error);
      throw new Error(`Failed to bulk grant message access: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}