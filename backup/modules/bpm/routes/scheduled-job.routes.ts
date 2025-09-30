/**
 * Scheduled Job Routes
 * 
 * API endpoints for managing scheduled jobs for BPM processes
 */

import { Router, Express, Request, Response } from 'express';
import { z } from 'zod';
import { ScheduledJobService } from '../services/scheduled-job.service';
import { Logger } from '../../../common/logger';
import { requireAuth } from '../../../common/middleware/auth';

const logger = new Logger('ScheduledJobRoutes');

const createJobSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  processId: z.string().uuid(),
  cronExpression: z.string().min(1),
  timezone: z.string().optional(),
  inputData: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

const updateJobSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  cronExpression: z.string().min(1).optional(),
  timezone: z.string().optional(),
  inputData: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Register scheduled job routes with the Express app
 */
export function registerScheduledJobRoutes(app: Express, scheduledJobService: ScheduledJobService) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(requireAuth());

  /**
   * Get all scheduled jobs for a company
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const { processId, isActive, page, limit, search } = req.query;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const filter: any = {
        processId: processId as string,
        isActive: isActive === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
        search: search as string,
      };

      const jobs = await scheduledJobService.getScheduledJobs(companyId, filter);
      return res.json(jobs);
    } catch (error) {
      logger.error('Error getting scheduled jobs', { error });
      return res.status(500).json({ error: 'Failed to get scheduled jobs' });
    }
  });

  /**
   * Get a scheduled job by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const job = await scheduledJobService.getScheduledJobById(id, companyId);
      
      if (!job) {
        return res.status(404).json({ error: 'Scheduled job not found' });
      }
      
      return res.json(job);
    } catch (error) {
      logger.error('Error getting scheduled job', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to get scheduled job' });
    }
  });

  /**
   * Create a new scheduled job
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const validatedData = createJobSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const job = await scheduledJobService.createScheduledJob({
        ...validatedData,
        companyId,
        createdBy: userId,
        updatedBy: userId
      });

      return res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error creating scheduled job', { error });
      return res.status(500).json({ error: 'Failed to create scheduled job' });
    }
  });

  /**
   * Update a scheduled job
   */
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateJobSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const job = await scheduledJobService.updateScheduledJob(id, companyId, {
        ...validatedData,
        updatedBy: userId
      });

      if (!job) {
        return res.status(404).json({ error: 'Scheduled job not found' });
      }

      return res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error updating scheduled job', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to update scheduled job' });
    }
  });

  /**
   * Delete a scheduled job
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const success = await scheduledJobService.deleteScheduledJob(id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Scheduled job not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting scheduled job', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to delete scheduled job' });
    }
  });

  /**
   * Toggle scheduled job active status
   */
  router.patch('/:id/toggle', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { active } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      if (typeof active !== 'boolean') {
        return res.status(400).json({ error: 'Active status must be a boolean' });
      }

      const job = await scheduledJobService.toggleScheduledJobActive(id, companyId, active, userId);
      
      if (!job) {
        return res.status(404).json({ error: 'Scheduled job not found' });
      }
      
      return res.json(job);
    } catch (error) {
      logger.error('Error toggling job status', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to toggle job status' });
    }
  });

  /**
   * Manually run a scheduled job immediately
   */
  router.post('/:id/run', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const result = await scheduledJobService.runScheduledJobManually(id, companyId, userId);
      
      if (!result.success) {
        return res.status(result.status || 500).json({ error: result.error });
      }
      
      return res.json({ success: true, processInstanceId: result.processInstanceId });
    } catch (error) {
      logger.error('Error running job manually', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to run job manually' });
    }
  });

  // Mount router on app
  app.use('/api/bpm/jobs', router);

  logger.info('Registered BPM scheduled job routes');
}