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

// Export router
export default router;