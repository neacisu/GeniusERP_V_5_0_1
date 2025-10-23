/**
 * Accounting Routes Index
 * 
 * This file exports all routes from the accounting module.
 */

import express from 'express';
import noteContabilRoutes from './note-contabil.route';
import fiscalClosureRoutes from './fiscal-closure.routes';

const router = express.Router();

// Mount routes
router.use('/note-contabil', noteContabilRoutes);
router.use('/fiscal-closure', fiscalClosureRoutes);

// Export router as default
export default router;

// Re-export individual route setup functions
export { setupAccountingRoutes } from './accounting.routes';
export { setupOnboardingRoutes } from './onboarding.routes';
export { setupAccountingSettingsRoutes } from './accounting-settings.routes';
export { setupSalesJournalRoutes } from './sales-journal.routes';
export { setupPurchaseJournalRoutes } from './purchase-journal.routes';
export { setupBankJournalRoutes } from './bank-journal.routes';
export { setupCashRegisterRoutes } from './cash-register.routes';
export { setupLedgerRoutes } from './ledger.routes';
export { setupFinancialReportsRoutes } from './financial-reports.routes';
