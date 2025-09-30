/**
 * Channel Configurations Router
 * 
 * This router handles HTTP requests related to communication channel configurations.
 */

import express, { Router, Request, Response } from 'express';
import { ChannelConfigsService } from '../services/channel-configs.service';
import { requireAuth } from '../../../common/middleware/auth-guard';
import { Logger } from '../../../common/logger';
import { CommunicationChannel } from '../../../../shared/schema/communications.schema';

// Create a logger for the channel config routes
const logger = new Logger('ChannelConfigsRouter');

/**
 * Router for channel configurations endpoints
 */
export class ChannelConfigsRouter {
  private router: Router;
  
  constructor(private channelConfigsService: ChannelConfigsService) {
    this.router = express.Router();
    this.setupRoutes();
  }
  
  /**
   * Set up the routes for the router
   */
  private setupRoutes() {
    // Get all channel configurations
    this.router.get('/', requireAuth(), this.getChannelConfigs.bind(this));
    
    // Get configurations for a specific channel type
    this.router.get('/type/:channelType', requireAuth(), this.getChannelConfigsByType.bind(this));
    
    // Get a specific configuration
    this.router.get('/:configId', requireAuth(), this.getChannelConfig.bind(this));
    
    // Create a new channel configuration
    this.router.post('/', requireAuth(), this.createChannelConfig.bind(this));
    
    // Update a channel configuration
    this.router.patch('/:configId', requireAuth(), this.updateChannelConfig.bind(this));
    
    // Delete a channel configuration
    this.router.delete('/:configId', requireAuth(), this.deleteChannelConfig.bind(this));
  }
  
  /**
   * Get the configured router
   * @returns Express Router
   */
  public getRouter(): Router {
    return this.router;
  }
  
  /**
   * Handler for GET /channels
   */
  private async getChannelConfigs(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      const configs = await this.channelConfigsService.getChannelConfigs(companyId);
      
      return res.json(configs);
    } catch (error) {
      logger.error('Error getting channel configurations', error);
      return res.status(500).json({ 
        error: 'Failed to get channel configurations',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for GET /channels/type/:channelType
   */
  private async getChannelConfigsByType(req: Request, res: Response) {
    try {
      const { channelType } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Validate channel type
      if (!Object.values(CommunicationChannel).includes(channelType as CommunicationChannel)) {
        return res.status(400).json({ error: 'Invalid channel type' });
      }
      
      const active = req.query.active === 'true';
      
      const configs = await this.channelConfigsService.getChannelConfigs(
        companyId, 
        channelType as CommunicationChannel
      );
      
      return res.json(configs);
    } catch (error) {
      logger.error(`Error getting configurations for channel type ${req.params.channelType}`, error);
      return res.status(500).json({ 
        error: 'Failed to get channel configurations',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for GET /channels/:configId
   */
  private async getChannelConfig(req: Request, res: Response) {
    try {
      const { configId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Check if includeCredentials parameter is present
      const includeCredentials = req.query.includeCredentials === 'true';
      
      const config = await this.channelConfigsService.getChannelConfigById(
        configId, 
        companyId,
        includeCredentials
      );
      
      if (!config) {
        return res.status(404).json({ error: 'Channel configuration not found' });
      }
      
      return res.json(config);
    } catch (error) {
      logger.error(`Error getting channel configuration ${req.params.configId}`, error);
      return res.status(500).json({ 
        error: 'Failed to get channel configuration',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for POST /channels
   */
  private async createChannelConfig(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Validate required fields
      if (!req.body.channel) {
        return res.status(400).json({ error: 'Channel is required' });
      }
      
      if (!req.body.name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      if (!req.body.credentials) {
        return res.status(400).json({ error: 'Credentials are required' });
      }
      
      // Create the channel configuration
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
        error: 'Failed to create channel configuration',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for PATCH /channels/:configId
   */
  private async updateChannelConfig(req: Request, res: Response) {
    try {
      const { configId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Check if configuration exists
      const config = await this.channelConfigsService.getChannelConfigById(configId, companyId);
      if (!config) {
        return res.status(404).json({ error: 'Channel configuration not found' });
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
        error: 'Failed to update channel configuration',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for DELETE /channels/:configId
   */
  private async deleteChannelConfig(req: Request, res: Response) {
    try {
      const { configId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Delete the configuration
      const deleted = await this.channelConfigsService.deleteChannelConfig(configId, companyId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Channel configuration not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting channel configuration ${req.params.configId}`, error);
      return res.status(500).json({ 
        error: 'Failed to delete channel configuration',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}