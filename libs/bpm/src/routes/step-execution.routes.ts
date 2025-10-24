/**
 * Step Execution Routes
 * 
 * API endpoints for managing BPM process step executions
 */

import { Router, Express } from 'express';
import { StepExecutionService } from '../services/step-execution.service';
import { StepExecutionController } from '../controllers/step-execution.controller';
import { createModuleLogger } from "@common/logger/loki-logger";
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';

const logger = createModuleLogger('StepExecutionRoutes');

/**
 * Register step execution routes with the Express app
 */
export function registerStepExecutionRoutes(app: Express, stepExecutionService: StepExecutionService) {
  const router = Router();
  const stepExecutionController = new StepExecutionController(stepExecutionService);

  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

  /**
   * Get all step executions for a process instance
   */
  router.get('/instance/:instanceId', (req, res) => 
    stepExecutionController.getStepExecutionsByInstanceId(req, res));

  /**
   * Get a step execution by ID
   */
  router.get('/:id', (req, res) => 
    stepExecutionController.getStepExecutionById(req, res));

  /**
   * Update a step execution (for manual steps or approvals)
   */
  router.patch('/:id', (req, res) => 
    stepExecutionController.updateStepExecution(req, res));

  /**
   * Complete a manual step
   */
  router.post('/:id/complete', (req, res) => 
    stepExecutionController.completeManualStep(req, res));

  /**
   * Fail a step execution
   */
  router.post('/:id/fail', (req, res) => 
    stepExecutionController.failStepExecution(req, res));

  /**
   * Skip a step execution
   */
  router.post('/:id/skip', (req, res) => 
    stepExecutionController.skipStepExecution(req, res));

  // Mount router on app
  app.use('/api/bpm/executions', router);

  logger.info('Registered BPM step execution routes');
}