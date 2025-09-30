/**
 * Task Routes
 * 
 * Defines API routes for task management in the Collaboration module.
 */

import { Express, Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { AuthGuard } from '../../auth/guards/auth.guard.fixed';
import { z } from 'zod';
import { insertCollaborationTaskSchema } from '../../../../shared/schema/collaboration.schema';
import { Logger } from '../../../common/logger';

// Create a logger instance for task routes
const logger = new Logger('TaskRoutes');

const BASE_PATH = '/api/collaboration/tasks';

/**
 * Register task routes with the Express app
 * 
 * @param app Express application
 * @param taskService Task service instance
 */
export function registerTaskRoutes(app: Express, taskService: TaskService): void {
  /**
   * Get all tasks for a company
   * 
   * @route GET /api/collaboration/tasks
   */
  app.get(BASE_PATH, AuthGuard.protect(), async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId;
      
      // Extract query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const status = req.query.status ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as string[] : undefined;
      const assignedTo = req.query.assignedTo as string | undefined;
      const priority = req.query.priority ? (Array.isArray(req.query.priority) ? req.query.priority : [req.query.priority]) as string[] : undefined;
      const dueStart = req.query.dueStart ? new Date(req.query.dueStart as string) : undefined;
      const dueEnd = req.query.dueEnd ? new Date(req.query.dueEnd as string) : undefined;
      const sortBy = (req.query.sortBy as string) || 'dueDate';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
      
      const result = await taskService.getTasks(companyId, {
        limit,
        offset,
        status,
        assignedTo,
        priority,
        dueStart,
        dueEnd,
        sortBy,
        sortOrder
      });
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/tasks', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Get a task by ID
   * 
   * @route GET /api/collaboration/tasks/:id
   */
  app.get(`${BASE_PATH}/:id`, AuthGuard.protect(), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const task = await taskService.getTaskById(id, companyId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      res.status(200).json(task);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/tasks/:id', { error, taskId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Create a new task
   * 
   * @route POST /api/collaboration/tasks
   */
  app.post(BASE_PATH, AuthGuard.protect(), async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      // Validate request body
      const taskSchema = insertCollaborationTaskSchema.extend({
        companyId: z.string().uuid()
      });
      
      const validatedData = taskSchema.parse({
        ...req.body,
        companyId
      });
      
      const task = await taskService.createTask(validatedData, userId);
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid task data', errors: error.format() });
      }
      
      logger.error('Error in POST /api/collaboration/tasks', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Update a task
   * 
   * @route PATCH /api/collaboration/tasks/:id
   */
  app.patch(`${BASE_PATH}/:id`, AuthGuard.protect(), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      // Validate request body (partial updates allowed)
      const updateTaskSchema = insertCollaborationTaskSchema.partial();
      const validatedData = updateTaskSchema.parse(req.body);
      
      const task = await taskService.updateTask(id, companyId, validatedData, userId);
      
      res.status(200).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid task data', errors: error.format() });
      }
      
      logger.error('Error in PATCH /api/collaboration/tasks/:id', { error, taskId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Delete a task
   * 
   * @route DELETE /api/collaboration/tasks/:id
   */
  app.delete(`${BASE_PATH}/:id`, AuthGuard.protect(), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const success = await taskService.deleteTask(id, companyId);
      
      if (!success) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error in DELETE /api/collaboration/tasks/:id', { error, taskId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  /**
   * Task placeholder endpoint for creating tasks with minimal validation
   * 
   * @route POST /api/collaboration/tasks/task-placeholder
   */
  app.post(`${BASE_PATH}/task-placeholder`, AuthGuard.protect(), async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      // Log the request for audit purposes
      logger.info('Task placeholder request received', { 
        userId, 
        companyId,
        requestBody: req.body
      });
      
      return res.status(200).json({
        message: "Collaboration task creation placeholder",
        timestamp: new Date().toISOString(),
        requestData: req.body,
        context: {
          userId,
          companyId
        }
      });
    } catch (error) {
      logger.error('Error in POST /api/collaboration/tasks/task-placeholder', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Get task assignment history
   * 
   * @route GET /api/collaboration/tasks/:id/assignment-history
   */
  app.get(`${BASE_PATH}/:id/assignment-history`, AuthGuard.protect(), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const history = await taskService.getTaskAssignmentHistory(id, companyId);
      
      res.status(200).json(history);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/tasks/:id/assignment-history', { error, taskId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Get task status history
   * 
   * @route GET /api/collaboration/tasks/:id/status-history
   */
  app.get(`${BASE_PATH}/:id/status-history`, AuthGuard.protect(), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const history = await taskService.getTaskStatusHistory(id, companyId);
      
      res.status(200).json(history);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/tasks/:id/status-history', { error, taskId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}