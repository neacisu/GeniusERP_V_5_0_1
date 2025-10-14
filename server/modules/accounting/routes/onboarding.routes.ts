/**
 * Onboarding Routes
 * 
 * Routes for onboarding companies with accounting history
 */

import { Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { OnboardingController } from '../controllers/onboarding.controller';
import { OnboardingService } from '../services/onboarding.service';

// Initialize service and controller
const onboardingService = new OnboardingService();
const onboardingController = new OnboardingController(onboardingService);

/**
 * Setup onboarding routes
 */
export function setupOnboardingRoutes(): Router {
  const router = Router();

  // Middleware: All routes require authentication and accountant/admin role
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  router.use(AuthGuard.roleGuard(['admin', 'accountant']));

  // POST /api/accounting/onboarding/start - Start onboarding
  router.post(
    '/start',
    (req, res) => onboardingController.startOnboarding(req as any, res)
  );

  // POST /api/accounting/onboarding/import-chart - Import chart of accounts
  router.post(
    '/import-chart',
    (req, res) => onboardingController.importChartOfAccounts(req as any, res)
  );

  // POST /api/accounting/onboarding/import-balances - Import opening balances
  router.post(
    '/import-balances',
    (req, res) => onboardingController.importOpeningBalances(req as any, res)
  );

  // POST /api/accounting/onboarding/validate - Validate opening balances
  router.post(
    '/validate',
    (req, res) => onboardingController.validateOpeningBalances(req as any, res)
  );

  // POST /api/accounting/onboarding/finalize - Finalize onboarding
  router.post(
    '/finalize',
    (req, res) => onboardingController.finalizeOnboarding(req as any, res)
  );

  // GET /api/accounting/onboarding/status/:companyId - Get onboarding status
  router.get('/status/:companyId', (req, res) => onboardingController.getOnboardingStatus(req as any, res));

  return router;
}

