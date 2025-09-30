/**
 * Step Execution Routes
 * 
 * API endpoints for managing BPM process step executions
 */

import { Router, Express, Request, Response } from 'express';
import { z } from 'zod';
import { StepExecutionService } from '../services/step-execution.service';
import { Logger } from '../../../common/logger';
import { requireAuth } from '../../../common/middleware/auth';

const logger = new Logger('StepExecutionRoutes');

const updateExecutionSchema = z.object({
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED']).optional(),
  outputData: z.record(z.any()).optional(),
  errorData: z.record(z.any()).optional(),
});

/**
 * Register step execution routes with the Express app
 */
export function registerStepExecutionRoutes(app: Express, stepExecutionService: StepExecutionService) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(requireAuth());

  /**
   * Get all step executions for a process instance
   */
  router.get('/instance/:instanceId', async (req: Request, res: Response) => {
    try {
      const { instanceId } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const executions = await stepExecutionService.getStepExecutionsByInstanceId(instanceId, companyId);
      return res.json(executions);
    } catch (error) {
      logger.error('Error getting step executions', { error, instanceId: req.params.instanceId });
      return res.status(500).json({ error: 'Failed to get step executions' });
    }
  });

  /**
   * Get a step execution by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const execution = await stepExecutionService.getStepExecutionById(id, companyId);
      
      if (!execution) {
        return res.status(404).json({ error: 'Step execution not found' });
      }
      
      return res.json(execution);
    } catch (error) {
      logger.error('Error getting step execution', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to get step execution' });
    }
  });

  /**
   * Update a step execution (for manual steps or approvals)
   */
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateExecutionSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const execution = await stepExecutionService.updateStepExecution(id, companyId, {
        ...validatedData,
        executedBy: userId
      });

      if (!execution) {
        return res.status(404).json({ error: 'Step execution not found' });
      }

      return res.json(execution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error updating step execution', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to update step execution' });
    }
  });

  /**
   * Complete a manual step
   */
  router.post('/:id/complete', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { outputData } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const execution = await stepExecutionService.completeManualStep(id, companyId, userId, outputData);
      
      if (!execution) {
        return res.status(404).json({ error: 'Step execution not found' });
      }
      
      return res.json(execution);
    } catch (error) {
      logger.error('Error completing manual step', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to complete manual step' });
    }
  });

  /**
   * Fail a step execution
   */
  router.post('/:id/fail', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { errorData, reason } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const execution = await stepExecutionService.failStepExecution(id, companyId, userId, errorData, reason);
      
      if (!execution) {
        return res.status(404).json({ error: 'Step execution not found' });
      }
      
      return res.json(execution);
    } catch (error) {
      logger.error('Error failing step execution', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to fail step execution' });
    }
  });

  /**
   * Skip a step execution
   */
  router.post('/:id/skip', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const execution = await stepExecutionService.skipStepExecution(id, companyId, userId, reason);
      
      if (!execution) {
        return res.status(404).json({ error: 'Step execution not found' });
      }
      
      return res.json(execution);
    } catch (error) {
      logger.error('Error skipping step execution', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to skip step execution' });
    }
  });

  // Mount router on app
  app.use('/api/bpm/executions', router);

  logger.info('Registered BPM step execution routes');
}