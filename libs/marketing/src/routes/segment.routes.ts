/**
 * Segment Routes
 * 
 * This file defines the API routes for managing marketing campaign segments.
 */

import { Router } from 'express';
import { z } from 'zod';
import { SegmentService } from '../services/segment.service';
import { createModuleLogger } from "@common/logger/loki-logger";
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { insertCampaignSegmentSchema } from '../../../../shared/schema/marketing.schema';

export const segmentRoutes = Router();
const segmentService = new SegmentService();
const logger = createModuleLogger('SegmentRoutes');

// Validation schemas
const segmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  isActive: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  search: z.string().optional()
});

const segmentIdParamSchema = z.object({
  id: z.string().uuid()
});

/**
 * Create a new segment
 * 
 * POST /api/marketing/segments
 */
segmentRoutes.post(
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
      const validation = insertCampaignSegmentSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment data',
          details: validation.error.format()
        });
      }
      
      // Create the segment
      const segment = await segmentService.createSegment({
        ...validation.data,
        companyId
      }, userId);
      
      return res.status(201).json({
        success: true,
        data: segment
      });
    } catch (error) {
      logger.error('Error creating segment', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create segment'
      });
    }
  }
);

/**
 * Get all segments with pagination and filtering
 * 
 * GET /api/marketing/segments
 */
segmentRoutes.get(
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
      const validation = segmentQuerySchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.format()
        });
      }
      
      const { page, pageSize, isActive, search } = validation.data;
      
      // Get segments
      const { crm_segments, total } = await segmentService.listSegments(
        companyId,
        { isActive, search },
        page,
        pageSize
      );
      
      return res.status(200).json({
        success: true,
        data: {
          segments,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      });
    } catch (error) {
      logger.error('Error listing segments', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to list segments'
      });
    }
  }
);

/**
 * Get a segment by ID
 * 
 * GET /api/marketing/segments/:id
 */
segmentRoutes.get(
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
      const validation = segmentIdParamSchema.safeParse(req.params);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment ID',
          details: validation.error.format()
        });
      }
      
      const { id } = validation.data;
      
      // Get the segment
      const segment = await segmentService.getSegmentById(id, companyId);
      
      if (!segment) {
        return res.status(404).json({
          success: false,
          error: 'Segment not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: segment
      });
    } catch (error) {
      logger.error('Error getting segment', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get segment'
      });
    }
  }
);

/**
 * Update a segment
 * 
 * PUT /api/marketing/segments/:id
 */
segmentRoutes.put(
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
      const idValidation = segmentIdParamSchema.safeParse(req.params);
      
      if (!idValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment ID',
          details: idValidation.error.format()
        });
      }
      
      const { id } = idValidation.data;
      
      // Validate request body
      const validation = insertCampaignSegmentSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment data',
          details: validation.error.format()
        });
      }
      
      // Update the segment
      const updatedSegment = await segmentService.updateSegment(
        id,
        companyId,
        validation.data,
        userId
      );
      
      if (!updatedSegment) {
        return res.status(404).json({
          success: false,
          error: 'Segment not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: updatedSegment
      });
    } catch (error) {
      logger.error('Error updating segment', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to update segment'
      });
    }
  }
);

/**
 * Delete a segment
 * 
 * DELETE /api/marketing/segments/:id
 */
segmentRoutes.delete(
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
      const validation = segmentIdParamSchema.safeParse(req.params);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment ID',
          details: validation.error.format()
        });
      }
      
      const { id } = validation.data;
      
      // Delete the segment
      const deleted = await segmentService.deleteSegment(id, companyId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Segment not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Segment deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting segment', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to delete segment'
      });
    }
  }
);

/**
 * Refresh segment reach
 * 
 * POST /api/marketing/segments/:id/refresh
 */
segmentRoutes.post(
  '/:id/refresh',
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
      const validation = segmentIdParamSchema.safeParse(req.params);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment ID',
          details: validation.error.format()
        });
      }
      
      const { id } = validation.data;
      
      // Refresh the segment reach
      const updatedSegment = await segmentService.refreshSegmentReach(
        id,
        companyId,
        userId
      );
      
      if (!updatedSegment) {
        return res.status(404).json({
          success: false,
          error: 'Segment not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: updatedSegment
      });
    } catch (error) {
      logger.error('Error refreshing segment reach', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to refresh segment reach'
      });
    }
  }
);

/**
 * Clone a segment
 * 
 * POST /api/marketing/segments/:id/clone
 */
segmentRoutes.post(
  '/:id/clone',
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
      const idValidation = segmentIdParamSchema.safeParse(req.params);
      
      if (!idValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment ID',
          details: idValidation.error.format()
        });
      }
      
      const { id } = idValidation.data;
      
      // Validate request body
      const bodySchema = z.object({
        name: z.string().min(1).max(255)
      });
      
      const bodyValidation = bodySchema.safeParse(req.body);
      
      if (!bodyValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment name',
          details: bodyValidation.error.format()
        });
      }
      
      const { name } = bodyValidation.data;
      
      // Clone the segment
      const clonedSegment = await segmentService.cloneSegment(
        id,
        companyId,
        name,
        userId
      );
      
      if (!clonedSegment) {
        return res.status(404).json({
          success: false,
          error: 'Segment not found'
        });
      }
      
      return res.status(201).json({
        success: true,
        data: clonedSegment
      });
    } catch (error) {
      logger.error('Error cloning segment', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to clone segment'
      });
    }
  }
);

/**
 * Toggle segment active status
 * 
 * POST /api/marketing/segments/:id/toggle-status
 */
segmentRoutes.post(
  '/:id/toggle-status',
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
      const idValidation = segmentIdParamSchema.safeParse(req.params);
      
      if (!idValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment ID',
          details: idValidation.error.format()
        });
      }
      
      const { id } = idValidation.data;
      
      // Validate request body
      const bodySchema = z.object({
        isActive: z.boolean()
      });
      
      const bodyValidation = bodySchema.safeParse(req.body);
      
      if (!bodyValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status data',
          details: bodyValidation.error.format()
        });
      }
      
      const { isActive } = bodyValidation.data;
      
      // Toggle the segment status
      const updatedSegment = await segmentService.toggleSegmentStatus(
        id,
        companyId,
        isActive,
        userId
      );
      
      if (!updatedSegment) {
        return res.status(404).json({
          success: false,
          error: 'Segment not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: updatedSegment
      });
    } catch (error) {
      logger.error('Error toggling segment status', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to toggle segment status'
      });
    }
  }
);