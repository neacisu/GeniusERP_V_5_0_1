/**
 * API Connection Service
 * 
 * Manages external API connections for BPM processes including
 * connection configuration, testing, and execution.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, like, or, desc, SQL, count } from 'drizzle-orm';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { createModuleLogger } from "@common/logger/loki-logger";
import { 
  bpmApiConnections,
  ApiConnection,
  ApiConnectionCreate,
  ApiConnectionUpdate,
  BpmApiConnectionType
} from '../schema/bpm.schema';

const logger = createModuleLogger('ApiConnectionService');

export class ApiConnectionService {
  constructor(private db: PostgresJsDatabase<any>) {}
  
  /**
   * Create a new API connection
   */
  async createApiConnection(data: ApiConnectionCreate): Promise<ApiConnection> {
    logger.debug('Creating API connection', { data });
    
    try {
      const [connection] = await this.db
        .insert(bpmApiConnections)
        .values(data)
        .returning();
      
      logger.debug('Created API connection', { connectionId: connection.id });
      return connection;
    } catch (error) {
      logger.error('Failed to create API connection', { error, data });
      throw error;
    }
  }
  
  /**
   * Get an API connection by ID
   */
  async getApiConnection(id: string, companyId: string): Promise<ApiConnection | null> {
    logger.debug('Getting API connection', { id, companyId });
    
    try {
      const [connection] = await this.db
        .select()
        .from(bpmApiConnections)
        .where(and(
          eq(bpmApiConnections.id, id),
          eq(bpmApiConnections.companyId, companyId)
        ));
      
      return connection || null;
    } catch (error) {
      logger.error('Failed to get API connection', { error, id, companyId });
      throw error;
    }
  }
  
  /**
   * Get all API connections for a company with filtering and pagination
   */
  async getApiConnections(
    companyId: string, 
    filter: { 
      provider?: string; 
      isActive?: boolean; 
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: ApiConnection[]; total: number; page: number; limit: number }> {
    logger.debug('Getting API connections', { companyId, filter });
    
    try {
      const { provider, isActive, search, page = 1, limit = 25 } = filter;
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions: SQL[] = [eq(bpmApiConnections.companyId, companyId)];
      
      if (provider) {
        whereConditions.push(eq(bpmApiConnections.type, provider as BpmApiConnectionType));
      }
      
      if (isActive !== undefined) {
        whereConditions.push(eq(bpmApiConnections.isActive, isActive));
      }
      
      if (search) {
        const searchCondition = or(
          like(bpmApiConnections.name, `%${search}%`),
          like(bpmApiConnections.description || '', `%${search}%`)
        );
        if (searchCondition) {
          whereConditions.push(searchCondition);
        }
      }
      
      // Get total count
      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
      const countResult = await this.db
        .select({ count: count() })
        .from(bpmApiConnections)
        .where(whereClause);
      const totalCount = Number(countResult[0]?.count || 0);
      
      // Get paginated data
      const connections = await this.db
        .select()
        .from(bpmApiConnections)
        .where(whereClause)
        .orderBy(desc(bpmApiConnections.updatedAt))
        .limit(limit)
        .offset(offset);
      
      return {
        data: connections,
        total: totalCount,
        page,
        limit
      };
    } catch (error) {
      logger.error('Failed to get API connections', { error, companyId, filter });
      throw error;
    }
  }
  
  /**
   * Update an API connection
   */
  async updateApiConnection(id: string, companyId: string, data: ApiConnectionUpdate): Promise<ApiConnection | null> {
    logger.debug('Updating API connection', { id, companyId, data });
    
    try {
      const [connection] = await this.db
        .update(bpmApiConnections)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(and(
          eq(bpmApiConnections.id, id),
          eq(bpmApiConnections.companyId, companyId)
        ))
        .returning();
      
      return connection || null;
    } catch (error) {
      logger.error('Failed to update API connection', { error, id, companyId, data });
      throw error;
    }
  }
  
  /**
   * Delete an API connection
   */
  async deleteApiConnection(id: string, companyId: string): Promise<boolean> {
    logger.debug('Deleting API connection', { id, companyId });
    
    try {
      const result = await this.db
        .delete(bpmApiConnections)
        .where(and(
          eq(bpmApiConnections.id, id),
          eq(bpmApiConnections.companyId, companyId)
        ));
      
      return result.length > 0;
    } catch (error) {
      logger.error('Failed to delete API connection', { error, id, companyId });
      throw error;
    }
  }
  
  /**
   * Test an API connection
   */
  async testApiConnection(id: string, companyId: string): Promise<{ success: boolean; message?: string; response?: any }> {
    logger.debug('Testing API connection', { id, companyId });
    
    try {
      // Get the connection
      const connection = await this.getApiConnection(id, companyId);
      
      if (!connection) {
        return { success: false, message: 'API connection not found' };
      }
      
      // Get connection configuration
      const configuration = connection.configuration as Record<string, any>;
      const { baseUrl, testEndpoint, method = 'GET', headers = {}, authData = {} } = configuration;
      
      if (!baseUrl) {
        return { success: false, message: 'Invalid API connection configuration: missing baseUrl' };
      }
      
      // Prepare the test request
      const url = testEndpoint ? `${baseUrl}${testEndpoint}` : baseUrl;
      
      // Prepare headers and authentication
      const requestHeaders: Record<string, string> = { ...headers };
      
      // Add authentication if present
      if (authData.type === 'basic' && authData.username && authData.password) {
        const auth = Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
        requestHeaders['Authorization'] = `Basic ${auth}`;
      } else if (authData.type === 'bearer' && authData.token) {
        requestHeaders['Authorization'] = `Bearer ${authData.token}`;
      } else if (authData.type === 'apiKey' && authData.key && authData.value) {
        // API key in header
        requestHeaders[authData.key] = authData.value;
      }
      
      // Make the test request
      const requestConfig: AxiosRequestConfig = {
        url,
        method: method as Method,
        headers: requestHeaders,
        timeout: 10000, // 10 seconds timeout
        validateStatus: null, // Don't throw on non-2xx responses
      };
      
      // If there's a query parameter for API key
      if (authData.type === 'apiKey' && authData.in === 'query' && authData.key && authData.value) {
        requestConfig.params = { [authData.key]: authData.value };
      }
      
      logger.debug('Making test request', { 
        url, 
        method,
        hasAuth: !!requestHeaders['Authorization'] || !!requestConfig.params
      });
      
      const response = await axios(requestConfig);
      
      // Update the lastUsedAt timestamp
      await this.db
        .update(bpmApiConnections)
        .set({ lastUsedAt: new Date() })
        .where(eq(bpmApiConnections.id, id));
      
      const isSuccess = response.status >= 200 && response.status < 300;
      
      return {
        success: isSuccess,
        message: isSuccess 
          ? 'API connection tested successfully' 
          : `API returned status code ${response.status}`,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        }
      };
    } catch (error: any) {
      logger.error('Failed to test API connection', { error, id, companyId });
      
      return {
        success: false,
        message: error.message || 'Failed to test API connection',
        response: {
          error: error.message,
          code: error.code
        }
      };
    }
  }
  
  /**
   * Execute an API request using a connection
   */
  async executeApiRequest(
    id: string,
    companyId: string,
    endpoint: string,
    method: string = 'GET',
    data?: any,
    queryParams?: Record<string, string>
  ): Promise<{ success: boolean; message?: string; data?: any; statusCode?: number }> {
    logger.debug('Executing API request', { id, companyId, endpoint, method });
    
    try {
      // Get the connection
      const connection = await this.getApiConnection(id, companyId);
      
      if (!connection) {
        return { success: false, message: 'API connection not found' };
      }
      
      // Get connection configuration
      const configuration = connection.configuration as Record<string, any>;
      const { baseUrl, headers = {}, authData = {} } = configuration;
      
      if (!baseUrl) {
        return { success: false, message: 'Invalid API connection configuration: missing baseUrl' };
      }
      
      // Prepare the request URL
      const url = `${baseUrl}${endpoint}`;
      
      // Prepare headers and authentication
      const requestHeaders: Record<string, string> = { ...headers };
      
      // Add authentication if present
      if (authData.type === 'basic' && authData.username && authData.password) {
        const auth = Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
        requestHeaders['Authorization'] = `Basic ${auth}`;
      } else if (authData.type === 'bearer' && authData.token) {
        requestHeaders['Authorization'] = `Bearer ${authData.token}`;
      } else if (authData.type === 'apiKey' && authData.key && authData.value && authData.in === 'header') {
        // API key in header
        requestHeaders[authData.key] = authData.value;
      }
      
      // Prepare the request configuration
      const requestConfig: AxiosRequestConfig = {
        url,
        method: method as Method,
        headers: requestHeaders,
        timeout: 30000, // 30 seconds timeout
        validateStatus: null, // Don't throw on non-2xx responses
      };
      
      // Add query parameters
      if (queryParams || (authData.type === 'apiKey' && authData.in === 'query')) {
        requestConfig.params = { ...queryParams };
        
        // Add API key to query if that's the auth method
        if (authData.type === 'apiKey' && authData.in === 'query' && authData.key && authData.value) {
          requestConfig.params[authData.key] = authData.value;
        }
      }
      
      // Add request body for non-GET requests
      if (method !== 'GET' && data) {
        requestConfig.data = data;
      }
      
      logger.debug('Making API request', { 
        url, 
        method,
        hasBody: !!requestConfig.data,
        hasParams: !!requestConfig.params
      });
      
      const response = await axios(requestConfig);
      
      // Update the lastUsedAt timestamp
      await this.db
        .update(bpmApiConnections)
        .set({ lastUsedAt: new Date() })
        .where(eq(bpmApiConnections.id, id));
      
      const isSuccess = response.status >= 200 && response.status < 300;
      
      return {
        success: isSuccess,
        message: isSuccess 
          ? 'API request executed successfully' 
          : `API returned status code ${response.status}`,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      logger.error('Failed to execute API request', { error, id, companyId, endpoint });
      
      return {
        success: false,
        message: error.message || 'Failed to execute API request',
        data: {
          error: error.message,
          code: error.code
        }
      };
    }
  }
}