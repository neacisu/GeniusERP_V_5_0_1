/**
 * Accounting Settings Routes
 * 
 * Routes for managing accounting settings
 * All routes have proper rate limiting applied
 */

import { Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { AccountingSettingsController } from '../controllers/accounting-settings.controller';
import { AccountingSettingsService } from '../services/accounting-settings.service';
import { 
  accountingReadRateLimiter,
  accountingHeavyRateLimiter
} from '../../../../apps/api/src/middlewares/rate-limit.middleware';

// Initialize service and controller
const settingsService = new AccountingSettingsService();
const settingsController = new AccountingSettingsController(settingsService);

/**
 * Setup accounting settings routes
 */
export function setupAccountingSettingsRoutes(): Router {
  const router = Router();

  // Middleware: All routes require authentication and accountant/admin role
  router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
  router.use(AuthGuard.roleGuard(['admin', 'accountant']));

  // GET /api/accounting/settings/:companyId - Get all settings
  router.get('/:companyId', accountingReadRateLimiter, (req, res) => settingsController.getSettings(req as any, res));

  // PUT /api/accounting/settings/:companyId/general - Update general settings
  router.put('/:companyId/general', accountingReadRateLimiter, (req, res) => settingsController.updateGeneralSettings(req as any, res));

  // GET /api/accounting/settings/:companyId/vat - Get VAT settings
  router.get('/:companyId/vat', accountingReadRateLimiter, (req, res) => settingsController.getVatSettings(req as any, res));

  // PUT /api/accounting/settings/:companyId/vat - Update VAT settings
  router.put('/:companyId/vat', accountingReadRateLimiter, (req, res) => settingsController.updateVatSettings(req as any, res));

  // GET /api/accounting/settings/:companyId/account-mappings - Get account mappings
  router.get('/:companyId/account-mappings', accountingReadRateLimiter, (req, res) => settingsController.getAccountMappings(req as any, res));

  // PUT /api/accounting/settings/:companyId/account-mappings/:type - Update account mapping
  router.put('/:companyId/account-mappings/:type', accountingReadRateLimiter, (req, res) => settingsController.updateAccountMapping(req as any, res));

  // POST /api/accounting/settings/:companyId/account-mappings/reset - Reset to default (HEAVY)
  router.post('/:companyId/account-mappings/reset', accountingHeavyRateLimiter, (req, res) => settingsController.resetAccountMappings(req as any, res));

  // GET /api/accounting/settings/:companyId/relationships - Get account relationships
  router.get('/:companyId/relationships', accountingReadRateLimiter, (req, res) => settingsController.getAccountRelationships(req as any, res));

  // POST /api/accounting/settings/:companyId/relationships - Create account relationship
  router.post('/:companyId/relationships', accountingReadRateLimiter, (req, res) => settingsController.createAccountRelationship(req as any, res));

  // PUT /api/accounting/settings/:companyId/relationships/:id - Update account relationship
  router.put('/:companyId/relationships/:id', accountingReadRateLimiter, (req, res) => settingsController.updateAccountRelationship(req as any, res));

  // DELETE /api/accounting/settings/:companyId/relationships/:id - Delete account relationship
  router.delete('/:companyId/relationships/:id', accountingReadRateLimiter, (req, res) => settingsController.deleteAccountRelationship(req as any, res));

  // GET /api/accounting/settings/:companyId/document-counters - Get document counters
  router.get('/:companyId/document-counters', accountingReadRateLimiter, (req, res) => settingsController.getDocumentCounters(req as any, res));

  // POST /api/accounting/settings/:companyId/document-counters - Create new counter series
  router.post('/:companyId/document-counters', accountingReadRateLimiter, (req, res) => settingsController.createDocumentCounterSeries(req as any, res));

  // PUT /api/accounting/settings/:companyId/document-counters/:type - Update counter series
  router.put('/:companyId/document-counters/:type', accountingReadRateLimiter, (req, res) => settingsController.updateDocumentCounterSeries(req as any, res));

  // DELETE /api/accounting/settings/:companyId/document-counters/:counterId - Delete counter series
  router.delete('/:companyId/document-counters/:counterId', accountingReadRateLimiter, (req, res) => settingsController.deleteDocumentCounterSeries(req as any, res));

  // GET /api/accounting/settings/:companyId/fiscal-periods - Get fiscal periods
  router.get('/:companyId/fiscal-periods', accountingReadRateLimiter, (req, res) => settingsController.getFiscalPeriods(req as any, res));

  // GET /api/accounting/settings/:companyId/opening-balances - Get opening balances
  router.get('/:companyId/opening-balances', accountingReadRateLimiter, (req, res) => settingsController.getOpeningBalances(req as any, res));

  // POST /api/accounting/settings/:companyId/opening-balances/import - Import opening balances (HEAVY)
  router.post('/:companyId/opening-balances/import', accountingHeavyRateLimiter, (req, res) => settingsController.importOpeningBalances(req as any, res));

  return router;
}

