/**
 * User Preferences Service
 * 
 * This service handles operations related to user-specific preferences and settings.
 * It provides methods for retrieving, creating, updating, and deleting user preferences.
 */

import { getDrizzle } from '../../../common/drizzle';
import { userPreferences } from '../schema/settings.schema';
import { eq, and } from 'drizzle-orm';

export class UserPreferencesService {
  private db: ReturnType<typeof getDrizzle>;
  private static instance: UserPreferencesService;

  private constructor() {
    this.db = getDrizzle();
  }

  /**
   * Get the singleton instance of the UserPreferencesService
   */
  public static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
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
      let query = this.db
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
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting user preference:', error);
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
      let query = this.db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      
      if (companyId) {
        query = query.where(eq(userPreferences.companyId, companyId));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting user preferences:', error);
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
      let query = this.db
        .select()
        .from(userPreferences)
        .where(and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.category, category)
        ));
      
      if (companyId) {
        query = query.where(eq(userPreferences.companyId, companyId));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting user preferences by category:', error);
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
      let query = this.db
        .select()
        .from(userPreferences)
        .where(and(
          eq(userPreferences.userId, userId),
          eq(userPreferences.module, module)
        ));
      
      if (companyId) {
        query = query.where(eq(userPreferences.companyId, companyId));
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting user preferences by module:', error);
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
      const result = await this.db.insert(userPreferences).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user preference:', error);
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
      // Set the updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await this.db
        .update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error('Error updating user preference:', error);
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
      const result = await this.db
        .delete(userPreferences)
        .where(eq(userPreferences.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error('Error deleting user preference:', error);
      throw error;
    }
  }
}