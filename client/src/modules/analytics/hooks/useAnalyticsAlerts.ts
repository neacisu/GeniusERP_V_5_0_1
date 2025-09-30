/**
 * useAnalyticsAlerts Hook
 * 
 * Hook pentru interogarea și gestionarea alertelor analitice
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Tipuri pentru alerte
export interface AnalyticsAlert {
  id: string;
  name: string;
  description?: string;
  condition: {
    metricId?: string;
    metricName?: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'neq' | 'contains';
    threshold: number | string;
    timeWindow?: string;
  };
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'active' | 'inactive' | 'triggered' | 'acknowledged';
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggeredCount?: number;
  notifications: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
    webhook?: boolean;
    recipients?: string[];
  };
  companyId: string;
}

export interface AnalyticsAlertHistory {
  id: string;
  alertId: string;
  alertName: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  value: number | string;
  threshold: number | string;
  metricName?: string;
  companyId: string;
}

export interface CreateAlertInput {
  name: string;
  description?: string;
  condition: {
    metricId?: string;
    operator: string;
    threshold: number | string;
    timeWindow?: string;
  };
  severity: string;
  notifications: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
    webhook?: boolean;
    recipients?: string[];
  };
}

export interface AlertsFilters {
  severity?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAnalyticsAlerts(filters: AlertsFilters = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Construiește query parameters
  const buildQueryParams = (params: AlertsFilters) => {
    const queryParams = new URLSearchParams();
    
    if (params.severity) queryParams.append('severity', params.severity);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  };
  
  // Query pentru lista de alerte
  const alertsQuery = useQuery<{ 
    alerts: AnalyticsAlert[]; 
    total: number; 
    page: number; 
    limit: number 
  }>({
    queryKey: ['/api/analytics/alerts', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/analytics/alerts${buildQueryParams(filters)}`);
      return response.json();
    }
  });
  
  // Query pentru istoricul alertelor
  const alertHistoryQuery = useQuery<{ 
    history: AnalyticsAlertHistory[]; 
    total: number; 
    page: number; 
    limit: number 
  }>({
    queryKey: ['/api/analytics/alerts/history', filters],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/analytics/alerts/history${buildQueryParams(filters)}`);
      return response.json();
    }
  });
  
  // Query pentru o singură alertă după ID
  const useAlertQuery = (id?: string) => {
    return useQuery<{ alert: AnalyticsAlert }>({
      queryKey: ['/api/analytics/alerts', id],
      queryFn: async () => {
        if (!id) throw new Error('Alert ID is required');
        const response = await apiRequest('GET', `/api/analytics/alerts/${id}`);
        return response.json();
      },
      enabled: !!id
    });
  };
  
  // Mutație pentru crearea unei alerte noi
  const createAlertMutation = useMutation({
    mutationFn: async (data: CreateAlertInput) => {
      const response = await apiRequest('POST', '/api/analytics/alerts', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Alertă creată',
        description: 'Alerta a fost creată cu succes',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/alerts'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut crea alerta: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Mutație pentru actualizarea unei alerte
  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAlertInput> }) => {
      const response = await apiRequest('PATCH', `/api/analytics/alerts/${id}`, data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Alertă actualizată',
        description: 'Alerta a fost actualizată cu succes',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/alerts', variables.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut actualiza alerta: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Mutație pentru ștergerea unei alerte
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/analytics/alerts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Alertă ștearsă',
        description: 'Alerta a fost ștearsă cu succes',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/alerts'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut șterge alerta: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Mutație pentru confirmarea (acknowledge) unei alerte
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('POST', `/api/analytics/alerts/${id}/acknowledge`);
      return response.json();
    },
    onSuccess: (_, id) => {
      toast({
        title: 'Alertă confirmată',
        description: 'Alerta a fost confirmată cu succes',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/alerts', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/alerts/history'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Eroare',
        description: `Nu s-a putut confirma alerta: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  return {
    alerts: alertsQuery.data?.alerts || [],
    history: alertHistoryQuery.data?.history || [],
    totalAlerts: alertsQuery.data?.total || 0,
    totalHistory: alertHistoryQuery.data?.total || 0,
    isLoadingAlerts: alertsQuery.isLoading,
    isLoadingHistory: alertHistoryQuery.isLoading,
    isErrorAlerts: alertsQuery.isError,
    isErrorHistory: alertHistoryQuery.isError,
    errorAlerts: alertsQuery.error,
    errorHistory: alertHistoryQuery.error,
    useAlertQuery,
    createAlert: createAlertMutation.mutate,
    isCreating: createAlertMutation.isPending,
    updateAlert: updateAlertMutation.mutate,
    isUpdating: updateAlertMutation.isPending,
    deleteAlert: deleteAlertMutation.mutate,
    isDeleting: deleteAlertMutation.isPending,
    acknowledgeAlert: acknowledgeAlertMutation.mutate,
    isAcknowledging: acknowledgeAlertMutation.isPending,
    refetchAlerts: alertsQuery.refetch,
    refetchHistory: alertHistoryQuery.refetch,
  };
}