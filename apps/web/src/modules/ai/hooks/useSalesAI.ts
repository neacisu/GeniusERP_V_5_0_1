/**
 * useSalesAI Hook
 * 
 * Acest hook este utilizat pentru a interacționa cu API-ul Sales AI.
 * Oferă funcționalități pentru scoring leads, recomandări de vânzări,
 * și predicții de oportunități.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Tipuri pentru lead scoring
export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  source: string;
  score: number;
  probability: number;
  createdAt: string;
  estimatedValue: number;
  lastContactDate?: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
}

export interface LeadScoringResponse {
  success: boolean;
  data?: {
    leads: Lead[];
    totalCount: number;
    scoredLeads: number;
    highValueLeads: number;
  };
  message?: string;
}

export interface SalesInsightResponse {
  success: boolean;
  data?: {
    insights: Array<{
      id: string;
      title: string;
      description: string;
      type: 'opportunity' | 'risk' | 'optimization';
      priority: 'high' | 'medium' | 'low';
      createdAt: string;
      relatedTo?: string;
    }>;
  };
  message?: string;
}

export interface DealRecommendationResponse {
  success: boolean;
  data?: {
    recommendations: Array<{
      id: string;
      leadId: string;
      leadName: string;
      type: 'discount' | 'upsell' | 'cross_sell' | 'timing';
      description: string;
      suggestedAction: string;
      expectedOutcome: string;
      priority: 'high' | 'medium' | 'low';
      potentialValue: number;
      createdAt: string;
    }>;
  };
  message?: string;
}

// Hook pentru lead scoring - Obține și analizează leads
export const useLeadScoring = (filters?: { status?: string; minScore?: number; source?: string }) => {
  return useQuery<LeadScoringResponse>({
    queryKey: ['/api/ai/sales/leads', filters],
    staleTime: 5 * 60 * 1000, // 5 minute
    enabled: true,
    placeholderData: {
      success: true,
      data: {
        leads: [
          {
            id: '1',
            name: 'Alex Popescu',
            company: 'TechRo Solutions SRL',
            email: 'alex.popescu@techro.ro',
            phone: '+40721123456',
            source: 'website',
            score: 85,
            probability: 0.75,
            createdAt: '2025-03-29T14:30:00Z',
            estimatedValue: 12500,
            lastContactDate: '2025-04-05T09:15:00Z',
            status: 'qualified'
          },
          {
            id: '2',
            name: 'Maria Ionescu',
            company: 'Construct Expert SA',
            email: 'maria@constructexpert.ro',
            phone: '+40722987654',
            source: 'referral',
            score: 92,
            probability: 0.85,
            createdAt: '2025-03-25T11:45:00Z',
            estimatedValue: 28000,
            lastContactDate: '2025-04-08T14:30:00Z',
            status: 'proposal'
          },
          {
            id: '3',
            name: 'Cristian Dumitrescu',
            company: 'Agro Trading SRL',
            email: 'cristian.d@agrotrading.ro',
            phone: '+40723456789',
            source: 'linkedin',
            score: 68,
            probability: 0.55,
            createdAt: '2025-04-02T09:20:00Z',
            estimatedValue: 8500,
            lastContactDate: '2025-04-07T11:00:00Z',
            status: 'contacted'
          },
          {
            id: '4',
            name: 'Elena Stanescu',
            company: 'Medical Services SRL',
            email: 'elena.stanescu@medicalserv.ro',
            phone: '+40724123456',
            source: 'event',
            score: 78,
            probability: 0.65,
            createdAt: '2025-03-20T13:15:00Z',
            estimatedValue: 15000,
            lastContactDate: '2025-04-03T16:45:00Z',
            status: 'qualified'
          },
          {
            id: '5',
            name: 'Andrei Vasile',
            company: 'Digital Marketing Pro',
            email: 'andrei@digitalmpro.ro',
            source: 'website',
            score: 45,
            probability: 0.25,
            createdAt: '2025-04-05T10:30:00Z',
            estimatedValue: 5000,
            status: 'new'
          }
        ],
        totalCount: 5,
        scoredLeads: 5,
        highValueLeads: 2
      }
    }
  });
};

// Hook pentru obținerea recomandărilor de oportunități (deal recommendations)
export const useDealRecommendations = () => {
  return useQuery<DealRecommendationResponse>({
    queryKey: ['/api/ai/sales/recommendations'],
    staleTime: 5 * 60 * 1000, // 5 minute
    placeholderData: {
      success: true,
      data: {
        recommendations: [
          {
            id: '1',
            leadId: '2',
            leadName: 'Maria Ionescu - Construct Expert SA',
            type: 'upsell',
            description: 'Clientul are potențial pentru servicii de consultanță avansată',
            suggestedAction: 'Propune pachetul de servicii premium în timpul negocierii',
            expectedOutcome: 'Creștere a valorii comenzii cu 20-30%',
            priority: 'high',
            potentialValue: 7500,
            createdAt: '2025-04-09T08:30:00Z'
          },
          {
            id: '2',
            leadId: '1',
            leadName: 'Alex Popescu - TechRo Solutions SRL',
            type: 'cross_sell',
            description: 'Clientul poate beneficia de servicii complementare',
            suggestedAction: 'Prezintă modulul de raportare avansată împreună cu soluția de bază',
            expectedOutcome: 'Vânzare suplimentară de 3500 RON',
            priority: 'medium',
            potentialValue: 3500,
            createdAt: '2025-04-08T15:45:00Z'
          },
          {
            id: '3',
            leadId: '4',
            leadName: 'Elena Stanescu - Medical Services SRL',
            type: 'timing',
            description: 'Vânzare sezonieră potențială',
            suggestedAction: 'Propune încheierea contractului înainte de sfârșitul trimestrului pentru beneficii fiscale',
            expectedOutcome: 'Reducerea ciclului de vânzare cu 3 săptămâni',
            priority: 'medium',
            potentialValue: 0,
            createdAt: '2025-04-07T11:20:00Z'
          },
          {
            id: '4',
            leadId: '3',
            leadName: 'Cristian Dumitrescu - Agro Trading SRL',
            type: 'discount',
            description: 'Lead sensibil la preț, dar cu potențial de loialitate ridicat',
            suggestedAction: 'Oferă un discount de 5% cu condiția unui contract pe 12 luni',
            expectedOutcome: 'Creșterea probabilității de conversie cu 30%',
            priority: 'low',
            potentialValue: -425,
            createdAt: '2025-04-06T09:15:00Z'
          }
        ]
      }
    }
  });
};

// Hook pentru accesarea insights-urilor de vânzări generate de AI
export const useSalesInsights = () => {
  return useQuery<SalesInsightResponse>({
    queryKey: ['/api/ai/sales/insights'],
    staleTime: 10 * 60 * 1000, // 10 minute
    placeholderData: {
      success: true,
      data: {
        insights: [
          {
            id: '1',
            title: 'Oportunitate în sectorul tech',
            description: 'Analiza datelor indică o creștere de 25% a interacțiunilor cu leads din sectorul tech în ultimele 30 de zile.',
            type: 'opportunity',
            priority: 'high',
            createdAt: '2025-04-10T09:30:00Z'
          },
          {
            id: '2',
            title: 'Scădere în rata de conversie',
            description: 'Rata de conversie a scăzut cu 8% pentru leads din canalul social media în ultimele 2 săptămâni.',
            type: 'risk',
            priority: 'medium',
            createdAt: '2025-04-09T14:15:00Z'
          },
          {
            id: '3',
            title: 'Eficiență îmbunătățită cu follow-up rapid',
            description: 'Leads contactați în primele 4 ore au o rată de conversie cu 40% mai mare decât media.',
            type: 'optimization',
            priority: 'high',
            createdAt: '2025-04-08T11:45:00Z'
          },
          {
            id: '4',
            title: 'Segment de piață emergent',
            description: 'Analiză predictivă indică oportunități crescute în sectorul de servicii medicale pentru Q3 2025.',
            type: 'opportunity',
            priority: 'medium',
            createdAt: '2025-04-07T16:30:00Z'
          }
        ]
      }
    }
  });
};

// Hook pentru a genera un scoring de lead
export const useGenerateLeadScoring = () => {
  return useMutation({
    mutationFn: async (leadData: any) => {
      return apiRequest('/api/ai/sales/score-lead', {
        method: 'POST',
        body: JSON.stringify(leadData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/sales/leads'] });
    }
  });
};