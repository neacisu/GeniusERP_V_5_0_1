/**
 * Integrations Routes
 * 
 * RESTful API routes for managing integrations with external systems.
 */

import express from 'express';
import { z } from 'zod';
import { IntegrationsService } from '../services/integrations.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode, UserRole } from '../../auth/types';
import { AuditService, AuditAction } from '../../audit/services/audit.service';
import { IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';
import { getIntegrationClient } from '../clients';

const router = express.Router();
const integrationsService = new IntegrationsService();

/**
 * Get all integrations for a company
 * GET /api/integrations
 */
router.get('/', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    // Extract user details from JWT token
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - User ID or company ID missing' 
      });
    }
    
    // Get franchise ID from query if present
    const franchiseId = req.query.franchiseId as string;
    
    // Get integrations
    const integrations = await integrationsService.listIntegrations(companyId, franchiseId);
    
    // Remove sensitive data
    const safeIntegrations = integrations.map(integration => {
      const { config, webhookSecret, ...safeIntegration } = integration;
      return safeIntegration;
    });
    
    return res.status(200).json({
      success: true,
      count: safeIntegrations.length,
      data: safeIntegrations
    });
  } catch (error) {
    console.error('[IntegrationsRoute] Error getting integrations:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({
      success: false,
      message: 'Failed to get integrations',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get integration by ID
 * GET /api/integrations/:id
 */
router.get('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    // Extract user details from JWT token
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - User ID or company ID missing' 
      });
    }
    
    // Get integration ID from URL params
    const integrationId = req.params.id;
    
    // Get integration
    const integration = await integrationsService.getIntegration(integrationId, companyId);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }
    
    // Remove sensitive data
    const { config, webhookSecret, ...safeIntegration } = integration;
    
    return res.status(200).json({
      success: true,
      data: safeIntegration
    });
  } catch (error) {
    console.error('[IntegrationsRoute] Error getting integration:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({
      success: false,
      message: 'Failed to get integration',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Create a new integration
 * POST /api/integrations
 */
router.post('/', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res) => {
    try {
      // Extract user details from JWT token
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized - User ID or company ID missing' 
        });
      }
      
      // Validate request body
      const schema = z.object({
        provider: z.string(),
        franchiseId: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        config: z.record(z.string(), z.any()).optional()
      });
      
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request body',
          errors: validationResult.error.issues
        });
      }
      
      const { provider: providerString, franchiseId, name, description, config } = validationResult.data;
      
      // Convert provider string to enum and validate it
      let provider: IntegrationProvider;
      try {
        // Check if the string is a valid enum value
        if (!Object.values(IntegrationProvider).includes(providerString as any)) {
          return res.status(400).json({
            success: false,
            message: `Invalid provider. Available providers: ${Object.values(IntegrationProvider).join(', ')}`
          });
        }
        provider = providerString as IntegrationProvider;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Invalid provider. Available providers: ${Object.values(IntegrationProvider).join(', ')}`
        });
      }
      
      // Check if integration already exists
      const existingIntegration = await integrationsService.getIntegrationByProvider(
        provider, 
        companyId, 
        franchiseId
      );
      
      if (existingIntegration) {
        return res.status(409).json({
          success: false,
          message: `Integration for provider ${provider} already exists for this company`
        });
      }
      
      // Create integration
      const integration = await integrationsService.createIntegration(
        provider,
        companyId,
        config || {},
        userId,
        franchiseId
      );
      
      // Remove sensitive data
      const { config: configData, webhookSecret, ...safeIntegration } = integration;
      
      return res.status(201).json({
        success: true,
        message: 'Integration created successfully',
        data: safeIntegration
      });
    } catch (error) {
      console.error('[IntegrationsRoute] Error creating integration:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        message: 'Failed to create integration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
});

/**
 * Update integration
 * PATCH /api/integrations/:id
 */
router.patch('/:id', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res) => {
    try {
      // Extract user details from JWT token
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized - User ID or company ID missing' 
        });
      }
      
      // Get integration ID from URL params
      const integrationId = req.params.id;
      
      // Check if integration exists
      const existingIntegration = await integrationsService.getIntegration(integrationId, companyId);
      
      if (!existingIntegration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }
      
      // Validate request body
      const schema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum([
          IntegrationStatus.ACTIVE,
          IntegrationStatus.INACTIVE,
          IntegrationStatus.ERROR,
          IntegrationStatus.PENDING
        ]).optional(),
        config: z.record(z.string(), z.any()).optional(),
        webhookUrl: z.string().optional(),
        webhookSecret: z.string().optional()
      });
      
      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request body',
          errors: validationResult.error.issues
        });
      }
      
      // Update integration
      const updatedIntegration = await integrationsService.updateIntegration(
        integrationId,
        companyId,
        validationResult.data,
        userId
      );
      
      if (!updatedIntegration) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update integration'
        });
      }
      
      // Remove sensitive data
      const { config, webhookSecret, ...safeIntegration } = updatedIntegration;
      
      return res.status(200).json({
        success: true,
        message: 'Integration updated successfully',
        data: safeIntegration
      });
    } catch (error) {
      console.error('[IntegrationsRoute] Error updating integration:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        message: 'Failed to update integration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
});

/**
 * Delete integration
 * DELETE /api/integrations/:id
 */
router.delete('/:id', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res) => {
    try {
      // Extract user details from JWT token
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized - User ID or company ID missing' 
        });
      }
      
      // Get integration ID from URL params
      const integrationId = req.params.id;
      
      // Check if integration exists
      const existingIntegration = await integrationsService.getIntegration(integrationId, companyId);
      
      if (!existingIntegration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }
      
      // Delete integration
      const result = await integrationsService.deleteIntegration(integrationId, companyId, userId);
      
      if (!result) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete integration'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Integration deleted successfully'
      });
    } catch (error) {
      console.error('[IntegrationsRoute] Error deleting integration:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        message: 'Failed to delete integration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
});

/**
 * Initialize integration (provider-specific)
 * POST /api/integrations/:provider/initialize
 */
router.post('/:provider/initialize', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res) => {
    try {
      // Extract user details from JWT token
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized - User ID or company ID missing' 
        });
      }
      
      // Get provider from URL params
      const providerString = req.params.provider;
      
      // Get franchise ID from query if present
      const franchiseId = req.query.franchiseId as string;
      
      // Convert provider string to enum and validate it
      let provider: IntegrationProvider;
      try {
        // Check if the string is a valid enum value
        if (!Object.values(IntegrationProvider).includes(providerString as any)) {
          return res.status(400).json({
            success: false,
            message: `Invalid provider. Available providers: ${Object.values(IntegrationProvider).join(', ')}`
          });
        }
        provider = providerString as IntegrationProvider;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Invalid provider. Available providers: ${Object.values(IntegrationProvider).join(', ')}`
        });
      }
      
      // Check if integration already exists
      const existingIntegration = await integrationsService.getIntegrationByProvider(
        provider, 
        companyId, 
        franchiseId
      );
      
      if (existingIntegration) {
        return res.status(409).json({
          success: false,
          message: `Integration for provider ${provider} already exists for this company`
        });
      }
      
      try {
        // Get integration client
        const client = getIntegrationClient(provider, companyId, franchiseId);
        
        // Call the appropriate initialize method based on provider
        let integration;
        
        switch (provider) {
          case IntegrationProvider.ANAF_EFACTURA:
            // Validate request body for ANAF e-Factura
            const anafSchema = z.object({
              apiKey: z.string(),
              clientId: z.string(),
              clientSecret: z.string(),
              apiUrl: z.string().optional()
            });
            
            const anafValidation = anafSchema.safeParse(req.body);
            
            if (!anafValidation.success) {
              return res.status(400).json({
                success: false,
                message: 'Invalid ANAF e-Factura initialization parameters',
                errors: anafValidation.error.issues
              });
            }
            
            const { apiKey, clientId, clientSecret, apiUrl } = anafValidation.data;
            
            integration = await client.initialize(
              apiKey,
              clientId,
              clientSecret,
              apiUrl,
              userId
            );
            break;
            
          case IntegrationProvider.STRIPE:
            // Validate request body for Stripe
            const stripeSchema = z.object({
              apiKey: z.string(),
              webhookSecret: z.string()
            });
            
            const stripeValidation = stripeSchema.safeParse(req.body);
            
            if (!stripeValidation.success) {
              return res.status(400).json({
                success: false,
                message: 'Invalid Stripe initialization parameters',
                errors: stripeValidation.error.issues
              });
            }
            
            const { apiKey: stripeApiKey, webhookSecret } = stripeValidation.data;
            
            integration = await client.initialize(
              stripeApiKey,
              webhookSecret,
              userId
            );
            break;
            
          case IntegrationProvider.PANDADOC:
            // Validate request body for PandaDoc
            const pandaDocSchema = z.object({
              apiKey: z.string()
            });
            
            const pandaDocValidation = pandaDocSchema.safeParse(req.body);
            
            if (!pandaDocValidation.success) {
              return res.status(400).json({
                success: false,
                message: 'Invalid PandaDoc initialization parameters',
                errors: pandaDocValidation.error.issues
              });
            }
            
            const { apiKey: pandaDocApiKey } = pandaDocValidation.data;
            
            integration = await client.initialize(
              pandaDocApiKey,
              userId
            );
            break;
            
          default:
            return res.status(400).json({
              success: false,
              message: `Provider ${provider} initialization not implemented`
            });
        }
        
        // Success - integration initialized
        return res.status(201).json({
          success: true,
          message: `${provider} integration initialized successfully`,
          data: {
            id: integration.id,
            provider: integration.provider,
            status: integration.status,
            isConnected: integration.isConnected
          }
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Failed to initialize ${provider} integration`,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      console.error('[IntegrationsRoute] Error initializing integration:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize integration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
});

/**
 * Test integration connection
 * POST /api/integrations/:id/test
 */
router.post('/:id/test', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
  async (req, res) => {
    try {
      // Extract user details from JWT token
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!userId || !companyId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized - User ID or company ID missing' 
        });
      }
      
      // Get integration ID from URL params
      const integrationId = req.params.id;
      
      // Check if integration exists
      const existingIntegration = await integrationsService.getIntegration(integrationId, companyId);
      
      if (!existingIntegration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }
      
      // Get integration client
      const client = getIntegrationClient(
        existingIntegration.provider,
        companyId,
        existingIntegration.franchiseId || undefined
      );
      
      // Test connection
      const isConnected = await client.testConnection();
      
      // Update integration status based on connection test
      if (isConnected) {
        await integrationsService.updateIntegrationStatus(
          integrationId,
          companyId,
          IntegrationStatus.ACTIVE,
          userId
        );
      } else {
        await integrationsService.updateIntegrationStatus(
          integrationId,
          companyId,
          IntegrationStatus.ERROR,
          userId
        );
      }
      
      return res.status(200).json({
        success: true,
        data: {
          id: integrationId,
          isConnected,
          status: isConnected ? IntegrationStatus.ACTIVE : IntegrationStatus.ERROR
        }
      });
    } catch (error) {
      console.error('[IntegrationsRoute] Error testing integration connection:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        message: 'Failed to test integration connection',
        error: error instanceof Error ? error.message : String(error)
      });
    }
});

/**
 * Integration activation placeholder endpoint
 * POST /api/integrations/activate-placeholder
 */
router.post('/activate-placeholder', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req, res) => {
  try {
    // Extract user details from JWT token
    const userId = req.user?.id;
    const companyId = req.user?.companyId;
    
    if (!userId || !companyId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - User ID or company ID missing' 
      });
    }
    
    // Log the activation attempt for audit purposes
    await AuditService.log({
      userId,
      companyId,
      action: AuditAction.INTEGRATION_ACTIVATE,
      entity: 'integration',
      entityId: 'placeholder',
      details: {
        requestBody: req.body,
        timestamp: new Date().toISOString()
      }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Integration activation placeholder',
      data: {
        requestData: req.body,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[IntegrationsRoute] Error in activate-placeholder:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({
      success: false,
      message: 'Failed to process integration activation',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;