/**
 * OpenAI Configuration
 * 
 * This file provides a centralized configuration for OpenAI integration in the GeniusERP v.2 AI module.
 * It includes:
 * - API key management for OpenAI services
 * - Model selection and configuration
 * - Default parameters for different AI use cases
 * - Utility functions for working with the OpenAI API
 * 
 * Note: This file prepares for the integration of the OpenAI SDK, which will be installed via:
 * npm install openai --save
 */

import dotenv from 'dotenv';
dotenv.config();

// Configuration interface for OpenAI
export interface OpenAiConfig {
  apiKey: string;
  organization?: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  baseUrl?: string;
}

// Default configuration
export const defaultOpenAiConfig: OpenAiConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  organization: process.env.OPENAI_ORGANIZATION,
  defaultModel: 'gpt-4o',
  maxTokens: 1000,
  temperature: 0.7,
  baseUrl: process.env.OPENAI_API_BASE_URL
};

// Use case specific configurations
export const useCaseConfigs = {
  salesAssistant: {
    ...defaultOpenAiConfig,
    model: 'gpt-4o',
    temperature: 0.5,
    maxTokens: 800,
    systemPrompt: 'You are a sales assistant for GeniusERP, analyzing customer data and providing insights to sales representatives.'
  },
  inboxAssistant: {
    ...defaultOpenAiConfig,
    model: 'gpt-4o',
    temperature: 0.6,
    maxTokens: 1200,
    systemPrompt: 'You are an assistant helping to manage email communications. Analyze the content, categorize messages, and suggest responses.'
  },
  productQa: {
    ...defaultOpenAiConfig,
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 1500,
    systemPrompt: 'You are a product specialist answering questions about products in our catalog. Provide accurate information based on product documentation.'
  },
  documentAnalysis: {
    ...defaultOpenAiConfig,
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 2000,
    systemPrompt: 'You are analyzing business documents. Extract key information, identify important details, and summarize content.'
  }
};

/**
 * Validates if the OpenAI configuration is complete and valid
 * @param config OpenAI configuration object
 * @returns Boolean indicating if config is valid
 */
export function validateOpenAiConfig(config: OpenAiConfig): boolean {
  if (!config.apiKey || config.apiKey.trim() === '') {
    console.error('OpenAI API key is missing. Set OPENAI_API_KEY in environment variables.');
    return false;
  }
  
  return true;
}

/**
 * Creates a message template for conversation history
 */
export function createMessageTemplate(role: 'system' | 'user' | 'assistant', content: string) {
  return { role, content };
}

/**
 * Returns a configuration specific to a use case
 * @param useCase The AI use case
 * @returns OpenAI configuration for that use case
 */
export function getConfigForUseCase(useCase: keyof typeof useCaseConfigs): typeof useCaseConfigs[keyof typeof useCaseConfigs] {
  return useCaseConfigs[useCase] || defaultOpenAiConfig;
}

/**
 * Placeholder for OpenAI client creation
 * Will be implemented when the openai package is installed
 */
export function createOpenAiClient() {
  console.log('OpenAI client creation placeholder - waiting for actual SDK installation');
  // Once the OpenAI SDK is installed, this will be implemented as:
  // return new OpenAI(defaultOpenAiConfig);
  return null;
}