/**
 * Pipeline Service
 * 
 * Service for managing sales pipelines and stages in the CRM module
 */
import { DrizzleService } from "../../../common/drizzle";
import { sql, eq, and, asc } from "drizzle-orm";
import { 
  pipelines, 
  pipelineStages, 
  InsertPipeline, 
  InsertPipelineStage,
  Pipeline,
  PipelineStage 
} from "../schema/crm.schema";
import { randomUUID } from "crypto";
import AuditService, { AuditAction } from "../../audit/services/audit.service";

export class PipelineService {
  private db: DrizzleService;

  constructor() {
    this.db = new DrizzleService();
  }

  /**
   * Create a new pipeline
   */
  async createPipeline(data: InsertPipeline, userId: string): Promise<Pipeline> {
    try {
      // Check if this is the first pipeline and set isDefault to true if it is
      if (data.isDefault) {
        // If this pipeline is default, reset any other default pipelines
        await this.db.query(async (db) => {
          return await db.update(pipelines)
            .set({ isDefault: false })
            .where(eq(pipelines.companyId, data.companyId));
        });
      } else {
        const existingPipelines = await this.db.query(async (db) => {
          return await db.select({ count: sql`count(*)` })
            .from(pipelines)
            .where(eq(pipelines.companyId, data.companyId));
        });
        
        if (Number(existingPipelines[0]?.count || 0) === 0) {
          data.isDefault = true;
        }
      }

      const result = await this.db.query(async (db) => {
        return await db.insert(pipelines)
          .values({
            ...data,
            id: randomUUID(),
            createdBy: userId,
            updatedBy: userId
          })
          .returning();
      });

      if (result.length > 0) {
        await AuditService.log({
          userId,
          companyId: data.companyId,
          action: AuditAction.CREATE,
          entity: "pipeline",
          entityId: result[0].id,
          details: data
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error creating pipeline:", error);
      throw new Error("Failed to create pipeline");
    }
  }

  /**
   * Update a pipeline
   */
  async updatePipeline(id: string, data: Partial<InsertPipeline>, userId: string): Promise<Pipeline | null> {
    try {
      // If setting this pipeline as default, reset any other default pipelines
      if (data.isDefault) {
        await this.db.query(async (db) => {
          return await db.update(pipelines)
            .set({ isDefault: false })
            .where(and(
              eq(pipelines.companyId, data.companyId || ''),
              sql`${pipelines.id} != ${id}`
            ));
        });
      }

      const result = await this.db.query(async (db) => {
        return await db.update(pipelines)
          .set({
            ...data,
            updatedAt: new Date(),
            updatedBy: userId
          })
          .where(and(
            eq(pipelines.id, id),
            eq(pipelines.companyId, data.companyId || '')
          ))
          .returning();
      });

      if (result.length > 0) {
        await AuditService.log({
          userId,
          companyId: data.companyId || result[0].companyId,
          action: AuditAction.UPDATE,
          entity: "pipeline",
          entityId: id,
          details: data
        });
      }

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating pipeline:", error);
      throw new Error("Failed to update pipeline");
    }
  }

  /**
   * Delete a pipeline (soft delete)
   */
  async deletePipeline(id: string, companyId: string, userId: string): Promise<boolean> {
    try {
      // Check if this is the default pipeline
      const pipeline = await this.db.query(async (db) => {
        return await db.select()
          .from(pipelines)
          .where(and(
            eq(pipelines.id, id),
            eq(pipelines.companyId, companyId)
          ));
      });

      if (pipeline.length === 0) {
        return false;
      }

      // Don't allow deleting the default pipeline if it's the only one
      if (pipeline[0].isDefault) {
        const pipelineCount = await this.db.query(async (db) => {
          return await db.select({ count: sql`count(*)` })
            .from(pipelines)
            .where(eq(pipelines.companyId, companyId));
        });
        
        if (Number(pipelineCount[0]?.count || 0) === 1) {
          throw new Error("Cannot delete the only pipeline. Create a new pipeline first.");
        }
      }

      const result = await this.db.query(async (db) => {
        return await db.update(pipelines)
          .set({
            isActive: false,
            updatedAt: new Date(),
            updatedBy: userId
          })
          .where(and(
            eq(pipelines.id, id),
            eq(pipelines.companyId, companyId)
          ))
          .returning();
      });

      if (result.length > 0) {
        await AuditService.log({
          userId,
          companyId,
          action: AuditAction.DELETE,
          entity: "pipeline",
          entityId: id,
          details: { message: "Soft deleted pipeline" }
        });

        // If the deleted pipeline was the default one, set another pipeline as default
        if (result[0].isDefault) {
          const otherPipeline = await this.db.query(async (db) => {
            return await db.select()
              .from(pipelines)
              .where(and(
                eq(pipelines.companyId, companyId),
                eq(pipelines.isActive, true),
                sql`${pipelines.id} != ${id}`
              ))
              .limit(1);
          });

          if (otherPipeline.length > 0) {
            await this.db.query(async (db) => {
              return await db.update(pipelines)
                .set({ 
                  isDefault: true,
                  updatedAt: new Date(),
                  updatedBy: userId
                })
                .where(eq(pipelines.id, otherPipeline[0].id));
            });
          }
        }
      }

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to delete pipeline");
    }
  }

  /**
   * Get all pipelines for a company
   */
  async getPipelines(companyId: string, includeInactive: boolean = false): Promise<Pipeline[]> {
    try {
      let conditions = [eq(pipelines.companyId, companyId)];
      
      if (!includeInactive) {
        conditions.push(eq(pipelines.isActive, true));
      }

      return await this.db.query(async (db) => {
        return await db.select()
          .from(pipelines)
          .where(and(...conditions))
          .orderBy(asc(pipelines.displayOrder));
      });
    } catch (error) {
      console.error("Error getting pipelines:", error);
      throw new Error("Failed to get pipelines");
    }
  }

  /**
   * Get a pipeline by ID
   */
  async getPipelineById(id: string, companyId: string): Promise<Pipeline | null> {
    try {
      const result = await this.db.query(async (db) => {
        return await db.select()
          .from(pipelines)
          .where(and(
            eq(pipelines.id, id),
            eq(pipelines.companyId, companyId)
          ));
      });

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error getting pipeline:", error);
      throw new Error("Failed to get pipeline");
    }
  }

  /**
   * Get the default pipeline for a company
   */
  async getDefaultPipeline(companyId: string): Promise<Pipeline | null> {
    try {
      const result = await this.db.query(async (db) => {
        return await db.select()
          .from(pipelines)
          .where(and(
            eq(pipelines.companyId, companyId),
            eq(pipelines.isDefault, true),
            eq(pipelines.isActive, true)
          ));
      });

      if (result.length === 0) {
        // If no default pipeline, get the first active pipeline
        const anyPipeline = await this.db.query(async (db) => {
          return await db.select()
            .from(pipelines)
            .where(and(
              eq(pipelines.companyId, companyId),
              eq(pipelines.isActive, true)
            ))
            .limit(1);
        });

        return anyPipeline.length > 0 ? anyPipeline[0] : null;
      }

      return result[0];
    } catch (error) {
      console.error("Error getting default pipeline:", error);
      throw new Error("Failed to get default pipeline");
    }
  }

  /**
   * Create a new pipeline stage
   */
  async createStage(data: InsertPipelineStage, userId: string): Promise<PipelineStage> {
    try {
      // If displayOrder is not provided, put it at the end
      if (data.displayOrder === undefined) {
        const lastStage = await this.db.query(async (db) => {
          return await db.select()
            .from(pipelineStages)
            .where(and(
              eq(pipelineStages.pipelineId, data.pipelineId),
              eq(pipelineStages.companyId, data.companyId)
            ))
            .orderBy(desc(pipelineStages.displayOrder))
            .limit(1);
        });

        data.displayOrder = lastStage.length > 0
          ? (lastStage[0].displayOrder || 0) + 1
          : 0;
      }

      const result = await this.db.query(async (db) => {
        return await db.insert(pipelineStages)
          .values({
            ...data,
            id: randomUUID(),
            createdBy: userId,
            updatedBy: userId
          })
          .returning();
      });

      if (result.length > 0) {
        await AuditService.log({
          userId,
          companyId: data.companyId,
          action: AuditAction.CREATE,
          entity: "pipelineStage",
          entityId: result[0].id,
          details: data
        });
      }

      return result[0];
    } catch (error) {
      console.error("Error creating pipeline stage:", error);
      throw new Error("Failed to create pipeline stage");
    }
  }

  /**
   * Update a pipeline stage
   */
  async updateStage(id: string, data: Partial<InsertPipelineStage>, userId: string): Promise<PipelineStage | null> {
    try {
      const result = await this.db.update(pipelineStages)
        .set({
          ...data,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(pipelineStages.id, id),
          eq(pipelineStages.companyId, data.companyId || '')
        ))
        .returning();

      if (result.length > 0) {
        await AuditService.log({
          userId,
          companyId: data.companyId || result[0].companyId,
          action: AuditAction.UPDATE,
          entity: "pipelineStage",
          entityId: id,
          details: data
        });
      }

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      throw new Error("Failed to update pipeline stage");
    }
  }

  /**
   * Delete a pipeline stage
   */
  async deleteStage(id: string, companyId: string, userId: string): Promise<boolean> {
    try {
      // Check if there are any deals in this stage
      const dealsInStage = await this.db.select({ count: sql`count(*)` })
        .from(deals)
        .where(and(
          eq(deals.stageId, id),
          eq(deals.companyId, companyId)
        ));

      if (Number(dealsInStage[0]?.count || 0) > 0) {
        throw new Error("Cannot delete stage with deals. Move deals to another stage first.");
      }

      const result = await this.db.update(pipelineStages)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(pipelineStages.id, id),
          eq(pipelineStages.companyId, companyId)
        ))
        .returning();

      if (result.length > 0) {
        await AuditService.log({
          userId,
          companyId,
          action: AuditAction.DELETE,
          entity: "pipelineStage",
          entityId: id,
          details: { message: "Soft deleted pipeline stage" }
        });
      }

      return result.length > 0;
    } catch (error) {
      console.error("Error deleting pipeline stage:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to delete pipeline stage");
    }
  }

  /**
   * Get stages for a pipeline
   */
  async getStages(pipelineId: string, companyId: string, includeInactive: boolean = false): Promise<PipelineStage[]> {
    try {
      let conditions = [
        eq(pipelineStages.pipelineId, pipelineId),
        eq(pipelineStages.companyId, companyId)
      ];
      
      if (!includeInactive) {
        conditions.push(eq(pipelineStages.isActive, true));
      }

      return await this.db.select()
        .from(pipelineStages)
        .where(and(...conditions))
        .orderBy(asc(pipelineStages.displayOrder));
    } catch (error) {
      console.error("Error getting pipeline stages:", error);
      throw new Error("Failed to get pipeline stages");
    }
  }

  /**
   * Reorder pipeline stages
   */
  async reorderStages(pipelineId: string, companyId: string, stageIds: string[], userId: string): Promise<boolean> {
    try {
      // Verify all stages belong to this pipeline and company
      const stages = await this.db.select()
        .from(pipelineStages)
        .where(and(
          eq(pipelineStages.pipelineId, pipelineId),
          eq(pipelineStages.companyId, companyId)
        ));

      const stageMap = new Map(stages.map((stage: any) => [stage.id, stage]));
      
      // Check if all provided stage IDs exist in this pipeline
      for (const stageId of stageIds) {
        if (!stageMap.has(stageId)) {
          throw new Error(`Stage with ID ${stageId} not found in pipeline ${pipelineId}`);
        }
      }

      // Update the display order for each stage
      for (let i = 0; i < stageIds.length; i++) {
        await this.db.update(pipelineStages)
          .set({
            displayOrder: i,
            updatedAt: new Date(),
            updatedBy: userId
          })
          .where(eq(pipelineStages.id, stageIds[i]));
      }

      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: "pipelineStages",
        entityId: pipelineId,
        details: { message: `Reordered stages: ${stageIds.join(', ')}` }
      });

      return true;
    } catch (error) {
      console.error("Error reordering pipeline stages:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to reorder pipeline stages");
    }
  }

  /**
   * Get all stages across all pipelines for a company
   */
  async getAllStages(companyId: string): Promise<PipelineStage[]> {
    try {
      return await this.db.select()
        .from(pipelineStages)
        .where(and(
          eq(pipelineStages.companyId, companyId),
          eq(pipelineStages.isActive, true)
        ))
        .orderBy(asc(pipelineStages.pipelineId), asc(pipelineStages.displayOrder));
    } catch (error) {
      console.error("Error getting all pipeline stages:", error);
      throw new Error("Failed to get all pipeline stages");
    }
  }
}

// Add missing import for the desc and deals
import { desc } from "drizzle-orm";
import { deals } from "../schema/crm.schema";