/**
 * Hook pentru interacțiunea cu metricile din modulul Analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Definiții de tipuri pentru metrici
export interface AnalyticsMetric {
  id: string;
  name: string;
  description?: string;
  type: 'financial' | 'sales' | 'inventory' | 'performance' | 'custom';
  value: number;
  unit?: string;
  target?: number;
  status: 'on_target' | 'below_target' | 'above_target' | 'no_target';
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  dataPoints?: Array<{
    date: string;
    value: number;
  }>;
  createdAt: string;
  updatedAt: string;
  companyId: string;
}

export interface AnalyticsMetricSummary {
  totalMetrics: number;
  onTarget: number;
  belowTarget: number;
  aboveTarget: number;
  noTarget: number;
  kpis: {
    sales?: {
      value: number;
      change: number;
      trend: 'up' | 'down' | 'neutral';
    };
    profit?: {
      value: number;
      change: number;
      trend: 'up' | 'down' | 'neutral';
    };
    customers?: {
      value: number;
      change: number;
      trend: 'up' | 'down' | 'neutral';
    };
    orders?: {
      value: number;
      change: number;
      trend: 'up' | 'down' | 'neutral';
    };
  };
}

interface MetricsFilters {
  type?: string;
  status?: string;
  search?: string;
}

// Hook principal pentru metrici
export function useAnalyticsMetrics(filters: MetricsFilters = {}) {
  const queryClient = useQueryClient();
  
  // Preluare lista de metrici
  const {
    data: metricsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['analytics', 'metrics', filters],
    queryFn: async () => {
      const response = await apiRequest({
        url: '/api/analytics/metrics',
        method: 'GET',
        params: filters
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Eroare la preluarea metricilor');
      }
      
      return response.data;
    }
  });
  
  // Preluare sumar metrici
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ['analytics', 'metrics', 'summary'],
    queryFn: async () => {
      const response = await apiRequest({
        url: '/api/analytics/metrics/summary',
        method: 'GET'
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Eroare la preluarea sumarului metricilor');
      }
      
      return response.data;
    }
  });
  
  // Query pentru o metrică specifică
  const useMetricQuery = (id?: string) => useQuery({
    queryKey: ['analytics', 'metrics', id],
    queryFn: async () => {
      if (!id) return null;
      
      const response = await apiRequest(`/api/analytics/metrics/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Eroare la preluarea metricii');
      }
      
      return response.data;
    },
    enabled: !!id
  });

  // Simulare date pentru dezvoltare
  const mockMetrics: AnalyticsMetric[] = Array(12).fill(null).map((_, i) => ({
    id: `metric-${i + 1}`,
    name: `Metrică ${i + 1}`,
    description: `Descriere metrică ${i + 1}`,
    type: ['financial', 'sales', 'inventory', 'performance', 'custom'][i % 5] as any,
    value: Math.floor(Math.random() * 100000) / 100,
    unit: ['RON', 'EUR', '%', 'buc', ''][i % 5],
    target: Math.random() > 0.3 ? Math.floor(Math.random() * 100000) / 100 : undefined,
    status: ['on_target', 'below_target', 'above_target', 'no_target'][i % 4] as any,
    change: Math.floor(Math.random() * 2000) / 100 - 10,
    trend: ['up', 'down', 'neutral'][i % 3] as any,
    period: ['day', 'week', 'month', 'quarter', 'year'][i % 5] as any,
    dataPoints: Array(10).fill(null).map((_, j) => ({
      date: new Date(Date.now() - 86400000 * j).toISOString(),
      value: Math.floor(Math.random() * 100000) / 100
    })),
    createdAt: new Date(Date.now() - 86400000 * (i + 10)).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * i).toISOString(),
    companyId: 'company-1',
  }));
  
  // Date mock pentru sumar
  const mockSummary: AnalyticsMetricSummary = {
    totalMetrics: mockMetrics.length,
    onTarget: mockMetrics.filter(m => m.status === 'on_target').length,
    belowTarget: mockMetrics.filter(m => m.status === 'below_target').length,
    aboveTarget: mockMetrics.filter(m => m.status === 'above_target').length,
    noTarget: mockMetrics.filter(m => m.status === 'no_target').length,
    kpis: {
      sales: {
        value: 125000,
        change: 12.5,
        trend: 'up'
      },
      profit: {
        value: 45000,
        change: 8.3,
        trend: 'up'
      },
      customers: {
        value: 856,
        change: 5.2,
        trend: 'up'
      },
      orders: {
        value: 1243,
        change: -3.1,
        trend: 'down'
      }
    }
  };
  
  // Pregătim datele de răspuns
  const metrics = metricsData?.metrics || mockMetrics;
  const summary = summaryData || mockSummary;
  
  return {
    metrics,
    summary,
    isLoading,
    isError,
    error,
    refetch,
    refetchSummary,
    useMetricQuery,
    isLoadingSummary,
    isLoadingKpis: isLoadingSummary,
    kpis: summary?.kpis
  };
}