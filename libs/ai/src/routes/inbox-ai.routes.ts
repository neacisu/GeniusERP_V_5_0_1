/**
 * Inbox AI Routes
 * 
 * This file defines the API routes for the Inbox AI features including
 * email analysis, response suggestions, and smart follow-up reminders.
 */

import express from 'express';
import { InboxAiAssistantService } from '../services/inbox-ai-assistant.service';
import { DrizzleService } from "@common/drizzle";
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

// Create router instance
const router = express.Router();

// Create service instances for route handlers
const drizzle = new DrizzleService();
const inboxAiService = new InboxAiAssistantService(drizzle);

/**
 * @route POST /api/ai/inbox/analyze
 * @desc Analyze an email message for sentiment, topics, and action items
 * @access Private (requires authentication)
 */
router.post('/analyze', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    const { messageId, messageContent } = req.body;
    const { userId } = req.user as { userId: string };

    // Validate required parameters
    if (!messageId || !messageContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: messageId and messageContent are required'
      });
    }

    const analysis = await inboxAiService.analyzeEmail(messageId, messageContent, userId);
    
    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze email',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/ai/inbox/suggest-responses
 * @desc Generate response suggestions for an email message
 * @access Private (requires authentication)
 */
router.post('/suggest-responses', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    const { messageId, messageContent, emailAnalysis } = req.body;
    const { userId } = req.user as { userId: string };

    // Validate required parameters
    if (!messageId || !messageContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: messageId and messageContent are required'
      });
    }

    const suggestions = await inboxAiService.generateResponseSuggestions(
      messageId,
      messageContent,
      emailAnalysis || null,
      userId
    );
    
    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error generating response suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response suggestions',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/ai/inbox/complete-response
 * @desc Generate a complete response to an email based on context and previous communications
 * @access Private (requires authentication)
 */
router.post('/complete-response', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    const { messageId, messageContent, contextHistory } = req.body;
    const { userId } = req.user as { userId: string };

    // Validate required parameters
    if (!messageId || !messageContent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: messageId and messageContent are required'
      });
    }

    // Ensure contextHistory is an array, defaulting to empty if not provided
    const history = Array.isArray(contextHistory) ? contextHistory : [];

    const completeResponse = await inboxAiService.generateCompleteResponse(
      messageId,
      messageContent,
      history,
      userId
    );
    
    res.status(200).json({
      success: true,
      data: completeResponse
    });
  } catch (error) {
    console.error('Error generating complete response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate complete response',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/ai/inbox/create-reminders
 * @desc Set up automated follow-up reminders based on email content and action items
 * @access Private (requires authentication)
 */
router.post('/create-reminders', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    const { messageId, emailAnalysis } = req.body;
    const { userId } = req.user as { userId: string };

    // Validate required parameters
    if (!messageId || !emailAnalysis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: messageId and emailAnalysis are required'
      });
    }

    const reminders = await inboxAiService.createSmartFollowUpReminders(
      messageId,
      emailAnalysis,
      userId
    );
    
    res.status(200).json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error creating follow-up reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create follow-up reminders',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export router
export default router;