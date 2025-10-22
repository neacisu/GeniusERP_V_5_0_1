/**
 * Global Settings Service
 * 
 * This service handles operations related to system-wide and company-level settings.
 * It provides methods for retrieving, creating, updating, and deleting global settings.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { globalSettings } from '../schema/settings.schema';
import { eq, and, sql } from 'drizzle-orm';
import { Logger } from '../../../common/logger';

export class GlobalSettingsService {
  private drizzle: DrizzleService;
  private logger: Logger;
  private static instance: GlobalSettingsService;

  constructor(drizzleService?: DrizzleService) {
    this.logger = new Logger('GlobalSettingsService');
    this.drizzle = drizzleService || new DrizzleService();
  }

  /**
   * Get the singleton instance of the GlobalSettingsService
   */
  public static getInstance(drizzleService?: DrizzleService): GlobalSettingsService {
    if (!GlobalSettingsService.instance) {
      GlobalSettingsService.instance = new GlobalSettingsService(drizzleService);
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
      this.logger.debug(`Getting setting by key: ${key}, companyId: ${companyId || 'system-wide'}`);
      
      let query = this.drizzle.select().from(globalSettings).where(eq(globalSettings.key, key));
      
      if (companyId) {
        query = query.where(eq(globalSettings.companyId, companyId));
      } else {
        query = query.where(eq(globalSettings.isSystemWide, true));
      }
      
      const result = await query.limit(1);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      this.logger.error('Error getting global setting:', error);
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
      this.logger.debug(`Getting settings by category: ${category}, companyId: ${companyId || 'system-wide'}`);
      
      let query = this.drizzle.select().from(globalSettings).where(eq(globalSettings.category, category));
      
      if (companyId) {
        query = query.where(eq(globalSettings.companyId, companyId));
      } else {
        query = query.where(eq(globalSettings.isSystemWide, true));
      }
      
      return await query;
    } catch (error) {
      this.logger.error('Error getting settings by category:', error);
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
      this.logger.debug(`Getting settings by module: ${module}, companyId: ${companyId || 'system-wide'}`);
      
      let query = this.drizzle.select().from(globalSettings).where(eq(globalSettings.module, module));
      
      if (companyId) {
        query = query.where(eq(globalSettings.companyId, companyId));
      } else {
        query = query.where(eq(globalSettings.isSystemWide, true));
      }
      
      return await query;
    } catch (error) {
      this.logger.error('Error getting settings by module:', error);
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
      this.logger.debug(`Creating setting: ${data.key}`);
      
      const result = await this.drizzle.insert(globalSettings).values(data).returning();
      return result[0];
    } catch (error) {
      this.logger.error('Error creating global setting:', error);
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
      this.logger.debug(`Updating setting with ID: ${id}`);
      
      // Set the updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await this.drizzle
        .update(globalSettings)
        .set(updateData)
        .where(eq(globalSettings.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      this.logger.error('Error updating global setting:', error);
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
      this.logger.debug(`Deleting setting with ID: ${id}`);
      
      const result = await this.drizzle
        .delete(globalSettings)
        .where(eq(globalSettings.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      this.logger.error('Error deleting global setting:', error);
      throw error;
    }
  }
}