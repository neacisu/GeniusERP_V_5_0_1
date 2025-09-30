/**
 * Global Services Registry
 * 
 * This module provides centralized access to singleton service instances
 * across the application without the need for a full DI container.
 */
import AuditService from '../../modules/audit/services/audit.service';
import { getDrizzle } from '../drizzle';
import { notificationService } from './notification.service';

// Create audit service instance for the registry
const auditServiceInstance = AuditService;

/**
 * Global Services Registry for accessing singletons throughout the application
 */
export const Services = {
  /**
   * Centralized audit service for logging actions across the application
   */
  audit: auditServiceInstance,
  
  /**
   * Drizzle database service access
   */
  db: getDrizzle(),

  /**
   * Notification service for sending alerts across the application
   */
  notification: notificationService,
};

/**
 * Type definition for the Services registry
 * Use this to get proper type hints when accessing the Services registry
 */
export type ServiceRegistry = typeof Services;

/**
 * Utility function to access NotificationService for static contexts
 * This is useful when you don't have access to the Services object,
 * such as in utility functions or static methods
 */
export function getNotificationService() {
  return Services.notification;
}

/**
 * Utility function to access AuditService for static contexts
 * This is useful when you don't have access to the Services object,
 * such as in utility functions or static methods
 */
export function getAuditService(): typeof AuditService {
  return Services.audit;
}

/**
 * Static method for creating audit logs
 * This serves as a convenient shorthand for commonly used logging functionality
 */
export async function logAction(params: {
  companyId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, any>;
}): Promise<string> {
  return AuditService.log(params as any);
}