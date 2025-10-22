import { Router, Request, Response, NextFunction } from 'express';
import AuditService from '../services/audit.service';
import { getDrizzle } from "@common/drizzle";
import { auditLogs } from '../schema/audit.schema';
import { storage } from '../../../storage';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthMode } from '../../auth';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { eq, and, or, desc, like } from 'drizzle-orm';

// Create AuditService instance
const auditService = new AuditService();
// Get database instance
const db = getDrizzle();

export function initAuditRoutes() {
  const router = Router();
  
  // Route to manually create an audit log (for testing)
  // Protected by AuthGuard to ensure only authenticated users can access
  router.post('/test', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
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
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(['admin', 'auditor', 'accountant']),
    async (req, res) => {
      try {
        const { entity, entityId } = req.params;
        
        // Get company ID from authenticated user or fall back to default company
        let companyId = req.user?.companyId;
        if (!companyId) {
          const company = await storage.getCompany();
          if (company) {
            companyId = company.id;
          } else {
            return res.status(400).json({ message: 'No company context found' });
          }
        }
        
        // Use AuditService directly instead of storage
        const logs = await AuditService.getEntityLogs(entity, entityId, companyId);
        
        return res.status(200).json(logs);
      } catch (error) {
        console.error('Error retrieving audit logs:', error);
        return res.status(500).json({ message: 'Error retrieving audit logs' });
      }
    }
  );
  
  // Route to get recent audit logs - with limit
  router.get('/recent/:limit', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req, res) => {
      try {
        const limit = parseInt(req.params.limit || '10', 10);
        
        // Get company ID from authenticated user or fall back to default company
        let companyId = req.user?.companyId;
        
        // If no company ID, use default company or allow admins to see all
        if (!companyId) {
          companyId = '7196288d-7314-4512-8b67-2c82449b5465'; // Default company ID
        }
        
        const logs = await db.select()
          .from(auditLogs)
          .where(eq(auditLogs.companyId, companyId))
          .orderBy(desc(auditLogs.createdAt))
          .limit(limit);
        
        return res.json({
          success: true,
          data: logs,
        });
      } catch (error) {
        console.error('Error fetching recent audit logs:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch audit logs',
        });
      }
    }
  );
  
  // Route to get recent audit logs - without limit (default to 10)
  router.get('/recent', 
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req, res) => {
      try {
        const limit = 10;
        
        // Get company ID from authenticated user or fall back to default company
        let companyId = req.user?.companyId;
        
        // If no company ID, use default company or allow admins to see all
        if (!companyId) {
          companyId = '7196288d-7314-4512-8b67-2c82449b5465'; // Default company ID
        }
        
        const logs = await db.select()
          .from(auditLogs)
          .where(eq(auditLogs.companyId, companyId))
          .orderBy(desc(auditLogs.createdAt))
          .limit(limit);
        
        return res.json({
          success: true,
          data: logs,
        });
      } catch (error) {
        console.error('Error fetching recent audit logs:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch audit logs',
        });
      }
    }
  );
  
  // Search audit logs with various filters
  router.get('/search', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(['admin', 'auditor']),
    async (req: Request, res: Response) => {
      try {
        // Extract query parameters for filtering
        const { entity, action, userId, from, to, limit } = req.query;
        const queryLimit = limit ? parseInt(limit as string, 10) : 50;
        
        // Get company ID from authenticated user or fall back to default company
        let companyId = req.user?.companyId;
        if (!companyId) {
          const company = await storage.getCompany();
          if (company) {
            companyId = company.id;
          } else {
            return res.status(400).json({ message: 'No company context found' });
          }
        }
        
        // Use DrizzleService for more advanced filtering
        
        // Build query filters dynamically
        const filters: any[] = [eq(auditLogs.companyId, companyId)];
        
        // Add optional filters if provided
        if (entity) filters.push(eq(auditLogs.entity, entity as string));
        if (action) filters.push(like(auditLogs.action, `%${action as string}%`));
        if (userId) filters.push(eq(auditLogs.userId, userId as string));
        
        // Execute the query with all applicable filters
        const logs = await db.select()
          .from(auditLogs)
          .where(and(...filters))
          .orderBy(desc(auditLogs.createdAt))
          .limit(queryLimit);
        
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
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req: Request, res: Response) => {
      try {
        // Get company ID from authenticated user or fall back to default company
        let companyId = req.user?.companyId;
        if (!companyId) {
          const company = await storage.getCompany();
          if (company) {
            companyId = company.id;
          } else {
            return res.status(400).json({ message: 'No company context found' });
          }
        }
        
        // Use DrizzleService for more advanced stats collection
        
        // Get recent logs to analyze (latest 100)
        const logs = await db.select()
          .from(auditLogs)
          .where(eq(auditLogs.companyId, companyId))
          .orderBy(desc(auditLogs.createdAt))
          .limit(100);
        
        // Calculate simple statistics from the logs
        const stats = {
          totalLogs: logs.length,
          byEntity: countByProperty(logs, 'entity'),
          byAction: countByProperty(logs, 'action'),
          byUser: countByProperty(logs, 'userId'),
          recentActivity: logs.slice(0, 5).map((log: any) => ({
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
    AuthGuard.protect(JwtAuthMode.REQUIRED), 
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string || '1', 10);
        const pageSize = parseInt(req.query.pageSize as string || '20', 10);
        const offset = (page - 1) * pageSize;
        
        // Get company ID from authenticated user or fall back to default company
        let companyId = req.user?.companyId;
        if (!companyId) {
          const company = await storage.getCompany();
          if (company) {
            companyId = company.id;
          } else {
            return res.status(400).json({ message: 'No company context found' });
          }
        }
        
        // Load specific user details
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Use DrizzleService for direct database access
        
        // Get user's activity logs with pagination
        const logs = await db.select()
          .from(auditLogs)
          .where(and(
            eq(auditLogs.companyId, companyId),
            eq(auditLogs.userId, userId)
          ))
          .orderBy(desc(auditLogs.createdAt))
          .limit(pageSize)
          .offset(offset);
        
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
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(['admin']),
    async (req: Request, res: Response) => {
      try {
        // Get company ID from authenticated user or fall back to default company
        let companyId = req.user?.companyId;
        if (!companyId) {
          const company = await storage.getCompany();
          if (company) {
            companyId = company.id;
          } else {
            return res.status(400).json({ message: 'No company context found' });
          }
        }
        
        // Use DrizzleService for SQL-based filtering
        
        // Define admin action patterns to look for
        const adminActionPatterns = ['DELETE_', 'ADMIN_', 'CONFIG_UPDATE', 'USER_CREATE', 'ROLE_'];
        
        // We'll use OR conditions with LIKE to find matching actions
        const actionFilters: any[] = adminActionPatterns.map(pattern => 
          like(auditLogs.action, `%${pattern}%`)
        );
        
        // Execute the query with company filter and action filters
        const logs = await db.select()
          .from(auditLogs)
          .where(and(
            eq(auditLogs.companyId, companyId),
            or(...actionFilters)
          ))
          .orderBy(desc(auditLogs.createdAt))
          .limit(100);
        
        return res.status(200).json({
          count: logs.length,
          logs,
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