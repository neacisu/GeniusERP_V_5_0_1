/**
 * Template Controller
 * 
 * This controller handles template-related operations and implements the business logic
 * for managing marketing content templates.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Logger } from '../../../common/logger';
import { TemplateService } from '../services/template.service';
import { AuditService } from '../../audit/services/audit.service';
import { CampaignType } from '../../../../shared/schema/marketing.schema';

/**
 * Template Controller Class
 */
export class TemplateController {
  private _logger: Logger;
  private _templateService: TemplateService;
  private _auditService: AuditService;

  /**
   * Constructor
   */
  constructor() {
    this._logger = new Logger('TemplateController');
    this._templateService = new TemplateService();
    this._auditService = new AuditService();
  }

  /**
   * Create a new template
   */
  async createTemplate(req: Request, res: Response): Promise<Response> {
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
      const templateSchema = z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        content: z.string(),
        subject: z.string().optional(),
        contentHtml: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional().default(true),
        type: z.nativeEnum(CampaignType),
        metadata: z.record(z.string(), z.any()).optional()
      });

      const validation = templateSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template data',
          details: validation.error.format()
        });
      }

      // Create the template
      const template = await this._templateService.createTemplate({
        ...validation.data,
        companyId
      }, userId);

      // Record audit log
      await this._auditService.logAction({
        action: 'CREATE',
        entity: 'template',
        entityId: template.id,
        userId,
        companyId,
        details: {
          name: template.name,
          type: template.type
        }
      });

      return res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      this._logger.error('Error creating template', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to create template'
      });
    }
  }

  /**
   * Get all templates with pagination and filtering
   */
  async listTemplates(req: Request, res: Response): Promise<Response> {
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
        type: z.enum(['email', 'sms', 'social', 'push', 'whatsapp', 'multi_channel']).optional(),
        category: z.string().optional(),
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

      const { page, pageSize, isActive, type, category, search } = validation.data;

      // Get templates
      const { templates, total } = await this._templateService.listTemplates(
        companyId,
        { isActive, type: type as CampaignType | undefined, category, search },
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
      this._logger.error('Error listing templates', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to list templates'
      });
    }
  }

  /**
   * Get a template by ID
   */
  async getTemplateById(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid template ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Get the template
      const template = await this._templateService.getTemplateById(id, companyId);

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
      this._logger.error('Error getting template', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to get template'
      });
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid template ID',
          details: idValidation.error.format()
        });
      }

      const { id } = idValidation.data;

      // Validate request body
      const templateSchema = z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        content: z.string().optional(),
        subject: z.string().optional(),
        contentHtml: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
        type: z.enum(['email', 'sms', 'social', 'push', 'whatsapp', 'multi_channel']).optional(),
        metadata: z.record(z.string(), z.any()).optional()
      });

      const validation = templateSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid template data',
          details: validation.error.format()
        });
      }

      // Update the template
      const updatedTemplate = await this._templateService.updateTemplate(
        id,
        companyId,
        validation.data as any,
        userId
      );

      if (!updatedTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Record audit log
      await this._auditService.logAction({
        action: 'UPDATE',
        entity: 'template',
        entityId: id,
        userId,
        companyId,
        details: {
          changes: validation.data
        }
      });

      return res.status(200).json({
        success: true,
        data: updatedTemplate
      });
    } catch (error) {
      this._logger.error('Error updating template', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to update template'
      });
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid template ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Get the template first to record in audit log
      const template = await this._templateService.getTemplateById(id, companyId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Delete the template
      const deleted = await this._templateService.deleteTemplate(id, companyId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Record audit log
      await this._auditService.logAction({
        action: 'DELETE',
        entity: 'template',
        entityId: id,
        userId,
        companyId,
        details: {
          name: template.name,
          type: template.type
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      this._logger.error('Error deleting template', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to delete template'
      });
    }
  }

  /**
   * Preview a template with variables
   */
  async previewTemplate(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid template ID',
          details: idValidation.error.format()
        });
      }

      const { id } = idValidation.data;

      // Validate request body
      const bodySchema = z.object({
        variables: z.record(z.string(), z.string()).optional().default({})
      });

      const bodyValidation = bodySchema.safeParse(req.body);

      if (!bodyValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid preview data',
          details: bodyValidation.error.format()
        });
      }

      const { variables } = bodyValidation.data;

      // Preview the template
      const preview = await this._templateService.previewTemplate(id, companyId, variables);

      if (!preview) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: preview
      });
    } catch (error) {
      this._logger.error('Error previewing template', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to preview template'
      });
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(req: Request, res: Response): Promise<Response> {
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
          error: 'Invalid template ID',
          details: validation.error.format()
        });
      }

      const { id } = validation.data;

      // Validate request body for new name (optional)
      const bodySchema = z.object({
        name: z.string().min(1).max(100).optional()
      });

      const bodyValidation = bodySchema.safeParse(req.body);

      if (!bodyValidation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid duplication data',
          details: bodyValidation.error.format()
        });
      }

      const { name } = bodyValidation.data;

      // Duplicate the template
      const duplicatedTemplate = await this._templateService.duplicateTemplate(id, companyId, userId, name);

      if (!duplicatedTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Record audit log
      await this._auditService.logAction({
        action: 'CREATE',
        entity: 'template',
        entityId: duplicatedTemplate.id,
        userId,
        companyId,
        details: {
          originalId: id,
          name: duplicatedTemplate.name
        }
      });

      return res.status(201).json({
        success: true,
        data: duplicatedTemplate
      });
    } catch (error) {
      this._logger.error('Error duplicating template', error instanceof Error ? error.message : String(error));

      return res.status(500).json({
        success: false,
        error: 'Failed to duplicate template'
      });
    }
  }
}

// Create a singleton instance
export const templateController = new TemplateController();