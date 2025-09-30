/**
 * Notification Examples Routes
 * 
 * Example routes demonstrating the NotificationService in action
 */

import { Router, Request, Response } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { Services } from '../../../common/services/registry';
import { 
  NotificationType, 
  NotificationPriority 
} from '../../../common/services/notification.service';

// Create a router for notification examples
const router = Router();

/**
 * @route POST /api/examples/notifications/user
 * @desc Send a notification to a user
 * @access Authenticated
 */
router.post('/user', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
  try {
    const { title, message, userId, priority, actionUrl } = req.body;
    
    // Send notification to user
    const result = await Services.notification.notifyUser(userId, {
      title,
      message,
      type: NotificationType.INFO,
      priority: priority || NotificationPriority.MEDIUM,
      actionUrl
    });

    // Audit the notification for tracking
    await Services.audit.log({
      companyId: req.user?.companyId || '',
      userId: req.user?.id,
      action: 'NOTIFICATION_SENT',
      entity: 'USER',
      entityId: userId,
      details: { title, message }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Notification sent successfully',
      result
    });
  } catch (error) {
    console.error('Failed to send user notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send notification',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/examples/notifications/system
 * @desc Send a system-wide notification (admins only)
 * @access Admin role required
 */
router.post('/system', AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
  try {
    const { title, message, priority, metadata } = req.body;
    
    // Send system notification (typically for admins or logs)
    const result = await Services.notification.notifySystem({
      title,
      message,
      type: NotificationType.WARNING,
      priority: priority || NotificationPriority.HIGH,
      metadata
    });

    // Audit the system notification
    await Services.audit.log({
      companyId: req.user?.companyId || '',
      userId: req.user?.id,
      action: 'SYSTEM_NOTIFICATION_SENT',
      entity: 'SYSTEM',
      entityId: 'system',
      details: { title, message, metadata }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'System notification sent successfully',
      result
    });
  } catch (error) {
    console.error('Failed to send system notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send system notification',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/examples/notifications/company
 * @desc Send a notification to all users in a company
 * @access Authenticated, Company admin role
 */
router.post('/company', AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin', 'company_admin']), async (req: Request, res: Response) => {
  try {
    const { title, message, companyId, priority, actionUrl } = req.body;
    
    // Use the requester's company if not specified
    const targetCompanyId = companyId || req.user?.companyId;
    
    if (!targetCompanyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }
    
    // Send notification to company
    const result = await Services.notification.notifyCompany(targetCompanyId, {
      title,
      message,
      type: NotificationType.INFO,
      priority: priority || NotificationPriority.MEDIUM,
      actionUrl
    });

    // Audit the company notification
    await Services.audit.log({
      companyId: req.user?.companyId || '',
      userId: req.user?.id,
      action: 'COMPANY_NOTIFICATION_SENT',
      entity: 'COMPANY',
      entityId: targetCompanyId,
      details: { title, message }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Company notification sent successfully',
      result
    });
  } catch (error) {
    console.error('Failed to send company notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send company notification',
      error: (error as Error).message
    });
  }
});

/**
 * @route POST /api/examples/notifications/role
 * @desc Send a notification to all users with a specific role
 * @access Admin role required
 */
router.post('/role', AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
  try {
    const { title, message, role, priority, actionUrl } = req.body;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }
    
    // Send notification to role
    const result = await Services.notification.notifyRole(role, {
      title,
      message,
      type: NotificationType.INFO,
      priority: priority || NotificationPriority.MEDIUM,
      actionUrl
    });

    // Audit the role notification
    await Services.audit.log({
      companyId: req.user?.companyId || '',
      userId: req.user?.id,
      action: 'ROLE_NOTIFICATION_SENT',
      entity: 'ROLE',
      entityId: role,
      details: { title, message }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: `Notification sent to all users with role: ${role}`,
      result
    });
  } catch (error) {
    console.error('Failed to send role notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send role notification',
      error: (error as Error).message
    });
  }
});

export default router;