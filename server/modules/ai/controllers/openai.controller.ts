/**
 * OpenAI Controller
 * 
 * This controller handles OpenAI-related endpoints including status checks,
 * chat completions, and content analysis.
 */

import { Request, Response } from 'express';
import { OpenAiService } from '../services/openai.service';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import AuditService from '../../audit/services/audit.service';
import { z } from 'zod';

// Create validation schema for chat completion
const completionSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })).min(1, 'At least one message is required'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional()
});

// Create validation schema for content analysis
const analyzeSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['email', 'document', 'conversation', 'general']).optional(),
  options: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional()
  }).optional()
});

// Create logger instance
const logger = new Logger('OpenAIController');

/**
 * Register the OpenAI controller routes with the Express application
 * @param app Express application
 * @param openAiService OpenAI service instance
 */
export function registerOpenAIControllerRoutes(app: any, openAiService: OpenAiService) {
  const BASE_PATH = '/api/ai/openai';

  /**
   * Get OpenAI integration status
   * 
   * @route GET /api/ai/openai/status
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  app.get(`${BASE_PATH}/status`, AuthGuard.protect(JwtAuthMode.REQUIRED), (req: Request, res: Response) => {
    try {
      // Check if the OpenAI SDK is installed by attempting an import
      let sdkInstalled = true;
      
      try {
        // Log audit event for checking OpenAI status
        if (req.user) {
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
        logger.error('Error logging OpenAI status check:', error);
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
    } catch (error) {
      logger.error('Error checking OpenAI status', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check OpenAI status',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * Generate a chat completion
   * 
   * @route POST /api/ai/openai/completion
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/completion`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.companyGuard(),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = completionSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { messages, model, temperature, maxTokens } = validationResult.data;
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(400).json({
            success: false,
            error: 'User ID and Company ID are required'
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
        logger.error('Error in completion endpoint:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to generate completion',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Analyze content
   * 
   * @route POST /api/ai/openai/analyze
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/analyze`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.companyGuard(),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = analyzeSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { content, type = 'general', options } = validationResult.data;
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(400).json({
            success: false,
            error: 'User ID and Company ID are required'
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
        logger.error('Error in analysis endpoint:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to analyze content',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Update OpenAI configuration
   * 
   * @route PUT /api/ai/openai/config
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.put(
    `${BASE_PATH}/config`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(['admin']),
    async (req: Request, res: Response) => {
      try {
        const { apiKey, defaultModel, temperature, maxTokens, organization, baseUrl } = req.body;
        
        // Update configuration
        openAiService.updateConfig({
          apiKey,
          defaultModel,
          temperature,
          maxTokens,
          organization,
          baseUrl
        });
        
        // Log the configuration update
        await AuditService.log({
          action: 'OPENAI_CONFIG_UPDATE',
          entity: 'AI_MODULE',
          entityId: 'openai_config',
          userId: req.user?.id,
          companyId: req.user?.companyId,
          details: {
            updatedFields: Object.keys(req.body).filter(key => key !== 'apiKey'),
            apiKeyUpdated: !!apiKey
          }
        });
        
        res.status(200).json({
          success: true,
          message: 'OpenAI configuration updated successfully',
          data: {
            ready: openAiService.isReady(),
            apiKeyStatus: openAiService.getApiKeyStatus()
          }
        });
      } catch (error) {
        logger.error('Error updating OpenAI configuration', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update OpenAI configuration',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  logger.info('OpenAI controller routes registered');
}