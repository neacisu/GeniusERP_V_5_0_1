/**
 * Invoice Numbering Routes
 * 
 * Defines API routes for invoice numbering settings management.
 */

import { Router } from 'express';
import { InvoiceNumberingController } from '../controllers/invoice-numbering.controller';
import { AuthMiddleware } from "@api/middlewares/auth.middleware";
import { UserRole } from '@geniuserp/shared';

export class InvoiceNumberingRoutes {
  private router: Router;
  private controller: InvoiceNumberingController;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new InvoiceNumberingController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Get all invoice numbering settings
    this.router.get(
      '/',
      this.authMiddleware.authenticate(),
      this.authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]),
      this.controller.getAll.bind(this.controller)
    );

    // Get invoice numbering setting by ID
    this.router.get(
      '/:id',
      this.authMiddleware.authenticate(),
      this.authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]),
      this.controller.getById.bind(this.controller)
    );

    // Create a new invoice numbering setting
    this.router.post(
      '/',
      this.authMiddleware.authenticate(),
      this.authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]),
      this.controller.create.bind(this.controller)
    );

    // Update an invoice numbering setting
    this.router.patch(
      '/:id',
      this.authMiddleware.authenticate(),
      this.authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]),
      this.controller.update.bind(this.controller)
    );

    // Delete an invoice numbering setting
    this.router.delete(
      '/:id',
      this.authMiddleware.authenticate(),
      this.authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER]),
      this.controller.delete.bind(this.controller)
    );

    // Generate a new invoice number
    this.router.post(
      '/generate-number',
      this.authMiddleware.authenticate(),
      this.authMiddleware.authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.EMPLOYEE]),
      this.controller.generateNumber.bind(this.controller)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}

// Export a factory function instead of singleton instance
export const createInvoiceNumberingRoutes = (): Router => {
  const routes = new InvoiceNumberingRoutes();
  return routes.getRouter();
};