/**
 * API Connection Routes
 * 
 * API endpoints for managing external API connections for BPM processes
 */

import { Router, Express, Request, Response } from 'express';
import { z } from 'zod';
import { ApiConnectionService } from '../services/api-connection.service';
import { Logger } from '../../../common/logger';
import { requireAuth } from '../../../common/middleware/auth';

const logger = new Logger('ApiConnectionRoutes');

const createConnectionSchema = z.object({
  name: z.string().min(3).max(100),
  provider: z.string().min(1),
  connectionType: z.string().min(1),
  baseUrl: z.string().url(),
  authType: z.string().min(1),
  authData: z.record(z.any()),
  headers: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional(),
  isActive: z.boolean().optional(),
});

const updateConnectionSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  provider: z.string().min(1).optional(),
  connectionType: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  authType: z.string().min(1).optional(),
  authData: z.record(z.any()).optional(),
  headers: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Register API connection routes with the Express app
 */
export function registerApiConnectionRoutes(app: Express, apiConnectionService: ApiConnectionService) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(requireAuth());

  /**
   * Get all API connections for a company
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const { provider, isActive, page, limit, search } = req.query;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const filter: any = {
        provider: provider as string,
        isActive: isActive === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
        search: search as string,
      };

      const connections = await apiConnectionService.getApiConnections(companyId, filter);
      return res.json(connections);
    } catch (error) {
      logger.error('Error getting API connections', { error });
      return res.status(500).json({ error: 'Failed to get API connections' });
    }
  });

  /**
   * Get an API connection by ID
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const connection = await apiConnectionService.getApiConnectionById(id, companyId);
      
      if (!connection) {
        return res.status(404).json({ error: 'API connection not found' });
      }
      
      return res.json(connection);
    } catch (error) {
      logger.error('Error getting API connection', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to get API connection' });
    }
  });

  /**
   * Create a new API connection
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const validatedData = createConnectionSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const connection = await apiConnectionService.createApiConnection({
        ...validatedData,
        companyId,
        createdBy: userId,
        updatedBy: userId
      });

      return res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error creating API connection', { error });
      return res.status(500).json({ error: 'Failed to create API connection' });
    }
  });

  /**
   * Update an API connection
   */
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = updateConnectionSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ error: 'User and company information are required' });
      }

      const connection = await apiConnectionService.updateApiConnection(id, companyId, {
        ...validatedData,
        updatedBy: userId
      });

      if (!connection) {
        return res.status(404).json({ error: 'API connection not found' });
      }

      return res.json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      logger.error('Error updating API connection', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to update API connection' });
    }
  });

  /**
   * Delete an API connection
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const success = await apiConnectionService.deleteApiConnection(id, companyId);
      
      if (!success) {
        return res.status(404).json({ error: 'API connection not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting API connection', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to delete API connection' });
    }
  });

  /**
   * Test an API connection
   */
  router.post('/:id/test', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const testResult = await apiConnectionService.testApiConnection(id, companyId);
      return res.json(testResult);
    } catch (error) {
      logger.error('Error testing API connection', { error, id: req.params.id });
      return res.status(500).json({ error: 'Failed to test API connection' });
    }
  });

  // Mount router on app
  app.use('/api/bpm/connections', router);

  logger.info('Registered BPM API connection routes');
}