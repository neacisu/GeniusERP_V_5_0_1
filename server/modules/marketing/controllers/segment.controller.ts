/**
 * Segment Controller
 * 
 * This controller handles segment-related operations and implements the business logic
 * for managing marketing audience segments.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Logger } from '../../../common/logger';
import { SegmentService } from '../services/segment.service';
import { AuditService } from '../../../common/services/audit.service';

/**
 * Segment Controller Class
 */
export class SegmentController {
  private _logger: Logger;
  private _segmentService: SegmentService;
  private _auditService: AuditService;

  /**
   * Constructor
   */
  constructor() {
    this._logger = new Logger('SegmentController');
    this._segmentService = new SegmentService();
    this._auditService = new AuditService();
  }

  /**
   * Create a new segment
   */
  async createSegment(req: Request, res: Response): Promise<Response> {
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
      const segmentSchema = z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        filterCriteria: z.record(z.any()).optional(),
        isActive: z.boolean().optional().default(true),
        metadata: z.record(z.any()).optional()
      });

      const validation = segmentSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment data',
          details: validation.error.format()
        });
      }

      // Create the segment
      const segment = await this._segmentService.createSegment({
        ...validation.data,
        companyId
      }, userId);

      // Record audit log
      await this._auditService.log({
        action: 'segment.create',
        actionType: 'create',
        entityType: 'segment',
        entityId: segment.id,
        userId,
        companyId,
        details: {
          name: segment.name,
          filterCriteria: segment.filterCriteria
        }
      });

      return res.status(201).json({
        success: true,
        data: segment
      });
    } catch (error) {
      this._logger.error('Error creating segment', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to create segment'
      });
    }
  }

  /**
   * Get all segments with pagination and filtering
   */
  async listSegments(req: Request, res: Response): Promise<Response> {
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
        isActive: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
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

      const { page, pageSize, isActive, search } = validation.data;

      // Get segments
      const { segments, total } = await this._segmentService.listSegments(
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
      this._logger.error('Error listing segments', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to list segments'
      });
    }
  }

  /**
   * Get a segment by ID
   */
  async getSegmentById(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid segment ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Get the segment
      const segment = await this._segmentService.getSegmentById(id, companyId);

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
      this._logger.error('Error getting segment', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to get segment'
      });
    }
  }

  /**
   * Update a segment
   */
  async updateSegment(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid segment ID',
          details: idValidation.error.format()
        });
      }

      const { id } = idValidation.data;

      // Validate request body
      const segmentSchema = z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        filterCriteria: z.record(z.any()).optional(),
        isActive: z.boolean().optional(),
        metadata: z.record(z.any()).optional()
      });

      const validation = segmentSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid segment data',
          details: validation.error.format()
        });
      }

      // Update the segment
      const updatedSegment = await this._segmentService.updateSegment(
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

      // Record audit log
      await this._auditService.log({
        action: 'segment.update',
        actionType: 'update',
        entityType: 'segment',
        entityId: id,
        userId,
        companyId,
        details: {
          changes: validation.data
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedSegment
      });
    } catch (error) {
      this._logger.error('Error updating segment', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to update segment'
      });
    }
  }

  /**
   * Delete a segment
   */
  async deleteSegment(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid segment ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Get the segment first to record in audit log
      const segment = await this._segmentService.getSegmentById(id, companyId);
      
      if (!segment) {
        return res.status(404).json({
          success: false,
          error: 'Segment not found'
        });
      }

      // Delete the segment
      const deleted = await this._segmentService.deleteSegment(id, companyId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Segment not found'
        });
      }

      // Record audit log
      await this._auditService.log({
        action: 'segment.delete',
        actionType: 'delete',
        entityType: 'segment',
        entityId: id,
        userId,
        companyId,
        details: {
          name: segment.name
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Segment deleted successfully'
      });
    } catch (error) {
      this._logger.error('Error deleting segment', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to delete segment'
      });
    }
  }

  /**
   * Refresh segment members count
   */
  async refreshSegment(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid segment ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Refresh the segment
      const refreshedSegment = await this._segmentService.refreshSegment(id, companyId, userId);

      if (!refreshedSegment) {
        return res.status(404).json({
          success: false,
          error: 'Segment not found'
        });
      }

      // Record audit log
      await this._auditService.log({
        action: 'segment.refresh',
        actionType: 'update',
        entityType: 'segment',
        entityId: id,
        userId,
        companyId,
        details: {
          estimatedReach: refreshedSegment.estimatedReach,
          lastRefreshedAt: refreshedSegment.lastRefreshedAt
        }
      });

      return res.status(200).json({
        success: true,
        data: refreshedSegment
      });
    } catch (error) {
      this._logger.error('Error refreshing segment', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to refresh segment'
      });
    }
  }

  /**
   * Get segment members preview
   */
  async getSegmentMembers(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid segment ID',
          details: idValidation.error.format()
        });
      }

      const { id } = idValidation.data;

      // Validate query parameters
      const querySchema = z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        pageSize: z.coerce.number().int().positive().max(100).optional().default(20)
      });

      const queryValidation = querySchema.safeParse(req.query);

      if (!queryValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryValidation.error.format()
        });
      }

      const { page, pageSize } = queryValidation.data;

      // Get members preview
      const { members, total } = await this._segmentService.getSegmentMembers(id, companyId, page, pageSize);

      return res.status(200).json({
        success: true,
        data: {
          members,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      });
    } catch (error) {
      this._logger.error('Error getting segment members', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to get segment members'
      });
    }
  }
}

// Create a singleton instance
export const segmentController = new SegmentController();