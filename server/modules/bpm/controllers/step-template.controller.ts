import { Request, Response } from 'express';
import { StepTemplateService } from '../services/step-template.service.js';
import { AuditService } from '../../../common/services/audit.service.js';
import { 
  BpmStepTemplateType, 
  BpmStepTemplateTargetType, 
  createStepTemplateSchema, 
  updateStepTemplateSchema 
} from '../schema/bpm.schema.js';
import { AuditService, AuditAction } from '../../audit/services/audit.service';

/**
 * Step Template Controller
 * 
 * Handles HTTP requests related to step templates in the BPM module.
 */
export class StepTemplateController {
  /**
   * Constructor
   * 
   * @param stepTemplateService The step template service
   * @param auditService The audit service for logging actions
   */
  constructor(
    private stepTemplateService: StepTemplateService,
    private auditService: AuditService
  ) {}

  /**
   * Get all step templates
   * 
   * @param req Express request
   * @param res Express response
   */
  async getStepTemplates(req: Request, res: Response) {
    try {
      const { companyId } = req.user;
      const includeGlobal = req.query.includeGlobal !== 'false';

      const stepTemplates = await this.stepTemplateService.getStepTemplates(companyId, includeGlobal);
      
      res.status(200).json({
        success: true,
        data: stepTemplates
      });
    } catch (error: unknown) {
      console.error('Error getting step templates:', error);
      res.status(500).json({
        success: false,
        message: `Error getting step templates: ${error.message}`
      });
    }
  }

  /**
   * Get a step template by ID
   * 
   * @param req Express request
   * @param res Express response
   */
  async getStepTemplateById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { companyId } = req.user;

      const stepTemplate = await this.stepTemplateService.getStepTemplateById(id, companyId);
      
      if (!stepTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Step template not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: stepTemplate
      });
    } catch (error: unknown) {
      console.error('Error getting step template by ID:', error);
      res.status(500).json({
        success: false,
        message: `Error getting step template: ${error.message}`
      });
    }
  }

  /**
   * Create a new step template
   * 
   * @param req Express request
   * @param res Express response
   */
  async createStepTemplate(req: Request, res: Response) {
    try {
      const { companyId, id: userId } = req.user;
      
      // Validate request body
      const validation = createStepTemplateSchema.safeParse({
        ...req.body,
        companyId
      });
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validation.error.issues
        });
      }
      
      const data = validation.data;
      
      // Create the step template
      const stepTemplate = await this.stepTemplateService.createStepTemplate({
        ...data,
        createdBy: userId,
        updatedBy: userId
      });
      
      // Log the action
      await AuditService.log({
        action: AuditAction.CREATE,
        entity: 'bpm_step_templates',
        entityId: stepTemplate.id,
        userId,
        companyId,
        metadata: {
          name: stepTemplate.name,
          type: stepTemplate.type,
          targetType: stepTemplate.targetType
        }
      });
      
      res.status(201).json({
        success: true,
        data: stepTemplate
      });
    } catch (error: unknown) {
      console.error('Error creating step template:', error);
      res.status(500).json({
        success: false,
        message: `Error creating step template: ${error.message}`
      });
    }
  }

  /**
   * Update a step template
   * 
   * @param req Express request
   * @param res Express response
   */
  async updateStepTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      
      // Validate request body
      const validation = updateStepTemplateSchema.safeParse({
        ...req.body,
        updatedBy: userId
      });
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validation.error.issues
        });
      }
      
      const data = validation.data;
      
      // Check if the step template exists
      const existingTemplate = await this.stepTemplateService.getStepTemplateById(id, companyId);
      if (!existingTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Step template not found or you do not have permission to update it'
        });
      }
      
      // Update the step template
      const stepTemplate = await this.stepTemplateService.updateStepTemplate(id, data, companyId);
      
      // Log the action
      await AuditService.log({
        action: AuditAction.UPDATE,
        entity: 'bpm_step_templates',
        entityId: id,
        userId,
        companyId,
        metadata: {
          name: stepTemplate.name,
          type: stepTemplate.type,
          targetType: stepTemplate.targetType,
          changes: req.body
        }
      });
      
      res.status(200).json({
        success: true,
        data: stepTemplate
      });
    } catch (error: unknown) {
      console.error('Error updating step template:', error);
      res.status(500).json({
        success: false,
        message: `Error updating step template: ${error.message}`
      });
    }
  }

  /**
   * Delete a step template
   * 
   * @param req Express request
   * @param res Express response
   */
  async deleteStepTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      
      // Check if the step template exists
      const stepTemplate = await this.stepTemplateService.getStepTemplateById(id, companyId);
      if (!stepTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Step template not found or you do not have permission to delete it'
        });
      }
      
      // Delete the step template
      await this.stepTemplateService.deleteStepTemplate(id, companyId);
      
      // Log the action
      await AuditService.log({
        action: AuditAction.DELETE,
        entity: 'bpm_step_templates',
        entityId: id,
        userId,
        companyId,
        metadata: {
          name: stepTemplate.name,
          type: stepTemplate.type
        }
      });
      
      res.status(200).json({
        success: true,
        message: 'Step template deleted successfully'
      });
    } catch (error: unknown) {
      console.error('Error deleting step template:', error);
      res.status(500).json({
        success: false,
        message: `Error deleting step template: ${error.message}`
      });
    }
  }

  /**
   * Get step templates by type
   * 
   * @param req Express request
   * @param res Express response
   */
  async getStepTemplatesByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { companyId } = req.user;
      const includeGlobal = req.query.includeGlobal !== 'false';
      
      // Validate the type parameter
      if (!Object.values(BpmStepTemplateType).includes(type as BpmStepTemplateType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid step template type'
        });
      }
      
      const stepTemplates = await this.stepTemplateService.getStepTemplatesByType(
        type as BpmStepTemplateType,
        companyId,
        includeGlobal
      );
      
      res.status(200).json({
        success: true,
        data: stepTemplates
      });
    } catch (error: unknown) {
      console.error('Error getting step templates by type:', error);
      res.status(500).json({
        success: false,
        message: `Error getting step templates: ${error.message}`
      });
    }
  }

  /**
   * Get step templates by target type
   * 
   * @param req Express request
   * @param res Express response
   */
  async getStepTemplatesByTargetType(req: Request, res: Response) {
    try {
      const { targetType } = req.params;
      const { companyId } = req.user;
      const includeGlobal = req.query.includeGlobal !== 'false';
      
      // Validate the targetType parameter
      if (!Object.values(BpmStepTemplateTargetType).includes(targetType as BpmStepTemplateTargetType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid step template target type'
        });
      }
      
      const stepTemplates = await this.stepTemplateService.getStepTemplatesByTargetType(
        targetType as BpmStepTemplateTargetType,
        companyId,
        includeGlobal
      );
      
      res.status(200).json({
        success: true,
        data: stepTemplates
      });
    } catch (error: unknown) {
      console.error('Error getting step templates by target type:', error);
      res.status(500).json({
        success: false,
        message: `Error getting step templates: ${error.message}`
      });
    }
  }

  /**
   * Toggle global status of a step template
   * 
   * @param req Express request
   * @param res Express response
   */
  async toggleGlobalTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { companyId, id: userId } = req.user;
      const { isGlobal } = req.body;
      
      // Validate request body
      if (typeof isGlobal !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data: isGlobal must be a boolean'
        });
      }
      
      // Check if the step template exists
      const existingTemplate = await this.stepTemplateService.getStepTemplateById(id, companyId);
      if (!existingTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Step template not found or you do not have permission to update it'
        });
      }
      
      // Toggle global status
      const stepTemplate = await this.stepTemplateService.toggleGlobalTemplate(id, isGlobal, companyId);
      
      // Log the action
      await AuditService.log({
        action: AuditAction.UPDATE,
        entity: 'bpm_step_templates',
        entityId: id,
        userId,
        companyId,
        metadata: {
          name: stepTemplate.name,
          isGlobal: isGlobal,
          previousIsGlobal: existingTemplate.isGlobal
        }
      });
      
      res.status(200).json({
        success: true,
        data: stepTemplate
      });
    } catch (error: unknown) {
      console.error('Error toggling global status:', error);
      res.status(500).json({
        success: false,
        message: `Error toggling global status: ${error.message}`
      });
    }
  }
}