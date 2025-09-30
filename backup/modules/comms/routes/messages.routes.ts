/**
 * Messages Router
 * 
 * This router handles HTTP requests related to messages.
 */

import express, { Router, Request, Response } from 'express';
import { MessagesService } from '../services/messages.service';
import { requireAuth } from '../../../common/middleware/auth-guard';
import { Logger } from '../../../common/logger';
import { MessageDirection, MessageStatus } from '../../../../shared/schema/communications.schema';

// Create a logger for the messages routes
const logger = new Logger('MessagesRouter');

/**
 * Router for messages endpoints
 */
export class MessagesRouter {
  private router: Router;
  
  constructor(private messagesService: MessagesService) {
    this.router = express.Router();
    this.setupRoutes();
  }
  
  /**
   * Set up the routes for the router
   */
  private setupRoutes() {
    // Get messages for a thread
    this.router.get('/thread/:threadId', requireAuth(), this.getThreadMessages.bind(this));
    
    // Get a specific message
    this.router.get('/:messageId', requireAuth(), this.getMessage.bind(this));
    
    // Create a new message
    this.router.post('/thread/:threadId', requireAuth(), this.createMessage.bind(this));
    
    // Update a message
    this.router.patch('/:messageId', requireAuth(), this.updateMessage.bind(this));
    
    // Mark a message as read
    this.router.patch('/:messageId/read', requireAuth(), this.markAsRead.bind(this));
    
    // Delete a message
    this.router.delete('/:messageId', requireAuth(), this.deleteMessage.bind(this));
    
    // Search messages
    this.router.get('/search', requireAuth(), this.searchMessages.bind(this));
  }
  
  /**
   * Get the configured router
   * @returns Express Router
   */
  public getRouter(): Router {
    return this.router;
  }
  
  /**
   * Handler for GET /messages/thread/:threadId
   */
  private async getThreadMessages(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Extract filter options from query params
      const filter: any = {};
      
      if (req.query.direction) {
        filter.direction = req.query.direction as MessageDirection;
      }
      
      if (req.query.status) {
        filter.status = req.query.status as MessageStatus;
      }
      
      // Pagination
      if (req.query.limit) {
        filter.limit = parseInt(req.query.limit as string, 10);
      }
      
      if (req.query.offset) {
        filter.offset = parseInt(req.query.offset as string, 10);
      }
      
      const messages = await this.messagesService.getThreadMessages(threadId, companyId, filter);
      
      return res.json(messages);
    } catch (error) {
      logger.error(`Error getting messages for thread ${req.params.threadId}`, error);
      return res.status(500).json({ 
        error: 'Failed to get messages',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for GET /messages/:messageId
   */
  private async getMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      const message = await this.messagesService.getMessageById(messageId, companyId);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      return res.json(message);
    } catch (error) {
      logger.error(`Error getting message ${req.params.messageId}`, error);
      return res.status(500).json({ 
        error: 'Failed to get message',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for POST /messages/thread/:threadId
   */
  private async createMessage(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Validate required fields
      if (!req.body.channel) {
        return res.status(400).json({ error: 'Channel is required' });
      }
      
      if (!req.body.direction) {
        return res.status(400).json({ error: 'Direction is required' });
      }
      
      if (!req.body.body) {
        return res.status(400).json({ error: 'Message body is required' });
      }
      
      // Create the message
      const message = await this.messagesService.createMessage(threadId, companyId, {
        channel: req.body.channel,
        direction: req.body.direction,
        status: req.body.status,
        fromEmail: req.body.fromEmail,
        fromName: req.body.fromName,
        fromPhone: req.body.fromPhone,
        toEmail: req.body.toEmail,
        toName: req.body.toName,
        toPhone: req.body.toPhone,
        subject: req.body.subject,
        body: req.body.body,
        bodyHtml: req.body.bodyHtml,
        sentiment: req.body.sentiment,
        sentimentScore: req.body.sentimentScore,
        externalMessageId: req.body.externalMessageId,
        externalConversationId: req.body.externalConversationId,
        isFlagged: req.body.isFlagged,
        metadata: req.body.metadata,
        createdBy: userId
      });
      
      return res.status(201).json(message);
    } catch (error) {
      logger.error(`Error creating message in thread ${req.params.threadId}`, error);
      return res.status(500).json({ 
        error: 'Failed to create message',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for PATCH /messages/:messageId
   */
  private async updateMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Check if message exists
      const message = await this.messagesService.getMessageById(messageId, companyId);
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      // Update the message
      const updatedMessage = await this.messagesService.updateMessage(messageId, companyId, {
        status: req.body.status,
        sentiment: req.body.sentiment,
        sentimentScore: req.body.sentimentScore,
        isFlagged: req.body.isFlagged,
        readAt: req.body.readAt,
        deliveredAt: req.body.deliveredAt,
        metadata: req.body.metadata,
        updatedBy: userId
      });
      
      return res.json(updatedMessage);
    } catch (error) {
      logger.error(`Error updating message ${req.params.messageId}`, error);
      return res.status(500).json({ 
        error: 'Failed to update message',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for PATCH /messages/:messageId/read
   */
  private async markAsRead(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId || !userId) {
        return res.status(400).json({ error: 'Missing company ID or user ID' });
      }
      
      const updatedMessage = await this.messagesService.markMessageAsRead(messageId, companyId, userId);
      
      return res.json(updatedMessage);
    } catch (error) {
      logger.error(`Error marking message ${req.params.messageId} as read`, error);
      return res.status(500).json({ 
        error: 'Failed to mark message as read',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for DELETE /messages/:messageId
   */
  private async deleteMessage(req: Request, res: Response) {
    try {
      const { messageId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Delete the message
      const deleted = await this.messagesService.deleteMessage(messageId, companyId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Message not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting message ${req.params.messageId}`, error);
      return res.status(500).json({ 
        error: 'Failed to delete message',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for GET /messages/search
   */
  private async searchMessages(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const query = req.query.q as string;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }
      
      const messages = await this.messagesService.searchMessages(companyId, query);
      
      return res.json(messages);
    } catch (error) {
      logger.error('Error searching messages', error);
      return res.status(500).json({ 
        error: 'Failed to search messages',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}