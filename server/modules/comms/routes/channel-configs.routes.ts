/**
 * Channel Configurations Router
 * 
 * This router handles HTTP requests related to communication channel configurations.
 * It uses the ChannelConfigsController to handle the actual request/response logic.
 */

import { Router } from 'express';
import { ChannelConfigsService } from '../services/channel-configs.service';
import { ChannelConfigsController } from '../controllers/channel-configs.controller';
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';

/**
 * Router for channel configurations endpoints
 */
export class ChannelConfigsRouter {
  private router: Router;
  private channelConfigsController: ChannelConfigsController;
  
  constructor(channelConfigsService: ChannelConfigsService) {
    this.router = Router();
    this.channelConfigsController = new ChannelConfigsController(channelConfigsService);
    this.setupRoutes();
  }
  
  /**
   * Set up the routes for the router
   */
  private setupRoutes() {
    // Get all channel configurations
    this.router.get(
      '/',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.channelConfigsController.getChannelConfigs(req, res)
    );
    
    // Get configurations for a specific channel type
    this.router.get(
      '/type/:channel',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.channelConfigsController.getConfigsForChannel(req, res)
    );
    
    // Get a specific configuration
    this.router.get(
      '/:configId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.channelConfigsController.getChannelConfig(req, res)
    );
    
    // Create a new channel configuration
    this.router.post(
      '/',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.channelConfigsController.createChannelConfig(req, res)
    );
    
    // Update a channel configuration
    this.router.patch(
      '/:configId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.channelConfigsController.updateChannelConfig(req, res)
    );
    
    // Delete a channel configuration
    this.router.delete(
      '/:configId',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req, res) => this.channelConfigsController.deleteChannelConfig(req, res)
    );
  }
  
  /**
   * Get the configured router
   * @returns Express Router
   */
  public getRouter(): Router {
    return this.router;
  }
}