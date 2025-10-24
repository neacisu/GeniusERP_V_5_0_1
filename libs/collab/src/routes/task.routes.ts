/**
 * Collaboration Task Routes
 * 
 * Provides HTTP endpoints for managing collaboration tasks including:
 * - Creating tasks
 * - Assigning tasks
 * - Updating task status
 * - Adding comments to tasks
 * - Retrieving tasks by various filters
 */

import { Express, Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { TaskController } from '../controllers/task.controller';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { createModuleLogger } from "@common/logger/loki-logger";

// Create a logger instance for task routes
const logger = createModuleLogger('TaskRoutes');

/**
 * Register all task routes with the Express application
 * 
 * @param app Express application instance
 * @param taskService Task service instance
 * @param existingController Optional existing TaskController instance (from module)
 */
export function registerTaskRoutes(
  app: Express, 
  taskService: TaskService,
  existingController?: TaskController
): void {
  logger.info('Registering task routes...');
  
  // Use existing controller or create a new one
  const controller = existingController || new TaskController(taskService);
  
  // GET /api/collaboration/tasks - Get all tasks
  app.get('/api/collaboration/tasks', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req: Request, res: Response) => {
      try {
        return await controller.getAllTasks(req, res);
      } catch (error) {
        logger.error(`Error in GET /api/collaboration/tasks: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  );
  
  // GET /api/collaboration/tasks/:id - Get a task by ID
  app.get('/api/collaboration/tasks/:id', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req: Request, res: Response) => {
      try {
        return await controller.getTaskById(req, res);
      } catch (error) {
        logger.error(`Error in GET /api/collaboration/tasks/:id: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  );
  
  // POST /api/collaboration/tasks - Create a new task
  app.post('/api/collaboration/tasks', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;
        const companyId = req.user!.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ message: 'User ID or company ID not found' });
        }
        
        return await controller.createTask(req, res);
      } catch (error) {
        logger.error(`Error in POST /api/collaboration/tasks: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  );
  
  // PUT /api/collaboration/tasks/:id - Update a task
  app.put('/api/collaboration/tasks/:id', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req: Request, res: Response) => {
      try {
        return await controller.updateTask(req, res);
      } catch (error) {
        logger.error(`Error in PUT /api/collaboration/tasks/:id: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  );
  
  // DELETE /api/collaboration/tasks/:id - Delete a task
  app.delete('/api/collaboration/tasks/:id', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req: Request, res: Response) => {
      try {
        return await controller.deleteTask(req, res);
      } catch (error) {
        logger.error(`Error in DELETE /api/collaboration/tasks/:id: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  );
  
  // POST /api/collaboration/tasks/:id/assign - Assign a task to a user
  app.post('/api/collaboration/tasks/:id/assign', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;
        const companyId = req.user!.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ message: 'User ID or company ID not found' });
        }
        
        return await controller.assignTask(req, res);
      } catch (error) {
        logger.error(`Error in POST /api/collaboration/tasks/:id/assign: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  );
  
  // POST /api/collaboration/tasks/:id/status - Update task status
  app.post('/api/collaboration/tasks/:id/status', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req: Request, res: Response) => {
      try {
        return await controller.updateTaskStatus(req, res);
      } catch (error) {
        logger.error(`Error in POST /api/collaboration/tasks/:id/status: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  );
  
  logger.info('Task routes registered successfully');
}