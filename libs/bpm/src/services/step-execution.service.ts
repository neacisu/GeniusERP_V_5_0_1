/**
 * Step Execution Service
 * 
 * Manages execution of BPM process steps including status updates, result processing,
 * error handling, and manual execution functionality.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import { createModuleLogger } from "@common/logger/loki-logger";
import { 
  bpmStepExecutions,
  BpmStepExecutionStatus,
  StepExecution,
  StepExecutionCreate,
  StepExecutionUpdate
} from '../schema/bpm.schema';

const logger = createModuleLogger('StepExecutionService');

export class StepExecutionService {
  constructor(private db: PostgresJsDatabase<any>) {}
  
  /**
   * Create a new step execution record
   */
  async createStepExecution(data: StepExecutionCreate): Promise<StepExecution> {
    logger.debug('Creating step execution', { data });
    
    try {
      const [execution] = await this.db
        .insert(bpmStepExecutions)
        .values(data)
        .returning();
      
      logger.debug('Created step execution', { executionId: execution.id });
      return execution;
    } catch (error) {
      logger.error('Failed to create step execution', { error, data });
      throw error;
    }
  }
  
  /**
   * Get a step execution by ID
   */
  async getStepExecution(id: string, companyId: string): Promise<StepExecution | null> {
    logger.debug('Getting step execution', { id, companyId });
    
    try {
      const [execution] = await this.db
        .select()
        .from(bpmStepExecutions)
        .where(and(
          eq(bpmStepExecutions.id, id),
          eq(bpmStepExecutions.companyId, companyId)
        ));
      
      return execution || null;
    } catch (error) {
      logger.error('Failed to get step execution', { error, id, companyId });
      throw error;
    }
  }
  
  /**
   * Get all step executions for a process instance
   */
  async getStepExecutionsByInstanceId(instanceId: string, companyId: string): Promise<StepExecution[]> {
    logger.debug('Getting step executions for instance', { instanceId, companyId });
    
    try {
      const executions = await this.db
        .select()
        .from(bpmStepExecutions)
        .where(and(
          eq(bpmStepExecutions.instanceId, instanceId),
          eq(bpmStepExecutions.companyId, companyId)
        ));
      
      return executions;
    } catch (error) {
      logger.error('Failed to get step executions for instance', { error, instanceId, companyId });
      throw error;
    }
  }
  
  /**
   * Update a step execution
   */
  async updateStepExecution(id: string, companyId: string, data: StepExecutionUpdate): Promise<StepExecution | null> {
    logger.debug('Updating step execution', { id, companyId, data });
    
    try {
      const [execution] = await this.db
        .update(bpmStepExecutions)
        .set(data)
        .where(and(
          eq(bpmStepExecutions.id, id),
          eq(bpmStepExecutions.companyId, companyId)
        ))
        .returning();
      
      return execution || null;
    } catch (error) {
      logger.error('Failed to update step execution', { error, id, companyId, data });
      throw error;
    }
  }
  
  /**
   * Complete a step execution with output data
   */
  async completeStepExecution(id: string, companyId: string, userId: string, outputData: any): Promise<StepExecution | null> {
    logger.debug('Completing step execution', { id, companyId, userId });
    
    try {
      const now = new Date();
      
      const [execution] = await this.db
        .update(bpmStepExecutions)
        .set({
          status: BpmStepExecutionStatus.COMPLETED,
          outputData,
          completedAt: now,
          executedBy: userId
        })
        .where(and(
          eq(bpmStepExecutions.id, id),
          eq(bpmStepExecutions.companyId, companyId)
        ))
        .returning();
      
      logger.debug('Completed step execution', { executionId: id });
      return execution || null;
    } catch (error) {
      logger.error('Failed to complete step execution', { error, id, companyId });
      throw error;
    }
  }
  
  /**
   * Fail a step execution with error data
   */
  async failStepExecution(id: string, companyId: string, userId: string, errorData: any, reason?: string): Promise<StepExecution | null> {
    logger.debug('Failing step execution', { id, companyId, userId, reason });
    
    try {
      const now = new Date();
      
      const [execution] = await this.db
        .update(bpmStepExecutions)
        .set({
          status: BpmStepExecutionStatus.FAILED,
          errorData: {
            ...errorData,
            reason,
            failedAt: now.toISOString(),
            failedBy: userId
          },
          completedAt: now,
          executedBy: userId
        })
        .where(and(
          eq(bpmStepExecutions.id, id),
          eq(bpmStepExecutions.companyId, companyId)
        ))
        .returning();
      
      logger.debug('Failed step execution', { executionId: id });
      return execution || null;
    } catch (error) {
      logger.error('Failed to mark step execution as failed', { error, id, companyId });
      throw error;
    }
  }
  
  /**
   * Skip a step execution
   */
  async skipStepExecution(id: string, companyId: string, userId: string, reason?: string): Promise<StepExecution | null> {
    logger.debug('Skipping step execution', { id, companyId, userId, reason });
    
    try {
      const now = new Date();
      
      const [execution] = await this.db
        .update(bpmStepExecutions)
        .set({
          status: BpmStepExecutionStatus.SKIPPED,
          outputData: {
            skipped: true,
            reason,
            skippedAt: now.toISOString(),
            skippedBy: userId
          },
          completedAt: now,
          executedBy: userId
        })
        .where(and(
          eq(bpmStepExecutions.id, id),
          eq(bpmStepExecutions.companyId, companyId)
        ))
        .returning();
      
      logger.debug('Skipped step execution', { executionId: id });
      return execution || null;
    } catch (error) {
      logger.error('Failed to skip step execution', { error, id, companyId });
      throw error;
    }
  }
  
  /**
   * Start a step execution
   */
  async startStepExecution(id: string, companyId: string, userId: string): Promise<StepExecution | null> {
    logger.debug('Starting step execution', { id, companyId, userId });
    
    try {
      const now = new Date();
      
      const [execution] = await this.db
        .update(bpmStepExecutions)
        .set({
          status: BpmStepExecutionStatus.RUNNING,
          startedAt: now,
          executedBy: userId
        })
        .where(and(
          eq(bpmStepExecutions.id, id),
          eq(bpmStepExecutions.companyId, companyId),
          eq(bpmStepExecutions.status, BpmStepExecutionStatus.PENDING)
        ))
        .returning();
      
      logger.debug('Started step execution', { executionId: id });
      return execution || null;
    } catch (error) {
      logger.error('Failed to start step execution', { error, id, companyId });
      throw error;
    }
  }
  
  /**
   * Assign a step execution to a user
   */
  async assignStepExecution(id: string, companyId: string, assignToUserId: string, assignedByUserId: string): Promise<StepExecution | null> {
    logger.debug('Assigning step execution', { id, companyId, assignToUserId, assignedByUserId });
    
    try {
      // First get the existing execution to preserve outputData
      const [existingExecution] = await this.db
        .select()
        .from(bpmStepExecutions)
        .where(and(
          eq(bpmStepExecutions.id, id),
          eq(bpmStepExecutions.companyId, companyId)
        ))
        .limit(1);
      
      if (!existingExecution) {
        return null;
      }
      
      const [execution] = await this.db
        .update(bpmStepExecutions)
        .set({
          assignedTo: assignToUserId,
          outputData: {
            ...(existingExecution.outputData as any || {}),
            assignedAt: new Date().toISOString(),
            assignedBy: assignedByUserId
          }
        })
        .where(and(
          eq(bpmStepExecutions.id, id),
          eq(bpmStepExecutions.companyId, companyId)
        ))
        .returning();
      
      logger.debug('Assigned step execution', { executionId: id, userId: assignToUserId });
      return execution || null;
    } catch (error) {
      logger.error('Failed to assign step execution', { error, id, companyId, assignToUserId });
      throw error;
    }
  }
}