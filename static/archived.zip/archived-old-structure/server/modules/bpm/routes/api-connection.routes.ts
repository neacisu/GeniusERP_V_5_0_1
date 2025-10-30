/**
 * API Connection Routes
 * 
 * API endpoints for managing external API connections for BPM processes
 */

import { Router, Express } from 'express';
import { ApiConnectionService } from '../services/api-connection.service';
import { ApiConnectionController } from '../controllers/api-connection.controller';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

const logger = new Logger('ApiConnectionRoutes');

/**
 * Register API connection routes with the Express app
 */
export function registerApiConnectionRoutes(app: Express, apiConnectionService: ApiConnectionService) {
  const router = Router();
  const apiConnectionController = new ApiConnectionController(apiConnectionService);

  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

  /**
   * Get all API connections for a company
   */
  router.get('/', (req, res) => 
    apiConnectionController.getApiConnections(req, res));

  /**
   * Get an API connection by ID
   */
  router.get('/:id', (req, res) => 
    apiConnectionController.getApiConnectionById(req, res));

  /**
   * Create a new API connection
   */
  router.post('/', (req, res) => 
    apiConnectionController.createApiConnection(req, res));

  /**
   * Update an API connection
   */
  router.patch('/:id', (req, res) => 
    apiConnectionController.updateApiConnection(req, res));

  /**
   * Delete an API connection
   */
  router.delete('/:id', (req, res) => 
    apiConnectionController.deleteApiConnection(req, res));

  /**
   * Test an API connection
   */
  router.post('/:id/test', (req, res) => 
    apiConnectionController.testApiConnection(req, res));

  // Mount router on app
  app.use('/api/bpm/connections', router);

  logger.info('Registered BPM API connection routes');
}