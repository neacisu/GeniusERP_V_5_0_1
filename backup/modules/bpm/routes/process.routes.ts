/**
 * Process Routes
 * 
 * API endpoints for managing BPM process definitions and templates
 */

import { Router, Express, Request, Response } from 'express';
import { z } from 'zod';
import { ProcessService } from '../services/process.service';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../../common/middleware/auth-guard';
import { BpmProcessStatus } from '../../../../shared/schema/bpm.schema';

const logger = new Logger('ProcessRoutes');

const createProcessSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  steps: z.array(z.record(z.any())).default([]),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  isTemplate: z.boolean().optional(),
  version: z.string().optional(),
});

const updateProcessSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  steps: z.array(z.record(z.any())).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  isTemplate: z.boolean().optional(),
  version: z.string().optional(),
});

/**
 * Register process routes with the Express app
 */
export function registerProcessRoutes(app: Express, processService: ProcessService) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(AuthGuard.requireAuth());

  /**
   * Get all processes with filtering and pagination
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const { search, status, isTemplate, page, limit } = req.query;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const filter: any = {
        search: search as string,
        status: status ? [status as string] : undefined,
        isTemplate: isTemplate === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
      };

      const processes = await processService.getProcesses(companyId, filter);
      return res.json(processes);
    } catch (error) {
      logger.error('Error getting processes', { error });
      return res.status(500).json({ error: 'Failed to get processes' });
    }
  });

  /**
   * Get a process by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const process = await processService.getProcessById(id);
      
      if (!process) {
        return res.status(404).json({ error: 'Process not found' });
      }
      
      // Check if user has access to the process
      if (process.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      return res.json(process);
    } catch (error) {
      logger.error('Error getting process', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to get process' });
    }
  });

  /**
   * Create a new process
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const validatedData = createProcessSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      // Convert string status to enum if provided and ensure steps is included
      let processData: any = {
        ...validatedData,
        companyId,
        createdBy: userId,
        updatedBy: userId,
        steps: validatedData.steps || []
      };
      
      if (processData.status) {
        processData.status = processData.status === 'DRAFT' ? BpmProcessStatus.DRAFT :
                             processData.status === 'ACTIVE' ? BpmProcessStatus.ACTIVE :
                             processData.status === 'PAUSED' ? BpmProcessStatus.PAUSED :
                             BpmProcessStatus.ARCHIVED;
      }
      
      const process = await processService.createProcess(processData);

      return res.status(201).json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error creating process', { error });
      return res.status(500).json({ error: 'Failed to create process' });
    }
  });

  /**
   * Update a process
   */
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateProcessSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      // Check if user has access to the process
      const existingProcess = await processService.getProcessById(id);
      if (!existingProcess || existingProcess.companyId !== companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Convert string status to enum if provided
      let updateData: any = {
        ...validatedData,
        updatedBy: userId
      };
      
      if (validatedData.status) {
        updateData.status = validatedData.status === 'DRAFT' ? BpmProcessStatus.DRAFT :
                           validatedData.status === 'ACTIVE' ? BpmProcessStatus.ACTIVE :
                           validatedData.status === 'PAUSED' ? BpmProcessStatus.PAUSED :
                           BpmProcessStatus.ARCHIVED;
      }
      
      const process = await processService.updateProcess(id, updateData);

      if (!process) {
        return res.status(404).json({ error: 'Process not found' });
      }

      return res.json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error updating process', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to update process' });
    }
  });

  /**
   * Delete a process
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      
      // Check if user has access to the process
      const existingProcess = await processService.getProcessById(id);
      if (!existingProcess || existingProcess.companyId !== companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const success = await processService.deleteProcess(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Process not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting process', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to delete process' });
    }
  });

  /**
   * Change process status (activate, pause, archive)
   */
  router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      if (!status || !['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required' });
      }

      const statusEnum = status === 'DRAFT' ? BpmProcessStatus.DRAFT :
                         status === 'ACTIVE' ? BpmProcessStatus.ACTIVE :
                         status === 'PAUSED' ? BpmProcessStatus.PAUSED :
                         BpmProcessStatus.ARCHIVED;

      // Check if user has access to the process
      const existingProcess = await processService.getProcessById(id);
      if (!existingProcess || existingProcess.companyId !== companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const process = await processService.changeProcessStatus(id, statusEnum, userId);
      
      if (!process) {
        return res.status(404).json({ error: 'Process not found' });
      }
      
      return res.json(process);
    } catch (error) {
      logger.error('Error changing process status', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to change process status' });
    }
  });

  /**
   * Duplicate a process (create a new version or template)
   */
  router.post('/:id/duplicate', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { asTemplate, newName } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      // Check if user has access to the process
      const existingProcess = await processService.getProcessById(id);
      if (!existingProcess || existingProcess.companyId !== companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const process = await processService.duplicateProcess(id, {
        asTemplate: Boolean(asTemplate),
        newName,
        userId
      });
      
      if (!process) {
        return res.status(404).json({ error: 'Process not found' });
      }
      
      return res.json(process);
    } catch (error) {
      logger.error('Error duplicating process', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to duplicate process' });
    }
  });

  /**
   * Get all process templates
   */
  router.get('/templates/all', async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const templates = await processService.getProcessTemplates(companyId);
      return res.json(templates);
    } catch (error) {
      logger.error('Error getting process templates', { error });
      return res.status(500).json({ error: 'Failed to get process templates' });
    }
  });

  /**
   * Create a new process from a template
   */
  router.post('/templates/:templateId/create', async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params;
      const { name } = req.body;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      if (!name || typeof name !== 'string' || name.length < 3) {
        return res.status(400).json({ error: 'Valid name is required' });
      }

      const process = await processService.createFromTemplate(templateId, {
        name,
        companyId,
        userId
      });
      
      if (!process) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      return res.status(201).json(process);
    } catch (error) {
      logger.error('Error creating process from template', { error, templateId: req.params.templateId });
      return res.status(500).json({ error: 'Failed to create process from template' });
    }
  });

  // Mount router on app
  app.use('/api/bpm/processes', router);

  logger.info('Registered BPM process routes');
}