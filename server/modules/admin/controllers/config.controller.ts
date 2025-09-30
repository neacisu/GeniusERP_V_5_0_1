/**
 * Configuration Management Controller
 * 
 * This controller handles system configuration operations,
 * including retrieving, updating, and managing system-wide settings.
 */

import { Request, Response } from 'express';
import { Logger } from '../../../common/logger';
import { ConfigService } from '../services/config.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { z } from 'zod';

// Create logger instance
const logger = new Logger('ConfigController');

/**
 * Register the config controller routes with the Express application
 * @param app Express application
 * @param configService Config service instance
 */
export function registerConfigControllerRoutes(app: any, configService: ConfigService) {
  const BASE_PATH = '/api/admin/config';

  /**
   * Get all configuration settings
   * 
   * @route GET /api/admin/config
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(BASE_PATH, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get all configuration settings
      const configs = await configService.getAllConfigs();

      return res.status(200).json({
        success: true,
        data: configs
      });
    } catch (error) {
      logger.error('Error retrieving configuration settings', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get a configuration setting by key
   * 
   * @route GET /api/admin/config/:key
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/:key`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const key = req.params.key;

      // Get configuration by key
      const config = await configService.getConfig(key);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuration setting not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error(`Error retrieving configuration setting with key ${req.params.key}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Update a configuration setting
   * 
   * @route PUT /api/admin/config/:key
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.put(`${BASE_PATH}/:key`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const { value, description } = req.body;

      // Validate request body
      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Value is required'
        });
      }

      // Update configuration
      const updatedConfig = await configService.setConfig(key, value, description);

      logger.info(`Configuration setting updated: ${key} by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'Configuration setting updated successfully',
        data: updatedConfig
      });
    } catch (error) {
      logger.error(`Error updating configuration setting with key ${req.params.key}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Delete a configuration setting
   * 
   * @route DELETE /api/admin/config/:key
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.delete(`${BASE_PATH}/:key`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const key = req.params.key;

      // Check if configuration exists
      const existingConfig = await configService.getConfig(key);
      if (!existingConfig) {
        return res.status(404).json({
          success: false,
          message: 'Configuration setting not found'
        });
      }

      // Delete configuration
      await configService.deleteConfig(key);

      logger.info(`Configuration setting deleted: ${key} by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'Configuration setting deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting configuration setting with key ${req.params.key}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get configuration setting by category
   * 
   * @route GET /api/admin/config/category/:category
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/category/:category`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const category = req.params.category;

      // Get configurations by category
      const configs = await configService.getConfigsByCategory(category);

      return res.status(200).json({
        success: true,
        data: configs
      });
    } catch (error) {
      logger.error(`Error retrieving configuration settings for category ${req.params.category}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Update multiple configuration settings
   * 
   * @route PATCH /api/admin/config/batch
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.patch(`${BASE_PATH}/batch`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const { configs } = req.body;

      // Validate request body
      if (!configs || !Array.isArray(configs)) {
        return res.status(400).json({
          success: false,
          message: 'Configs must be provided as an array'
        });
      }

      // Validate each config item
      for (const config of configs) {
        if (!config.key || config.value === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Each config item must have a key and value'
          });
        }
      }

      // Update configurations in batch
      const results = await Promise.all(
        configs.map(config => configService.setConfig(config.key, config.value, config.description))
      );

      logger.info(`Batch configuration update by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'Configuration settings updated successfully',
        data: results
      });
    } catch (error) {
      logger.error('Error updating configuration settings in batch', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Reset configuration to default values
   * 
   * @route POST /api/admin/config/reset
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(`${BASE_PATH}/reset`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Reset configurations to default values
      await configService.resetToDefaults();

      logger.info(`Configuration settings reset to defaults by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'Configuration settings reset to defaults successfully'
      });
    } catch (error) {
      logger.error('Error resetting configuration settings to defaults', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  logger.info('Config controller routes registered');
}