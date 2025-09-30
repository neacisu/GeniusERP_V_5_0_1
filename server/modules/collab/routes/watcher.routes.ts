/**
 * Watcher Routes
 * 
 * Defines API routes for task watchers in the Collaboration module.
 */

import { Express, Request, Response } from 'express';
import { WatcherService } from '../services/watcher.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { z } from 'zod';
import { Logger } from '../../../common/logger';

// Create logger instance
const logger = new Logger('WatcherRoutes');

const BASE_PATH = '/api/collaboration/watchers';

/**
 * Register watcher routes with the Express app
 * 
 * @param app Express application
 * @param watcherService Watcher service instance
 */
export function registerWatcherRoutes(app: Express, watcherService: WatcherService): void {
  /**
   * Get all watchers for a task
   * 
   * @route GET /api/collaboration/watchers
   */
  app.get(BASE_PATH, AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId || '';
      const taskId = req.query.taskId as string;
      
      if (!taskId) {
        return res.status(400).json({ message: 'taskId query parameter is required' });
      }
      
      const watchers = await watcherService.getWatchersByTaskId(taskId, companyId);
      
      res.status(200).json(watchers);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/watchers', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Get task IDs watched by the current user
   * 
   * @route GET /api/collaboration/watchers/watched-tasks
   */
  app.get(`${BASE_PATH}/watched-tasks`, AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || '';
      const companyId = req.user?.companyId || '';
      
      const taskIds = await watcherService.getWatchedTaskIds(userId, companyId);
      
      res.status(200).json(taskIds);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/watchers/watched-tasks', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Add a watcher to a task
   * 
   * @route POST /api/collaboration/watchers
   */
  app.post(BASE_PATH, AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || '';
      const companyId = req.user?.companyId || '';
      
      // Validate request body
      const watcherSchema = z.object({
        taskId: z.string().uuid(),
        notificationPreference: z.record(z.any()).optional()
      });
      
      const { taskId, notificationPreference = { enabled: true } } = watcherSchema.parse(req.body);
      
      const watcher = await watcherService.addWatcher(taskId, companyId, userId, notificationPreference);
      
      res.status(201).json(watcher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid watcher data', errors: error.format() });
      }
      
      logger.error('Error in POST /api/collaboration/watchers', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Add another user as a watcher
   * 
   * @route POST /api/collaboration/watchers/add-user
   */
  app.post(`${BASE_PATH}/add-user`, AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId || '';
      
      // Validate request body
      const addUserSchema = z.object({
        taskId: z.string().uuid(),
        userId: z.string().uuid(),
        notificationPreference: z.record(z.any()).optional()
      });
      
      const { taskId, userId, notificationPreference = { enabled: true } } = addUserSchema.parse(req.body);
      
      const watcher = await watcherService.addWatcher(taskId, companyId, userId, notificationPreference);
      
      res.status(201).json(watcher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid watcher data', errors: error.format() });
      }
      
      logger.error('Error in POST /api/collaboration/watchers/add-user', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Update watcher notification preferences
   * 
   * @route PATCH /api/collaboration/watchers/:taskId
   */
  app.patch(`${BASE_PATH}/:taskId`, AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id || '';
      const companyId = req.user?.companyId || '';
      
      // Validate request body
      const updateSchema = z.object({
        notificationPreference: z.record(z.any())
      });
      
      const { notificationPreference } = updateSchema.parse(req.body);
      
      const watcher = await watcherService.updateWatcherPreferences(taskId, companyId, userId, notificationPreference);
      
      if (!watcher) {
        return res.status(404).json({ message: 'Watcher not found' });
      }
      
      res.status(200).json(watcher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid watcher data', errors: error.format() });
      }
      
      logger.error('Error in PATCH /api/collaboration/watchers/:taskId', { error, taskId: req.params.taskId });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Check if the current user is watching a task
   * 
   * @route GET /api/collaboration/watchers/:taskId/is-watching
   */
  app.get(`${BASE_PATH}/:taskId/is-watching`, AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id || '';
      const companyId = req.user?.companyId || '';
      
      const isWatching = await watcherService.isWatching(taskId, companyId, userId);
      
      res.status(200).json({ isWatching });
    } catch (error) {
      logger.error('Error in GET /api/collaboration/watchers/:taskId/is-watching', { error, taskId: req.params.taskId });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Remove watcher from a task
   * 
   * @route DELETE /api/collaboration/watchers/:taskId
   */
  app.delete(`${BASE_PATH}/:taskId`, AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id || '';
      const companyId = req.user?.companyId || '';
      
      const success = await watcherService.removeWatcher(taskId, companyId, userId);
      
      if (!success) {
        return res.status(404).json({ message: 'Watcher not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error in DELETE /api/collaboration/watchers/:taskId', { error, taskId: req.params.taskId });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Remove a specific user as a watcher
   * 
   * @route DELETE /api/collaboration/watchers/:taskId/users/:userId
   */
  app.delete(`${BASE_PATH}/:taskId/users/:userId`, AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
    try {
      const { taskId, userId } = req.params;
      const companyId = req.user?.companyId || '';
      
      const success = await watcherService.removeWatcher(taskId, companyId, userId);
      
      if (!success) {
        return res.status(404).json({ message: 'Watcher not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error in DELETE /api/collaboration/watchers/:taskId/users/:userId', { 
        error, 
        taskId: req.params.taskId,
        userId: req.params.userId
      });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}