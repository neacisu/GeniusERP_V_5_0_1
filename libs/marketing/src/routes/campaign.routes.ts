/**
 * Campaign Routes
 * 
 * This file defines the API routes for managing marketing campaigns.
 */

import { Router } from 'express';
import { z } from 'zod';
import { CampaignService } from '../services/campaign.service';
import { Logger } from "@common/logger";
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { 
  CampaignStatus, 
  CampaignType,
  AudienceType,
  insertCampaignSchema
} from '../../../../shared/schema/marketing.schema';

export const campaignRoutes = Router();
const campaignService = new CampaignService();
const logger = new Logger('CampaignRoutes');

// Validation schemas
const campaignQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.nativeEnum(CampaignStatus).optional(),
  type: z.nativeEnum(CampaignType).optional(),
  search: z.string().optional()
});

const campaignIdParamSchema = z.object({
  id: z.string().uuid()
});

/**
 * Create a new campaign
 * 
 * POST /api/marketing/campaigns
 */
campaignRoutes.post(
  '/',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const campaign = await campaignService.createCampaign({
        ...validation.data,
        companyId
      }, userId);

      return res.status(201).json({
        success: true,
        data: campaign
      });
    } catch (error) {
      logger.error('Error creating campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to create campaign'
      });
    }
  }
);

/**
 * Get all campaigns with pagination and filtering
 * 
 * GET /api/marketing/campaigns
 */
campaignRoutes.get(
  '/',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const validation = campaignQuerySchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.format()
        });
      }

      const { page, pageSize, status, type, search } = validation.data;

      // Get campaigns
      const { campaigns, total } = await campaignService.listCampaigns(
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
      logger.error('Error listing campaigns', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to list campaigns'
      });
    }
  }
);

/**
 * Get a campaign by ID
 * 
 * GET /api/marketing/campaigns/:id
 */
campaignRoutes.get(
  '/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const validation = campaignIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Get the campaign
      const campaign = await campaignService.getCampaignById(id, companyId);

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
      logger.error('Error getting campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to get campaign'
      });
    }
  }
);

/**
 * Update a campaign
 * 
 * PUT /api/marketing/campaigns/:id
 * PATCH /api/marketing/campaigns/:id
 */
const handleUpdateCampaign = async (req: any, res: any) => {
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
    const idValidation = campaignIdParamSchema.safeParse(req.params);

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
    const updatedCampaign = await campaignService.updateCampaign(
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

    return res.status(200).json({
      success: true,
      data: updatedCampaign
    });
  } catch (error) {
    logger.error('Error updating campaign', error instanceof Error ? error.message : String(error));

    return res.status(500).json({
      success: false,
      error: 'Failed to update campaign'
    });
  }
};

// Register both PUT and PATCH for the same handler to support both methods
campaignRoutes.put('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), handleUpdateCampaign);
campaignRoutes.patch('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), handleUpdateCampaign);

/**
 * Delete a campaign
 * 
 * DELETE /api/marketing/campaigns/:id
 */
campaignRoutes.delete(
  '/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const validation = campaignIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Delete the campaign
      const deleted = await campaignService.deleteCampaign(id, companyId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to delete campaign'
      });
    }
  }
);

/**
 * Get campaign performance metrics
 * 
 * GET /api/marketing/campaigns/:id/performance
 */
campaignRoutes.get(
  '/:id/performance',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const validation = campaignIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Get the campaign first to verify it exists
      const campaign = await campaignService.getCampaignById(id, companyId);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      // Get performance metrics
      const performance = await campaignService.getCampaignPerformance(id, companyId);

      return res.status(200).json({
        success: true,
        data: performance
      });
    } catch (error) {
      logger.error('Error getting campaign performance', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to get campaign performance'
      });
    }
  }
);

/**
 * Schedule a campaign
 * 
 * POST /api/marketing/campaigns/:id/schedule
 */
campaignRoutes.post(
  '/:id/schedule',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const idValidation = campaignIdParamSchema.safeParse(req.params);

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
      const updatedCampaign = await campaignService.scheduleCampaign(
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

      return res.status(200).json({
        success: true,
        data: updatedCampaign
      });
    } catch (error) {
      logger.error('Error scheduling campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to schedule campaign'
      });
    }
  }
);

/**
 * Start a campaign immediately
 * 
 * POST /api/marketing/campaigns/:id/start
 */
campaignRoutes.post(
  '/:id/start',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const validation = campaignIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Start the campaign
      const updatedCampaign = await campaignService.startCampaign(
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

      return res.status(200).json({
        success: true,
        data: updatedCampaign
      });
    } catch (error) {
      logger.error('Error starting campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to start campaign'
      });
    }
  }
);

/**
 * Pause a campaign
 * 
 * POST /api/marketing/campaigns/:id/pause
 */
campaignRoutes.post(
  '/:id/pause',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const validation = campaignIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Pause the campaign
      const updatedCampaign = await campaignService.pauseCampaign(
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

      return res.status(200).json({
        success: true,
        data: updatedCampaign
      });
    } catch (error) {
      logger.error('Error pausing campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to pause campaign'
      });
    }
  }
);

/**
 * Resume a paused campaign
 * 
 * POST /api/marketing/campaigns/:id/resume
 */
campaignRoutes.post(
  '/:id/resume',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
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
      const validation = campaignIdParamSchema.safeParse(req.params);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid campaign ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Resume the campaign
      const updatedCampaign = await campaignService.resumeCampaign(
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

      return res.status(200).json({
        success: true,
        data: updatedCampaign
      });
    } catch (error) {
      logger.error('Error resuming campaign', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to resume campaign'
      });
    }
  }
);

/**
 * Campaign placeholder endpoint for testing and UI scaffolding
 * 
 * POST /api/marketing/campaigns/campaign-placeholder
 */
campaignRoutes.post(
  '/campaign-placeholder',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Marketing campaign creation placeholder',
        data: req.body,
        context: {
          userId,
          companyId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in campaign placeholder endpoint', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to process campaign placeholder request'
      });
    }
  }
);