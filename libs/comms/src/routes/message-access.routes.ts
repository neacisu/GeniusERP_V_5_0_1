/**
 * Message Access Routes
 * 
 * These routes handle message access permissions including creating, retrieving, 
 * updating, and deleting message access records.
 */

import { Router } from 'express';
import { MessageAccessController } from '../controllers/message-access.controller';
import { MessageAccessService } from '../services/message-access.service';
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';

/**
 * Router for message access endpoints
 */
export class MessageAccessRouter {
  private router: Router;
  private messageAccessController: MessageAccessController;

  constructor(messageAccessService: MessageAccessService) {
    this.router = Router();
    this.messageAccessController = new MessageAccessController(messageAccessService);
    this.setupRoutes();
  }

  /**
   * Set up the message access routes
   */
  private setupRoutes() {
    // Get users with access to a message
    this.router.get(
      '/:messageId/users',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.messageAccessController.getMessageAccessUsers(req, res)
    );

    // Get access for a specific user and message
    this.router.get(
      '/:messageId/users/:userId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.messageAccessController.getMessageAccess(req, res)
    );

    // Grant access to a message for a user
    this.router.post(
      '/:messageId/users/:userId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.messageAccessController.grantMessageAccess(req, res)
    );

    // Update message access permissions
    this.router.patch(
      '/:messageId/users/:userId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.messageAccessController.updateMessageAccess(req, res)
    );

    // Remove message access for a user
    this.router.delete(
      '/:messageId/users/:userId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.messageAccessController.removeMessageAccess(req, res)
    );

    // Check if user has a specific permission for a message
    this.router.get(
      '/:messageId/users/:userId/permissions/:permission',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.messageAccessController.checkMessagePermission(req, res)
    );
    
    // Bulk grant access to multiple users for a message
    this.router.post(
      '/:messageId/users/bulk',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.messageAccessController.bulkGrantMessageAccess(req, res)
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