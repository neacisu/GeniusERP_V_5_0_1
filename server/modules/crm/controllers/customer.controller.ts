/**
 * Customer Controller
 * 
 * Handles HTTP requests related to CRM customers
 */
import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { JwtAuthMode } from '../../auth/types';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { UserRole } from '../../auth/types';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';

export class CustomerController {
  private customerService: CustomerService;
  private jwtService: any = null;

  constructor(customerService?: CustomerService) {
    this.customerService = customerService || new CustomerService(new DrizzleService());

    // Bind the methods to this instance
    this.createCustomer = this.createCustomer.bind(this);
    this.getCustomer = this.getCustomer.bind(this);
    this.updateCustomer = this.updateCustomer.bind(this);
    this.deleteCustomer = this.deleteCustomer.bind(this);
    this.listCustomers = this.listCustomers.bind(this);
    this.getCustomerStatistics = this.getCustomerStatistics.bind(this);
  }

  /**
   * Register routes
   */
  registerRoutes(app: any, jwtService?: any) {
    // Store JWT service reference
    if (jwtService) {
      this.jwtService = jwtService;
    }

    // Customer routes
    // Create customer - requires sales_agent, company_admin or admin role
    app.post(
      '/api/crm/customers', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.createCustomer
    );

    // Get customer by ID
    app.get(
      '/api/crm/customers/:id', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getCustomer
    );

    // Update customer - requires sales_agent, company_admin or admin role
    app.put(
      '/api/crm/customers/:id', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.updateCustomer
    );

    // Delete customer - requires company_admin or admin role
    app.delete(
      '/api/crm/customers/:id', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.deleteCustomer
    );

    // List all customers
    app.get(
      '/api/crm/customers', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.listCustomers
    );

    // Get customer statistics
    app.get(
      '/api/crm/customer-statistics', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getCustomerStatistics
    );
  }

  /**
   * Create a new customer
   */
  async createCustomer(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate the request body
      if (!req.body.companyId) {
        req.body.companyId = req.user?.companyId;
      }

      if (!req.body.name) {
        return res.status(400).json({ message: 'Customer name is required' });
      }

      const customer = await this.customerService.create(req.body, userId);
      return res.status(201).json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      return res.status(500).json({ message: 'Failed to create customer', error: (error as Error).message });
    }
  }

  /**
   * Get a customer by ID
   */
  async getCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const customer = await this.customerService.getById(id, companyId);

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      return res.json(customer);
    } catch (error) {
      console.error('Error getting customer:', error);
      return res.status(500).json({ message: 'Failed to get customer', error: (error as Error).message });
    }
  }

  /**
   * Update a customer
   */
  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Set company ID from the authenticated user if not provided
      if (!req.body.companyId) {
        req.body.companyId = companyId;
      }

      const customer = await this.customerService.update(id, req.body, userId);

      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      return res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      return res.status(500).json({ message: 'Failed to update customer', error: (error as Error).message });
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const success = await this.customerService.delete(id, companyId, userId);

      if (!success) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      return res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer:', error);
      return res.status(500).json({ message: 'Failed to delete customer', error: (error as Error).message });
    }
  }

  /**
   * List customers with filtering, sorting, and pagination
   */
  async listCustomers(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const {
        page = '1',
        limit = '20',
        searchTerm,
        industry,
        type,
        status,
        sortBy,
        sortDirection
      } = req.query;

      const options = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        searchTerm: searchTerm as string,
        industry: industry as string,
        type: type as string,
        status: status as string,
        sortBy: sortBy as string,
        sortDirection: (sortDirection as 'asc' | 'desc') || 'asc'
      };

      const { data, total } = await this.customerService.list(companyId, options);

      return res.json({
        data,
        meta: {
          total,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      console.error('Error listing customers:', error);
      return res.status(500).json({ message: 'Failed to list customers', error: (error as Error).message });
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStatistics(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const statistics = await this.customerService.getStatistics(companyId);
      return res.json(statistics);
    } catch (error) {
      console.error('Error getting customer statistics:', error);
      return res.status(500).json({ message: 'Failed to get customer statistics', error: (error as Error).message });
    }
  }
}