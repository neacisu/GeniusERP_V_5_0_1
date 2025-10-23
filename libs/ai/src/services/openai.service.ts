/**
 * OpenAI Service
 * 
 * This service provides a unified interface for interacting with OpenAI APIs
 * across different modules and use cases in the GeniusERP v.2 system.
 * 
 * It handles:
 * - API client management and configuration
 * - Authentication and API key handling
 * - Prompt construction and optimization
 * - Response processing and error handling
 * - Usage tracking and monitoring
 */

import AuditService from '../../../audit/src/services/audit.service';
import { 
  OpenAiConfig, 
  defaultOpenAiConfig,
  validateOpenAiConfig,
  useCaseConfigs,
  createMessageTemplate
} from '../config/openai.config';
import OpenAI from 'openai';

// Types for message management
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Type for completion request parameters
interface CompletionParams {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userId: string;
  companyId: string;
}

/**
 * OpenAI Service class for managing AI interactions
 */
export class OpenAiService {
  private config: OpenAiConfig;
  private isConfigValid: boolean;
  private openaiClient: OpenAI | null = null;
  
  /**
   * Creates an instance of OpenAIService
   */
  constructor(
    // private drizzleService: DrizzleService // TODO: Use for database operations
  ) {
    this.config = defaultOpenAiConfig;
    this.isConfigValid = validateOpenAiConfig(this.config);
    
    if (this.isConfigValid) {
      this.initializeOpenAiClient();
    } else {
      console.warn(
        'OpenAI service initialized with invalid configuration. ' +
        'Please set OPENAI_API_KEY in environment variables.'
      );
    }
  }
  
  /**
   * Initialize the OpenAI client
   */
  private initializeOpenAiClient(): void {
    try {
      this.openaiClient = new OpenAI({
        apiKey: this.config.apiKey,
        organization: this.config.organization,
        baseURL: this.config.baseUrl
      });
      console.log('OpenAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      this.openaiClient = null;
    }
  }
  
  /**
   * Update the service configuration
   */
  public updateConfig(newConfig: Partial<OpenAiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.isConfigValid = validateOpenAiConfig(this.config);
    
    if (this.isConfigValid) {
      this.initializeOpenAiClient();
    }
  }
  
  /**
   * Get a configuration specific to a use case
   */
  public getConfigForUseCase(useCase: keyof typeof useCaseConfigs): OpenAiConfig {
    return useCaseConfigs[useCase] as OpenAiConfig;
  }
  
  /**
   * Create a chat completion request
   */
  public async createChatCompletion(params: CompletionParams): Promise<any> {
    if (!this.isConfigValid) {
      throw new Error('OpenAI configuration is invalid. Please set OPENAI_API_KEY.');
    }
    
    try {
      // Log the attempt to use OpenAI
      await AuditService.log({
        action: 'AI_REQUEST',
        entity: 'AI_MODEL',
        entityId: params.model || this.config.defaultModel,
        userId: params.userId,
        companyId: params.companyId,
        details: {
          model: params.model || this.config.defaultModel,
          messageCount: params.messages.length,
          useCase: 'chat_completion'
        }
      });
      
      // Check if the OpenAI client is initialized
      if (!this.openaiClient) {
        console.log('OpenAI client not initialized, using placeholder response');
        
        // Return a placeholder response
        return {
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: params.model || this.config.defaultModel,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: 'This is a placeholder response. OpenAI client failed to initialize properly.'
              },
              finish_reason: 'placeholder'
            }
          ],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };
      }
      
      // Make the actual API call
      const completion = await this.openaiClient.chat.completions.create({
        model: params.model || this.config.defaultModel,
        messages: params.messages,
        temperature: params.temperature || this.config.temperature,
        max_tokens: params.maxTokens || this.config.maxTokens
      });
      
      // Log token usage
      await AuditService.log({
        action: 'AI_RESPONSE',
        entity: 'AI_MODEL',
        entityId: params.model || this.config.defaultModel,
        userId: params.userId,
        companyId: params.companyId,
        details: {
          model: params.model || this.config.defaultModel,
          tokens: completion.usage?.total_tokens || 0,
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0
        }
      });
      
      return completion;
      
    } catch (error) {
      console.error('Error creating chat completion:', error);
      
      // Log the error
      await AuditService.log({
        action: 'AI_REQUEST_ERROR',
        entity: 'AI_MODEL',
        entityId: params.model || this.config.defaultModel,
        userId: params.userId,
        companyId: params.companyId,
        details: {
          error: error instanceof Error ? error.message : String(error),
          model: params.model || this.config.defaultModel
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Helper to build a simple conversation with system, user and optional assistant messages
   */
  public buildConversation(
    systemPrompt: string,
    userPrompt: string,
    assistantContext?: string
  ): Message[] {
    const messages: Message[] = [
      createMessageTemplate('system', systemPrompt),
      createMessageTemplate('user', userPrompt)
    ];
    
    if (assistantContext) {
      messages.push(createMessageTemplate('assistant', assistantContext));
    }
    
    return messages;
  }
  
  /**
   * Check if the service is ready to use (has valid config)
   */
  public isReady(): boolean {
    return this.isConfigValid;
  }
  
  /**
   * Get API key status (masked for security)
   */
  public getApiKeyStatus(): string {
    if (!this.config.apiKey) return 'Missing';
    if (this.config.apiKey.length < 8) return 'Invalid';
    
    // Mask the API key for security
    const start = this.config.apiKey.substring(0, 3);
    const end = this.config.apiKey.substring(this.config.apiKey.length - 3);
    return `Valid (${start}...${end})`;
  }
}