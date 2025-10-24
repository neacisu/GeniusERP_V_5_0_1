/**
 * Integrations Controller
 * 
 * Controller for managing external integrations and API connections.
 */

import { Request, Response } from 'express';
import { IntegrationsService } from '../services/integrations.service';
import { AuditService } from '@geniuserp/audit';
import { Integration, IntegrationProvider, IntegrationStatus } from '../schema/integrations.schema';

// For audit logging
const RESOURCE_TYPE = 'integration';

/**
 * Controller for managing external integrations
 */
export class IntegrationsController {
  private integrationsService: IntegrationsService;
  private auditService: AuditService;

  constructor() {
    this.integrationsService = new IntegrationsService();
    this.auditService = new AuditService();
  }

  /**
   * Create a new integration
   */
  async createIntegration(req: Request, res: Response): Promise<Response> {
    try {
      const {
        provider,
        config,
        name,
        description,
        webhookUrl,
        webhookSecret,
        franchiseId
      } = req.body;

      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Provider is required'
        });
      }

      // Check if integration already exists for this provider and company
      const existingIntegration = await this.integrationsService.getIntegrationByProvider(
        provider as IntegrationProvider,
        companyId,
        franchiseId
      );

      if (existingIntegration) {
        return res.status(400).json({
          success: false,
          error: `Integration for provider ${provider} already exists`,
          data: existingIntegration
        });
      }

      // Create integration
      const integration = await this.integrationsService.createIntegration(
        provider as IntegrationProvider,
        companyId,
        config || {},
        userId,
        franchiseId,
        name,
        description,
        webhookUrl,
        webhookSecret
      );

      return res.status(201).json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('[IntegrationsController] Create integration error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to create integration'
      });
    }
  }

  /**
   * Get integration by ID
   */
  async getIntegration(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const integration = await this.integrationsService.getIntegration(id, companyId);

      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'Integration not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('[IntegrationsController] Get integration error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve integration'
      });
    }
  }

  /**
   * Get integration by provider
   */
  async getIntegrationByProvider(req: Request, res: Response): Promise<Response> {
    try {
      const { provider } = req.params;
      const { franchiseId } = req.query;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const integration = await this.integrationsService.getIntegrationByProvider(
        provider as IntegrationProvider,
        companyId,
        franchiseId as string | undefined
      );

      if (!integration) {
        return res.status(404).json({
          success: false,
          error: `Integration for provider ${provider} not found`
        });
      }

      return res.status(200).json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('[IntegrationsController] Get integration by provider error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve integration'
      });
    }
  }

  /**
   * List integrations for a company
   */
  async listIntegrations(req: Request, res: Response): Promise<Response> {
    try {
      const { franchiseId } = req.query;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const integrations = await this.integrationsService.listIntegrations(
        companyId,
        franchiseId as string | undefined
      );

      return res.status(200).json({
        success: true,
        data: integrations
      });
    } catch (error) {
      console.error('[IntegrationsController] List integrations error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to list integrations'
      });
    }
  }

  /**
   * Update integration
   */
  async updateIntegration(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const updatedIntegration = await this.integrationsService.updateIntegration(
        id,
        companyId,
        updates,
        userId
      );

      if (!updatedIntegration) {
        return res.status(404).json({
          success: false,
          error: 'Integration not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedIntegration
      });
    } catch (error) {
      console.error('[IntegrationsController] Update integration error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to update integration'
      });
    }
  }

  /**
   * Update integration status
   */
  async updateIntegrationStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      if (!status || !Object.values(IntegrationStatus).includes(status as IntegrationStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Valid status is required'
        });
      }

      const success = await this.integrationsService.updateIntegrationStatus(
        id,
        companyId,
        status as IntegrationStatus,
        userId
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Integration not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Integration status updated to ${status}`
      });
    } catch (error) {
      console.error('[IntegrationsController] Update integration status error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to update integration status'
      });
    }
  }

  /**
   * Delete integration
   */
  async deleteIntegration(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const success = await this.integrationsService.deleteIntegration(id, companyId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Integration not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Integration deleted successfully'
      });
    } catch (error) {
      console.error('[IntegrationsController] Delete integration error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to delete integration'
      });
    }
  }

  /**
   * Update last synced timestamp
   */
  async updateLastSyncedAt(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const success = await this.integrationsService.updateLastSyncedAt(id, companyId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Integration not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Last synced timestamp updated successfully'
      });
    } catch (error) {
      console.error('[IntegrationsController] Update last synced error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to update last synced timestamp'
      });
    }
  }

  /**
   * Activate integration
   * 
   * Activates an integration by setting its status to ACTIVE and 
   * verifying it's properly configured for use. This endpoint is meant to be
   * called after an integration has been created and configured.
   */
  async activateIntegration(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // First get the integration to verify it exists and check its current status
      const integration = await this.integrationsService.getIntegration(id, companyId);

      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'Integration not found'
        });
      }

      // Check if integration is already active
      if (integration.status === IntegrationStatus.ACTIVE) {
        return res.status(200).json({
          success: true,
          message: 'Integration is already active',
          data: integration
        });
      }

      // Verify integration has required configuration
      // Note: This is a basic check, you might want to add provider-specific validation logic
      if (!integration.config || Object.keys(integration.config).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Integration is missing required configuration'
        });
      }

      // Update integration status to ACTIVE
      const success = await this.integrationsService.updateIntegrationStatus(
        id,
        companyId,
        IntegrationStatus.ACTIVE,
        userId
      );

      if (!success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to activate integration'
        });
      }

      // Get the updated integration
      const activatedIntegration = await this.integrationsService.getIntegration(id, companyId);

      // Log the activation in audit logs
      await AuditService.createAuditLog({
        userId,
        companyId,
        entity: 'integration',
        action: 'activate',
        details: {
          provider: integration.provider,
          franchiseId: integration.franchiseId
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Integration activated successfully',
        data: activatedIntegration
      });
    } catch (error) {
      console.error('[IntegrationsController] Activate integration error:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        error: 'Failed to activate integration'
      });
    }
  }
}

// Export singleton instance
export const integrationsController = new IntegrationsController();