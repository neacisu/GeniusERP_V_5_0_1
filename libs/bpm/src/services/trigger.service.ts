/**
 * Trigger Service
 * 
 * Manages process triggers that can initiate processes
 */
import { eq, and, like, or, desc, sql, not, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { createModuleLogger } from "@common/logger/loki-logger";
import { 
  bpmTriggers, 
  Trigger,
  BpmTriggerType
} from '../schema/bpm.schema';
import { ProcessService, StartProcessDto } from './process.service';

/**
 * Trigger filter options
 */
export interface TriggerFilter {
  search?: string;
  processId?: string;
  type?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Trigger creation data
 */
export interface NewTrigger {
  name: string;
  description?: string;
  companyId: string;
  type: string; // WEBHOOK, SCHEDULED, EVENT, MANUAL
  processId: string;
  configuration?: Record<string, any>;
  isActive?: boolean;
  createdBy: string;
  updatedBy: string;
}

/**
 * Trigger update data
 */
export interface TriggerUpdateData {
  name?: string;
  description?: string;
  type?: string;
  processId?: string;
  configuration?: Record<string, any>;
  isActive?: boolean;
  updatedBy: string;
}

/**
 * Trigger execution context
 */
export interface TriggerExecutionContext {
  triggerId: string;
  userId: string;
  inputData?: Record<string, any>;
}

/**
 * Trigger Service
 * 
 * Manages process triggers that can initiate workflow processes
 */
export class TriggerService {
  private _logger: ReturnType<typeof createModuleLogger>;
  private _processService: ProcessService;
  private get db() {
    return this.drizzleService.getDbInstance();
  }

  constructor(private drizzleService: DrizzleService) {
    this._logger = createModuleLogger('TriggerService');
    this._processService = new ProcessService(drizzleService);
  }

  /**
   * Create a new trigger
   */
  async createTrigger(data: NewTrigger): Promise<Trigger> {
    this._logger.info('Creating trigger', { name: data.name, type: data.type });
    
    try {
      const now = new Date();
      const [trigger] = await this.drizzleService.query((tx) => tx.insert(bpmTriggers).values({
        id: uuidv4(),
        name: data.name,
        description: data.description || null,
        companyId: data.companyId,
        type: data.type,
        processId: data.processId,
        configuration: data.configuration || {},
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy
      }).returning());
      
      this._logger.info('Created trigger', { id: trigger.id, name: trigger.name });
      return trigger;
    } catch (error) {
      this._logger.error('Failed to create trigger', { error, name: data.name });
      throw error;
    }
  }

  /**
   * Get trigger by ID
   */
  async getTriggerById(id: string, companyId?: string): Promise<Trigger | null> {
    this._logger.debug('Getting trigger by ID', { id, companyId });
    
    try {
      let query = this.db
        .select()
        .from(bpmTriggers)
        .where(eq(bpmTriggers.id, id));
      
      // Add company filter if provided
      if (companyId) {
        query = query.where(eq(bpmTriggers.companyId, companyId));
      }
      
      const [trigger] = await query;
      
      if (!trigger) {
        this._logger.debug('Trigger not found', { id });
        return null;
      }
      
      return trigger;
    } catch (error) {
      this._logger.error('Failed to get trigger by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get triggers with filtering and pagination
   */
  async getTriggers(companyId: string, filter: TriggerFilter = {}): Promise<{ data: Trigger[], total: number }> {
    this._logger.debug('Getting triggers with filter', { companyId, filter });
    
    try {
      // Default pagination
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const offset = (page - 1) * limit;
      
      // Build conditions
      let conditions = and(
        eq(bpmTriggers.companyId, companyId)
      );
      
      // Apply specific filters
      if (filter.processId) {
        conditions = and(conditions, eq(bpmTriggers.processId, filter.processId));
      }
      
      if (filter.type) {
        conditions = and(conditions, eq(bpmTriggers.type, filter.type));
      }
      
      if (filter.isActive !== undefined) {
        conditions = and(conditions, eq(bpmTriggers.isActive, filter.isActive));
      }
      
      if (filter.search) {
        conditions = and(conditions, or(
          like(bpmTriggers.name, `%${filter.search}%`),
          like(bpmTriggers.description, `%${filter.search}%`)
        ));
      }
      
      // Get count for pagination
      const [{ count }] = await this.db
        .select({
          count: sql<number>`cast(count(*) as int)`
        })
        .from(bpmTriggers)
        .where(conditions);
      
      // Get data with pagination
      const data = await this.db
        .select()
        .from(bpmTriggers)
        .where(conditions)
        .orderBy(desc(bpmTriggers.createdAt))
        .limit(limit)
        .offset(offset);
      
      return {
        data,
        total: count
      };
    } catch (error) {
      this._logger.error('Failed to get triggers', { error, companyId });
      throw error;
    }
  }

  /**
   * Update a trigger
   */
  async updateTrigger(id: string, data: TriggerUpdateData): Promise<Trigger | null> {
    this._logger.info('Updating trigger', { id });
    
    try {
      // Check if trigger exists
      const trigger = await this.getTriggerById(id);
      
      if (!trigger) {
        return null;
      }
      
      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: data.updatedBy
      };
      
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      
      if (data.type !== undefined) {
        updateData.type = data.type;
      }
      
      if (data.processId !== undefined) {
        updateData.processId = data.processId;
      }
      
      if (data.configuration !== undefined) {
        updateData.configuration = data.configuration;
      }
      
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }
      
      // Update the trigger
      const [updatedTrigger] = await this.drizzleService.query((tx) => tx.update(bpmTriggers)
        .set(updateData)
        .where(eq(bpmTriggers.id, id))
        .returning());
      
      this._logger.info('Updated trigger', { id });
      return updatedTrigger;
    } catch (error) {
      this._logger.error('Failed to update trigger', { error, id });
      throw error;
    }
  }

  /**
   * Delete a trigger
   */
  async deleteTrigger(id: string): Promise<boolean> {
    this._logger.info('Deleting trigger', { id });
    
    try {
      // Check if trigger exists
      const trigger = await this.getTriggerById(id);
      
      if (!trigger) {
        return false;
      }
      
      // Delete the trigger
      await this.drizzleService.query((tx) => tx.delete(bpmTriggers)
        .where(eq(bpmTriggers.id, id)));
      
      this._logger.info('Deleted trigger', { id });
      return true;
    } catch (error) {
      this._logger.error('Failed to delete trigger', { error, id });
      throw error;
    }
  }

  /**
   * Activate or deactivate a trigger
   */
  async setTriggerStatus(id: string, isActive: boolean, userId: string): Promise<Trigger | null> {
    this._logger.info('Setting trigger status', { id, isActive });
    
    return this.updateTrigger(id, {
      isActive,
      updatedBy: userId
    });
  }

  /**
   * Get triggers by process ID
   */
  async getTriggersByProcess(processId: string, companyId: string): Promise<Trigger[]> {
    this._logger.debug('Getting triggers by process ID', { processId, companyId });
    
    try {
      const triggers = await this.db
        .select()
        .from(bpmTriggers)
        .where(
          and(
            eq(bpmTriggers.processId, processId),
            eq(bpmTriggers.companyId, companyId)
          )
        )
        .orderBy(desc(bpmTriggers.createdAt));
      
      return triggers;
    } catch (error) {
      this._logger.error('Failed to get triggers by process ID', { error, processId });
      throw error;
    }
  }

  /**
   * Get triggers by type
   */
  async getTriggersByType(type: string, companyId: string): Promise<Trigger[]> {
    this._logger.debug('Getting triggers by type', { type, companyId });
    
    try {
      const triggers = await this.db
        .select()
        .from(bpmTriggers)
        .where(
          and(
            eq(bpmTriggers.type, type),
            eq(bpmTriggers.companyId, companyId),
            eq(bpmTriggers.isActive, true)
          )
        )
        .orderBy(bpmTriggers.name);
      
      return triggers;
    } catch (error) {
      this._logger.error('Failed to get triggers by type', { error, type });
      throw error;
    }
  }

  /**
   * Execute a trigger to start a process
   */
  async executeTrigger(context: TriggerExecutionContext): Promise<any> {
    this._logger.info('Executing trigger', { triggerId: context.triggerId });
    
    try {
      // Get the trigger
      const trigger = await this.getTriggerById(context.triggerId);
      
      if (!trigger) {
        throw new Error(`Trigger with ID ${context.triggerId} not found`);
      }
      
      if (!trigger.isActive) {
        throw new Error(`Trigger with ID ${context.triggerId} is not active`);
      }
      
      // Start the process using the process service
      const processStartData: StartProcessDto = {
        processId: trigger.processId,
        companyId: trigger.companyId,
        startedBy: context.userId,
        inputData: {
          ...(context.inputData || {}),
          triggerId: trigger.id,
          triggerType: trigger.type,
          triggerName: trigger.name,
          triggerConfig: trigger.configuration,
          executionTime: new Date().toISOString()
        }
      };
      
      const processInstance = await this._processService.startProcess(processStartData);
      
      this._logger.info('Executed trigger', { 
        triggerId: context.triggerId,
        processId: trigger.processId,
        instanceId: processInstance.id
      });
      
      return processInstance;
    } catch (error) {
      this._logger.error('Failed to execute trigger', { error, triggerId: context.triggerId });
      throw error;
    }
  }
}