/**
 * Manual Entries Routes
 * 
 * Endpoint-uri pentru note contabile manuale conform OMFP 2634/2015
 */

import { Router } from 'express';
import { ManualEntriesController } from '../controllers/manual-entries.controller';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { accountingReadRateLimiter, accountingHeavyRateLimiter } from '../../../../apps/api/src/middlewares/rate-limit.middleware';

const router = Router();
const controller = new ManualEntriesController();

// Middleware pentru rol contabil/admin
const requireAccountant = AuthGuard.roleGuard(['accountant', 'admin']);
const requireAccountingRole = AuthGuard.roleGuard(['accountant', 'admin', 'manager']);

/**
 * @route POST /api/accounting/manual-entries
 * @desc Creează o notă contabilă manuală
 * @access Private (accountant, admin)
 * @body {entryDate, documentDate?, description, isStorno?, lines[]}
 */
router.post('/',
  accountingHeavyRateLimiter,
  requireAccountant,
  controller.createManualEntry.bind(controller)
);

/**
 * @route GET /api/accounting/manual-entries
 * @desc Obține lista notelor contabile manuale
 * @access Private (accountant, admin, manager)
 * @query startDate?, endDate?, page?, limit?, includeStorno?
 */
router.get('/',
  accountingReadRateLimiter,
  requireAccountingRole,
  controller.getManualEntries.bind(controller)
);

/**
 * @route GET /api/accounting/manual-entries/:id
 * @desc Obține detaliile unei note contabile
 * @access Private (accountant, admin, manager)
 */
router.get('/:id',
  accountingReadRateLimiter,
  requireAccountingRole,
  controller.getManualEntry.bind(controller)
);

/**
 * @route POST /api/accounting/manual-entries/validate
 * @desc Validează o notă contabilă înainte de salvare (preview)
 * @access Private (accountant, admin)
 * @body {entryDate, documentDate?, description, isStorno?, lines[]}
 */
router.post('/validate',
  accountingReadRateLimiter,
  requireAccountant,
  controller.validateManualEntry.bind(controller)
);

export default router;
