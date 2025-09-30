/**
 * Community Routes
 * 
 * Defines API routes for community features in the Collaboration module.
 */

import { Express, Router } from 'express';
import { CommunityService } from '../services/community.service';
import { CommunityController } from '../controllers/community.controller';
import { Logger } from '../../../common/logger';

// Create a logger instance for the community routes
const logger = new Logger('CommunityRoutes');

/**
 * Register community routes with Express app
 * 
 * @param app Express application
 * @param communityService Community service instance
 * @param communityController Optional pre-initialized controller
 */
export function registerCommunityRoutes(
  app: Express, 
  communityService: CommunityService, 
  communityController?: CommunityController
): void {
  logger.info('Registering community routes');
  
  // Create router for community routes
  const router = Router();
  
  // Use provided controller or create new one
  const controller = communityController || new CommunityController(communityService);
  
  // Register all routes on the controller
  controller.registerRoutes(router);
  
  // Mount the router at the community API path
  app.use('/api/collaboration/community', router);
  
  logger.info('Community routes registered successfully');
}