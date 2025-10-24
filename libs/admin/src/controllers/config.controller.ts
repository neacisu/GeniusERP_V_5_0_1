/**
 * Configuration Management Controller
 * 
 * This controller handles system configuration operations,
 * including retrieving, updating, and managing system-wide settings.
 */

import { Request, Response } from 'express';
import { createModuleLogger } from "@common/logger/loki-logger";
import { ConfigService, ConfigScope } from '../services/config.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { z } from 'zod';

// Create logger instance
const logger = createModuleLogger('ConfigController');

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
      const { scope, companyId, userId, moduleId } = req.query;
      
      // Get all configuration settings with optional filters
      const configs = await configService.getAllConfigs({
        scope: scope as ConfigScope | undefined,
        companyId: companyId as string | undefined,
        userId: userId as string | undefined,
        moduleId: moduleId as string | undefined
      });

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
      const { scope, companyId, userId, moduleId } = req.query;

      // Validate scope parameter
      if (!scope || !Object.values(ConfigScope).includes(scope as ConfigScope)) {
        return res.status(400).json({
          success: false,
          message: 'Valid scope parameter is required (global, company, user, or module)'
        });
      }

      // Get configuration by key with scope
      const config = await configService.getConfig(key, {
        scope: scope as ConfigScope,
        companyId: companyId as string | undefined,
        userId: userId as string | undefined,
        moduleId: moduleId as string | undefined
      });

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
      const { value, description, scope, companyId, userId, moduleId } = req.body;

      // Validate request body
      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Value is required'
        });
      }

      // Validate scope parameter
      if (!scope || !Object.values(ConfigScope).includes(scope as ConfigScope)) {
        return res.status(400).json({
          success: false,
          message: 'Valid scope is required (global, company, user, or module)'
        });
      }

      // Update configuration
      const updatedConfig = await configService.setConfig(
        key,
        value,
        {
          scope: scope as ConfigScope,
          companyId,
          userId,
          moduleId,
          description
        },
        req.user?.id || 'system'
      );

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
        message: error instanceof Error ? error.message : 'Internal server error'
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
      const { scope, companyId, userId, moduleId } = req.query;

      // Validate scope parameter
      if (!scope || !Object.values(ConfigScope).includes(scope as ConfigScope)) {
        return res.status(400).json({
          success: false,
          message: 'Valid scope parameter is required (global, company, user, or module)'
        });
      }

      // Check if configuration exists
      const existingConfig = await configService.getConfig(key, {
        scope: scope as ConfigScope,
        companyId: companyId as string | undefined,
        userId: userId as string | undefined,
        moduleId: moduleId as string | undefined
      });

      if (!existingConfig) {
        return res.status(404).json({
          success: false,
          message: 'Configuration setting not found'
        });
      }

      // Delete configuration
      await configService.deleteConfig(
        key,
        {
          scope: scope as ConfigScope,
          companyId: companyId as string | undefined,
          userId: userId as string | undefined,
          moduleId: moduleId as string | undefined
        },
        req.user?.id || 'system'
      );

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
      const { companyId, userId } = req.query;

      // Get configurations by category
      const configs = await configService.getConfigsByCategory(category, {
        companyId: companyId as string | undefined,
        userId: userId as string | undefined
      });

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
        if (!config.key || config.value === undefined || !config.scope) {
          return res.status(400).json({
            success: false,
            message: 'Each config item must have a key, value, and scope'
          });
        }
        
        if (!Object.values(ConfigScope).includes(config.scope)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid scope value'
          });
        }
      }

      // Update configurations in batch
      const results = await Promise.all(
        configs.map(config => 
          configService.setConfig(
            config.key,
            config.value,
            {
              scope: config.scope as ConfigScope,
              companyId: config.companyId,
              userId: config.userId,
              moduleId: config.moduleId,
              description: config.description
            },
            req.user?.id || 'system'
          )
        )
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
        message: error instanceof Error ? error.message : 'Internal server error'
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
      const { companyId, userId, moduleId, scope } = req.body;

      // Reset configurations to default values
      await configService.resetToDefaults({
        companyId,
        userId,
        moduleId,
        scope: scope as ConfigScope | undefined
      });

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
