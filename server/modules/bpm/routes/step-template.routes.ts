import express from 'express';
import { StepTemplateController } from '../controllers/step-template.controller.js';
import { StepTemplateService } from '../services/step-template.service.js';
import { AuditService } from '../../audit/services/audit.service.js';
import { AuthGuard } from '../../../common/middleware/auth-guard.js';

/**
 * Initialize step template routes
 * 
 * @param app Express application
 * @param db Database connection
 * @returns Express router
 */
export const initStepTemplateRoutes = (app: any, db: any) => {
  const router = express.Router();
  const stepTemplateService = new StepTemplateService(db);
  const auditService = new AuditService(db);
  const stepTemplateController = new StepTemplateController(stepTemplateService, auditService);

  // Apply authentication middleware to all routes
  router.use(AuthGuard.requireAuth());

  // Get all step templates for a company
  router.get('/', (req, res) => stepTemplateController.getStepTemplates(req, res));

  // Get step templates by type
  router.get('/by-type/:type', (req, res) => stepTemplateController.getStepTemplatesByType(req, res));

  // Get step templates by target type
  router.get('/by-target-type/:targetType', (req, res) => stepTemplateController.getStepTemplatesByTargetType(req, res));
  
  // Get a step template by ID
  router.get('/:id', (req, res) => stepTemplateController.getStepTemplateById(req, res));

  // Create a new step template
  router.post('/', (req, res) => stepTemplateController.createStepTemplate(req, res));

  // Update a step template
  router.put('/:id', (req, res) => stepTemplateController.updateStepTemplate(req, res));

  // Delete a step template
  router.delete('/:id', (req, res) => stepTemplateController.deleteStepTemplate(req, res));

  // Toggle global status of a step template
  router.patch('/:id/toggle-global', (req, res) => stepTemplateController.toggleGlobalTemplate(req, res));

  return router;
};