/**
 * useAIStats Hook
 * 
 * Acest hook oferă statistici și date de ansamblu pentru modulul AI.
 * Datele sunt folosite pentru a afișa statistici în pagina de dashboard
 * și pentru a arăta progresul și utilizarea funcționalităților AI.
 */

import { useQuery } from "@tanstack/react-query";

export interface AIStatsResponse {
  success: boolean;
  data?: {
    summary: {
      totalReports: number;
      activeAlerts: number;
      totalQueries: number;
      completionTokensUsed: number;
      averageResponseTime: number;
    };
    reports: {
      total: number;
      generated: number;
      viewed: number;
      byType: Record<string, number>;
    };
    leads: {
      scored: number;
      highValue: number;
      recommendations: number;
      conversionRate: number;
    };
    emails: {
      analyzed: number;
      responded: number;
      categoryBreakdown: Record<string, number>;
      sentimentBreakdown: Record<string, number>;
    };
    products: {
      questions: number;
      answered: number;
      averageConfidence: number;
      topCategories: Array<{ name: string; count: number }>;
    };
    usage: {
      tokensUsed: {
        total: number;
        completion: number;
        embedding: number;
      };
      requestsCount: {
        total: number;
        byModel: Record<string, number>;
      };
      usageByDay: Array<{
        date: string;
        tokens: number;
        requests: number;
      }>;
    };
    recentActivity: Array<{
      id: string;
      type: 'report_generated' | 'lead_scored' | 'email_analyzed' | 'question_answered' | 'alert_triggered';
      entityName: string;
      timestamp: string;
      details?: string;
    }>;
  };
  message?: string;
}

export const useAIStats = () => {
  return useQuery<AIStatsResponse>({
    queryKey: ['/api/ai/stats'],
    staleTime: 5 * 60 * 1000, // 5 minute
    placeholderData: {
      success: true,
      data: {
        summary: {
          totalReports: 47,
          activeAlerts: 3,
          totalQueries: 382,
          completionTokensUsed: 1250000,
          averageResponseTime: 1.8
        },
        reports: {
          total: 47,
          generated: 38,
          viewed: 32,
          byType: {
            financial_summary: 15,
            sales_performance: 12,
            inventory_analysis: 8,
            customer_insights: 7,
            market_trends: 5
          }
        },
        leads: {
          scored: 145,
          highValue: 28,
          recommendations: 32,
          conversionRate: 18.5
        },
        emails: {
          analyzed: 230,
          responded: 142,
          categoryBreakdown: {
            inquiry: 98,
            complaint: 43,
            feedback: 67,
            request: 22
          },
          sentimentBreakdown: {
            positive: 94,
            neutral: 87,
            negative: 37,
            urgent: 12
          }
        },
        products: {
          questions: 185,
          answered: 164,
          averageConfidence: 0.87,
          topCategories: [
            { name: "Specificații", count: 78 },
            { name: "Compatibilitate", count: 54 },
            { name: "Utilizare", count: 32 },
            { name: "Prețuri", count: 21 }
          ]
        },
        usage: {
          tokensUsed: {
            total: 1250000,
            completion: 950000,
            embedding: 300000
          },
          requestsCount: {
            total: 382,
            byModel: {
              "gpt-4": 78,
              "gpt-3.5-turbo": 304
            }
          },
          usageByDay: [
            { date: "2025-04-05", tokens: 130000, requests: 42 },
            { date: "2025-04-06", tokens: 145000, requests: 47 },
            { date: "2025-04-07", tokens: 170000, requests: 53 },
            { date: "2025-04-08", tokens: 198000, requests: 61 },
            { date: "2025-04-09", tokens: 210000, requests: 65 },
            { date: "2025-04-10", tokens: 185000, requests: 56 },
            { date: "2025-04-11", tokens: 212000, requests: 58 }
          ]
        },
        recentActivity: [
          {
            id: "1",
            type: "report_generated",
            entityName: "Raport financiar Q1 2025",
            timestamp: "2025-04-11T09:30:00Z",
            details: "Raport financiar complet generat"
          },
          {
            id: "2",
            type: "lead_scored",
            entityName: "Alex Popescu - TechRo Solutions",
            timestamp: "2025-04-11T08:45:00Z",
            details: "Score: 85/100, Valoare estimată: 12,500 RON"
          },
          {
            id: "3",
            type: "email_analyzed",
            entityName: "Solicitare ofertă servicii contabilitate",
            timestamp: "2025-04-11T07:30:00Z",
            details: "Sentiment: Pozitiv, Categorie: Solicitare informații"
          },
          {
            id: "4",
            type: "question_answered",
            entityName: "Sistem contabilitate PRO",
            timestamp: "2025-04-10T16:15:00Z",
            details: "Întrebare despre compatibilitate ANAF"
          },
          {
            id: "5",
            type: "alert_triggered",
            entityName: "Scădere rata de conversie",
            timestamp: "2025-04-10T14:30:00Z",
            details: "Canale social media sub performanță cu 8%"
          },
          {
            id: "6",
            type: "report_generated",
            entityName: "Analiză vânzări produse noi",
            timestamp: "2025-04-10T11:20:00Z",
            details: "Raport vânzări pentru produsele lansate în ultimele 6 luni"
          },
          {
            id: "7",
            type: "lead_scored",
            entityName: "Maria Ionescu - Construct Expert",
            timestamp: "2025-04-10T10:45:00Z",
            details: "Score: 92/100, Valoare estimată: 28,000 RON"
          },
          {
            id: "8",
            type: "email_analyzed",
            entityName: "Eroare în factura FF2025-1234",
            timestamp: "2025-04-10T09:15:00Z",
            details: "Sentiment: Negativ, Categorie: Plângere"
          }
        ]
      }
    }
  });
};