/**
 * Customer Service
 * 
 * Service for managing customers in the CRM module
 */
import { BaseDrizzleService } from "@common/drizzle/modules/core/base-drizzle.service";
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { AuditService } from '../../audit/services/audit.service';
import { customers, Customer, InsertCustomer } from '../schema/crm.schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export class CustomerService extends BaseDrizzleService {
  constructor(
    private readonly db: DrizzleService,
    private readonly auditService: AuditService
  ) {
    super();
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    return this.db.query(async (db: PostgresJsDatabase) => {
      const id = randomUUID();
      await db.insert(customers).values({
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const result = await this.getCustomerById(id);
      if (!result) {
        throw new Error('Failed to create customer');
      }
      return result;
    });
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    return this.db.query(async (db: PostgresJsDatabase) => {
      const result = await db.select()
        .from(customers)
        .where(eq(customers.id, id));
      return result[0];
    });
  }

  /**
   * Get customer by ID for a specific company (used by controller)
   */
  async getById(id: string, companyId: string): Promise<Customer | undefined> {
    return this.db.query(async (db: PostgresJsDatabase) => {
      const result = await db.select()
        .from(customers)
        .where(and(
          eq(customers.id, id),
          eq(customers.companyId, companyId),
          eq(customers.isActive, true)
        ));
      return result[0];
    });
  }

  async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    return this.db.query(async (db: PostgresJsDatabase) => {
      await db.update(customers)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(customers.id, id));
      return this.getCustomerById(id);
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.db.query(async (db: PostgresJsDatabase) => {
      await db.update(customers)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(customers.id, id));
    });
  }

  async getCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
  }): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, search, sortBy, sortOrder, filters } = params;
    const offset = (page - 1) * limit;

    return this.db.query(async (db: PostgresJsDatabase) => {
      const whereConditions = [
        eq(customers.isActive, true)
      ];

      // Add filters
      if (filters?.companyId) {
        whereConditions.push(eq(customers.companyId, filters.companyId));
      }
      if (filters?.industry) {
        whereConditions.push(eq(customers.industry, filters.industry));
      }
      if (filters?.type) {
        whereConditions.push(eq(customers.type, filters.type));
      }
      if (filters?.leadStatus) {
        whereConditions.push(eq(customers.leadStatus, filters.leadStatus));
      }

      if (search) {
        whereConditions.push(sql`${customers.name} ILIKE ${`%${search}%`}`);
      }

      const totalResult = await db.select({ count: sql`count(*)` })
        .from(customers)
        .where(and(...whereConditions));

      // Mapare explicită pentru coloanele permise la sortare
      const sortColumns: Record<string, any> = {
        name: customers.name,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        email: customers.email,
        type: customers.type,
        segment: customers.segment,
        industry: customers.industry,
      };

      let orderByColumn = customers.createdAt; // default
      if (sortBy && sortColumns[sortBy]) {
        orderByColumn = sortColumns[sortBy];
      }

      const customersList = await db
        .select({
          id: customers.id,
          companyId: customers.companyId,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
          address: customers.address,
          city: customers.city,
          county: customers.county,
          country: customers.country,
          postalCode: customers.postalCode,
          type: customers.type,
          segment: customers.segment,
          industry: customers.industry,
          source: customers.source,
          leadScore: customers.leadScore,
          leadStatus: customers.leadStatus,
          leadQualificationDate: customers.leadQualificationDate,
          ownerId: customers.ownerId,
          fiscalCode: customers.fiscalCode,
          registrationNumber: customers.registrationNumber,
          vatPayer: customers.vatPayer,
          website: customers.website,
          notes: customers.notes,
          annualRevenue: customers.annualRevenue,
          employeeCount: customers.employeeCount,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt,
          createdBy: customers.createdBy,
          updatedBy: customers.updatedBy,
          isActive: customers.isActive,
          customFields: customers.customFields,
        })
        .from(customers)
        .where(and(...whereConditions))
        .orderBy(sortOrder === 'asc' ? asc(orderByColumn) : desc(orderByColumn))
        .limit(limit)
        .offset(offset);

      return {
        customers: customersList,
        total: Number(totalResult[0].count),
        page,
        limit,
        totalPages: Math.ceil(Number(totalResult[0].count) / limit)
      };
    });
  }

  /**
   * List customers for a company (alias for compatibility)
   * Used by customer controller
   */
  async list(companyId: string, options: {
    page: number;
    limit: number;
    searchTerm?: string;
    industry?: string;
    type?: string;
    status?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ data: Customer[]; total: number }> {
    const result = await this.getCustomers({
      page: options.page,
      limit: options.limit,
      search: options.searchTerm,
      sortBy: options.sortBy,
      sortOrder: options.sortDirection || 'asc',
      filters: {
        companyId,
        industry: options.industry,
        type: options.type,
        ...(options.status && { leadStatus: options.status })
      }
    });

    return {
      data: result.customers,
      total: result.total
    };
  }

  async getCustomerStats(companyId: string): Promise<{
    total: number;
    byType: Array<{ type: string | null; count: number }>;
    bySegment: Array<{ segment: string | null; count: number }>;
    byIndustry: Array<{ industry: string | null; count: number }>;
  }> {
    return this.db.query(async (db: PostgresJsDatabase) => {
      const whereConditions = [
        eq(customers.isActive, true),
        eq(customers.companyId, companyId)
      ];

      const totalCustomers = await db.select({ count: sql`count(*)` })
        .from(customers)
        .where(and(...whereConditions));

      const byType = await db.select({
        type: customers.type,
        count: sql`count(*)`
      })
        .from(customers)
        .where(and(...whereConditions))
        .groupBy(customers.type);

      const bySegment = await db.select({
        segment: customers.segment,
        count: sql`count(*)`
      })
        .from(customers)
        .where(and(...whereConditions))
        .groupBy(customers.segment);

      const byIndustry = await db.select({
        industry: customers.industry,
        count: sql`count(*)`
      })
        .from(customers)
        .where(and(...whereConditions))
        .groupBy(customers.industry);

      return {
        total: Number(totalCustomers[0].count),
        byType: byType.map(row => ({ type: row.type, count: Number(row.count) })),
        bySegment: bySegment.map(row => ({ segment: row.segment, count: Number(row.count) })),
        byIndustry: byIndustry.map(row => ({ industry: row.industry, count: Number(row.count) }))
      };
    });
  }

  // Alias methods for compatibility with controller
  async create(data: InsertCustomer, userId?: string): Promise<Customer> {
    const customer = await this.createCustomer(data);
    if (userId && customer) {
      await this.auditService.logAction({
        userId,
        action: 'CREATE',
        entityType: 'customer',
        entityId: customer.id,
        changes: data
      });
    }
    return customer;
  }

  async update(id: string, data: Partial<InsertCustomer>, userId?: string): Promise<Customer | undefined> {
    const customer = await this.updateCustomer(id, data);
    if (userId && customer) {
      await this.auditService.logAction({
        userId,
        action: 'UPDATE',
        entityType: 'customer',
        entityId: id,
        changes: data
      });
    }
    return customer;
  }

  async delete(id: string, companyId: string, userId?: string): Promise<boolean> {
    await this.deleteCustomer(id);
    if (userId) {
      await this.auditService.logAction({
        userId,
        action: 'DELETE',
        entityType: 'customer',
        entityId: id,
        changes: { deleted: true }
      });
    }
    return true;
  }

  async getStatistics(companyId: string): Promise<any> {
    return this.db.query(async (db: PostgresJsDatabase) => {
      const stats = await db.select({
        total: sql`count(*)::int`,
        activeCustomers: sql`count(*) filter (where type = 'customer')::int`,
        leads: sql`count(*) filter (where type = 'lead')::int`,
        prospects: sql`count(*) filter (where type = 'prospect')::int`,
        partners: sql`count(*) filter (where type = 'partner')::int`,
      })
        .from(customers)
        .where(and(
          eq(customers.companyId, companyId),
          eq(customers.isActive, true)
        ));

      return stats[0] || {
        total: 0,
        activeCustomers: 0,
        leads: 0,
        prospects: 0,
        partners: 0
      };
    });
  }
}