/**
 * Drizzle Service
 * 
 * Centralized service that provides access to all database operations.
 * This service combines the core functionality with module-specific services.
 */

import { Logger } from '../logger';
import { getDrizzleInstance } from './db';
import { 
  BaseDrizzleService,
  CompanyDrizzleService,
  InvoicingDrizzleService,
  AuthDrizzleService,
  RbacDrizzleService,
  CollabDrizzleService
} from './modules';

// Create a logger for the DrizzleService
const logger = new Logger('DrizzleService');

/**
 * Main DrizzleService that combines all module-specific services
 * and provides a unified interface for database operations
 */
export class DrizzleService {
  private baseService: BaseDrizzleService;
  private companyService: CompanyDrizzleService;
  private invoicingService: InvoicingDrizzleService;
  private authService: AuthDrizzleService;
  private rbacService: RbacDrizzleService;
  private collabService: CollabDrizzleService;
  
  constructor() {
    // Initialize all the module-specific services
    this.baseService = new BaseDrizzleService();
    this.companyService = new CompanyDrizzleService();
    this.invoicingService = new InvoicingDrizzleService();
    this.authService = new AuthDrizzleService();
    this.rbacService = new RbacDrizzleService();
    this.collabService = new CollabDrizzleService();
    
    logger.info('DrizzleService initialized with all module services');
  }
  
  /**
   * Get the base drizzle service
   */
  get base(): BaseDrizzleService {
    return this.baseService;
  }
  
  /**
   * Get the company drizzle service
   */
  get company(): CompanyDrizzleService {
    return this.companyService;
  }
  
  /**
   * Get the invoicing drizzle service
   */
  get invoicing(): InvoicingDrizzleService {
    return this.invoicingService;
  }
  
  /**
   * Get the auth drizzle service
   */
  get auth(): AuthDrizzleService {
    return this.authService;
  }
  
  /**
   * Get the RBAC drizzle service
   */
  get rbac(): RbacDrizzleService {
    return this.rbacService;
  }
  
  /**
   * Get the Collaboration drizzle service
   */
  get collab(): CollabDrizzleService {
    return this.collabService;
  }
  
  /**
   * Get the raw Drizzle database instance
   * This is useful for services that need direct access to the database instance
   * 
   * @returns Raw PostgresJsDatabase instance
   */
  getDbInstance(): any {
    return getDrizzleInstance();
  }
  
  /**
   * Execute a function with the Drizzle database instance
   * This is a convenience method that delegates to the base service
   * 
   * @param queryFn Function that receives the DB instance and returns a result
   * @returns Promise resolving to the result of queryFn
   */
  async query<T = any>(queryFn: (db: any) => Promise<T> | T): Promise<T> {
    try {
      // Pass the query function and a context string for better logging
      return await this.baseService.query(queryFn, 'DrizzleService.query');
    } catch (error) {
      logger.error('Error in query operation', error);
      throw error;
    }
  }
  
  /**
   * Execute raw SQL directly
   * This is a convenience method that delegates to the base service
   * 
   * @param sql SQL query to execute (string or SQL object)
   * @param params Parameters for the query (only used with string queries)
   * @returns Query result
   */
  async executeQuery<T = any>(sql: string | import('drizzle-orm').SQL<unknown>, params: any[] = []): Promise<T> {
    try {
      // Pass parameters to base service, which handles both string and SQL objects
      return await this.baseService.executeQuery(sql, params);
    } catch (error) {
      logger.error('Error in executeQuery operation', error);
      throw error;
    }
  }
  
  /**
   * Start a database transaction
   * This is a convenience method that delegates to the base service
   * 
   * @param transactionFn Function that receives a transaction and returns a result
   * @returns Promise resolving to the result of transactionFn
   */
  async transaction<T = any>(transactionFn: (tx: any) => Promise<T>): Promise<T> {
    try {
      // Pass the transaction function and a context string for better logging
      return await this.baseService.transaction(transactionFn, 'DrizzleService.transaction');
    } catch (error) {
      logger.error('Error in transaction operation', error);
      throw error;
    }
  }
}