/**
 * Thread Access Controller
 * 
 * This controller handles HTTP requests related to thread access permissions.
 * It isolates business logic from the request/response handling.
 */

import { Request, Response } from 'express';
import { ThreadAccessService } from '../services/thread-access.service';
import { createModuleLogger } from "@common/logger/loki-logger";

// Create a logger for the thread access controller
const logger = createModuleLogger('ThreadAccessController');

/**
 * Controller for thread access permissions
 */
export class ThreadAccessController {
  constructor(private threadAccessService: ThreadAccessService) {}

  /**
   * Get users with access to a thread
   */
  async getThreadAccessUsers(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const accessRecords = await this.threadAccessService.getThreadAccessUsers(threadId, companyId);
      
      return res.json(accessRecords);
    } catch (error) {
      logger.error(`Error getting access records for thread ${req.params.threadId}`, error);
      return res.status(500).json({ 
        message: 'Failed to get thread access records',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get access record for a specific user and thread
   */
  async getThreadAccess(req: Request, res: Response) {
    try {
      const { threadId, userId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const accessRecord = await this.threadAccessService.getThreadAccess(threadId, userId, companyId);
      
      if (!accessRecord) {
        return res.status(404).json({ message: 'Access record not found' });
      }
      
      return res.json(accessRecord);
    } catch (error) {
      logger.error(`Error getting access record for thread ${req.params.threadId} and user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to get thread access record',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Grant access to a thread for a user
   */
  async grantThreadAccess(req: Request, res: Response) {
    try {
      const { threadId, userId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const accessRecord = await this.threadAccessService.grantThreadAccess(threadId, userId, companyId, {
        canView: req.body.canView,
        canReply: req.body.canReply,
        canAssign: req.body.canAssign,
        canDelete: req.body.canDelete
      });
      
      return res.status(201).json(accessRecord);
    } catch (error) {
      logger.error(`Error granting access to thread ${req.params.threadId} for user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to grant thread access',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update thread access permissions
   */
  async updateThreadAccess(req: Request, res: Response) {
    try {
      const { threadId, userId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Check if access record exists
      const existingAccess = await this.threadAccessService.getThreadAccess(threadId, userId, companyId);
      if (!existingAccess) {
        return res.status(404).json({ message: 'Access record not found' });
      }
      
      const updatedAccess = await this.threadAccessService.updateThreadAccess(threadId, userId, companyId, {
        canView: req.body.canView,
        canReply: req.body.canReply,
        canAssign: req.body.canAssign,
        canDelete: req.body.canDelete
      });
      
      return res.json(updatedAccess);
    } catch (error) {
      logger.error(`Error updating access for thread ${req.params.threadId} and user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to update thread access',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Remove thread access for a user
   */
  async removeThreadAccess(req: Request, res: Response) {
    try {
      const { threadId, userId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const removed = await this.threadAccessService.removeThreadAccess(threadId, userId, companyId);
      
      if (!removed) {
        return res.status(404).json({ message: 'Access record not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error removing access from thread ${req.params.threadId} for user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to remove thread access',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Check if user has a specific permission for a thread
   */
  async checkThreadPermission(req: Request, res: Response) {
    try {
      const { threadId, userId } = req.params;
      const companyId = req.user?.companyId;
      const permission = req.params.permission as 'view' | 'reply' | 'assign' | 'delete';
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      if (!['view', 'reply', 'assign', 'delete'].includes(permission)) {
        return res.status(400).json({ message: 'Invalid permission type' });
      }
      
      const hasPermission = await this.threadAccessService.checkThreadPermission(
        threadId, 
        userId, 
        companyId,
        permission
      );
      
      return res.json({ hasPermission });
    } catch (error) {
      logger.error(`Error checking permission for thread ${req.params.threadId} and user ${req.params.userId}`, error);
      return res.status(500).json({ 
        message: 'Failed to check thread permission',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}