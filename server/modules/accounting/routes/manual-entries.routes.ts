/**
 * Manual Entries Routes
 * 
 * Endpoint-uri pentru note contabile manuale conform OMFP 2634/2015
 */

import { Router } from 'express';
import { ManualEntriesController } from '../controllers/manual-entries.controller';
import { AuthGuard } from '../../../common/middleware/auth.guard';
import { RolesGuard } from '../../../common/middleware/roles.guard';

const router = Router();
const controller = new ManualEntriesController();

/**
 * @route POST /api/accounting/manual-entries
 * @desc Creează o notă contabilă manuală
 * @access Private (accountant, admin)
 * @body {entryDate, documentDate?, description, isStorno?, lines[]}
 */
router.post('/',
  AuthGuard.protect(),
  RolesGuard.requireRoles(['accountant', 'admin']),
  controller.createManualEntry.bind(controller)
);

/**
 * @route GET /api/accounting/manual-entries
 * @desc Obține lista notelor contabile manuale
 * @access Private (accountant, admin, manager)
 * @query startDate?, endDate?, page?, limit?, includeStorno?
 */
router.get('/',
  AuthGuard.protect(),
  RolesGuard.requireRoles(['accountant', 'admin', 'manager']),
  controller.getManualEntries.bind(controller)
);

/**
 * @route GET /api/accounting/manual-entries/:id
 * @desc Obține detaliile unei note contabile
 * @access Private (accountant, admin, manager)
 */
router.get('/:id',
  AuthGuard.protect(),
  RolesGuard.requireRoles(['accountant', 'admin', 'manager']),
  controller.getManualEntry.bind(controller)
);

/**
 * @route POST /api/accounting/manual-entries/validate
 * @desc Validează o notă contabilă înainte de salvare (preview)
 * @access Private (accountant, admin)
 * @body {entryDate, documentDate?, description, isStorno?, lines[]}
 */
router.post('/validate',
  AuthGuard.protect(),
  RolesGuard.requireRoles(['accountant', 'admin']),
  controller.validateManualEntry.bind(controller)
);

export default router;
