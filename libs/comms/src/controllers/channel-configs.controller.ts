/**
 * Channel Configurations Controller
 * 
 * This controller handles HTTP requests related to communication channel configurations.
 * It isolates business logic from the request/response handling.
 */

import { Request, Response } from 'express';
import { ChannelConfigsService } from '../services/channel-configs.service';
import { CommunicationChannel } from '../../../../shared/schema/communications.schema';
import { Logger } from "@common/logger";

// Create a logger for the channel configs controller
const logger = new Logger('ChannelConfigsController');

/**
 * Controller for channel configurations
 */
export class ChannelConfigsController {
  constructor(private channelConfigsService: ChannelConfigsService) {}

  /**
   * Get all channel configurations for a company
   */
  async getChannelConfigs(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const channel = req.query.channel as CommunicationChannel | undefined;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const configs = await this.channelConfigsService.getChannelConfigs(companyId, channel);
      
      return res.json(configs);
    } catch (error) {
      logger.error('Error getting channel configurations', error);
      return res.status(500).json({ 
        message: 'Failed to get channel configurations',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get a specific channel configuration by ID
   */
  async getChannelConfig(req: Request, res: Response) {
    try {
      const { configId } = req.params;
      const companyId = req.user?.companyId;
      const includeCredentials = req.query.includeCredentials === 'true';
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const config = await this.channelConfigsService.getChannelConfigById(configId, companyId, includeCredentials);
      
      if (!config) {
        return res.status(404).json({ message: 'Channel configuration not found' });
      }
      
      return res.json(config);
    } catch (error) {
      logger.error(`Error getting channel configuration ${req.params.configId}`, error);
      return res.status(500).json({ 
        message: 'Failed to get channel configuration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Create a new channel configuration
   */
  async createChannelConfig(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Validate required fields
      if (!req.body.channel) {
        return res.status(400).json({ message: 'Channel is required' });
      }
      
      if (!req.body.name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      
      if (!req.body.credentials) {
        return res.status(400).json({ message: 'Credentials are required' });
      }
      
      // Create the configuration
      const config = await this.channelConfigsService.createChannelConfig(companyId, {
        channel: req.body.channel,
        name: req.body.name,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        credentials: req.body.credentials,
        settings: req.body.settings,
        webhookUrl: req.body.webhookUrl,
        createdBy: userId
      });
      
      return res.status(201).json(config);
    } catch (error) {
      logger.error('Error creating channel configuration', error);
      return res.status(500).json({ 
        message: 'Failed to create channel configuration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update a channel configuration
   */
  async updateChannelConfig(req: Request, res: Response) {
    try {
      const { configId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Check if configuration exists
      const config = await this.channelConfigsService.getChannelConfigById(configId, companyId);
      if (!config) {
        return res.status(404).json({ message: 'Channel configuration not found' });
      }
      
      // Update the configuration
      const updatedConfig = await this.channelConfigsService.updateChannelConfig(configId, companyId, {
        name: req.body.name,
        isActive: req.body.isActive,
        credentials: req.body.credentials,
        settings: req.body.settings,
        webhookUrl: req.body.webhookUrl,
        updatedBy: userId
      });
      
      return res.json(updatedConfig);
    } catch (error) {
      logger.error(`Error updating channel configuration ${req.params.configId}`, error);
      return res.status(500).json({ 
        message: 'Failed to update channel configuration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Delete a channel configuration
   */
  async deleteChannelConfig(req: Request, res: Response) {
    try {
      const { configId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const deleted = await this.channelConfigsService.deleteChannelConfig(configId, companyId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Channel configuration not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting channel configuration ${req.params.configId}`, error);
      return res.status(500).json({ 
        message: 'Failed to delete channel configuration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get configurations for a specific channel type
   */
  async getConfigsForChannel(req: Request, res: Response) {
    try {
      const { channel } = req.params;
      const companyId = req.user?.companyId;
      const activeOnly = req.query.activeOnly !== 'false';
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      if (!Object.values(CommunicationChannel).includes(channel as CommunicationChannel)) {
        return res.status(400).json({ message: 'Invalid channel type' });
      }
      
      const configs = await this.channelConfigsService.getConfigsForChannel(
        companyId, 
        channel as CommunicationChannel,
        activeOnly
      );
      
      return res.json(configs);
    } catch (error) {
      logger.error(`Error getting configurations for channel ${req.params.channel}`, error);
      return res.status(500).json({ 
        message: 'Failed to get channel configurations',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}