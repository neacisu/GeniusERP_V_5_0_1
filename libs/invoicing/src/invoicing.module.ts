/**
 * Invoicing Module
 * 
 * Central module for all invoicing-related functionality.
 */

import { Router } from 'express';
import { createModuleLogger } from "@common/logger/loki-logger";

const logger = createModuleLogger('InvoicingModule');
import { createInvoiceNumberingRoutes } from './routes/invoice-numbering.routes';

export class InvoicingModule {
  private router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Invoice Numbering Routes
    this.router.use('/numbering-settings', createInvoiceNumberingRoutes());

    // Log the setup
    logger.info('[InvoicingModule] Invoice numbering routes registered at /api/invoicing/numbering-settings');
  }

  getRouter(): Router {
    return this.router;
  }

  init(): void {
    logger.info('[InvoicingModule] Invoicing module initialized');
  }
}