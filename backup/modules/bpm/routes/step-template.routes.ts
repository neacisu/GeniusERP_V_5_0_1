/**
 * Step Template Routes
 * 
 * API endpoints for managing reusable BPM process step templates
 */

import { Router, Express, Request, Response } from 'express';
import { z } from 'zod';
import { StepTemplateService } from '../services/step-template.service';
import { Logger } from '../../../common/logger';
import { requireAuth } from '../../../common/middleware/auth';

const logger = new Logger('StepTemplateRoutes');

const createTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  type: z.enum(['ACTION', 'DECISION', 'DELAY', 'NOTIFICATION', 'APPROVAL', 'SUBPROCESS', 'API_CALL', 'DOCUMENT_GENERATION']),
  configuration: z.record(z.any()),
  targetType: z.enum(['INVOICING', 'INVENTORY', 'CRM', 'LOGISTICS', 'ACCOUNTING', 'DOCUMENTS', 'COMMUNICATIONS', 'MARKETING', 'EXTERNAL_API']).optional(),
  isGlobal: z.boolean().optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['ACTION', 'DECISION', 'DELAY', 'NOTIFICATION', 'APPROVAL', 'SUBPROCESS', 'API_CALL', 'DOCUMENT_GENERATION']).optional(),
  configuration: z.record(z.any()).optional(),
  targetType: z.enum(['INVOICING', 'INVENTORY', 'CRM', 'LOGISTICS', 'ACCOUNTING', 'DOCUMENTS', 'COMMUNICATIONS', 'MARKETING', 'EXTERNAL_API']).optional(),
  isGlobal: z.boolean().optional(),
});

/**
 * Register step template routes with the Express app
 */
export function registerStepTemplateRoutes(app: Express, stepTemplateService: StepTemplateService) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(requireAuth());

  /**
   * Get all step templates for a company with filtering
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const { type, targetType, isGlobal, page, limit, search } = req.query;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const filter: any = {
        type: type as string,
        targetType: targetType as string,
        isGlobal: isGlobal === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
        search: search as string,
      };

      const templates = await stepTemplateService.getStepTemplates(companyId, filter);
      return res.json(templates);
    } catch (error) {
      logger.error('Error getting step templates', { error });
      return res.status(500).json({ error: 'Failed to get step templates' });
    }
  });

  /**
   * Get a step template by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const template = await stepTemplateService.getStepTemplateById(id, companyId);
      
      if (!template) {
        return res.status(404).json({ error: 'Step template not found' });
      }
      
      return res.json(template);
    } catch (error) {
      logger.error('Error getting step template', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to get step template' });
    }
  });

  /**
   * Create a new step template
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const validatedData = createTemplateSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const template = await stepTemplateService.createStepTemplate({
        ...validatedData,
        companyId,
        createdBy: userId,
        updatedBy: userId
      });

      return res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error creating step template', { error });
      return res.status(500).json({ error: 'Failed to create step template' });
    }
  });

  /**
   * Update a step template
   */
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateTemplateSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const template = await stepTemplateService.updateStepTemplate(id, companyId, {
        ...validatedData,
        updatedBy: userId
      });

      if (!template) {
        return res.status(404).json({ error: 'Step template not found' });
      }

      return res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error updating step template', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to update step template' });
    }
  });

  /**
   * Delete a step template
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const success = await stepTemplateService.deleteStepTemplate(id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'Step template not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting step template', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to delete step template' });
    }
  });

  // Mount router on app
  app.use('/api/bpm/templates', router);

  logger.info('Registered BPM step template routes');
}