/**
 * Module Settings Service
 * 
 * This service handles operations related to module-specific configurations.
 * It provides a centralized way to manage settings for different modules in the application.
 */

import { getDrizzle } from '../../../common/drizzle';
import { globalSettings } from '../schema/settings.schema';
import { eq, and } from 'drizzle-orm';
import { GlobalSettingsService } from './global-settings.service';

export class ModuleSettingsService {
  private db: ReturnType<typeof getDrizzle>;
  private globalSettingsService: GlobalSettingsService;
  private static instance: ModuleSettingsService;

  private constructor() {
    this.db = getDrizzle();
    this.globalSettingsService = GlobalSettingsService.getInstance();
  }

  /**
   * Get the singleton instance of the ModuleSettingsService
   */
  public static getInstance(): ModuleSettingsService {
    if (!ModuleSettingsService.instance) {
      ModuleSettingsService.instance = new ModuleSettingsService();
    }
    return ModuleSettingsService.instance;
  }

  /**
   * Get all settings for a specific module
   * 
   * @param moduleName The module name
   * @param companyId Optional company ID for company-specific settings
   * @returns An array of settings for the module
   */
  async getAllModuleSettings(moduleName: string, companyId?: string) {
    try {
      let query = this.db
        .select()
        .from(globalSettings)
        .where(eq(globalSettings.module, moduleName));
      
      if (companyId) {
        query = query.where(eq(globalSettings.companyId, companyId));
      }
      
      return await query;
    } catch (error) {
      console.error(`Error getting settings for module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific setting for a module
   * 
   * @param moduleName The module name
   * @param key The setting key
   * @param companyId Optional company ID for company-specific settings
   * @returns The setting value or null if not found
   */
  async getModuleSetting(moduleName: string, key: string, companyId?: string) {
    try {
      // Fix the query to explicitly filter by module name and key
      const params = [
        eq(globalSettings.module, moduleName),
        eq(globalSettings.key, key)
      ];
      
      if (companyId) {
        params.push(eq(globalSettings.companyId, companyId));
      }
      
      const result = await this.db
        .select()
        .from(globalSettings)
        .where(and(...params))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error getting setting for module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Create a module setting
   * 
   * @param data The setting data including module field
   * @returns The created setting
   */
  async createModuleSetting(data: Omit<typeof globalSettings.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!data.module) {
      throw new Error('Module name is required for module settings');
    }
    
    return this.globalSettingsService.createSetting(data);
  }

  /**
   * Update a module setting
   * 
   * @param id The setting ID
   * @param data The updated setting data
   * @returns The updated setting
   */
  async updateModuleSetting(id: string, data: Partial<Omit<typeof globalSettings.$inferInsert, 'id' | 'createdAt'>>) {
    return this.globalSettingsService.updateSetting(id, data);
  }

  /**
   * Delete a module setting
   * 
   * @param id The setting ID
   * @returns The deleted setting
   */
  async deleteModuleSetting(id: string) {
    return this.globalSettingsService.deleteSetting(id);
  }

  /**
   * Register default settings for a module
   * 
   * @param moduleName The module name
   * @param settings Array of default settings for the module
   * @param companyId Optional company ID for company-specific settings
   * @param createdBy Optional user ID who created the settings
   * @returns Array of created settings
   */
  async registerDefaultSettings(
    moduleName: string,
    settings: Array<{
      key: string;
      value: any;
      category: string;
      description?: string;
      isSystemWide?: boolean;
    }>,
    companyId?: string,
    createdBy?: string
  ) {
    const results = [];
    
    for (const setting of settings) {
      // Check if the setting already exists
      const existingSetting = await this.getModuleSetting(moduleName, setting.key, companyId);
      
      if (!existingSetting) {
        // Create the setting if it doesn't exist
        const newSetting = await this.createModuleSetting({
          key: setting.key,
          value: setting.value,
          category: setting.category,
          module: moduleName,
          description: setting.description,
          isSystemWide: setting.isSystemWide || false,
          companyId,
          createdBy,
          updatedBy: createdBy
        });
        
        results.push(newSetting);
      }
    }
    
    return results;
  }

  /**
   * Get settings for multiple modules
   * 
   * @param moduleNames Array of module names
   * @param companyId Optional company ID for company-specific settings
   * @returns Object with module names as keys and arrays of settings as values
   */
  async getMultiModuleSettings(moduleNames: string[], companyId?: string) {
    try {
      const results: Record<string, typeof globalSettings.$inferSelect[]> = {};
      
      for (const moduleName of moduleNames) {
        results[moduleName] = await this.getAllModuleSettings(moduleName, companyId);
      }
      
      return results;
    } catch (error) {
      console.error('Error getting multi-module settings:', error);
      throw error;
    }
  }
}