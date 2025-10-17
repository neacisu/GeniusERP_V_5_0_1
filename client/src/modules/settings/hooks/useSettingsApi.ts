/**
 * Settings API Hooks
 * 
 * This file contains custom React hooks for interacting with the settings API.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Define interfaces for settings data types
export interface GlobalSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  companyId: string;
  isSystemWide: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSetting {
  id: string;
  userId: string;
  type: string;
  channel: string;
  enabled: boolean;
  frequency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreference {
  id: string;
  userId: string;
  key: string;
  value: any;
  category: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureToggle {
  id: string;
  feature: string;
  module: string;
  description: string;
  isEnabled: boolean;
  companyId: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UITheme {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  colors: Record<string, any>;
  fonts?: Record<string, any>;
  logos?: Record<string, any>;
  customCss?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Settings API Hook
export const useSettingsApi = () => {
  const queryClient = useQueryClient();

  // Company Profile
  const useCompanyProfile = () => 
    useQuery({
      queryKey: ['/api/settings/company'],
    });

  // Global Settings
  const useGlobalSettings = (category?: string, companyId?: string) => 
    useQuery<GlobalSetting[]>({
      queryKey: ['/api/settings/global', category, companyId],
      enabled: !!companyId,
    });

  // Module Settings
  const useModuleSettings = (moduleId: string, companyId?: string) => 
    useQuery<GlobalSetting[]>({
      queryKey: ['/api/settings/module', moduleId, companyId],
      enabled: !!moduleId,
    });

  // Create a global setting
  const useCreateGlobalSetting = () => 
    useMutation({
      mutationFn: (setting: Partial<GlobalSetting>) => 
        apiRequest('/api/settings/global', {
          method: 'POST',
          body: setting
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/settings/global'] });
      }
    });

  // Update a global setting
  const useUpdateGlobalSetting = () => 
    useMutation({
      mutationFn: ({ id, data }: { id: string, data: { value: any } }) => 
        apiRequest(`/api/settings/global/${id}`, {
          method: 'PATCH',
          body: data
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/settings/global'] });
      }
    });

  // Notification Settings
  const useNotificationSettings = (userId: string) => 
    useQuery<NotificationSetting[]>({
      queryKey: ['/api/settings/notifications', userId],
      enabled: !!userId,
    });

  // Update notification setting
  const useUpdateNotificationSetting = () => 
    useMutation({
      mutationFn: ({ id, data }: { id: string, data: Partial<NotificationSetting> }) => 
        apiRequest(`/api/settings/notifications/${id}`, {
          method: 'PATCH',
          body: data
        }),
      onSuccess: (_, variables) => {
        // Get the userId from cache to invalidate the correct query
        const cache = queryClient.getQueryCache();
        const queries = cache.findAll({ queryKey: ['/api/settings/notifications'] });
        
        queries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        });
      }
    });

  // User Preferences
  const useUserPreferences = (userId: string, category?: string) => 
    useQuery<UserPreference[]>({
      queryKey: ['/api/settings/preferences', userId, category],
      enabled: !!userId,
    });

  // Create user preference
  const useCreateUserPreference = () => 
    useMutation({
      mutationFn: (preference: Partial<UserPreference>) => 
        apiRequest('/api/settings/preferences', {
          method: 'POST',
          body: preference
        }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/settings/preferences', variables.userId, variables.category] 
        });
      }
    });

  // Update user preference
  const useUpdateUserPreference = () => 
    useMutation({
      mutationFn: ({ id, data }: { id: string, data: Partial<UserPreference> }) => 
        apiRequest(`/api/settings/preferences/${id}`, {
          method: 'PATCH',
          body: data
        }),
      onSuccess: (_, variables) => {
        const cache = queryClient.getQueryCache();
        const queries = cache.findAll({ queryKey: ['/api/settings/preferences'] });
        
        queries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        });
      }
    });
    
  // Feature Toggles
  const useFeatureToggles = (module?: string, companyId?: string) => 
    useQuery<FeatureToggle[]>({
      queryKey: ['/api/settings/features', module, companyId],
      enabled: !!companyId,
      // For now return mock data
      queryFn: () => Promise.resolve([
        {
          id: '1',
          feature: 'enable_export_pdf',
          module: 'invoicing',
          description: 'Permite exportul facturilor în format PDF',
          isEnabled: true,
          companyId: companyId || '',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          feature: 'beta_features',
          module: 'system',
          description: 'Activează funcționalitățile în versiune beta',
          isEnabled: false,
          companyId: companyId || '',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          feature: 'advanced_reporting',
          module: 'analytics',
          description: 'Activează rapoartele avansate',
          isEnabled: true,
          companyId: companyId || '',
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
    });

  // Create feature toggle
  const useCreateFeatureToggle = () => 
    useMutation({
      mutationFn: (feature: Partial<FeatureToggle>) => 
        apiRequest('/api/settings/features', {
          method: 'POST',
          body: feature
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/settings/features'] });
      }
    });

  // Enable feature
  const useEnableFeature = () => 
    useMutation({
      mutationFn: ({ id, userId }: { id: string, userId: string }) => 
        apiRequest(`/api/settings/features/${id}/enable`, {
          method: 'POST',
          body: { userId }
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/settings/features'] });
      }
    });

  // Disable feature
  const useDisableFeature = () => 
    useMutation({
      mutationFn: ({ id, userId }: { id: string, userId: string }) => 
        apiRequest(`/api/settings/features/${id}/disable`, {
          method: 'POST',
          body: { userId }
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/settings/features'] });
      }
    });

  // UI Themes
  const useCompanyThemes = (companyId?: string) => 
    useQuery<UITheme[]>({
      queryKey: ['/api/settings/themes', companyId],
      enabled: !!companyId,
    });

  const useDefaultTheme = (companyId?: string) => 
    useQuery<UITheme>({
      queryKey: ['/api/settings/themes/default', companyId],
      enabled: !!companyId,
    });

  const useCreateTheme = () => 
    useMutation({
      mutationFn: (theme: Partial<UITheme>) => 
        apiRequest('/api/settings/themes', {
          method: 'POST',
          body: theme
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/settings/themes'] });
      }
    });

  const useUpdateTheme = () => 
    useMutation({
      mutationFn: ({ id, data }: { id: string, data: Partial<UITheme> }) => 
        apiRequest(`/api/settings/themes/${id}`, {
          method: 'PATCH',
          body: data
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/settings/themes'] });
      }
    });

  const useSetDefaultTheme = () => 
    useMutation({
      mutationFn: ({ id, companyId }: { id: string, companyId: string }) => 
        apiRequest(`/api/settings/themes/${id}/set-default`, {
          method: 'POST',
          body: { companyId }
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/settings/themes'] });
      }
    });

  return {
    useCompanyProfile,
    useGlobalSettings,
    useModuleSettings,
    useCreateGlobalSetting,
    useUpdateGlobalSetting,
    useNotificationSettings,
    useUpdateNotificationSetting,
    useUserPreferences,
    useCreateUserPreference,
    useUpdateUserPreference,
    useFeatureToggles,
    useCreateFeatureToggle,
    useEnableFeature,
    useDisableFeature,
    useCompanyThemes,
    useDefaultTheme,
    useCreateTheme,
    useUpdateTheme,
    useSetDefaultTheme
  };
};