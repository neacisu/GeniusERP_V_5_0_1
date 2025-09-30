/**
 * CRM Module
 * 
 * This module integrates all CRM-related services and controllers.
 * It provides functionality for managing customers, contacts, deals, and activities
 * with a Kanban-based sales pipeline.
 */
import { Express } from 'express';
import { CustomerController } from './controllers/customer.controller';
import { DealController } from './controllers/deal.controller';
import { SalesController } from './controllers/sales.controller';
import getDrizzle from '../../common/drizzle';
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

/**
 * CRM Module class that initializes and registers all CRM components
 */
export class CrmModule {
  private customerController: CustomerController;
  private dealController: DealController;
  private salesController: SalesController;
  private db: ReturnType<typeof getDrizzle>;
  private jwtService: JwtService;
  
  /**
   * Register the CRM module with the Express application
   */
  static register(app: Express): void {
    const module = new CrmModule();
    module.initialize(app);
  }
  
  constructor() {
    this.customerController = new CustomerController();
    this.dealController = new DealController();
    this.salesController = new SalesController();
    this.db = getDrizzle();
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
    
    // Additional initialization can be added here
    this.initializeDashboardRoutes(app);
  }
  
  /**
   * Initialize dashboard routes for CRM insights
   */
  private initializeDashboardRoutes(app: Express): void {
    app.get('/api/v1/crm/dashboard', 
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
    const result = await this.db.select({
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
    const result = await this.db.select({
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
    const result = await this.db.select({
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
    const result = await this.db.select({
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
export function initCrmModule(app: Express): void {
  CrmModule.register(app);
}