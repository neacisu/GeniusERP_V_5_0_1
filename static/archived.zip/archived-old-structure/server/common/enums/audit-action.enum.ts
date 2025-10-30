/**
 * Audit Action Type Enum
 * 
 * Defines standard action types for audit logging to ensure consistency
 * across the application.
 */

export enum AuditActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  REJECT = 'reject',
  VOID = 'void',
  RESTORE = 'restore'
}