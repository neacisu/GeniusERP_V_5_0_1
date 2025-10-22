/**
 * Process Instance Routes
 * 
 * API endpoints for managing BPM process instances (running process executions)
 */

import { Router, Express } from 'express';
import { ProcessInstanceService } from '../services/process-instance.service';
import { ProcessInstanceController } from '../controllers/process-instance.controller';
import { Logger } from "@common/logger";
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

const logger = new Logger('ProcessInstanceRoutes');

/**
 * Register process instance routes with the Express app
 */
export function registerProcessInstanceRoutes(app: Express, processInstanceService: ProcessInstanceService) {
  const router = Router();
  const processInstanceController = new ProcessInstanceController(processInstanceService);

  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

  /**
   * Get all process instances with filtering and pagination
   */
  router.get('/', (req, res) => processInstanceController.listProcessInstances(req, res));

  /**
   * Get a process instance by ID
   */
  router.get('/:id', (req, res) => processInstanceController.getProcessInstanceById(req, res));

  /**
   * Start a new process instance
   */
  router.post('/', (req, res) => processInstanceController.startProcess(req, res));

  /**
   * Cancel a process instance
   */
  router.post('/:id/cancel', (req, res) => processInstanceController.cancelProcessInstance(req, res));

  /**
   * Pause a process instance
   */
  router.post('/:id/pause', (req, res) => processInstanceController.pauseProcessInstance(req, res));

  /**
   * Resume a paused process instance
   */
  router.post('/:id/resume', (req, res) => processInstanceController.resumeProcessInstance(req, res));

  /**
   * Get process instance history/logs
   */
  router.get('/:id/history', (req, res) => processInstanceController.getProcessInstanceHistory(req, res));

  /**
   * Get process instance status details
   */
  router.get('/:id/status', (req, res) => processInstanceController.getProcessInstanceStatus(req, res));

  // Mount router on app
  app.use('/api/bpm/process-instances', router);

  logger.info('Registered BPM process instance routes');
}