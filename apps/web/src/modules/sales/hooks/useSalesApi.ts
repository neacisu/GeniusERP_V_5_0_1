/**
 * Sales API Hook
 * 
 * Provides a reusable hook for interacting with the Sales API endpoints
 */

import { useState } from 'react';
import { 
  apiRequest,
  ApiRequestOptions,
  ApiErrorResponse 
} from '@/lib/queryClient';
import { 
  Customer, 
  Deal, 
  Opportunity, 
  Quote, 
  Contact,
  CustomerQueryOptions,
  DealQueryOptions,
  OpportunityQueryOptions,
  QuoteQueryOptions,
  PaginatedResponse,
  CountResponse,
  SalesOverviewData,
  Pipeline
} from '../types';

export const useSalesApi = () => {
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  
  /**
   * Get all customers with optional filtering
   */
  const getCustomers = async (options?: CustomerQueryOptions): Promise<PaginatedResponse<Customer> | CountResponse> => {
    try {
      setError(null);
      
      const queryParams: Record<string, string> = {};
      
      if (options) {
        if (options.page) queryParams.page = options.page.toString();
        if (options.limit) queryParams.limit = options.limit.toString();
        if (options.search) queryParams.search = options.search;
        if (options.sortBy) queryParams.sortBy = options.sortBy;
        if (options.sortOrder) queryParams.sortOrder = options.sortOrder;
        if (options.filter) queryParams.filter = options.filter;
        if (options.count) queryParams.count = 'true';
      }
      
      const requestOptions: ApiRequestOptions = {
        method: 'GET',
        params: queryParams
      };
      
      const response = await apiRequest<PaginatedResponse<Customer> | CountResponse>('/api/sales/customers', requestOptions);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Get a single customer by ID
   */
  const getCustomerById = async (id: string): Promise<Customer> => {
    try {
      setError(null);
      const response = await apiRequest<Customer>(`/api/sales/customers/${id}`);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Create a new customer
   */
  const createCustomer = async (customerData: Partial<Customer>): Promise<Customer> => {
    try {
      setError(null);
      const response = await apiRequest<Customer>('/api/sales/customers', {
        method: 'POST',
        data: customerData
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Update an existing customer
   */
  const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    try {
      setError(null);
      const response = await apiRequest<Customer>(`/api/sales/customers/${id}`, {
        method: 'PATCH',
        data: customerData
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Delete a customer
   */
  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      setError(null);
      await apiRequest(`/api/sales/customers/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Get customer contacts
   */
  const getCustomerContacts = async (customerId: string): Promise<Contact[]> => {
    try {
      setError(null);
      const response = await apiRequest<Contact[]>(`/api/sales/customers/${customerId}/contacts`);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  // DEALS API METHODS
  
  /**
   * Get deals with optional filtering
   */
  const getDeals = async (options?: DealQueryOptions): Promise<PaginatedResponse<Deal> | CountResponse> => {
    try {
      setError(null);
      
      const queryParams: Record<string, string> = {};
      
      if (options) {
        if (options.page) queryParams.page = options.page.toString();
        if (options.limit) queryParams.limit = options.limit.toString();
        if (options.search) queryParams.search = options.search;
        if (options.customerId) queryParams.customerId = options.customerId;
        if (options.status) {
          if (Array.isArray(options.status)) {
            queryParams.status = options.status.join(',');
          } else {
            queryParams.status = options.status;
          }
        }
        if (options.priority) queryParams.priority = options.priority;
        if (options.sortBy) queryParams.sortBy = options.sortBy;
        if (options.sortOrder) queryParams.sortOrder = options.sortOrder;
        if (options.startDate) queryParams.startDate = options.startDate;
        if (options.endDate) queryParams.endDate = options.endDate;
        if (options.minValue) queryParams.minValue = options.minValue.toString();
        if (options.maxValue) queryParams.maxValue = options.maxValue.toString();
        if (options.count) queryParams.count = 'true';
      }
      
      const requestOptions: ApiRequestOptions = {
        method: 'GET',
        params: queryParams
      };
      
      const response = await apiRequest<PaginatedResponse<Deal> | CountResponse>('/api/sales/deals', requestOptions);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Get a single deal by ID
   */
  const getDealById = async (id: string): Promise<Deal> => {
    try {
      setError(null);
      const response = await apiRequest<Deal>(`/api/sales/deals/${id}`);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Create a new deal
   */
  const createDeal = async (dealData: Partial<Deal>): Promise<Deal> => {
    try {
      setError(null);
      const response = await apiRequest<Deal>('/api/sales/deals', {
        method: 'POST',
        data: dealData
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Update an existing deal
   */
  const updateDeal = async (id: string, dealData: Partial<Deal>): Promise<Deal> => {
    try {
      setError(null);
      const response = await apiRequest<Deal>(`/api/sales/deals/${id}`, {
        method: 'PATCH',
        data: dealData
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Delete a deal
   */
  const deleteDeal = async (id: string): Promise<void> => {
    try {
      setError(null);
      await apiRequest(`/api/sales/deals/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  // OPPORTUNITIES API METHODS
  
  /**
   * Get opportunities with optional filtering
   */
  const getOpportunities = async (options?: OpportunityQueryOptions): Promise<PaginatedResponse<Opportunity> | CountResponse> => {
    try {
      setError(null);
      
      const queryParams: Record<string, string> = {};
      
      if (options) {
        if (options.page) queryParams.page = options.page.toString();
        if (options.limit) queryParams.limit = options.limit.toString();
        if (options.search) queryParams.search = options.search;
        if (options.customerId) queryParams.customerId = options.customerId;
        if (options.stage) {
          if (Array.isArray(options.stage)) {
            queryParams.stage = options.stage.join(',');
          } else {
            queryParams.stage = options.stage;
          }
        }
        if (options.priority) queryParams.priority = options.priority;
        if (options.sortBy) queryParams.sortBy = options.sortBy;
        if (options.sortOrder) queryParams.sortOrder = options.sortOrder;
        if (options.minProbability) queryParams.minProbability = options.minProbability.toString();
        if (options.maxProbability) queryParams.maxProbability = options.maxProbability.toString();
        if (options.count) queryParams.count = 'true';
      }
      
      const requestOptions: ApiRequestOptions = {
        method: 'GET',
        params: queryParams
      };
      
      const response = await apiRequest<PaginatedResponse<Opportunity> | CountResponse>('/api/sales/opportunities', requestOptions);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Get a single opportunity by ID
   */
  const getOpportunityById = async (id: string): Promise<Opportunity> => {
    try {
      setError(null);
      const response = await apiRequest<Opportunity>(`/api/sales/opportunities/${id}`);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Create a new opportunity
   */
  const createOpportunity = async (opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
    try {
      setError(null);
      const response = await apiRequest<Opportunity>('/api/sales/opportunities', {
        method: 'POST',
        data: opportunityData
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Update an existing opportunity
   */
  const updateOpportunity = async (id: string, opportunityData: Partial<Opportunity>): Promise<Opportunity> => {
    try {
      setError(null);
      const response = await apiRequest<Opportunity>(`/api/sales/opportunities/${id}`, {
        method: 'PATCH',
        data: opportunityData
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Convert opportunity to deal
   */
  const convertOpportunityToDeal = async (opportunityId: string, dealData?: Partial<Deal>): Promise<Deal> => {
    try {
      setError(null);
      const response = await apiRequest<Deal>(`/api/sales/opportunities/${opportunityId}/convert`, {
        method: 'POST',
        data: dealData || {}
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  // QUOTES API METHODS
  
  /**
   * Get quotes with optional filtering
   */
  const getQuotes = async (options?: QuoteQueryOptions): Promise<PaginatedResponse<Quote> | CountResponse> => {
    try {
      setError(null);
      
      const queryParams: Record<string, string> = {};
      
      if (options) {
        if (options.page) queryParams.page = options.page.toString();
        if (options.limit) queryParams.limit = options.limit.toString();
        if (options.search) queryParams.search = options.search;
        if (options.customerId) queryParams.customerId = options.customerId;
        if (options.status) {
          if (Array.isArray(options.status)) {
            queryParams.status = options.status.join(',');
          } else {
            queryParams.status = options.status;
          }
        }
        if (options.sortBy) queryParams.sortBy = options.sortBy;
        if (options.sortOrder) queryParams.sortOrder = options.sortOrder;
        if (options.issueDate) queryParams.issueDate = options.issueDate;
        if (options.validUntil) queryParams.validUntil = options.validUntil;
        if (options.count) queryParams.count = 'true';
      }
      
      const requestOptions: ApiRequestOptions = {
        method: 'GET',
        params: queryParams
      };
      
      const response = await apiRequest<PaginatedResponse<Quote> | CountResponse>('/api/sales/quotes', requestOptions);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Get a single quote by ID
   */
  const getQuoteById = async (id: string): Promise<Quote> => {
    try {
      setError(null);
      const response = await apiRequest<Quote>(`/api/sales/quotes/${id}`);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Create a new quote
   */
  const createQuote = async (quoteData: Partial<Quote>): Promise<Quote> => {
    try {
      setError(null);
      const response = await apiRequest<Quote>('/api/sales/quotes', {
        method: 'POST',
        data: quoteData
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Update an existing quote
   */
  const updateQuote = async (id: string, quoteData: Partial<Quote>): Promise<Quote> => {
    try {
      setError(null);
      const response = await apiRequest<Quote>(`/api/sales/quotes/${id}`, {
        method: 'PATCH',
        data: quoteData
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Convert quote to deal
   */
  const convertQuoteToDeal = async (quoteId: string, dealData?: Partial<Deal>): Promise<Deal> => {
    try {
      setError(null);
      const response = await apiRequest<Deal>(`/api/sales/quotes/${quoteId}/convert`, {
        method: 'POST',
        data: dealData || {}
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Download quote as PDF
   */
  const downloadQuotePdf = async (quoteId: string): Promise<Blob> => {
    try {
      setError(null);
      const response = await apiRequest<Blob>(`/api/sales/quotes/${quoteId}/pdf`, {
        method: 'GET',
        responseType: 'blob'
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  // PIPELINE API METHODS
  
  /**
   * Get sales pipeline
   */
  const getPipeline = async (): Promise<Pipeline> => {
    try {
      setError(null);
      const response = await apiRequest<Pipeline>('/api/sales/pipeline');
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Update deal stage in pipeline
   */
  const updateDealStage = async (dealId: string, stageId: string): Promise<Deal> => {
    try {
      setError(null);
      const response = await apiRequest<Deal>(`/api/sales/pipeline/deals/${dealId}/stage`, {
        method: 'PATCH',
        data: { stageId }
      });
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Get sales overview data
   */
  const getSalesOverview = async (): Promise<SalesOverviewData> => {
    try {
      setError(null);
      const response = await apiRequest<SalesOverviewData>('/api/sales/overview');
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  /**
   * Get products with optional filtering
   * Note: This is a placeholder - actual implementation depends on backend
   */
  const getProducts = async (options?: any): Promise<PaginatedResponse<any> | CountResponse> => {
    try {
      setError(null);
      
      const queryParams: Record<string, string> = {};
      
      if (options) {
        if (options.page) queryParams.page = options.page.toString();
        if (options.limit) queryParams.limit = options.limit.toString();
        if (options.search) queryParams.search = options.search;
        if (options.sortBy) queryParams.sortBy = options.sortBy;
        if (options.sortOrder) queryParams.sortOrder = options.sortOrder;
        if (options.category) queryParams.category = options.category;
        if (options.count) queryParams.count = 'true';
      }
      
      const requestOptions: ApiRequestOptions = {
        method: 'GET',
        params: queryParams
      };
      
      const response = await apiRequest<PaginatedResponse<any> | CountResponse>('/api/sales/products', requestOptions);
      return response;
    } catch (err) {
      setError(err as ApiErrorResponse);
      throw err;
    }
  };
  
  return {
    // State
    error,
    
    // Customer methods
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerContacts,
    
    // Deal methods
    getDeals,
    getDealById,
    createDeal,
    updateDeal,
    deleteDeal,
    
    // Opportunity methods
    getOpportunities,
    getOpportunityById,
    createOpportunity,
    updateOpportunity,
    convertOpportunityToDeal,
    
    // Quote methods
    getQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
    convertQuoteToDeal,
    downloadQuotePdf,
    
    // Pipeline methods
    getPipeline,
    updateDealStage,
    
    // Product methods
    getProducts,
    
    // Analytics methods
    getSalesOverview
  };
};