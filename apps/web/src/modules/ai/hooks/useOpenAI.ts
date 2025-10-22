/**
 * useOpenAI Hook
 * 
 * Acest hook este utilizat pentru a interacționa cu API-ul OpenAI.
 * Oferă funcționalități pentru a verifica statusul cheii OpenAI și
 * pentru a trimite completări chat.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface OpenAIStatusResponse {
  success: boolean;
  data?: {
    integrated: boolean;
    model: string;
    usageStats?: {
      tokens: {
        total: number;
        available: number;
        used: number;
        usedPercentage: number;
      },
      requests: {
        total: number;
        thisMonth: number;
      }
    }
  };
  message?: string;
}

export interface ChatCompletionResponse {
  success: boolean;
  data?: {
    response: string;
    tokenUsage: {
      prompt: number;
      completion: number;
      total: number;
    }
  };
  message?: string;
}

// Verifică statusul conexiunii OpenAI
export const useOpenAIStatus = () => {
  return useMutation({
    mutationFn: async () => {
      return apiRequest('/api/ai/openai/status', {
        method: 'GET'
      });
    }
  });
};

// Trimite o cerere de chat completion
export const useChatCompletion = () => {
  return useMutation({
    mutationFn: async (message: string) => {
      return apiRequest('/api/ai/openai/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    }
  });
};