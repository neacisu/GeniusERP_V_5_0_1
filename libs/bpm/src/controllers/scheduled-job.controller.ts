/**
 * Scheduled Job Controller
 * 
 * This controller handles scheduled job-related operations and implements the business logic
 * for managing BPM process scheduled jobs, including creation, updating, deletion, and manual triggering.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { Logger } from "@common/logger";
import { ScheduledJobService } from '../services/scheduled-job.service';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';

// Validation schemas
const createJobSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional().nullable(),
  schedule: z.string().min(1),
  action: z.string().uuid(),
  configuration: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

const updateJobSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional().nullable(),
  schedule: z.string().min(1).optional(),
  action: z.string().uuid().optional(),
  configuration: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Scheduled Job Controller Class
 */
export class ScheduledJobController {
  private _logger: Logger;
  private _scheduledJobService: ScheduledJobService;

  /**
   * Constructor
   */
  constructor(scheduledJobService: ScheduledJobService) {
    this._logger = new Logger('ScheduledJobController');
    this._scheduledJobService = scheduledJobService;
  }

  /**
   * Get all scheduled jobs for a company
   */
  async getScheduledJobs(req: Request, res: Response): Promise<Response> {
    try {
      const companyId = req.user?.companyId;
      const { processId, isActive, page, limit, search } = req.query;

      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          error: 'Company ID is required' 
        });
      }

      const filter: any = {
        processId: processId as string,
        isActive: isActive === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
        search: search as string,
      };

      const jobs = await this._scheduledJobService.getScheduledJobs(companyId, filter);
      
      return res.status(200).json({
        success: true,
        data: jobs
      });
    } catch (error) {
      this._logger.error('Error getting scheduled jobs', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get scheduled jobs' 
      });
    }
  }

  /**
   * Get a scheduled job by ID
   */
  async getScheduledJobById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          error: 'Company ID is required' 
        });
      }
      
      const job = await this._scheduledJobService.getScheduledJob(id, companyId);
      
      if (!job) {
        return res.status(404).json({ 
          success: false,
          error: 'Scheduled job not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      this._logger.error('Error getting scheduled job', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get scheduled job' 
      });
    }
  }

  /**
   * Create a new scheduled job
   */
  async createScheduledJob(req: Request, res: Response): Promise<Response> {
    try {
      const validatedData = createJobSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      // Convert the user input to the expected format for the service
      const job = await this._scheduledJobService.createScheduledJob({
        name: validatedData.name,
        description: validatedData.description,
        schedule: validatedData.schedule,
        action: validatedData.action,
        configuration: validatedData.configuration || {},
        isActive: validatedData.isActive,
        companyId,
        createdBy: userId,
        updatedBy: userId
      });

      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.CREATE,
        entity: 'bpm_scheduled_job',
        entityId: job.id,
        details: {
          name: job.name,
          action: job.action,
          schedule: job.schedule
        }
      });

      return res.status(201).json({
        success: true,
        data: job
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation error',
          details: error.issues 
        });
      }
      
      this._logger.error('Error creating scheduled job', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create scheduled job' 
      });
    }
  }

  /**
   * Update a scheduled job
   */
  async updateScheduledJob(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validatedData = updateJobSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      // Check if job exists and belongs to the company
      const existingJob = await this._scheduledJobService.getScheduledJob(id, companyId);
      if (!existingJob) {
        return res.status(404).json({ 
          success: false,
          error: 'Scheduled job not found' 
        });
      }

      // Build update data with correct property names
      const updateData: any = { updatedBy: userId };
      
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.description !== undefined) updateData.description = validatedData.description;
      if (validatedData.schedule) updateData.schedule = validatedData.schedule;
      if (validatedData.action) updateData.action = validatedData.action;
      if (validatedData.configuration) updateData.configuration = validatedData.configuration;
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
      
      const job = await this._scheduledJobService.updateScheduledJob(id, companyId, updateData);

      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'bpm_scheduled_job',
        entityId: id,
        details: {
          changes: validatedData
        }
      });

      return res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation error',
          details: error.issues 
        });
      }
      
      this._logger.error('Error updating scheduled job', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update scheduled job' 
      });
    }
  }

  /**
   * Delete a scheduled job
   */
  async deleteScheduledJob(req: Request, res: Response): Promise<Response> {
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
      
      // Check if job exists and belongs to the company
      const existingJob = await this._scheduledJobService.getScheduledJob(id, companyId);
      if (!existingJob) {
        return res.status(404).json({ 
          success: false,
          error: 'Scheduled job not found' 
        });
      }

      const success = await this._scheduledJobService.deleteScheduledJob(id, companyId);
      
      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.DELETE,
        entity: 'bpm_scheduled_job',
        entityId: id,
        details: {
          name: existingJob.name,
          action: existingJob.action
        }
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'Scheduled job deleted successfully' 
      });
    } catch (error) {
      this._logger.error('Error deleting scheduled job', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete scheduled job' 
      });
    }
  }

  /**
   * Toggle scheduled job active status
   */
  async toggleScheduledJobActive(req: Request, res: Response): Promise<Response> {
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

      const job = await this._scheduledJobService.toggleScheduledJobActive(id, companyId, active, userId);
      
      if (!job) {
        return res.status(404).json({ 
          success: false,
          error: 'Scheduled job not found' 
        });
      }
      
      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'bpm_scheduled_job',
        entityId: id,
        details: {
          operation: 'toggle_active',
          active: active
        }
      });
      
      return res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      this._logger.error('Error toggling job status', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to toggle job status' 
      });
    }
  }

  /**
   * Manually run a scheduled job immediately
   */
  async runScheduledJobManually(req: Request, res: Response): Promise<Response> {
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

      const result = await this._scheduledJobService.runScheduledJobManually(id, companyId, userId);
      
      if (!result.success) {
        return res.status(result.status || 500).json({ 
          success: false,
          error: result.error 
        });
      }
      
      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: 'BPM_PROCESS_ACTION',
        entity: 'bpm_scheduled_job',
        entityId: id,
        details: {
          operation: 'run_manually',
          processInstanceId: result.processInstanceId
        }
      });
      
      return res.status(200).json({
        success: true,
        processInstanceId: result.processInstanceId
      });
    } catch (error) {
      this._logger.error('Error running job manually', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to run job manually' 
      });
    }
  }
}