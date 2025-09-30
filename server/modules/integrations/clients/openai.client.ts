/**
 * OpenAI Integration Client
 * 
 * Client for OpenAI API integration.
 * Handles AI text generation, completions, and embeddings.
 */

import axios from 'axios';
import { BaseIntegrationClient } from './base-integration.client';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';

/**
 * OpenAI model types
 */
export enum OpenAIModel {
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_4 = 'gpt-4',
  GPT_3_5_TURBO = 'gpt-3.5-turbo'
}

/**
 * OpenAI Client for AI integrations
 */
export class OpenAIClient extends BaseIntegrationClient {
  private static readonly API_URL = 'https://api.openai.com/v1';

  /**
   * Initialize the OpenAI client
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.OPENAI, companyId, franchiseId);
  }

  /**
   * Initialize the OpenAI integration
   * @param apiKey OpenAI API key
   * @param organization Optional OpenAI organization ID
   * @param defaultModel Default model to use
   * @param userId User ID initializing the integration
   */
  async initialize(
    apiKey: string,
    organization?: string,
    defaultModel: OpenAIModel = OpenAIModel.GPT_3_5_TURBO,
    userId: string
  ): Promise<Integration> {
    try {
      // Check for existing integration
      const existingIntegration = await this.getIntegrationRecord();
      
      if (existingIntegration) {
        // Update existing integration
        const updatedIntegration = await this.updateIntegrationRecord(
          existingIntegration.id,
          {
            config: {
              apiKey,
              organization,
              defaultModel,
              lastConnectionCheck: new Date().toISOString()
            },
            isConnected: true,
            status: IntegrationStatus.ACTIVE
          },
          userId
        );
        
        return updatedIntegration || existingIntegration;
      }
      
      // Create new integration
      const integration = await this.createIntegrationRecord(
        {
          apiKey,
          organization,
          defaultModel,
          lastConnectionCheck: new Date().toISOString()
        },
        userId
      );
      
      // Verify connection
      const isConnected = await this.testConnection();
      
      if (isConnected) {
        await this.updateStatus(integration.id, IntegrationStatus.ACTIVE, userId);
      } else {
        await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        throw new Error('Failed to connect to OpenAI API');
      }
      
      return integration;
    } catch (error) {
      throw new Error(`Failed to initialize OpenAI integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Test the connection to OpenAI API
   */
  async testConnection(): Promise<boolean> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        return false;
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      const organization = config.organization;
      
      if (!apiKey) {
        return false;
      }
      
      // Build headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      if (organization) {
        headers['OpenAI-Organization'] = organization;
      }
      
      // Test connection by listing models
      const response = await axios.get(`${OpenAIClient.API_URL}/models`, { headers });
      
      const isConnected = response.status === 200;
      
      if (isConnected && integration) {
        await this.updateIntegrationRecord(
          integration.id,
          {
            isConnected: true,
            status: IntegrationStatus.ACTIVE,
            config: {
              ...config,
              lastConnectionCheck: new Date().toISOString()
            }
          },
          'system'
        );
      }
      
      return isConnected;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`OpenAI connection test failed: ${error.message}`);
      }
      
      const integration = await this.getIntegrationRecord();
      
      if (integration) {
        await this.updateIntegrationRecord(
          integration.id,
          {
            isConnected: false,
            status: IntegrationStatus.ERROR,
            config: {
              ...(integration.config as Record<string, any>),
              lastConnectionCheck: new Date().toISOString(),
              lastError: error instanceof Error ? error.message : String(error)
            }
          },
          'system'
        );
      }
      
      return false;
    }
  }

  /**
   * Get available models from OpenAI
   */
  async getModels(): Promise<any[]> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      const organization = config.organization;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      // Build headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      if (organization) {
        headers['OpenAI-Organization'] = organization;
      }
      
      const response = await axios.get(`${OpenAIClient.API_URL}/models`, { headers });
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get OpenAI models: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate text completions
   * @param prompt Text prompt
   * @param model OpenAI model to use
   * @param maxTokens Maximum tokens to generate
   * @param temperature Sampling temperature (0-2)
   */
  async createCompletion(
    prompt: string,
    model?: OpenAIModel,
    maxTokens: number = 256,
    temperature: number = 0.7
  ): Promise<string> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      const organization = config.organization;
      const defaultModel = config.defaultModel || OpenAIModel.GPT_3_5_TURBO;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      // Build headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      if (organization) {
        headers['OpenAI-Organization'] = organization;
      }
      
      // Create payload
      const payload = {
        model: model || defaultModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature
      };
      
      const response = await axios.post(
        `${OpenAIClient.API_URL}/chat/completions`,
        payload,
        { headers }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Failed to create OpenAI completion: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate text embeddings
   * @param input Text to embed
   * @param model Embedding model to use
   */
  async createEmbedding(
    input: string | string[],
    model: string = 'text-embedding-ada-002'
  ): Promise<number[][]> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      const organization = config.organization;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      // Build headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      if (organization) {
        headers['OpenAI-Organization'] = organization;
      }
      
      // Create payload
      const payload = {
        model,
        input
      };
      
      const response = await axios.post(
        `${OpenAIClient.API_URL}/embeddings`,
        payload,
        { headers }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data.data.map((item: any) => item.embedding);
    } catch (error) {
      throw new Error(`Failed to create OpenAI embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get estimated token usage and pricing
   * @param model Model to use
   * @param inputText Input text for which to calculate tokens
   */
  async estimateTokenUsage(model: OpenAIModel, inputText: string): Promise<{ tokens: number; cost: number }> {
    // Simple estimation - actual token count would require tokenizer
    const averageCharsPerToken = 4;
    const estimatedTokens = Math.ceil(inputText.length / averageCharsPerToken);
    
    // Approximate pricing per 1000 tokens (as of 2023)
    let ratePerThousandTokens = 0.002; // Default for GPT-3.5-turbo
    
    if (model === OpenAIModel.GPT_4) {
      ratePerThousandTokens = 0.06; // GPT-4 input price
    } else if (model === OpenAIModel.GPT_4_TURBO) {
      ratePerThousandTokens = 0.03; // GPT-4-turbo input price
    }
    
    const cost = (estimatedTokens / 1000) * ratePerThousandTokens;
    
    return {
      tokens: estimatedTokens,
      cost
    };
  }
}