/**
 * Invoicing Module Initialization
 * 
 * This file initializes the invoicing module, registering all the services,
 * routes, and controllers needed for invoice management.
 */

import { Express, Router } from 'express';
import { InvoiceService } from './services/invoice.service';
import { CreateInvoiceService } from './services/create-invoice.service';
import { ExchangeRateService } from '../integrations/services/exchange-rate.service';
import { router as invoiceRoutes } from './routes/invoice.routes';
import validateInvoiceRoute from './routes/validate-invoice.route';
import devalidateInvoiceRoute from './routes/devalidate-invoice.route';
import { ValidateInvoiceService } from './services/validate-invoice.service';
import { DevalidateInvoiceService } from './services/devalidate-invoice.service';
import authGuard from '../auth/guards/auth.guard';
import { JwtAuthMode } from '../auth/types';

// Export entity name for reference in other modules
export const ENTITY_NAME = 'invoice';

/**
 * Initialize the invoicing module
 * 
 * @param app Express application instance
 * @returns The router for the invoicing module
 */
export function initInvoicingModule(app: Express) {
  const router = Router();
  
  // Register invoice routes with authentication middleware
  router.use(
    '/invoices',
    authGuard.requireAuth(), // Require authentication for all invoice routes
    invoiceRoutes
  );
  
  // Register validation routes
  router.use(
    '/invoices/validate',
    authGuard.requireAuth(),
    validateInvoiceRoute
  );
  
  // Register devalidation routes
  router.use(
    '/invoices/devalidate',
    authGuard.requireAuth(),
    devalidateInvoiceRoute
  );
  
  // Mount the router at the API endpoint
  app.use('/api/v1', router);
  
  console.log('Invoicing module initialized');
  
  return router;
}

// Export the module's components
export const InvoicingModule = {
  services: [
    InvoiceService,
    CreateInvoiceService,
    ExchangeRateService,
    ValidateInvoiceService,
    DevalidateInvoiceService
  ],
  routes: [
    invoiceRoutes,
    validateInvoiceRoute,
    devalidateInvoiceRoute
  ]
};

export default InvoicingModule;