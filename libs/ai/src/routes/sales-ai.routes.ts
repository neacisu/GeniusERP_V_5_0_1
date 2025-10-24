/**
 * Sales AI Routes
 * 
 * This file defines the API routes for the Sales AI features including
 * lead scoring, recommendation generation, and opportunity insights.
 */

import express from 'express';
import { SalesAiService } from '../services/sales-ai.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';

// Create router instance
const router = express.Router();

// Create service instances for route handlers
const salesAiService = new SalesAiService();

/**
 * @route POST /api/ai/sales/lead-scoring/:leadId
 * @desc Score a lead based on data and behavioral signals
 * @access Private (requires authentication)
 */
router.post('/lead-scoring/:leadId', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    const { leadId } = req.params;
    const { userId } = req.user as { userId: string };

    const scoringResult = await salesAiService.scoreLead(leadId, userId);
    
    res.status(200).json({
      success: true,
      data: scoringResult
    });
  } catch (error) {
    console.error('Error scoring lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to score lead',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/ai/sales/recommendations/deal/:dealId
 * @desc Generate intelligent recommendations for a specific deal
 * @access Private (requires authentication)
 */
router.post('/recommendations/deal/:dealId', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    const { dealId } = req.params;
    const { customerId } = req.body;
    const { userId } = req.user as { userId: string };

    // Validate required parameters
    if (!customerId) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: customerId'
      });
      return;
    }

    const recommendations = await salesAiService.generateDealRecommendations(
      dealId,
      customerId,
      userId
    );
    
    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error generating deal recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate deal recommendations',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/ai/sales/predict-outcome/:dealId
 * @desc Predict the outcome (close probability and value) for a deal
 * @access Private (requires authentication)
 */
router.get('/predict-outcome/:dealId', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    const { dealId } = req.params;
    const { userId } = req.user as { userId: string };

    const prediction = await salesAiService.predictDealOutcome(dealId, userId);
    
    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Error predicting deal outcome:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict deal outcome',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/ai/sales/followup-timing/:customerId
 * @desc Suggest optimal timing for follow-up based on customer behavior
 * @access Private (requires authentication)
 */
router.get('/followup-timing/:customerId', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    const { customerId } = req.params;
    const { userId } = req.user as { userId: string };

    const timingSuggestion = await salesAiService.suggestFollowUpTiming(customerId, userId);
    
    res.status(200).json({
      success: true,
      data: timingSuggestion
    });
  } catch (error) {
    console.error('Error suggesting follow-up timing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest follow-up timing',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export router
export default router;