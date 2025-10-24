/**
 * Deal Service
 * 
 * Service for managing deals in the CRM module
 */
import { getDrizzle } from "@common/drizzle";
import { sql, eq, and, or, like, desc, asc, isNull, not } from "drizzle-orm";
import {
  deals,
  dealStageHistory,
  pipelineStages,
  InsertDeal,
  InsertDealStageHistory,
  Deal,
  DealStageHistory
} from "../schema/crm.schema";
import { randomUUID } from "crypto";
import { AuditService } from "@geniuserp/audit";
import { PipelineService } from "./pipeline.service";

export class DealService {
  private db: ReturnType<typeof getDrizzle>;
  private auditService: AuditService;
  private pipelineService: PipelineService;

  constructor() {
    this.db = getDrizzle();
    this.auditService = new AuditService();
    this.pipelineService = new PipelineService();
  }

  /**
   * Create a new deal
   */
  async create(data: InsertDeal, userId: string): Promise<Deal> {
    try {
      const dealId = randomUUID();

      // If no probability is provided, get it from the stage
      if (data.probability === undefined) {
        const stage = await this.db.select()
          .from(pipelineStages)
          .where(eq(pipelineStages.id, data.stageId));

        if (stage.length > 0) {
          data.probability = stage[0].probability;
        }
      }

      const result = await this.db.insert(deals)
        .values({
          ...data,
          id: dealId,
          createdBy: userId,
          updatedBy: userId
        })
        .returning();

      if (result.length > 0) {
        // Create initial stage history record
        await this.db.insert(dealStageHistory)
          .values({
            id: randomUUID(),
            dealId,
            companyId: data.companyId,
            toStageId: data.stageId,
            changedBy: userId,
            notes: "Initial stage"
          });

        await this.auditService.logAction({
          userId,
          action: "create",
          resourceType: "deal",
          resourceId: dealId,
          details: JSON.stringify(data),
          companyId: data.companyId
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error creating deal:", error);
      throw new Error("Failed to create deal");
    }
  }

  /**
   * Update a deal
   */
  async update(id: string, data: Partial<InsertDeal>, userId: string): Promise<Deal | null> {
    try {
      // Get the current deal to check for stage changes
      const currentDeal = await this.db.select()
        .from(deals)
        .where(eq(deals.id, id));

      if (currentDeal.length === 0) {
        return null;
      }

      // Check if stage is changing
      const stageChanged = data.stageId && data.stageId !== currentDeal[0].stageId;

      // If the probability is not provided but the stage changed, get the new probability from the stage
      if (stageChanged && data.probability === undefined) {
        const stage = await this.db.select()
          .from(pipelineStages)
          .where(eq(pipelineStages.id, data.stageId || ''));

        if (stage.length > 0) {
          data.probability = stage[0].probability;
        }
      }

      // Check if status is changing to won or lost
      if (data.status) {
        if (data.status === 'won' && !data.actualCloseDate) {
          data.actualCloseDate = new Date().toISOString().split('T')[0];
        } else if (data.status === 'lost' && !data.actualCloseDate) {
          data.actualCloseDate = new Date().toISOString().split('T')[0];
        }
      }

      const result = await this.db.update(deals)
        .set({
          ...data,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(deals.id, id),
          eq(deals.companyId, data.companyId || currentDeal[0].companyId)
        ))
        .returning();

      if (result.length > 0) {
        // If stage changed, create a stage history record
        if (stageChanged) {
          // Calculate days in previous stage
          const lastStageChange = await this.db.select()
            .from(dealStageHistory)
            .where(eq(dealStageHistory.dealId, id))
            .orderBy(desc(dealStageHistory.changedAt))
            .limit(1);

          let timeInStage = 0;
          if (lastStageChange.length > 0 && lastStageChange[0].changedAt) {
            const lastChangeDate = new Date(lastStageChange[0].changedAt);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lastChangeDate.getTime());
            timeInStage = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }

          await this.db.insert(dealStageHistory)
            .values({
              id: randomUUID(),
              dealId: id,
              companyId: data.companyId || currentDeal[0].companyId,
              fromStageId: currentDeal[0].stageId,
              toStageId: data.stageId || '',
              timeInStage,
              changedBy: userId,
              notes: data.status === 'won' ? 'Deal won' : 
                      data.status === 'lost' ? 'Deal lost' : 'Stage updated'
            });
        }

        await this.auditService.logAction({
          userId,
          action: "update",
          resourceType: "deal",
          resourceId: id,
          details: JSON.stringify(data),
          companyId: data.companyId || currentDeal[0].companyId
        });
      }

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating deal:", error);
      throw new Error("Failed to update deal");
    }
  }

  /**
   * Delete a deal (soft delete)
   */
  async delete(id: string, companyId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.db.update(deals)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(deals.id, id),
          eq(deals.companyId, companyId)
        ))
        .returning();

      if (result.length > 0) {
        await this.auditService.logAction({
          userId,
          action: "delete",
          resourceType: "deal",
          resourceId: id,
          details: "Soft deleted deal",
          companyId
        });
      }

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting deal:", error);
      throw new Error("Failed to delete deal");
    }
  }

  /**
   * Get a deal by ID
   */
  async getById(id: string, companyId: string): Promise<Deal | null> {
    try {
      const result = await this.db.select()
        .from(deals)
        .where(and(
          eq(deals.id, id),
          eq(deals.companyId, companyId)
        ));

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting deal:", error);
      throw new Error("Failed to get deal");
    }
  }

  /**
   * Get deal stage history
   */
  async getStageHistory(dealId: string, companyId: string): Promise<DealStageHistory[]> {
    try {
      return await this.db.select()
        .from(dealStageHistory)
        .where(and(
          eq(dealStageHistory.dealId, dealId),
          eq(dealStageHistory.companyId, companyId)
        ))
        .orderBy(asc(dealStageHistory.changedAt));
    } catch (error) {
      console.error("Error getting deal stage history:", error);
      throw new Error("Failed to get deal stage history");
    }
  }

  /**
   * List deals with optional filtering
   */
  async list(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      searchTerm?: string;
      pipelineId?: string;
      stageId?: string;
      customerId?: string;
      status?: string;
      ownerId?: string;
      isActive?: boolean;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
      minAmount?: number;
      maxAmount?: number;
      expectedCloseDateStart?: Date;
      expectedCloseDateEnd?: Date;
    } = {}
  ): Promise<{ data: Deal[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        searchTerm,
        pipelineId,
        stageId,
        customerId,
        status,
        ownerId,
        isActive = true,
        sortBy = 'createdAt',
        sortDirection = 'desc',
        minAmount,
        maxAmount,
        expectedCloseDateStart,
        expectedCloseDateEnd
      } = options;

      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(deals.companyId, companyId)];

      if (isActive !== undefined) {
        conditions.push(eq(deals.isActive, isActive));
      }

      if (pipelineId) {
        conditions.push(eq(deals.pipelineId, pipelineId));
      }

      if (stageId) {
        conditions.push(eq(deals.stageId, stageId));
      }

      if (customerId) {
        conditions.push(eq(deals.customerId, customerId));
      }

      if (status) {
        conditions.push(eq(deals.status, status));
      }

      if (ownerId) {
        conditions.push(eq(deals.ownerId, ownerId));
      }

      if (minAmount !== undefined) {
        conditions.push(sql`cast(${deals.amount} as numeric) >= ${minAmount}`);
      }

      if (maxAmount !== undefined) {
        conditions.push(sql`cast(${deals.amount} as numeric) <= ${maxAmount}`);
      }

      if (expectedCloseDateStart) {
        conditions.push(sql`${deals.expectedCloseDate} >= ${expectedCloseDateStart}`);
      }

      if (expectedCloseDateEnd) {
        conditions.push(sql`${deals.expectedCloseDate} <= ${expectedCloseDateEnd}`);
      }

      if (searchTerm) {
        const searchConditions = [
          like(deals.title, `%${searchTerm}%`)
        ];
        if (deals.description) {
          searchConditions.push(like(deals.description, `%${searchTerm}%`));
        }
        const searchOr = or(...searchConditions);
        if (searchOr) {
          conditions.push(searchOr);
        }
      }

      // Get total count
      const totalResult = await this.db.select({ count: sql`count(*)` })
        .from(deals)
        .where(and(...conditions));

      const total = Number(totalResult[0]?.count || 0);

      // Get data with sorting
      const data = await this.db.select()
        .from(deals)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(deals.createdAt));

      return { data, total };
    } catch (error) {
      console.error("Error listing deals:", error);
      throw new Error("Failed to list deals");
    }
  }

  /**
   * Get deals by customer ID
   */
  async getByCustomerId(customerId: string, companyId: string): Promise<Deal[]> {
    try {
      return await this.db.select()
        .from(deals)
        .where(and(
          eq(deals.customerId, customerId),
          eq(deals.companyId, companyId),
          eq(deals.isActive, true)
        ))
        .orderBy(desc(deals.createdAt));
    } catch (error) {
      console.error("Error getting deals by customer:", error);
      throw new Error("Failed to get deals by customer");
    }
  }

  /**
   * Move deal to a different stage
   */
  async moveToStage(
    id: string, 
    stageId: string, 
    companyId: string, 
    userId: string, 
    reason?: string
  ): Promise<Deal | null> {
    try {
      // Get the current deal
      const currentDeal = await this.db.select()
        .from(deals)
        .where(and(
          eq(deals.id, id),
          eq(deals.companyId, companyId)
        ));

      if (currentDeal.length === 0) {
        return null;
      }

      // Get the stage to get the probability
      const stage = await this.db.select()
        .from(pipelineStages)
        .where(eq(pipelineStages.id, stageId));

      if (stage.length === 0) {
        throw new Error("Stage not found");
      }

      // Check if the stage belongs to the same pipeline
      if (stage[0].pipelineId !== currentDeal[0].pipelineId) {
        throw new Error("Stage does not belong to the deal's pipeline");
      }

      // Calculate days in previous stage
      const lastStageChange = await this.db.select()
        .from(dealStageHistory)
        .where(eq(dealStageHistory.dealId, id))
        .orderBy(desc(dealStageHistory.changedAt))
        .limit(1);

      let daysInStage = 0;
      if (lastStageChange.length > 0 && lastStageChange[0].changedAt) {
        const lastChangeDate = new Date(lastStageChange[0].changedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastChangeDate.getTime());
        daysInStage = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Update the deal with the new stage
      const updateData: Partial<InsertDeal> = {
        stageId,
        probability: stage[0].probability,
        updatedBy: userId
      };

      // Check if this is a closing stage (won or lost)
      if (stage[0].stageType === 'closed_won') {
        updateData.status = 'won';
        updateData.actualCloseDate = new Date().toISOString().split('T')[0];
      } else if (stage[0].stageType === 'closed_lost') {
        updateData.status = 'lost';
        updateData.actualCloseDate = new Date().toISOString().split('T')[0];
      } else {
        updateData.status = 'open';
      }

      const result = await this.db.update(deals)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(and(
          eq(deals.id, id),
          eq(deals.companyId, companyId)
        ))
        .returning();

      // Create stage history entry
      if (result.length > 0) {
        // Calculate time in current stage
        const lastStageChange = await this.db.select()
          .from(dealStageHistory)
          .where(eq(dealStageHistory.dealId, id))
          .orderBy(desc(dealStageHistory.changedAt))
          .limit(1);

        let timeInStage = 0;
        if (lastStageChange.length > 0 && lastStageChange[0].changedAt) {
          const lastChangeDate = new Date(lastStageChange[0].changedAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - lastChangeDate.getTime());
          timeInStage = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        await this.db.insert(dealStageHistory)
          .values({
            id: randomUUID(),
            dealId: id,
            companyId,
            fromStageId: currentDeal[0].stageId,
            toStageId: stageId,
            timeInStage,
            changedBy: userId,
            notes: reason || `Moved to ${stage[0].name} stage`
          });

        await this.auditService.logAction({
          userId,
          action: "update",
          resourceType: "deal",
          resourceId: id,
          details: `Moved from stage ${currentDeal[0].stageId} to ${stageId}`,
          companyId
        });
      }

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error moving deal to stage:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to move deal to stage");
    }
  }

  /**
   * Get deal statistics by pipeline and stage
   */
  async getDealStats(companyId: string, pipelineId?: string): Promise<any> {
    try {
      // Get total number of deals and their total value
      const conditions = [
        eq(deals.companyId, companyId),
        eq(deals.isActive, true)
      ];

      if (pipelineId) {
        conditions.push(eq(deals.pipelineId, pipelineId));
      }

      const totalStats = await this.db.select({
        totalDeals: sql`count(*)`,
        totalValue: sql`sum(cast(${deals.amount} as numeric))`,
        avgValue: sql`avg(cast(${deals.amount} as numeric))`,
        openDeals: sql`count(*) filter (where ${deals.status} = 'open')`,
        wonDeals: sql`count(*) filter (where ${deals.status} = 'won')`,
        lostDeals: sql`count(*) filter (where ${deals.status} = 'lost')`,
        openValue: sql`sum(cast(${deals.amount} as numeric)) filter (where ${deals.status} = 'open')`,
        wonValue: sql`sum(cast(${deals.amount} as numeric)) filter (where ${deals.status} = 'won')`,
        weightedValue: sql`sum(cast(${deals.amount} as numeric) * cast(${deals.probability} as numeric) / 100)`
      })
        .from(deals)
        .where(and(...conditions));

      // Get deal counts by stage
      const stageStats = await this.db.select({
        stageId: deals.stageId,
        count: sql`count(*)`,
        value: sql`sum(cast(${deals.amount} as numeric))`,
        averageValue: sql`avg(cast(${deals.amount} as numeric))`
      })
        .from(deals)
        .where(and(...conditions))
        .groupBy(deals.stageId);

      // Get deal counts by status
      const statusStats = await this.db.select({
        status: deals.status,
        count: sql`count(*)`,
        value: sql`sum(cast(${deals.amount} as numeric))`
      })
        .from(deals)
        .where(and(...conditions))
        .groupBy(deals.status);

      // Get deal counts by owner
      const ownerStats = await this.db.select({
        ownerId: deals.ownerId,
        count: sql`count(*)`,
        value: sql`sum(cast(${deals.amount} as numeric))`
      })
        .from(deals)
        .where(and(...conditions))
        .groupBy(deals.ownerId);

      return {
        total: {
          deals: Number(totalStats[0]?.totalDeals || 0),
          value: Number(totalStats[0]?.totalValue || 0),
          avgValue: Number(totalStats[0]?.avgValue || 0),
          openDeals: Number(totalStats[0]?.openDeals || 0),
          wonDeals: Number(totalStats[0]?.wonDeals || 0),
          lostDeals: Number(totalStats[0]?.lostDeals || 0),
          openValue: Number(totalStats[0]?.openValue || 0),
          wonValue: Number(totalStats[0]?.wonValue || 0),
          weightedValue: Number(totalStats[0]?.weightedValue || 0)
        },
        byStage: stageStats,
        byStatus: statusStats,
        byOwner: ownerStats
      };
    } catch (error) {
      console.error("Error getting deal statistics:", error);
      throw new Error("Failed to get deal statistics");
    }
  }

  /**
   * Get deals with upcoming expected close dates
   */
  async getUpcomingDeals(companyId: string, days: number = 30): Promise<Deal[]> {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);

      return await this.db.select()
        .from(deals)
        .where(and(
          eq(deals.companyId, companyId),
          eq(deals.isActive, true),
          eq(deals.status, 'open'),
          not(isNull(deals.expectedCloseDate)),
          sql`${deals.expectedCloseDate} >= current_date`,
          sql`${deals.expectedCloseDate} <= ${endDate}`
        ))
        .orderBy(asc(deals.expectedCloseDate));
    } catch (error) {
      console.error("Error getting upcoming deals:", error);
      throw new Error("Failed to get upcoming deals");
    }
  }

  /**
   * Get recently updated deals
   */
  async getRecentlyUpdatedDeals(companyId: string, limit: number = 10): Promise<Deal[]> {
    try {
      return await this.db.select()
        .from(deals)
        .where(and(
          eq(deals.companyId, companyId),
          eq(deals.isActive, true)
        ))
        .orderBy(desc(deals.updatedAt))
        .limit(limit);
    } catch (error) {
      console.error("Error getting recently updated deals:", error);
      throw new Error("Failed to get recently updated deals");
    }
  }

  /**
   * Get deals that have been stuck in the same stage for too long
   */
  async getStaleDeals(companyId: string): Promise<Deal[]> {
    try {
      // First get all active deals
      const activeDeals = await this.db.select()
        .from(deals)
        .where(and(
          eq(deals.companyId, companyId),
          eq(deals.isActive, true),
          eq(deals.status, 'open')
        ));

      const staleDeals: Deal[] = [];

      // For each deal, check the last stage change and compare with the expected duration
      for (const deal of activeDeals) {
        // Get the last stage change
        const lastStageChange = await this.db.select()
          .from(dealStageHistory)
          .where(and(
            eq(dealStageHistory.dealId, deal.id),
            eq(dealStageHistory.toStageId, deal.stageId)
          ))
          .orderBy(desc(dealStageHistory.changedAt))
          .limit(1);

        if (lastStageChange.length === 0 || !lastStageChange[0].changedAt) continue;

        // Get the stage expected duration
        const stage = await this.db.select()
          .from(pipelineStages)
          .where(eq(pipelineStages.id, deal.stageId));

        if (stage.length === 0) continue;

        const expectedDuration = stage[0].expectedDuration || 0;
        
        if (expectedDuration <= 0) continue;

        // Calculate days in stage
        const lastChangeDate = new Date(lastStageChange[0].changedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastChangeDate.getTime());
        const daysInStage = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If the deal has been in the stage longer than expected, add it to the stale deals
        if (daysInStage > expectedDuration) {
          staleDeals.push({
            ...deal,
            daysInStage
          } as Deal);
        }
      }

      return staleDeals;
    } catch (error) {
      console.error("Error getting stale deals:", error);
      throw new Error("Failed to get stale deals");
    }
  }
}