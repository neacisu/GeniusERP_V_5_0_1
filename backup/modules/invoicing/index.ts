/**
 * Invoicing Module
 * 
 * This module handles the Romanian-compliant invoicing system with all
 * necessary operations for creating, managing, and retrieving invoices.
 */

import express from 'express';
import { storage } from '../../storage';
import { router as invoiceRoutes } from './routes/invoice.routes';
import { AuditService } from '../audit/services/audit.service';
import { AuditActionType } from '../../common/enums/audit-action.enum';
import authGuard from '../auth/guards/auth.guard';
import { JwtAuthMode } from '../auth/types';

const router = express.Router();

// Set the storage instance for the module
export const setStorage = (storageInstance: typeof storage) => {
  // This can be useful for testing or dependency injection
};

// Register the invoice routes and apply middleware
router.use(
  '/api/invoices',
  authGuard.requireAuth(), // Require authentication for all invoice routes
  invoiceRoutes
);

// Export the router
export { router };

// Entity name used for audit logging
export const ENTITY_NAME = 'invoice';