/**
 * Message Controller
 * 
 * Handles HTTP requests related to messages in the Collaboration module.
 */
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { createModuleLogger } from "@common/logger/loki-logger";
import { MessageDrizzleService } from "@common/drizzle/modules/collab/message-service";
import { insertCollaborationMessageSchema } from '@geniuserp/shared/schema/collaboration.schema';

// Create module logger
const logger = createModuleLogger('CollabMessageController');

export class MessageController {
  constructor(private readonly messageService: MessageDrizzleService) {}

  /**
   * Register routes for the Message controller
   * 
   * @param router Express router
   */
  registerRoutes(router: Router): void {
    router.get('/thread/:threadId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getMessagesByThread.bind(this));
    router.get('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getMessageById.bind(this));
    router.post('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.createMessage.bind(this));
    router.patch('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateMessage.bind(this));
    router.delete('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.deleteMessage.bind(this));
  }

  /**
   * Get messages for a specific thread
   */
  async getMessagesByThread(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { threadId } = req.params;
      // const companyId = req.user.companyId;  // Unused variable
      
      // Parse query parameters
      // const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 20;  // Unused variable
      // const offset = req.query['offset'] ? parseInt(req.query['offset'] as string, 10) : 0;  // Unused variable
      
      const messages = await this.messageService.getMessagesByThreadId(threadId, companyId, { limit, offset });
      
      res.status(200).json(messages);
    } catch (error) {
      logger.error(`Error in GET /messages/thread/:threadId - ThreadId: ${req.params['threadId']}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get a message by ID
   */
  async getMessageById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      // const companyId = req.user.companyId;  // Unused variable
      
      const message = await this.messageService.getMessageById(id, companyId);
      
      if (!message) {
        res.status(404).json({ message: 'Message not found' });
        return;
      }
      
      res.status(200).json(message);
    } catch (error) {
      logger.error(`Error in GET /messages/:id - MessageId: ${req.params['id']}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create a new message
   */
  async createMessage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // const userId = req.user.id;  // Unused variable
      // const companyId = req.user.companyId;  // Unused variable
      
      // Validate request body
      const messageSchema = insertCollaborationMessageSchema.extend({
        companyId: z.string().uuid(),
        createdBy: z.string().uuid(),
      });
      
      const validatedData = messageSchema.parse({
        ...req.body,
        companyId,
        createdBy: userId,
      });
      
      const message = await this.messageService.createMessage(validatedData, userId);
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid message data', errors: error.format() });
        return;
      }
      
      logger.error('Error in POST /messages', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update a message
   */
  async updateMessage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      // const userId = req.user.id;  // Unused variable
      // const companyId = req.user.companyId;  // Unused variable
      
      // Validate request body (partial updates allowed)
      const updateMessageSchema = insertCollaborationMessageSchema.partial();
      const validatedData = updateMessageSchema.parse(req.body);
      
      const message = await this.messageService.updateMessage(id, companyId, validatedData, userId);
      
      if (!message) {
        res.status(404).json({ message: 'Message not found or you are not authorized to edit it' });
        return;
      }
      
      res.status(200).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid message data', errors: error.format() });
        return;
      }
      
      logger.error(`Error in PATCH /messages/:id - MessageId: ${req.params['id']}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      // const userId = req.user.id;  // Unused variable
      // const companyId = req.user.companyId;  // Unused variable
      
      const success = await this.messageService.deleteMessage(id, companyId);
      
      if (!success) {
        res.status(404).json({ message: 'Message not found or you are not authorized to delete it' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error(`Error in DELETE /messages/:id - MessageId: ${req.params['id']}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const createMessageController = (messageService: MessageDrizzleService): MessageController => {
  return new MessageController(messageService);
};