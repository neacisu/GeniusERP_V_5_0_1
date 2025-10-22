/**
 * AI Service
 * 
 * This service provides a centralized interface for AI-related functionality,
 * leveraging the OpenAI service for generating reports, insights, and contextual assistance.
 * It handles report generation, storage, and retrieval with Drizzle ORM.
 */

import { DrizzleService } from "@common/drizzle";
import { OpenAiService } from './openai.service';
import AuditService from '../../audit/services/audit.service';
import { createId } from '../../../utils/id';
import { analyticsReports, reportExecutionHistory } from '../../analytics/schema/analytics.schema';
import { sql } from 'drizzle-orm';

/**
 * Report generation parameters
 */
export interface ReportGenerationParams {
  companyId: string;
  franchiseId?: string;
  type: string;
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  userId: string;
}

/**
 * Report result interface
 */
export interface ReportResult {
  id: string;
  content: string;
  metrics?: Record<string, any>;
  createdAt: Date;
}

/**
 * AI Service class for AI-related functionality
 */
export class AIService {
  public openAiService: OpenAiService;
  
  /**
   * Creates an instance of AIService
   */
  constructor(
    public drizzleService: DrizzleService
  ) {
    this.openAiService = new OpenAiService(drizzleService);
    
    // DrizzleService is already properly typed and initialized
    // No need for additional property mapping
    
    // Check if DB is actually available and log status
    const dbAvailable = !!this.drizzleService?.db;
    console.log(`AIService initialized. Database ${dbAvailable ? 'is available' : 'is NOT available'}`);
  }
  
  /**
   * Generate a report using AI
   * @param params Report generation parameters
   * @returns The generated report result
   */
  async generateReport(params: ReportGenerationParams): Promise<ReportResult> {
    const {
      companyId,
      franchiseId,
      type,
      name,
      description,
      parameters,
      userId
    } = params;
    
    const startTime = Date.now();
    
    try {
      // Log the report generation attempt
      await AuditService.log({
        action: 'REPORT_GENERATION_STARTED',
        entity: 'ANALYTICS_REPORT',
        entityId: 'new',
        userId: userId,
        companyId: companyId,
        details: {
          reportType: type,
          franchiseId: franchiseId || null,
          parameters: parameters || {}
        }
      });
      
      // Prepare the prompt based on report type
      const systemPrompt = this.getSystemPromptForReportType(type);
      const userPrompt = this.buildReportPrompt(type, companyId, franchiseId, parameters);
      
      // Build conversation for OpenAI
      const conversation = this.openAiService.buildConversation(
        systemPrompt,
        userPrompt
      );
      
      // Generate the report content using OpenAI
      const completion = await this.openAiService.createChatCompletion({
        messages: conversation,
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 2000,
        userId,
        companyId
      });
      
      // Extract the report content
      const reportContent = completion.choices[0]?.message.content || 'No content generated';
      
      // Create report ID
      const reportId = createId();
      
      // Check if the database is available
      if (!this.drizzleService?.db) {
        console.log('Database not available, returning content only without persistence');
        
        await AuditService.log({
          action: 'REPORT_GENERATION_COMPLETED',
          entity: 'ANALYTICS_REPORT',
          entityId: reportId,
          userId: userId,
          companyId: companyId,
          details: {
            reportType: type,
            executionTime: Date.now() - startTime,
            contentLength: reportContent.length,
            dbStorageSkipped: true
          }
        });
        
        return {
          id: reportId,
          content: reportContent,
          createdAt: new Date(),
          metrics: {
            dbStorageSkipped: true,
            executionTime: Date.now() - startTime
          }
        };
      }
      
      try {
        // Store the report in the database
        await this.drizzleService.db.insert(analyticsReports).values({
          id: reportId,
          companyId: companyId,
          name: name,
          description: description || `AI-generated ${type} report`,
          type: type as any, // Cast to any since we're assuming the type exists
          parameters: parameters ? JSON.stringify(parameters) : null,
          result: reportContent,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
          isPublic: false
        });
        
        // Calculate execution time
        const executionTime = Date.now() - startTime;
        
        // Store execution history
        await this.drizzleService.db.insert(reportExecutionHistory).values({
          id: createId(),
          reportId: reportId,
          companyId: companyId,
          executedBy: userId,
          executedAt: new Date(),
          parameters: parameters ? JSON.stringify(parameters) : null,
          result: reportContent,
          executionTime: executionTime,
          status: 'SUCCESS',
          errorMessage: null
        });
        
        // Log successful generation
        await AuditService.log({
          action: 'REPORT_GENERATION_COMPLETED',
          entity: 'ANALYTICS_REPORT',
          entityId: reportId,
          userId: userId,
          companyId: companyId,
          details: {
            reportType: type,
            executionTime,
            contentLength: reportContent.length
          }
        });
        
      } catch (dbError) {
        console.error('Database operation failed during report generation:', dbError);
        
        // Still return the content even if DB operations fail
        await AuditService.log({
          action: 'REPORT_DB_ERROR',
          entity: 'ANALYTICS_REPORT',
          entityId: reportId,
          userId: userId,
          companyId: companyId,
          details: {
            reportType: type,
            error: dbError instanceof Error ? dbError.message : String(dbError)
          }
        });
        
        return {
          id: reportId,
          content: reportContent,
          createdAt: new Date(),
          metrics: {
            dbError: true,
            errorMessage: dbError instanceof Error ? dbError.message : String(dbError)
          }
        };
      }
      
      return {
        id: reportId,
        content: reportContent,
        createdAt: new Date()
      };
      
    } catch (error) {
      // Log the error
      await AuditService.log({
        action: 'REPORT_GENERATION_FAILED',
        entity: 'ANALYTICS_REPORT',
        entityId: 'failed',
        userId: userId,
        companyId: companyId,
        details: {
          reportType: type,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      // Only try to store execution history if database is available
      if (this.drizzleService?.db) {
        try {
          // Calculate execution time even for failures
          const executionTime = Date.now() - startTime;
          const reportId = createId();
          
          // Store execution history for failed attempt
          await this.drizzleService.db.insert(reportExecutionHistory).values({
            id: createId(),
            reportId: reportId,
            companyId: companyId,
            executedBy: userId,
            executedAt: new Date(),
            parameters: parameters ? JSON.stringify(parameters) : null,
            result: null,
            executionTime: executionTime,
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : String(error)
          });
        } catch (dbError) {
          console.error('Failed to log error to database:', dbError);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Get system prompt for a specific report type
   * @param reportType The type of report
   * @returns The system prompt
   */
  private getSystemPromptForReportType(reportType: string): string {
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
  
  /**
   * Build a report prompt based on parameters
   * @param type Report type
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   * @param parameters Optional additional parameters
   * @returns The constructed prompt
   */
  private buildReportPrompt(
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
   * Get a report by ID
   * @param reportId Report ID
   * @param companyId Company ID
   * @returns The report or null if not found
   */
  async getReportById(reportId: string, companyId: string): Promise<any | null> {
    // Check if database is available
    if (!this.drizzleService?.db) {
      console.log(`Database not available, cannot retrieve report ${reportId}`);
      return null;
    }
    
    try {
      const report = await this.drizzleService.db.select()
        .from(analyticsReports)
        .where(sql`${analyticsReports.id} = ${reportId} AND ${analyticsReports.companyId} = ${companyId}`)
        .limit(1);
      
      return report.length > 0 ? report[0] : null;
    } catch (error) {
      console.error(`Error retrieving report ${reportId}:`, error);
      return null;
    }
  }
  
  /**
   * List reports for a company
   * @param companyId Company ID
   * @param type Optional report type filter
   * @param limit Optional result limit
   * @returns List of reports
   */
  async listReports(companyId: string, type?: string, limit: number = 10): Promise<any[]> {
    // Check if database is available
    if (!this.drizzleService?.db) {
      console.log(`Database not available, cannot list reports for company ${companyId}`);
      return [];
    }
    
    try {
      // Create base query
      let query = this.drizzleService.db.select()
        .from(analyticsReports)
        .where(sql`${analyticsReports.companyId} = ${companyId}`);
      
      // Add type filter if specified
      if (type) {
        query = query.where(sql`${analyticsReports.type} = ${type}`);
      }
      
      // Execute the query with ordering and limit
      const reports = await query
        .orderBy(sql`${analyticsReports.createdAt} desc`)
        .limit(limit);
      
      return reports;
    } catch (error) {
      console.error(`Error listing reports for company ${companyId}:`, error);
      return [];
    }
  }
}
