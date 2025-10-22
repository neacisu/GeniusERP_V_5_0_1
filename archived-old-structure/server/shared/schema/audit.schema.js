/**
 * Audit Schema Constants
 * 
 * This file defines constants and types for the audit system.
 */

/**
 * Audit Action Enum
 * 
 * Defines the possible actions for audit logs.
 */
export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  EXECUTE: 'EXECUTE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  SUBMIT: 'SUBMIT',
  CANCEL: 'CANCEL',
  COMPLETE: 'COMPLETE',
};