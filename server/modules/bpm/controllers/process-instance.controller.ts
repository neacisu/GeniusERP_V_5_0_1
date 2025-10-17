/**
 * Process Instance Controller
 * 
 * Handles business process instance endpoints
 */

import { Request, Response } from 'express';
import { Logger } from '../../../common/logger';
import { ProcessInstanceService, ProcessInstanceFilter } from '../services/process-instance.service';
import { BpmProcessInstanceStatus, ProcessInstance, ProcessInstanceHistory } from '../schema/bpm.schema';

export class ProcessInstanceController {
  private _logger: Logger;
  
  constructor(
    private processInstanceService: ProcessInstanceService
  ) {
    this._logger = new Logger('ProcessInstanceController');
  }
  
  /**
   * Get all process instances with filtering and pagination
   */
  async listProcessInstances(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { companyId } = req.user;
      const {
        page,
        limit,
        processId,
        status,
        startedBy
      } = req.query;
      
      // Build filter object
      const filter: ProcessInstanceFilter = {};
      
      if (page) {
        filter.page = parseInt(page as string, 10);
      }
      
      if (limit) {
        filter.limit = parseInt(limit as string, 10);
      }
      
      if (processId) {
        filter.processId = processId as string;
      }
      
      if (status) {
        filter.status = Array.isArray(status) 
          ? status 
          : [(status as string)];
      }
      
      if (startedBy) {
        filter.startedBy = startedBy as string;
      }
      
      const result = await this.processInstanceService.getInstances(companyId, filter);
      
      res.json(result);
    } catch (error) {
      this._logger.error('Failed to get process instances', { error });
      res.status(500).json({ error: 'Failed to get process instances' });
    }
  }
  
  /**
   * Get a process instance by ID
   */
  async getProcessInstanceById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { companyId } = req.user;
      
      const instance = await this.processInstanceService.getInstanceById(id, companyId);
      
      if (!instance) {
        res.status(404).json({ error: 'Process instance not found' });
        return;
      }
      
      res.json(instance);
    } catch (error) {
      this._logger.error('Failed to get process instance by ID', { error });
      res.status(500).json({ error: 'Failed to get process instance by ID' });
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
      const { processId, _inputData } = req.body;
      const { _companyId, _userId } = req.user;
      
      if (!processId) {
        res.status(400).json({ error: 'Process ID is required' });
        return;
      }
      
      // Start process through ProcessService
      // Note: In the implementation this is already delegated to ProcessService
      // and in our routing we split endpoints into separate /processes/:id/start
      // We'll reuse the logic here for consistency with existing API paths
      res.status(400).json({ 
        error: 'Please use POST /api/bpm/processes/:processId/start to start a process instance'
      });
    } catch (error) {
      this._logger.error('Failed to start process', { error });
      res.status(500).json({ error: 'Failed to start process' });
    }
  }
  
  /**
   * Cancel a process instance
   */
  async cancelProcessInstance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { reason } = req.body;
      const { userId } = req.user;
      
      const instance = await this.processInstanceService.cancelInstance(id, reason, userId);
      
      if (!instance) {
        res.status(404).json({ error: 'Process instance not found' });
        return;
      }
      
      res.json(instance);
    } catch (error) {
      this._logger.error('Failed to cancel process instance', { error });
      res.status(500).json({ error: 'Failed to cancel process instance' });
    }
  }
  
  /**
   * Pause a process instance
   */
  async pauseProcessInstance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { userId } = req.user;
      
      // Get the instance first
      const instance = await this.processInstanceService.getInstanceById(id);
      
      if (!instance) {
        res.status(404).json({ error: 'Process instance not found' });
        return;
      }
      
      // Update to paused status
      const updatedInstance = await this.processInstanceService.updateInstance(
        id, 
        { 
          status: BpmProcessInstanceStatus.PAUSED,
          variables: {
            ...(instance.variables as Record<string, any>),
            pausedAt: new Date().toISOString(),
            pausedBy: userId
          }
        },
        userId
      );
      
      res.json(updatedInstance);
    } catch (error) {
      this._logger.error('Failed to pause process instance', { error });
      res.status(500).json({ error: 'Failed to pause process instance' });
    }
  }
  
  /**
   * Resume a paused process instance
   */
  async resumeProcessInstance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { userId } = req.user;
      
      // Get the instance first
      const instance = await this.processInstanceService.getInstanceById(id);
      
      if (!instance) {
        res.status(404).json({ error: 'Process instance not found' });
        return;
      }
      
      if (instance.status !== BpmProcessInstanceStatus.PAUSED) {
        res.status(400).json({ error: 'Process instance is not paused' });
        return;
      }
      
      // Update to running status
      const updatedInstance = await this.processInstanceService.updateInstance(
        id, 
        { 
          status: BpmProcessInstanceStatus.RUNNING,
          variables: {
            ...(instance.variables as Record<string, any>),
            resumedAt: new Date().toISOString(),
            resumedBy: userId
          }
        },
        userId
      );
      
      res.json(updatedInstance);
    } catch (error) {
      this._logger.error('Failed to resume process instance', { error });
      res.status(500).json({ error: 'Failed to resume process instance' });
    }
  }
  
  /**
   * Get process instance history/logs
   */
  async getProcessInstanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get the instance first to verify access
      const instance = await this.processInstanceService.getInstanceById(id);
      
      if (!instance) {
        res.status(404).json({ error: 'Process instance not found' });
        return;
      }
      
      const history = await this.processInstanceService.getInstanceHistory(id);
      
      res.json(history);
    } catch (error) {
      this._logger.error('Failed to get process instance history', { error });
      res.status(500).json({ error: 'Failed to get process instance history' });
    }
  }
  
  /**
   * Get process instance status details
   */
  async getProcessInstanceStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const { companyId } = req.user;
      
      // Get the instance first to verify access
      const instance = await this.processInstanceService.getInstanceById(id, companyId);
      
      if (!instance) {
        res.status(404).json({ error: 'Process instance not found' });
        return;
      }
      
      // Get history to enrich the status details
      const history = await this.processInstanceService.getInstanceHistory(id);
      
      const statusDetails = {
        id: instance.id,
        processId: instance.processId,
        status: instance.status,
        currentStep: instance.currentStep,
        startedAt: instance.createdAt,
        startedBy: instance.startedBy,
        completedAt: instance.completedAt,
        lastUpdated: instance.updatedAt,
        executionTime: instance.completedAt 
          ? (instance.completedAt.getTime() - instance.createdAt.getTime()) / 1000
          : (new Date().getTime() - instance.createdAt.getTime()) / 1000,
        totalStepsExecuted: history.filter(h => h.action === 'EXECUTE_STEP').length,
        progressPercentage: calculateProgressPercentage(instance, history)
      };
      
      res.json(statusDetails);
    } catch (error) {
      this._logger.error('Failed to get process instance status', { error });
      res.status(500).json({ error: 'Failed to get process instance status' });
    }
  }
}

/**
 * Helper function to calculate progress percentage (simplified)
 * In a real system, this would use the process definition to determine total steps
 */
function calculateProgressPercentage(instance: ProcessInstance, history: ProcessInstanceHistory[]): number {
  // This is a simplified implementation
  // In a real system, we'd need to calculate based on the process definition
  
  // If completed, return 100%
  if (instance.status === BpmProcessInstanceStatus.COMPLETED) {
    return 100;
  }
  
  // If cancelled, count as failed execution
  if (instance.status === BpmProcessInstanceStatus.CANCELLED) {
    return 0;
  }
  
  // Count the steps executed
  const stepsExecuted = history.filter(h => h.action === 'EXECUTE_STEP').length;
  
  // Assume average process has 5 steps (simplified)
  // In a real implementation, would get this from the process definition
  const estimatedTotalSteps = 5;
  
  return Math.min(Math.round((stepsExecuted / estimatedTotalSteps) * 100), 99);
}