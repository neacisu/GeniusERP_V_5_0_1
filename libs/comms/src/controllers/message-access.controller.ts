/**
 * Message Access Controller
 * 
 * This controller handles HTTP requests related to message access permissions.
 * It isolates business logic from the request/response handling.
 */

import { Request, Response } from 'express';
import { MessageAccessService } from '../services/message-access.service';
import { Logger } from "@common/logger";

// Create a logger for the message access controller
const logger = new Logger('MessageAccessController');

/**
 * Controller for message access permissions
 */
export class MessageAccessController {
  constructor(private messageAccessService: MessageAccessService) {}

  /**
   * Get users with access to a message
   */
  async getMessageAccessUsers(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const accessRecords = await this.messageAccessService.getMessageAccessUsers(messageId, companyId);
      
      return res.json(accessRecords);
    } catch (error) {
      logger.error(`Error getting access records for message ${req.params.messageId}`, error);
      return res.status(500).json({ 
        message: 'Failed to get message access records',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get access record for a specific user and message
   */
  async getMessageAccess(req: Request, res: Response) {
    try {
      const { messageId, userId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const accessRecord = await this.messageAccessService.getMessageAccess(messageId, userId, companyId);
      
      if (!accessRecord) {
        return res.status(404).json({ message: 'Access record not found' });
      }
      
      return res.json(accessRecord);
    } catch (error) {
      logger.error(`Error getting access record for message ${req.params.messageId} and user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to get message access record',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Grant access to a message for a user
   */
  async grantMessageAccess(req: Request, res: Response) {
    try {
      const { messageId, userId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const accessRecord = await this.messageAccessService.grantMessageAccess(messageId, userId, companyId, {
        canView: req.body.canView,
        canReply: req.body.canReply,
        canDelete: req.body.canDelete
      });
      
      return res.status(201).json(accessRecord);
    } catch (error) {
      logger.error(`Error granting access to message ${req.params.messageId} for user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to grant message access',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update message access permissions
   */
  async updateMessageAccess(req: Request, res: Response) {
    try {
      const { messageId, userId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Check if access record exists
      const existingAccess = await this.messageAccessService.getMessageAccess(messageId, userId, companyId);
      if (!existingAccess) {
        return res.status(404).json({ message: 'Access record not found' });
      }
      
      const updatedAccess = await this.messageAccessService.updateMessageAccess(messageId, userId, companyId, {
        canView: req.body.canView,
        canReply: req.body.canReply,
        canDelete: req.body.canDelete
      });
      
      return res.json(updatedAccess);
    } catch (error) {
      logger.error(`Error updating access for message ${req.params.messageId} and user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to update message access',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Remove message access for a user
   */
  async removeMessageAccess(req: Request, res: Response) {
    try {
      const { messageId, userId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const removed = await this.messageAccessService.removeMessageAccess(messageId, userId, companyId);
      
      if (!removed) {
        return res.status(404).json({ message: 'Access record not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error removing access from message ${req.params.messageId} for user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to remove message access',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check if user has a specific permission for a message
   */
  async checkMessagePermission(req: Request, res: Response) {
    try {
      const { messageId, userId } = req.params;
      const companyId = req.user?.companyId;
      const permission = req.params.permission as 'view' | 'reply' | 'delete';
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      if (!['view', 'reply', 'delete'].includes(permission)) {
        return res.status(400).json({ message: 'Invalid permission type' });
      }
      
      const hasPermission = await this.messageAccessService.checkMessagePermission(
        messageId, 
        userId, 
        companyId,
        permission
      );
      
      return res.json({ hasPermission });
    } catch (error) {
      logger.error(`Error checking permission for message ${req.params.messageId} and user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to check message permission',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Bulk grant access to multiple users for a message
   */
  async bulkGrantMessageAccess(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      if (!req.body.userIds || !Array.isArray(req.body.userIds) || req.body.userIds.length === 0) {
        return res.status(400).json({ message: 'userIds array is required' });
      }
      
      const accessRecords = await this.messageAccessService.bulkGrantMessageAccess(
        messageId,
        req.body.userIds,
        companyId,
        {
          canView: req.body.canView,
          canReply: req.body.canReply,
          canDelete: req.body.canDelete
        }
      );
      
      return res.status(201).json(accessRecords);
    } catch (error) {
      logger.error(`Error bulk granting access to message ${req.params.messageId}`, error);
      return res.status(500).json({ 
        message: 'Failed to grant bulk message access',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}