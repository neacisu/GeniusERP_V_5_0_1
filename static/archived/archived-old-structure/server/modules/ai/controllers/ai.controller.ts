/**
 * AI Controller
 * 
 * This controller handles the main AI endpoints, including health checks,
 * status information, and report generation.
 */

import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { z } from 'zod';

// Create validation schema for report generation
const generateReportSchema = z.object({
  type: z.string().min(1, 'Report type is required'),
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  franchiseId: z.string().optional(),
  parameters: z.record(z.string(), z.any()).optional(),
});

// Create logger instance
const logger = new Logger('AIController');

/**
 * Register the AI controller routes with the Express application
 * @param app Express application
 * @param aiService AI service instance
 */
export function registerAIControllerRoutes(app: any, aiService: AIService) {
  const BASE_PATH = '/api/ai';

  /**
   * Health check endpoint
   * 
   * @route GET /api/ai/health
   * @access Public
   */
  app.get(`${BASE_PATH}/health`, (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      logger.error('Error in AI health check endpoint', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check AI health'
      });
    }
  });

  /**
   * Feature status endpoint
   * 
   * @route GET /api/ai/status
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  app.get(`${BASE_PATH}/status`, AuthGuard.protect(JwtAuthMode.REQUIRED), (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      logger.error('Error in AI status endpoint', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check AI status'
      });
    }
  });

  /**
   * Generate AI report
   * 
   * @route POST /api/ai/report
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['hq_admin', 'ai_access']) - Requires specific roles
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/report`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(['hq_admin', 'ai_access']),
    
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = generateReportSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { type, name, description = '', franchiseId, parameters } = validationResult.data;
        const userId = req.user?.id;
        const companyId = req.user?.companyId;

        if (!userId || !companyId) {
          return res.status(400).json({
            success: false,
            error: 'User ID and Company ID are required in the authenticated token',
            message: 'Authentication error: missing user or company context'
          });
        }

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
        logger.error('Error in AI report generation endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'An error occurred while generating the AI report',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Get report by ID
   * 
   * @route GET /api/ai/reports/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.get(
    `${BASE_PATH}/reports/:id`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    
    async (req: Request, res: Response) => {
      try {
        const reportId = req.params.id;
        const companyId = req.user?.companyId;

        if (!companyId) {
          return res.status(400).json({
            success: false,
            message: 'Company ID is required in the authenticated token'
          });
        }

        const report = await aiService.getReportById(reportId, companyId);

        if (!report) {
          return res.status(404).json({
            success: false,
            message: 'Report not found'
          });
        }

        return res.status(200).json({
          success: true,
          data: report
        });
      } catch (error) {
        logger.error(`Error retrieving report with ID ${req.params.id}`, error);
        return res.status(500).json({
          success: false,
          message: 'Error retrieving report',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * List reports
   * 
   * @route GET /api/ai/reports
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.get(
    `${BASE_PATH}/reports`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    
    async (req: Request, res: Response) => {
      try {
        const companyId = req.user?.companyId;
        const type = req.query.type as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

        if (!companyId) {
          return res.status(400).json({
            success: false,
            message: 'Company ID is required in the authenticated token'
          });
        }

        const reports = await aiService.listReports(companyId, type, limit);

        return res.status(200).json({
          success: true,
          data: reports
        });
      } catch (error) {
        logger.error('Error listing reports', error);
        return res.status(500).json({
          success: false,
          message: 'Error listing reports',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  logger.info('AI controller routes registered');
}