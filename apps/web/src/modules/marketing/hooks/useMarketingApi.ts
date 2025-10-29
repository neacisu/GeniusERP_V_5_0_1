/**
 * Marketing API Hooks
 * 
 * Custom hooks for interacting with the marketing API endpoints.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Campaign,
  CampaignSegment,
  CampaignTemplate,
  CampaignFilters,
  SegmentFilters,
  TemplateFilters,
  PaginatedCampaigns,
  PaginatedSegments,
  PaginatedTemplates,
  CampaignPerformance,
  MarketingStatistics,
} from "../types";

/**
 * Hook for fetching and managing campaigns
 */
export function useCampaigns(filters: CampaignFilters = {}) {
  const {
    status,
    type,
    search,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortDir = "desc"
  } = filters;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Construct query string
  const queryParams: Record<string, string> = {};
  if (status) queryParams['status'] = status;
  if (type) queryParams['type'] = type;
  if (search) queryParams['search'] = search;
  if (dateFrom) queryParams['dateFrom'] = dateFrom;
  if (dateTo) queryParams['dateTo'] = dateTo;
  queryParams['page'] = page.toString();
  queryParams['pageSize'] = pageSize.toString();
  queryParams['sortBy'] = sortBy;
  queryParams['sortDir'] = sortDir;

  const queryString = new URLSearchParams(queryParams).toString();

  // Query for fetching campaigns
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/marketing/campaigns', queryString],
    queryFn: async () => {
      const response = await apiRequest({ 
        url: `/api/marketing/campaigns?${queryString}`,
        method: 'GET'
      });
      return response.data as PaginatedCampaigns;
    }
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (newCampaign: Partial<Campaign>) => {
      const response = await apiRequest({
        url: "/api/marketing/campaigns",
        method: "POST",
        data: newCampaign
      });
      return response.data as Campaign;
    },
    onSuccess: () => {
      toast({
        title: "Campanie creată",
        description: "Campania a fost creată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut crea campania",
        variant: "destructive"
      });
    }
  });

  // Update campaign mutation
  const updateCampaign = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
      const response = await apiRequest({
        url: `/api/marketing/campaigns/${id}`,
        method: "PUT",
        data
      });
      return response.data as Campaign;
    },
    onSuccess: () => {
      toast({
        title: "Campanie actualizată",
        description: "Campania a fost actualizată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut actualiza campania",
        variant: "destructive"
      });
    }
  });

  // Delete campaign mutation
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/marketing/campaigns/${id}`,
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Campanie ștearsă",
        description: "Campania a fost ștearsă cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut șterge campania",
        variant: "destructive"
      });
    }
  });
  
  // Schedule campaign mutation
  const scheduleCampaign = useMutation({
    mutationFn: async ({ id, scheduledAt }: { id: string; scheduledAt: Date }) => {
      const response = await apiRequest({
        url: `/api/marketing/campaigns/${id}/schedule`,
        method: "POST",
        data: { scheduledAt }
      });
      return response.data as Campaign;
    },
    onSuccess: () => {
      toast({
        title: "Campanie programată",
        description: "Campania a fost programată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut programa campania",
        variant: "destructive"
      });
    }
  });
  
  // Start campaign mutation
  const startCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/marketing/campaigns/${id}/start`,
        method: "POST"
      });
      return response.data as Campaign;
    },
    onSuccess: () => {
      toast({
        title: "Campanie pornită",
        description: "Campania a fost pornită cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut porni campania",
        variant: "destructive"
      });
    }
  });
  
  // Pause campaign mutation
  const pauseCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/marketing/campaigns/${id}/pause`,
        method: "POST"
      });
      return response.data as Campaign;
    },
    onSuccess: () => {
      toast({
        title: "Campanie pausată",
        description: "Campania a fost pausată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut pausa campania",
        variant: "destructive"
      });
    }
  });
  
  // Resume campaign mutation
  const resumeCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/marketing/campaigns/${id}/resume`,
        method: "POST"
      });
      return response.data as Campaign;
    },
    onSuccess: () => {
      toast({
        title: "Campanie reluată",
        description: "Campania a fost reluată cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/campaigns'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut relua campania",
        variant: "destructive"
      });
    }
  });

  return {
    campaigns: data?.campaigns || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 10,
    totalPages: data?.totalPages || 1,
    isLoading,
    isError,
    error: error as Error | null,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    scheduleCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign
  };
}

/**
 * Hook for fetching and managing a single campaign
 */
export function useCampaign(id: string | null) {
  const queryClient = useQueryClient();
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/marketing/campaigns', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest({ 
        url: `/api/marketing/campaigns/${id}`,
        method: 'GET'
      });
      return response.data as Campaign;
    },
    enabled: !!id
  });

  // Get campaign performance data
  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['/api/marketing/campaigns', id, 'performance'],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest({ 
        url: `/api/marketing/campaigns/${id}/performance`,
        method: 'GET'
      });
      return response.data as CampaignPerformance;
    },
    enabled: !!id && !!data && (data.status === 'active' || data.status === 'completed' || data.status === 'paused')
  });

  return {
    campaign: data,
    performance: performanceData,
    isLoading,
    isLoadingPerformance,
    isError,
    error: error as Error | null
  };
}

/**
 * Hook for fetching and managing campaign segments
 */
export function useSegments(filters: SegmentFilters = {}) {
  const {
    isActive,
    search,
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortDir = "desc"
  } = filters;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Construct query string
  const queryParams: Record<string, string> = {};
  if (isActive !== undefined) queryParams['isActive'] = isActive.toString();
  if (search) queryParams['search'] = search;
  queryParams['page'] = page.toString();
  queryParams['pageSize'] = pageSize.toString();
  queryParams['sortBy'] = sortBy;
  queryParams['sortDir'] = sortDir;

  const queryString = new URLSearchParams(queryParams).toString();

  // Query for fetching segments
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/marketing/segments', queryString],
    queryFn: async () => {
      const response = await apiRequest({ 
        url: `/api/marketing/segments?${queryString}`,
        method: 'GET'
      });
      return response.data as PaginatedSegments;
    }
  });

  // Create segment mutation
  const createSegment = useMutation({
    mutationFn: async (newSegment: Partial<CampaignSegment>) => {
      const response = await apiRequest({
        url: "/api/marketing/segments",
        method: "POST",
        data: newSegment
      });
      return response.data as CampaignSegment;
    },
    onSuccess: () => {
      toast({
        title: "Segment creat",
        description: "Segmentul a fost creat cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/segments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut crea segmentul",
        variant: "destructive"
      });
    }
  });

  // Update segment mutation
  const updateSegment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CampaignSegment> }) => {
      const response = await apiRequest({
        url: `/api/marketing/segments/${id}`,
        method: "PUT",
        data
      });
      return response.data as CampaignSegment;
    },
    onSuccess: () => {
      toast({
        title: "Segment actualizat",
        description: "Segmentul a fost actualizat cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/segments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut actualiza segmentul",
        variant: "destructive"
      });
    }
  });

  // Delete segment mutation
  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/marketing/segments/${id}`,
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Segment șters",
        description: "Segmentul a fost șters cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/segments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut șterge segmentul",
        variant: "destructive"
      });
    }
  });

  return {
    segments: data?.segments || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 10,
    totalPages: data?.totalPages || 1,
    isLoading,
    isError,
    error: error as Error | null,
    createSegment,
    updateSegment,
    deleteSegment
  };
}

/**
 * Hook for fetching and managing a single segment
 */
export function useSegment(id: string | null) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/marketing/segments', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest({ 
        url: `/api/marketing/segments/${id}`,
        method: 'GET'
      });
      return response.data as CampaignSegment;
    },
    enabled: !!id
  });

  return {
    segment: data,
    isLoading,
    isError,
    error: error as Error | null
  };
}

/**
 * Hook for fetching and managing campaign templates
 */
export function useTemplates(filters: TemplateFilters = {}) {
  const {
    type,
    category,
    isActive,
    search,
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortDir = "desc"
  } = filters;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Construct query string
  const queryParams: Record<string, string> = {};
  if (type) queryParams['type'] = type;
  if (category) queryParams['category'] = category;
  if (isActive !== undefined) queryParams['isActive'] = isActive.toString();
  if (search) queryParams['search'] = search;
  queryParams['page'] = page.toString();
  queryParams['pageSize'] = pageSize.toString();
  queryParams['sortBy'] = sortBy;
  queryParams['sortDir'] = sortDir;

  const queryString = new URLSearchParams(queryParams).toString();

  // Query for fetching templates
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/marketing/templates', queryString],
    queryFn: async () => {
      const response = await apiRequest({ 
        url: `/api/marketing/templates?${queryString}`,
        method: 'GET'
      });
      return response.data as PaginatedTemplates;
    }
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (newTemplate: Partial<CampaignTemplate>) => {
      const response = await apiRequest({
        url: "/api/marketing/templates",
        method: "POST",
        data: newTemplate
      });
      return response.data as CampaignTemplate;
    },
    onSuccess: () => {
      toast({
        title: "Șablon creat",
        description: "Șablonul a fost creat cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/templates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut crea șablonul",
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CampaignTemplate> }) => {
      const response = await apiRequest({
        url: `/api/marketing/templates/${id}`,
        method: "PUT",
        data
      });
      return response.data as CampaignTemplate;
    },
    onSuccess: () => {
      toast({
        title: "Șablon actualizat",
        description: "Șablonul a fost actualizat cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/templates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut actualiza șablonul",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest({
        url: `/api/marketing/templates/${id}`,
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Șablon șters",
        description: "Șablonul a fost șters cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/templates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut șterge șablonul",
        variant: "destructive"
      });
    }
  });

  return {
    templates: data?.templates || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 10,
    totalPages: data?.totalPages || 1,
    isLoading,
    isError,
    error: error as Error | null,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
}

/**
 * Hook for fetching and managing a single template
 */
export function useTemplate(id: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/marketing/templates', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest({ 
        url: `/api/marketing/templates/${id}`,
        method: 'GET'
      });
      return response.data as CampaignTemplate;
    },
    enabled: !!id
  });

  // Update template mutation
  const updateTemplate = useMutation({
    mutationFn: async (data: Partial<CampaignTemplate>) => {
      if (!id) throw new Error('Template ID is required');
      const response = await apiRequest({
        url: `/api/marketing/templates/${id}`,
        method: "PUT",
        data
      });
      return response.data as CampaignTemplate;
    },
    onSuccess: () => {
      toast({
        title: "Șablon actualizat",
        description: "Șablonul a fost actualizat cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/templates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut actualiza șablonul",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Template ID is required');
      const response = await apiRequest({
        url: `/api/marketing/templates/${id}`,
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Șablon șters",
        description: "Șablonul a fost șters cu succes",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketing/templates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error['message'] || "Nu s-a putut șterge șablonul",
        variant: "destructive"
      });
    }
  });

  return {
    template: data,
    isLoading,
    isError,
    error: error as Error | null,
    updateTemplate,
    deleteTemplate
  };
}

/**
 * Hook for fetching marketing statistics
 */
export function useMarketingStatistics() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/marketing/stats'],
    queryFn: async () => {
      const response = await apiRequest({ 
        url: `/api/marketing/stats`,
        method: 'GET'
      });
      return response.data as MarketingStatistics;
    }
  });

  return {
    stats: data || {
      totalCampaigns: 0,
      activeCampaigns: 0,
      scheduledCampaigns: 0,
      completedCampaigns: 0,
      draftsCount: 0,
      totalSegments: 0,
      totalTemplates: 0,
      totalAudience: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      topPerformingCampaigns: [],
      recentCampaigns: [],
    },
    isLoading,
    isError,
    error: error as Error | null
  };
}