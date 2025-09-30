/**
 * API Key Management Controller
 * 
 * This controller handles all operations related to API key management,
 * including creating, retrieving, updating, and revoking API keys.
 */

import { Request, Response } from 'express';
import { Logger } from '../../../common/logger';
import { ApiKeyService } from '../services/api-key.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { z } from 'zod';

// Create validation schema for API key creation
const createApiKeySchema = z.object({
  name: z.string().min(2, 'API key name must be at least 2 characters'),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  scopes: z.array(z.string()).optional(),
  companyId: z.string().uuid('Invalid company ID format').optional().nullable(),
});

// Create validation schema for API key update
const updateApiKeySchema = z.object({
  name: z.string().min(2, 'API key name must be at least 2 characters').optional(),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  scopes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Create logger instance
const logger = new Logger('ApiKeyController');

/**
 * Register the API key controller routes with the Express application
 * @param app Express application
 * @param apiKeyService API key service instance
 */
export function registerApiKeyControllerRoutes(app: any, apiKeyService: ApiKeyService) {
  const BASE_PATH = '/api/admin/api-keys';

  /**
   * Get all API keys
   * 
   * @route GET /api/admin/api-keys
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(BASE_PATH, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Parse query parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const companyId = req.query.companyId as string | undefined;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

      // Get all API keys with filtering and pagination
      const result = await apiKeyService.getApiKeys({
        page,
        limit,
        companyId: companyId === 'null' ? null : companyId,
        isActive
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error retrieving API keys', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get an API key by ID
   * 
   * @route GET /api/admin/api-keys/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/:id`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const apiKeyId = req.params.id;

      // Get API key by ID
      const apiKey = await apiKeyService.getApiKeyById(apiKeyId);

      if (!apiKey) {
        return res.status(404).json({
          success: false,
          message: 'API key not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: apiKey
      });
    } catch (error) {
      logger.error(`Error retrieving API key with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Create a new API key
   * 
   * @route POST /api/admin/api-keys
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(BASE_PATH, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = createApiKeySchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      // Create the API key
      const apiKeyData = validationResult.data;
      const createdApiKey = await apiKeyService.createApiKey({
        name: apiKeyData.name,
        description: apiKeyData.description || '',
        expiresAt: apiKeyData.expiresAt ? new Date(apiKeyData.expiresAt) : undefined,
        scopes: apiKeyData.scopes || [],
        companyId: apiKeyData.companyId,
        createdBy: req.user?.id || '',
      });

      logger.info(`API key created: ${apiKeyData.name} by user: ${req.user?.id}`);

      return res.status(201).json({
        success: true,
        message: 'API key created successfully',
        data: createdApiKey
      });
    } catch (error) {
      logger.error('Error creating API key', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Update an API key
   * 
   * @route PATCH /api/admin/api-keys/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.patch(`${BASE_PATH}/:id`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const apiKeyId = req.params.id;

      // Validate request body
      const validationResult = updateApiKeySchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      // Check if API key exists
      const existingApiKey = await apiKeyService.getApiKeyById(apiKeyId);
      if (!existingApiKey) {
        return res.status(404).json({
          success: false,
          message: 'API key not found'
        });
      }

      // Update the API key
      const apiKeyData = validationResult.data;
      const updatedApiKey = await apiKeyService.updateApiKey(apiKeyId, {
        name: apiKeyData.name,
        description: apiKeyData.description,
        expiresAt: apiKeyData.expiresAt ? new Date(apiKeyData.expiresAt) : undefined,
        scopes: apiKeyData.scopes,
        isActive: apiKeyData.isActive,
      });

      logger.info(`API key updated: ${existingApiKey.name} by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'API key updated successfully',
        data: updatedApiKey
      });
    } catch (error) {
      logger.error(`Error updating API key with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Revoke an API key
   * 
   * @route DELETE /api/admin/api-keys/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.delete(`${BASE_PATH}/:id`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const apiKeyId = req.params.id;

      // Check if API key exists
      const existingApiKey = await apiKeyService.getApiKeyById(apiKeyId);
      if (!existingApiKey) {
        return res.status(404).json({
          success: false,
          message: 'API key not found'
        });
      }

      // Revoke the API key
      await apiKeyService.revokeApiKey(apiKeyId);

      logger.info(`API key revoked: ${existingApiKey.name} by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'API key revoked successfully'
      });
    } catch (error) {
      logger.error(`Error revoking API key with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get API key scopes
   * 
   * @route GET /api/admin/api-keys/scopes
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/scopes`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get all available API key scopes
      const scopes = await apiKeyService.getAvailableScopes();

      return res.status(200).json({
        success: true,
        data: scopes
      });
    } catch (error) {
      logger.error('Error retrieving API key scopes', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Regenerate an API key
   * 
   * @route POST /api/admin/api-keys/:id/regenerate
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(`${BASE_PATH}/:id/regenerate`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const apiKeyId = req.params.id;

      // Check if API key exists
      const existingApiKey = await apiKeyService.getApiKeyById(apiKeyId);
      if (!existingApiKey) {
        return res.status(404).json({
          success: false,
          message: 'API key not found'
        });
      }

      // Regenerate the API key
      const regeneratedApiKey = await apiKeyService.regenerateApiKey(apiKeyId);

      logger.info(`API key regenerated: ${existingApiKey.name} by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'API key regenerated successfully',
        data: regeneratedApiKey
      });
    } catch (error) {
      logger.error(`Error regenerating API key with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  logger.info('API key controller routes registered');
}