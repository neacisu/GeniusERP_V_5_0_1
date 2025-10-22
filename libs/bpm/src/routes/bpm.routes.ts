/**
 * BPM General Routes
 * 
 * API endpoints for general BPM functionality and placeholders for future development
 */

import { Router, Express } from 'express';
import { Logger } from "@common/logger";
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { BpmController } from '../controllers/bpm.controller';

const logger = new Logger('BpmRoutes');

/**
 * Register general BPM routes with the Express app
 */
export function registerBpmRoutes(app: Express) {
  const router = Router();
  const bpmController = new BpmController();

  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  
  /**
   * GET Process placeholder endpoint for BPM functionality
   * Protected with role-based access control requiring the 'bpm_user' role
   */
  router.get('/process-placeholder', (req, res) => 
    bpmController.getProcessPlaceholder(req, res));

  /**
   * POST Process placeholder endpoint for BPM functionality expansion
   * This endpoint serves as a foundation for future business automation logic
   */
  router.post('/process-placeholder', (req, res) => 
    bpmController.postProcessPlaceholder(req, res));

  /**
   * Discover available BPM processes and capabilities
   */
  router.get('/discover', (req, res) => 
    bpmController.discoverProcesses(req, res));

  // Mount router on app
  app.use('/api/bpm', router);

  logger.info('Registered BPM general routes');
}