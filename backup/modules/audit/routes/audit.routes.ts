import { Router, Request, Response, NextFunction } from 'express';
import AuditService from '../services/audit.service';
import { storage } from '../../../storage';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthMode } from '../../auth';
import authGuard from '../../auth/guards/auth.guard';

export function initAuditRoutes() {
  const router = Router();
  
  // Route to manually create an audit log (for testing)
  // Protected by AuthGuard to ensure only authenticated users can access
  router.post('/test', 
    authGuard.requireAuth(), 
    async (req, res) => {
      try {
        // Get company ID from the request - or fall back to default company
        let companyId = req.body.companyId;
        if (!companyId) {
          const company = await storage.getCompany();
          if (!company) {
            return res.status(400).json({ message: 'No company found for test audit log' });
          }
          companyId = company.id;
        }
        
        // Generate a random entity ID if not provided
        const entityId = req.body.entityId || uuidv4();
        
        // Log the action directly
        await AuditService.log({
          companyId,
          userId: req.user?.id || 'system',
          action: 'TEST_AUDIT_API',
          entity: req.body.entity || 'test',
          entityId,
          details: {
            source: 'audit_test_api',
            timestamp: new Date().toISOString(),
            customData: req.body.customData || {},
            request: {
              method: req.method,
              path: req.path,
              ip: req.ip,
              userAgent: req.headers['user-agent'],
            }
          }
        });
        
        return res.status(200).json({ 
          message: 'Audit log created successfully',
          entityId 
        });
      } catch (error) {
        console.error('Error creating test audit log:', error);
        return res.status(500).json({ message: 'Error creating audit log' });
      }
    }
  );
  
  // Route to get audit logs for a specific entity
  // Protected by AuthGuard to ensure only authenticated users can access
  router.get('/entity/:entity/:entityId', 
    authGuard.requireAuth(),
    authGuard.requireRoles(['admin', 'auditor', 'accountant']),
    async (req, res) => {
      try {
        const { entity, entityId } = req.params;
        const logs = await storage.getAuditLogs({
          entity,
          entityId
        });
        
        return res.status(200).json(logs);
      } catch (error) {
        console.error('Error retrieving audit logs:', error);
        return res.status(500).json({ message: 'Error retrieving audit logs' });
      }
    }
  );
  
  // Route to get recent audit logs
  // Protected by AuthGuard to ensure only authenticated users can access
  router.get('/recent/:limit?', 
    authGuard.requireAuth(), 
    async (req, res) => {
      try {
        const limit = parseInt(req.params.limit || '10', 10);
        
        // Get company ID from authenticated user or fall back to default company
        let companyId;
        const company = await storage.getCompany();
        if (company) {
          companyId = company.id;
        }
        
        const logs = await storage.getAuditLogs({
          companyId,
          limit
        });
        
        return res.status(200).json(logs);
      } catch (error) {
        console.error('Error retrieving recent audit logs:', error);
        return res.status(500).json({ message: 'Error retrieving recent audit logs' });
      }
    }
  );
  
  // Search audit logs with various filters
  router.get('/search', 
    authGuard.requireAuth(),
    authGuard.requireRoles(['admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        // Extract query parameters for filtering
        const { entity, action, userId, from, to, limit } = req.query;
        const queryLimit = limit ? parseInt(limit as string, 10) : 50;
        
        // Get company ID from authenticated user or fall back to default company
        let companyId;
        const company = await storage.getCompany();
        if (company) {
          companyId = company.id;
        }
        
        // Construct filter options for the storage query
        const options: any = {
          companyId,
          limit: queryLimit
        };
        
        // Add optional filters if provided
        if (entity) options.entity = entity as string;
        if (action) options.action = action as string;
        if (userId) options.userId = userId as string;
        
        // Query the database with the constructed filters
        const logs = await storage.getAuditLogs(options);
        
        return res.status(200).json({
          count: logs.length,
          logs,
          filters: {
            companyId,
            entity: entity || null,
            action: action || null,
            userId: userId || null,
            limit: queryLimit
          }
        });
      } catch (error) {
        console.error('Error searching audit logs:', error);
        return res.status(500).json({ message: 'Error searching audit logs' });
      }
    }
  );
  
  // Get audit statistics - top users, most frequent actions, etc.
  router.get('/stats', 
    authGuard.requireAuth(), 
    async (req: Request, res: Response) => {
      try {
        // Get company ID from authenticated user or fall back to default company
        let companyId;
        const company = await storage.getCompany();
        if (company) {
          companyId = company.id;
        }
        
        // Get recent logs to analyze
        const logs = await storage.getAuditLogs({
          companyId,
          limit: 100 // Use latest 100 logs for stats
        });
        
        // Calculate simple statistics from the logs
        const stats = {
          totalLogs: logs.length,
          byEntity: countByProperty(logs, 'entity'),
          byAction: countByProperty(logs, 'action'),
          byUser: countByProperty(logs, 'userId'),
          recentActivity: logs.slice(0, 5).map(log => ({
            action: log.action,
            entity: log.entity,
            timestamp: log.createdAt,
            user: log.userId
          }))
        };
        
        return res.status(200).json(stats);
      } catch (error) {
        console.error('Error generating audit statistics:', error);
        return res.status(500).json({ message: 'Error generating audit statistics' });
      }
    }
  );
  
  // User activity monitoring - track a specific user's actions
  router.get('/user/:userId', 
    authGuard.requireAuth(), 
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string || '1', 10);
        const pageSize = parseInt(req.query.pageSize as string || '20', 10);
        const offset = (page - 1) * pageSize;
        
        // Get company ID from authenticated user or fall back to default company
        let companyId;
        const company = await storage.getCompany();
        if (company) {
          companyId = company.id;
        }
        
        // Load specific user details
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Get user's activity logs with pagination
        const logs = await storage.getAuditLogs({
          companyId,
          userId,
          limit: pageSize,
          offset
        });
        
        // Analyze user activity patterns
        const userStats = {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          activity: {
            totalLogs: logs.length,
            byEntity: countByProperty(logs, 'entity'),
            byAction: countByProperty(logs, 'action'),
            mostRecentActivity: logs[0] ? logs[0].createdAt : null,
          },
          logs,
          pagination: {
            page,
            pageSize,
            offset,
          }
        };
        
        return res.status(200).json(userStats);
      } catch (error) {
        console.error('Error retrieving user activity logs:', error);
        return res.status(500).json({ message: 'Error retrieving user activity logs' });
      }
    }
  );
  
  // Route for monitoring administrative actions
  router.get('/admin-actions', 
    authGuard.requireAuth(),
    authGuard.requireRoles(['admin']),
    async (req: Request, res: Response) => {
      try {
        // Get all admin-level actions
        const adminActionPatterns = ['DELETE_', 'ADMIN_', 'CONFIG_UPDATE', 'USER_CREATE', 'ROLE_'];
        const logs = await storage.getAuditLogs({
          limit: 100
        });
        
        // Filter logs for admin-level actions
        const adminLogs = logs.filter(log => 
          adminActionPatterns.some(pattern => log.action.includes(pattern))
        );
        
        return res.status(200).json({
          count: adminLogs.length,
          logs: adminLogs,
          note: 'This endpoint returns sensitive administrative actions for security monitoring'
        });
      } catch (error) {
        console.error('Error retrieving admin action logs:', error);
        return res.status(500).json({ message: 'Error retrieving admin action logs' });
      }
    }
  );
  
  return router;
}

/**
 * Helper function to count occurrences of a property in an array of objects
 */
function countByProperty<T>(items: T[], property: keyof T): Record<string, number> {
  return items.reduce((acc, item) => {
    const key = String(item[property] || 'unknown');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}