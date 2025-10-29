/**
 * Microsoft Graph Integration Client
 * 
 * Client for Microsoft Graph API integration.
 * Handles email, calendar, crm_contacts, and other Microsoft 365 services.
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { BaseIntegrationClient } from './base-integration.client';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';

/**
 * Microsoft Graph API scopes
 */
export enum MicrosoftGraphScope {
  EMAIL = 'Mail.Read Mail.Send',
  CALENDAR = 'Calendars.Read Calendars.ReadWrite',
  CONTACTS = 'Contacts.Read Contacts.ReadWrite',
  FILES = 'Files.Read Files.ReadWrite',
  USER_INFO = 'User.Read'
}

/**
 * Microsoft Graph Client for Microsoft 365 integration
 */
export class MicrosoftGraphClient extends BaseIntegrationClient {
  private static readonly AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
  private static readonly TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  private static readonly API_URL = 'https://graph.microsoft.com/v1.0';

  /**
   * Initialize the Microsoft Graph client
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  constructor(companyId: string, franchiseId?: string) {
    super(IntegrationProvider.MICROSOFT_GRAPH, companyId, franchiseId);
  }

  /**
   * Initialize the Microsoft Graph integration
   * @param clientId Microsoft app client ID
   * @param clientSecret Microsoft app client secret
   * @param tenantId Microsoft tenant ID
   * @param redirectUri OAuth redirect URI
   * @param scopes API permission scopes
   * @param userId User ID initializing the integration
   * @param webhookUrl Optional webhook URL for notifications
   * @param webhookSecret Optional webhook secret for signature verification
   */
  async initialize(
    clientId: string,
    clientSecret: string,
    tenantId: string,
    redirectUri: string,
    scopes: string[] = [MicrosoftGraphScope.EMAIL, MicrosoftGraphScope.USER_INFO],
    userId: string,
    webhookUrl?: string,
    webhookSecret?: string
  ): Promise<Integration> {
    try {
      // Check for existing integration
      const existingIntegration = await this.getIntegrationRecord();
      
      if (existingIntegration) {
        // Update existing integration
        const updatedIntegration = await this.updateIntegrationRecord(
          existingIntegration.id,
          {
            config: {
              clientId,
              clientSecret,
              tenantId,
              redirectUri,
              scopes,
              lastConnectionCheck: new Date().toISOString()
            },
            isConnected: false, // Requires OAuth flow to be completed
            status: IntegrationStatus.PENDING,
            webhookUrl,
            webhookSecret
          },
          userId
        );
        
        return updatedIntegration || existingIntegration;
      }
      
      // Create new integration
      const integration = await this.createIntegrationRecord(
        {
          clientId,
          clientSecret,
          tenantId,
          redirectUri,
          scopes,
          lastConnectionCheck: new Date().toISOString()
        },
        userId,
        webhookUrl,
        webhookSecret
      );
      
      return integration;
    } catch (error) {
      throw new Error(`Failed to initialize Microsoft Graph integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Complete OAuth flow after user grants permission
   * @param code Authorization code from OAuth redirect
   * @param userId User ID completing the OAuth flow
   */
  async completeOAuthFlow(code: string, userId: string): Promise<Integration> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const clientId = config['clientId'];
      const clientSecret = config['clientSecret'];
      const redirectUri = config['redirectUri'];
      
      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Microsoft Graph credentials not configured');
      }
      
      // Exchange authorization code for tokens
      const tokenResponse = await axios.post(
        MicrosoftGraphClient.TOKEN_URL,
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      
      // Update integration with tokens
      const updatedIntegration = await this.updateIntegrationRecord(
        integration.id,
        {
          config: {
            ...config,
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: expiresAt.toISOString(),
            lastConnectionCheck: new Date().toISOString()
          },
          isConnected: true,
          status: IntegrationStatus.ACTIVE
        },
        userId
      );
      
      // Verify connection
      const isConnected = await this.testConnection();
      
      if (!isConnected) {
        await this.updateStatus(integration.id, IntegrationStatus.ERROR, userId);
        throw new Error('Failed to connect to Microsoft Graph API');
      }
      
      return updatedIntegration || integration;
    } catch (error) {
      throw new Error(`Failed to complete Microsoft Graph OAuth flow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get OAuth authorization URL for user to grant permissions
   */
  async getAuthorizationUrl(): Promise<string> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const clientId = config['clientId'];
      const redirectUri = config['redirectUri'];
      const scopes = config['scopes'] || [MicrosoftGraphScope.EMAIL, MicrosoftGraphScope.USER_INFO];
      
      if (!clientId || !redirectUri) {
        throw new Error('Microsoft Graph credentials not configured');
      }
      
      const state = uuidv4();
      
      // Update integration with state for CSRF protection
      await this.updateIntegrationRecord(
        integration.id,
        {
          config: {
            ...config,
            oauthState: state
          }
        },
        'system'
      );
      
      // Build authorization URL
      const queryParams = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: Array.isArray(scopes) ? scopes.join(' ') : scopes,
        state
      });
      
      return `${MicrosoftGraphClient.AUTH_URL}?${queryParams.toString()}`;
    } catch (error) {
      throw new Error(`Failed to generate Microsoft Graph authorization URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Refresh access token when expired
   */
  private async refreshToken(): Promise<void> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        throw new Error('Integration not configured');
      }
      
      const config = integration.config as Record<string, any>;
      const clientId = config['clientId'];
      const clientSecret = config['clientSecret'];
      const refreshToken = config['refreshToken'];
      
      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Microsoft Graph credentials or refresh token not configured');
      }
      
      // Request new access token
      const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      
      // Update integration with new tokens
      await this.updateIntegrationRecord(
        integration.id,
        {
          config: {
            ...config,
            accessToken: access_token,
            refreshToken: refresh_token || config['refreshToken'],
            expiresAt: expiresAt.toISOString(),
            lastTokenRefresh: new Date().toISOString()
          },
          isConnected: true,
          status: IntegrationStatus.ACTIVE
        },
        'system'
      );
    } catch (error) {
      const integration = await this.getIntegrationRecord();
      
      if (integration) {
        await this.updateIntegrationRecord(
          integration.id,
          {
            isConnected: false,
            status: IntegrationStatus.ERROR,
            config: {
              ...(integration.config as Record<string, any>),
              lastError: error instanceof Error ? error.message : String(error),
              lastErrorTime: new Date().toISOString()
            }
          },
          'system'
        );
      }
      
      throw new Error(`Failed to refresh Microsoft Graph token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  private async getAccessToken(): Promise<string> {
    const integration = await this.getIntegrationRecord();
    
    if (!integration || !integration.config) {
      throw new Error('Integration not configured');
    }
    
    const config = integration.config as Record<string, any>;
    const accessToken = config['accessToken'];
    const expiresAt = config['expiresAt'] ? new Date(config['expiresAt']) : null;
    
    if (!accessToken) {
      throw new Error('Microsoft Graph access token not available');
    }
    
    // Check if token is expired or will expire in the next 5 minutes
    const now = new Date();
    const expirationBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (expiresAt && (now.getTime() + expirationBuffer) >= expiresAt.getTime()) {
      // Token is expired or will expire soon, refresh it
      await this.refreshToken();
      
      // Get updated integration record
      const updatedIntegration = await this.getIntegrationRecord();
      
      if (!updatedIntegration || !updatedIntegration.config) {
        throw new Error('Failed to get updated integration after token refresh');
      }
      
      const updatedConfig = updatedIntegration.config as Record<string, any>;
      return updatedConfig['accessToken'];
    }
    
    return accessToken;
  }

  /**
   * Test the connection to Microsoft Graph API
   */
  async testConnection(): Promise<boolean> {
    try {
      const integration = await this.getIntegrationRecord();
      
      if (!integration || !integration.config) {
        return false;
      }
      
      const config = integration.config as Record<string, any>;
      
      if (!config['accessToken']) {
        return false;
      }
      
      try {
        // Try to get access token (will refresh if needed)
        const accessToken = await this.getAccessToken();
        
        // Test connection by retrieving user profile
        const response = await axios.get(`${MicrosoftGraphClient.API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const isConnected = response.status === 200;
        
        if (isConnected && integration) {
          await this.updateIntegrationRecord(
            integration.id,
            {
              isConnected: true,
              status: IntegrationStatus.ACTIVE,
              config: {
                ...config,
                lastConnectionCheck: new Date().toISOString()
              }
            },
            'system'
          );
        }
        
        return isConnected;
      } catch (error) {
        // Handle token expiration or other API errors
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          try {
            // Try refreshing the token
            await this.refreshToken();
            
            // Try again with fresh token
            const accessToken = await this.getAccessToken();
            
            const retryResponse = await axios.get(`${MicrosoftGraphClient.API_URL}/me`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            const isConnected = retryResponse.status === 200;
            
            if (isConnected && integration) {
              await this.updateIntegrationRecord(
                integration.id,
                {
                  isConnected: true,
                  status: IntegrationStatus.ACTIVE,
                  config: {
                    ...config,
                    lastConnectionCheck: new Date().toISOString()
                  }
                },
                'system'
              );
            }
            
            return isConnected;
          } catch (refreshError) {
            // If refresh also fails, connection is definitely broken
            await this.updateIntegrationRecord(
              integration.id,
              {
                isConnected: false,
                status: IntegrationStatus.ERROR,
                config: {
                  ...config,
                  lastConnectionCheck: new Date().toISOString(),
                  lastError: refreshError instanceof Error ? refreshError.message : String(refreshError)
                }
              },
              'system'
            );
            
            return false;
          }
        }
        
        // Other errors
        await this.updateIntegrationRecord(
          integration.id,
          {
            isConnected: false,
            status: IntegrationStatus.ERROR,
            config: {
              ...config,
              lastConnectionCheck: new Date().toISOString(),
              lastError: error instanceof Error ? error.message : String(error)
            }
          },
          'system'
        );
        
        return false;
      }
    } catch (error) {
      const integration = await this.getIntegrationRecord();
      
      if (integration) {
        await this.updateIntegrationRecord(
          integration.id,
          {
            isConnected: false,
            status: IntegrationStatus.ERROR,
            config: {
              ...(integration.config as Record<string, any>),
              lastConnectionCheck: new Date().toISOString(),
              lastError: error instanceof Error ? error.message : String(error)
            }
          },
          'system'
        );
      }
      
      return false;
    }
  }

  /**
   * Get user emails
   * @param filter Optional OData filter
   * @param top Number of emails to retrieve (default: 10)
   */
  async getEmails(filter?: string, top: number = 10): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Build query URL
      const queryParams = new URLSearchParams();
      if (filter) queryParams.append('$filter', filter);
      queryParams.append('$top', top.toString());
      
      const response = await axios.get(
        `${MicrosoftGraphClient.API_URL}/me/messages?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get emails: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send an email
   * @param to Recipient email address
   * @param subject Email subject
   * @param body Email body content
   * @param isHtml Whether body is HTML (default: true)
   * @param cc Optional CC recipients
   * @param bcc Optional BCC recipients
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    body: string,
    isHtml: boolean = true,
    cc?: string | string[],
    bcc?: string | string[]
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Format recipients
      const toRecipients = Array.isArray(to) ? to : [to];
      const ccRecipients = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
      const bccRecipients = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];
      
      // Create email payload
      const emailPayload = {
        message: {
          subject,
          body: {
            contentType: isHtml ? 'HTML' : 'Text',
            content: body
          },
          toRecipients: toRecipients.map(email => ({ emailAddress: { address: email } })),
          ccRecipients: ccRecipients.map(email => ({ emailAddress: { address: email } })),
          bccRecipients: bccRecipients.map(email => ({ emailAddress: { address: email } }))
        },
        saveToSentItems: true
      };
      
      const response = await axios.post(
        `${MicrosoftGraphClient.API_URL}/me/sendMail`,
        emailPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get calendar events
   * @param startDateTime Start date (ISO string)
   * @param endDateTime End date (ISO string)
   */
  async getCalendarEvents(startDateTime?: string, endDateTime?: string): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      // Build query URL
      let url = `${MicrosoftGraphClient.API_URL}/me/events`;
      
      if (startDateTime && endDateTime) {
        url = `${MicrosoftGraphClient.API_URL}/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const integration = await this.getIntegrationRecord();
      if (integration) {
        await this.updateLastSynced(integration.id, 'system');
      }
      
      return response.data.value;
    } catch (error) {
      throw new Error(`Failed to get calendar events: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}