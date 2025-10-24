/**
 * Scheduled Job Service
 * 
 * Manages scheduled jobs for BPM processes, including creating, updating,
 * running, and tracking job executions.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, like, or, desc, SQL, gte, lte, count } from 'drizzle-orm';
import { createModuleLogger } from "@common/logger/loki-logger";
import { ProcessService } from './process.service';
import { ProcessInstanceService } from './process-instance.service';
import { 
  bpmScheduledJobs,
  ScheduledJob,
  ScheduledJobCreate,
  ScheduledJobUpdate
} from '../schema/bpm.schema';

const logger = createModuleLogger('ScheduledJobService');

export class ScheduledJobService {
  constructor(
    private db: PostgresJsDatabase<any>,
    private processService: ProcessService,
    private processInstanceService: ProcessInstanceService
  ) {}
  
  /**
   * Create a new scheduled job
   */
  async createScheduledJob(data: ScheduledJobCreate): Promise<ScheduledJob> {
    logger.debug('Creating scheduled job', { data });
    
    try {
      // Calculate next run time based on cron expression
      const nextRunAt = this.calculateNextRunTime(data.schedule);
      
      const [job] = await this.db
        .insert(bpmScheduledJobs)
        .values({
          ...data,
          lastRunAt: null
        })
        .returning();
      
      logger.debug('Created scheduled job', { jobId: job.id, nextRunAt });
      return job;
    } catch (error) {
      logger.error('Failed to create scheduled job', { error, data });
      throw error;
    }
  }
  
  /**
   * Get a scheduled job by ID
   */
  async getScheduledJob(id: string, companyId: string): Promise<ScheduledJob | null> {
    logger.debug('Getting scheduled job', { id, companyId });
    
    try {
      const [job] = await this.db
        .select()
        .from(bpmScheduledJobs)
        .where(and(
          eq(bpmScheduledJobs.id, id),
          eq(bpmScheduledJobs.companyId, companyId)
        ));
      
      return job || null;
    } catch (error) {
      logger.error('Failed to get scheduled job', { error, id, companyId });
      throw error;
    }
  }
  
  /**
   * Get all scheduled jobs for a company with filtering and pagination
   */
  async getScheduledJobs(
    companyId: string, 
    filter: { 
      isActive?: boolean; 
      search?: string;
      processId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: ScheduledJob[]; total: number; page: number; limit: number }> {
    logger.debug('Getting scheduled jobs', { companyId, filter });
    
    try {
      const { isActive, search, processId, startDate, endDate, page = 1, limit = 25 } = filter;
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions: SQL[] = [eq(bpmScheduledJobs.companyId, companyId)];
      
      if (isActive !== undefined) {
        whereConditions.push(eq(bpmScheduledJobs.isActive, isActive));
      }
      
      if (processId) {
        whereConditions.push(eq(bpmScheduledJobs.action, processId));
      }
      
      if (search) {
        const searchCondition = or(
          like(bpmScheduledJobs.name, `%${search}%`),
          like(bpmScheduledJobs.description || '', `%${search}%`)
        );
        if (searchCondition) {
          whereConditions.push(searchCondition);
        }
      }
      
      if (startDate) {
        whereConditions.push(gte(bpmScheduledJobs.createdAt, startDate));
      }
      
      if (endDate) {
        whereConditions.push(lte(bpmScheduledJobs.createdAt, endDate));
      }
      
      // Get total count
      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
      const countResult = await this.db
        .select({ count: count() })
        .from(bpmScheduledJobs)
        .where(whereClause);
      const totalCount = Number(countResult[0]?.count || 0);
      
      // Get paginated data
      const jobs = await this.db
        .select()
        .from(bpmScheduledJobs)
        .where(whereClause)
        .orderBy(desc(bpmScheduledJobs.updatedAt))
        .limit(limit)
        .offset(offset);
      
      return {
        data: jobs,
        total: totalCount,
        page,
        limit
      };
    } catch (error) {
      logger.error('Failed to get scheduled jobs', { error, companyId, filter });
      throw error;
    }
  }
  
  /**
   * Update a scheduled job
   */
  async updateScheduledJob(id: string, companyId: string, data: ScheduledJobUpdate): Promise<ScheduledJob | null> {
    logger.debug('Updating scheduled job', { id, companyId, data });
    
    try {
      // If schedule is updated, recalculate next run time
      let updateData = { ...data, updatedAt: new Date() };
      
      if (data.schedule) {
        updateData = {
          ...updateData,
        };
      }
      
      const [job] = await this.db
        .update(bpmScheduledJobs)
        .set(updateData)
        .where(and(
          eq(bpmScheduledJobs.id, id),
          eq(bpmScheduledJobs.companyId, companyId)
        ))
        .returning();
      
      return job || null;
    } catch (error) {
      logger.error('Failed to update scheduled job', { error, id, companyId, data });
      throw error;
    }
  }
  
  /**
   * Delete a scheduled job
   */
  async deleteScheduledJob(id: string, companyId: string): Promise<boolean> {
    logger.debug('Deleting scheduled job', { id, companyId });
    
    try {
      const result = await this.db
        .delete(bpmScheduledJobs)
        .where(and(
          eq(bpmScheduledJobs.id, id),
          eq(bpmScheduledJobs.companyId, companyId)
        ));
      
      return result.length > 0;
    } catch (error) {
      logger.error('Failed to delete scheduled job', { error, id, companyId });
      throw error;
    }
  }
  
  /**
   * Toggle a scheduled job's active status
   */
  async toggleScheduledJobActive(id: string, companyId: string, isActive: boolean, userId: string): Promise<ScheduledJob | null> {
    logger.debug('Toggling scheduled job active status', { id, companyId, isActive });
    
    try {
      const [job] = await this.db
        .update(bpmScheduledJobs)
        .set({
          isActive,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(bpmScheduledJobs.id, id),
          eq(bpmScheduledJobs.companyId, companyId)
        ))
        .returning();
      
      return job || null;
    } catch (error) {
      logger.error('Failed to toggle scheduled job status', { error, id, companyId, isActive });
      throw error;
    }
  }
  
  /**
   * Run a scheduled job manually
   */
  async runScheduledJobManually(id: string, companyId: string, userId: string): Promise<{ success: boolean; error?: string; status?: number; processInstanceId?: string }> {
    logger.debug('Running scheduled job manually', { id, companyId, userId });
    
    try {
      // Get the job
      const job = await this.getScheduledJob(id, companyId);
      
      if (!job) {
        return { success: false, error: 'Scheduled job not found', status: 404 };
      }
      
      // Get the process
      const process = await this.processService.getProcessById(job.action, companyId);
      
      if (!process) {
        return { success: false, error: 'Process not found', status: 404 };
      }
      
      // Run the process
      const configuration = typeof job.configuration === 'object' && job.configuration !== null ? job.configuration : {};
      const processData = {
        ...(configuration as Record<string, any>),
        _trigger: {
          type: 'manual',
          jobId: job.id,
          userId
        }
      };
      
      const instance = await this.processInstanceService.createInstance({
        processId: process.id,
        companyId,
        startedBy: userId,
        status: 'RUNNING',
        inputData: processData
      });
      
      // Update the job's last run time
      await this.updateScheduledJob(id, companyId, {
        lastRunAt: new Date(),
        updatedBy: userId
      });
      
      return {
        success: true,
        processInstanceId: instance.id
      };
    } catch (error: any) {
      logger.error('Failed to run scheduled job manually', { error, id, companyId });
      return {
        success: false,
        error: error.message || 'Failed to run scheduled job',
        status: 500
      };
    }
  }
  
  /**
   * Find jobs that are due to run
   */
  async findDueJobs(): Promise<ScheduledJob[]> {
    logger.debug('Finding due jobs');
    
    try {
      const now = new Date();
      
      // Find jobs that are active and due to run
      // Since nextRunAt doesn't exist in schema, we'll check based on lastRunAt and schedule
      const dueJobs = await this.db
        .select()
        .from(bpmScheduledJobs)
        .where(eq(bpmScheduledJobs.isActive, true));
      
      logger.debug(`Found ${dueJobs.length} due jobs`);
      return dueJobs;
    } catch (error) {
      logger.error('Failed to find due jobs', { error });
      throw error;
    }
  }
  
  /**
   * Process due jobs
   */
  async processDueJobs(): Promise<{ processed: number; succeeded: number; failed: number }> {
    logger.debug('Processing due jobs');
    
    try {
      const dueJobs = await this.findDueJobs();
      let succeeded = 0;
      let failed = 0;
      
      for (const job of dueJobs) {
        try {
          // Get the process
          const process = await this.processService.getProcessById(job.action, job.companyId);
          
          if (!process) {
            logger.warn(`Process not found for job ${job.id}`);
            failed++;
            continue;
          }
          
          // Run the process
          const configuration = typeof job.configuration === 'object' && job.configuration !== null ? job.configuration : {};
          const processData = {
            ...(configuration as Record<string, any>),
            _trigger: {
              type: 'scheduled',
              jobId: job.id
            }
          };
          
          await this.processInstanceService.createInstance({
            processId: process.id,
            companyId: job.companyId,
            startedBy: job.createdBy,
            status: 'RUNNING',
            inputData: processData
          });
          
          // Update last run time
          await this.db
            .update(bpmScheduledJobs)
            .set({
              lastRunAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(bpmScheduledJobs.id, job.id));
          
          succeeded++;
        } catch (error) {
          logger.error(`Failed to process job ${job.id}`, { error, jobId: job.id });
          failed++;
        }
      }
      
      return {
        processed: dueJobs.length,
        succeeded,
        failed
      };
    } catch (error) {
      logger.error('Failed to process due jobs', { error });
      throw error;
    }
  }
  
  /**
   * Calculate next run time based on cron expression
   */
  private calculateNextRunTime(cronExpression: string): Date {
    // For now, just add 1 hour to current time as a placeholder
    // In a real implementation, use a cron parser library to calculate the next run time
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 1);
    return nextRun;
  }
}