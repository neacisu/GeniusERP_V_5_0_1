/**
 * Process Service
 * 
 * Manages business process definitions, versions, and templates
 */
import { eq, and, like, or, desc, sql, not, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from "@common/logger";
import { 
  bpmProcesses, 
  BpmProcess,
  BpmProcessStatus
} from '../schema/bpm.schema';
import { ProcessInstanceService, NewProcessInstance } from './process-instance.service';
import { DrizzleService } from "@common/drizzle/drizzle.service";

/**
 * Process filtering options
 */
export interface ProcessFilter {
  search?: string;
  status?: BpmProcessStatus[];
  isTemplate?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Process creation data
 */
export interface NewBpmProcess {
  name: string;
  description?: string;
  companyId: string;
  steps?: any;
  status?: BpmProcessStatus;
  isTemplate?: boolean;
  createdBy: string;
  updatedBy: string;
  franchiseId?: string | null;
}

/**
 * Process update data
 */
export interface ProcessUpdateData {
  name?: string;
  description?: string;
  steps?: any;
  status?: BpmProcessStatus;
  isTemplate?: boolean;
  version?: string;
  updatedBy: string;
}

/**
 * Process start data
 */
export interface StartProcessDto {
  processId: string;
  companyId: string;
  startedBy: string;
  inputData?: Record<string, any>;
}

/**
 * Process Service
 * 
 * Responsible for managing business process workflows
 */
export class ProcessService {
  private _logger: Logger;
  private _processInstanceService: ProcessInstanceService;

  constructor(private drizzleService: DrizzleService) {
    this._logger = new Logger('ProcessService');
    this._processInstanceService = new ProcessInstanceService(drizzleService);
  }

  /**
   * Create a new process workflow
   */
  async createProcess(data: NewBpmProcess): Promise<BpmProcess> {
    this._logger.info('Creating process', { name: data.name });
    
    try {
      const now = new Date();
      const [process] = await this.drizzleService.query((tx) => 
        tx.insert(bpmProcesses).values({
          id: uuidv4(),
          name: data.name,
          description: data.description || null,
          companyId: data.companyId,
          steps: data.steps || {},
          status: data.status || BpmProcessStatus.DRAFT,
          isTemplate: data.isTemplate !== undefined ? data.isTemplate : false,
          version: '1.0',
          createdAt: now,
          updatedAt: now,
          createdBy: data.createdBy,
          updatedBy: data.updatedBy,
          franchiseId: data.franchiseId || null
        }).returning()
      );
      
      this._logger.info('Created process', { id: process.id, name: process.name });
      return process;
    } catch (error) {
      this._logger.error('Failed to create process', { error, name: data.name });
      throw error;
    }
  }

  /**
   * Get process by ID
   */
  async getProcessById(id: string, companyId?: string): Promise<BpmProcess | null> {
    this._logger.debug('Getting process by ID', { id, companyId });
    
    try {
      const query = this.drizzleService.query((tx) => {
        let baseQuery = tx.select().from(bpmProcesses).where(eq(bpmProcesses.id, id));
        
        // Add company filter if provided
        if (companyId) {
          baseQuery = baseQuery.where(eq(bpmProcesses.companyId, companyId));
        }
        
        return baseQuery;
      });
      
      const results = await query;
      const process = results.length > 0 ? results[0] : null;
      
      if (!process) {
        this._logger.debug('Process not found', { id });
        return null;
      }
      
      return process;
    } catch (error) {
      this._logger.error('Failed to get process by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get processes with filtering and pagination
   */
  async getProcesses(companyId: string, filter: ProcessFilter = {}): Promise<{ data: BpmProcess[], total: number }> {
    this._logger.debug('Getting processes with filter', { companyId, filter });
    
    try {
      // Default pagination
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const offset = (page - 1) * limit;
      
      // Build conditions
      let conditions = and(
        eq(bpmProcesses.companyId, companyId)
      );
      
      // Apply specific filters
      if (filter.status && filter.status.length > 0) {
        conditions = and(conditions, or(...filter.status.map(status => eq(bpmProcesses.status, status))));
      }
      
      if (filter.isTemplate !== undefined) {
        conditions = and(conditions, eq(bpmProcesses.isTemplate, filter.isTemplate));
      }
      
      if (filter.search) {
        conditions = and(conditions, or(
          like(bpmProcesses.name, `%${filter.search}%`),
          like(bpmProcesses.description, `%${filter.search}%`)
        ));
      }
      
      // Get count for pagination
      const countResult = await this.drizzleService.query((tx) =>
        tx.select({
          count: sql<number>`cast(count(*) as int)`
        })
        .from(bpmProcesses)
        .where(conditions)
      );
      
      const count = countResult[0].count;
      
      // Get data with pagination
      const data = await this.drizzleService.query((tx) =>
        tx.select()
        .from(bpmProcesses)
        .where(conditions)
        .orderBy(desc(bpmProcesses.createdAt))
        .limit(limit)
        .offset(offset)
      );
      
      return {
        data,
        total: count
      };
    } catch (error) {
      this._logger.error('Failed to get processes', { error, companyId });
      throw error;
    }
  }

  /**
   * Update a process
   */
  async updateProcess(id: string, data: ProcessUpdateData): Promise<BpmProcess | null> {
    this._logger.info('Updating process', { id });
    
    try {
      // Check if process exists
      const process = await this.getProcessById(id);
      
      if (!process) {
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
      
      if (data.steps !== undefined) {
        updateData.steps = data.steps;
      }
      
      if (data.status !== undefined) {
        updateData.status = data.status;
      }
      
      if (data.isTemplate !== undefined) {
        updateData.isTemplate = data.isTemplate;
      }
      
      if (data.version !== undefined) {
        updateData.version = data.version;
      }
      
      // Update the process
      const result = await this.drizzleService.query((tx) =>
        tx.update(bpmProcesses)
        .set(updateData)
        .where(eq(bpmProcesses.id, id))
        .returning()
      );
      
      const updatedProcess = result[0];
      
      this._logger.info('Updated process', { id });
      return updatedProcess;
    } catch (error) {
      this._logger.error('Failed to update process', { error, id });
      throw error;
    }
  }

  /**
   * Change process status (activate, pause, archive)
   */
  async changeProcessStatus(id: string, status: BpmProcessStatus, userId: string): Promise<BpmProcess | null> {
    this._logger.info('Changing process status', { id, status });
    
    return this.updateProcess(id, {
      status,
      updatedBy: userId
    });
  }

  /**
   * Duplicate a process (create a new version or template)
   */
  async duplicateProcess(id: string, options: { asTemplate?: boolean, newName?: string, userId: string }): Promise<BpmProcess | null> {
    this._logger.info('Duplicating process', { id, asTemplate: options.asTemplate });
    
    try {
      // Get the original process
      const originalProcess = await this.getProcessById(id);
      
      if (!originalProcess) {
        return null;
      }
      
      // Create a name for the duplicate
      const newName = options.newName || 
        (options.asTemplate ? 
          `Template: ${originalProcess.name}` : 
          `${originalProcess.name} (copy)`);
      
      // Create new version number if not making a template
      const newVersion = options.asTemplate ? 
        originalProcess.version : 
        this.incrementVersion(originalProcess.version);
      
      // Create the new process
      const newProcess: NewBpmProcess = {
        name: newName,
        description: originalProcess.description || undefined,
        companyId: originalProcess.companyId,
        steps: originalProcess.steps,
        status: options.asTemplate ? BpmProcessStatus.DRAFT : (originalProcess.status as BpmProcessStatus),
        isTemplate: options.asTemplate !== undefined ? options.asTemplate : originalProcess.isTemplate,
        createdBy: options.userId,
        updatedBy: options.userId,
        franchiseId: originalProcess.franchiseId
      };
      
      const duplicatedProcess = await this.createProcess(newProcess);
      
      this._logger.info('Duplicated process', { 
        originalId: id,
        newId: duplicatedProcess.id,
        asTemplate: options.asTemplate
      });
      
      return duplicatedProcess;
    } catch (error) {
      this._logger.error('Failed to duplicate process', { error, id });
      throw error;
    }
  }

  /**
   * Delete a process
   */
  async deleteProcess(id: string): Promise<boolean> {
    this._logger.info('Deleting process', { id });
    
    try {
      // Check if process exists
      const process = await this.getProcessById(id);
      
      if (!process) {
        return false;
      }
      
      // Delete the process
      await this.drizzleService.query((tx) => 
        tx.delete(bpmProcesses)
          .where(eq(bpmProcesses.id, id))
      );
      
      this._logger.info('Deleted process', { id });
      return true;
    } catch (error) {
      this._logger.error('Failed to delete process', { error, id });
      throw error;
    }
  }

  /**
   * Get process templates for a company
   */
  async getProcessTemplates(companyId: string): Promise<BpmProcess[]> {
    this._logger.debug('Getting process templates', { companyId });
    
    try {
      const templates = await this.drizzleService.query((tx) =>
        tx.select()
          .from(bpmProcesses)
          .where(
            and(
              eq(bpmProcesses.companyId, companyId),
              eq(bpmProcesses.isTemplate, true)
            )
          )
          .orderBy(desc(bpmProcesses.createdAt))
      );
      
      return templates;
    } catch (error) {
      this._logger.error('Failed to get process templates', { error, companyId });
      throw error;
    }
  }

  /**
   * Create a new process from a template
   */
  async createFromTemplate(templateId: string, data: { name: string, companyId: string, userId: string }): Promise<BpmProcess | null> {
    this._logger.info('Creating process from template', { templateId });
    
    try {
      // Get the template
      const template = await this.getProcessById(templateId);
      
      if (!template) {
        return null;
      }
      
      if (!template.isTemplate) {
        throw new Error(`Process with ID ${templateId} is not a template`);
      }
      
      // Create the new process based on template
      const newProcess: NewBpmProcess = {
        name: data.name,
        description: template.description || undefined,
        companyId: data.companyId,
        steps: template.steps,
        status: BpmProcessStatus.DRAFT,
        isTemplate: false,
        createdBy: data.userId,
        updatedBy: data.userId,
        franchiseId: template.franchiseId
      };
      
      const createdProcess = await this.createProcess(newProcess);
      
      this._logger.info('Created process from template', { 
        templateId,
        newId: createdProcess.id
      });
      
      return createdProcess;
    } catch (error) {
      this._logger.error('Failed to create process from template', { error, templateId });
      throw error;
    }
  }

  /**
   * Start a new process instance
   * This is simplified - real implementation would create process instance
   * and execute first step
   */
  async startProcess(data: StartProcessDto): Promise<any> {
    this._logger.info('Starting process', { processId: data.processId });
    
    try {
      // Get the process
      const process = await this.getProcessById(data.processId, data.companyId);
      
      if (!process) {
        throw new Error(`Process with ID ${data.processId} not found`);
      }
      
      if (process.status !== BpmProcessStatus.ACTIVE) {
        throw new Error(`Process with ID ${data.processId} is not active. Status: ${process.status}`);
      }
      
      // Find the first step
      const firstStep = this.getFirstStep(process.steps);
      
      if (!firstStep) {
        throw new Error(`Process with ID ${data.processId} has no steps defined`);
      }
      
      // Create a new process instance
      const instanceData: NewProcessInstance = {
        processId: data.processId,
        companyId: data.companyId,
        status: 'PENDING',
        currentStep: firstStep.id,
        startedBy: data.startedBy,
        inputData: data.inputData,
        variables: {
          processName: process.name,
          firstStep: firstStep.id,
          startTime: new Date().toISOString()
        }
      };
      
      const instance = await this._processInstanceService.createInstance(instanceData);
      
      // Execute the first step
      const updatedInstance = await this._processInstanceService.executeStep(
        instance.id, 
        firstStep.id, 
        { auto: true },
        data.startedBy
      );
      
      this._logger.info('Started process', { 
        processId: data.processId,
        instanceId: instance.id,
        firstStep: firstStep.id
      });
      
      return updatedInstance;
    } catch (error) {
      this._logger.error('Failed to start process', { error, processId: data.processId });
      throw error;
    }
  }

  /**
   * Helper function to find the first step in a process definition
   * In a real implementation, this would be more sophisticated based on process definition
   */
  private getFirstStep(steps: any): { id: string; name: string } | null {
    if (!steps || !steps.nodes || !Array.isArray(steps.nodes) || steps.nodes.length === 0) {
      return null;
    }
    
    // Find a node with no incoming edges, or just take the first node
    const startNodes = steps.nodes.filter((node: any) => 
      node.type === 'startEvent' || node.type === 'start'
    );
    
    if (startNodes.length > 0) {
      return {
        id: startNodes[0].id,
        name: startNodes[0].name || startNodes[0].label || 'Start'
      };
    }
    
    // If no explicit start nodes, just take the first one
    return {
      id: steps.nodes[0].id,
      name: steps.nodes[0].name || steps.nodes[0].label || 'First Step'
    };
  }

  /**
   * Helper function to increment a version string (e.g. 1.0 -> 1.1)
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length < 2) {
      return `${version}.1`;
    }
    
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    
    return `${major}.${minor + 1}`;
  }
}