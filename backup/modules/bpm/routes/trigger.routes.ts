/**
 * Trigger Routes
 * 
 * API endpoints for managing BPM process triggers
 */

import { Router, Express, Request, Response } from 'express';
import { z } from 'zod';
import { TriggerService } from '../services/trigger.service';
import { Logger } from '../../../common/logger';
import { requireAuth } from '../../../common/middleware/auth';

const logger = new Logger('TriggerRoutes');

const createTriggerSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  type: z.enum(['WEBHOOK', 'SCHEDULED', 'EVENT', 'MANUAL', 'DATA_CHANGE', 'EXTERNAL_API']),
  processId: z.string().uuid(),
  configuration: z.record(z.any()),
  isActive: z.boolean().optional(),
});

const updateTriggerSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['WEBHOOK', 'SCHEDULED', 'EVENT', 'MANUAL', 'DATA_CHANGE', 'EXTERNAL_API']).optional(),
  configuration: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Register trigger routes with the Express app
 */
export function registerTriggerRoutes(app: Express, triggerService: TriggerService) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(requireAuth());

  /**
   * Get all triggers for a company
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const { processId, type, isActive, page, limit, search } = req.query;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const filter: any = {
        processId: processId as string,
        type: type as string,
        isActive: isActive === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
        search: search as string,
      };

      const triggers = await triggerService.getTriggers(companyId, filter);
      return res.json(triggers);
    } catch (error) {
      logger.error('Error getting triggers', { error });
      return res.status(500).json({ error: 'Failed to get triggers' });
    }
  });

  /**
   * Get a trigger by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const trigger = await triggerService.getTriggerById(id, companyId);
      
      if (!trigger) {
        return res.status(404).json({ error: 'Trigger not found' });
      }
      
      return res.json(trigger);
    } catch (error) {
      logger.error('Error getting trigger', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to get trigger' });
    }
  });

  /**
   * Create a new trigger
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const validatedData = createTriggerSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const trigger = await triggerService.createTrigger({
        ...validatedData,
        companyId,
        createdBy: userId,
        updatedBy: userId
      });

      return res.status(201).json(trigger);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error creating trigger', { error });
      return res.status(500).json({ error: 'Failed to create trigger' });
    }
  });

  /**
   * Update a trigger
   */
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateTriggerSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const trigger = await triggerService.updateTrigger(id, companyId, {
        ...validatedData,
        updatedBy: userId
      });

      if (!trigger) {
        return res.status(404).json({ error: 'Trigger not found' });
      }

      return res.json(trigger);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error updating trigger', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to update trigger' });
    }
  });

  /**
   * Delete a trigger
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const success = await triggerService.deleteTrigger(id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Trigger not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting trigger', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to delete trigger' });
    }
  });

  /**
   * Toggle trigger active status
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

      const trigger = await triggerService.toggleTriggerActive(id, companyId, active, userId);
      
      if (!trigger) {
        return res.status(404).json({ error: 'Trigger not found' });
      }
      
      return res.json(trigger);
    } catch (error) {
      logger.error('Error toggling trigger status', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to toggle trigger status' });
    }
  });

  /**
   * Manually execute a trigger
   */
  router.post('/:id/execute', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { inputData } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const result = await triggerService.executeTrigger(id, companyId, userId, inputData || {});
      
      if (!result.success) {
        return res.status(result.status || 500).json({ error: result.error });
      }
      
      return res.json({ success: true, processInstanceId: result.processInstanceId });
    } catch (error) {
      logger.error('Error executing trigger', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to execute trigger' });
    }
  });

  // Mount router on app
  app.use('/api/bpm/triggers', router);

  logger.info('Registered BPM trigger routes');
}