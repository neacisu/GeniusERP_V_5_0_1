/**
 * HttpClient Service for External API Integrations
 * 
 * This utility provides a standardized way to make HTTP requests to external services
 * such as currency exchange rates, e-Factura, ANAF, and other external APIs.
 * 
 * Features:
 * - Consistent error handling
 * - Request/response logging
 * - Configurable timeouts
 * - Retry logic for failed requests
 * - Standardized headers
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Simple log function to avoid dependency on vite module
const log = (message: string, source = 'http-client') => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};

export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryStatusCodes: number[];
}

export interface HttpClientConfig extends AxiosRequestConfig {
  baseURL?: string;
  timeout?: number;
  retry?: RetryConfig;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(config: HttpClientConfig = {}) {
    const defaultRetryConfig: RetryConfig = {
      retries: 3,
      retryDelay: 1000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504]
    };

    this.retryConfig = config.retry || defaultRetryConfig;

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(config.headers || {})
      }
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`🌐 HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, 'http-client');
        return config;
      },
      (error) => {
        console.log(`❌ HTTP Request Error: ${error.message}`, 'http-client');
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`✅ HTTP Response: ${response.status} from ${response.config.url}`, 'http-client');
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as HttpClientConfig & { _retryCount?: number };
        
        if (!config) {
          console.log(`❌ HTTP Response Error: No config available`, 'http-client');
          return Promise.reject(error);
        }

        // Initialize retry count if not present
        config._retryCount = config._retryCount || 0;
        
        const shouldRetry = 
          config._retryCount < this.retryConfig.retries && 
          (error.response 
            ? this.retryConfig.retryStatusCodes.includes(error.response.status)
            : true); // Network errors should be retried

        if (shouldRetry) {
          config._retryCount += 1;
          
          console.log(`🔄 Retrying request (${config._retryCount}/${this.retryConfig.retries}): ${config.method?.toUpperCase()} ${config.url}`, 'http-client');
          
          // Delay before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryConfig.retryDelay));
          return this.axiosInstance(config);
        }

        // Log error details
        if (error.response) {
          console.log(`❌ HTTP Response Error: ${error.response.status} from ${config.url}`, 'http-client');
          console.log(`Details: ${JSON.stringify(error.response.data)}`, 'http-client');
        } else if (error.request) {
          console.log(`❌ HTTP Request Failed: No response received from ${config.url}`, 'http-client');
        } else {
          console.log(`❌ HTTP Setup Error: ${error.message}`, 'http-client');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Generic request method
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      return await this.axiosInstance.request<T>(config);
    } catch (error) {
      console.log(`❌ HTTP Request Failed: ${(error as Error).message}`, 'http-client');
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Set authentication token for future requests
   */
  setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }
}

// Create default instance for common use cases
export const httpClient = new HttpClient();

// Export factory function for creating specialized instances
export const createHttpClient = (config: HttpClientConfig): HttpClient => {
  return new HttpClient(config);
};