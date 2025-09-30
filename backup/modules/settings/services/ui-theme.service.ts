/**
 * UI Theme Service
 * 
 * This service handles operations related to UI theming and appearance settings.
 * It provides methods for retrieving, creating, updating, and managing UI themes.
 */

import { getDrizzle } from '../../../common/drizzle';
import { uiThemes } from '../schema/settings.schema';
import { eq, and } from 'drizzle-orm';

export class UiThemeService {
  private db: ReturnType<typeof getDrizzle>;
  private static instance: UiThemeService;

  private constructor() {
    this.db = getDrizzle();
  }

  /**
   * Get the singleton instance of the UiThemeService
   */
  public static getInstance(): UiThemeService {
    if (!UiThemeService.instance) {
      UiThemeService.instance = new UiThemeService();
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
      const result = await this.db
        .select()
        .from(uiThemes)
        .where(eq(uiThemes.companyId, companyId));
      
      return result;
    } catch (error) {
      console.error('Error getting company themes:', error);
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
      const result = await this.db
        .select()
        .from(uiThemes)
        .where(and(
          eq(uiThemes.companyId, companyId),
          eq(uiThemes.isDefault, true)
        ))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting default theme:', error);
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
      const result = await this.db
        .select()
        .from(uiThemes)
        .where(eq(uiThemes.id, id))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting theme by ID:', error);
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
      // If this is the default theme, unset any other default themes
      if (data.isDefault) {
        await this.clearDefaultTheme(data.companyId);
      }
      
      const result = await this.db.insert(uiThemes).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating UI theme:', error);
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
      // If this is being set as the default theme, unset any other default themes
      if (data.isDefault) {
        const currentTheme = await this.getThemeById(id);
        if (currentTheme) {
          await this.clearDefaultTheme(currentTheme.companyId, id);
        }
      }
      
      // Set the updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await this.db
        .update(uiThemes)
        .set(updateData)
        .where(eq(uiThemes.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error('Error updating UI theme:', error);
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
      const result = await this.db
        .delete(uiThemes)
        .where(eq(uiThemes.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error('Error deleting UI theme:', error);
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
      const theme = await this.getThemeById(id);
      if (!theme) {
        throw new Error('Theme not found');
      }
      
      // Clear any existing default themes
      await this.clearDefaultTheme(theme.companyId, id);
      
      // Set this theme as default
      const result = await this.db
        .update(uiThemes)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(uiThemes.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error('Error setting theme as default:', error);
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
      let query = this.db
        .update(uiThemes)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(uiThemes.companyId, companyId),
          eq(uiThemes.isDefault, true)
        ));
      
      if (exceptThemeId) {
        query = query.where(eq(uiThemes.id, exceptThemeId).invert());
      }
      
      await query;
    } catch (error) {
      console.error('Error clearing default theme:', error);
      throw error;
    }
  }
}