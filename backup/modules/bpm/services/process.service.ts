/**
 * Process Service
 * 
 * Manages business process definitions, versions, and templates
 */

import { eq, and, desc, sql, ilike, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Logger } from '../../../common/logger';
import { 
  bpmProcesses, 
  BpmProcess, 
  NewBpmProcess, 
  BpmProcessStatus 
} from '../../../../shared/schema/bpm.schema';

const logger = new Logger('ProcessService');

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
 * Process Service
 * 
 * Responsible for managing business process workflows
 */
export class ProcessService {
  constructor(private db: PostgresJsDatabase<any>) {}
  
  /**
   * Create a new process workflow
   */
  async createProcess(data: NewBpmProcess): Promise<BpmProcess> {
    logger.info('Creating new BPM process', { name: data.name, companyId: data.companyId });
    
    try {
      // Ensure steps is a valid JSON object, with empty array as fallback
      const steps = data.steps || [];
      
      const [process] = await this.db
        .insert(bpmProcesses)
        .values({
          ...data,
          id: data.id || uuidv4(),
          status: data.status || BpmProcessStatus.DRAFT,
          isTemplate: data.isTemplate || false,
          steps: steps,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      logger.info('Created BPM process successfully', { id: process.id, name: process.name });
      return process;
    } catch (error) {
      logger.error('Failed to create BPM process', { error, name: data.name });
      throw error;
    }
  }
  
  /**
   * Get process by ID
   */
  async getProcessById(id: string): Promise<BpmProcess | null> {
    logger.debug('Getting BPM process by ID', { id });
    
    try {
      const [process] = await this.db
        .select()
        .from(bpmProcesses)
        .where(eq(bpmProcesses.id, id))
        .limit(1);
      
      if (!process) {
        logger.debug('BPM process not found', { id });
        return null;
      }
      
      return process;
    } catch (error) {
      logger.error('Failed to get BPM process by ID', { error, id });
      throw error;
    }
  }
  
  /**
   * Get processes with filtering and pagination
   */
  async getProcesses(companyId: string, filter: ProcessFilter = {}): Promise<{ data: BpmProcess[], total: number }> {
    logger.debug('Getting BPM processes', { companyId, filter });
    
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 25;
      const offset = (page - 1) * limit;
      
      // Base query conditions
      let conditions = [eq(bpmProcesses.companyId, companyId)];
      
      // Apply filters
      if (filter.search) {
        conditions.push(ilike(bpmProcesses.name, `%${filter.search}%`));
      }
      
      if (filter.status && filter.status.length > 0) {
        conditions.push(inArray(bpmProcesses.status, filter.status));
      }
      
      if (filter.isTemplate !== undefined) {
        conditions.push(eq(bpmProcesses.isTemplate, filter.isTemplate));
      }
      
      // Count total before pagination
      const [countResult] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(bpmProcesses)
        .where(and(...conditions));
      
      // Get data with pagination
      const data = await this.db
        .select()
        .from(bpmProcesses)
        .where(and(...conditions))
        .orderBy(desc(bpmProcesses.updatedAt))
        .limit(limit)
        .offset(offset);
      
      return {
        data,
        total: Number(countResult.count) || 0
      };
    } catch (error) {
      logger.error('Failed to get BPM processes', { error, companyId });
      throw error;
    }
  }
  
  /**
   * Update a process
   */
  async updateProcess(id: string, data: ProcessUpdateData): Promise<BpmProcess | null> {
    logger.info('Updating BPM process', { id });
    
    try {
      // Create update object, ensuring steps is handled correctly
      const updateData: any = {
        ...data,
        updatedAt: new Date()
      };
      
      // If steps is explicitly provided, use it (even if it's an empty array)
      if ('steps' in data) {
        updateData.steps = data.steps;
      }
      
      const [updatedProcess] = await this.db
        .update(bpmProcesses)
        .set(updateData)
        .where(eq(bpmProcesses.id, id))
        .returning();
      
      if (!updatedProcess) {
        logger.warn('No BPM process found to update', { id });
        return null;
      }
      
      logger.info('Updated BPM process successfully', { id });
      return updatedProcess;
    } catch (error) {
      logger.error('Failed to update BPM process', { error, id });
      throw error;
    }
  }
  
  /**
   * Change process status (activate, pause, archive)
   */
  async changeProcessStatus(id: string, status: BpmProcessStatus, userId: string): Promise<BpmProcess | null> {
    logger.info('Changing BPM process status', { id, status });
    
    try {
      const [updatedProcess] = await this.db
        .update(bpmProcesses)
        .set({
          status,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(eq(bpmProcesses.id, id))
        .returning();
      
      if (!updatedProcess) {
        logger.warn('No BPM process found to update status', { id });
        return null;
      }
      
      logger.info('Changed BPM process status successfully', { id, status });
      return updatedProcess;
    } catch (error) {
      logger.error('Failed to change BPM process status', { error, id, status });
      throw error;
    }
  }
  
  /**
   * Duplicate a process (create a new version or template)
   */
  async duplicateProcess(id: string, options: { asTemplate?: boolean, newName?: string, userId: string }): Promise<BpmProcess | null> {
    logger.info('Duplicating BPM process', { id, options });
    
    try {
      const sourceProcess = await this.getProcessById(id);
      
      if (!sourceProcess) {
        logger.warn('Source BPM process not found for duplication', { id });
        return null;
      }
      
      const newProcess = await this.createProcess({
        companyId: sourceProcess.companyId,
        franchiseId: sourceProcess.franchiseId,
        name: options.newName || `Copy of ${sourceProcess.name}`,
        description: sourceProcess.description,
        steps: sourceProcess.steps,
        status: BpmProcessStatus.DRAFT,
        isTemplate: options.asTemplate || false,
        version: sourceProcess.version,
        createdBy: options.userId,
        updatedBy: options.userId
      });
      
      logger.info('Duplicated BPM process successfully', { 
        sourceId: id, 
        newId: newProcess.id, 
        asTemplate: options.asTemplate 
      });
      
      return newProcess;
    } catch (error) {
      logger.error('Failed to duplicate BPM process', { error, id });
      throw error;
    }
  }
  
  /**
   * Delete a process
   */
  async deleteProcess(id: string): Promise<boolean> {
    logger.info('Deleting BPM process', { id });
    
    try {
      const result = await this.db
        .delete(bpmProcesses)
        .where(eq(bpmProcesses.id, id))
        .returning({ id: bpmProcesses.id });
      
      if (result.length === 0) {
        logger.warn('No BPM process found to delete', { id });
        return false;
      }
      
      logger.info('Deleted BPM process successfully', { id });
      return true;
    } catch (error) {
      logger.error('Failed to delete BPM process', { error, id });
      throw error;
    }
  }
  
  /**
   * Get process templates for a company
   */
  async getProcessTemplates(companyId: string): Promise<BpmProcess[]> {
    logger.debug('Getting BPM process templates', { companyId });
    
    try {
      const templates = await this.db
        .select()
        .from(bpmProcesses)
        .where(
          and(
            eq(bpmProcesses.companyId, companyId),
            eq(bpmProcesses.isTemplate, true)
          )
        )
        .orderBy(desc(bpmProcesses.updatedAt));
      
      return templates;
    } catch (error) {
      logger.error('Failed to get BPM process templates', { error, companyId });
      throw error;
    }
  }
  
  /**
   * Create a new process from a template
   */
  async createFromTemplate(templateId: string, data: { name: string, companyId: string, userId: string }): Promise<BpmProcess | null> {
    logger.info('Creating BPM process from template', { templateId, ...data });
    
    try {
      const template = await this.getProcessById(templateId);
      
      if (!template) {
        logger.warn('Template BPM process not found', { templateId });
        return null;
      }
      
      const newProcess = await this.createProcess({
        companyId: data.companyId,
        franchiseId: template.franchiseId,
        name: data.name,
        description: template.description,
        steps: template.steps,
        status: BpmProcessStatus.DRAFT,
        isTemplate: false,
        version: '1.0.0',
        createdBy: data.userId,
        updatedBy: data.userId
      });
      
      logger.info('Created BPM process from template successfully', { 
        templateId, 
        newId: newProcess.id 
      });
      
      return newProcess;
    } catch (error) {
      logger.error('Failed to create BPM process from template', { error, templateId });
      throw error;
    }
  }
}