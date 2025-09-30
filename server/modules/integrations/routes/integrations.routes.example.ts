/**
 * Integrations Routes - Example with Controller Pattern
 * 
 * This file demonstrates how to use the controller-based architecture pattern
 * for the integrations module. It provides examples of how to refactor
 * existing routes to use the new controllers.
 */

import { Router } from 'express';
import { integrationsController } from '../controllers';
import { AuthGuard, JwtAuthMode } from '../../../common/middleware/auth-guard';

const router = Router();

// Base path for integrations routes
const BASE_PATH = '/api/integrations';

// List integrations
router.get(
  BASE_PATH,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => integrationsController.listIntegrations(req, res).catch(next)
);

// Get integration by ID
router.get(
  `${BASE_PATH}/:id`,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => integrationsController.getIntegration(req, res).catch(next)
);

// Get integration by provider
router.get(
  `${BASE_PATH}/provider/:provider`,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => integrationsController.getIntegrationByProvider(req, res).catch(next)
);

// Create integration
router.post(
  BASE_PATH,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => integrationsController.createIntegration(req, res).catch(next)
);

// Update integration
router.put(
  `${BASE_PATH}/:id`,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => integrationsController.updateIntegration(req, res).catch(next)
);

// Update integration status
router.put(
  `${BASE_PATH}/:id/status`,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => integrationsController.updateIntegrationStatus(req, res).catch(next)
);

// Activate integration (NEW ENDPOINT)
router.post(
  `${BASE_PATH}/:id/activate`,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => integrationsController.activateIntegration(req, res).catch(next)
);

// Update last synced timestamp
router.put(
  `${BASE_PATH}/:id/sync`,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => integrationsController.updateLastSyncedAt(req, res).catch(next)
);

// Delete integration
router.delete(
  `${BASE_PATH}/:id`,
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req, res, next) => integrationsController.deleteIntegration(req, res).catch(next)
);

export default router;