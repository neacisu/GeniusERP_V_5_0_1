/**
 * Global Services Registry
 * 
 * This module provides centralized access to singleton service instances
 * across the application without the need for a full DI container.
 */
// NX Monorepo: Import from libs using @geniuserp alias
import AuditService from '@geniuserp/audit';
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

/**
 * Module registry for tracking registered application modules
 */
const moduleRegistry = new Map<string, ModuleRegistration>();

/**
 * Module registration information
 */
export interface ModuleRegistration {
  name: string;
  version: string;
  services?: Record<string, any>;
  permissions?: string[];
}

/**
 * Register a module with the service registry
 * This allows modules to expose their services globally and track module information
 * 
 * @param moduleId - Unique identifier for the module
 * @param moduleInfo - Module registration information
 */
export function registerModule(moduleId: string, moduleInfo: ModuleRegistration): void {
  moduleRegistry.set(moduleId, moduleInfo);
  
  // If the module provides services, add them to the global Services object
  if (moduleInfo.services) {
    Object.keys(moduleInfo.services).forEach(serviceKey => {
      (Services as any)[serviceKey] = moduleInfo.services![serviceKey];
    });
  }
}

/**
 * Get information about a registered module
 * 
 * @param moduleId - Unique identifier for the module
 * @returns Module registration information or undefined if not found
 */
export function getModule(moduleId: string): ModuleRegistration | undefined {
  return moduleRegistry.get(moduleId);
}

/**
 * Get all registered modules
 * 
 * @returns Array of all registered modules
 */
export function getAllModules(): ModuleRegistration[] {
  return Array.from(moduleRegistry.values());
}