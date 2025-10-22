/**
 * Messages Controller
 * 
 * Handles API endpoints for message operations in the Communications module
 */

import { Response } from 'express';
import { Logger } from "@common/logger";
import { MessagesService } from '../services/messages.service';
import { MessageDirection, MessageStatus } from '../../../../shared/schema/communications.schema';
import { AuthenticatedRequest } from '../../../types/express';

export class MessagesController {
  private _logger: Logger;
  
  constructor(
    private messagesService: MessagesService
  ) {
    this._logger = new Logger('MessagesController');
  }
  
  /**
   * Create a new message
   */
  async createMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const { companyId } = req.user!;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }
      
      const messageData = {
        ...req.body,
        threadId,
        companyId
      };
      
      const message = await this.messagesService.createMessage(
        threadId,
        companyId,
        messageData
      );
      
      res.status(201).json(message);
    } catch (error) {
      this._logger.error('Failed to create message', { error });
      res.status(500).json({ 
        error: 'Failed to create message',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Get messages for a thread
   */
  async getThreadMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { threadId } = req.params;
      const { companyId } = req.user!;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }
      
      const { 
        direction, 
        status, 
        limit, 
        offset 
      } = req.query;
      
      // Build filter object
      const filter: any = {};
      
      if (direction) {
        filter.direction = direction as MessageDirection;
      }
      
      if (status) {
        filter.status = status as MessageStatus;
      }
      
      if (limit) {
        filter.limit = parseInt(limit as string, 10);
      }
      
      if (offset) {
        filter.offset = parseInt(offset as string, 10);
      }
      
      const messages = await this.messagesService.getThreadMessages(
        threadId, 
        companyId,
        filter
      );
      
      res.json(messages);
    } catch (error) {
      this._logger.error('Failed to get thread messages', { error });
      res.status(500).json({ 
        error: 'Failed to get thread messages',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Get message by ID
   */
  async getMessageById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { companyId } = req.user!;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }
      
      const message = await this.messagesService.getMessageById(messageId, companyId);
      
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      
      res.json(message);
    } catch (error) {
      this._logger.error('Failed to get message', { error });
      res.status(500).json({ 
        error: 'Failed to get message',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Update a message
   */
  async updateMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { companyId, userId } = req.user!;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }
      
      const updateData = {
        ...req.body,
        updatedBy: userId
      };
      
      const message = await this.messagesService.updateMessage(
        messageId,
        companyId,
        updateData
      );
      
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      
      res.json(message);
    } catch (error) {
      this._logger.error('Failed to update message', { error });
      res.status(500).json({ 
        error: 'Failed to update message',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Mark a message as read
   */
  async markMessageAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { companyId, userId } = req.user!;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      
      const message = await this.messagesService.markMessageAsRead(
        messageId,
        companyId,
        userId
      );
      
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      
      res.json(message);
    } catch (error) {
      this._logger.error('Failed to mark message as read', { error });
      res.status(500).json({ 
        error: 'Failed to mark message as read',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Delete a message
   */
  async deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      const { companyId } = req.user!;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }
      
      const success = await this.messagesService.deleteMessage(messageId, companyId);
      
      if (!success) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      this._logger.error('Failed to delete message', { error });
      res.status(500).json({ 
        error: 'Failed to delete message',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Search messages
   */
  async searchMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { companyId } = req.user!;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }
      
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }
      
      const messages = await this.messagesService.searchMessages(companyId, query);
      
      res.json(messages);
    } catch (error) {
      this._logger.error('Failed to search messages', { error });
      res.status(500).json({ 
        error: 'Failed to search messages',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

/**
 * Factory function to create a messages controller
 * This provides compatibility with both class-based and functional patterns
 */
export function createMessagesController(messagesService: MessagesService) {
  const controller = new MessagesController(messagesService);
  
  return {
    createMessage: controller.createMessage.bind(controller),
    getThreadMessages: controller.getThreadMessages.bind(controller),
    getMessageById: controller.getMessageById.bind(controller),
    updateMessage: controller.updateMessage.bind(controller),
    markMessageAsRead: controller.markMessageAsRead.bind(controller),
    deleteMessage: controller.deleteMessage.bind(controller),
    searchMessages: controller.searchMessages.bind(controller)
  };
}