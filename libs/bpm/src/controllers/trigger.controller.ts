/**
 * Trigger Controller
 * 
 * This controller handles trigger-related operations and implements the business logic
 * for managing BPM process triggers.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { createModuleLogger } from "@common/logger/loki-logger";
import { TriggerService } from '../services/trigger.service';
import { AuditService, AuditAction } from '@geniuserp/audit';

// Validation schemas
const createTriggerSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  type: z.enum(['WEBHOOK', 'SCHEDULED', 'EVENT', 'MANUAL', 'DATA_CHANGE', 'EXTERNAL_API']),
  processId: z.string().uuid(),
  configuration: z.record(z.string(), z.any()),
  isActive: z.boolean().optional(),
});

const updateTriggerSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['WEBHOOK', 'SCHEDULED', 'EVENT', 'MANUAL', 'DATA_CHANGE', 'EXTERNAL_API']).optional(),
  configuration: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Trigger Controller Class
 */
export class TriggerController {
  private _logger: ReturnType<typeof createModuleLogger>;
  private _triggerService: TriggerService;

  /**
   * Constructor
   */
  constructor(triggerService: TriggerService) {
    this._logger = createModuleLogger('TriggerController');
    this._triggerService = triggerService;
    // AuditService used as static class - no instance needed
  }

  /**
   * Get all triggers with filtering and pagination
   */
  async listTriggers(req: Request, res: Response): Promise<Response> {
    try {
      const companyId = req.user?.companyId;
      const { processId, type, isActive, page, limit, search } = req.query;

      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          error: 'Company ID is required' 
        });
      }

      const filter: any = {
        processId: processId as string,
        type: type as string,
        isActive: isActive === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
        search: search as string,
      };

      const triggers = await this._triggerService.getTriggers(companyId, filter);
      
      return res.status(200).json({
        success: true,
        data: triggers
      });
    } catch (error) {
      this._logger.error('Error getting triggers', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get triggers' 
      });
    }
  }

  /**
   * Get a trigger by ID
   */
  async getTriggerById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          error: 'Company ID is required' 
        });
      }

      const trigger = await this._triggerService.getTriggerById(id, companyId);
      
      if (!trigger) {
        return res.status(404).json({ 
          success: false,
          error: 'Trigger not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        data: trigger
      });
    } catch (error) {
      this._logger.error('Error getting trigger: ' + (error instanceof Error ? error.message : String(error)));
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get trigger' 
      });
    }
  }

  /**
   * Create a new trigger
   */
  async createTrigger(req: Request, res: Response): Promise<Response> {
    try {
      const validatedData = createTriggerSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      const trigger = await this._triggerService.createTrigger({
        ...validatedData,
        companyId,
        createdBy: userId,
        updatedBy: userId
      });

      // Record audit log
      await AuditService.console.log({
        userId,
        companyId,
        action: AuditAction.CREATE,
        entity: 'bpm_trigger',
        entityId: trigger.id,
        details: {
          name: trigger.name,
          type: trigger.type,
          processId: trigger.processId
        }
      });

      return res.status(201).json({
        success: true,
        data: trigger
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation error',
          details: error.issues 
        });
      }
      
      this._logger.error('Error creating trigger', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create trigger' 
      });
    }
  }

  /**
   * Update a trigger
   */
  async updateTrigger(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validatedData = updateTriggerSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      // Get the existing trigger first for audit log and validation
      const existingTrigger = await this._triggerService.getTriggerById(id, companyId);
      
      if (!existingTrigger) {
        return res.status(404).json({ 
          success: false,
          error: 'Trigger not found' 
        });
      }

      const trigger = await this._triggerService.updateTrigger(id, {
        ...validatedData,
        updatedBy: userId
      });

      if (!trigger) {
        return res.status(404).json({ 
          success: false,
          error: 'Trigger not found' 
        });
      }

      // Record audit log
      await AuditService.console.log({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'bpm_trigger',
        entityId: id,
        details: {
          changes: validatedData
        }
      });

      return res.status(200).json({
        success: true,
        data: trigger
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation error',
          details: error.issues 
        });
      }
      
      this._logger.error('Error updating trigger' + ": " + (error instanceof Error ? error.message : String(error)));
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update trigger' 
      });
    }
  }

  /**
   * Delete a trigger
   */
  async deleteTrigger(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      // Get the existing trigger first for audit log
      const existingTrigger = await this._triggerService.getTriggerById(id, companyId);
      
      if (!existingTrigger) {
        return res.status(404).json({ 
          success: false,
          error: 'Trigger not found' 
        });
      }

      const success = await this._triggerService.deleteTrigger(id);
      
      if (!success) {
        return res.status(404).json({ 
          success: false,
          error: 'Trigger not found' 
        });
      }
      
      // Record audit log
      await AuditService.console.log({
        userId,
        companyId,
        action: AuditAction.DELETE,
        entity: 'bpm_trigger',
        entityId: id,
        details: {
          name: existingTrigger.name,
          type: existingTrigger.type
        }
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'Trigger deleted successfully' 
      });
    } catch (error) {
      this._logger.error('Error deleting trigger' + ": " + (error instanceof Error ? error.message : String(error)));
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete trigger' 
      });
    }
  }

  /**
   * Toggle trigger active status
   */
  async toggleTriggerActive(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      if (typeof active !== 'boolean') {
        return res.status(400).json({ 
          success: false,
          error: 'Active status must be a boolean' 
        });
      }

      // Get the existing trigger first for audit log
      const existingTrigger = await this._triggerService.getTriggerById(id, companyId);
      
      if (!existingTrigger) {
        return res.status(404).json({ 
          success: false,
          error: 'Trigger not found' 
        });
      }

      // Update trigger active status using updateTrigger
      const trigger = await this._triggerService.updateTrigger(id, { isActive: active, updatedBy: userId });
      
      if (!trigger) {
        return res.status(404).json({ 
          success: false,
          error: 'Trigger not found' 
        });
      }
      
      // Record audit log
      await AuditService.console.log({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'bpm_trigger',
        entityId: id,
        details: {
          operation: 'toggle_active',
          previousState: existingTrigger.isActive,
          newState: active
        }
      });
      
      return res.status(200).json({
        success: true,
        data: trigger
      });
    } catch (error) {
      this._logger.error('Error toggling trigger status' + ": " + (error instanceof Error ? error.message : String(error)));
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to toggle trigger status' 
      });
    }
  }

  /**
   * Manually execute a trigger
   */
  async executeTrigger(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { inputData } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      // Get the existing trigger first for audit log
      const existingTrigger = await this._triggerService.getTriggerById(id, companyId);
      
      if (!existingTrigger) {
        return res.status(404).json({ 
          success: false,
          error: 'Trigger not found' 
        });
      }

      const result = await this._triggerService.executeTrigger({
        triggerId: id,
        userId,
        inputData: inputData || {}
      });
      
      if (!result.success) {
        return res.status(result.status || 500).json({ 
          success: false,
          error: result.error 
        });
      }
      
      // Record audit log
      await AuditService.console.log({
        userId,
        companyId,
        action: AuditAction.BPM_PROCESS_ACTION,
        entity: 'bpm_trigger',
        entityId: id,
        details: {
          operation: 'execute_trigger',
          processInstanceId: result.processInstanceId,
          triggerType: existingTrigger.type,
          inputData: inputData || {}
        }
      });
      
      return res.status(200).json({ 
        success: true, 
        data: {
          processInstanceId: result.processInstanceId
        }
      });
    } catch (error) {
      this._logger.error('Error executing trigger' + ": " + (error instanceof Error ? error.message : String(error)));
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to execute trigger' 
      });
    }
  }
}