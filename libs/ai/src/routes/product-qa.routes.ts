/**
 * Product QA Routes
 * 
 * This file defines the API routes for the Product QA features including
 * product question answering, comparison, and documentation search.
 */

import express from 'express';
import { ProductQaService } from '../services/product-qa.service';
import { DrizzleService } from "@common/drizzle";
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';

// Create router instance
const router = express.Router();

// Create service instances for route handlers
const drizzle = new DrizzleService();
const productQaService = new ProductQaService(drizzle);

/**
 * @route POST /api/ai/product-qa/answer
 * @desc Answer a product-related question using available documentation
 * @access Private (requires authentication)
 */
router.post('/answer', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res): Promise<void> => {
  try {
    const { question, productId } = req.body;
    const { userId } = req.user as { userId: string };

    // Validate required parameters
    if (!question) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: question'
      });
      return;
    }

    const answer = await productQaService.answerProductQuestion(
      question,
      productId || null,
      userId
    );
    
    res.status(200).json({
      success: true,
      data: answer
    });
  } catch (error) {
    console.error('Error answering product question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to answer product question',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/ai/product-qa/compare
 * @desc Compare multiple products based on their specifications and features
 * @access Private (requires authentication)
 */
router.post('/compare', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res): Promise<void> => {
  try {
    const { productIds } = req.body;
    const { userId } = req.user as { userId: string };

    // Validate required parameters
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid required parameter: productIds must be an array with at least 2 items'
      });
      return;
    }

    const comparison = await productQaService.compareProducts(productIds, userId);
    
    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare products',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/ai/product-qa/search-documentation
 * @desc Search for technical documentation across all product manuals
 * @access Private (requires authentication)
 */
router.post('/search-documentation', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res): Promise<void> => {
  try {
    const { query, filters } = req.body;
    const { userId } = req.user as { userId: string };

    // Validate required parameters
    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: query'
      });
      return;
    }

    const searchResults = await productQaService.searchProductDocumentation(
      query,
      filters || {},
      userId
    );
    
    res.status(200).json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    console.error('Error searching product documentation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search product documentation',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/ai/product-qa/usage-suggestions/:productId
 * @desc Generate usage suggestions and best practices for a specific product or feature
 * @access Private (requires authentication)
 */
router.post('/usage-suggestions/:productId', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    const { productId } = req.params;
    const { featureId, userContext } = req.body;
    const { userId } = req.user as { userId: string };

    const suggestions = await productQaService.generateUsageSuggestions(
      productId,
      featureId || null,
      userContext || null,
      userId
    );
    
    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error generating usage suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate usage suggestions',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export router
export default router;