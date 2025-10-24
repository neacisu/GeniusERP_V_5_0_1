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
import openAiRoutes from './openai.routes';
import aiReportsRoutes from './ai-reports.routes';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { DrizzleService } from "@common/drizzle";
import { AIService } from '../services/ai.service';

// Create main router instance
const router = express.Router();

// Basic health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    module: 'ai',
    features: [
      'sales-ai',
      'inbox-ai',
      'product-qa',
      'openai',
      'ai-reports'
    ]
  });
});

// Feature status endpoint (requires authentication)
router.get('/status', AuthGuard.protect(JwtAuthMode.REQUIRED), (_req, res) => {
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
      },
      'openai': {
        status: 'active',
        capabilities: [
          'chat-completion',
          'content-analysis',
          'document-processing',
          'smart-workflows'
        ],
        integration: 'integrated'
      },
      'ai-reports': {
        status: 'active',
        capabilities: [
          'financial-reports',
          'sales-analytics',
          'inventory-analysis',
          'market-trends',
          'customer-insights'
        ],
        integration: 'integrated with OpenAI'
      }
    },
    lastUpdated: new Date().toISOString()
  });
});

// POST /report endpoint for AI-driven analytics
router.post('/report', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard(['hq_admin', 'ai_access']),
  AuthGuard.companyGuard(),
  async (req, res) => {
    try {
      const { type, name, description = '', franchiseId, parameters } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      // Validate required fields
      if (!type || !name) {
        return res.status(400).json({
          success: false,
          error: 'Report type and name are required',
          message: 'Please provide both a report type and name'
        });
      }
      
      if (!userId || !companyId) {
        return res.status(400).json({
          success: false,
          error: 'User ID and Company ID are required in the authenticated token',
          message: 'Authentication error: missing user or company context'
        });
      }
      
      // Get AIService instance
      const drizzleService = new DrizzleService();
      const aiService = new AIService(drizzleService);
      
      // Generate the report
      const result = await aiService.generateReport({
        companyId,
        franchiseId,
        type,
        name,
        description,
        parameters,
        userId
      });
      
      // Return successful response
      return res.status(200).json({
        success: true,
        message: 'AI report generated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in AI report generation endpoint:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while generating the AI report',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

// Mount feature-specific routes
router.use('/sales', salesAiRoutes);
router.use('/inbox', inboxAiRoutes);
router.use('/product-qa', productQaRoutes);
router.use('/openai', openAiRoutes);
router.use('/reports', aiReportsRoutes);

// Export router
export default router;