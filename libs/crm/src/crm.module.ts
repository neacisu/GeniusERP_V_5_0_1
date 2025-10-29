/**
 * CRM Module
 * 
 * This module integrates all CRM-related services and controllers.
 * It provides functionality for managing customers, crm_contacts, crm_deals, and activities
 * with a Kanban-based sales pipeline.
 */
import { Express } from 'express';
import { CustomerController } from './controllers/customer.controller';
import { DealController } from './controllers/deal.controller';
import { SalesController } from './controllers/sales.controller';
import { ActivityController } from './controllers/activity.controller';
import { ContactController } from './controllers/contact.controller';
import { PipelineController } from './controllers/pipeline.controller';
import { CompanyController } from './controllers/company.controller';
import { anafController } from './controllers/anaf.controller';
import { FinancialDataController } from './controllers/financial-data.controller';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { JwtService } from '../auth/services/jwt.service';
import { sql, eq, and } from 'drizzle-orm';
import { 
  customers, 
  deals, 
  activities
} from './schema/crm.schema';
import { companies } from '../company/schema/company.schema';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtAuthMode } from '../auth/types';
import { UserRole } from '../auth/types';
import { CustomerService } from './services/customer.service';
import { createModuleLogger } from "@common/logger/loki-logger";
import { AuditService } from '../audit/services/audit.service';
import { CompanyFinancialDataHook } from './hooks/company-financial-data.hook';

const logger = createModuleLogger('CrmModule');

/**
 * CRM Module class that initializes and registers all CRM components
 */
export class CrmModule {
  private customerController: CustomerController;
  private dealController: DealController;
  private salesController: SalesController;
  private activityController: ActivityController;
  private contactController: ContactController;
  private pipelineController: PipelineController;
  private companyController: CompanyController;
  private financialDataController: FinancialDataController;
  private companyFinancialDataHook: CompanyFinancialDataHook;
  private jwtService: JwtService;
  
  /**
   * Register the CRM module with the Express application
   */
  static register(app: Express, drizzleService?: DrizzleService): void {
    const module = new CrmModule(drizzleService || new DrizzleService());
    module.initialize(app);
  }
  
  constructor(private readonly db: DrizzleService) {
    logger.info('Initializing CRM Module with DrizzleService');
    
    // Initialize services
    const auditService = new AuditService();
    const customerService = new CustomerService(this.db, auditService);
    
    // Initialize controllers with services
    this.customerController = new CustomerController(customerService);
    this.dealController = new DealController();
    this.salesController = new SalesController();
    this.activityController = new ActivityController();
    this.contactController = new ContactController();
    this.pipelineController = new PipelineController();
    this.companyController = new CompanyController(this.db);
    this.financialDataController = new FinancialDataController();
    this.companyFinancialDataHook = new CompanyFinancialDataHook(auditService);
    this.jwtService = new JwtService();
  }
  
  /**
   * Initialize the CRM module
   */
  initialize(app: Express): void {
    console.log('📊 Initializing CRM Module');
    
    // Register all controllers with JWT service
    this.customerController.registerRoutes(app, this.jwtService);
    this.dealController.registerRoutes(app, this.jwtService);
    this.salesController.registerRoutes(app, this.jwtService);
    this.activityController.registerRoutes(app, this.jwtService);
    this.contactController.registerRoutes(app, this.jwtService);
    this.pipelineController.registerRoutes(app, this.jwtService);
    this.companyController.registerRoutes(app, this.jwtService);
    
    // Register ANAF controller routes
    this.registerAnafRoutes(app);
    
    // Register Financial Data controller routes
    this.financialDataController.registerRoutes(app);
    
    // Start the error processing scheduler for financial data
    this.companyFinancialDataHook.startErrorProcessingScheduler();
    
    // Additional initialization can be added here
    this.initializeDashboardRoutes(app);
    
    console.log('📊 CRM Module controllers initialized successfully');
  }
  
  /**
   * Register ANAF API routes
   */
  private registerAnafRoutes(app: Express): void {
    // Route for ANAF API proxy
    app.post('/api/crm/anaf-proxy', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => anafController.proxyAnafRequest(req, res)
    );
    
    // Route for getting company data by CUI
    app.get('/api/crm/company/:cui', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => anafController.getCompanyData(req, res)
    );
    
    // Route for batch getting companies data by multiple CUIs
    app.post('/api/crm/companies/batch', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => anafController.batchGetCompanies(req, res)
    );
    
    console.log('🏢 ANAF API routes registered at /api/crm/anaf-proxy, /api/crm/company/:cui, and /api/crm/companies/batch');
  }
  
  /**
   * Initialize dashboard routes for CRM insights
   */
  private initializeDashboardRoutes(app: Express): void {
    app.get('/api/crm/dashboard', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      async (req, res) => {
      try {
        const { user } = req;
        
        if (!user || !user.companyId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        
        // This is a placeholder for a more comprehensive dashboard endpoint
        // In a real implementation, you would aggregate data from multiple services
        
        // Get some basic counts directly from the database
        const customersCount = await this.getCustomersCount(user.companyId);
        const dealsCount = await this.getDealsCount(user.companyId);
        const openDealsValue = await this.getOpenDealsValue(user.companyId);
        const activitiesCount = await this.getActivitiesCount(user.companyId);
        
        return res.json({
          metrics: {
            customers: customersCount,
            deals: dealsCount,
            openDealsValue,
            activities: activitiesCount
          },
          // Additional data would be included here
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Error getting CRM dashboard data:', error);
        return res.status(500).json({ 
          message: 'Failed to get dashboard data', 
          error: (error as Error).message 
        });
      }
    });
  }
  
  /**
   * Get the count of customers
   */
  private async getCustomersCount(companyId: string): Promise<number> {
    const dbInstance = this.db.getDbInstance();
    const result = await dbInstance.select({
      count: sql`COUNT(*)`
    })
    .from(customers)
    .where(and(
      eq(customers.companyId, companyId),
      eq(customers.isActive, true)
    ));
    
    return Number(result[0]?.count || 0);
  }
  
  /**
   * Get the count of deals
   */
  private async getDealsCount(companyId: string): Promise<number> {
    const dbInstance = this.db.getDbInstance();
    const result = await dbInstance.select({
      count: sql`COUNT(*)`
    })
    .from(deals)
    .where(and(
      eq(deals.companyId, companyId),
      eq(deals.isActive, true)
    ));
    
    return Number(result[0]?.count || 0);
  }
  
  /**
   * Get the sum value of open deals
   */
  private async getOpenDealsValue(companyId: string): Promise<number> {
    const dbInstance = this.db.getDbInstance();
    const result = await dbInstance.select({
      sum: sql`SUM(CAST(${deals.amount} AS NUMERIC))`
    })
    .from(deals)
    .where(and(
      eq(deals.companyId, companyId),
      eq(deals.status, 'open'),
      eq(deals.isActive, true)
    ));
    
    return Number(result[0]?.sum || 0);
  }
  
  /**
   * Get the count of activities
   */
  private async getActivitiesCount(companyId: string): Promise<number> {
    const dbInstance = this.db.getDbInstance();
    const result = await dbInstance.select({
      count: sql`COUNT(*)`
    })
    .from(activities)
    .where(and(
      eq(activities.companyId, companyId),
      eq(activities.status, 'pending')
    ));
    
    return Number(result[0]?.count || 0);
  }
}

/**
 * Initialize the CRM module for the application
 */
export function initCrmModule(app: Express, drizzleService?: DrizzleService): void {
  CrmModule.register(app, drizzleService);
}