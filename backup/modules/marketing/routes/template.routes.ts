/**
 * Template Routes
 * 
 * This file defines the API routes for managing marketing campaign templates.
 */

import { Router } from 'express';
import { z } from 'zod';
import { TemplateService } from '../services/template.service';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/models/auth.enum';
import { 
  CampaignType,
  insertCampaignTemplateSchema 
} from '../../../../shared/schema/marketing.schema';

export const templateRoutes = Router();
const templateService = new TemplateService();
const logger = new Logger('TemplateRoutes');

// Validation schemas
const templateQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  type: z.nativeEnum(CampaignType).optional(),
  category: z.string().optional(),
  isActive: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  search: z.string().optional()
});

const templateIdParamSchema = z.object({
  id: z.string().uuid()
});

/**
 * Create a new template
 * 
 * POST /api/marketing/templates
 */
templateRoutes.post(
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
      const validation = insertCampaignTemplateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template data',
          details: validation.error.format()
        });
      }
      
      // Create the template
      const template = await templateService.createTemplate({
        ...validation.data,
        companyId
      }, userId);
      
      return res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error creating template', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create template'
      });
    }
  }
);

/**
 * Get all templates with pagination and filtering
 * 
 * GET /api/marketing/templates
 */
templateRoutes.get(
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
      const validation = templateQuerySchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.format()
        });
      }
      
      const { page, pageSize, type, category, isActive, search } = validation.data;
      
      // Get templates
      const { templates, total } = await templateService.listTemplates(
        companyId,
        { type, category, isActive, search },
        page,
        pageSize
      );
      
      return res.status(200).json({
        success: true,
        data: {
          templates,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        }
      });
    } catch (error) {
      logger.error('Error listing templates', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to list templates'
      });
    }
  }
);

/**
 * Get a template by ID
 * 
 * GET /api/marketing/templates/:id
 */
templateRoutes.get(
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
      const validation = templateIdParamSchema.safeParse(req.params);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template ID',
          details: validation.error.format()
        });
      }
      
      const { id } = validation.data;
      
      // Get the template
      const template = await templateService.getTemplateById(id, companyId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error getting template', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get template'
      });
    }
  }
);

/**
 * Update a template
 * 
 * PUT /api/marketing/templates/:id
 */
templateRoutes.put(
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
      const idValidation = templateIdParamSchema.safeParse(req.params);
      
      if (!idValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template ID',
          details: idValidation.error.format()
        });
      }
      
      const { id } = idValidation.data;
      
      // Validate request body
      const validation = insertCampaignTemplateSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template data',
          details: validation.error.format()
        });
      }
      
      // Update the template
      const updatedTemplate = await templateService.updateTemplate(
        id,
        companyId,
        validation.data,
        userId
      );
      
      if (!updatedTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: updatedTemplate
      });
    } catch (error) {
      logger.error('Error updating template', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to update template'
      });
    }
  }
);

/**
 * Delete a template
 * 
 * DELETE /api/marketing/templates/:id
 */
templateRoutes.delete(
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
      const validation = templateIdParamSchema.safeParse(req.params);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template ID',
          details: validation.error.format()
        });
      }
      
      const { id } = validation.data;
      
      // Delete the template
      const deleted = await templateService.deleteTemplate(id, companyId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting template', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to delete template'
      });
    }
  }
);

/**
 * Get template categories
 * 
 * GET /api/marketing/templates/categories
 */
templateRoutes.get(
  '/categories/list',
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
      
      // Get template categories
      const categories = await templateService.getTemplateCategories(companyId);
      
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Error getting template categories', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get template categories'
      });
    }
  }
);

/**
 * Clone a template
 * 
 * POST /api/marketing/templates/:id/clone
 */
templateRoutes.post(
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
      const idValidation = templateIdParamSchema.safeParse(req.params);
      
      if (!idValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template ID',
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
          error: 'Invalid template name',
          details: bodyValidation.error.format()
        });
      }
      
      const { name } = bodyValidation.data;
      
      // Clone the template
      const clonedTemplate = await templateService.cloneTemplate(
        id,
        companyId,
        name,
        userId
      );
      
      if (!clonedTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      return res.status(201).json({
        success: true,
        data: clonedTemplate
      });
    } catch (error) {
      logger.error('Error cloning template', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to clone template'
      });
    }
  }
);

/**
 * Toggle template active status
 * 
 * POST /api/marketing/templates/:id/toggle-status
 */
templateRoutes.post(
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
      const idValidation = templateIdParamSchema.safeParse(req.params);
      
      if (!idValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template ID',
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
      
      // Toggle the template status
      const updatedTemplate = await templateService.toggleTemplateStatus(
        id,
        companyId,
        isActive,
        userId
      );
      
      if (!updatedTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: updatedTemplate
      });
    } catch (error) {
      logger.error('Error toggling template status', error instanceof Error ? error.message : String(error));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to toggle template status'
      });
    }
  }
);