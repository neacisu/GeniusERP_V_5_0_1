/**
 * Sales AI Controller
 * 
 * This controller handles sales intelligence features including lead scoring,
 * deal recommendations, outcome predictions, and follow-up timing optimization.
 */

import { Request, Response } from 'express';
import { SalesAiService } from '../services/sales-ai.service';
import { createModuleLogger } from "@common/logger/loki-logger";
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { z } from 'zod';

// Create validation schemas
const leadScoringSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID format')
});

const dealRecommendationsSchema = z.object({
  dealId: z.string().uuid('Invalid deal ID format'),
  customerId: z.string().uuid('Invalid customer ID format')
});

const dealOutcomeSchema = z.object({
  dealId: z.string().uuid('Invalid deal ID format')
});

const followUpTimingSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID format')
});

// Create logger instance
const logger = createModuleLogger('SalesAIController');

/**
 * Register the Sales AI controller routes with the Express application
 * @param app Express application
 * @param salesAiService Sales AI service instance
 */
export function registerSalesAIControllerRoutes(app: any, salesAiService: SalesAiService) {
  const BASE_PATH = '/api/ai/sales';

  /**
   * Score a lead
   * 
   * @route POST /api/ai/sales/leads/score
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/leads/score`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = leadScoringSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { leadId } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Score the lead
        const scoringResult = await salesAiService.scoreLead(leadId, userId);

        return res.status(200).json({
          success: true,
          data: scoringResult
        });
      } catch (error) {
        logger.error('Error in lead scoring endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error scoring lead',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Generate deal recommendations
   * 
   * @route POST /api/ai/sales/deals/recommendations
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/deals/recommendations`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.companyGuard(),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = dealRecommendationsSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { dealId, customerId } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Generate deal recommendations
        const recommendations = await salesAiService.generateDealRecommendations(
          dealId,
          customerId,
          userId
        );

        return res.status(200).json({
          success: true,
          data: recommendations
        });
      } catch (error) {
        logger.error('Error in deal recommendations endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error generating deal recommendations',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Predict deal outcome
   * 
   * @route POST /api/ai/sales/deals/predict
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/deals/predict`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.companyGuard(),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = dealOutcomeSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { dealId } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Predict deal outcome
        const prediction = await salesAiService.predictDealOutcome(dealId, userId);

        return res.status(200).json({
          success: true,
          data: prediction
        });
      } catch (error) {
        logger.error('Error in deal outcome prediction endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error predicting deal outcome',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Suggest follow-up timing
   * 
   * @route POST /api/ai/sales/followup/timing
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/followup/timing`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.companyGuard(),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = followUpTimingSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { customerId } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Suggest follow-up timing
        const timing = await salesAiService.suggestFollowUpTiming(customerId, userId);

        return res.status(200).json({
          success: true,
          data: timing
        });
      } catch (error) {
        logger.error('Error in follow-up timing endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error suggesting follow-up timing',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  logger.info('Sales AI controller routes registered');
}