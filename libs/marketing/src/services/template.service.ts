/**
 * Template Service
 * 
 * This service provides functions to manage marketing campaign templates
 * that can be reused across multiple campaigns.
 */

import { eq, and, desc, sql, like, not, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from "@common/logger";
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { 
  campaignTemplates, 
  CampaignTemplate, 
  CampaignTemplateInsert,
  CampaignType
} from '../../../../shared/schema/marketing.schema';

/**
 * Service for managing marketing campaign templates
 */
export class TemplateService {
  private _logger: Logger;
  private drizzle: DrizzleService;
  
  constructor() {
    this._logger = new Logger('TemplateService');
    this.drizzle = new DrizzleService();
  }
  
  /**
   * Create a new campaign template
   * @param templateData Template data to insert
   * @param userId ID of the user creating the template
   * @returns The created template
   */
  async createTemplate(templateData: CampaignTemplateInsert, userId: string): Promise<CampaignTemplate> {
    this._logger.info(`Creating new template: ${templateData.name}`);
    
    try {
      // Generate a new UUID if not provided
      const id = uuidv4();
      
      // Set created and updated by fields
      const nowTimestamp = new Date();
      
      const result = await this.drizzle.query((db) =>
        db.insert(campaignTemplates).values({
          ...templateData,
          id,
          createdAt: nowTimestamp,
          updatedAt: nowTimestamp,
          createdBy: userId,
          updatedBy: userId
        }).returning()
      );
      
      if (!result || result.length === 0) {
        throw new Error('Failed to create template');
      }
      
      return result[0];
    } catch (error) {
      this._logger.error('Error creating template', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Get a template by ID
   * @param id Template ID
   * @param companyId Company ID
   * @returns The template or null if not found
   */
  async getTemplateById(id: string, companyId: string): Promise<CampaignTemplate | null> {
    this._logger.info(`Getting template by ID: ${id}`);
    
    try {
      const result = await this.drizzle.query((db) =>
        db.select()
          .from(campaignTemplates)
          .where(and(
            eq(campaignTemplates.id, id),
            eq(campaignTemplates.companyId, companyId)
          ))
      );
      
      if (!result || result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      this._logger.error(`Error getting template with ID ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Update an existing template
   * @param id Template ID
   * @param companyId Company ID
   * @param updateData The template data to update
   * @param userId The ID of the user making the update
   * @returns The updated template
   */
  async updateTemplate(
    id: string, 
    companyId: string, 
    updateData: Partial<CampaignTemplateInsert>,
    userId: string
  ): Promise<CampaignTemplate | null> {
    this._logger.info(`Updating template: ${id}`);
    
    try {
      // Check if template exists
      const existing = await this.getTemplateById(id, companyId);
      
      if (!existing) {
        this._logger.warn(`Template with ID ${id} not found`);
        return null;
      }
      
      // Update the template
      const result = await this.drizzle.query((db) =>
        db.update(campaignTemplates)
          .set({
            ...updateData,
            updatedAt: new Date(),
            updatedBy: userId
          })
          .where(and(
            eq(campaignTemplates.id, id),
            eq(campaignTemplates.companyId, companyId)
          ))
          .returning()
      );
      
      if (!result || result.length === 0) {
        throw new Error('Failed to update template');
      }
      
      return result[0];
    } catch (error) {
      this._logger.error(`Error updating template with ID ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Delete a template
   * @param id Template ID
   * @param companyId Company ID
   * @returns True if successfully deleted, false otherwise
   */
  async deleteTemplate(id: string, companyId: string): Promise<boolean> {
    this._logger.info(`Deleting template: ${id}`);
    
    try {
      // Check if template exists
      const existing = await this.getTemplateById(id, companyId);
      
      if (!existing) {
        this._logger.warn(`Template with ID ${id} not found`);
        return false;
      }
      
      // Delete the template
      const result = await this.drizzle.query((db) =>
        db.delete(campaignTemplates)
          .where(and(
            eq(campaignTemplates.id, id),
            eq(campaignTemplates.companyId, companyId)
          ))
          .returning({ id: campaignTemplates.id })
      );
      
      return result.length > 0;
    } catch (error) {
      this._logger.error(`Error deleting template with ID ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * List templates with filtering and pagination
   * @param companyId Company ID
   * @param filters Optional filters for the templates
   * @param page Page number for pagination (1-based)
   * @param pageSize Number of items per page
   * @returns List of templates and total count
   */
  async listTemplates(
    companyId: string,
    filters: {
      type?: CampaignType;
      category?: string;
      isActive?: boolean;
      search?: string;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ templates: CampaignTemplate[]; total: number }> {
    this._logger.info(`Listing templates for company: ${companyId}`);
    
    try {
      const offset = (page - 1) * pageSize;
      
      // Build the where clause based on filters
      const conditions = [eq(campaignTemplates.companyId, companyId)];
      
      if (filters.type) {
        conditions.push(eq(campaignTemplates.type, filters.type));
      }
      
      if (filters.category) {
        conditions.push(eq(campaignTemplates.category, filters.category));
      }
      
      if (filters.isActive !== undefined) {
        conditions.push(eq(campaignTemplates.isActive, filters.isActive));
      }
      
      if (filters.search) {
        conditions.push(like(campaignTemplates.name, `%${filters.search}%`));
      }
      
      const whereClause = and(...conditions);
      
      // Get the total count
      const countResult = await this.drizzle.query((db) =>
        db.select({ count: sql<number>`count(*)` })
          .from(campaignTemplates)
          .where(whereClause)
      );
      
      const total = countResult[0]?.count || 0;
      
      // Get the templates for the requested page
      const result = await this.drizzle.query((db) =>
        db.select()
          .from(campaignTemplates)
          .where(whereClause)
          .orderBy(desc(campaignTemplates.createdAt))
          .limit(pageSize)
          .offset(offset)
      );
      
      return { templates: result, total };
    } catch (error) {
      this._logger.error('Error listing templates', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Get all template categories
   * @param companyId Company ID
   * @returns List of unique template categories
   */
  async getTemplateCategories(companyId: string): Promise<string[]> {
    this._logger.info(`Getting template categories for company: ${companyId}`);
    
    try {
      // Get distinct categories
      const result = await this.drizzle.query((db) =>
        db.select({
          category: campaignTemplates.category
        })
        .from(campaignTemplates)
        .where(and(
          eq(campaignTemplates.companyId, companyId),
          not(isNull(campaignTemplates.category))
        ))
        .groupBy(campaignTemplates.category)
      );
      
      // Extract category names
      return result
        .map((row: any) => row.category)
        .filter(Boolean) as string[];
    } catch (error) {
      this._logger.error('Error getting template categories', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Clone an existing template
   * @param id ID of the template to clone
   * @param companyId Company ID
   * @param newName Name for the cloned template
   * @param userId ID of the user cloning the template
   * @returns The newly created template
   */
  async cloneTemplate(
    id: string,
    companyId: string,
    newName: string,
    userId: string
  ): Promise<CampaignTemplate | null> {
    this._logger.info(`Cloning template ${id} with name ${newName}`);
    
    try {
      // Get the original template
      const original = await this.getTemplateById(id, companyId);
      
      if (!original) {
        this._logger.warn(`Template with ID ${id} not found`);
        return null;
      }
      
      // Create a new template based on the original
      const clonedTemplate = await this.createTemplate({
        companyId,
        name: newName,
        description: original.description ? `Clone of: ${original.description}` : `Clone of template: ${original.name}`,
        type: original.type as any,
        subject: original.subject,
        content: original.content,
        contentHtml: original.contentHtml,
        previewImage: original.previewImage,
        category: original.category,
        isActive: true,
        metadata: original.metadata as any
      }, userId);
      
      return clonedTemplate;
    } catch (error) {
      this._logger.error(`Error cloning template ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Toggle a template's active status
   * @param id Template ID
   * @param companyId Company ID
   * @param isActive New active status
   * @param userId ID of the user updating the template
   * @returns The updated template
   */
  async toggleTemplateStatus(
    id: string,
    companyId: string,
    isActive: boolean,
    userId: string
  ): Promise<CampaignTemplate | null> {
    this._logger.info(`Setting template ${id} active status to ${isActive}`);
    
    try {
      // Update the template status
      return await this.updateTemplate(
        id,
        companyId,
        { isActive },
        userId
      );
    } catch (error) {
      this._logger.error(`Error toggling status for template ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Preview a template with variable substitution
   * @param id Template ID
   * @param companyId Company ID
   * @param variables Variables to substitute in the template
   * @returns Preview of the template with variables substituted
   */
  async previewTemplate(
    id: string,
    companyId: string,
    variables: Record<string, string>
  ): Promise<{ subject?: string; content?: string; contentHtml?: string } | null> {
    this._logger.info(`Previewing template ${id}`);
    
    try {
      // Get the template
      const template = await this.getTemplateById(id, companyId);
      
      if (!template) {
        this._logger.warn(`Template with ID ${id} not found`);
        return null;
      }
      
      // Simple variable substitution function
      const substitute = (text: string | null | undefined): string | undefined => {
        if (!text) return undefined;
        
        let result = text;
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{${key}}`, 'g');
          result = result.replace(regex, value);
        }
        return result;
      };
      
      return {
        subject: substitute(template.subject),
        content: substitute(template.content),
        contentHtml: substitute(template.contentHtml)
      };
    } catch (error) {
      this._logger.error(`Error previewing template ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Duplicate a template
   * @param id Template ID to duplicate
   * @param companyId Company ID
   * @param userId ID of the user duplicating the template
   * @param newName Optional new name for the duplicated template
   * @returns The newly created template
   */
  async duplicateTemplate(
    id: string,
    companyId: string,
    userId: string,
    newName?: string
  ): Promise<CampaignTemplate | null> {
    this._logger.info(`Duplicating template ${id}`);
    
    try {
      // Get the original template
      const original = await this.getTemplateById(id, companyId);
      
      if (!original) {
        this._logger.warn(`Template with ID ${id} not found`);
        return null;
      }
      
      // Use cloneTemplate method with appropriate name
      const duplicateName = newName || `${original.name} (Copy)`;
      return await this.cloneTemplate(id, companyId, duplicateName, userId);
    } catch (error) {
      this._logger.error(`Error duplicating template ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}