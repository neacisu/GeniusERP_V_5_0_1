/**
 * Contact Service
 * 
 * Service for managing contacts in the CRM module
 */
import { DrizzleService } from "@common/drizzle";
import { sql, eq, and, or, like, desc, asc } from "drizzle-orm";
import { contacts, InsertContact, Contact } from "../schema/crm.schema";
import { randomUUID } from "crypto";
import { AuditService } from "../../audit/services/audit.service";

export class ContactService {
  private drizzleService: DrizzleService;
  private db: ReturnType<typeof DrizzleService.prototype.getDbInstance>;
  private auditService: AuditService;

  constructor() {
    this.drizzleService = new DrizzleService();
    this.db = this.drizzleService.getDbInstance();
    this.auditService = new AuditService();
  }

  /**
   * Create a new contact
   */
  async create(data: InsertContact, userId: string): Promise<Contact> {
    try {
      const result = await this.db.insert(contacts)
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
          resourceType: "contact",
          resourceId: result[0].id,
          details: JSON.stringify(data),
          companyId: data.companyId
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error creating contact:", error);
      throw new Error("Failed to create contact");
    }
  }

  /**
   * Get contact by ID
   */
  async getById(id: string, companyId: string): Promise<Contact | null> {
    try {
      const result = await this.db.select()
        .from(contacts)
        .where(and(
          eq(contacts.id, id),
          eq(contacts.companyId, companyId)
        ));

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting contact:", error);
      throw new Error("Failed to get contact");
    }
  }

  /**
   * Update a contact
   */
  async update(id: string, data: Partial<InsertContact>, userId: string): Promise<Contact | null> {
    try {
      const result = await this.db.update(contacts)
        .set({
          ...data,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(contacts.id, id),
          eq(contacts.companyId, data.companyId || '')
        ))
        .returning();

      if (result.length > 0) {
        await this.auditService.logAction({
          userId,
          action: "update",
          resourceType: "contact",
          resourceId: id,
          details: JSON.stringify(data),
          companyId: data.companyId || result[0].companyId
        });
      }

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating contact:", error);
      throw new Error("Failed to update contact");
    }
  }

  /**
   * Delete a contact (soft delete by setting isActive = false)
   */
  async delete(id: string, companyId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db.update(contacts)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(contacts.id, id),
          eq(contacts.companyId, companyId)
        ))
        .returning();

      if (result.length > 0) {
        await this.auditService.logAction({
          userId,
          action: "delete",
          resourceType: "contact",
          resourceId: id,
          details: "Soft deleted contact",
          companyId
        });
      }

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting contact:", error);
      throw new Error("Failed to delete contact");
    }
  }

  /**
   * List contacts with optional filtering
   */
  async list(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      searchTerm?: string;
      customerId?: string;
      isDecisionMaker?: boolean;
      isActive?: boolean;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<{ data: Contact[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        searchTerm,
        customerId,
        isDecisionMaker,
        isActive = true,
        sortBy = 'createdAt',
        sortDirection = 'desc'
      } = options;

      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(contacts.companyId, companyId)];

      if (isActive !== undefined) {
        conditions.push(eq(contacts.isActive, isActive));
      }

      if (customerId) {
        conditions.push(eq(contacts.customerId, customerId));
      }

      if (isDecisionMaker !== undefined) {
        conditions.push(eq(contacts.decisionMaker, isDecisionMaker));
      }

      if (searchTerm) {
        const searchConditions = [
          like(contacts.firstName, `%${searchTerm}%`),
          like(contacts.lastName, `%${searchTerm}%`)
        ];
        if (contacts.email) searchConditions.push(like(contacts.email, `%${searchTerm}%`));
        if (contacts.phone) searchConditions.push(like(contacts.phone, `%${searchTerm}%`));
        if (contacts.title) searchConditions.push(like(contacts.title, `%${searchTerm}%`));
        
        const searchOr = or(...searchConditions);
        if (searchOr) {
          conditions.push(searchOr);
        }
      }

      // Get total count
      const totalResult = await this.db.select({ count: sql`count(*)` })
        .from(contacts)
        .where(and(...conditions));

      const total = Number(totalResult[0]?.count || 0);

      // Get data with sorting
      const data = await this.db.select()
        .from(contacts)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(contacts.createdAt));

      return { data, total };
    } catch (error) {
      console.error("Error listing contacts:", error);
      throw new Error("Failed to list contacts");
    }
  }

  /**
   * Get contacts for a customer
   */
  async getByCustomerId(customerId: string, companyId: string): Promise<Contact[]> {
    try {
      return await this.db.select()
        .from(contacts)
        .where(and(
          eq(contacts.customerId, customerId),
          eq(contacts.companyId, companyId),
          eq(contacts.isActive, true)
        ));
    } catch (error) {
      console.error("Error getting contacts by customer:", error);
      throw new Error("Failed to get contacts by customer");
    }
  }

  /**
   * Update last contacted date for a contact
   */
  async updateLastContactedAt(id: string, companyId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db.update(contacts)
        .set({
          lastContactedAt: new Date(),
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(contacts.id, id),
          eq(contacts.companyId, companyId)
        ))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error("Error updating last contacted date:", error);
      throw new Error("Failed to update last contacted date");
    }
  }
}