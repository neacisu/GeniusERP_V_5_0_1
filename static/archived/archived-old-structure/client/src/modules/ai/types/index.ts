/**
 * Tipuri comune pentru modulul AI
 */

// Formatul standard pentru răspunsurile API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// Tipuri pentru AI Reports
export interface AIReport {
  id: string;
  name: string;
  type: string;
  description?: string;
  content: string;
  parameters?: Record<string, any>;
  userId: string;
  companyId: string;
  franchiseId?: string;
  createdAt: string;
  updatedAt?: string;
  status: 'completed' | 'processing' | 'failed';
}

export type ReportType = 
  | 'financial_summary'
  | 'sales_performance'
  | 'inventory_analysis'
  | 'customer_insights'
  | 'market_trends';

export interface ReportRequest {
  type: ReportType;
  name: string;
  description?: string;
  franchiseId?: string;
  parameters?: {
    period?: string;
    focusAreas?: string[];
    metrics?: string[];
    compareWith?: string;
    [key: string]: any;
  };
}

// Tipuri pentru Sales AI
export interface LeadScore {
  leadId: string;
  score: number; // 0-100
  probability: number; // 0-1
  factors: {
    name: string;
    impact: number; // -3 to +3
    description: string;
  }[];
  recommendations: string[];
  createdAt: string;
}

export interface DealRecommendation {
  dealId: string;
  customerId: string;
  recommendations: {
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  nextSteps: string[];
  createdAt: string;
}

export interface DealOutcomePrediction {
  dealId: string;
  probability: number; // 0-1
  estimatedValue: number;
  estimatedCloseDate: string;
  factors: {
    name: string;
    impact: number; // -3 to +3
    description: string;
  }[];
  createdAt: string;
}

export interface FollowUpTiming {
  customerId: string;
  optimalTiming: string;
  reasoning: string;
  suggestedDates: string[];
  createdAt: string;
}

// Tipuri pentru Inbox AI
export interface EmailAnalysis {
  messageId: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  intent: string;
  urgency: 'high' | 'medium' | 'low';
  actionItems: string[];
  entities: {
    name: string;
    type: string;
    value: string;
  }[];
  createdAt: string;
}

export interface ResponseSuggestion {
  messageId: string;
  suggestions: {
    type: string;
    text: string;
  }[];
  createdAt: string;
}

export interface CompleteResponse {
  messageId: string;
  response: string;
  createdAt: string;
}

export interface FollowUpReminder {
  messageId: string;
  reminder: {
    dueDate: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  };
  createdAt: string;
}

// Tipuri pentru Product QA
export interface ProductAnswer {
  question: string;
  answer: string;
  productId?: string;
  confidence: number; // 0-1
  sources: string[];
  relatedQuestions: string[];
  createdAt: string;
}

export interface ProductComparison {
  productIds: string[];
  comparison: {
    category: string;
    features: {
      name: string;
      values: Record<string, any>;
    }[];
  }[];
  recommendation: string;
  createdAt: string;
}

export interface DocumentationSearchResult {
  query: string;
  results: {
    title: string;
    content: string;
    relevance: number; // 0-1
    source: string;
    url?: string;
  }[];
  createdAt: string;
}

export interface UsageSuggestion {
  productId: string;
  featureId?: string;
  suggestions: {
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }[];
  bestPractices: string[];
  createdAt: string;
}

// Tipuri pentru OpenAI
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finishReason: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: string;
}

export interface ContentAnalysisRequest {
  content: string;
  type: 'text' | 'document';
  analysisTypes: ('sentiment' | 'entities' | 'keywords' | 'summary' | 'topics')[];
}

export interface ContentAnalysisResponse {
  id: string;
  results: {
    type: string;
    data: any;
  }[];
  createdAt: string;
}