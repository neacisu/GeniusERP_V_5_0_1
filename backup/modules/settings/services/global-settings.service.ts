/**
 * Global Settings Service
 * 
 * This service handles operations related to system-wide and company-level settings.
 * It provides methods for retrieving, creating, updating, and deleting global settings.
 */

import { getDrizzle } from '../../../common/drizzle';
import { globalSettings } from '../schema/settings.schema';
import { eq, and, sql } from 'drizzle-orm';

export class GlobalSettingsService {
  private db: ReturnType<typeof getDrizzle>;
  private static instance: GlobalSettingsService;

  private constructor() {
    this.db = getDrizzle();
  }

  /**
   * Get the singleton instance of the GlobalSettingsService
   */
  public static getInstance(): GlobalSettingsService {
    if (!GlobalSettingsService.instance) {
      GlobalSettingsService.instance = new GlobalSettingsService();
    }
    return GlobalSettingsService.instance;
  }

  /**
   * Get a global setting by key
   * 
   * @param key The setting key
   * @param companyId Optional company ID for company-specific settings
   * @returns The setting value or null if not found
   */
  async getSetting(key: string, companyId?: string) {
    try {
      let query = this.db.select().from(globalSettings).where(eq(globalSettings.key, key));
      
      if (companyId) {
        query = query.where(eq(globalSettings.companyId, companyId));
      } else {
        query = query.where(eq(globalSettings.isSystemWide, true));
      }
      
      const result = await query.limit(1);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting global setting:', error);
      throw error;
    }
  }

  /**
   * Get all settings in a category
   * 
   * @param category The settings category
   * @param companyId Optional company ID for company-specific settings
   * @returns An array of settings in the category
   */
  async getSettingsByCategory(category: string, companyId?: string) {
    try {
      let query = this.db.select().from(globalSettings).where(eq(globalSettings.category, category));
      
      if (companyId) {
        query = query.where(eq(globalSettings.companyId, companyId));
      } else {
        query = query.where(eq(globalSettings.isSystemWide, true));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting settings by category:', error);
      throw error;
    }
  }

  /**
   * Get all settings for a module
   * 
   * @param module The module name
   * @param companyId Optional company ID for company-specific settings
   * @returns An array of settings for the module
   */
  async getSettingsByModule(module: string, companyId?: string) {
    try {
      let query = this.db.select().from(globalSettings).where(eq(globalSettings.module, module));
      
      if (companyId) {
        query = query.where(eq(globalSettings.companyId, companyId));
      } else {
        query = query.where(eq(globalSettings.isSystemWide, true));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting settings by module:', error);
      throw error;
    }
  }

  /**
   * Create a new global setting
   * 
   * @param data The setting data
   * @returns The created setting
   */
  async createSetting(data: Omit<typeof globalSettings.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const result = await this.db.insert(globalSettings).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating global setting:', error);
      throw error;
    }
  }

  /**
   * Update an existing global setting
   * 
   * @param id The setting ID
   * @param data The updated setting data
   * @returns The updated setting
   */
  async updateSetting(id: string, data: Partial<Omit<typeof globalSettings.$inferInsert, 'id' | 'createdAt'>>) {
    try {
      // Set the updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await this.db
        .update(globalSettings)
        .set(updateData)
        .where(eq(globalSettings.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error('Error updating global setting:', error);
      throw error;
    }
  }

  /**
   * Delete a global setting
   * 
   * @param id The setting ID
   * @returns The deleted setting
   */
  async deleteSetting(id: string) {
    try {
      const result = await this.db
        .delete(globalSettings)
        .where(eq(globalSettings.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error('Error deleting global setting:', error);
      throw error;
    }
  }
}