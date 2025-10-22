/**
 * useAIReports Hook
 * 
 * Acest hook este utilizat pentru a interacționa cu API-ul de rapoarte AI.
 * Oferă funcționalități pentru a obține, crea, actualiza și șterge rapoarte
 * generate cu AI.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export type ReportType = 
  'financial_summary' | 
  'sales_performance' | 
  'inventory_analysis' | 
  'customer_insights' | 
  'market_trends';

export interface AIReport {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  content: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  createdBy: string;
}

export interface AIReportsResponse {
  success: boolean;
  data?: {
    reports: AIReport[];
  };
  message?: string;
}

export interface AIReportResponse {
  success: boolean;
  data?: AIReport;
  message?: string;
}

// Obține toate rapoartele
export const useAIReports = () => {
  return useQuery<AIReportsResponse>({
    queryKey: ['/api/ai/reports'],
    staleTime: 5 * 60 * 1000, // 5 minute
    placeholderData: {
      success: true,
      data: {
        reports: [
          {
            id: '1',
            name: 'Raport financiar Q1 2025',
            type: 'financial_summary',
            description: 'Analiză financiară completă pentru primul trimestru din 2025',
            content: '# Raport Financiar Q1 2025\n\n## Sumar Executiv\nCompania a înregistrat o creștere de 15% în venituri comparativ cu Q1 2024, ajungând la 2.5M RON. Profitul operațional a crescut cu 22% la 850K RON, reflectând o îmbunătățire a eficienței operaționale.\n\n## Indicatori cheie\n- Venituri: 2.5M RON (+15% YoY)\n- Profit operațional: 850K RON (+22% YoY)\n- Marjă profit: 34% (+2pp YoY)\n- Cash flow: 950K RON (+18% YoY)\n\n## Tendințe și Recomandări\nTendințele pozitive în toate liniile de business indică o execuție bună a strategiei de expansiune. Recomandăm accelerarea investițiilor în departamentul de vânzări pentru a capitaliza pe aceste tendințe în Q2.\n\n## Detalii pe departamente\n1. Vânzări: 1.4M RON (+18% YoY)\n2. Servicii: 0.8M RON (+12% YoY)\n3. Consultanță: 0.3M RON (+10% YoY)',
            summary: 'Creștere de 15% în venituri și 22% în profit operațional comparativ cu Q1 2024. Toate departamentele arată tendințe pozitive, recomandăm accelerarea investițiilor în vânzări.',
            createdAt: '2025-04-01T10:30:00Z',
            updatedAt: '2025-04-01T10:30:00Z',
            companyId: '1',
            createdBy: 'admin'
          },
          {
            id: '2',
            name: 'Analiză vânzări produse noi',
            type: 'sales_performance',
            description: 'Analiză detaliată a performanței produselor lansate în ultimele 6 luni',
            content: '# Analiză Vânzări Produse Noi\n\n## Sumar Executiv\nProdusele lansate în ultimele 6 luni reprezintă 22% din totalul vânzărilor companiei, depășind obiectivul stabilit de 15%.\n\n## Performanță pe produse\n- Produs A: 430K RON (7.5% din vânzările totale)\n- Produs B: 385K RON (6.8% din vânzările totale)\n- Produs C: 290K RON (5.1% din vânzările totale)\n- Alte produse noi: 155K RON (2.7% din vânzările totale)\n\n## Canale de vânzare\n- Online: 58% din vânzările produselor noi\n- Parteneri: 32% din vânzările produselor noi\n- Vânzări directe: 10% din vânzările produselor noi\n\n## Recomandări\n1. Creșterea bugetului de marketing pentru Produsul A cu 20%\n2. Analiza cauzelor pentru performanța sub așteptări a Produsului C\n3. Extinderea rețelei de parteneri pentru a capitaliza pe acest canal\n4. Creșterea disponibilității produselor în online',
            summary: 'Produsele noi generează 22% din vânzări, depășind obiectivul de 15%. Produsul A este lider cu 7.5% din vânzările totale. Canalul online este cel mai performant cu 58% din vânzări.',
            createdAt: '2025-03-15T14:45:00Z',
            updatedAt: '2025-03-15T14:45:00Z',
            companyId: '1',
            createdBy: 'admin'
          },
          {
            id: '3',
            name: 'Optimizare inventar Q2',
            type: 'inventory_analysis',
            description: 'Analiză și recomandări pentru optimizarea nivelurilor de stoc',
            content: '# Raport Optimizare Inventar Q2 2025\n\n## Sumar Executiv\nAnaliza indică oportunități de optimizare a inventarului care pot elibera aproximativ 350K RON în capital de lucru prin reducerea nivelurilor de stoc pentru produsele cu rotație lentă.\n\n## Statistici inventar\n- Valoare totală inventar: 1.85M RON\n- Rotație inventar: 4.2 (obiectiv: 5.0)\n- Produse cu rotație lentă: 32% din valoarea totală\n- Produse cu stoc insuficient: 8% din SKU-uri\n\n## Produse cu stocuri excesive\n1. Categoria X: 280K RON peste nivelul optim\n2. Categoria Y: 120K RON peste nivelul optim\n\n## Produse cu stocuri insuficiente\n1. Categoria Z: 85K RON sub nivelul optim\n\n## Recomandări\n- Implementarea unei promoții pentru reducerea stocurilor excesive din Categoria X\n- Revizuirea parametrilor de comandă automată pentru Categoria Y\n- Creșterea stocului de siguranță pentru produsele din Categoria Z\n- Implementarea unui sistem de alertă pentru prevenirea stocurilor insuficiente',
            createdAt: '2025-03-28T09:15:00Z',
            updatedAt: '2025-03-28T09:15:00Z',
            companyId: '1',
            createdBy: 'admin'
          }
        ]
      }
    }
  });
};

// Obține un raport specific după ID
export const useAIReport = (reportId: string | null) => {
  return useQuery<AIReportResponse>({
    queryKey: ['/api/ai/reports', reportId],
    enabled: Boolean(reportId),
    staleTime: 5 * 60 * 1000, // 5 minute
  });
};

// Crează un raport nou
export const useGenerateReport = () => {
  return useMutation({
    mutationFn: async (reportData: any) => {
      return apiRequest('/api/ai/reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });
    },
    onSuccess: () => {
      // Invalidăm query-ul pentru a forța o reîncărcare a datelor
      queryClient.invalidateQueries({ queryKey: ['/api/ai/reports'] });
    }
  });
};

// Șterge un raport
export const useDeleteReport = () => {
  return useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest(`/api/ai/reports/${reportId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/reports'] });
    }
  });
};