/**
 * Threads Router
 * 
 * This router handles HTTP requests related to message threads.
 * It uses the ThreadsController to handle the actual request/response logic.
 */

import { Router } from 'express';
import { ThreadsService } from '../services/threads.service';
import { ThreadsController } from '../controllers/threads.controller';
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';

/**
 * Router for message threads endpoints
 */
export class ThreadsRouter {
  private router: Router;
  private threadsController: ThreadsController;
  
  constructor(threadsService: ThreadsService) {
    this.router = Router();
    this.threadsController = new ThreadsController(threadsService);
    this.setupRoutes();
  }
  
  /**
   * Set up the routes for the router
   */
  private setupRoutes() {
    // Get all threads for company
    this.router.get(
      '/',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadsController.getThreads(req, res)
    );
    
    // Get a specific thread
    this.router.get(
      '/:threadId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadsController.getThread(req, res)
    );
    
    // Create a new thread
    this.router.post(
      '/',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadsController.createThread(req, res)
    );
    
    // Update a thread
    this.router.patch(
      '/:threadId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadsController.updateThread(req, res)
    );
    
    // Delete a thread
    this.router.delete(
      '/:threadId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadsController.deleteThread(req, res)
    );
  }
  
  /**
   * Get the configured router
   * @returns Express Router
   */
  public getRouter(): Router {
    return this.router;
  }
}