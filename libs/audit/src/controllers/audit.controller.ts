/**
 * Audit Controller
 * 
 * This controller handles audit log operations for retrieving entity and user activity logs.
 */

import { Request, Response, NextFunction } from 'express';
import AuditService from '../services/audit.service';
import { Logger } from "@common/logger";
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { auditLogs } from '@geniuserp/shared';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { storage } from '../../../../apps/api/src/storage';
import { v4 as uuidv4 } from 'uuid';

export class AuditController {
  private logger: Logger;
  private drizzle: DrizzleService;

  constructor() {
    this.logger = new Logger('AuditController');
    this.drizzle = new DrizzleService();
  }

  /**
   * Get audit logs for an entity
   */
  async getEntityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const companyId = req.user?.companyId || '';
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 50;
      
      this.logger.debug(`Getting audit logs for entity ${entityType}:${entityId} in company ${companyId}`);
      
      if (!companyId) {
        this.logger.warn('Company ID is required for audit logs');
        res.status(400).json({ message: 'Company ID is required' });
        return;
      }
      
      const logs = await AuditService.getEntityLogs(entityType, entityId, companyId, limit);
      
      this.logger.debug(`Retrieved ${logs.length} audit logs for entity ${entityType}:${entityId}`);
      res.json(logs);
    } catch (error) {
      this.logger.error('Error getting entity audit logs:', error);
      next(error);
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const companyId = req.user?.companyId || '';
      const page = parseInt(req.query['page'] as string || '1', 10);
      const pageSize = parseInt(req.query['pageSize'] as string || '20', 10);
      const offset = (page - 1) * pageSize;
      
      this.logger.debug(`Getting audit logs for user ${userId} in company ${companyId}`);
      
      if (!companyId) {
        this.logger.warn('Company ID is required for audit logs');
        res.status(400).json({ message: 'Company ID is required' });
        return;
      }
      
      // Load specific user details
      const user = await storage.getUser(userId);
      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Get user's activity logs with pagination
      const logs = await this.drizzle.db.select()
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
          byEntity: this.countByProperty(logs, 'entity'),
          byAction: this.countByProperty(logs, 'action'),
          mostRecentActivity: logs[0] ? logs[0].createdAt : null,
        },
        logs,
        pagination: {
          page,
          pageSize,
          offset,
        }
      };
      
      this.logger.debug(`Retrieved ${logs.length} audit logs for user ${userId}`);
      res.json(userStats);
    } catch (error) {
      this.logger.error('Error getting user audit logs:', error);
      next(error);
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.params['limit'] || '10', 10);
      
      // Get company ID from authenticated user
      const companyId = req.user?.companyId || '';
      
      if (!companyId) {
        this.logger.warn('Company ID is required for audit logs');
        res.status(400).json({ message: 'Company ID is required' });
        return;
      }
      
      this.logger.debug(`Getting recent audit logs for company ${companyId}`);
      
      // Use DrizzleService directly for more complex querying
      const logs = await this.drizzle.db.select()
        .from(auditLogs)
        .where(eq(auditLogs.companyId, companyId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
      
      this.logger.debug(`Retrieved ${logs.length} recent audit logs`);
      res.json(logs);
    } catch (error) {
      this.logger.error('Error retrieving recent audit logs:', error);
      next(error);
    }
  }

  /**
   * Search audit logs with filters
   */
  async searchLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract query parameters for filtering
      const { entity, action, userId, limit } = req.query;
      const queryLimit = limit ? parseInt(limit as string, 10) : 50;
      
      // Get company ID from authenticated user
      const companyId = req.user?.companyId || '';
      
      if (!companyId) {
        this.logger.warn('Company ID is required for audit logs');
        res.status(400).json({ message: 'Company ID is required' });
        return;
      }
      
      this.logger.debug(`Searching audit logs for company ${companyId}`);
      
      // Build query filters dynamically
      const filters: any[] = [eq(auditLogs.companyId, companyId)];
      
      // Add optional filters if provided
      if (entity) filters.push(eq(auditLogs.entity, entity as string));
      if (action) filters.push(like(auditLogs.action, `%${action as string}%`));
      if (userId) filters.push(eq(auditLogs.userId, userId as string));
      
      // Execute the query with all applicable filters
      const logs = await this.drizzle.db.select()
        .from(auditLogs)
        .where(and(...filters))
        .orderBy(desc(auditLogs.createdAt))
        .limit(queryLimit);
      
      this.logger.debug(`Found ${logs.length} audit logs matching search criteria`);
      res.json({
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
      this.logger.error('Error searching audit logs:', error);
      next(error);
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get company ID from authenticated user
      const companyId = req.user?.companyId || '';
      
      if (!companyId) {
        this.logger.warn('Company ID is required for audit logs');
        res.status(400).json({ message: 'Company ID is required' });
        return;
      }
      
      this.logger.debug(`Getting audit statistics for company ${companyId}`);
      
      // Get recent logs to analyze (latest 100)
      const logs = await this.drizzle.db.select()
        .from(auditLogs)
        .where(eq(auditLogs.companyId, companyId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);
      
      // Calculate simple statistics from the logs
      const stats = {
        totalLogs: logs.length,
        byEntity: this.countByProperty(logs, 'entity'),
        byAction: this.countByProperty(logs, 'action'),
        byUser: this.countByProperty(logs, 'userId'),
        recentActivity: logs.slice(0, 5).map((log: any) => ({
          action: log.action,
          entity: log.entity,
          timestamp: log.createdAt,
          user: log.userId
        }))
      };
      
      this.logger.debug(`Generated audit statistics from ${logs.length} logs`);
      res.json(stats);
    } catch (error) {
      this.logger.error('Error generating audit statistics:', error);
      next(error);
    }
  }

  /**
   * Get administrative actions
   */
  async getAdminActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get company ID from authenticated user
      const companyId = req.user?.companyId || '';
      
      if (!companyId) {
        this.logger.warn('Company ID is required for audit logs');
        res.status(400).json({ message: 'Company ID is required' });
        return;
      }
      
      this.logger.debug(`Getting admin actions for company ${companyId}`);
      
      // Define admin action patterns to look for
      const adminActionPatterns = ['DELETE_', 'ADMIN_', 'CONFIG_UPDATE', 'USER_CREATE', 'ROLE_'];
      
      // We'll use OR conditions with LIKE to find matching actions
      const actionFilters: any[] = adminActionPatterns.map(pattern => 
        like(auditLogs.action, `%${pattern}%`)
      );
      
      // Execute the query with company filter and action filters
      const logs = await this.drizzle.db.select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.companyId, companyId),
          or(...actionFilters)
        ))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);
      
      this.logger.debug(`Retrieved ${logs.length} admin action logs`);
      res.json({
        count: logs.length,
        logs,
        note: 'This endpoint returns sensitive administrative actions for security monitoring'
      });
    } catch (error) {
      this.logger.error('Error retrieving admin action logs:', error);
      next(error);
    }
  }

  /**
   * Create a test audit log entry
   */
  async createTestAuditLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get company ID from the request - or fall back to default company
      let companyId = req.body.companyId;
      if (!companyId) {
        const company = await storage.getCompany();
        if (!company) {
          this.logger.warn('No company found for test audit log');
          res.status(400).json({ message: 'No company found for test audit log' });
          return;
        }
        companyId = company.id;
      }
      
      // Generate a random entity ID if not provided
      const entityId = req.body.entityId || uuidv4();
      
      this.logger.debug(`Creating test audit log for company ${companyId}`);
      
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
      
      this.logger.debug(`Created test audit log for entity ${entityId}`);
      res.json({ 
        message: 'Audit log created successfully',
        entityId 
      });
    } catch (error) {
      this.logger.error('Error creating test audit log:', error);
      next(error);
    }
  }

  /**
   * Create a new audit log entry
   */
  async createAuditLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logData = req.body;
      
      // Ensure companyId from authenticated user
      if (!logData.companyId && req.user?.companyId) {
        logData.companyId = req.user.companyId;
      }
      
      // Ensure userId from authenticated user if not provided
      if (!logData.userId && req.user?.id) {
        logData.userId = req.user.id;
      }
      
      this.logger.debug(`Creating audit log: ${logData.action} on ${logData.entity}`);
      
      const logId = await AuditService.log(logData);
      
      if (!logId) {
        this.logger.warn('Failed to create audit log');
        res.status(500).json({ message: 'Failed to create audit log' });
        return;
      }
      
      this.logger.debug(`Created audit log with ID: ${logId}`);
      res.status(201).json({ id: logId });
    } catch (error) {
      this.logger.error('Error creating audit log:', error);
      next(error);
    }
  }

  /**
   * Helper function to count occurrences of a property in an array of objects
   */
  private countByProperty(items: any[], property: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = String(item[property] || 'unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}