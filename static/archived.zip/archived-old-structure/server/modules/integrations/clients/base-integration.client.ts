/**
 * Base Integration Client
 * 
 * Abstract class for all external system integrations.
 * Provides common methods and properties for integration clients.
 */

import { v4 as uuidv4 } from 'uuid';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';
import { IntegrationsService } from '../services/integrations.service';

/**
 * Abstract base class for all integration clients
 */
export abstract class BaseIntegrationClient {
  protected readonly provider: typeof IntegrationProvider[keyof typeof IntegrationProvider];
  protected readonly companyId: string;
  protected readonly franchiseId?: string;
  protected readonly integrationsService: IntegrationsService;

  /**
   * Initialize the base integration client
   * @param provider Integration provider type
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID for multi-company setups
   */
  constructor(
    provider: typeof IntegrationProvider[keyof typeof IntegrationProvider],
    companyId: string,
    franchiseId?: string
  ) {
    this.provider = provider;
    this.companyId = companyId;
    this.franchiseId = franchiseId;
    this.integrationsService = new IntegrationsService();
  }

  /**
   * Initialize the integration
   * @param userId User ID initializing the integration
   */
  abstract initialize(...args: any[]): Promise<Integration>;

  /**
   * Test the connection to the external system
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Get the integration record
   */
  protected async getIntegrationRecord(): Promise<Integration | null> {
    const existingIntegration = await this.integrationsService.getIntegrationByProvider(
      this.provider,
      this.companyId,
      this.franchiseId
    );

    return existingIntegration;
  }

  /**
   * Create a new integration record
   * @param config Configuration object with API keys and settings
   * @param userId User ID creating the integration
   */
  protected async createIntegrationRecord(
    config: Record<string, any>,
    userId: string,
    webhookUrl?: string,
    webhookSecret?: string
  ): Promise<Integration> {
    return await this.integrationsService.createIntegration(
      this.provider,
      this.companyId,
      config,
      userId,
      this.franchiseId,
      undefined, // name
      undefined, // description
      webhookUrl,
      webhookSecret
    );
  }

  /**
   * Update an integration record
   * @param integrationId Integration ID to update
   * @param updates Fields to update (with config as Record<string, any>)
   * @param userId User ID performing the update
   */
  protected async updateIntegrationRecord(
    integrationId: string,
    updates: Partial<Omit<Integration, 'config'>> & { config?: Record<string, any>; webhookUrl?: string; webhookSecret?: string },
    userId: string
  ): Promise<Integration | null> {
    return await this.integrationsService.updateIntegration(
      integrationId,
      this.companyId,
      updates as any,
      userId
    );
  }

  /**
   * Update integration status
   * @param integrationId Integration ID
   * @param status New status
   * @param userId User ID updating the status
   */
  protected async updateStatus(
    integrationId: string,
    status: IntegrationStatus,
    userId: string
  ): Promise<void> {
    await this.integrationsService.updateIntegrationStatus(
      integrationId,
      this.companyId,
      status,
      userId
    );
  }

  /**
   * Update last synced timestamp
   * @param integrationId Integration ID
   * @param userId User ID who initiated the sync
   */
  protected async updateLastSynced(
    integrationId: string,
    userId: string
  ): Promise<void> {
    await this.integrationsService.updateLastSyncedAt(
      integrationId,
      this.companyId,
      userId
    );
  }

  /**
   * Check if the integration is connected
   * @returns Boolean indicating connection status
   */
  protected async isConnected(): Promise<boolean> {
    const integration = await this.getIntegrationRecord();
    return integration?.isConnected ?? false;
  }

  /**
   * Get the integration configuration
   * @returns Integration configuration or null
   */
  protected async getConfig(): Promise<Record<string, any> | null> {
    const integration = await this.getIntegrationRecord();
    return integration?.config as Record<string, any> | null;
  }

  /**
   * Update the integration configuration
   * @param configUpdates Configuration updates
   * @param userId User ID performing the update
   */
  protected async updateConfig(
    configUpdates: Record<string, any>,
    userId: string
  ): Promise<void> {
    const integration = await this.getIntegrationRecord();
    if (!integration) {
      throw new Error('Integration not found');
    }

    const currentConfig = (integration.config as Record<string, any>) || {};
    const newConfig = { ...currentConfig, ...configUpdates };

    await this.updateIntegrationRecord(
      integration.id,
      { config: newConfig },
      userId
    );
  }
}