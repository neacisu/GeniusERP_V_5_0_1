/**
 * Process Instance Service
 * 
 * Manages process instances (running workflow executions)
 */
import { eq, and, like, or, desc, sql, not, isNull, asc, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../common/logger';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { 
  bpmProcessInstances, 
  bpmProcessInstanceHistory,
  ProcessInstance,
  ProcessInstanceHistory,
  BpmProcessInstanceStatus
} from '../schema/bpm.schema';

/**
 * Process instance filter options
 */
export interface ProcessInstanceFilter {
  search?: string;
  processId?: string;
  status?: string[];
  startedBy?: string;
  page?: number;
  limit?: number;
}

/**
 * Process instance creation data
 */
export interface NewProcessInstance {
  processId: string;
  companyId: string;
  status: string;
  currentStep?: string;
  startedBy: string;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  variables?: Record<string, any>;
}

/**
 * Process instance update data
 */
export interface ProcessInstanceUpdateData {
  status?: string;
  currentStep?: string;
  outputData?: Record<string, any>;
  variables?: Record<string, any>;
  completedAt?: Date | null;
}

/**
 * Process Instance history entry data
 */
export interface ProcessHistoryEntry {
  instanceId: string;
  action: string;
  status: string;
  details?: Record<string, any>;
  userId?: string;
}

/**
 * Process Instance Service
 * 
 * Responsible for managing process instances (running workflows)
 */
export class ProcessInstanceService {
  private _logger: Logger;

  constructor(private drizzleService: DrizzleService) {
    this._logger = new Logger('ProcessInstanceService');
  }

  /**
   * Create a new process instance
   */
  async createInstance(data: NewProcessInstance): Promise<ProcessInstance> {
    this._logger.info('Creating process instance', { processId: data.processId });
    
    try {
      const now = new Date();
      const result = await this.drizzleService.query((tx) => 
        tx.insert(bpmProcessInstances).values({
          id: uuidv4(),
          processId: data.processId,
          companyId: data.companyId,
          status: data.status,
          currentStep: data.currentStep || null,
          startedBy: data.startedBy,
          inputData: data.inputData || {},
          outputData: data.outputData || {},
          variables: data.variables || {},
          createdAt: now,
          updatedAt: now,
          completedAt: null
        }).returning()
      );
      
      const instance = result[0];
      
      // Create initial history entry
      await this.addHistoryEntry({
        instanceId: instance.id,
        action: 'CREATED',
        status: instance.status,
        details: {
          processId: data.processId,
          initialStep: data.currentStep
        },
        userId: data.startedBy
      });
      
      this._logger.info('Created process instance', { id: instance.id, processId: data.processId });
      return instance;
    } catch (error) {
      this._logger.error('Failed to create process instance', { error, processId: data.processId });
      throw error;
    }
  }

  /**
   * Get process instance by ID
   */
  async getInstanceById(id: string, companyId?: string): Promise<ProcessInstance | null> {
    this._logger.debug('Getting process instance by ID', { id, companyId });
    
    try {
      const results = await this.drizzleService.query((tx) => {
        let query = tx
          .select()
          .from(bpmProcessInstances)
          .where(eq(bpmProcessInstances.id, id));
        
        // Add company filter if provided
        if (companyId) {
          query = query.where(eq(bpmProcessInstances.companyId, companyId));
        }
        
        return query;
      });
      
      const instance = results.length > 0 ? results[0] : null;
      
      if (!instance) {
        this._logger.debug('Process instance not found', { id });
        return null;
      }
      
      return instance;
    } catch (error) {
      this._logger.error('Failed to get process instance by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get process instances with filtering and pagination
   */
  async getInstances(companyId: string, filter: ProcessInstanceFilter = {}): Promise<{ data: ProcessInstance[], total: number }> {
    this._logger.debug('Getting process instances with filter', { companyId, filter });
    
    try {
      // Default pagination
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const offset = (page - 1) * limit;
      
      // Build conditions
      let conditions = and(
        eq(bpmProcessInstances.companyId, companyId)
      );
      
      // Apply specific filters
      if (filter.processId) {
        conditions = and(conditions, eq(bpmProcessInstances.processId, filter.processId));
      }
      
      if (filter.startedBy) {
        conditions = and(conditions, eq(bpmProcessInstances.startedBy, filter.startedBy));
      }
      
      if (filter.status && filter.status.length > 0) {
        conditions = and(conditions, or(...filter.status.map(status => 
          eq(bpmProcessInstances.status, status)
        )));
      }
      
      // Get count for pagination
      const countResults = await this.drizzleService.query((tx) =>
        tx.select({
          count: sql<number>`cast(count(*) as int)`
        })
        .from(bpmProcessInstances)
        .where(conditions)
      );
      
      const [{ count }] = countResults;
      
      // Get data with pagination
      const data = await this.drizzleService.query((tx) =>
        tx.select()
        .from(bpmProcessInstances)
        .where(conditions)
        .orderBy(desc(bpmProcessInstances.createdAt))
        .limit(limit)
        .offset(offset)
      );
      
      return {
        data,
        total: count
      };
    } catch (error) {
      this._logger.error('Failed to get process instances', { error, companyId });
      throw error;
    }
  }

  /**
   * Update a process instance
   */
  async updateInstance(id: string, data: ProcessInstanceUpdateData, userId?: string): Promise<ProcessInstance | null> {
    this._logger.info('Updating process instance', { id });
    
    try {
      // Check if instance exists
      const instance = await this.getInstanceById(id);
      
      if (!instance) {
        return null;
      }
      
      // Build update object
      const updateData: any = {
        updatedAt: new Date()
      };
      
      let changes: Record<string, any> = {};
      
      if (data.status !== undefined) {
        updateData.status = data.status;
        changes.status = { from: instance.status, to: data.status };
      }
      
      if (data.currentStep !== undefined) {
        updateData.currentStep = data.currentStep;
        changes.currentStep = { from: instance.currentStep, to: data.currentStep };
      }
      
      if (data.outputData !== undefined) {
        updateData.outputData = data.outputData;
        changes.outputDataUpdated = true;
      }
      
      if (data.variables !== undefined) {
        // Merge variables rather than replacing them
        updateData.variables = {
          ...instance.variables,
          ...data.variables
        };
        changes.variablesUpdated = true;
      }
      
      if (data.completedAt !== undefined) {
        updateData.completedAt = data.completedAt;
        changes.completedAt = data.completedAt;
      }
      
      // Update the instance
      const result = await this.drizzleService.query((tx) =>
        tx.update(bpmProcessInstances)
          .set(updateData)
          .where(eq(bpmProcessInstances.id, id))
          .returning()
      );
      
      const updatedInstance = result[0];
      
      // Add history entry if something changed
      if (Object.keys(changes).length > 0) {
        await this.addHistoryEntry({
          instanceId: id,
          action: 'UPDATED',
          status: updatedInstance.status,
          details: changes,
          userId
        });
      }
      
      this._logger.info('Updated process instance', { id });
      return updatedInstance;
    } catch (error) {
      this._logger.error('Failed to update process instance', { error, id });
      throw error;
    }
  }

  /**
   * Complete a process instance
   */
  async completeInstance(id: string, outputData?: Record<string, any>, userId?: string): Promise<ProcessInstance | null> {
    this._logger.info('Completing process instance', { id });
    
    try {
      // Check if instance exists
      const instance = await this.getInstanceById(id);
      
      if (!instance) {
        return null;
      }
      
      if (instance.status === BpmProcessInstanceStatus.COMPLETED) {
        this._logger.warn('Process instance already completed', { id });
        return instance;
      }
      
      const updateData: ProcessInstanceUpdateData = {
        status: BpmProcessInstanceStatus.COMPLETED,
        completedAt: new Date()
      };
      
      if (outputData) {
        updateData.outputData = {
          ...instance.outputData,
          ...outputData
        };
      }
      
      // Add history entry
      await this.addHistoryEntry({
        instanceId: id,
        action: 'COMPLETED',
        status: BpmProcessInstanceStatus.COMPLETED,
        details: {
          completedAt: updateData.completedAt,
          previousStatus: instance.status
        },
        userId
      });
      
      return this.updateInstance(id, updateData, userId);
    } catch (error) {
      this._logger.error('Failed to complete process instance', { error, id });
      throw error;
    }
  }

  /**
   * Cancel a process instance
   */
  async cancelInstance(id: string, reason?: string, userId?: string): Promise<ProcessInstance | null> {
    this._logger.info('Canceling process instance', { id });
    
    try {
      // Check if instance exists
      const instance = await this.getInstanceById(id);
      
      if (!instance) {
        return null;
      }
      
      if (instance.status === BpmProcessInstanceStatus.COMPLETED || 
          instance.status === BpmProcessInstanceStatus.CANCELLED) {
        this._logger.warn('Process instance already completed or cancelled', { id, status: instance.status });
        return instance;
      }
      
      const updateData: ProcessInstanceUpdateData = {
        status: BpmProcessInstanceStatus.CANCELLED,
        completedAt: new Date(),
        variables: {
          ...instance.variables,
          cancellationReason: reason || 'Manual cancellation',
          cancellationTime: new Date().toISOString()
        }
      };
      
      // Add history entry
      await this.addHistoryEntry({
        instanceId: id,
        action: 'CANCELLED',
        status: BpmProcessInstanceStatus.CANCELLED,
        details: {
          reason: reason || 'Manual cancellation',
          previousStatus: instance.status
        },
        userId
      });
      
      return this.updateInstance(id, updateData, userId);
    } catch (error) {
      this._logger.error('Failed to cancel process instance', { error, id });
      throw error;
    }
  }

  /**
   * Add a history entry for a process instance
   */
  async addHistoryEntry(data: ProcessHistoryEntry): Promise<ProcessInstanceHistory> {
    this._logger.debug('Adding process instance history entry', { 
      instanceId: data.instanceId, 
      action: data.action
    });
    
    try {
      const result = await this.drizzleService.query((tx) =>
        tx.insert(bpmProcessInstanceHistory).values({
          id: uuidv4(),
          instanceId: data.instanceId,
          action: data.action,
          status: data.status,
          details: data.details || {},
          userId: data.userId || null,
          createdAt: new Date()
        }).returning()
      );
      
      const historyEntry = result[0];
      
      return historyEntry;
    } catch (error) {
      this._logger.error('Failed to add process instance history entry', { 
        error, 
        instanceId: data.instanceId
      });
      throw error;
    }
  }

  /**
   * Get history entries for a process instance
   */
  async getInstanceHistory(instanceId: string): Promise<ProcessInstanceHistory[]> {
    this._logger.debug('Getting process instance history', { instanceId });
    
    try {
      const history = await this.drizzleService.query((tx) =>
        tx.select()
          .from(bpmProcessInstanceHistory)
          .where(eq(bpmProcessInstanceHistory.instanceId, instanceId))
          .orderBy(asc(bpmProcessInstanceHistory.createdAt))
      );
      
      return history;
    } catch (error) {
      this._logger.error('Failed to get process instance history', { error, instanceId });
      throw error;
    }
  }

  /**
   * Get active instances count
   */
  async getActiveInstancesCount(companyId: string): Promise<number> {
    this._logger.debug('Getting active process instances count', { companyId });
    
    try {
      const result = await this.drizzleService.query((tx) =>
        tx.select({
            count: sql<number>`cast(count(*) as int)`
          })
          .from(bpmProcessInstances)
          .where(
            and(
              eq(bpmProcessInstances.companyId, companyId),
              inArray(bpmProcessInstances.status, [
                BpmProcessInstanceStatus.PENDING, 
                BpmProcessInstanceStatus.RUNNING
              ])
            )
          )
      );
      
      const [{ count }] = result;
      return count;
    } catch (error) {
      this._logger.error('Failed to get active process instances count', { error, companyId });
      throw error;
    }
  }

  /**
   * Get completed instances count
   */
  async getCompletedInstancesCount(companyId: string): Promise<number> {
    this._logger.debug('Getting completed process instances count', { companyId });
    
    try {
      const result = await this.drizzleService.query((tx) =>
        tx.select({
            count: sql<number>`cast(count(*) as int)`
          })
          .from(bpmProcessInstances)
          .where(
            and(
              eq(bpmProcessInstances.companyId, companyId),
              eq(bpmProcessInstances.status, BpmProcessInstanceStatus.COMPLETED)
            )
          )
      );
      
      const [{ count }] = result;
      return count;
    } catch (error) {
      this._logger.error('Failed to get completed process instances count', { error, companyId });
      throw error;
    }
  }

  /**
   * Execute process instance step
   * In a real implementation, this would execute the step logic
   * For this implementation, it simply updates the current step
   */
  async executeStep(id: string, stepId: string, stepData?: any, userId?: string): Promise<ProcessInstance | null> {
    this._logger.info('Executing process instance step', { id, stepId });
    
    try {
      // Check if instance exists
      const instance = await this.getInstanceById(id);
      
      if (!instance) {
        return null;
      }
      
      // Only execute step if the instance is not completed or cancelled
      if (instance.status === BpmProcessInstanceStatus.COMPLETED || 
          instance.status === BpmProcessInstanceStatus.CANCELLED) {
        this._logger.warn('Cannot execute step on completed or cancelled process instance', { 
          id, 
          status: instance.status 
        });
        return instance;
      }
      
      const updateData: ProcessInstanceUpdateData = {
        status: BpmProcessInstanceStatus.RUNNING,
        currentStep: stepId,
        variables: {
          ...instance.variables,
          lastExecutedStep: stepId,
          lastExecutedStepTime: new Date().toISOString(),
          ...(stepData ? { [`step_${stepId}_data`]: stepData } : {})
        }
      };
      
      // Add history entry
      await this.addHistoryEntry({
        instanceId: id,
        action: 'EXECUTE_STEP',
        status: BpmProcessInstanceStatus.RUNNING,
        details: {
          stepId,
          previousStep: instance.currentStep,
          stepData: stepData || {}
        },
        userId
      });
      
      return this.updateInstance(id, updateData, userId);
    } catch (error) {
      this._logger.error('Failed to execute process instance step', { 
        error, 
        id, 
        stepId 
      });
      throw error;
    }
  }
}