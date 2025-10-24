/**
 * Invoices Module
 * 
 * Main entry point for the invoices module. Registers all services, controllers,
 * and routes for invoice management, following controller-based architecture.
 */

import { Express, Router } from 'express';
import { ExchangeRateService } from '../../integrations/src/services/exchange-rate.service';
import { InvoiceService } from './services/invoice.service';
import { CreateInvoiceService } from './services/create-invoice.service';
import { ValidateInvoiceService } from './services/validate-invoice.service';
import { DevalidateInvoiceService } from './services/devalidate-invoice.service';
import { InvoiceController } from './controllers/invoice.controller';
import { CreateInvoiceController } from './controllers/create-invoice.controller';
import { ValidateInvoiceController } from './controllers/validate-invoice.controller';
import { DevalidateInvoiceController } from './controllers/devalidate-invoice.controller';
import { CustomerController } from './controllers/customer.controller';
import { AuthGuard } from '../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../auth/src/constants/auth-mode.enum';
import { UserRole } from '../../auth/src/types';
import { createModuleLogger } from '@common/logger/loki-logger';

// Entity name used for audit logging
export const ENTITY_NAME = 'invoice';

export class InvoicesModule {
  private router: Router;
  private invoiceController: InvoiceController;
  private createInvoiceController: CreateInvoiceController;
  private validateInvoiceController: ValidateInvoiceController;
  private devalidateInvoiceController: DevalidateInvoiceController;
  private customerController: CustomerController;
  private logger: ReturnType<typeof createModuleLogger>;

  constructor() {
    this.router = Router();
    this.invoiceController = new InvoiceController();
    this.createInvoiceController = new CreateInvoiceController();
    this.validateInvoiceController = new ValidateInvoiceController();
    this.devalidateInvoiceController = new DevalidateInvoiceController();
    this.customerController = new CustomerController();
    this.logger = createModuleLogger('InvoicesModule');
  }

  /**
   * Initialize the invoices module and set up routes
   * 
   * @param app Express application
   * @returns Router instance
   */
  initRoutes(app: Express): Router {
    this.logger.info('📝 Initializing invoices module with controller-based architecture');
    
    // Register invoice routes
    this.setupInvoiceRoutes();
    this.setupCreateInvoiceRoutes();
    this.setupValidateInvoiceRoutes();
    this.setupDevalidateInvoiceRoutes();
    this.setupCustomerRoutes(app);
    
    // Register the router with the application
    app.use('/api/invoices', this.router);
    
    // For backward compatibility, register the v1 routes
    this.setupLegacyRoutes(app);
    
    this.logger.info('📝 Invoices module initialized successfully');
    return this.router;
  }
  
  /**
   * Setup main invoice management routes
   */
  private setupInvoiceRoutes(): void {
    // Get all invoices for a company
    this.router.get('/',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.invoiceController.getCompanyInvoices.bind(this.invoiceController)
    );
    
    // Get a single invoice by ID
    this.router.get('/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.invoiceController.getInvoiceById.bind(this.invoiceController)
    );
    
    // Create a new invoice
    this.router.post('/',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.invoiceController.createInvoice.bind(this.invoiceController)
    );
    
    // Update an invoice
    this.router.patch('/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.invoiceController.updateInvoice.bind(this.invoiceController)
    );
    
    // Delete an invoice
    this.router.delete('/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.invoiceController.deleteInvoice.bind(this.invoiceController)
    );
    
    // Get customer invoices
    this.router.get('/customer/:customerId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.invoiceController.getCustomerInvoices.bind(this.invoiceController)
    );
    
    // Get invoice stats
    this.router.get('/stats/overview',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.invoiceController.getInvoiceStats.bind(this.invoiceController)
    );
    
    // Export invoice to PDF
    this.router.get('/:id/export/pdf',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.invoiceController.exportInvoiceToPdf.bind(this.invoiceController)
    );
  }
  
  /**
   * Setup invoice creation routes
   */
  private setupCreateInvoiceRoutes(): void {
    // Create a single invoice with standard body
    this.router.post('/create',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.createInvoiceController.createInvoice.bind(this.createInvoiceController)
    );
    
    // Create multiple invoices in batch
    this.router.post('/batch',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.createInvoiceController.createInvoiceBatch.bind(this.createInvoiceController)
    );
  }
  
  /**
   * Setup invoice validation routes
   */
  private setupValidateInvoiceRoutes(): void {
    // Validate an invoice
    this.router.post('/:invoiceId/validate',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.validateInvoiceController.validateInvoice.bind(this.validateInvoiceController)
    );
    
    // Validate multiple invoices in batch
    this.router.post('/validate/batch',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.validateInvoiceController.validateInvoiceBatch.bind(this.validateInvoiceController)
    );
    
    // Get validation status of an invoice
    this.router.get('/:invoiceId/validation-status',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.validateInvoiceController.getValidationStatus.bind(this.validateInvoiceController)
    );
    
    // Preview accounting entries for an invoice
    this.router.get('/:invoiceId/preview-accounting',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.validateInvoiceController.previewAccountingEntries.bind(this.validateInvoiceController)
    );
  }
  
  /**
   * Setup invoice devalidation routes
   */
  private setupDevalidateInvoiceRoutes(): void {
    // Devalidate an invoice
    this.router.post('/:invoiceId/devalidate',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.devalidateInvoiceController.devalidateInvoice.bind(this.devalidateInvoiceController)
    );
    
    // Check if an invoice can be devalidated
    this.router.get('/:invoiceId/can-devalidate',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.devalidateInvoiceController.canDevalidate.bind(this.devalidateInvoiceController)
    );
    
    // Get devalidation history for an invoice
    this.router.get('/:invoiceId/devalidation-history',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.devalidateInvoiceController.getDevalidationHistory.bind(this.devalidateInvoiceController)
    );
  }
  
  /**
   * Setup legacy routes for backward compatibility
   */
  private setupLegacyRoutes(app: Express): void {
    // This provides backward compatibility with the /v1/invoices/create route
    const legacyRouter = Router();
    
    legacyRouter.post('/v1/invoices/create',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ACCOUNTANT, UserRole.FINANCE_MANAGER, UserRole.ADMIN]),
      this.createInvoiceController.createInvoice.bind(this.createInvoiceController)
    );
    
    app.use(legacyRouter);
    this.logger.info('📝 Legacy invoice routes registered for backward compatibility');
  }
  
  /**
   * Setup customer routes
   */
  private setupCustomerRoutes(app: Express): void {
    // Get customers for invoicing
    const customerRouter = Router();
    
    customerRouter.get('/customers',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.customerController.getInvoiceCustomers.bind(this.customerController)
    );
    
    // Register the router with the application
    app.use('/api/invoicing', customerRouter);
    this.logger.info('📝 Customer routes registered at /api/invoicing/customers');
  }
  
  /**
   * Register the module with the application (static method for backward compatibility)
   */
  static register(app: any) {
    const module = new InvoicesModule();
    module.initRoutes(app);
    
    // Return registered components for backward compatibility
    return {
      services: [InvoiceService, CreateInvoiceService, ValidateInvoiceService, DevalidateInvoiceService, ExchangeRateService],
      controllers: [InvoiceController, CreateInvoiceController, ValidateInvoiceController, DevalidateInvoiceController]
    };
  }
}