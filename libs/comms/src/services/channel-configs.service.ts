/**
 * Channel Configurations Service
 * 
 * This service handles operations related to communication channel configurations,
 * including setup, retrieval, updating, and deleting channel integrations.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { 
  channelConfigurations,
  CommunicationChannel
} from '../../../../shared/schema/communications.schema';
import { Logger } from "@common/logger";

// Create a logger for channel operations
const logger = new Logger('ChannelConfigsService');

/**
 * Service for managing communication channel configurations
 */
export class ChannelConfigsService {
  constructor(private db: PostgresJsDatabase) {}

  /**
   * Create a new channel configuration
   * 
   * @param companyId Company ID
   * @param data Channel configuration data
   * @returns The created configuration
   */
  async createChannelConfig(companyId: string, data: {
    channel: CommunicationChannel;
    name: string;
    isActive: boolean;
    credentials: Record<string, any>;
    settings?: Record<string, any>;
    webhookUrl?: string;
    createdBy?: string;
  }) {
    try {
      logger.info(`Creating channel configuration for ${data.channel} in company ${companyId}`);
      
      // Encrypt sensitive credentials in a real-world application
      const encryptedCredentials = JSON.stringify(data.credentials);
      
      const [config] = await this.db.insert(channelConfigurations).values({
        companyId,
        channel: data.channel,
        name: data.name,
        isActive: data.isActive,
        credentials: encryptedCredentials,
        settings: data.settings ? JSON.stringify(data.settings) : '{}',
        webhookUrl: data.webhookUrl,
        createdBy: data.createdBy
      }).returning();
      
      // Sanitize credentials before returning
      return {
        ...config,
        credentials: 'REDACTED_FOR_SECURITY'
      };
    } catch (error) {
      logger.error(`Failed to create channel configuration for ${data.channel}`, error);
      throw new Error(`Failed to create channel configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a channel configuration by ID
   * 
   * @param configId Configuration ID
   * @param companyId Company ID
   * @param includeCredentials Whether to include decrypted credentials
   * @returns The channel configuration
   */
  async getChannelConfigById(configId: string, companyId: string, includeCredentials: boolean = false) {
    try {
      const result = await this.db.select()
        .from(channelConfigurations)
        .where(
          and(
            eq(channelConfigurations.id, configId),
            eq(channelConfigurations.companyId, companyId)
          )
        );
      
      if (result.length === 0) {
        return null;
      }
      
      // Sanitize credentials if not requested
      if (!includeCredentials) {
        return {
          ...result[0],
          credentials: 'REDACTED_FOR_SECURITY'
        };
      }
      
      // Decrypt credentials in a real-world application
      return {
        ...result[0],
        credentials: JSON.parse(result[0].credentials)
      };
    } catch (error) {
      logger.error(`Failed to get channel configuration ${configId}`, error);
      throw new Error(`Failed to get channel configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get channel configurations for a company
   * 
   * @param companyId Company ID
   * @param channel Optional filter by channel type
   * @returns Array of channel configurations
   */
  async getChannelConfigs(companyId: string, channel?: CommunicationChannel) {
    try {
      // Build WHERE conditions array
      const whereConditions: any[] = [eq(channelConfigurations.companyId, companyId)];
      
      // Apply channel filter if provided
      if (channel) {
        whereConditions.push(eq(channelConfigurations.channel, channel));
      }
      
      // Execute the query with all conditions
      const configs = await this.db.select()
        .from(channelConfigurations)
        .where(and(...whereConditions));
      
      // Sanitize credentials in results
      return configs.map(config => ({
        ...config,
        credentials: 'REDACTED_FOR_SECURITY'
      }));
    } catch (error) {
      logger.error(`Failed to get channel configurations for company ${companyId}`, error);
      throw new Error(`Failed to get channel configurations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update a channel configuration
   * 
   * @param configId Configuration ID
   * @param companyId Company ID
   * @param data Update data
   * @returns The updated configuration
   */
  async updateChannelConfig(configId: string, companyId: string, data: {
    name?: string;
    isActive?: boolean;
    credentials?: Record<string, any>;
    settings?: Record<string, any>;
    webhookUrl?: string;
    updatedBy?: string;
  }) {
    try {
      logger.info(`Updating channel configuration ${configId}`);
      
      // Get current configuration to handle partial updates correctly
      const currentConfig = await this.getChannelConfigById(configId, companyId, true);
      if (!currentConfig) {
        throw new Error(`Channel configuration not found: ${configId}`);
      }
      
      // Prepare update data
      const updateData: any = {};
      
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }
      
      if (data.webhookUrl !== undefined) {
        updateData.webhookUrl = data.webhookUrl;
      }
      
      if (data.updatedBy !== undefined) {
        updateData.updatedBy = data.updatedBy;
      }
      
      // Handle credentials update (encrypt in real-world app)
      if (data.credentials !== undefined) {
        updateData.credentials = JSON.stringify(data.credentials);
      }
      
      // Handle settings update
      if (data.settings !== undefined) {
        const currentSettings = currentConfig.settings ? 
          (typeof currentConfig.settings === 'string' ? 
            JSON.parse(currentConfig.settings) : currentConfig.settings) : 
          {};
        const newSettings = { ...currentSettings, ...data.settings };
        updateData.settings = JSON.stringify(newSettings);
      }
      
      // Add updated timestamp
      updateData.updatedAt = new Date();
      
      // Perform the update
      const [updatedConfig] = await this.db.update(channelConfigurations)
        .set(updateData)
        .where(
          and(
            eq(channelConfigurations.id, configId),
            eq(channelConfigurations.companyId, companyId)
          )
        )
        .returning();
      
      // Sanitize credentials before returning
      return {
        ...updatedConfig,
        credentials: 'REDACTED_FOR_SECURITY'
      };
    } catch (error) {
      logger.error(`Failed to update channel configuration ${configId}`, error);
      throw new Error(`Failed to update channel configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a channel configuration
   * 
   * @param configId Configuration ID
   * @param companyId Company ID
   * @returns True if deleted
   */
  async deleteChannelConfig(configId: string, companyId: string) {
    try {
      logger.info(`Deleting channel configuration ${configId}`);
      
      const result = await this.db.delete(channelConfigurations)
        .where(
          and(
            eq(channelConfigurations.id, configId),
            eq(channelConfigurations.companyId, companyId)
          )
        );
      
      return result && result.length > 0;
    } catch (error) {
      logger.error(`Failed to delete channel configuration ${configId}`, error);
      throw new Error(`Failed to delete channel configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get configuration for a specific channel type
   * 
   * @param companyId Company ID
   * @param channel Channel type
   * @param active Get only active configurations
   * @returns Channel configurations
   */
  async getConfigsForChannel(companyId: string, channel: CommunicationChannel, active: boolean = true) {
    try {
      // Build WHERE conditions
      const whereConditions: any[] = [
        eq(channelConfigurations.companyId, companyId),
        eq(channelConfigurations.channel, channel)
      ];
      
      // Filter by active status if requested
      if (active) {
        whereConditions.push(eq(channelConfigurations.isActive, true));
      }
      
      // Build and execute query with all conditions
      const configs = await this.db.select()
        .from(channelConfigurations)
        .where(and(...whereConditions));
      
      // Decrypt credentials in a real-world application
      return configs.map(config => ({
        ...config,
        credentials: typeof config.credentials === 'string' ? JSON.parse(config.credentials) : config.credentials,
        settings: config.settings && typeof config.settings === 'string' ? JSON.parse(config.settings) : (config.settings || {})
      }));
    } catch (error) {
      logger.error(`Failed to get configs for channel ${channel}`, error);
      throw new Error(`Failed to get channel configurations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}