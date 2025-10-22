/**
 * Watcher Controller
 * 
 * Handles HTTP requests related to watchers in the Collaboration module.
 */
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { Logger } from "@common/logger";
import { WatcherDrizzleService } from "@common/drizzle/modules/collab/watcher-service";
import { insertTaskWatcherSchema } from '../../../../shared/schema/collaboration.schema';

// Create module logger
const logger = new Logger('CollabWatcherController');

export class WatcherController {
  constructor(private readonly watcherService: WatcherDrizzleService) {}

  /**
   * Register routes for the Watcher controller
   * 
   * @param router Express router
   */
  registerRoutes(router: Router): void {
    router.get('/task/:taskId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getWatchersByTask.bind(this));
    router.post('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.addWatcher.bind(this));
    router.delete('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.removeWatcher.bind(this));
  }

  /**
   * Get watchers for a task
   */
  async getWatchersByTask(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { taskId } = req.params;
      const companyId = req.user.companyId;
      
      const watchers = await this.watcherService.getWatchersByTaskId(taskId, companyId);
      
      res.status(200).json(watchers);
    } catch (error) {
      logger.error(`Error in GET /watchers/task/:taskId - TaskId: ${req.params.taskId}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Add a watcher to a task
   */
  async addWatcher(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const createdBy = req.user.id;
      const companyId = req.user.companyId;
      
      // Validate request body
      const watcherSchema = insertTaskWatcherSchema.extend({
        companyId: z.string().uuid(),
        createdBy: z.string().uuid()
      });
      
      const validatedData = watcherSchema.parse({
        ...req.body,
        companyId,
        createdBy
      });
      
      const watcher = await this.watcherService.addWatcher(
        validatedData.taskId,
        validatedData.companyId,
        validatedData.userId || req.user.id,
        validatedData.notificationPreference || { enabled: true }
      );
      
      res.status(201).json(watcher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid watcher data', errors: error.format() });
        return;
      }
      
      logger.error('Error in POST /watchers', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Remove a watcher from a task
   */
  async removeWatcher(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id: taskId } = req.params;
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      const success = await this.watcherService.removeWatcher(taskId, companyId, userId);
      
      if (!success) {
        res.status(404).json({ message: 'Watcher not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error(`Error in DELETE /watchers/:id - TaskId: ${req.params.id}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const createWatcherController = (watcherService: WatcherDrizzleService): WatcherController => {
  return new WatcherController(watcherService);
};