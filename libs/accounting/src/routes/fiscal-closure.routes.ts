/**
 * Fiscal Closure Routes
 * 
 * Rute API pentru închiderea fiscală lunară și anuală
 */

import { Router } from 'express';
import fiscalClosureController from '../controllers/fiscal-closure.controller';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { 
  fiscalClosureRateLimiter,
  accountingReadRateLimiter
} from '../../../../apps/api/src/middlewares/rate-limit.middleware';

const router = Router();

// Toate rutele necesită autentificare și rol de admin sau contabil
const requireAccountant = AuthGuard.roleGuard(['admin', 'administrator', 'accountant', 'contabil']);

/**
 * @route POST /api/accounting/fiscal-closure/reopen/:periodId
 * @desc Redeschide o perioadă închisă
 * @access Private (Admin only)
 */
router.post(
  '/reopen/:periodId',
  fiscalClosureRateLimiter,
  AuthGuard.roleGuard(['admin', 'administrator']),
  fiscalClosureController.reopenPeriod.bind(fiscalClosureController)
);

/**
 * @route GET /api/accounting/fiscal-closure/periods
 * @desc Obține toate perioadele fiscale
 * @access Private (Admin, Accountant)
 */
router.get(
  '/periods',
  accountingReadRateLimiter,
  requireAccountant,
  fiscalClosureController.getPeriods.bind(fiscalClosureController)
);

/**
 * @route GET /api/accounting/fiscal-closure/period/:periodId
 * @desc Obține detalii despre o perioadă
 * @access Private (Admin, Accountant)
 */
router.get(
  '/period/:periodId',
  accountingReadRateLimiter,
  requireAccountant,
  fiscalClosureController.getPeriod.bind(fiscalClosureController)
);

/**
 * @route POST /api/accounting/fiscal-closure/generate-periods
 * @desc Generează perioade pentru un an întreg
 * @access Private (Admin, Accountant)
 */
router.post(
  '/generate-periods',
  fiscalClosureRateLimiter,
  requireAccountant,
  fiscalClosureController.generateYearlyPeriods.bind(fiscalClosureController)
);

/**
 * @route POST /api/accounting/fiscal-closure/validate-period
 * @desc Validează consistența perioadelor
 * @access Private (Admin, Accountant)
 */
router.post(
  '/validate-period',
  accountingReadRateLimiter,
  requireAccountant,
  fiscalClosureController.validatePeriodConsistency.bind(fiscalClosureController)
);

/**
 * ============================================================================
 * ASYNC OPERATIONS (VIA BULLMQ)
 * ============================================================================
 */

/**
 * @route POST /api/accounting/fiscal-closure/month/async
 * @desc Închide luna fiscală ASYNC (via BullMQ)
 * @access Private (Admin, Accountant)
 */
router.post(
  '/month/async',
  fiscalClosureRateLimiter,
  requireAccountant,
  fiscalClosureController.closeMonthAsync.bind(fiscalClosureController)
);

/**
 * @route POST /api/accounting/fiscal-closure/year/async
 * @desc Închide anul fiscal ASYNC (via BullMQ)
 * @access Private (Admin, Accountant)
 */
router.post(
  '/year/async',
  fiscalClosureRateLimiter,
  requireAccountant,
  fiscalClosureController.closeYearAsync.bind(fiscalClosureController)
);

/**
 * @route POST /api/accounting/fiscal-closure/vat/async
 * @desc Închide perioada TVA ASYNC (via BullMQ)
 * @access Private (Admin, Accountant)
 */
router.post(
  '/vat/async',
  fiscalClosureRateLimiter,
  requireAccountant,
  fiscalClosureController.closeVATAsync.bind(fiscalClosureController)
);

/**
 * @route GET /api/accounting/fiscal-closure/vat/d300
 * @desc Get D300 report (cu caching)
 * @access Private (Admin, Accountant)
 */
router.get(
  '/vat/d300',
  accountingReadRateLimiter,
  requireAccountant,
  fiscalClosureController.getD300Report.bind(fiscalClosureController)
);

export default router;

