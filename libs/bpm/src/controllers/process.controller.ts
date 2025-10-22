/**
 * Process Controller
 * 
 * Handles business process management endpoints
 */

import { Request, Response } from 'express';
import { Logger } from "@common/logger";
import { ProcessService, ProcessFilter } from '../services/process.service';
import { ProcessInstanceService } from '../services/process-instance.service';
import { BpmProcessStatus } from '../schema/bpm.schema';

export class ProcessController {
  private _logger: Logger;
  
  constructor(
    private processService: ProcessService,
    private processInstanceService: ProcessInstanceService
  ) {
    this._logger = new Logger('ProcessController');
  }
  
  /**
   * Create a new process
   */
  async createProcess(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { companyId, userId } = req.user;
      const processData = {
        ...req.body,
        companyId,
        createdBy: userId,
        updatedBy: userId
      };
      
      const process = await this.processService.createProcess(processData);
      
      res.status(201).json(process);
    } catch (error) {
      this._logger.error('Failed to create process', { error });
      res.status(500).json({ error: 'Failed to create process' });
    }
  }
  
  /**
   * Get process by ID
   */
  async getProcessById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { companyId } = req.user;
      
      const process = await this.processService.getProcessById(id, companyId || undefined);
      
      if (!process) {
        res.status(404).json({ error: 'Process not found' });
        return;
      }
      
      res.json(process);
    } catch (error) {
      this._logger.error('Failed to get process by ID', { error });
      res.status(500).json({ error: 'Failed to get process by ID' });
    }
  }
  
  /**
   * Get processes with filtering and pagination
   */
  async getProcesses(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { companyId } = req.user;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }
      const {
        page,
        limit,
        status,
        isTemplate,
        search
      } = req.query;
      
      // Build filter object
      const filter: ProcessFilter = {};
      
      if (page) {
        filter.page = parseInt(page as string, 10);
      }
      
      if (limit) {
        filter.limit = parseInt(limit as string, 10);
      }
      
      if (status) {
        const statusArray = Array.isArray(status) 
          ? (status as string[]).map(s => String(s))
          : [(status as string)];
        filter.status = statusArray as any; // BpmProcessStatus array will be validated by service
      }
      
      if (isTemplate !== undefined) {
        filter.isTemplate = isTemplate === 'true';
      }
      
      if (search) {
        filter.search = search as string;
      }
      
      const result = await this.processService.getProcesses(companyId, filter);
      
      res.json(result);
    } catch (error) {
      this._logger.error('Failed to get processes', { error });
      res.status(500).json({ error: 'Failed to get processes' });
    }
  }
  
  /**
   * Update a process
   */
  async updateProcess(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { userId } = req.user;
      
      const updateData = {
        ...req.body,
        updatedBy: userId
      };
      
      const process = await this.processService.updateProcess(id, updateData);
      
      if (!process) {
        res.status(404).json({ error: 'Process not found' });
        return;
      }
      
      res.json(process);
    } catch (error) {
      this._logger.error('Failed to update process', { error });
      res.status(500).json({ error: 'Failed to update process' });
    }
  }
  
  /**
   * Change process status
   */
  async changeProcessStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { status } = req.body;
      const { userId } = req.user;
      
      if (!Object.values(BpmProcessStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      
      const process = await this.processService.changeProcessStatus(id, status, userId);
      
      if (!process) {
        res.status(404).json({ error: 'Process not found' });
        return;
      }
      
      res.json(process);
    } catch (error) {
      this._logger.error('Failed to change process status', { error });
      res.status(500).json({ error: 'Failed to change process status' });
    }
  }
  
  /**
   * Duplicate a process
   */
  async duplicateProcess(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { asTemplate, newName } = req.body;
      const { userId } = req.user;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      
      const options = {
        asTemplate,
        newName,
        userId
      };
      
      const process = await this.processService.duplicateProcess(id, options);
      
      if (!process) {
        res.status(404).json({ error: 'Process not found' });
        return;
      }
      
      res.status(201).json(process);
    } catch (error) {
      this._logger.error('Failed to duplicate process', { error });
      res.status(500).json({ error: 'Failed to duplicate process' });
    }
  }
  
  /**
   * Delete a process
   */
  async deleteProcess(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const success = await this.processService.deleteProcess(id);
      
      if (!success) {
        res.status(404).json({ error: 'Process not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      this._logger.error('Failed to delete process', { error });
      res.status(500).json({ error: 'Failed to delete process' });
    }
  }
  
  /**
   * Get process templates
   */
  async getProcessTemplates(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { companyId } = req.user;
      
      if (!companyId) {
        res.status(400).json({ error: 'Company ID is required' });
        return;
      }
      
      const templates = await this.processService.getProcessTemplates(companyId);
      
      res.json(templates);
    } catch (error) {
      this._logger.error('Failed to get process templates', { error });
      res.status(500).json({ error: 'Failed to get process templates' });
    }
  }
  
  /**
   * Create from template
   */
  async createFromTemplate(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { templateId } = req.params;
      const { name } = req.body;
      const { companyId, userId } = req.user;
      
      if (!companyId || !userId) {
        res.status(400).json({ error: 'Company ID and User ID are required' });
        return;
      }
      
      const process = await this.processService.createFromTemplate(templateId, {
        name,
        companyId,
        userId
      });
      
      if (!process) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }
      
      res.status(201).json(process);
    } catch (error) {
      this._logger.error('Failed to create from template', { error });
      res.status(500).json({ error: 'Failed to create from template' });
    }
  }
  
  /**
   * Start a process
   */
  async startProcess(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { processId } = req.params;
      const { companyId, userId } = req.user;
      const { inputData } = req.body;
      
      if (!companyId || !userId) {
        res.status(400).json({ error: 'Company ID and User ID are required' });
        return;
      }
      
      const instance = await this.processService.startProcess({
        processId,
        companyId,
        startedBy: userId,
        inputData
      });
      
      res.status(201).json(instance);
    } catch (error) {
      this._logger.error('Failed to start process', { error });
      res.status(500).json({ error: (error as Error)?.message || 'Failed to start process' });
    }
  }
}