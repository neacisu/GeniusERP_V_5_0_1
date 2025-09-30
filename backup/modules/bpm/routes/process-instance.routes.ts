/**
 * Process Instance Routes
 * 
 * API endpoints for managing BPM process instances (running process executions)
 */

import { Router, Express, Request, Response } from 'express';
import { z } from 'zod';
import { ProcessInstanceService } from '../services/process-instance.service';
import { Logger } from '../../../common/logger';
import { requireAuth } from '../../../common/middleware/auth';

const logger = new Logger('ProcessInstanceRoutes');

const startProcessSchema = z.object({
  processId: z.string().uuid(),
  inputData: z.record(z.any()).optional(),
  startedBy: z.string().uuid().optional(),
});

/**
 * Register process instance routes with the Express app
 */
export function registerProcessInstanceRoutes(app: Express, processInstanceService: ProcessInstanceService) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(requireAuth());

  /**
   * Get all process instances for a company
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const { processId, status, page, limit, search, startDate, endDate } = req.query;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const filter: any = {
        processId: processId as string,
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
        search: search as string,
      };

      const instances = await processInstanceService.getProcessInstances(companyId, filter);
      return res.json(instances);
    } catch (error) {
      logger.error('Error getting process instances', { error });
      return res.status(500).json({ error: 'Failed to get process instances' });
    }
  });

  /**
   * Get a process instance by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const instance = await processInstanceService.getProcessInstanceById(id, companyId);
      
      if (!instance) {
        return res.status(404).json({ error: 'Process instance not found' });
      }
      
      return res.json(instance);
    } catch (error) {
      logger.error('Error getting process instance', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to get process instance' });
    }
  });

  /**
   * Start a new process instance
   */
  router.post('/start', async (req: Request, res: Response) => {
    try {
      const validatedData = startProcessSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const instance = await processInstanceService.startProcess({
        processId: validatedData.processId,
        companyId,
        startedBy: validatedData.startedBy || userId,
        inputData: validatedData.inputData || {}
      });

      return res.status(201).json(instance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error starting process instance', { error });
      return res.status(500).json({ error: 'Failed to start process instance' });
    }
  });

  /**
   * Cancel a process instance
   */
  router.post('/:id/cancel', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const success = await processInstanceService.cancelProcessInstance(id, companyId, userId, reason);
      
      if (!success) {
        return res.status(404).json({ error: 'Process instance not found or cannot be cancelled' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error cancelling process instance', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to cancel process instance' });
    }
  });

  /**
   * Pause a process instance
   */
  router.post('/:id/pause', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const success = await processInstanceService.pauseProcessInstance(id, companyId, userId, reason);
      
      if (!success) {
        return res.status(404).json({ error: 'Process instance not found or cannot be paused' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error pausing process instance', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to pause process instance' });
    }
  });

  /**
   * Resume a paused process instance
   */
  router.post('/:id/resume', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const success = await processInstanceService.resumeProcessInstance(id, companyId, userId);
      
      if (!success) {
        return res.status(404).json({ error: 'Process instance not found or cannot be resumed' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error resuming process instance', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to resume process instance' });
    }
  });

  /**
   * Get process instance history/logs
   */
  router.get('/:id/history', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const history = await processInstanceService.getProcessInstanceHistory(id, companyId);
      
      if (!history) {
        return res.status(404).json({ error: 'Process instance not found' });
      }
      
      return res.json(history);
    } catch (error) {
      logger.error('Error getting process instance history', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to get process instance history' });
    }
  });

  /**
   * Get process instance status details
   */
  router.get('/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const status = await processInstanceService.getProcessInstanceStatus(id, companyId);
      
      if (!status) {
        return res.status(404).json({ error: 'Process instance not found' });
      }
      
      return res.json(status);
    } catch (error) {
      logger.error('Error getting process instance status', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to get process instance status' });
    }
  });

  // Mount router on app
  app.use('/api/bpm/instances', router);

  logger.info('Registered BPM process instance routes');
}