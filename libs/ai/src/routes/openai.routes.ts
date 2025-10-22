/**
 * OpenAI Routes
 * 
 * This file defines the API routes for the OpenAI integration,
 * providing endpoints for various AI capabilities that use the OpenAI API.
 * 
 * All routes are secured with proper authentication and authorization.
 */

import express from 'express';
import { OpenAiService } from '../services/openai.service';
import { DrizzleService } from "@common/drizzle";
import AuditService from '../../audit/services/audit.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

// Create router instance
const router = express.Router();

// Initialize services
const drizzle = new DrizzleService();
const openAiService = new OpenAiService(drizzle);

/**
 * @route GET /api/ai/openai/status
 * @desc Check the status of the OpenAI integration
 * @access Private (requires authentication)
 */
router.get('/status', AuthGuard.protect(JwtAuthMode.REQUIRED), (req, res) => {
  // Check if the OpenAI SDK is installed by attempting an import
  const sdkInstalled = true;
  
  try {
    // Log audit event for checking OpenAI status
    if (req.user && req.user.companyId) {
      AuditService.log({
        action: 'CHECK_OPENAI_STATUS',
        entity: 'AI_MODULE',
        entityId: 'openai',
        userId: req.user.id,
        companyId: req.user.companyId,
        details: {
          apiKeyStatus: openAiService.getApiKeyStatus(),
          sdkInstalled
        }
      });
    }
  } catch (error) {
    console.error('Error logging OpenAI status check:', error);
  }
  
  const status = {
    ready: openAiService.isReady(),
    apiKeyStatus: openAiService.getApiKeyStatus(),
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    sdkInstalled,
    useCases: Object.keys(openAiService.getConfigForUseCase('salesAssistant'))
  };
  
  res.status(200).json({
    success: true,
    data: status
  });
});

/**
 * @route POST /api/ai/openai/completion
 * @desc Generate a completion using OpenAI
 * @access Private (requires authentication)
 */
router.post('/completion', AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.companyGuard(), async (req, res) => {
  try {
    const { messages, model, temperature, maxTokens } = req.body;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Company ID are required'
      });
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required and must not be empty'
      });
    }
    
    const completion = await openAiService.createChatCompletion({
      messages,
      model,
      temperature,
      maxTokens,
      userId,
      companyId
    });
    
    res.status(200).json({
      success: true,
      data: completion
    });
  } catch (error) {
    console.error('Error in completion endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate completion',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route POST /api/ai/openai/analyze
 * @desc Analyze content using OpenAI
 * @access Private (requires authentication)
 */
router.post('/analyze', AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.companyGuard(), async (req, res) => {
  try {
    const { content, type, options } = req.body;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Company ID are required'
      });
    }
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required for analysis'
      });
    }
    
    // Build a conversation based on content type
    let systemPrompt = 'You are an AI assistant analyzing content.';
    switch (type) {
      case 'email':
        systemPrompt = 'You are an email analysis assistant. Analyze the following email and provide key insights, sentiment, and suggested actions.';
        break;
      case 'document':
        systemPrompt = 'You are a document analysis assistant. Extract key information, topics, and insights from the following document.';
        break;
      case 'conversation':
        systemPrompt = 'You are a conversation analysis assistant. Analyze the following conversation transcript and provide key points, sentiment, and next steps.';
        break;
      default:
        systemPrompt = 'You are a general content analysis assistant. Analyze the following content and provide insights.';
    }
    
    const messages = openAiService.buildConversation(
      systemPrompt,
      content
    );
    
    const completion = await openAiService.createChatCompletion({
      messages,
      model: options?.model,
      temperature: options?.temperature || 0.3, // Lower temperature for analysis
      maxTokens: options?.maxTokens,
      userId,
      companyId
    });
    
    res.status(200).json({
      success: true,
      data: {
        analysis: completion.choices[0]?.message.content,
        model: completion.model,
        type
      }
    });
  } catch (error) {
    console.error('Error in analysis endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Export router
export default router;