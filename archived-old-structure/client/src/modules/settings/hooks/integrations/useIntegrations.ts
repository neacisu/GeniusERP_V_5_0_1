/**
 * Integration Hooks
 * 
 * Custom React hooks for working with integration data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

// Integration types
export enum IntegrationProvider {
  SHOPIFY_ADMIN = 'shopify_admin',
  SHOPIFY_STOREFRONT = 'shopify_storefront',
  SHOPIFY = 'shopify',
  PRESTASHOP = 'prestashop',
  WOOCOMMERCE = 'woocommerce',
  CUSTOM_ECOMMERCE = 'custom_ecommerce',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  EMAIL = 'email',
  SMS = 'sms',
  ANAF = 'anaf',
  REVISAL = 'revisal',
  API = 'api',
  PANDADOC = 'pandadoc',
  ELEVENLABS = 'elevenlabs',
  OPENAI = 'openai',
  MICROSOFT_GRAPH = 'microsoft_graph',
  REVOLUT = 'revolut',
  SAMEDAY = 'sameday',
  TERMENE_RO = 'termene_ro',
  MAILCHIMP = 'mailchimp',
  SENDGRID = 'sendgrid',
  TWILIO = 'twilio'
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ERROR = 'error'
}

export interface Integration {
  id: string;
  companyId: string;
  provider: IntegrationProvider;
  name: string | null;
  description: string | null;
  config: Record<string, any>;
  isConnected: boolean;
  status: IntegrationStatus;
  lastSyncedAt: string | null;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
}

export interface CreateIntegrationDto {
  provider: IntegrationProvider;
  name?: string;
  description?: string; 
  config?: Record<string, any>;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface UpdateIntegrationDto {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  webhookUrl?: string;
  webhookSecret?: string;
  isActive?: boolean;
}

// Hook for fetching all integrations
export function useIntegrations() {
  return useQuery({
    queryKey: ['/api/integrations'],
    queryFn: async () => {
      const response = await apiRequest('/api/integrations');
      return response.data as Integration[];
    }
  });
}

// Hook for fetching a specific integration by ID
export function useIntegration(id: string | undefined) {
  return useQuery({
    queryKey: ['/api/integrations', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest(`/api/integrations/${id}`);
      return response.data as Integration;
    },
    enabled: !!id
  });
}

// Hook for fetching integration by provider
export function useIntegrationByProvider(provider: IntegrationProvider | undefined) {
  return useQuery({
    queryKey: ['/api/integrations/provider', provider],
    queryFn: async () => {
      if (!provider) return null;
      const response = await apiRequest(`/api/integrations/provider/${provider}`);
      return response.data as Integration;
    },
    enabled: !!provider
  });
}

// Hook for creating a new integration
export function useCreateIntegration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateIntegrationDto) => {
      const response = await apiRequest('/api/integrations', {
        method: 'POST',
        data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integrare creată",
        description: "Integrarea a fost creată cu succes",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea integrarea",
        variant: "destructive"
      });
    }
  });
}

// Hook for updating an integration
export function useUpdateIntegration(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateIntegrationDto) => {
      const response = await apiRequest(`/api/integrations/${id}`, {
        method: 'PATCH',
        data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integrare actualizată",
        description: "Integrarea a fost actualizată cu succes",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza integrarea",
        variant: "destructive"
      });
    }
  });
}

// Hook for activating an integration
export function useActivateIntegration(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/integrations/${id}/activate`, {
        method: 'POST'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integrare activată",
        description: "Integrarea a fost activată cu succes",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut activa integrarea",
        variant: "destructive"
      });
    }
  });
}

// Hook for deactivating an integration
export function useDeactivateIntegration(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/integrations/${id}/deactivate`, {
        method: 'POST'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integrare dezactivată",
        description: "Integrarea a fost dezactivată cu succes",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut dezactiva integrarea",
        variant: "destructive"
      });
    }
  });
}

// Hook for deleting an integration
export function useDeleteIntegration(id: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/integrations/${id}`, {
        method: 'DELETE'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Integrare ștearsă",
        description: "Integrarea a fost ștearsă cu succes",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut șterge integrarea",
        variant: "destructive"
      });
    }
  });
}