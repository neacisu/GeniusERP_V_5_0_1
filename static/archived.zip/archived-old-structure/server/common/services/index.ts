/**
 * Services Index
 * 
 * This file re-exports all services from the registry for a cleaner import experience.
 * Import services from this file when using them in your modules:
 * 
 * ```
 * import { Services } from '@/common/services';
 * 
 * // Use the audit service
 * await Services.audit.createLog({...});
 * 
 * // Or use the convenience function
 * import { logAction } from '@/common/services';
 * 
 * await logAction({...});
 * ```
 */

export * from './registry';