/**
 * Onboarding Routes
 * 
 * Routes for onboarding companies with accounting history
 * All heavy operations have rate limiting applied
 */

import { Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { OnboardingController } from '../controllers/onboarding.controller';
import { OnboardingService } from '../services/onboarding.service';
import { 
  accountingHeavyRateLimiter,
  accountingReadRateLimiter
} from '../../../../apps/api/src/middlewares/rate-limit.middleware';

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
    accountingReadRateLimiter,
    (req, res) => onboardingController.startOnboarding(req as any, res)
  );

  // POST /api/accounting/onboarding/import-chart - Import chart of accounts (HEAVY)
  router.post(
    '/import-chart',
    accountingHeavyRateLimiter,
    (req, res) => onboardingController.importChartOfAccounts(req as any, res)
  );

  // POST /api/accounting/onboarding/import-balances - Import opening balances (HEAVY)
  router.post(
    '/import-balances',
    accountingHeavyRateLimiter,
    (req, res) => onboardingController.importOpeningBalances(req as any, res)
  );

  // POST /api/accounting/onboarding/validate - Validate opening balances
  router.post(
    '/validate',
    accountingReadRateLimiter,
    (req, res) => onboardingController.validateOpeningBalances(req as any, res)
  );

  // POST /api/accounting/onboarding/finalize - Finalize onboarding (HEAVY)
  router.post(
    '/finalize',
    accountingHeavyRateLimiter,
    (req, res) => onboardingController.finalizeOnboarding(req as any, res)
  );

  // POST /api/accounting/onboarding/upload-preview - Upload Excel and preview columns (HEAVY)
  router.post(
    '/upload-preview',
    accountingHeavyRateLimiter,
    (req, res) => onboardingController.uploadPreview(req as any, res)
  );

  // POST /api/accounting/onboarding/import-balances-excel - Import from Excel with mapping (HEAVY)
  router.post(
    '/import-balances-excel',
    accountingHeavyRateLimiter,
    (req, res) => onboardingController.importBalancesFromExcel(req as any, res)
  );

  // GET /api/accounting/onboarding/download-template - Download Excel template
  router.get(
    '/download-template',
    accountingReadRateLimiter,
    (req, res) => onboardingController.downloadTemplate(req as any, res)
  );

  // GET /api/accounting/onboarding/status/:companyId - Get onboarding status
  router.get('/status/:companyId', accountingReadRateLimiter, (req, res) => onboardingController.getOnboardingStatus(req as any, res));

  return router;
}

