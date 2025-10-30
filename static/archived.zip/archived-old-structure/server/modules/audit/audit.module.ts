/**
 * Audit Module
 * 
 * This module handles audit logging for tracking user actions and system events.
 * It provides middleware for API request logging and endpoints for retrieving audit logs.
 */

import { Express, Router, Request, Response, NextFunction } from 'express';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import AuditService from './services/audit.service';
import { AuditController } from './controllers/audit.controller';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserRole } from '../auth/types';
import { JwtAuthMode } from '../auth/constants/auth-mode.enum';

export class AuditModule {
  private auditController: AuditController;
  private drizzle: DrizzleService;

  constructor() {
    this.drizzle = new DrizzleService();
    this.auditController = new AuditController();
  }

  /**
   * Initialize the audit module and set up routes and middleware
   * 
   * @param app Express application
   * @returns The router that was set up
   */
  initRoutes(app: Express): Router {
    const router = Router();

    // Register API request logging middleware
    app.use('/api', this.createApiAuditMiddleware());

    // Get audit logs for an entity
    router.get('/entity/:entityType/:entityId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.auditController.getEntityLogs.bind(this.auditController)
    );

    // Get audit logs for a user
    router.get('/user/:userId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN]),
      this.auditController.getUserLogs.bind(this.auditController)
    );

    // Get recent audit logs - with limit
    router.get('/recent/:limit',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.auditController.getRecentLogs.bind(this.auditController)
    );
    
    // Get recent audit logs - without limit (default)
    router.get('/recent',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.auditController.getRecentLogs.bind(this.auditController)
    );

    // Search audit logs with filters
    router.get('/search',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, 'auditor']),
      this.auditController.searchLogs.bind(this.auditController)
    );

    // Get audit statistics
    router.get('/stats',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.auditController.getAuditStats.bind(this.auditController)
    );

    // Get administrative actions
    router.get('/admin-actions',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN]),
      this.auditController.getAdminActions.bind(this.auditController)
    );

    // Create a test audit log entry
    router.post('/test',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.auditController.createTestAuditLog.bind(this.auditController)
    );
    
    // Create a new audit log (primarily for internal use)
    router.post('/',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.auditController.createAuditLog.bind(this.auditController)
    );

    app.use('/api/audit', router);
    console.log('📝 Audit module initialized');
    return router;
  }

  /**
   * Create middleware to log API requests for auditing
   */
  private createApiAuditMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Skip logging for GET requests (read-only operations)
      if (req.method === 'GET') {
        return next();
      }
      
      // Store original response data
      const originalSend = res.send;
      
      // Override send method
      res.send = function(body?: any): Response {
        // Execute original send to continue normal flow
        const result = originalSend.call(res, body);
        
        // Skip certain endpoints to avoid excessive logging
        if (req.path.includes('/auth') || req.path.includes('/login') || req.path.includes('/token')) {
          return result;
        }
        
        // Process and log successful responses
        const statusCode = res.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 300;
        
        if (isSuccess) {
          // Extract entity and action from the URL path
          const pathParts = req.path.split('/').filter(Boolean);
          const entity = pathParts[1] || 'unknown';
          let action = '';
          
          switch (req.method) {
            case 'POST':
              action = 'CREATE';
              break;
            case 'PUT':
            case 'PATCH':
              action = 'UPDATE';
              break;
            case 'DELETE':
              action = 'DELETE';
              break;
            default:
              action = req.method;
          }
          
          // Log the API request asynchronously (don't block response)
          setTimeout(() => {
            AuditService.logFromRequest(req, {
              action: `${action}_${entity.toUpperCase()}`,
              entity,
              entityId: pathParts[2] || 'batch',
              details: {
                method: req.method,
                path: req.path,
                body: req.body ? JSON.stringify(req.body).substring(0, 1000) : null,
                statusCode,
              }
            }).catch(err => {
              console.error('[AuditMiddleware] Failed to log API request:', err);
            });
          }, 0);
        }
        
        return result;
      };
      
      next();
    };
  }
}

// Export a singleton instance
export const auditModule = new AuditModule();