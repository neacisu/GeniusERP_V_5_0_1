/**
 * Inbox AI Controller
 * 
 * This controller handles email intelligence features including email analysis,
 * response suggestions, complete response generation, and follow-up management.
 */

import { Request, Response } from 'express';
import { InboxAiAssistantService, EmailAnalysis } from '../services/inbox-ai-assistant.service';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { z } from 'zod';

// Create validation schemas
const analyzeEmailSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  messageContent: z.string().min(1, 'Message content is required')
});

const responseSuggestionsSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  messageContent: z.string().min(1, 'Message content is required'),
  emailAnalysis: z.object({
    messageId: z.string(),
    sentiment: z.enum(['positive', 'neutral', 'negative', 'urgent']),
    sentimentScore: z.number(),
    keyTopics: z.array(z.string()),
    actionItemsDetected: z.boolean(),
    actionItems: z.array(z.string()).optional(),
    priority: z.enum(['high', 'medium', 'low']),
    suggestedCategory: z.string().optional()
  }).optional().nullable()
});

const completeResponseSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  messageContent: z.string().min(1, 'Message content is required'),
  contextHistory: z.array(z.object({
    sender: z.string(),
    content: z.string(),
    timestamp: z.date()
  })).optional().default([])
});

const followUpSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  emailAnalysis: z.object({
    messageId: z.string(),
    sentiment: z.enum(['positive', 'neutral', 'negative', 'urgent']),
    sentimentScore: z.number(),
    keyTopics: z.array(z.string()),
    actionItemsDetected: z.boolean(),
    actionItems: z.array(z.string()).optional(),
    priority: z.enum(['high', 'medium', 'low']),
    suggestedCategory: z.string().optional()
  })
});

// Create logger instance
const logger = new Logger('InboxAIController');

/**
 * Register the Inbox AI controller routes with the Express application
 * @param app Express application
 * @param inboxAiService Inbox AI service instance
 */
export function registerInboxAIControllerRoutes(app: any, inboxAiService: InboxAiAssistantService) {
  const BASE_PATH = '/api/ai/inbox';

  /**
   * Analyze an email
   * 
   * @route POST /api/ai/inbox/analyze
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/analyze`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = analyzeEmailSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { messageId, messageContent } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Analyze the email
        const analysis = await inboxAiService.analyzeEmail(messageId, messageContent, userId);

        return res.status(200).json({
          success: true,
          data: analysis
        });
      } catch (error) {
        logger.error('Error in email analysis endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error analyzing email',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Generate response suggestions
   * 
   * @route POST /api/ai/inbox/suggestions
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/suggestions`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = responseSuggestionsSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { messageId, messageContent, emailAnalysis } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Generate response suggestions
        const suggestions = await inboxAiService.generateResponseSuggestions(
          messageId,
          messageContent,
          emailAnalysis as EmailAnalysis | null,
          userId
        );

        return res.status(200).json({
          success: true,
          data: suggestions
        });
      } catch (error) {
        logger.error('Error in response suggestions endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error generating response suggestions',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Generate a complete response
   * 
   * @route POST /api/ai/inbox/complete-response
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/complete-response`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = completeResponseSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { messageId, messageContent, contextHistory } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Generate complete response
        const response = await inboxAiService.generateCompleteResponse(
          messageId,
          messageContent,
          contextHistory,
          userId
        );

        return res.status(200).json({
          success: true,
          data: response
        });
      } catch (error) {
        logger.error('Error in complete response endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error generating complete response',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  /**
   * Create smart follow-up reminders
   * 
   * @route POST /api/ai/inbox/followup
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.companyGuard() - Requires company context
   */
  app.post(
    `${BASE_PATH}/followup`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validationResult = followUpSchema.safeParse(req.body);

        if (!validationResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationResult.error.issues
          });
        }

        const { messageId, emailAnalysis } = validationResult.data;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'User ID is required'
          });
        }

        // Create follow-up reminders
        const reminders = await inboxAiService.createSmartFollowUpReminders(
          messageId,
          emailAnalysis as EmailAnalysis,
          userId
        );

        return res.status(200).json({
          success: true,
          data: reminders
        });
      } catch (error) {
        logger.error('Error in follow-up reminders endpoint', error);
        return res.status(500).json({
          success: false,
          message: 'Error creating follow-up reminders',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );

  logger.info('Inbox AI controller routes registered');
}