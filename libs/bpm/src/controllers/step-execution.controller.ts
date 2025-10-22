/**
 * Step Execution Controller
 * 
 * This controller handles step execution-related operations and implements the business logic
 * for managing BPM process step executions, including manual steps, approvals, and error handling.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { Logger } from "@common/logger";
import { StepExecutionService } from '../services/step-execution.service';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
import { BpmStepExecutionStatus } from '../schema/bpm.schema';

// Validation schemas
const updateExecutionSchema = z.object({
  status: z.nativeEnum(BpmStepExecutionStatus).optional(),
  outputData: z.record(z.string(), z.any()).optional(),
  errorData: z.record(z.string(), z.any()).optional(),
});

/**
 * Step Execution Controller Class
 */
export class StepExecutionController {
  private _logger: Logger;
  private _stepExecutionService: StepExecutionService;

  /**
   * Constructor
   */
  constructor(stepExecutionService: StepExecutionService) {
    this._logger = new Logger('StepExecutionController');
    this._stepExecutionService = stepExecutionService;
  }

  /**
   * Get all step executions for a process instance
   */
  async getStepExecutionsByInstanceId(req: Request, res: Response): Promise<Response> {
    try {
      const { instanceId } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          error: 'Company ID is required' 
        });
      }

      const executions = await this._stepExecutionService.getStepExecutionsByInstanceId(instanceId, companyId);
      
      return res.status(200).json({
        success: true,
        data: executions
      });
    } catch (error) {
      this._logger.error('Error getting step executions', { 
        error: error instanceof Error ? error.message : String(error), 
        instanceId: req.params.instanceId 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get step executions' 
      });
    }
  }

  /**
   * Get a step execution by ID
   */
  async getStepExecutionById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          error: 'Company ID is required' 
        });
      }
      
      const execution = await this._stepExecutionService.getStepExecution(id, companyId);
      
      if (!execution) {
        return res.status(404).json({ 
          success: false,
          error: 'Step execution not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        data: execution
      });
    } catch (error) {
      this._logger.error('Error getting step execution', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get step execution' 
      });
    }
  }

  /**
   * Update a step execution (for manual steps or approvals)
   */
  async updateStepExecution(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validatedData = updateExecutionSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      const execution = await this._stepExecutionService.updateStepExecution(id, companyId, {
        ...validatedData,
        executedBy: userId
      });

      if (!execution) {
        return res.status(404).json({ 
          success: false,
          error: 'Step execution not found' 
        });
      }

      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'bpm_step_execution',
        entityId: id,
        details: {
          changes: validatedData,
          stepId: execution.stepId,
          instanceId: execution.instanceId
        }
      });

      return res.status(200).json({
        success: true,
        data: execution
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation error',
          details: error.issues 
        });
      }
      
      this._logger.error('Error updating step execution', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update step execution' 
      });
    }
  }

  /**
   * Complete a manual step
   */
  async completeManualStep(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { outputData } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      const execution = await this._stepExecutionService.completeStepExecution(id, companyId, userId, outputData);
      
      if (!execution) {
        return res.status(404).json({ 
          success: false,
          error: 'Step execution not found' 
        });
      }
      
      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.BPM_PROCESS_ACTION,
        entity: 'bpm_step_execution',
        entityId: id,
        details: {
          operation: 'complete_manual_step',
          stepId: execution.stepId,
          instanceId: execution.instanceId
        }
      });
      
      return res.status(200).json({
        success: true,
        data: execution
      });
    } catch (error) {
      this._logger.error('Error completing manual step', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to complete manual step' 
      });
    }
  }

  /**
   * Fail a step execution
   */
  async failStepExecution(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { errorData, reason } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      const execution = await this._stepExecutionService.failStepExecution(id, companyId, userId, errorData, reason);
      
      if (!execution) {
        return res.status(404).json({ 
          success: false,
          error: 'Step execution not found' 
        });
      }
      
      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.BPM_PROCESS_ACTION,
        entity: 'bpm_step_execution',
        entityId: id,
        details: {
          operation: 'fail_step',
          reason,
          stepId: execution.stepId,
          instanceId: execution.instanceId
        }
      });
      
      return res.status(200).json({
        success: true,
        data: execution
      });
    } catch (error) {
      this._logger.error('Error failing step execution', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fail step execution' 
      });
    }
  }

  /**
   * Skip a step execution
   */
  async skipStepExecution(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      const execution = await this._stepExecutionService.skipStepExecution(id, companyId, userId, reason);
      
      if (!execution) {
        return res.status(404).json({ 
          success: false,
          error: 'Step execution not found' 
        });
      }
      
      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.BPM_PROCESS_ACTION,
        entity: 'bpm_step_execution',
        entityId: id,
        details: {
          operation: 'skip_step',
          reason,
          stepId: execution.stepId,
          instanceId: execution.instanceId
        }
      });
      
      return res.status(200).json({
        success: true,
        data: execution
      });
    } catch (error) {
      this._logger.error('Error skipping step execution', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to skip step execution' 
      });
    }
  }
}