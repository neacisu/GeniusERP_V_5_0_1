/**
 * AI Module Routes
 * 
 * This file defines the main router for the AI module which combines
 * all AI feature routes into a single API surface.
 */

import express from 'express';
import salesAiRoutes from './sales-ai.routes';
import inboxAiRoutes from './inbox-ai.routes';
import productQaRoutes from './product-qa.routes';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/models/auth.enum';

// Create main router instance
const router = express.Router();

// Basic health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    module: 'ai',
    features: [
      'sales-ai',
      'inbox-ai',
      'product-qa'
    ]
  });
});

// Feature status endpoint (requires authentication)
router.get('/status', AuthGuard.protect(JwtAuthMode.REQUIRED), (req, res) => {
  res.status(200).json({
    status: 'operational',
    module: 'ai',
    features: {
      'sales-ai': {
        status: 'active',
        capabilities: [
          'lead-scoring',
          'deal-recommendations',
          'outcome-prediction',
          'followup-timing'
        ]
      },
      'inbox-ai': {
        status: 'active',
        capabilities: [
          'email-analysis',
          'response-suggestions',
          'complete-response',
          'followup-reminders'
        ]
      },
      'product-qa': {
        status: 'active',
        capabilities: [
          'question-answering',
          'product-comparison',
          'documentation-search',
          'usage-suggestions'
        ]
      }
    },
    lastUpdated: new Date().toISOString()
  });
});

// POST /report-placeholder endpoint for AI-driven analytics
router.post('/report-placeholder', AuthGuard.protect(JwtAuthMode.REQUIRED), (req, res) => {
  try {
    // This is a placeholder endpoint for future AI report generation
    // Will be expanded to include OpenAI/Grok/EllevenLabs integrations and internal BI
    return res.status(200).json({
      success: true,
      message: 'AI report generation placeholder',
      data: {
        requestedAt: new Date().toISOString(),
        requestType: req.body.type || 'general',
        requestedBy: req.user?.id || 'anonymous',
        companyId: req.body.companyId || req.user?.companyId,
        reportId: `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: 'scheduled'
      }
    });
  } catch (error) {
    console.error('Error in AI report placeholder endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing the report request',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Mount feature-specific routes
router.use('/sales', salesAiRoutes);
router.use('/inbox', inboxAiRoutes);
router.use('/product-qa', productQaRoutes);

// Export router
export default router;