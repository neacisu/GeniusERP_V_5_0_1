/**
 * Customer Service
 * 
 * Service for managing customers in the CRM module
 */
import getDrizzle from "../../../common/drizzle";
import { sql, eq, and, or, like, desc, asc } from "drizzle-orm";
import { customers, InsertCustomer, Customer } from "../schema/crm.schema";
import { randomUUID } from "crypto";
import { AuditService } from "../../audit/services/audit.service";

export class CustomerService {
  private db: ReturnType<typeof getDrizzle>;
  private auditService: AuditService;

  constructor() {
    this.db = getDrizzle();
    this.auditService = new AuditService();
  }

  /**
   * Create a new customer
   */
  async create(data: InsertCustomer, userId: string): Promise<Customer> {
    try {
      const result = await this.db.insert(customers)
        .values({
          ...data,
          id: randomUUID(),
          createdBy: userId,
          updatedBy: userId
        })
        .returning();

      if (result.length > 0) {
        await this.auditService.logAction({
          userId,
          action: "create",
          resourceType: "customer",
          resourceId: result[0].id,
          details: JSON.stringify(data),
          companyId: data.companyId
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error creating customer:", error);
      throw new Error("Failed to create customer");
    }
  }

  /**
   * Get customer by ID
   */
  async getById(id: string, companyId: string): Promise<Customer | null> {
    try {
      const result = await this.db.select()
        .from(customers)
        .where(and(
          eq(customers.id, id),
          eq(customers.companyId, companyId)
        ));

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting customer:", error);
      throw new Error("Failed to get customer");
    }
  }

  /**
   * Update a customer
   */
  async update(id: string, data: Partial<InsertCustomer>, userId: string): Promise<Customer | null> {
    try {
      const result = await this.db.update(customers)
        .set({
          ...data,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(customers.id, id),
          eq(customers.companyId, data.companyId || '')
        ))
        .returning();

      if (result.length > 0) {
        await this.auditService.logAction({
          userId,
          action: "update",
          resourceType: "customer",
          resourceId: id,
          details: JSON.stringify(data),
          companyId: data.companyId || result[0].companyId
        });
      }

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating customer:", error);
      throw new Error("Failed to update customer");
    }
  }

  /**
   * Delete a customer (soft delete by setting isActive = false)
   */
  async delete(id: string, companyId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db.update(customers)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(customers.id, id),
          eq(customers.companyId, companyId)
        ))
        .returning();

      if (result.length > 0) {
        await this.auditService.logAction({
          userId,
          action: "delete",
          resourceType: "customer",
          resourceId: id,
          details: "Soft deleted customer",
          companyId
        });
      }

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw new Error("Failed to delete customer");
    }
  }

  /**
   * List customers with optional filtering
   */
  async list(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      searchTerm?: string;
      type?: string;
      segment?: string;
      industry?: string;
      isActive?: boolean;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<{ data: Customer[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        searchTerm,
        type,
        segment,
        industry,
        isActive = true,
        sortBy = 'createdAt',
        sortDirection = 'desc'
      } = options;

      const offset = (page - 1) * limit;

      // Build where conditions
      let conditions = [eq(customers.companyId, companyId)];

      if (isActive !== undefined) {
        conditions.push(eq(customers.isActive, isActive));
      }

      if (type) {
        conditions.push(eq(customers.type, type));
      }

      if (segment) {
        conditions.push(eq(customers.segment, segment));
      }

      if (industry) {
        conditions.push(eq(customers.industry, industry));
      }

      if (searchTerm) {
        conditions.push(
          or(
            like(customers.name, `%${searchTerm}%`),
            like(customers.email, `%${searchTerm}%`),
            like(customers.phone, `%${searchTerm}%`),
            like(customers.fiscalCode, `%${searchTerm}%`)
          )
        );
      }

      // Get total count
      const totalResult = await this.db.select({ count: sql`count(*)` })
        .from(customers)
        .where(and(...conditions));

      const total = Number(totalResult[0]?.count || 0);

      // Get data with sorting
      let query = this.db.select()
        .from(customers)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      // Add sorting
      if (sortBy && customers[sortBy as keyof typeof customers]) {
        const sortColumn = customers[sortBy as keyof typeof customers];
        if (sortDirection === 'asc') {
          query = query.orderBy(asc(sortColumn));
        } else {
          query = query.orderBy(desc(sortColumn));
        }
      }

      const data = await query;

      return { data, total };
    } catch (error) {
      console.error("Error listing customers:", error);
      throw new Error("Failed to list customers");
    }
  }

  /**
   * Get customer statistics
   */
  async getStatistics(companyId: string): Promise<any> {
    try {
      const totalCustomers = await this.db.select({ count: sql`count(*)` })
        .from(customers)
        .where(eq(customers.companyId, companyId));

      const byType = await this.db.select({
        type: customers.type,
        count: sql`count(*)`
      })
        .from(customers)
        .where(eq(customers.companyId, companyId))
        .groupBy(customers.type);

      const bySegment = await this.db.select({
        segment: customers.segment,
        count: sql`count(*)`
      })
        .from(customers)
        .where(and(
          eq(customers.companyId, companyId),
          sql`${customers.segment} is not null`
        ))
        .groupBy(customers.segment);

      const byIndustry = await this.db.select({
        industry: customers.industry,
        count: sql`count(*)`
      })
        .from(customers)
        .where(and(
          eq(customers.companyId, companyId),
          sql`${customers.industry} is not null`
        ))
        .groupBy(customers.industry);

      return {
        totalCustomers: Number(totalCustomers[0]?.count || 0),
        byType,
        bySegment,
        byIndustry
      };
    } catch (error) {
      console.error("Error getting customer statistics:", error);
      throw new Error("Failed to get customer statistics");
    }
  }
}