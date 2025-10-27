/**
 * Message Routes
 * 
 * Defines API routes for thread messages in the Collaboration module.
 */

import { Express, Request, Response } from 'express';
import { MessageService } from '../services/message.service';
import { AuthGuard } from "@common/middleware/auth-guard";
import { z } from 'zod';
import { insertCollaborationMessageSchema } from '@geniuserp/shared/schema/collaboration.schema';
import { createModuleLogger } from "@common/logger/loki-logger";

// Create a logger instance for the message routes
const logger = createModuleLogger('MessageRoutes');

const BASE_PATH = '/api/collaboration/messages';

/**
 * Register message routes with the Express app
 * 
 * @param app Express application
 * @param messageService Message service instance
 */
export function registerMessageRoutes(app: Express, messageService: MessageService): void {
  /**
   * Get messages for a thread
   * 
   * @route GET /api/collaboration/messages
   */
  app.get(BASE_PATH, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      // const companyId = req.user.companyId;  // Unused variable
      const threadId = req.query['threadId'] as string;
      
      if (!threadId) {
        return return res.status(400).json({ message: 'threadId query parameter is required' });
      }
      
      // Extract query parameters
      // const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 50;  // Unused variable
      // const offset = req.query['offset'] ? parseInt(req.query['offset'] as string) : 0;  // Unused variable
      const sortOrder = (req.query['sortOrder'] as 'asc' | 'desc') || 'asc';
      
      const result = await messageService.getMessagesByThreadId(threadId, companyId, {
        limit,
        offset,
        sortOrder
      });
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/messages', { error });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Get replies to a message
   * 
   * @route GET /api/collaboration/messages/:id/replies
   */
  app.get(`${BASE_PATH}/:id/replies`, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      const { id } = req.params;
      // const companyId = req.user.companyId;  // Unused variable
      
      const replies = await messageService.getReplies(id, companyId);
      
      return res.status(200).json(replies);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/messages/:id/replies', { error, messageId: req.params['id'] });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Get a message by ID
   * 
   * @route GET /api/collaboration/messages/:id
   */
  app.get(`${BASE_PATH}/:id`, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      const { id } = req.params;
      // const companyId = req.user.companyId;  // Unused variable
      
      const message = await messageService.getMessageById(id, companyId);
      
      if (!message) {
        return return res.status(404).json({ message: 'Message not found' });
      }
      
      return res.status(200).json(message);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/messages/:id', { error, messageId: req.params['id'] });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Create a new message
   * 
   * @route POST /api/collaboration/messages
   */
  app.post(BASE_PATH, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      // const userId = req.user.id;  // Unused variable
      // const companyId = req.user.companyId;  // Unused variable
      
      // Validate request body
      const messageSchema = insertCollaborationMessageSchema.extend({
        companyId: z.string().uuid(),
        userId: z.string().uuid()
      });
      
      const validatedData = messageSchema.parse({
        ...req.body,
        companyId,
        userId
      });
      
      const message = await messageService.createMessage(validatedData, userId);
      
      return res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid message data', errors: error.format() });
      }
      
      logger.error('Error in POST /api/collaboration/messages', { error });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Update a message
   * 
   * @route PATCH /api/collaboration/messages/:id
   */
  app.patch(`${BASE_PATH}/:id`, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      const { id } = req.params;
      // const userId = req.user.id;  // Unused variable
      // const companyId = req.user.companyId;  // Unused variable
      
      // Validate request body (partial updates allowed)
      const updateMessageSchema = insertCollaborationMessageSchema.partial();
      const validatedData = updateMessageSchema.parse(req.body);
      
      const message = await messageService.updateMessage(id, companyId, validatedData, userId);
      
      return res.status(200).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid message data', errors: error.format() });
      }
      
      logger.error('Error in PATCH /api/collaboration/messages/:id', { error, messageId: req.params['id'] });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Delete a message
   * 
   * @route DELETE /api/collaboration/messages/:id
   */
  app.delete(`${BASE_PATH}/:id`, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      const { id } = req.params;
      // const companyId = req.user.companyId;  // Unused variable
      
      const success = await messageService.deleteMessage(id, companyId);
      
      if (!success) {
        return return res.status(404).json({ message: 'Message not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      logger.error('Error in DELETE /api/collaboration/messages/:id', { error, messageId: req.params['id'] });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
}