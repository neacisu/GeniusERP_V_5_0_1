import { DrizzleService } from "@common/drizzle/drizzle.service";
import { customers } from "../../crm/src/schema/crm.schema";
import { eq } from "drizzle-orm";
import { createModuleLogger } from "@common/logger/loki-logger";

export class CustomerService {
  private drizzle: DrizzleService;
  private logger: ReturnType<typeof createModuleLogger>;

  constructor(drizzleService?: DrizzleService) {
    this.logger = createModuleLogger('CustomerService');
    this.drizzle = drizzleService || new DrizzleService();
  }

  /**
   * Create a new customer record
   * 
   * @param companyId ID of the company that owns this customer
   * @param franchiseId ID of the franchise if applicable (can be null)
   * @param name Customer name
   * @param email Customer email (optional)
   * @returns The newly created customer record
   */
  async createCustomer(companyId: string, franchiseId: string, name: string, email?: string) {
    this.logger.debug(`Creating customer: ${name} for company ${companyId}`);
    
    const db = this.drizzle.db;
    const inserted = await db.insert(customers).values({
      companyId,
      name,
      email,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return inserted[0];
  }

  /**
   * Get a customer by ID
   * 
   * @param customerId ID of the customer to fetch
   * @param companyId Company ID for security validation
   * @returns The customer record if found
   */
  async getCustomerById(customerId: string, companyId: string) {
    this.logger.debug(`Getting customer by ID: ${customerId} for company ${companyId}`);
    
    const db = this.drizzle.db;
    const result = await db.select()
      .from(customers)
      .where(
        eq(customers.id, customerId)
      )
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Get all customers for a company
   * 
   * @param companyId Company ID
   * @param limit Maximum number of results to return
   * @param offset Number of records to skip for pagination
   * @returns Array of customer records
   */
  async getCustomersByCompany(companyId: string, limit = 50, offset = 0) {
    this.logger.debug(`Getting customers for company ${companyId}, limit: ${limit}, offset: ${offset}`);
    
    const db = this.drizzle.db;
    const result = await db.select()
      .from(customers)
      .where(
        eq(customers.companyId, companyId)
      )
      .limit(limit)
      .offset(offset);
    
    return result;
  }
}