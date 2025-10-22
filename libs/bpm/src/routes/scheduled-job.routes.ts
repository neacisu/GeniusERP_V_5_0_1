/**
 * Scheduled Job Routes
 * 
 * API endpoints for managing scheduled jobs for BPM processes
 */

import { Router, Express } from 'express';
import { ScheduledJobService } from '../services/scheduled-job.service';
import { ScheduledJobController } from '../controllers/scheduled-job.controller';
import { Logger } from "@common/logger";
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

const logger = new Logger('ScheduledJobRoutes');

/**
 * Register scheduled job routes with the Express app
 */
export function registerScheduledJobRoutes(app: Express, scheduledJobService: ScheduledJobService) {
  const router = Router();
  const scheduledJobController = new ScheduledJobController(scheduledJobService);

  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

  /**
   * Get all scheduled jobs for a company
   */
  router.get('/', (req, res) => 
    scheduledJobController.getScheduledJobs(req, res));

  /**
   * Get a scheduled job by ID
   */
  router.get('/:id', (req, res) => 
    scheduledJobController.getScheduledJobById(req, res));

  /**
   * Create a new scheduled job
   */
  router.post('/', (req, res) => 
    scheduledJobController.createScheduledJob(req, res));

  /**
   * Update a scheduled job
   */
  router.patch('/:id', (req, res) => 
    scheduledJobController.updateScheduledJob(req, res));

  /**
   * Delete a scheduled job
   */
  router.delete('/:id', (req, res) => 
    scheduledJobController.deleteScheduledJob(req, res));

  /**
   * Toggle scheduled job active status
   */
  router.patch('/:id/toggle', (req, res) => 
    scheduledJobController.toggleScheduledJobActive(req, res));

  /**
   * Manually run a scheduled job immediately
   */
  router.post('/:id/run', (req, res) => 
    scheduledJobController.runScheduledJobManually(req, res));

  // Mount router on app
  app.use('/api/bpm/jobs', router);

  logger.info('Registered BPM scheduled job routes');
}