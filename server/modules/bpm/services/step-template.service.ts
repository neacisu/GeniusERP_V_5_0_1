import { eq, and, or, desc } from 'drizzle-orm';
import { 
  bpmStepTemplates, 
  BpmStepTemplateType, 
  BpmStepTemplateTargetType,
  StepTemplateCreate,
  StepTemplateUpdate,
  StepTemplate
} from '../schema/bpm.schema.js';

/**
 * Step Template Service
 * 
 * This service manages reusable template steps that can be added to processes.
 * These are predefined steps with specific actions that can be customized and
 * reused across multiple processes.
 */
export class StepTemplateService {
  /**
   * Constructor
   * 
   * @param db Database connection
   */
  constructor(private db) {}

  /**
   * Create a new step template
   * 
   * @param data Step template data
   * @returns Created step template
   */
  async createStepTemplate(data: StepTemplateCreate): Promise<StepTemplate> {
    try {
      const [stepTemplate] = await this.db
        .insert(bpmStepTemplates)
        .values({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return stepTemplate;
    } catch (error) {
      console.error('Error creating step template:', error);
      throw new Error(`Failed to create step template: ${error.message}`);
    }
  }

  /**
   * Get all step templates for a company
   * 
   * @param companyId Company ID
   * @param includeGlobal Whether to include global step templates
   * @returns List of step templates
   */
  async getStepTemplates(companyId: string, includeGlobal = true): Promise<StepTemplate[]> {
    try {
      let query = this.db
        .select()
        .from(bpmStepTemplates)
        .orderBy(desc(bpmStepTemplates.createdAt));
      
      if (includeGlobal) {
        query = query.where(
          or(
            eq(bpmStepTemplates.companyId, companyId),
            eq(bpmStepTemplates.isGlobal, true)
          )
        );
      } else {
        query = query.where(eq(bpmStepTemplates.companyId, companyId));
      }

      return await query;
    } catch (error) {
      console.error('Error getting step templates:', error);
      throw new Error(`Failed to get step templates: ${error.message}`);
    }
  }

  /**
   * Get a step template by ID
   * 
   * @param id Step template ID
   * @param companyId Company ID for authorization
   * @returns Step template or null if not found
   */
  async getStepTemplateById(id: string, companyId: string): Promise<StepTemplate | null> {
    try {
      const [stepTemplate] = await this.db
        .select()
        .from(bpmStepTemplates)
        .where(
          and(
            eq(bpmStepTemplates.id, id),
            or(
              eq(bpmStepTemplates.companyId, companyId),
              eq(bpmStepTemplates.isGlobal, true)
            )
          )
        );
      
      return stepTemplate || null;
    } catch (error) {
      console.error('Error getting step template by ID:', error);
      throw new Error(`Failed to get step template: ${error.message}`);
    }
  }

  /**
   * Update a step template
   * 
   * @param id Step template ID
   * @param data Step template update data
   * @param companyId Company ID for authorization
   * @returns Updated step template
   */
  async updateStepTemplate(id: string, data: StepTemplateUpdate, companyId: string): Promise<StepTemplate> {
    try {
      // First check if the template exists and belongs to the company
      const stepTemplate = await this.getStepTemplateById(id, companyId);
      if (!stepTemplate) {
        throw new Error('Step template not found or you do not have permission to update it');
      }
      
      // Don't allow updating global templates unless they belong to the company
      if (stepTemplate.isGlobal && stepTemplate.companyId !== companyId) {
        throw new Error('You do not have permission to update this global step template');
      }

      const [updatedTemplate] = await this.db
        .update(bpmStepTemplates)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(bpmStepTemplates.id, id))
        .returning();
      
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating step template:', error);
      throw new Error(`Failed to update step template: ${error.message}`);
    }
  }

  /**
   * Delete a step template
   * 
   * @param id Step template ID
   * @param companyId Company ID for authorization
   * @returns Boolean indicating if the deletion was successful
   */
  async deleteStepTemplate(id: string, companyId: string): Promise<boolean> {
    try {
      // First check if the template exists and belongs to the company
      const stepTemplate = await this.getStepTemplateById(id, companyId);
      if (!stepTemplate) {
        throw new Error('Step template not found or you do not have permission to delete it');
      }
      
      // Don't allow deleting global templates unless they belong to the company
      if (stepTemplate.isGlobal && stepTemplate.companyId !== companyId) {
        throw new Error('You do not have permission to delete this global step template');
      }

      const result = await this.db
        .delete(bpmStepTemplates)
        .where(eq(bpmStepTemplates.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting step template:', error);
      throw new Error(`Failed to delete step template: ${error.message}`);
    }
  }

  /**
   * Get step templates by type
   * 
   * @param type Step template type
   * @param companyId Company ID
   * @param includeGlobal Whether to include global step templates
   * @returns List of step templates of the specified type
   */
  async getStepTemplatesByType(
    type: BpmStepTemplateType, 
    companyId: string, 
    includeGlobal = true
  ): Promise<StepTemplate[]> {
    try {
      let query = this.db
        .select()
        .from(bpmStepTemplates)
        .where(eq(bpmStepTemplates.type, type))
        .orderBy(desc(bpmStepTemplates.createdAt));
      
      if (includeGlobal) {
        query = query.where(
          or(
            eq(bpmStepTemplates.companyId, companyId),
            eq(bpmStepTemplates.isGlobal, true)
          )
        );
      } else {
        query = query.where(eq(bpmStepTemplates.companyId, companyId));
      }

      return await query;
    } catch (error) {
      console.error(`Error getting step templates by type ${type}:`, error);
      throw new Error(`Failed to get step templates by type: ${error.message}`);
    }
  }

  /**
   * Get step templates by target type
   * 
   * @param targetType Step template target type
   * @param companyId Company ID
   * @param includeGlobal Whether to include global step templates
   * @returns List of step templates of the specified target type
   */
  async getStepTemplatesByTargetType(
    targetType: BpmStepTemplateTargetType, 
    companyId: string, 
    includeGlobal = true
  ): Promise<StepTemplate[]> {
    try {
      let query = this.db
        .select()
        .from(bpmStepTemplates)
        .where(eq(bpmStepTemplates.targetType, targetType))
        .orderBy(desc(bpmStepTemplates.createdAt));
      
      if (includeGlobal) {
        query = query.where(
          or(
            eq(bpmStepTemplates.companyId, companyId),
            eq(bpmStepTemplates.isGlobal, true)
          )
        );
      } else {
        query = query.where(eq(bpmStepTemplates.companyId, companyId));
      }

      return await query;
    } catch (error) {
      console.error(`Error getting step templates by target type ${targetType}:`, error);
      throw new Error(`Failed to get step templates by target type: ${error.message}`);
    }
  }

  /**
   * Toggle global status of a step template
   * 
   * @param id Step template ID
   * @param isGlobal New global status
   * @param companyId Company ID for authorization
   * @returns Updated step template
   */
  async toggleGlobalTemplate(id: string, isGlobal: boolean, companyId: string): Promise<StepTemplate> {
    try {
      // First check if the template exists and belongs to the company
      const stepTemplate = await this.getStepTemplateById(id, companyId);
      if (!stepTemplate) {
        throw new Error('Step template not found or you do not have permission to update it');
      }
      
      // Only allow changing global status if the template belongs to the company
      if (stepTemplate.companyId !== companyId) {
        throw new Error('You do not have permission to change the global status of this template');
      }

      const [updatedTemplate] = await this.db
        .update(bpmStepTemplates)
        .set({
          isGlobal,
          updatedAt: new Date(),
          updatedBy: companyId, // Assuming this is the user ID
        })
        .where(eq(bpmStepTemplates.id, id))
        .returning();
      
      return updatedTemplate;
    } catch (error) {
      console.error('Error toggling global status of step template:', error);
      throw new Error(`Failed to toggle global status: ${error.message}`);
    }
  }
}