/**
 * Process Routes
 * 
 * API endpoints for managing BPM process definitions and templates
 */

import { Router, Express } from 'express';
import { ProcessService } from '../services/process.service';
import { ProcessInstanceService } from '../services/process-instance.service';
import { ProcessController } from '../controllers/process.controller';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

const logger = new Logger('ProcessRoutes');

/**
 * Register process routes with the Express app
 */
export function registerProcessRoutes(app: Express, processService: ProcessService, processInstanceService: ProcessInstanceService) {
  const router = Router();
  const processController = new ProcessController(processService, processInstanceService);

  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

  /**
   * Get all processes with filtering and pagination
   */
  router.get('/', (req, res) => processController.getProcesses(req, res));

  /**
   * Get a process by ID
   */
  router.get('/:id', (req, res) => processController.getProcessById(req, res));

  /**
   * Create a new process
   */
  router.post('/', (req, res) => processController.createProcess(req, res));

  /**
   * Update a process
   */
  router.patch('/:id', (req, res) => processController.updateProcess(req, res));

  /**
   * Delete a process
   */
  router.delete('/:id', (req, res) => processController.deleteProcess(req, res));

  /**
   * Change process status (activate, pause, archive)
   */
  router.patch('/:id/status', (req, res) => processController.changeProcessStatus(req, res));

  /**
   * Duplicate a process (create a new version or template)
   */
  router.post('/:id/duplicate', (req, res) => processController.duplicateProcess(req, res));

  /**
   * Get all process templates
   */
  router.get('/templates/all', (req, res) => processController.getProcessTemplates(req, res));

  /**
   * Create a new process from a template
   */
  router.post('/templates/:templateId/create', (req, res) => processController.createFromTemplate(req, res));

  /**
   * Start a process instance
   */
  router.post('/:processId/start', (req, res) => processController.startProcess(req, res));

  // Mount router on app
  app.use('/api/bpm/processes', router);

  logger.info('Registered BPM process routes');
}