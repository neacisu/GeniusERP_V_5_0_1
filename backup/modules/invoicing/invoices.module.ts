/**
 * Invoices Module
 * 
 * Main entry point for the invoices module. Registers all services, controllers,
 * and routes for invoice management, following NX monorepo and feature-by-folder structure.
 */

import { Router } from 'express';
import { exchangeRateService } from '../integrations/services/exchange-rate.service';
import { InvoiceService } from './services/invoice.service';
import { CreateInvoiceService } from './services/create-invoice.service';
import createInvoiceRoute from './routes/create-invoice.route';
import { log } from '../../vite';

// Entity name used for audit logging
export const ENTITY_NAME = 'invoice';

export class InvoicesModule {
  /**
   * Register the module components with the application
   * @param app Express application
   * @returns Registered components
   */
  static register(app: any) {
    log('📝 Registering invoices module with granular routes', 'invoices-module');
    
    // Register the v1 invoice route directly at the root level
    // This is necessary since the route now includes the full path '/v1/invoices/create'
    app.use(createInvoiceRoute);
    
    // Return registered components
    return {
      services: [InvoiceService, CreateInvoiceService, exchangeRateService],
      routes: [createInvoiceRoute],
    };
  }
}