/**
 * AI Reports Routes
 * 
 * This file defines the API routes for AI-generated reports,
 * providing endpoints for creating, retrieving, and listing reports.
 * 
 * All routes are secured with proper authentication and authorization.
 */

import express from 'express';
import { AIService } from '../services/ai.service';
import { DrizzleService } from '../../../common/drizzle';
import AuditService from '../../audit/services/audit.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

// Create router instance
const router = express.Router();

// Initialize services
const drizzleService = new DrizzleService();
const aiService = new AIService(drizzleService);

// Helper functions for AI report generation since some AIService methods are private
// These should match what's in AIService but are duplicated here to avoid access issues
function getSystemPromptForReportType(reportType: string): string {
  const systemPrompts: Record<string, string> = {
    'financial_summary': 'You are a financial analysis AI assistant. Generate a concise financial summary report with key metrics, trends, and actionable insights. Include sections on revenue, expenses, profitability, and financial health.',
    
    'sales_performance': 'You are a sales analytics AI assistant. Generate a detailed sales performance report with metrics, trends, top performers, regional analysis, and actionable recommendations. Include sections on pipeline analysis, conversion rates, and revenue forecasts.',
    
    'inventory_analysis': 'You are an inventory management AI assistant. Generate a comprehensive inventory analysis report with stock levels, turnover rates, reorder suggestions, and optimization recommendations. Include sections on overstock and understock items.',
    
    'customer_insights': 'You are a customer analytics AI assistant. Generate an insightful customer analysis report with segmentation, behavior patterns, lifetime value analysis, and loyalty metrics. Include sections on acquisition channels and retention strategies.',
    
    'market_trends': 'You are a market research AI assistant. Generate an informative market trends report with industry developments, competitive landscape, emerging opportunities, and potential threats. Include sections on market growth and consumer preferences.'
  };
  
  return systemPrompts[reportType] || 
    'You are an analytics AI assistant. Generate a comprehensive business report with data-driven insights and actionable recommendations.';
}

function buildReportPrompt(
  type: string,
  companyId: string,
  franchiseId?: string,
  parameters?: Record<string, any>
): string {
  let prompt = `Generate a detailed ${type} report `;
  
  // Add company context
  prompt += `for company ID ${companyId} `;
  
  // Add franchise context if provided
  if (franchiseId) {
    prompt += `and franchise ID ${franchiseId} `;
  }
  
  // Add time period if provided
  if (parameters?.period) {
    prompt += `for the period ${parameters.period} `;
  }
  
  // Add specific focus areas if provided
  if (parameters?.focusAreas && Array.isArray(parameters.focusAreas)) {
    prompt += `with focus on ${parameters.focusAreas.join(', ')} `;
  }
  
  // Add format instructions
  prompt += `\n\nPlease structure the report with the following sections:
1. Executive Summary
2. Key Metrics and KPIs
3. Detailed Analysis
4. Trends and Patterns
5. Actionable Recommendations
6. Conclusion
`;
  
  // Add specific metrics to include if provided
  if (parameters?.metrics && Array.isArray(parameters.metrics)) {
    prompt += `\nInclude analysis of these specific metrics: ${parameters.metrics.join(', ')}`;
  }
  
  // Add comparison request if provided
  if (parameters?.compareWith) {
    prompt += `\nCompare performance with ${parameters.compareWith}`;
  }
  
  return prompt;
}

/**
 * @route POST /api/ai/reports/generate
 * @desc Generate a report using AI
 * @access Private (requires authentication and ai_access role)
 */
router.post('/generate', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard(['ai_access']),
  AuthGuard.companyGuard(),
  async (req, res) => {
    try {
      const { 
        type, 
        name, 
        description, 
        franchiseId, 
        parameters 
      } = req.body;
      
      // Validation
      if (!type || !name) {
        return res.status(400).json({
          success: false,
          error: 'Report type and name are required'
        });
      }
      
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(400).json({
          success: false,
          error: 'User ID and Company ID are required'
        });
      }
      
      // For development mode where database might not be fully available
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !aiService.drizzleService?.db) {
        console.log("Development mode: OpenAI is available but DB operations are stubbed");
        
        // We can still make OpenAI requests
        const systemPrompt = getSystemPromptForReportType(type);
        const userPrompt = buildReportPrompt(type, companyId, franchiseId, parameters);
        
        const conversation = aiService.openAiService.buildConversation(systemPrompt, userPrompt);
        
        // Generate content but skip DB operations
        const completion = await aiService.openAiService.createChatCompletion({
          messages: conversation,
          model: 'gpt-4o',
          temperature: 0.3,
          maxTokens: 2000,
          userId,
          companyId
        });
        
        const reportContent = completion.choices?.[0]?.message.content || 'No content generated';
        
        await AuditService.log({
          action: 'REPORT_GENERATION_COMPLETED',
          entity: 'ANALYTICS_REPORT',
          entityId: 'mock-report',
          userId: userId,
          companyId: companyId,
          details: {
            reportType: type,
            devMode: true
          }
        });
        
        return res.status(200).json({
          success: true,
          data: {
            id: 'report-' + Date.now(),
            content: reportContent,
            createdAt: new Date()
          },
          message: 'Generated in development mode (DB operations skipped)'
        });
      }
      
      // In production mode, try the full report generation with DB storage
      try {
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
        
        res.status(200).json({
          success: true,
          data: result
        });
      } catch (dbError) {
        console.error('Database error during report generation:', dbError);
        
        // Still provide the OpenAI functionality even if DB fails
        const systemPrompt = getSystemPromptForReportType(type);
        const userPrompt = buildReportPrompt(type, companyId, franchiseId, parameters);
        
        const conversation = aiService.openAiService.buildConversation(systemPrompt, userPrompt);
        
        // Generate content but skip DB operations
        const completion = await aiService.openAiService.createChatCompletion({
          messages: conversation,
          model: 'gpt-4o',
          temperature: 0.3,
          maxTokens: 2000,
          userId,
          companyId
        });
        
        const reportContent = completion.choices?.[0]?.message.content || 'No content generated';
        
        return res.status(206).json({
          success: true,
          data: {
            id: 'report-' + Date.now(),
            content: reportContent,
            createdAt: new Date()
          },
          warning: 'DB storage failed, returning AI content only',
          dbError: dbError instanceof Error ? dbError.message : String(dbError)
        });
      }
    } catch (error) {
      console.error('Error generating AI report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * @route GET /api/ai/reports/:id
 * @desc Get a report by ID
 * @access Private (requires authentication)
 */
router.get('/:id', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.companyGuard(),
  async (req, res) => {
    try {
      const reportId = req.params.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID is required'
        });
      }
      
      const report = await aiService.getReportById(reportId, companyId);
      
      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Report not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error retrieving AI report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve report',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

/**
 * @route GET /api/ai/reports
 * @desc List reports for a company
 * @access Private (requires authentication)
 */
router.get('/', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.companyGuard(),
  async (req, res) => {
    try {
      const companyId = req.user?.companyId;
      const type = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID is required'
        });
      }
      
      const reports = await aiService.listReports(companyId, type, limit);
      
      res.status(200).json({
        success: true,
        data: reports
      });
    } catch (error) {
      console.error('Error listing AI reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list reports',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
);

// Export router
export default router;