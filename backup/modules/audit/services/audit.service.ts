/**
 * Audit Service
 * 
 * This service handles the logging of audit events in the system.
 * It records user actions, changes to entities, and other important events.
 */

import { v4 as uuidv4 } from 'uuid';
import getDrizzle from '../../../common/drizzle';
import { auditLogs, InsertAuditLog } from '../schema/audit.schema';
import { and, eq, desc } from 'drizzle-orm';

/**
 * Audit action types
 */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VALIDATE = 'VALIDATE',
  DEVALIDATE = 'DEVALIDATE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  VIEW = 'VIEW',
  INTEGRATION_ACTIVATE = 'INTEGRATION_ACTIVATE',
  BPM_PROCESS_ACTION = 'BPM_PROCESS_ACTION',
  BPM_PROCESS_VIEW = 'BPM_PROCESS_VIEW'
}

/**
 * Audit log entry data
 */
export interface AuditLogData {
  userId: string;
  companyId: string;
  franchiseId?: string;
  action: AuditAction | string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit service for logging system events
 */
export class AuditService {
  /**
   * Log an audit event from a request
   * @param req Express request object
   * @param data Partial audit log data
   * @returns Created audit log entry ID
   */
  static async logFromRequest(req: any, data: Partial<AuditLogData>): Promise<string> {
    // Extract user information from the request
    const user = req.user || {};
    const userId = user.id || 'anonymous';
    const companyId = user.companyId || data.companyId || 'unknown';
    
    // Extract request metadata
    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const userAgent = req.headers?.['user-agent'] || '';
    
    // Combine with provided data
    return AuditService.log({
      userId,
      companyId,
      action: data.action || 'UNKNOWN',
      entity: data.entity || 'unknown',
      entityId: data.entityId || 'unknown',
      details: {
        ...data.details,
        requestId: req.id,
        method: req.method,
        path: req.path,
      },
      ipAddress,
      userAgent,
      ...data,
    });
  }

  /**
   * Log an audit event
   * @param data Audit log data
   * @returns Created audit log entry ID
   */
  static async log(data: AuditLogData): Promise<string> {
    const {
      userId,
      companyId,
      franchiseId,
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent
    } = data;

    // Validate company access
    if (!companyId) {
      console.error('[AuditService] Company ID is required');
      return '';
    }
    
    try {
      const db = getDrizzle();
      
      const now = new Date();
      const auditLogId = uuidv4();
      
      // Create the audit data object based on the fields we know exist in the database
      const auditData: InsertAuditLog = {
        id: auditLogId,
        userId,
        companyId,
        // Remove franchiseId as it doesn't exist in the current schema
        action: action.toString(),
        entity,
        entityId,
        details: details || {},
        // Remove ipAddress, userAgent as they may not exist in the current schema
        createdAt: now,
        // updatedAt may not exist in the current schema, remove it
      };
      
      await db.insert(auditLogs).values(auditData);
      
      return auditLogId;
    } catch (error) {
      console.error(`[AuditService] Error logging audit event: ${(error as Error).message}`);
      // Don't throw here, just return empty string to avoid breaking functionality
      return '';
    }
  }
  
  /**
   * Get audit logs for an entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param companyId Company ID
   * @param limit Maximum number of logs to return
   * @returns Array of audit logs
   */
  static async getEntityLogs(
    entityType: string,
    entityId: string,
    companyId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const db = getDrizzle();
      
      const logs = await db.select().from(auditLogs)
        .where(
          and(
            eq(auditLogs.entity, entityType),
            eq(auditLogs.entityId, entityId),
            eq(auditLogs.companyId, companyId)
          )
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
      
      return logs;
    } catch (error) {
      console.error(`[AuditService] Error fetching entity logs: ${(error as Error).message}`);
      return [];
    }
  }
  
  /**
   * Get audit logs for a user
   * @param userId User ID
   * @param companyId Company ID
   * @param limit Maximum number of logs to return
   * @returns Array of audit logs
   */
  static async getUserLogs(
    userId: string,
    companyId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const db = getDrizzle();
      
      const logs = await db.select().from(auditLogs)
        .where(
          and(
            eq(auditLogs.userId, userId),
            eq(auditLogs.companyId, companyId)
          )
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
      
      return logs;
    } catch (error) {
      console.error(`[AuditService] Error fetching user logs: ${(error as Error).message}`);
      return [];
    }
  }
}

export default AuditService;