/**
 * Invoicing Module
 * 
 * This module handles the Romanian-compliant invoicing system with all
 * necessary operations for creating, managing, and retrieving invoices.
 */

import express from 'express';
import { storage } from '../../storage';
import { router as invoiceRoutes } from './routes/invoice.routes';
import { customerRoutes } from './routes/customer.routes';
import { AuditService } from '../audit/services/audit.service';
import { AuditActionType } from '../../common/enums/audit-action.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtAuthMode } from '../auth/constants/auth-mode.enum';

const router = express.Router();

// Set the storage instance for the module
export const setStorage = (storageInstance: typeof storage) => {
  // This can be useful for testing or dependency injection
};

// Register the customer routes at a separate base path to avoid conflicts
router.use(
  '/api/invoice-customers',
  AuthGuard.protect(JwtAuthMode.REQUIRED), // Require authentication for customer routes
  customerRoutes
);

// Register the main invoice routes and apply middleware
router.use(
  '/api/invoices',
  AuthGuard.protect(JwtAuthMode.REQUIRED), // Require authentication for all invoice routes
  invoiceRoutes
);

// Export the router
export { router };

// Entity name used for audit logging
export const ENTITY_NAME = 'invoice';