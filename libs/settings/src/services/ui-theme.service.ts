/**
 * UI Theme Service
 * 
 * This service handles operations related to UI theming and appearance settings.
 * It provides methods for retrieving, creating, updating, and managing UI themes.
 */

import { DrizzleService } from "@common/drizzle/drizzle.service";
import { uiThemes } from '../schema/settings.schema';
import { eq, and, not } from 'drizzle-orm';
import { Logger } from "@common/logger";

export class UiThemeService {
  private drizzle: DrizzleService;
  private logger: Logger;
  private static instance: UiThemeService;

  constructor(drizzleService?: DrizzleService) {
    this.logger = new Logger('UiThemeService');
    this.drizzle = drizzleService || new DrizzleService();
  }

  /**
   * Get the singleton instance of the UiThemeService
   */
  public static getInstance(drizzleService?: DrizzleService): UiThemeService {
    if (!UiThemeService.instance) {
      UiThemeService.instance = new UiThemeService(drizzleService);
    }
    return UiThemeService.instance;
  }

  /**
   * Get all themes for a company
   * 
   * @param companyId The company ID
   * @returns An array of UI themes for the company
   */
  async getCompanyThemes(companyId: string) {
    try {
      this.logger.debug(`Getting UI themes for company: ${companyId}`);
      
      const result = await this.drizzle
        .select()
        .from(uiThemes)
        .where(eq(uiThemes.companyId, companyId));
      
      this.logger.debug(`Found ${result.length} UI themes for company: ${companyId}`);
      return result;
    } catch (error) {
      this.logger.error('Error getting company themes:', error);
      throw error;
    }
  }

  /**
   * Get the default theme for a company
   * 
   * @param companyId The company ID
   * @returns The default UI theme or null if not found
   */
  async getDefaultTheme(companyId: string) {
    try {
      this.logger.debug(`Getting default UI theme for company: ${companyId}`);
      
      const result = await this.drizzle
        .select()
        .from(uiThemes)
        .where(and(
          eq(uiThemes.companyId, companyId),
          eq(uiThemes.isDefault, true)
        ))
        .limit(1);
      
      const theme = result.length > 0 ? result[0] : null;
      this.logger.debug(`Default theme ${theme ? 'found' : 'not found'} for company: ${companyId}`);
      
      return theme;
    } catch (error) {
      this.logger.error('Error getting default theme:', error);
      throw error;
    }
  }

  /**
   * Get a theme by ID
   * 
   * @param id The theme ID
   * @returns The UI theme or null if not found
   */
  async getThemeById(id: string) {
    try {
      this.logger.debug(`Getting UI theme by ID: ${id}`);
      
      const result = await this.drizzle
        .select()
        .from(uiThemes)
        .where(eq(uiThemes.id, id))
        .limit(1);
      
      const theme = result.length > 0 ? result[0] : null;
      this.logger.debug(`Theme ${theme ? 'found' : 'not found'} with ID: ${id}`);
      
      return theme;
    } catch (error) {
      this.logger.error('Error getting theme by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new UI theme
   * 
   * @param data The theme data
   * @returns The created UI theme
   */
  async createTheme(data: Omit<typeof uiThemes.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      this.logger.debug(`Creating new UI theme for company: ${data.companyId}`);
      
      // If this is the default theme, unset any other default themes
      if (data.isDefault && data.companyId) {
        this.logger.debug('Clearing other default themes before creating new default theme');
        await this.clearDefaultTheme(data.companyId);
      }
      
      const result = await this.drizzle.insert(uiThemes).values(data).returning();
      this.logger.debug(`Created new UI theme with ID: ${result[0].id}`);
      
      return result[0];
    } catch (error) {
      this.logger.error('Error creating UI theme:', error);
      throw error;
    }
  }

  /**
   * Update an existing UI theme
   * 
   * @param id The theme ID
   * @param data The updated theme data
   * @returns The updated UI theme
   */
  async updateTheme(id: string, data: Partial<Omit<typeof uiThemes.$inferInsert, 'id' | 'createdAt'>>) {
    try {
      this.logger.debug(`Updating UI theme with ID: ${id}`);
      
      // If this is being set as the default theme, unset any other default themes
      if (data.isDefault) {
        const currentTheme = await this.getThemeById(id);
        if (currentTheme) {
          this.logger.debug(`Clearing other default themes for company: ${currentTheme.companyId}`);
          await this.clearDefaultTheme(currentTheme.companyId, id);
        }
      }
      
      // Set the updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await this.drizzle
        .update(uiThemes)
        .set(updateData)
        .where(eq(uiThemes.id, id))
        .returning();
      
      this.logger.debug(`Updated UI theme with ID: ${id}`);
      return result[0];
    } catch (error) {
      this.logger.error('Error updating UI theme:', error);
      throw error;
    }
  }

  /**
   * Delete a UI theme
   * 
   * @param id The theme ID
   * @returns The deleted UI theme
   */
  async deleteTheme(id: string) {
    try {
      this.logger.debug(`Deleting UI theme with ID: ${id}`);
      
      const result = await this.drizzle
        .delete(uiThemes)
        .where(eq(uiThemes.id, id))
        .returning();
      
      this.logger.debug(`Deleted UI theme with ID: ${id}`);
      return result[0];
    } catch (error) {
      this.logger.error('Error deleting UI theme:', error);
      throw error;
    }
  }

  /**
   * Set a theme as the default for a company
   * 
   * @param id The theme ID
   * @returns The updated UI theme
   */
  async setAsDefault(id: string) {
    try {
      this.logger.debug(`Setting UI theme with ID: ${id} as default`);
      
      const theme = await this.getThemeById(id);
      if (!theme) {
        this.logger.error(`Theme not found with ID: ${id}`);
        throw new Error('Theme not found');
      }
      
      // Clear any existing default themes
      this.logger.debug(`Clearing other default themes for company: ${theme.companyId}`);
      await this.clearDefaultTheme(theme.companyId, id);
      
      // Set this theme as default
      const result = await this.drizzle
        .update(uiThemes)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(uiThemes.id, id))
        .returning();
      
      this.logger.debug(`Set UI theme with ID: ${id} as default`);
      return result[0];
    } catch (error) {
      this.logger.error('Error setting theme as default:', error);
      throw error;
    }
  }

  /**
   * Clear the default flag from all themes for a company except the specified theme
   * 
   * @param companyId The company ID
   * @param exceptThemeId Optional theme ID to exclude from the update
   */
  private async clearDefaultTheme(companyId: string, exceptThemeId?: string) {
    try {
      this.logger.debug(`Clearing default themes for company: ${companyId}${exceptThemeId ? ', except ID: ' + exceptThemeId : ''}`);
      
      let query = this.drizzle
        .update(uiThemes)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(uiThemes.companyId, companyId),
          eq(uiThemes.isDefault, true)
        ));
      
      if (exceptThemeId) {
        query = query.where(not(eq(uiThemes.id, exceptThemeId)));
      }
      
      await query;
      this.logger.debug('Default themes cleared successfully');
    } catch (error) {
      this.logger.error('Error clearing default theme:', error);
      throw error;
    }
  }
}