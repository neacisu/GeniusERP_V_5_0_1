/**
 * Accounting Settings Routes
 * 
 * Routes for managing accounting settings
 */

import { Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { AccountingSettingsController } from '../controllers/accounting-settings.controller';
import { AccountingSettingsService } from '../services/accounting-settings.service';

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
  router.get('/:companyId', (req, res) => settingsController.getSettings(req as any, res));

  // PUT /api/accounting/settings/:companyId/general - Update general settings
  router.put('/:companyId/general', (req, res) => settingsController.updateGeneralSettings(req as any, res));

  // GET /api/accounting/settings/:companyId/vat - Get VAT settings
  router.get('/:companyId/vat', (req, res) => settingsController.getVatSettings(req as any, res));

  // PUT /api/accounting/settings/:companyId/vat - Update VAT settings
  router.put('/:companyId/vat', (req, res) => settingsController.updateVatSettings(req as any, res));

  // GET /api/accounting/settings/:companyId/account-mappings - Get account mappings
  router.get('/:companyId/account-mappings', (req, res) => settingsController.getAccountMappings(req as any, res));

  // PUT /api/accounting/settings/:companyId/account-mappings/:type - Update account mapping
  router.put('/:companyId/account-mappings/:type', (req, res) => settingsController.updateAccountMapping(req as any, res));

  // POST /api/accounting/settings/:companyId/account-mappings/reset - Reset to default
  router.post('/:companyId/account-mappings/reset', (req, res) => settingsController.resetAccountMappings(req as any, res));

  // GET /api/accounting/settings/:companyId/relationships - Get account relationships
  router.get('/:companyId/relationships', (req, res) => settingsController.getAccountRelationships(req as any, res));

  // POST /api/accounting/settings/:companyId/relationships - Create account relationship
  router.post('/:companyId/relationships', (req, res) => settingsController.createAccountRelationship(req as any, res));

  // PUT /api/accounting/settings/:companyId/relationships/:id - Update account relationship
  router.put('/:companyId/relationships/:id', (req, res) => settingsController.updateAccountRelationship(req as any, res));

  // DELETE /api/accounting/settings/:companyId/relationships/:id - Delete account relationship
  router.delete('/:companyId/relationships/:id', (req, res) => settingsController.deleteAccountRelationship(req as any, res));

  // GET /api/accounting/settings/:companyId/document-counters - Get document counters
  router.get('/:companyId/document-counters', (req, res) => settingsController.getDocumentCounters(req as any, res));

  // PUT /api/accounting/settings/:companyId/document-counters/:type - Update counter series
  router.put('/:companyId/document-counters/:type', (req, res) => settingsController.updateDocumentCounterSeries(req as any, res));

  // GET /api/accounting/settings/:companyId/fiscal-periods - Get fiscal periods
  router.get('/:companyId/fiscal-periods', (req, res) => settingsController.getFiscalPeriods(req as any, res));

  // GET /api/accounting/settings/:companyId/opening-balances - Get opening balances
  router.get('/:companyId/opening-balances', (req, res) => settingsController.getOpeningBalances(req as any, res));

  // POST /api/accounting/settings/:companyId/opening-balances/import - Import opening balances
  router.post('/:companyId/opening-balances/import', (req, res) => settingsController.importOpeningBalances(req as any, res));

  return router;
}

