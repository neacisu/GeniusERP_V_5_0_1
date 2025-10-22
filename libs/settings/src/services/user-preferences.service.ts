/**
 * User Preferences Service
 * 
 * This service handles operations related to user-specific preferences and settings.
 * It provides methods for retrieving, creating, updating, and deleting user preferences.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { userPreferences } from '../schema/settings.schema';
import { eq, and } from 'drizzle-orm';
import { Logger } from '../../../common/logger';

export class UserPreferencesService {
  private drizzle: DrizzleService;
  private logger: Logger;
  private static instance: UserPreferencesService;

  constructor(drizzleService?: DrizzleService) {
    this.logger = new Logger('UserPreferencesService');
    this.drizzle = drizzleService || new DrizzleService();
  }

  /**
   * Get the singleton instance of the UserPreferencesService
   */
  public static getInstance(drizzleService?: DrizzleService): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService(drizzleService);
    }
    return UserPreferencesService.instance;
  }

  /**
   * Get a user preference by key
   * 
   * @param userId The user ID
   * @param key The preference key
   * @param companyId Optional company ID for company-specific preferences
   * @returns The preference value or null if not found
   */
  async getPreference(userId: string, key: string, companyId?: string) {
    try {
      this.logger.debug(`Getting user preference: ${key} for user: ${userId}, companyId: ${companyId || 'N/A'}`);
      
      let query = this.drizzle
        .select()
        .from(userPreferences)
        .where(and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.key, key)
        ));
      
      if (companyId) {
        query = query.where(eq(userPreferences.companyId, companyId));
      }
      
      const result = await query.limit(1);
      const preference = result.length > 0 ? result[0] : null;
      
      this.logger.debug(`User preference ${preference ? 'found' : 'not found'}: ${key} for user: ${userId}`);
      return preference;
    } catch (error) {
      this.logger.error('Error getting user preference:', error);
      throw error;
    }
  }

  /**
   * Get all preferences for a user
   * 
   * @param userId The user ID
   * @param companyId Optional company ID for company-specific preferences
   * @returns An array of user preferences
   */
  async getUserPreferences(userId: string, companyId?: string) {
    try {
      this.logger.debug(`Getting all preferences for user: ${userId}, companyId: ${companyId || 'N/A'}`);
      
      let query = this.drizzle
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      
      if (companyId) {
        query = query.where(eq(userPreferences.companyId, companyId));
      }
      
      const results = await query;
      this.logger.debug(`Found ${results.length} preferences for user: ${userId}`);
      
      return results;
    } catch (error) {
      this.logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences by category
   * 
   * @param userId The user ID
   * @param category The preference category
   * @param companyId Optional company ID for company-specific preferences
   * @returns An array of user preferences in the category
   */
  async getPreferencesByCategory(userId: string, category: string, companyId?: string) {
    try {
      this.logger.debug(`Getting preferences by category: ${category} for user: ${userId}, companyId: ${companyId || 'N/A'}`);
      
      let query = this.drizzle
        .select()
        .from(userPreferences)
        .where(and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.category, category)
        ));
      
      if (companyId) {
        query = query.where(eq(userPreferences.companyId, companyId));
      }
      
      const results = await query;
      this.logger.debug(`Found ${results.length} preferences in category: ${category} for user: ${userId}`);
      
      return results;
    } catch (error) {
      this.logger.error('Error getting user preferences by category:', error);
      throw error;
    }
  }

  /**
   * Get user preferences for a module
   * 
   * @param userId The user ID
   * @param module The module name
   * @param companyId Optional company ID for company-specific preferences
   * @returns An array of user preferences for the module
   */
  async getPreferencesByModule(userId: string, module: string, companyId?: string) {
    try {
      this.logger.debug(`Getting preferences by module: ${module} for user: ${userId}, companyId: ${companyId || 'N/A'}`);
      
      let query = this.drizzle
        .select()
        .from(userPreferences)
        .where(and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.module, module)
        ));
      
      if (companyId) {
        query = query.where(eq(userPreferences.companyId, companyId));
      }
      
      const results = await query;
      this.logger.debug(`Found ${results.length} preferences for module: ${module} for user: ${userId}`);
      
      return results;
    } catch (error) {
      this.logger.error('Error getting user preferences by module:', error);
      throw error;
    }
  }

  /**
   * Create a new user preference
   * 
   * @param data The preference data
   * @returns The created preference
   */
  async createPreference(data: Omit<typeof userPreferences.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      this.logger.debug(`Creating new user preference: ${data.key} for user: ${data.userId}`);
      
      const result = await this.drizzle.insert(userPreferences).values(data).returning();
      
      this.logger.debug(`Created new user preference with ID: ${result[0].id}`);
      return result[0];
    } catch (error) {
      this.logger.error('Error creating user preference:', error);
      throw error;
    }
  }

  /**
   * Update an existing user preference
   * 
   * @param id The preference ID
   * @param data The updated preference data
   * @returns The updated preference
   */
  async updatePreference(id: string, data: Partial<Omit<typeof userPreferences.$inferInsert, 'id' | 'createdAt'>>) {
    try {
      this.logger.debug(`Updating user preference with ID: ${id}`);
      
      // Set the updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await this.drizzle
        .update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.id, id))
        .returning();
      
      this.logger.debug(`Updated user preference with ID: ${id}`);
      return result[0];
    } catch (error) {
      this.logger.error('Error updating user preference:', error);
      throw error;
    }
  }

  /**
   * Delete a user preference
   * 
   * @param id The preference ID
   * @returns The deleted preference
   */
  async deletePreference(id: string) {
    try {
      this.logger.debug(`Deleting user preference with ID: ${id}`);
      
      const result = await this.drizzle
        .delete(userPreferences)
        .where(eq(userPreferences.id, id))
        .returning();
      
      this.logger.debug(`Deleted user preference with ID: ${id}`);
      return result[0];
    } catch (error) {
      this.logger.error('Error deleting user preference:', error);
      throw error;
    }
  }
}