/**
 * Fiscal Closure Routes
 * 
 * Rute API pentru închiderea fiscală lunară și anuală
 */

import { Router } from 'express';
import fiscalClosureController from '../controllers/fiscal-closure.controller';
import { AuthGuard } from '../../auth/guards/auth.guard';

const router = Router();

// Toate rutele necesită autentificare și rol de admin sau contabil
const requireAccountant = AuthGuard.roleGuard(['admin', 'administrator', 'accountant', 'contabil']);

/**
 * @route POST /api/accounting/fiscal-closure/month
 * @desc Închide luna fiscală
 * @access Private (Admin, Accountant)
 */
router.post(
  '/month',
  requireAccountant,
  fiscalClosureController.closeMonth.bind(fiscalClosureController)
);

/**
 * @route POST /api/accounting/fiscal-closure/year
 * @desc Închide anul fiscal
 * @access Private (Admin, Accountant)
 */
router.post(
  '/year',
  requireAccountant,
  fiscalClosureController.closeYear.bind(fiscalClosureController)
);

/**
 * @route POST /api/accounting/fiscal-closure/reopen/:periodId
 * @desc Redeschide o perioadă închisă
 * @access Private (Admin only)
 */
router.post(
  '/reopen/:periodId',
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
  requireAccountant,
  fiscalClosureController.validatePeriodConsistency.bind(fiscalClosureController)
);

export default router;

