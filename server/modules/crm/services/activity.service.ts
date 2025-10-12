/**
 * Activity Service
 * 
 * Service for managing activities (calls, meetings, tasks, emails, etc.) in the CRM module
 */
import { DrizzleService } from '../../../common/drizzle';
import { sql, eq, and, or, like, desc, asc, gte, lte } from "drizzle-orm";
import { activities, InsertActivity, Activity } from "../schema/crm.schema";
import { randomUUID } from "crypto";
import { AuditService } from "../../audit/services/audit.service";
import { ContactService } from "./contact.service";

export class ActivityService {
  private db: any;
  private auditService: AuditService;
  private contactService: ContactService;

  constructor() {
    this.db = new DrizzleService();
    this.auditService = new AuditService();
    this.contactService = new ContactService();
  }

  /**
   * Create a new activity
   */
  async create(data: InsertActivity, userId: string): Promise<Activity> {
    try {
      const result = await this.db.insert(activities)
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
          resourceType: "activity",
          resourceId: result[0].id,
          details: JSON.stringify(data),
          companyId: data.companyId
        });

        // If this is a contact activity, update the last contacted date for the contact
        if (data.contactId) {
          await this.contactService.updateLastContactedAt(data.contactId, data.companyId, userId);
        }
      }

      return result[0];
    } catch (error) {
      console.error("Error creating activity:", error);
      throw new Error("Failed to create activity");
    }
  }

  /**
   * Update an activity
   */
  async update(id: string, data: Partial<InsertActivity>, userId: string): Promise<Activity | null> {
    try {
      const result = await this.db.update(activities)
        .set({
          ...data,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(activities.id, id),
          eq(activities.companyId, data.companyId || '')
        ))
        .returning();

      if (result.length > 0) {
        await this.auditService.logAction({
          userId,
          action: "update",
          resourceType: "activity",
          resourceId: id,
          details: JSON.stringify(data),
          companyId: data.companyId || result[0].companyId
        });

        // If this is being marked as completed, update contact's last contacted date
        if (data.status === 'completed' && result[0].contactId) {
          await this.contactService.updateLastContactedAt(
            result[0].contactId, 
            data.companyId || result[0].companyId, 
            userId
          );
        }
      }

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating activity:", error);
      throw new Error("Failed to update activity");
    }
  }

  /**
   * Mark an activity as completed
   */
  async markAsCompleted(id: string, companyId: string, userId: string, outcome?: string): Promise<Activity | null> {
    try {
      const result = await this.db.update(activities)
        .set({
          status: 'completed',
          completedAt: new Date(),
          outcome: outcome || 'Completed',
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(activities.id, id),
          eq(activities.companyId, companyId)
        ))
        .returning();

      if (result.length > 0) {
        await this.auditService.logAction({
          userId,
          action: "update",
          resourceType: "activity",
          resourceId: id,
          details: "Marked activity as completed",
          companyId
        });

        // Update contact's last contacted date
        if (result[0].contactId) {
          await this.contactService.updateLastContactedAt(result[0].contactId, companyId, userId);
        }
      }

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error marking activity as completed:", error);
      throw new Error("Failed to mark activity as completed");
    }
  }

  /**
   * Delete an activity
   */
  async delete(id: string, companyId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db.delete(activities)
        .where(and(
          eq(activities.id, id),
          eq(activities.companyId, companyId)
        ))
        .returning();

      if (result.length > 0) {
        await this.auditService.logAction({
          userId,
          action: "delete",
          resourceType: "activity",
          resourceId: id,
          details: "Deleted activity",
          companyId
        });
      }

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting activity:", error);
      throw new Error("Failed to delete activity");
    }
  }

  /**
   * Get an activity by ID
   */
  async getById(id: string, companyId: string): Promise<Activity | null> {
    try {
      const result = await this.db.select()
        .from(activities)
        .where(and(
          eq(activities.id, id),
          eq(activities.companyId, companyId)
        ));

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting activity:", error);
      throw new Error("Failed to get activity");
    }
  }

  /**
   * List activities with optional filtering
   */
  async list(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      searchTerm?: string;
      dealId?: string;
      customerId?: string;
      contactId?: string;
      type?: string;  // matches with activityType in database
      status?: string;
      assignedTo?: string;
      dateFrom?: Date;
      dateTo?: Date;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<{ data: Activity[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        searchTerm,
        dealId,
        customerId,
        contactId,
        type,
        status,
        assignedTo,
        dateFrom,
        dateTo,
        sortBy = 'startTime',
        sortDirection = 'desc'
      } = options;

      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(activities.companyId, companyId)];

      if (dealId) {
        conditions.push(eq(activities.dealId, dealId));
      }

      if (customerId) {
        conditions.push(eq(activities.clientCompanyId, customerId));
      }

      if (contactId) {
        conditions.push(eq(activities.contactId, contactId));
      }

      if (type) {
        conditions.push(eq(activities.activityType, type));
      }

      if (status) {
        conditions.push(eq(activities.status, status));
      }

      if (assignedTo) {
        conditions.push(eq(activities.assignedTo, assignedTo));
      }

      if (dateFrom) {
        conditions.push(gte(activities.startTime, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(activities.startTime, dateTo));
      }

      if (searchTerm) {
        conditions.push(
          or(
            like(activities.title, `%${searchTerm}%`),
            like(activities.description || '', `%${searchTerm}%`)
          )
        );
      }

      // Get total count
      const totalResult = await this.db.select({ count: sql`count(*)` })
        .from(activities)
        .where(and(...conditions));

      const total = Number(totalResult[0]?.count || 0);

      // Get data with sorting
      let query = this.db.select()
        .from(activities)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);

      // Add sorting
      if (sortBy && activities[sortBy as keyof typeof activities]) {
        const sortColumn = activities[sortBy as keyof typeof activities];
        if (sortDirection === 'asc') {
          query = query.orderBy(asc(sortColumn));
        } else {
          query = query.orderBy(desc(sortColumn));
        }
      }

      const data = await query;

      return { data, total };
    } catch (error) {
      console.error("Error listing activities:", error);
      throw new Error("Failed to list activities");
    }
  }

  /**
   * Get upcoming activities for a user
   */
  async getUpcomingActivities(companyId: string, userId: string, days: number = 7): Promise<Activity[]> {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);

      return await this.db.select()
        .from(activities)
        .where(and(
          eq(activities.companyId, companyId),
          eq(activities.assignedTo, userId),
          eq(activities.status, 'pending'),
          gte(activities.startTime, today),
          lte(activities.startTime, endDate)
        ))
        .orderBy(asc(activities.startTime));
    } catch (error) {
      console.error("Error getting upcoming activities:", error);
      throw new Error("Failed to get upcoming activities");
    }
  }

  /**
   * Get overdue activities for a user
   */
  async getOverdueActivities(companyId: string, userId: string): Promise<Activity[]> {
    try {
      const today = new Date();

      return await this.db.select()
        .from(activities)
        .where(and(
          eq(activities.companyId, companyId),
          eq(activities.assignedTo, userId),
          eq(activities.status, 'pending'),
          lte(activities.startTime, today)
        ))
        .orderBy(asc(activities.startTime));
    } catch (error) {
      console.error("Error getting overdue activities:", error);
      throw new Error("Failed to get overdue activities");
    }
  }

  /**
   * Get activities by deal ID
   */
  async getActivitiesByDealId(dealId: string, companyId: string): Promise<Activity[]> {
    try {
      return await this.db.select()
        .from(activities)
        .where(and(
          eq(activities.dealId, dealId),
          eq(activities.companyId, companyId)
        ))
        .orderBy(desc(activities.createdAt));
    } catch (error) {
      console.error("Error getting activities by deal:", error);
      throw new Error("Failed to get activities by deal");
    }
  }

  /**
   * Get activities by customer ID
   */
  async getActivitiesByCustomerId(customerId: string, companyId: string): Promise<Activity[]> {
    try {
      return await this.db.select()
        .from(activities)
        .where(and(
          eq(activities.clientCompanyId, customerId),
          eq(activities.companyId, companyId)
        ))
        .orderBy(desc(activities.createdAt));
    } catch (error) {
      console.error("Error getting activities by customer:", error);
      throw new Error("Failed to get activities by customer");
    }
  }

  /**
   * Get activities by contact ID
   */
  async getActivitiesByContactId(contactId: string, companyId: string): Promise<Activity[]> {
    try {
      return await this.db.select()
        .from(activities)
        .where(and(
          eq(activities.contactId, contactId),
          eq(activities.companyId, companyId)
        ))
        .orderBy(desc(activities.createdAt));
    } catch (error) {
      console.error("Error getting activities by contact:", error);
      throw new Error("Failed to get activities by contact");
    }
  }

  /**
   * Get activities for today's calendar
   */
  async getTodaysActivities(companyId: string, userId?: string): Promise<Activity[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const conditions = [
        eq(activities.companyId, companyId),
        gte(activities.startTime, today),
        lte(activities.startTime, tomorrow)
      ];

      if (userId) {
        conditions.push(eq(activities.assignedTo, userId));
      }

      return await this.db.select()
        .from(activities)
        .where(and(...conditions))
        .orderBy(asc(activities.startTime));
    } catch (error) {
      console.error("Error getting today's activities:", error);
      throw new Error("Failed to get today's activities");
    }
  }

  /**
   * Get activities for a date range (calendar view)
   */
  async getActivitiesByDateRange(
    companyId: string, 
    startDate: Date, 
    endDate: Date, 
    userId?: string
  ): Promise<Activity[]> {
    try {
      const conditions = [
        eq(activities.companyId, companyId),
        gte(activities.startTime, startDate),
        lte(activities.startTime, endDate)
      ];

      if (userId) {
        conditions.push(eq(activities.assignedTo, userId));
      }

      return await this.db.select()
        .from(activities)
        .where(and(...conditions))
        .orderBy(asc(activities.startTime));
    } catch (error) {
      console.error("Error getting activities by date range:", error);
      throw new Error("Failed to get activities by date range");
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(companyId: string, userId?: string): Promise<any> {
    try {
      const conditions = [eq(activities.companyId, companyId)];
      
      if (userId) {
        conditions.push(eq(activities.assignedTo, userId));
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const statsResult = await this.db.select({
        total: sql`count(*)`,
        pending: sql`count(*) filter (where ${activities.status} = 'pending')`,
        completed: sql`count(*) filter (where ${activities.status} = 'completed')`,
        cancelled: sql`count(*) filter (where ${activities.status} = 'cancelled')`,
        today: sql`count(*) filter (where ${activities.startTime} >= ${today} and ${activities.startTime} < ${tomorrow})`,
        overdue: sql`count(*) filter (where ${activities.startTime} < ${today} and ${activities.status} = 'pending')`,
        calls: sql`count(*) filter (where ${activities.activityType} = 'call')`,
        meetings: sql`count(*) filter (where ${activities.activityType} = 'meeting')`,
        tasks: sql`count(*) filter (where ${activities.activityType} = 'task')`,
        emails: sql`count(*) filter (where ${activities.activityType} = 'email')`
      })
        .from(activities)
        .where(and(...conditions));

      return {
        total: Number(statsResult[0]?.total || 0),
        pending: Number(statsResult[0]?.pending || 0),
        completed: Number(statsResult[0]?.completed || 0),
        cancelled: Number(statsResult[0]?.cancelled || 0),
        today: Number(statsResult[0]?.today || 0),
        overdue: Number(statsResult[0]?.overdue || 0),
        calls: Number(statsResult[0]?.calls || 0),
        meetings: Number(statsResult[0]?.meetings || 0),
        tasks: Number(statsResult[0]?.tasks || 0),
        emails: Number(statsResult[0]?.emails || 0)
      };
    } catch (error) {
      console.error("Error getting activity statistics:", error);
      throw new Error("Failed to get activity statistics");
    }
  }
}