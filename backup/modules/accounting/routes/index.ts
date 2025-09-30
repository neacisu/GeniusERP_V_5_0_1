/**
 * Accounting Routes Index
 * 
 * This file exports all routes from the accounting module.
 */

import express from 'express';
import noteContabilRoutes from './note-contabil.route';

const router = express.Router();

// Mount routes
router.use('/note-contabil', noteContabilRoutes);

// Export router
export default router;