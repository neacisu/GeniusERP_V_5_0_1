/**
 * useBPMProcesses Hook
 * 
 * Hook pentru interacțiunea cu procesele BPM
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export interface BPMProcess {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  steps: any;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  isTemplate: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface NewProcessData {
  name: string;
  description?: string;
  steps: any;
  isTemplate?: boolean;
}

export type ProcessFilters = {
  status?: string;
  isTemplate?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Placeholder functions for demo purposes
// In a real implementation these would connect to actual backend API endpoints
export function useBPMProcesses(filters: ProcessFilters = {}) {
  // Fetch all processes for the company
  const processesQuery = useQuery({
    queryKey: ['/api/bpm/processes', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      
      if (filters.status) params.set('status', filters.status);
      if (filters.isTemplate !== undefined) params.set('isTemplate', String(filters.isTemplate));
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      
      return apiRequest({
        url: `/api/bpm/processes?${params.toString()}`,
        method: 'GET'
      });
    }
  });
  
  // Create a new process
  const createProcessMutation = useMutation({
    mutationFn: (newProcess: NewProcessData) => {
      return apiRequest({
        url: '/api/bpm/processes',
        method: 'POST',
        data: newProcess
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bpm/processes'] });
    }
  });
  
  // Update an existing process
  const updateProcessMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BPMProcess> }) => {
      return apiRequest({
        url: `/api/bpm/processes/${id}`,
        method: 'PATCH',
        data
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bpm/processes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bpm/processes', variables.id] });
    }
  });
  
  // Delete a process
  const deleteProcessMutation = useMutation({
    mutationFn: (id: string) => {
      return apiRequest({
        url: `/api/bpm/processes/${id}`,
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bpm/processes'] });
    }
  });
  
  // Clone a process (create a copy)
  const cloneProcessMutation = useMutation({
    mutationFn: (id: string) => {
      return apiRequest({
        url: `/api/bpm/processes/${id}/clone`,
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bpm/processes'] });
    }
  });
  
  // Get a single process by ID
  const useProcess = (id: string) => {
    return useQuery({
      queryKey: ['/api/bpm/processes', id],
      queryFn: () => {
        return apiRequest({
          url: `/api/bpm/processes/${id}`,
          method: 'GET'
        });
      },
      enabled: !!id
    });
  };
  
  return {
    processes: processesQuery.data?.data || [],
    totalProcesses: processesQuery.data?.total || 0,
    isLoading: processesQuery.isLoading,
    isError: processesQuery.isError,
    error: processesQuery.error,
    createProcess: createProcessMutation.mutateAsync,
    isCreating: createProcessMutation.isPending,
    updateProcess: updateProcessMutation.mutateAsync,
    isUpdating: updateProcessMutation.isPending,
    deleteProcess: deleteProcessMutation.mutateAsync,
    isDeleting: deleteProcessMutation.isPending,
    cloneProcess: cloneProcessMutation.mutateAsync,
    isCloning: cloneProcessMutation.isPending,
    useProcess,
    refetch: processesQuery.refetch
  };
}

export default useBPMProcesses;