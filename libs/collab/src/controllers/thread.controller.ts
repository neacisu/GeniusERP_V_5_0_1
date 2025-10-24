/**
 * Thread Controller
 * 
 * Handles HTTP requests related to threads in the Collaboration module.
 */
import { Request, Response, Router } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { createModuleLogger } from "@common/logger/loki-logger";
import { ThreadDrizzleService } from "@common/drizzle/modules/collab/thread-service";
import { insertCollaborationThreadSchema } from '../../../../shared/schema/collaboration.schema';

// Create module logger
const logger = createModuleLogger('CollabThreadController');

export class ThreadController {
  constructor(private readonly threadService: ThreadDrizzleService) {}

  /**
   * Register routes for the Thread controller
   * 
   * @param router Express router
   */
  registerRoutes(router: Router): void {
    router.get('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getAllThreads.bind(this));
    router.get('/task/:taskId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getThreadsByTask.bind(this));
    router.get('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getThreadById.bind(this));
    router.post('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.createThread.bind(this));
    router.patch('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateThread.bind(this));
    router.delete('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.deleteThread.bind(this));
  }

  /**
   * Get all threads for a company
   */
  async getAllThreads(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const companyId = req.user.companyId;
      
      // Parse query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      
      const { threads } = await this.threadService.getThreads(companyId, { limit, offset });
      
      res.status(200).json(threads);
    } catch (error) {
      logger.error(`Error in GET /threads - CompanyId: ${req.user?.companyId}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get threads for a specific task
   */
  async getThreadsByTask(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { taskId } = req.params;
      const companyId = req.user.companyId;
      
      // Parse query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      
      // Since we don't have a direct task-thread relationship in the service,
      // we need to implement this. For now, we'll return a placeholder response.
      res.status(501).json({ 
        message: 'Getting threads by task ID is not implemented in the current API version'
      });
      return;
    } catch (error) {
      logger.error(`Error in GET /threads/task/:taskId - TaskId: ${req.params.taskId}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get a thread by ID
   */
  async getThreadById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const thread = await this.threadService.getThreadById(id, companyId);
      
      if (!thread) {
        res.status(404).json({ message: 'Thread not found' });
        return;
      }
      
      res.status(200).json(thread);
    } catch (error) {
      logger.error(`Error in GET /threads/:id - ThreadId: ${req.params.id}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create a new thread
   */
  async createThread(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      // Validate request body
      const threadSchema = insertCollaborationThreadSchema.extend({
        companyId: z.string().uuid(),
        createdBy: z.string().uuid(),
      });
      
      const validatedData = threadSchema.parse({
        ...req.body,
        companyId,
        createdBy: userId,
      });
      
      const thread = await this.threadService.createThread(validatedData, userId);
      
      res.status(201).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid thread data', errors: error.format() });
        return;
      }
      
      logger.error('Error in POST /threads', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update a thread
   */
  async updateThread(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      // Validate request body (partial updates allowed)
      const updateThreadSchema = insertCollaborationThreadSchema.partial();
      const validatedData = updateThreadSchema.parse(req.body);
      
      const thread = await this.threadService.updateThread(id, companyId, validatedData, userId);
      
      if (!thread) {
        res.status(404).json({ message: 'Thread not found or you are not authorized to edit it' });
        return;
      }
      
      res.status(200).json(thread);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid thread data', errors: error.format() });
        return;
      }
      
      logger.error(`Error in PATCH /threads/:id - ThreadId: ${req.params.id}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Delete a thread
   */
  async deleteThread(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      const success = await this.threadService.deleteThread(id, companyId);
      
      if (!success) {
        res.status(404).json({ message: 'Thread not found or you are not authorized to delete it' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error(`Error in DELETE /threads/:id - ThreadId: ${req.params.id}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const createThreadController = (threadService: ThreadDrizzleService): ThreadController => {
  return new ThreadController(threadService);
};