/**
 * Sales Controller
 * 
 * This controller handles the sales-related endpoints, including customer management.
 * It protects routes with JWT authentication, role-based access control, and company context validation.
 */

import { Router, Request, Response } from 'express';
import { CustomerService } from './customer.service';
import { AuthGuard } from '../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../modules/auth/constants/auth-mode.enum';
import { Logger } from '../../common/logger';
import { DrizzleService } from '../../common/drizzle/drizzle.service';

// Initialize logger
const logger = new Logger('SalesController');

// Create router instance
const router = Router();

// Create service instances with DrizzleService
const drizzleService = new DrizzleService();
const customerService = new CustomerService(drizzleService);

// Global middleware - JWT authentication
router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

/**
 * Customer Endpoints
 * Protected by sales_team role and company context
 */
router.post('/customer', 
  AuthGuard.roleGuard(['sales_team', 'SALES_TEAM', 'sales_manager', 'SALES_MANAGER']),
  async (req: Request, res: Response) => {
    try {
      logger.info(`Creating new customer for company ${req.user?.companyId}`);
      
      const { name, email, franchiseId } = req.body;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID is required' 
        });
      }
      
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          message: 'Customer name is required' 
        });
      }
      
      const customer = await customerService.createCustomer(
        companyId, 
        franchiseId, 
        name, 
        email
      );
      
      logger.info(`Customer created successfully - ID: ${customer.id}, Company: ${customer.companyId}`);
      
      return res.status(201).json({
        success: true,
        data: customer
      });
    } catch (error) {
      logger.error('Error creating customer', error);
      return res.status(500).json({ 
        success: false, 
        message: 'An error occurred while creating the customer' 
      });
    }
  }
);

/**
 * Get customer by ID
 * Protected by sales_team role and company context
 */
router.get('/customer/:id',
  AuthGuard.roleGuard(['sales_team', 'SALES_TEAM', 'sales_manager', 'SALES_MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const customerId = req.params.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID is required' 
        });
      }
      
      const customer = await customerService.getCustomerById(customerId, companyId);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }
      
      return res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      logger.error('Error retrieving customer', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving the customer'
      });
    }
  }
);

/**
 * Get all customers for a company
 * Protected by sales_team role and company context
 */
router.get('/customers',
  AuthGuard.roleGuard(['sales_team', 'SALES_TEAM', 'sales_manager', 'SALES_MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID is required' 
        });
      }
      
      // Get pagination parameters with defaults
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      
      const customers = await customerService.getCustomersByCompany(companyId, limit, offset);
      
      return res.json({
        success: true,
        data: customers
      });
    } catch (error) {
      logger.error('Error listing customers', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while listing customers'
      });
    }
  }
);

export default router;