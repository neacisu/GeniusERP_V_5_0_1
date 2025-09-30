/**
 * useProductQA Hook
 * 
 * Acest hook este utilizat pentru a interacționa cu API-ul Product QA.
 * Oferă funcționalități pentru analiza informațiilor despre produse,
 * generarea de descrieri, răspunsuri la întrebări și compatibilitate.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Tipuri pentru Product QA
export interface ProductQuestion {
  id: string;
  productId: string;
  productName: string;
  question: string;
  answer?: string;
  status: 'pending' | 'answered' | 'reviewed';
  source: 'customer' | 'internal' | 'ai_generated';
  createdAt: string;
  answeredAt?: string;
  confidence?: number;
  category: 'specifications' | 'compatibility' | 'usage' | 'pricing' | 'other';
}

export interface ProductQuestionsResponse {
  success: boolean;
  data?: {
    questions: ProductQuestion[];
    totalCount: number;
    pendingCount: number;
    answeredCount: number;
  };
  message?: string;
}

export interface ProductDescriptionResponse {
  success: boolean;
  data?: {
    productId: string;
    description: string;
    keyFeatures: string[];
    specifications: Record<string, string>;
    seoDescription: string;
    seoKeywords: string[];
    variants?: Array<{
      id: string;
      name: string;
      description: string;
    }>;
  };
  message?: string;
}

export interface ProductCompatibilityResponse {
  success: boolean;
  data?: {
    productId: string;
    compatibleWith: Array<{
      productId: string;
      productName: string;
      compatibilityScore: number;
      notes?: string;
    }>;
    notCompatibleWith: Array<{
      productId: string;
      productName: string;
      reason: string;
    }>;
  };
  message?: string;
}

export interface ProductAnswerResponse {
  success: boolean;
  data?: {
    questionId: string;
    answer: string;
    confidence: number;
    sources: string[];
    alternatives?: string[];
  };
  message?: string;
}

// Hook pentru obținerea întrebărilor despre produse
export const useProductQuestions = (filters?: { status?: string; category?: string; productId?: string }) => {
  return useQuery<ProductQuestionsResponse>({
    queryKey: ['/api/ai/products/questions', filters],
    staleTime: 2 * 60 * 1000, // 2 minute
    placeholderData: {
      success: true,
      data: {
        questions: [
          {
            id: '1',
            productId: 'prod-001',
            productName: 'Sistem contabilitate PRO',
            question: 'Sistemul este compatibil cu normele ANAF pentru anul 2025?',
            answer: 'Da, Sistemul contabilitate PRO este actualizat continuu și este complet compatibil cu normele ANAF pentru 2025, inclusiv noile cerințe pentru raportare digitală și e-Factura.',
            status: 'answered',
            source: 'customer',
            createdAt: '2025-04-05T10:15:00Z',
            answeredAt: '2025-04-05T14:30:00Z',
            confidence: 0.95,
            category: 'compatibility'
          },
          {
            id: '2',
            productId: 'prod-001',
            productName: 'Sistem contabilitate PRO',
            question: 'Câte companii pot fi administrate într-un singur cont?',
            answer: 'În versiunea standard puteți administra până la 5 companii diferite. Pentru versiunea Enterprise, numărul este nelimitat și include funcționalități suplimentare de consolidare.',
            status: 'answered',
            source: 'customer',
            createdAt: '2025-04-06T09:20:00Z',
            answeredAt: '2025-04-06T11:45:00Z',
            confidence: 0.92,
            category: 'specifications'
          },
          {
            id: '3',
            productId: 'prod-002',
            productName: 'Modul Salarizare Avantaj',
            question: 'Este posibilă generarea automată a declarației 112?',
            status: 'pending',
            source: 'customer',
            createdAt: '2025-04-10T08:30:00Z',
            category: 'specifications'
          },
          {
            id: '4',
            productId: 'prod-003',
            productName: 'Aplicație Mobile ERP',
            question: 'Ce sisteme de operare mobile sunt suportate?',
            answer: 'Aplicația Mobile ERP funcționează pe iOS (versiunea 15 sau mai nouă) și Android (versiunea 10 sau mai nouă). Interfața este optimizată atât pentru telefoane cât și pentru tablete.',
            status: 'answered',
            source: 'internal',
            createdAt: '2025-04-07T15:45:00Z',
            answeredAt: '2025-04-07T16:20:00Z',
            confidence: 0.99,
            category: 'compatibility'
          },
          {
            id: '5',
            productId: 'prod-001',
            productName: 'Sistem contabilitate PRO',
            question: 'Se poate face upgrade de la versiunea Standard la Enterprise fără pierdere de date?',
            status: 'pending',
            source: 'customer',
            createdAt: '2025-04-09T11:10:00Z',
            category: 'pricing'
          }
        ],
        totalCount: 5,
        pendingCount: 2,
        answeredCount: 3
      }
    }
  });
};

// Hook pentru generarea descrierilor de produse
export const useGenerateProductDescription = () => {
  return useMutation({
    mutationFn: async (productData: { productId: string; name: string; category: string; features: string[] }) => {
      return apiRequest('/api/ai/products/generate-description', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    }
  });
};

// Hook pentru analiza compatibilității produselor
export const useProductCompatibility = (productId: string) => {
  return useQuery<ProductCompatibilityResponse>({
    queryKey: ['/api/ai/products/compatibility', productId],
    enabled: Boolean(productId),
    staleTime: 60 * 60 * 1000, // 1 oră
  });
};

// Hook pentru generarea de răspunsuri la întrebări despre produse
export const useGenerateProductAnswer = () => {
  return useMutation({
    mutationFn: async (questionData: { questionId: string; productId: string; question: string }) => {
      return apiRequest('/api/ai/products/answer-question', {
        method: 'POST',
        body: JSON.stringify(questionData)
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/products/questions'] });
    }
  });
};