/**
 * Product QA Controller
 * 
 * This controller handles product knowledge features including answering product questions,
 * comparing products, searching documentation, and generating usage suggestions.
 */

import { Request, Response } from 'express';
import { ProductQaService } from '../services/product-qa.service';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { z } from 'zod';

// Create validation schemas
const productQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  productId: z.string().nullable().optional()
});

const productComparisonSchema = z.object({
  productIds: z.array(z.string()).min(2, 'At least 2 product IDs are required')
});

const documentationSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.object({
    productId: z.string().optional(),
    documentType: z.enum(['user_guide', 'technical_manual', 'tutorial', 'api_doc']).optional(),
    dateRange: z.object({
      start: z.date(),
      end: z.date()
    }).optional()
  }).optional()
});

const usageSuggestionsSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  featureId: z.string().nullable().optional(),
  userContext: z.object({
    role: z.string(),
    experience: z.enum(['beginner', 'intermediate', 'advanced']),
    usageHistory: z.array(z.string()).optional()
  }).nullable().optional()
});

// Create logger instance
const logger = new Logger('ProductQAController');

/**
 * Register the Product QA controller routes with the Express application
 * @param app Express application
 * @param productQaService Product QA service instance
 */
export function registerProductQAControllerRoutes(app: any, productQaService: ProductQaService) {
  const BASE_PATH = '/api/ai/product-qa';

  /**
   * Answer a product question
   * 
   * @route POST /api/ai/product-qa/answer
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  app.post(
    `${BASE_PATH}/answer`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = productQuestionSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.errors
          });
        }

        const { question, productId } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Answer the product question
        const answer = await productQaService.answerProductQuestion(
          question,
          productId || null,
          userId
        );

        return res.status(200).json({
          success: true,
          data: answer
        });
      } catch (error) {
        logger.error('Error in product question answering endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error answering product question',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Compare products
   * 
   * @route POST /api/ai/product-qa/compare
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  app.post(
    `${BASE_PATH}/compare`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = productComparisonSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.errors
          });
        }

        const { productIds } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Compare the products
        const comparison = await productQaService.compareProducts(productIds, userId);

        return res.status(200).json({
          success: true,
          data: comparison
        });
      } catch (error) {
        logger.error('Error in product comparison endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error comparing products',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Search product documentation
   * 
   * @route POST /api/ai/product-qa/search
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  app.post(
    `${BASE_PATH}/search`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = documentationSearchSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.errors
          });
        }

        const { query, filters = {} } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Search product documentation
        const searchResults = await productQaService.searchProductDocumentation(
          query,
          filters,
          userId
        );

        return res.status(200).json({
          success: true,
          data: searchResults
        });
      } catch (error) {
        logger.error('Error in documentation search endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error searching documentation',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Generate usage suggestions
   * 
   * @route POST /api/ai/product-qa/suggestions
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  app.post(
    `${BASE_PATH}/suggestions`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = usageSuggestionsSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.errors
          });
        }

        const { productId, featureId = null, userContext = null } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Generate usage suggestions
        const suggestions = await productQaService.generateUsageSuggestions(
          productId,
          featureId,
          userContext,
          userId
        );

        return res.status(200).json({
          success: true,
          data: suggestions
        });
      } catch (error) {
        logger.error('Error in usage suggestions endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error generating usage suggestions',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  logger.info('Product QA controller routes registered');
}