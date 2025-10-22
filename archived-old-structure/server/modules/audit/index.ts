/**
 * Audit Module Entry Point
 * 
 * This file exports the audit module and initializes it when requested.
 * It also exports the AuditService for use in other modules.
 */

import { Express, Router } from 'express';
import { auditModule } from './audit.module';
import AuditService from './services/audit.service';

/**
 * Initialize the Audit module
 * 
 * @param app Express application
 * @returns The router that was set up
 */
export function initAuditModule(app: Express): Router {
  return auditModule.initRoutes(app);
}

// Export the audit service for use in other modules
export { AuditService };