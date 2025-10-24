/**
 * General Journal Routes
 * 
 * Endpoint-uri pentru Registrul Jurnal conform OMFP 2634/2015
 */

import { Router } from 'express';
import { GeneralJournalController } from '../controllers/general-journal.controller';
import { AuthGuard } from '@geniuserp/auth';
import { 
  accountingReadRateLimiter,
  exportRateLimiter
} from "@api/middlewares/rate-limit.middleware";

const router = Router();
const controller = new GeneralJournalController();

/**
 * @route GET /api/accounting/general-journal/pdf
 * @desc Generează Registrul Jurnal în format PDF
 * @access Private (accountant, admin, manager)
 * @query startDate - Data de început (YYYY-MM-DD)
 * @query endDate - Data de sfârșit (YYYY-MM-DD) 
 * @query journalTypes - Array optional cu tipuri jurnal (SALES, PURCHASE, etc.)
 * @query detailLevel - 'summary' sau 'detailed' (default: detailed)
 * @query includeReversals - Include stornări (default: true)
 */
// Middleware pentru rol contabil/admin/manager
const requireAccountingRole = AuthGuard.roleGuard(['accountant', 'admin', 'manager']);

router.get('/pdf', 
  exportRateLimiter,
  requireAccountingRole,
  controller.generatePDF.bind(controller)
);

/**
 * @route GET /api/accounting/general-journal/excel
 * @desc Generează Registrul Jurnal în format Excel (TODO)
 * @access Private (accountant, admin, manager)
 */
router.get('/excel',
  exportRateLimiter,
  requireAccountingRole,
  controller.generateExcel.bind(controller)
);

/**
 * @route GET /api/accounting/general-journal/preview
 * @desc Preview date pentru Registru Jurnal (fără generare fișier)
 * @access Private (accountant, admin, manager)
 * @query Aceiași parametri ca PDF dar limitați la 30 zile
 */
router.get('/preview',
  accountingReadRateLimiter,
  requireAccountingRole,
  controller.previewData.bind(controller)
);

/**
 * @route GET /api/accounting/general-journal/periods
 * @desc Obține perioade disponibile pentru raportare
 * @access Private (accountant, admin, manager)
 */
router.get('/periods',
  accountingReadRateLimiter,
  requireAccountingRole,
  controller.getAvailablePeriods.bind(controller)
);

export default router;
