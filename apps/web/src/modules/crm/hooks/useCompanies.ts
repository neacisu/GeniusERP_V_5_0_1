/**
 * Custom hook to fetch CRM companies from the API
 */
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Company } from '../types';

// Company filters interface
export interface CompanyFilters {
  page?: number;
  limit?: number;
  searchTerm?: string;
  type?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

// API response interface
export interface CompaniesResponse {
  data: Company[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Hook to fetch CRM companies with filtering and pagination
 */
export function useCompanies(filters: CompanyFilters = {}) {
  const {
    page = 1,
    limit = 20,
    searchTerm = '',
    type,
    status,
    sortBy = 'createdAt',
    sortDirection = 'desc'
  } = filters;

  // Construct query params
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  if (searchTerm) params.append('searchTerm', searchTerm);
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortDirection) params.append('sortDirection', sortDirection);

  const queryString = params.toString();
  const url = `/api/crm/companies?${queryString}`;
  
  return useQuery<CompaniesResponse>({
    queryKey: ['/api/crm/companies', page, limit, searchTerm, type, status, sortBy, sortDirection],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      
      return response.json();
    },
    refetchOnWindowFocus: false,
    retry: 1
  });
}

/**
 * Get auth token from storage
 */
function getAuthToken(): string | null {
  // Try session storage first
  let token = sessionStorage.getItem('accessToken');
  if (token) {
    return token;
  }
  
  // Then try localStorage
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user && user.token) {
        return user.token;
      }
    }
  } catch (error) {
    console.error('Error getting token from localStorage', error);
  }
  
  // Last resort - try alternative locations
  token = localStorage.getItem('auth_token') || 
          localStorage.getItem('authToken') || 
          sessionStorage.getItem('auth_token');
  
  return token;
}

/**
 * Hook to fetch a single company by ID
 */
export function useCompanyById(id: string) {
  return useQuery<Company>({
    queryKey: ['/api/crm/companies', id],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`/api/crm/companies/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Company not found');
        }
        throw new Error('Failed to fetch company');
      }
      
      return response.json();
    },
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!id
  });
}

/**
 * Invalidate the companies cache to refresh data
 */
export function invalidateCompaniesCache() {
  return queryClient.invalidateQueries({ queryKey: ['/api/crm/companies'] });
}