import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Configurație API
const API_PORT = 5000; // Portul unde rulează serverul API
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? `http://localhost:${API_PORT}` 
  : '';  // În producție, API și frontend vor fi pe același domeniu

// Tipuri pentru apiRequest
export interface ApiRequestOptions {
  method?: string;
  body?: any;
  data?: any; // adăugat pentru a fi compatibil cu useHrApi
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

// Tip pentru răspunsuri de eroare API
export interface ApiErrorResponse {
  status: number;
  message: string;
  error?: string;
  details?: any;
}

// Constants for token refresh
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds
let tokenRefreshTimer: number | null = null;

// Get the JWT token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const user = localStorage.getItem('user');
    if (!user) {
      // Silent return for unauthenticated users (normal behavior)
      return null;
    }
    
    const userData = JSON.parse(user);
    if (!userData || !userData.token) {
      // Silent return for users without token (normal behavior)
      return null;
    }
    
    // Verify token format
    if (typeof userData.token !== 'string' || !userData.token.includes('.')) {
      console.error('Invalid token format in user data');
      return null;
    }
    
    return userData.token;
  } catch (e) {
    console.error("Error parsing user data from localStorage", e);
    return null;
  }
};

// Refresh token function
export async function refreshToken(): Promise<boolean> {
  // Silently attempt token refresh
  
  try {
    // Get current user data
    const userData = localStorage.getItem('user');
    if (!userData) {
      // Silent return - user not authenticated (normal)
      return false;
    }
    
    const user = JSON.parse(userData);
    if (!user || !user.token) {
      // Silent return - invalid user data (normal for unauthenticated)
      return false;
    }
    
    // Make refresh token request
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.warn(`Token refresh failed with status: ${response.status}`);
      
      if (response.status === 401) {
        console.error('Token refresh failed: Session expired');
        // We need to reauthenticate
        if (window.location.pathname !== '/login' && window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
        return false;
      }
      
      return false;
    }
    
    // Verifică mai întâi conținutul răspunsului
    const responseText = await response.text();
    console.log('Token refresh response:', responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));
    
    // Dacă răspunsul nu conține token, întoarce false
    if (!responseText || responseText.includes('<!DOCTYPE html>')) {
      console.error('Token refresh returned HTML instead of JSON');
      return false;
    }
    
    // Parsează răspunsul ca JSON
    let refreshData;
    try {
      refreshData = JSON.parse(responseText);
      
      if (!refreshData || !refreshData.token) {
        console.warn('Token refresh returned invalid data');
        return false;
      }
      
      // Update the token in localStorage
      const updatedUser = { ...user, token: refreshData.token };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      console.log('Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error parsing token refresh response:', error);
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

// Setup token refresh timer
export function setupTokenRefresh(): void {
  if (tokenRefreshTimer) {
    window.clearInterval(tokenRefreshTimer);
  }
  
  // Only setup timer if we have a token
  if (getAuthToken()) {
    console.log(`Setting up token refresh every ${TOKEN_REFRESH_INTERVAL / 60000} minutes`);
    tokenRefreshTimer = window.setInterval(refreshToken, TOKEN_REFRESH_INTERVAL);
    
    // Also refresh immediately on page load if token exists
    refreshToken();
  }
}

// Call setup on module load if we're in a browser
if (typeof window !== 'undefined') {
  setupTokenRefresh();
}

// Helper to check if a cached token is present
export function hasAuthToken(): boolean {
  return !!getAuthToken();
}

// Helper to get company ID from localStorage
export function getCompanyId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      console.warn('Cannot get company ID: User not logged in');
      return null;
    }
    
    const user = JSON.parse(userData);
    
    // Verifică întâi companyId (camelCase)
    if (user.companyId) {
      // Ensure we're using company_id not user.id
      if (user.companyId === user.id) {
        console.warn('WARNING: Company ID matches user ID - this might indicate incorrect data');
      }
      
      console.log('Using companyId in API request:', user.companyId);
      return user.companyId;
    }
    
    // Apoi verifică company_id (snake_case)
    if (user.company_id) {
      console.log('Using company_id in API request:', user.company_id);
      return user.company_id;
    }
    
    console.error('CRITICAL: Company ID missing from user data (both companyId and company_id)');
    return null;
  } catch (e) {
    console.error('Error getting company ID:', e);
    return null;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  urlOrOptions: string | { url: string; method: string; data?: any },
  options?: ApiRequestOptions
): Promise<T> {
  let url: string;
  let method: string = 'GET';
  let body: any = undefined;
  const headers: Record<string, string> = {};
  
  // Determine if we're using the simple URL form or the options form
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    
    if (options) {
      method = options.method || 'GET';
      body = options.body || options.data; // Acceptă și 'data' pentru compatibilitate
      
      // Merge custom headers
      if (options.headers) {
        Object.assign(headers, options.headers);
      }
    }
  } else {
    url = urlOrOptions.url;
    method = urlOrOptions.method;
    body = urlOrOptions.data;
  }
  
  // Add Content-Type for all requests
  headers["Content-Type"] = "application/json";
  
  // Special case for user endpoint - look for localStorage user data first
  if (url === '/api/auth/user' || url.startsWith('/api/auth/user?')) {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        // If we have cached user data with id and companyId, use it
        if (parsedUser && parsedUser.id && parsedUser.companyId) {
          console.log('Using cached user data instead of API request');
          return parsedUser as T;
        }
      }
    } catch (e) {
      console.warn('Error accessing cached user data, proceeding with API request', e);
    }
  }
  
  // Add Authorization header - DOAR pentru endpoint-uri care necesită autentificare
  // Endpoint-urile publice de autentificare NU trebuie să aibă token
  const publicAuthEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
  const isPublicAuthEndpoint = publicAuthEndpoints.some(endpoint => url.includes(endpoint));
  
  if (!isPublicAuthEndpoint) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log(`Using auth token for protected endpoint: ${token.substring(0, 10)}...`);
    } else {
      console.warn("No auth token available for API request");
      
      // Try to get token from localStorage directly as fallback
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const userData = JSON.parse(localUser);
          if (userData?.token) {
            headers["Authorization"] = `Bearer ${userData.token}`;
            console.log("Using fallback auth token from localStorage");
          }
        }
      } catch (e) {
        console.error("Error getting fallback token", e);
      }
    }
  } else {
    console.log(`Public auth endpoint detected (${url}), skipping token check`);
  }

  try {
    // Handle URL params if provided
    let finalUrl = url;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }
    
    // Construiește URL-ul complet, adăugând baza API dacă e necesar
    const fullUrl = finalUrl.startsWith('http') 
      ? finalUrl 
      : `${API_BASE_URL}${finalUrl}`;
      
    console.log(`API Request: ${method} ${fullUrl}`);
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include", // Keep session cookies for backward compatibility
    });

    // Handle authentication errors specifically
    if (res.status === 401) {
      console.error(`Authentication failed for ${finalUrl} - User not logged in`);
      
      // For collaboration endpoints, return a structured error object instead of throwing
      if (finalUrl.includes('/api/collaboration/')) {
        return { error: 'Authentication required', status: 401, items: [] } as unknown as T;
      }
      
      // Try to refresh the token DOAR pentru endpoint-uri protected (NU pentru login/register/refresh)
      // Pentru endpoint-urile publice de auth, 401 înseamnă credentials invalide, NU token expirat
      const isPublicAuthEndpoint = publicAuthEndpoints.some(endpoint => url.includes(endpoint));
      
      if (!isPublicAuthEndpoint) {
        console.log('Attempting to refresh token due to 401 error...');
        const refreshSuccess = await refreshToken();
        
        if (refreshSuccess) {
          console.log('Token refreshed successfully, retrying the original request');
          
          // Get the new token after refresh
          const newToken = getAuthToken();
          if (newToken) {
            // Update Authorization header with new token
            headers["Authorization"] = `Bearer ${newToken}`;
            
            // Retry the original request with the new token
            console.log(`Retrying request to ${fullUrl} with new token`);
            const retryRes = await fetch(fullUrl, {
              method,
              headers,
              body: body ? JSON.stringify(body) : undefined,
              credentials: "include"
            });
            
            if (retryRes.ok) {
              console.log('Request retry successful after token refresh');
              const retryText = await retryRes.text();
              return retryText ? JSON.parse(retryText) : null as T;
            } else {
              console.error(`Retry failed with status: ${retryRes.status}`);
            }
          }
        }
        
        // If refresh failed, clear localStorage and redirect
        console.warn('Token refresh failed - clearing cached auth data');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      } else {
        // Pentru endpoint-uri publice de auth, 401 înseamnă credentials invalide
        console.error(`Invalid credentials for ${url}`);
      }
      
      throw new Error('Authentication required: Please login');
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error (${res.status}): ${errorText}`);
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    }
    
    try {
      const text = await res.text();
      
      // Special case for empty response
      if (!text.trim()) {
        return null as unknown as T;
      }
      
      // Check if the response starts with HTML markers (which would indicate a non-JSON response)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error('Received HTML instead of JSON:', text.substring(0, 100) + '...');
        
        // Handle collaboration endpoints with a graceful empty response
        if (url.includes('/api/collaboration/') || finalUrl.includes('/api/collaboration/')) {
          console.warn(`HTML response for collaboration endpoint - returning empty data structure`);
          return { error: 'Invalid response format', status: 500, items: [] } as unknown as T;
        }
        
        // Handle invoice-customers endpoint with a graceful empty response
        if (url.includes('/api/invoice-customers') || finalUrl.includes('/api/invoice-customers')) {
          console.warn(`HTML response for invoice-customers endpoint - returning empty array`);
          return [] as unknown as T;
        }
        
        // If we get HTML for a user API call, there might be an auth issue
        if (url === '/api/auth/user' || url.startsWith('/api/auth/user?')) {
          console.warn('Authentication issue detected - redirecting to login');
          localStorage.removeItem('user');
          
          // Redirect to login if not already there
          if (window.location.pathname !== '/login' && window.location.pathname !== '/auth/login') {
            window.location.href = '/login';
          }
        }
        
        throw new Error('Invalid response format: Expected JSON but received HTML');
      }
      
      // Parse the JSON response
      return text ? JSON.parse(text) : null as T;
    } catch (error: any) {
      console.error('Error parsing API response:', error);
      throw new Error(`Failed to parse response: ${error.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn =
  <T>({ on401: unauthorizedBehavior }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Special case for user endpoint - look for localStorage user data first
    if (url === '/api/auth/user' || url.startsWith('/api/auth/user?')) {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          // If we have cached user data with id and companyId, use it
          if (parsedUser && parsedUser.id && parsedUser.companyId) {
            console.log('Using cached user data for query instead of API request');
            return parsedUser;
          }
        }
      } catch (e) {
        console.warn('Error accessing cached user data for query, proceeding with API request', e);
      }
    }
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    
    // Try multiple sources for auth token to maximize success
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      // Auth token available
    } else {
      // No token available - normal for unauthenticated users
      
      // Try to get token from localStorage directly as fallback
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const userData = JSON.parse(localUser);
          if (userData?.token) {
            headers["Authorization"] = `Bearer ${userData.token}`;
            console.log("Query: Using fallback auth token from localStorage");
          }
        }
      } catch (e) {
        console.error("Error getting fallback token for query", e);
      }
    }
    
    try {
      // Construiește URL-ul complet, adăugând baza API dacă e necesar
      const fullUrl = url.startsWith('http') 
        ? url 
        : `${API_BASE_URL}${url}`;
        
      const res = await fetch(fullUrl, {
        headers,
        credentials: "include", // Keep session cookies
      });
      
      // Handle authentication errors
      if (res.status === 401) {
        // 401 response - normal for unauthenticated users
        
        // Try to refresh the token
        if (!url.includes('/api/auth/refresh')) {
          // Attempt token refresh silently
          const refreshSuccess = await refreshToken();
          
          if (refreshSuccess) {
            console.log('Token refreshed successfully, retrying the original query');
            
            // Get the new token after refresh
            const newToken = getAuthToken();
            if (newToken) {
              // Update Authorization header with new token
              headers["Authorization"] = `Bearer ${newToken}`;
              
              // Retry the original request with the new token
              console.log(`Retrying query to ${fullUrl} with new token`);
              const retryRes = await fetch(fullUrl, {
                headers,
                credentials: "include"
              });
              
              if (retryRes.ok) {
                console.log('Query retry successful after token refresh');
                const retryText = await retryRes.text();
                try {
                  return retryText ? JSON.parse(retryText) : null;
                } catch (e) {
                  console.error('Error parsing retry response:', e);
                  if (unauthorizedBehavior === "returnNull") {
                    return null;
                  }
                  throw new Error('Failed to parse retry response');
                }
              } else {
                console.error(`Query retry failed with status: ${retryRes.status}`);
              }
            }
          }
        }
        
        // Handle 401 responses based on the configured behavior
        if (unauthorizedBehavior === "returnNull") {
          // Returning null for unauthorized request (normal behavior)
          return null;
        } else {
          throw new Error('Authentication required');
        }
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Query API Error (${res.status}): ${errorText}`);
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      try {
        const text = await res.text();
        
        // Special case for empty response
        if (!text.trim()) {
          return null;
        }
        
        // Check if the response starts with HTML markers
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.error('Received HTML instead of JSON:', text.substring(0, 100) + '...');
          
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
          
          throw new Error('Invalid response format: Expected JSON but received HTML');
        }
        
        // Parse and return the JSON response
        return text ? JSON.parse(text) : null;
      } catch (parseError: any) {
        console.error('Error parsing query API response:', parseError);
        throw new Error(`Failed to parse response: ${parseError.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Query failed for ${url}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      // Default queryFn pentru toate query-urile care nu specifică unul explicit
      // Folosește primul element din queryKey ca URL pentru request API
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return await apiRequest(url, { method: 'GET' });
      },
    },
  },
});
