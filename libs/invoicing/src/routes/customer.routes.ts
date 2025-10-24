/**
 * Customer Routes for Invoicing
 * 
 * Express routes for retrieving customer data for invoicing use
 */

import { Router } from 'express';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { CustomerController } from '../controllers/customer.controller';

const router = Router();
const customerController = new CustomerController();

// Get customers that can be invoiced (marked as clients)
// Aplicăm AuthGuard la nivel de rută pentru a asigura protecția corectă
router.get('/', 
  AuthGuard.protect(JwtAuthMode.REQUIRED), 
  customerController.getInvoiceCustomers.bind(customerController)
);

export { router as customerRoutes };