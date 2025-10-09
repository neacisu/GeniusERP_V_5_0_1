/**
 * General Journal Routes
 * 
 * Endpoint-uri pentru Registrul Jurnal conform OMFP 2634/2015
 */

import { Router } from 'express';
import { GeneralJournalController } from '../controllers/general-journal.controller';
import { AuthGuard } from '../../auth/guards/auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard'; // TODO: Verify roles guard path

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
router.get('/pdf', 
  AuthGuard.protect(),
  RolesGuard.requireRoles(['accountant', 'admin', 'manager']),
  controller.generatePDF.bind(controller)
);

/**
 * @route GET /api/accounting/general-journal/excel
 * @desc Generează Registrul Jurnal în format Excel (TODO)
 * @access Private (accountant, admin, manager)
 */
router.get('/excel',
  AuthGuard.protect(), 
  RolesGuard.requireRoles(['accountant', 'admin', 'manager']),
  controller.generateExcel.bind(controller)
);

/**
 * @route GET /api/accounting/general-journal/preview
 * @desc Preview date pentru Registru Jurnal (fără generare fișier)
 * @access Private (accountant, admin, manager)
 * @query Aceiași parametri ca PDF dar limitați la 30 zile
 */
router.get('/preview',
  AuthGuard.protect(),
  RolesGuard.requireRoles(['accountant', 'admin', 'manager']),
  controller.previewData.bind(controller)
);

/**
 * @route GET /api/accounting/general-journal/periods
 * @desc Obține perioade disponibile pentru raportare
 * @access Private (accountant, admin, manager)
 */
router.get('/periods',
  AuthGuard.protect(),
  RolesGuard.requireRoles(['accountant', 'admin', 'manager']),
  controller.getAvailablePeriods.bind(controller)
);

export default router;
