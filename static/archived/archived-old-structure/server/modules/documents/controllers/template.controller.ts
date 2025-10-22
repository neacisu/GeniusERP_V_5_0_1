/**
 * Template Controller
 * 
 * Handles HTTP requests for document template operations
 * including creation, retrieval, and document generation.
 */

import { Request, Response } from 'express';
import { templateService, TemplateType } from '../services/template.service';

export class TemplateController {
  /**
   * Create a new document template
   */
  async createTemplate(req: Request, res: Response) {
    try {
      const { name, type, content, companyId } = req.body;
      
      if (!name || !type || !content || !companyId) {
        return res.status(400).json({
          success: false,
          message: 'Name, type, content, and companyId are required'
        });
      }
      
      // Validate template type
      if (!Object.values(TemplateType).includes(type as TemplateType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid template type',
          validTypes: Object.values(TemplateType)
        });
      }
      
      const result = await templateService.createTemplate({
        name,
        type: type as TemplateType,
        content,
        companyId
      });
      
      return res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: result
      });
    } catch (error: any) {
      console.error(`[TemplateController] Error creating template:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: error.message
      });
    }
  }
  
  /**
   * Update an existing template
   */
  async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Template ID is required'
        });
      }
      
      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Template content is required'
        });
      }
      
      const result = await templateService.updateTemplate(id, content);
      
      return res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: result
      });
    } catch (error: any) {
      console.error(`[TemplateController] Error updating template:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: error.message
      });
    }
  }
  
  /**
   * Get a template by ID
   */
  async getTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Template ID is required'
        });
      }
      
      const result = await templateService.getTemplate(id);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error(`[TemplateController] Error getting template:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get template',
        error: error.message
      });
    }
  }
  
  /**
   * List templates by type for a company
   */
  async listTemplates(req: Request, res: Response) {
    try {
      const { companyId, type } = req.query;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
      }
      
      const result = await templateService.listTemplates(
        companyId as string,
        type as TemplateType | undefined
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error(`[TemplateController] Error listing templates:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to list templates',
        error: error.message
      });
    }
  }
  
  /**
   * Generate a document from a template
   */
  async generateFromTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const { data, outputType, companyId } = req.body;
      
      if (!templateId) {
        return res.status(400).json({
          success: false,
          message: 'Template ID is required'
        });
      }
      
      if (!data || !outputType || !companyId) {
        return res.status(400).json({
          success: false,
          message: 'Data, outputType, and companyId are required'
        });
      }
      
      const result = await templateService.generateFromTemplate({
        templateId,
        data,
        outputType,
        companyId
      });
      
      return res.status(201).json({
        success: true,
        message: 'Document generated successfully',
        data: result
      });
    } catch (error: any) {
      console.error(`[TemplateController] Error generating document:`, error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate document',
        error: error.message
      });
    }
  }
}

// Export singleton instance
export const templateController = new TemplateController();