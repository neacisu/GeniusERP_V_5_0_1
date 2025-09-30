/**
 * Public Notification Test Routes
 * 
 * Example routes for testing the NotificationService without authentication
 */

import { Router, Request, Response } from 'express';
import { Services } from '../../../common/services/registry';
import { 
  NotificationType, 
  NotificationPriority 
} from '../../../common/services/notification.service';

// Create a router for public notification examples
const router = Router();

/**
 * @route GET /api/examples/public-notifications/test
 * @desc Test the notification service without authentication
 * @access Public
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    // Send a test notification
    const result = await Services.notification.notifySystem({
      title: 'Public Test Notification',
      message: 'This is a test notification from the public API endpoint',
      type: NotificationType.INFO,
      priority: NotificationPriority.LOW,
      metadata: {
        source: 'public-test-endpoint',
        timestamp: new Date().toISOString()
      }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Test notification sent successfully',
      result
    });
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send test notification',
      error: (error as Error).message
    });
  }
});

export default router;