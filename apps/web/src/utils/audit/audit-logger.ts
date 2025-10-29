/**
 * Client-side audit logging
 * 
 * This module provides a mechanism for comprehensive audit logging of user actions 
 * on the client-side. It captures detailed information about each action, 
 * including what was done, by whom, on what entity, and additional context.
 * 
 * These logs are essential for:
 * - Security and compliance tracking
 * - User activity monitoring
 * - Troubleshooting user-reported issues
 * - Understanding user behavior patterns
 */

import { createLogger } from '../logger/logger';

// Initialize a logger for the audit system itself
const logger = createLogger('audit-logger');

// Supported audit action types
export type AuditAction = 
  | 'create'   // Creating a new resource
  | 'read'     // Viewing or accessing a resource
  | 'update'   // Modifying an existing resource
  | 'delete'   // Removing a resource
  | 'login'    // User authentication
  | 'logout'   // User session termination
  | 'export'   // Exporting data
  | 'import'   // Importing data
  | 'approve'  // Approval action
  | 'reject'   // Rejection action
  | 'submit'   // Submission action
  | 'download' // Downloading content
  | 'upload'   // Uploading content
  | 'share'    // Sharing resources
  | 'custom';  // Custom action type

// Status of the audit event
export type AuditStatus = 'success' | 'failure' | 'warning' | 'info';

// Structure for audit event data
export interface AuditEvent {
  // Core event information
  action: AuditAction;
  entityType: string;
  entityId: string;
  timestamp?: string;
  userId?: string;
  username?: string;
  
  // Additional information
  details?: Record<string, any>;
  status?: AuditStatus;
  metadata?: Record<string, any>;
}

/**
 * Client-side audit logger to record user actions
 */
export class AuditLogger {
  private moduleName: string;
  private userInfo: { id?: string; username?: string } = {};
  
  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }
  
  /**
   * Set the current user information for all future audit logs
   */
  public setUser(userId: string, username: string): void {
    this.userInfo = { id: userId, username };
    logger.debug(`Audit user set for ${this.moduleName}`, { 
      context: { userId, username } 
    });
  }
  
  /**
   * Clear user information when user logs out
   */
  public clearUser(): void {
    this.userInfo = {};
    logger.debug(`Audit user cleared for ${this.moduleName}`);
  }
  
  /**
   * Log an audit event
   */
  public log(event: AuditEvent): void {
    // Add timestamp if not provided
    const timestamp = event.timestamp || new Date().toISOString();
    
    // Add user info if available and not already provided
    const userId = event.userId || this.userInfo.id;
    const username = event.username || this.userInfo.username;
    
    // Default status to success if not specified
    const status = event.status || 'success';
    
    // Complete audit event
    const auditEvent = {
      ...event,
      timestamp,
      userId,
      username,
      status,
      module: this.moduleName,
    };
    
    // Log to console in development
    if (process.env['NODE_ENV'] !== 'production') {
      this.logToConsole(auditEvent);
    }
    
    // In a real application, this would send the audit event to a server endpoint
    // for persistent storage and compliance purposes
    this.sendToServer(auditEvent);
  }
  
  /**
   * Log a formatted message to the console for development
   */
  private logToConsole(event: AuditEvent & { module: string }): void {
    const { 
      action, 
      entityType, 
      entityId, 
      module, 
      timestamp, 
      userId, 
      username,
      status = 'success',
      details,
      metadata
    } = event;
    
    const userPart = userId ? `by user ${username || userId}` : 'by anonymous user';
    const message = `AUDIT [${status.toUpperCase()}]: ${action} ${entityType} "${entityId}" ${userPart}`;
    
    // Log the event with appropriate log level based on status
    switch (status) {
      case 'failure':
        logger.error(message, { 
          context: { module, details, metadata, timestamp } 
        });
        break;
      case 'warning':
        logger.warn(message, { 
          context: { module, details, metadata, timestamp } 
        });
        break;
      default:
        logger.info(message, { 
          context: { module, details, metadata, timestamp } 
        });
    }
  }
  
  /**
   * Send the audit event to a server endpoint
   * In a real application, this would make an API call
   */
  private sendToServer(event: AuditEvent & { module: string }): void {
    // This is a stub. In a real application, this would use fetch or axios
    // to send the audit log to a server endpoint
    
    // For now, we'll just log that we would have sent it
    if (process.env['NODE_ENV'] === 'development') {
      logger.debug('Would send audit event to server', { 
        context: { endpoint: '/api/audit/log', eventType: event.action }
      });
    }
    
    // Example of what the real implementation might look like:
    /*
    fetch('/api/audit/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
      // Include credentials to ensure the server gets the session cookie
      credentials: 'include',
    }).catch(error => {
      logger.error('Failed to send audit log to server', { 
        context: { error: error['message'], event } 
      });
    });
    */
  }
}

/**
 * Factory function to create audit loggers for different modules
 */
export function createAuditLogger(moduleName: string): AuditLogger {
  return new AuditLogger(moduleName);
}

/**
 * Singleton for application-wide audit logger
 */
export const appAuditLogger = createAuditLogger('app');