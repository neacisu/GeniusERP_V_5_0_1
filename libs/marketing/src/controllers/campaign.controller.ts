/**
 * Campaign Controller
 * 
 * This controller handles campaign-related operations and implements the business logic
 * for managing marketing campaigns.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Logger } from "@common/logger";
import { CampaignService } from '../services/campaign.service';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
import { 
  CampaignType, 
  CampaignStatus, 
  AudienceType,
  insertCampaignSchema 
} from '../../../../shared/schema/marketing.schema';

/**
 * Campaign Controller Class
 */
export class CampaignController {
  private _logger: Logger;
  private _campaignService: CampaignService;
  private _auditService: AuditService;

  /**
   * Constructor
   */
  constructor() {
    this._logger = new Logger('CampaignController');
    this._campaignService = new CampaignService();
    this._auditService = new AuditService();
  }

  /**
   * Create a new campaign
   */
  async createCampaign(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate request body
      const validation = insertCampaignSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign data',
          details: validation.error.format()
        });
      }

      // Create the campaign
      const campaign = await this._campaignService.createCampaign({
        ...validation.data,
        companyId
      }, userId);

      // Record audit log
      await this._auditService.logAction({
        userId,
        companyId,
        action: AuditAction.CREATE,
        entity: 'campaign',
        entityId: campaign.id,
        details: {
          name: campaign.name,
          type: campaign.type,
          channels: campaign.channels
        }
      });

      return res.status(201).json({
        success: true,
        data: campaign
      });
    } catch (error) {
      this._logger.error('Error creating campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to create campaign'
      });
    }
  }

  /**
   * Get all campaigns with pagination and filtering
   */
  async listCampaigns(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate and parse query parameters
      const querySchema = z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
        status: z.nativeEnum(CampaignStatus).optional(),
        type: z.nativeEnum(CampaignType).optional(),
        search: z.string().optional()
      });

      const validation = querySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.format()
        });
      }

      const { page, pageSize, status, type, search } = validation.data;

      // Get campaigns
      const { campaigns, total } = await this._campaignService.listCampaigns(
        companyId,
        { status, type, search },
        page,
        pageSize
      );

      return res.status(200).json({
        success: true,
        data: {
          campaigns,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      });
    } catch (error) {
      this._logger.error('Error listing campaigns', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to list campaigns'
      });
    }
  }

  /**
   * Get a campaign by ID
   */
  async getCampaignById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate ID parameter
      const paramSchema = z.object({
        id: z.string().uuid()
      });

      const validation = paramSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Get the campaign
      const campaign = await this._campaignService.getCampaignById(id, companyId);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: campaign
      });
    } catch (error) {
      this._logger.error('Error getting campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to get campaign'
      });
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate ID parameter
      const paramSchema = z.object({
        id: z.string().uuid()
      });

      const idValidation = paramSchema.safeParse(req.params);

      if (!idValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: idValidation.error.format()
        });
      }

      const { id } = idValidation.data;

      // Validate request body
      const validation = insertCampaignSchema.partial().safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign data',
          details: validation.error.format()
        });
      }

      // Update the campaign
      const updatedCampaign = await this._campaignService.updateCampaign(
        id,
        companyId,
        validation.data,
        userId
      );

      if (!updatedCampaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Record audit log
      await this._auditService.logAction({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'campaign',
        entityId: id,
        details: {
          changes: validation.data
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedCampaign
      });
    } catch (error) {
      this._logger.error('Error updating campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to update campaign'
      });
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate ID parameter
      const paramSchema = z.object({
        id: z.string().uuid()
      });

      const validation = paramSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Get the campaign first to record in audit log
      const campaign = await this._campaignService.getCampaignById(id, companyId);
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Delete the campaign
      const deleted = await this._campaignService.deleteCampaign(id, companyId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Record audit log
      await this._auditService.logAction({
        userId,
        companyId,
        action: AuditAction.DELETE,
        entity: 'campaign',
        entityId: id,
        details: {
          name: campaign.name,
          type: campaign.type
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      this._logger.error('Error deleting campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to delete campaign'
      });
    }
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate ID parameter
      const paramSchema = z.object({
        id: z.string().uuid()
      });

      const validation = paramSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Get the campaign first to verify it exists
      const campaign = await this._campaignService.getCampaignById(id, companyId);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Get performance metrics
      const performance = await this._campaignService.getCampaignPerformance(id, companyId);

      return res.status(200).json({
        success: true,
        data: performance
      });
    } catch (error) {
      this._logger.error('Error getting campaign performance', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to get campaign performance'
      });
    }
  }

  /**
   * Schedule a campaign
   */
  async scheduleCampaign(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate ID parameter
      const paramSchema = z.object({
        id: z.string().uuid()
      });

      const idValidation = paramSchema.safeParse(req.params);

      if (!idValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: idValidation.error.format()
        });
      }

      const { id } = idValidation.data;

      // Validate request body
      const bodySchema = z.object({
        scheduledAt: z.coerce.date()
      });

      const bodyValidation = bodySchema.safeParse(req.body);

      if (!bodyValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid schedule data',
          details: bodyValidation.error.format()
        });
      }

      const { scheduledAt } = bodyValidation.data;

      // Schedule the campaign
      const updatedCampaign = await this._campaignService.scheduleCampaign(
        id,
        companyId,
        scheduledAt,
        userId
      );

      if (!updatedCampaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Record audit log
      await this._auditService.logAction({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'campaign',
        entityId: id,
        details: {
          operation: 'schedule',
          scheduledAt,
          status: CampaignStatus.SCHEDULED
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedCampaign
      });
    } catch (error) {
      this._logger.error('Error scheduling campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to schedule campaign'
      });
    }
  }

  /**
   * Start a campaign immediately
   */
  async startCampaign(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate ID parameter
      const paramSchema = z.object({
        id: z.string().uuid()
      });

      const validation = paramSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Start the campaign
      const updatedCampaign = await this._campaignService.startCampaign(
        id,
        companyId,
        userId
      );

      if (!updatedCampaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Record audit log
      await this._auditService.logAction({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'campaign',
        entityId: id,
        details: {
          operation: 'start',
          status: CampaignStatus.ACTIVE,
          startedAt: new Date()
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedCampaign
      });
    } catch (error) {
      this._logger.error('Error starting campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to start campaign'
      });
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate ID parameter
      const paramSchema = z.object({
        id: z.string().uuid()
      });

      const validation = paramSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Pause the campaign
      const updatedCampaign = await this._campaignService.pauseCampaign(
        id,
        companyId,
        userId
      );

      if (!updatedCampaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Record audit log
      await this._auditService.logAction({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'campaign',
        entityId: id,
        details: {
          operation: 'pause',
          status: CampaignStatus.PAUSED
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedCampaign
      });
    } catch (error) {
      this._logger.error('Error pausing campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to pause campaign'
      });
    }
  }

  /**
   * Resume a campaign
   */
  async resumeCampaign(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Validate ID parameter
      const paramSchema = z.object({
        id: z.string().uuid()
      });

      const validation = paramSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Resume the campaign
      const updatedCampaign = await this._campaignService.resumeCampaign(
        id,
        companyId,
        userId
      );

      if (!updatedCampaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Record audit log
      await this._auditService.logAction({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'campaign',
        entityId: id,
        details: {
          operation: 'resume',
          status: CampaignStatus.ACTIVE
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedCampaign
      });
    } catch (error) {
      this._logger.error('Error resuming campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to resume campaign'
      });
    }
  }
}

// Create a singleton instance
export const campaignController = new CampaignController();