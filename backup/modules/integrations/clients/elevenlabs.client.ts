/**
 * ElevenLabs Integration Client
 * 
 * Client for ElevenLabs API integration.
 * Handles text-to-speech generation with high-quality voices.
 */

import axios from 'axios';
import { BaseIntegrationClient } from './base-integration.client';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';

/**
 * ElevenLabs voice options
 */
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
}

/**
 * ElevenLabs TTS models
 */
export enum ElevenLabsModel {
  ELEVEN_MULTILINGUAL_V2 = 'eleven_multilingual_v2',
  ELEVEN_MONOLINGUAL_V1 = 'eleven_monolingual_v1'
}

/**
 * ElevenLabs voice optimization options
 */
export enum ElevenLabsOptimization {
  QUALITY = 0,
  PERFORMANCE = 1
}

/**
 * ElevenLabs Client for text-to-speech integration
 */
export class ElevenLabsClient extends BaseIntegrationClient {
  private static readonly API_URL = 'https://api.elevenlabs.io/v1';

  /**
   * Initialize the ElevenLabs client
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.ELEVENLABS, companyId, franchiseId);
  }

  /**
   * Initialize the ElevenLabs integration
   * @param apiKey ElevenLabs API key
   * @param defaultVoiceId Optional default voice ID
   * @param userId User ID initializing the integration
   */
  async initialize(
    apiKey: string,
    defaultVoiceId?: string,
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
              defaultVoiceId,
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
          defaultVoiceId,
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
        throw new Error('Failed to connect to ElevenLabs API');
      }
      
      return integration;
    } catch (error) {
      throw new Error(`Failed to initialize ElevenLabs integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Test the connection to ElevenLabs API
   */
  async testConnection(): Promise<boolean> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        return false;
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      
      if (!apiKey) {
        return false;
      }
      
      // Test connection by retrieving user info
      const response = await axios.get(`${ElevenLabsClient.API_URL}/user`, {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
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
        console.error(`ElevenLabs connection test failed: ${error.message}`);
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
   * Get available voices
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      const response = await axios.get(`${ElevenLabsClient.API_URL}/voices`, {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data.voices;
    } catch (error) {
      throw new Error(`Failed to get ElevenLabs voices: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get user subscription information
   */
  async getUserInfo(): Promise<any> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      const response = await axios.get(`${ElevenLabsClient.API_URL}/user/subscription`, {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get ElevenLabs user info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert text to speech
   * @param text Text to convert to speech
   * @param voiceId Voice ID to use (if not provided, uses default)
   * @param model TTS model to use
   * @param optimization Voice optimization setting (0 = quality, 1 = performance)
   * @param stability Voice stability (0-1)
   * @param similarityBoost Voice similarity boost (0-1)
   * @returns Audio data as ArrayBuffer
   */
  async textToSpeech(
    text: string,
    voiceId?: string,
    model: ElevenLabsModel = ElevenLabsModel.ELEVEN_MULTILINGUAL_V2,
    optimization: ElevenLabsOptimization = ElevenLabsOptimization.QUALITY,
    stability: number = 0.5,
    similarityBoost: number = 0.75
  ): Promise<ArrayBuffer> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      const defaultVoiceId = config.defaultVoiceId;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      const selectedVoiceId = voiceId || defaultVoiceId;
      
      if (!selectedVoiceId) {
        throw new Error('No voice ID provided or configured');
      }
      
      const payload = {
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost
        },
        optimize_streaming_latency: optimization
      };
      
      const response = await axios.post(
        `${ElevenLabsClient.API_URL}/text-to-speech/${selectedVoiceId}`,
        payload,
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer'
        }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to convert text to speech: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get voice settings
   * @param voiceId Voice ID
   */
  async getVoiceSettings(voiceId: string): Promise<any> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      const response = await axios.get(
        `${ElevenLabsClient.API_URL}/voices/${voiceId}/settings`,
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get voice settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<any[]> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const apiKey = config.apiKey;
      
      if (!apiKey) {
        throw new Error('API key not configured');
      }
      
      const response = await axios.get(
        `${ElevenLabsClient.API_URL}/models`,
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      await this.updateLastSynced(integration.id, 'system');
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get models: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Convert text to speech in streaming mode
   * @param text Text to convert to speech
   * @param voiceId Voice ID to use (if not provided, uses default)
   * @param model TTS model to use
   * @param optimization Voice optimization setting (0 = quality, 1 = performance)
   * @param stability Voice stability (0-1)
   * @param similarityBoost Voice similarity boost (0-1)
   * @returns URL for streaming audio
   */
  async getTextToSpeechStreamingUrl(
    text: string,
    voiceId?: string,
    model: ElevenLabsModel = ElevenLabsModel.ELEVEN_MULTILINGUAL_V2,
    optimization: ElevenLabsOptimization = ElevenLabsOptimization.QUALITY,
    stability: number = 0.5,
    similarityBoost: number = 0.75
  ): Promise<string> {
    const integration = await this.getIntegrationRecord();
    
    if (!integration || !integration.config) {
      throw new Error('Integration not configured');
    }
    
    const config = integration.config as Record<string, any>;
    const apiKey = config.apiKey;
    const defaultVoiceId = config.defaultVoiceId;
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }
    
    const selectedVoiceId = voiceId || defaultVoiceId;
    
    if (!selectedVoiceId) {
      throw new Error('No voice ID provided or configured');
    }
    
    // Build streaming URL
    const params = new URLSearchParams({
      text: encodeURIComponent(text),
      model_id: model,
      optimize_streaming_latency: optimization.toString(),
      stability: stability.toString(),
      similarity_boost: similarityBoost.toString(),
      key: apiKey
    });
    
    return `${ElevenLabsClient.API_URL}/text-to-speech/${selectedVoiceId}/stream?${params.toString()}`;
  }
}