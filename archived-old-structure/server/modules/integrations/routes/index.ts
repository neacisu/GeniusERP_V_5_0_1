/**
 * Integration Routes Index
 * 
 * Exports all integration routes
 */

import express from 'express';
import pandadocRoutes from './pandadoc.route';
import integrationsRouter from './integrations.route';

// Create main router
const router = express.Router();

// Mount integrations main routes
router.use('/', integrationsRouter);

// Mount sub-routers for specific integrations
router.use('/pandadoc', pandadocRoutes);

export default router;