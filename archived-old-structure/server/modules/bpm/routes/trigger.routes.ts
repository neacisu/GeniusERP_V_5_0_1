/**
 * Trigger Routes
 * 
 * API endpoints for managing BPM process triggers
 */

import { Router, Express } from 'express';
import { TriggerService } from '../services/trigger.service';
import { TriggerController } from '../controllers/trigger.controller';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

const logger = new Logger('TriggerRoutes');

/**
 * Register trigger routes with the Express app
 */
export function registerTriggerRoutes(app: Express, triggerService: TriggerService) {
  const router = Router();
  const triggerController = new TriggerController(triggerService);

  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

  /**
   * Get all triggers for a company
   */
  router.get('/', (req, res) => triggerController.listTriggers(req, res));

  /**
   * Get a trigger by ID
   */
  router.get('/:id', (req, res) => triggerController.getTriggerById(req, res));

  /**
   * Create a new trigger
   */
  router.post('/', (req, res) => triggerController.createTrigger(req, res));

  /**
   * Update a trigger
   */
  router.patch('/:id', (req, res) => triggerController.updateTrigger(req, res));

  /**
   * Delete a trigger
   */
  router.delete('/:id', (req, res) => triggerController.deleteTrigger(req, res));

  /**
   * Toggle trigger active status
   */
  router.patch('/:id/toggle', (req, res) => triggerController.toggleTriggerActive(req, res));

  /**
   * Manually execute a trigger
   */
  router.post('/:id/execute', (req, res) => triggerController.executeTrigger(req, res));

  // Mount router on app
  app.use('/api/bpm/triggers', router);

  logger.info('Registered BPM trigger routes');
}