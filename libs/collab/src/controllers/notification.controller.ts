/**
 * Notification Controller
 * 
 * Controller for managing collaboration notifications.
 */

import { Request, Response, Router } from 'express';
import { NotificationService, NotificationStatus } from '../services/notification.service';
import { createModuleLogger } from "@common/logger/loki-logger";
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';

/**
 * Notification Controller Class
 * 
 * Handles API requests for collaboration notifications.
 */
export class NotificationController {
  private _logger: ReturnType<typeof createModuleLogger>;
  
  /**
   * Constructor
   * 
   * @param notificationService Notification service
   */
  constructor(private notificationService: NotificationService) {
    this._logger = createModuleLogger('NotificationController');
  }
  
  /**
   * Register routes with the router
   * 
   * @param router Express router
   */
  registerRoutes(router: Router): void {
    this._logger.info('Registering notification controller routes');
    
    /**
     * Get notifications for authenticated user
     * 
     * @route GET /api/collaboration/notifications
     * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
     */
    router.get('/', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
      try {
        // Get user and company ID from auth
        const userId = req.user?.id;
        const companyId = req.user?.companyId || req.header('X-Company-ID');
        
        if (!userId || !companyId) {
          return res.status(401).json({ 
            error: 'Unauthorized - User ID or Company ID missing',
            status: 401,
            items: []
          });
        }
        
        // Parse query parameters
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const onlyUnread = req.query.unread === 'true';
        
        // Parse status filter if provided
        let status: NotificationStatus | NotificationStatus[] | undefined = undefined;
        if (req.query.status) {
          // Handle multiple status values as comma-separated
          if ((req.query.status as string).includes(',')) {
            status = (req.query.status as string).split(',') as NotificationStatus[];
          } else {
            status = req.query.status as NotificationStatus;
          }
        }
        
        // Get notifications
        const notifications = await this.notificationService.getNotifications(userId, companyId, {
          limit,
          status,
          onlyUnread
        });
        
        // Return response with the format expected by the frontend
        return res.status(200).json(notifications);
      } catch (error) {
        this._logger.error('Error fetching notifications', { error });
        
        return res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500,
          items: []
        });
      }
    });
  }
}

/**
 * Factory function to create a NotificationController
 * 
 * @param notificationService Notification service instance 
 * @returns NotificationController instance
 */
export const createNotificationController = (notificationService: NotificationService): NotificationController => {
  return new NotificationController(notificationService);
};