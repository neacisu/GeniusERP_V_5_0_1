/**
 * Thread Routes
 * 
 * Defines API routes for discussion threads in the Collaboration module.
 */

import { Express, Request, Response } from 'express';
import { ThreadService } from '../services/thread.service';
import { AuthGuard } from "@common/middleware/auth-guard";
import { z } from 'zod';
import { insertCollaborationThreadSchema } from '@geniuserp/shared/schema/collaboration.schema';
import { createModuleLogger } from "@common/logger/loki-logger";

const BASE_PATH = '/api/collaboration/threads';

// Create a logger instance for the thread routes
const logger = createModuleLogger('ThreadRoutes');

/**
 * Register thread routes with the Express app
 * 
 * @param app Express application
 * @param threadService Thread service instance
 */
export function registerThreadRoutes(app: Express, threadService: ThreadService): void {
  /**
   * Get all threads for a company
   * 
   * @route GET /api/collaboration/threads
   */
  app.get(BASE_PATH, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      // const companyId = req.user.companyId;  // Unused variable
      
      // Extract query parameters
      // const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 20;  // Unused variable
      // const offset = req.query['offset'] ? parseInt(req.query['offset'] as string) : 0;  // Unused variable
      const category = req.query['category'] as string | undefined;
      const search = req.query['search'] as string | undefined;
      const createdBy = req.query['createdBy'] as string | undefined;
      const isPrivate = req.query['isPrivate'] !== undefined ? 
        req.query['isPrivate'] === 'true' : undefined;
      const isClosed = req.query['isClosed'] !== undefined ? 
        req.query['isClosed'] === 'true' : undefined;
      const sortBy = (req.query['sortBy'] as string) || 'lastMessageAt';
      const sortOrder = (req.query['sortOrder'] as 'asc' | 'desc') || 'desc';
      
      const result = await threadService.getThreads(companyId, {
        limit,
        offset,
        category,
        search,
        createdBy,
        isPrivate,
        isClosed,
        sortBy,
        sortOrder
      });
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/threads', { error });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Get a thread by ID
   * 
   * @route GET /api/collaboration/threads/:id
   */
  app.get(`${BASE_PATH}/:id`, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      const { id } = req.params;
      // const companyId = req.user.companyId;  // Unused variable
      
      const thread = await threadService.getThreadById(id, companyId);
      
      if (!thread) {
        return return res.status(404).json({ message: 'Thread not found' });
      }
      
      return res.status(200).json(thread);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/threads/:id', { error, threadId: req.params['id'] });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Create a new thread
   * 
   * @route POST /api/collaboration/threads
   */
  app.post(BASE_PATH, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      // const userId = req.user.id;  // Unused variable
      // const companyId = req.user.companyId;  // Unused variable
      
      // Validate request body
      const threadSchema = insertCollaborationThreadSchema.extend({
        companyId: z.string().uuid(),
        createdBy: z.string().uuid()
      });
      
      const validatedData = threadSchema.parse({
        ...req.body,
        companyId,
        createdBy: userId
      });
      
      const thread = await threadService.createThread(validatedData, userId);
      
      return res.status(201).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid thread data', errors: error.format() });
      }
      
      logger.error('Error in POST /api/collaboration/threads', { error });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Update a thread
   * 
   * @route PATCH /api/collaboration/threads/:id
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
      const updateThreadSchema = insertCollaborationThreadSchema.partial();
      const validatedData = updateThreadSchema.parse(req.body);
      
      const thread = await threadService.updateThread(id, companyId, validatedData, userId);
      
      return res.status(200).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid thread data', errors: error.format() });
      }
      
      logger.error('Error in PATCH /api/collaboration/threads/:id', { error, threadId: req.params['id'] });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Delete a thread
   * 
   * @route DELETE /api/collaboration/threads/:id
   */
  app.delete(`${BASE_PATH}/:id`, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.companyId) {
        return return res.status(401).json({ message: 'User not authenticated or missing company' });
      }
      const { id } = req.params;
      // const companyId = req.user.companyId;  // Unused variable
      
      const success = await threadService.deleteThread(id, companyId);
      
      if (!success) {
        return return res.status(404).json({ message: 'Thread not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      logger.error('Error in DELETE /api/collaboration/threads/:id', { error, threadId: req.params['id'] });
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
}