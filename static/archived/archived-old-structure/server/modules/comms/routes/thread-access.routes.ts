/**
 * Thread Access Routes
 * 
 * These routes handle thread access permissions including creating, retrieving, 
 * updating, and deleting thread access records.
 */

import { Router } from 'express';
import { ThreadAccessController } from '../controllers/thread-access.controller';
import { ThreadAccessService } from '../services/thread-access.service';
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';

/**
 * Router for thread access endpoints
 */
export class ThreadAccessRouter {
  private router: Router;
  private threadAccessController: ThreadAccessController;

  constructor(threadAccessService: ThreadAccessService) {
    this.router = Router();
    this.threadAccessController = new ThreadAccessController(threadAccessService);
    this.setupRoutes();
  }

  /**
   * Set up the thread access routes
   */
  private setupRoutes() {
    // Get users with access to a thread
    this.router.get(
      '/:threadId/users',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadAccessController.getThreadAccessUsers(req, res)
    );

    // Get access for a specific user and thread
    this.router.get(
      '/:threadId/users/:userId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadAccessController.getThreadAccess(req, res)
    );

    // Grant access to a thread for a user
    this.router.post(
      '/:threadId/users/:userId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadAccessController.grantThreadAccess(req, res)
    );

    // Update thread access permissions
    this.router.patch(
      '/:threadId/users/:userId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadAccessController.updateThreadAccess(req, res)
    );

    // Remove thread access for a user
    this.router.delete(
      '/:threadId/users/:userId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadAccessController.removeThreadAccess(req, res)
    );

    // Check if user has a specific permission for a thread
    this.router.get(
      '/:threadId/users/:userId/permissions/:permission',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.threadAccessController.checkThreadPermission(req, res)
    );
  }

  /**
   * Get the configured router
   * @returns The Express router
   */
  getRouter(): Router {
    return this.router;
  }
}