/**
 * Hook pentru interacțiunea cu rapoartele din modulul Analytics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Definiții de tipuri pentru rapoarte
export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  type: 'financial' | 'sales' | 'inventory' | 'performance' | 'custom';
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'none';
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
  ownerId: string;
  ownerName?: string;
  status: 'active' | 'draft' | 'archived';
  config?: object;
  results?: object;
}

interface ReportFilters {
  type?: string;
  status?: string;
  search?: string;
  limit?: number;
  page?: number;
}

interface NewReportData {
  name: string;
  description?: string;
  type: 'financial' | 'sales' | 'inventory' | 'performance' | 'custom';
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'none';
  config?: object;
}

// Hook principal pentru rapoarte
export function useAnalyticsReports(filters: ReportFilters = {}) {
  const queryClient = useQueryClient();
  
  // Preluare lista de rapoarte
  const {
    data: reportsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['analytics', 'reports', filters],
    queryFn: async () => {
      const response = await apiRequest({
        url: '/api/analytics/reports',
        method: 'GET',
        params: filters
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Eroare la preluarea rapoartelor');
      }
      
      return response.data;
    }
  });
  
  // Mutație pentru crearea unui raport nou
  const { mutateAsync: createReport } = useMutation({
    mutationFn: async (data: NewReportData) => {
      const response = await apiRequest('/api/analytics/reports', {
        method: 'POST',
        data
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Eroare la crearea raportului');
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Raport creat',
        description: 'Raportul a fost creat cu succes',
        variant: 'default'
      });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'reports'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Eroare',
        description: error.message || 'A apărut o eroare la crearea raportului',
        variant: 'destructive'
      });
    }
  });
  
  // Mutație pentru ștergerea unui raport
  const { mutateAsync: deleteReport } = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest(`/api/analytics/reports/${reportId}`, {
        method: 'DELETE'
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Eroare la ștergerea raportului');
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Raport șters',
        description: 'Raportul a fost șters cu succes',
        variant: 'default'
      });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'reports'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Eroare',
        description: error.message || 'A apărut o eroare la ștergerea raportului',
        variant: 'destructive'
      });
    }
  });
  
  // Mutație pentru rularea unui raport
  const { mutateAsync: runReport } = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest('/api/analytics/reports/' + reportId + '/run', {
        method: 'POST'
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Eroare la rularea raportului');
      }
      
      return response.data;
    },
    onSuccess: (data, reportId) => {
      toast({
        title: 'Raport rulat',
        description: 'Raportul a fost rulat cu succes',
        variant: 'default'
      });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'reports', reportId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Eroare',
        description: error.message || 'A apărut o eroare la rularea raportului',
        variant: 'destructive'
      });
    }
  });
  
  // Query pentru un raport specific
  const useReportQuery = (id?: string) => useQuery({
    queryKey: ['analytics', 'reports', id],
    queryFn: async () => {
      if (!id) return null;
      
      const response = await apiRequest(`/api/analytics/reports/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Eroare la preluarea raportului');
      }
      
      return response.data;
    },
    enabled: !!id
  });
  
  // Simulare date de test (doar pentru dezvoltare)
  const mockReports: AnalyticsReport[] = Array(10).fill(null).map((_, i) => ({
    id: `report-${i + 1}`,
    name: `Raport ${i + 1}`,
    description: `Descriere raport ${i + 1}`,
    type: ['financial', 'sales', 'inventory', 'performance', 'custom'][i % 5] as any,
    schedule: ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'none'][i % 6] as any,
    lastRun: i % 3 === 0 ? new Date(Date.now() - 86400000 * i).toISOString() : undefined,
    createdAt: new Date(Date.now() - 86400000 * (i + 5)).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * i).toISOString(),
    companyId: 'company-1',
    ownerId: 'user-1',
    ownerName: 'Administrator',
    status: ['active', 'draft', 'archived'][i % 3] as any,
  }));
  
  // Date mock pentru dezvoltare
  const mockRecentReports: AnalyticsReport[] = mockReports
    .filter(r => r.status === 'active')
    .slice(0, 3);
    
  // Pregătim datele de răspuns
  const reports = reportsData?.reports || mockReports;
  const total = reportsData?.total || mockReports.length;
  const page = reportsData?.page || 1;
  const limit = reportsData?.limit || 10;
  const recentReports = mockRecentReports;
  
  return {
    reports,
    total,
    page,
    limit,
    isLoading,
    isError,
    error,
    createReport,
    deleteReport,
    runReport,
    refetch,
    useReportQuery,
    recentReports,
    isLoadingReports: isLoading,
    isLoadingRecentReports: false,
  };
}