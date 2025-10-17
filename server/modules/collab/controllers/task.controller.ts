/**
 * Task Controller
 * 
 * Handles collaboration task endpoints with both modern class-based
 * and legacy compatibility interfaces.
 */

import { Request, Response, Router } from 'express';
import { Logger } from '../../../common/logger';
import { TaskService } from '../services/task.service';
import { TaskStatus, TaskPriority } from '../../../../shared/schema/collaboration.schema';

/**
 * Interface for legacy task controller
 */
export interface LegacyTaskController {
  registerRoutes: (router: Router) => void;
}

/**
 * Factory function to create a task controller with legacy interface
 * This provides backwards compatibility for older code
 * 
 * @param taskService Task service instance
 * @returns A task controller instance with legacy interface
 */
export function createTaskController(taskService: TaskService): LegacyTaskController {
  const controller = new TaskController(taskService);
  
  return {
    registerRoutes: (router) => {
      // This is a no-op since we're using the new routing approach
      console.warn('Legacy task controller routes registration called, but routes are registered directly');
    }
  };
}

export class TaskController {
  private _logger: Logger;
  
  constructor(
    private taskService: TaskService
  ) {
    this._logger = new Logger('TaskController');
  }
  
  /**
   * Get all tasks for a company with filtering and pagination
   * Alias for listTasks to match route name convention
   */
  async getAllTasks(req: Request, res: Response): Promise<void> {
    return this.listTasks(req, res);
  }
  
  /**
   * Get all tasks for a company with filtering and pagination
   */
  async listTasks(req: Request, res: Response): Promise<void> {
    try {
      // Check for company ID in header first (for client-side requests)
      let companyIdTemp = req.headers['x-company-id'] as string;
      
      // If not in header, get from user object
      if (!companyIdTemp) {
        companyIdTemp = req.user?.companyId || '';
      }
      
      this._logger.info(`[DEBUG] Task list request - companyId: ${companyIdTemp}, from header: ${req.headers['x-company-id']}, from user: ${req.user?.companyId}`);
      
      if (!companyIdTemp) {
        this._logger.error('[DEBUG] Company ID not found in request');
        res.status(401).json({ error: 'Company ID not found' });
        return;
      }
      
      const companyId: string = companyIdTemp;
      
      // Extract query parameters
      const {
        page = '1',
        limit = '20',
        status,
        assignedTo,
        priority,
        dueStart,
        dueEnd,
        sortBy,
        sortOrder,
        recent
      } = req.query;
      
      // Build options object for task service
      const options: any = {
        offset: (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10),
        limit: parseInt(limit as string, 10)
      };
      
      // Add filter parameters if provided
      if (status) {
        options.status = Array.isArray(status) 
          ? status as TaskStatus[] 
          : [status as TaskStatus];
      }
      
      if (assignedTo) {
        options.assignedTo = assignedTo as string;
      }
      
      if (priority) {
        options.priority = Array.isArray(priority)
          ? priority as TaskPriority[]
          : [priority as TaskPriority];
      }
      
      if (dueStart) {
        options.dueStart = new Date(dueStart as string);
      }
      
      if (dueEnd) {
        options.dueEnd = new Date(dueEnd as string);
      }
      
      if (sortBy) {
        options.sortBy = sortBy as string;
      }
      
      if (sortOrder) {
        options.sortOrder = sortOrder as 'asc' | 'desc';
      }
      
      this._logger.info(`[DEBUG] Fetching tasks with options: ${JSON.stringify(options)} for company: ${companyId}`);
      
      // Fetch tasks using the service
      const result = await this.taskService.getTasks(companyId, options);
      
      this._logger.info(`[DEBUG] Tasks found: ${result.tasks.length}, total: ${result.total}`);
      
      // Return tasks with pagination metadata
      res.json({
        tasks: result.tasks,
        pagination: {
          total: result.total,
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          pages: Math.ceil(result.total / parseInt(limit as string, 10))
        }
      });
    } catch (error) {
      this._logger.error('Failed to get tasks', { error });
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  }
  
  /**
   * Get a task by ID
   */
  async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        res.status(401).json({ error: 'Company ID not found' });
        return;
      }
      
      const task = await this.taskService.getTaskById(id, companyId);
      
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      
      res.json(task);
    } catch (error) {
      this._logger.error('Failed to get task by ID', { error });
      res.status(500).json({ error: 'Failed to get task by ID' });
    }
  }
  
  /**
   * Create a new task
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      
      if (!companyId || !userId) {
        res.status(401).json({ error: 'User ID or company ID not found' });
        return;
      }
      
      const taskData = req.body;
      
      // Ensure companyId is set correctly
      taskData.companyId = companyId;
      
      // Create the task
      const task = await this.taskService.createTask(taskData, userId);
      
      res.status(201).json(task);
    } catch (error) {
      this._logger.error('Failed to create task', { error });
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
  
  /**
   * Update a task
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      
      if (!companyId || !userId) {
        res.status(401).json({ error: 'User ID or company ID not found' });
        return;
      }
      
      const updates = req.body;
      
      // Remove immutable fields if present
      delete updates.id;
      delete updates.companyId;
      delete updates.createdAt;
      delete updates.createdBy;
      
      // Perform the update
      const updatedTask = await this.taskService.updateTask(id, companyId, updates, userId);
      
      res.json(updatedTask);
    } catch (error) {
      this._logger.error('Failed to update task', { error });
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update task' });
      }
    }
  }
  
  /**
   * Delete a task
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        res.status(401).json({ error: 'Company ID not found' });
        return;
      }
      
      const success = await this.taskService.deleteTask(id, companyId);
      
      if (!success) {
        res.status(404).json({ error: 'Task not found or already deleted' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      this._logger.error('Failed to delete task', { error });
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
  
  /**
   * Get task assignment history
   */
  async getTaskAssignmentHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        res.status(401).json({ error: 'Company ID not found' });
        return;
      }
      
      // Verify the task exists for this company
      const task = await this.taskService.getTaskById(id, companyId);
      
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      
      const history = await this.taskService.getTaskAssignmentHistory(id, companyId);
      
      res.json(history);
    } catch (error) {
      this._logger.error('Failed to get task assignment history', { error });
      res.status(500).json({ error: 'Failed to get task assignment history' });
    }
  }
  
  /**
   * Get task status history
   */
  async getTaskStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        res.status(401).json({ error: 'Company ID not found' });
        return;
      }
      
      // Verify the task exists for this company
      const task = await this.taskService.getTaskById(id, companyId);
      
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      
      const history = await this.taskService.getTaskStatusHistory(id, companyId);
      
      res.json(history);
    } catch (error) {
      this._logger.error('Failed to get task status history', { error });
      res.status(500).json({ error: 'Failed to get task status history' });
    }
  }
  
  /**
   * Assign a task to a user
   */
  async assignTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const assignerId = req.user?.id;
      
      if (!companyId || !assignerId) {
        res.status(401).json({ error: 'User ID or company ID not found' });
        return;
      }
      const { userId: assigneeId } = req.body;
      
      if (!assigneeId) {
        res.status(400).json({ error: 'Missing assignee user ID' });
        return;
      }
      
      // Verify the task exists for this company
      const task = await this.taskService.getTaskById(id, companyId);
      
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      
      // Assign the task to the user
      const updatedTask = await this.taskService.assignTask(id, companyId, assigneeId, assignerId);
      
      res.json(updatedTask);
    } catch (error) {
      this._logger.error('Failed to assign task', { error });
      res.status(500).json({ error: 'Failed to assign task' });
    }
  }
  
  /**
   * Update task status
   */
  async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      
      if (!companyId || !userId) {
        res.status(401).json({ error: 'User ID or company ID not found' });
        return;
      }
      const { status } = req.body;
      
      if (!status || !Object.values(TaskStatus).includes(status as TaskStatus)) {
        res.status(400).json({ 
          error: 'Invalid status',
          allowedValues: Object.values(TaskStatus) 
        });
        return;
      }
      
      // Verify the task exists for this company
      const task = await this.taskService.getTaskById(id, companyId);
      
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      
      // Update the task status
      const updatedTask = await this.taskService.updateTaskStatus(
        id, 
        companyId, 
        status as TaskStatus,
        userId
      );
      
      res.json(updatedTask);
    } catch (error) {
      this._logger.error('Failed to update task status', { error });
      res.status(500).json({ error: 'Failed to update task status' });
    }
  }
}

/**
 * Factory function to create a modern TaskController
 * 
 * @param taskService Task service instance 
 * @returns TaskController instance
 */
export const createModernTaskController = (taskService: TaskService): TaskController => {
  return new TaskController(taskService);
};