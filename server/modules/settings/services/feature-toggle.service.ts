/**
 * Feature Toggle Service
 * 
 * This service handles operations related to feature flags for enabling/disabling functionality.
 * It provides methods for retrieving, creating, updating, and managing feature toggles.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { featureToggles } from '../schema/settings.schema';
import { eq, and, isNull } from 'drizzle-orm';
import { Logger } from '../../../common/logger';

export class FeatureToggleService {
  private drizzle: DrizzleService;
  private logger: Logger;
  private static instance: FeatureToggleService;
  // In-memory cache for commonly accessed toggles
  private cache: Map<string, { value: boolean; expiry: number }> = new Map();
  private readonly CACHE_TTL = 60 * 1000; // 1 minute in milliseconds

  constructor(drizzleService?: DrizzleService) {
    this.logger = new Logger('FeatureToggleService');
    this.drizzle = drizzleService || new DrizzleService();
  }

  /**
   * Get the singleton instance of the FeatureToggleService
   */
  public static getInstance(drizzleService?: DrizzleService): FeatureToggleService {
    if (!FeatureToggleService.instance) {
      FeatureToggleService.instance = new FeatureToggleService(drizzleService);
    }
    return FeatureToggleService.instance;
  }

  /**
   * Generate a cache key for a feature toggle
   * 
   * @param feature The feature name
   * @param companyId Optional company ID
   * @returns The cache key
   */
  private getCacheKey(feature: string, companyId?: string): string {
    return `${feature}:${companyId || 'global'}`;
  }

  /**
   * Store a feature toggle in the cache
   * 
   * @param feature The feature name
   * @param value The toggle value (enabled/disabled)
   * @param companyId Optional company ID
   */
  private cacheToggle(feature: string, value: boolean, companyId?: string): void {
    const key = this.getCacheKey(feature, companyId);
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.CACHE_TTL
    });
    this.logger.debug(`Cached feature toggle: ${key} = ${value}`);
  }

  /**
   * Get a cached feature toggle value if available
   * 
   * @param feature The feature name
   * @param companyId Optional company ID
   * @returns The cached value or undefined if not in cache or expired
   */
  private getCachedToggle(feature: string, companyId?: string): boolean | undefined {
    const key = this.getCacheKey(feature, companyId);
    const cached = this.cache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      this.logger.debug(`Cache hit for feature toggle: ${key} = ${cached.value}`);
      return cached.value;
    }
    
    if (cached) {
      // Clean up expired cache entry
      this.logger.debug(`Removing expired cache entry for feature toggle: ${key}`);
      this.cache.delete(key);
    }
    
    return undefined;
  }

  /**
   * Check if a feature is enabled
   * 
   * @param feature The feature name
   * @param companyId Optional company ID for company-specific toggles
   * @returns True if the feature is enabled, false otherwise
   */
  async isFeatureEnabled(feature: string, companyId?: string): Promise<boolean> {
    // Check cache first
    const cachedValue = this.getCachedToggle(feature, companyId);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    try {
      this.logger.debug(`Checking if feature is enabled: ${feature}, companyId: ${companyId || 'global'}`);
      
      let query = this.drizzle
        .select()
        .from(featureToggles)
        .where(eq(featureToggles.feature, feature));
      
      if (companyId) {
        query = query.where(eq(featureToggles.companyId, companyId));
      } else {
        // For global features, company ID should be null
        query = query.where(isNull(featureToggles.companyId));
      }
      
      const result = await query.limit(1);
      
      const isEnabled = result.length > 0 ? result[0].enabled : false;
      
      // Cache the result
      this.cacheToggle(feature, isEnabled, companyId);
      
      return isEnabled;
    } catch (error) {
      this.logger.error('Error checking feature toggle:', error);
      return false; // Default to disabled on error
    }
  }

  /**
   * Get all feature toggles for a module
   * 
   * @param module The module name
   * @param companyId Optional company ID for company-specific toggles
   * @returns An array of feature toggles for the module
   */
  async getFeaturesByModule(module: string, companyId?: string) {
    try {
      this.logger.debug(`Getting features for module: ${module}, companyId: ${companyId || 'global'}`);
      
      let query = this.drizzle
        .select()
        .from(featureToggles)
        .where(eq(featureToggles.module, module));
      
      if (companyId) {
        query = query.where(eq(featureToggles.companyId, companyId));
      } else {
        // For global features, company ID should be null
        query = query.where(isNull(featureToggles.companyId));
      }
      
      return await query;
    } catch (error) {
      this.logger.error('Error getting features by module:', error);
      throw error;
    }
  }

  /**
   * Get all feature toggles for a company
   * 
   * @param companyId The company ID
   * @returns An array of feature toggles for the company
   */
  async getCompanyFeatures(companyId: string) {
    try {
      this.logger.debug(`Getting features for company: ${companyId}`);
      
      const result = await this.drizzle
        .select()
        .from(featureToggles)
        .where(eq(featureToggles.companyId, companyId));
      
      return result;
    } catch (error) {
      this.logger.error('Error getting company features:', error);
      throw error;
    }
  }

  /**
   * Create a new feature toggle
   * 
   * @param data The feature toggle data
   * @returns The created feature toggle
   */
  async createFeatureToggle(data: Omit<typeof featureToggles.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      this.logger.debug(`Creating feature toggle: ${data.feature}`);
      
      const result = await this.drizzle.insert(featureToggles).values(data).returning();
      
      // Clear cache for this feature
      if (result[0]) {
        const key = this.getCacheKey(result[0].feature, result[0].companyId || undefined);
        this.cache.delete(key);
      }
      
      return result[0];
    } catch (error) {
      this.logger.error('Error creating feature toggle:', error);
      throw error;
    }
  }

  /**
   * Update an existing feature toggle
   * 
   * @param id The feature toggle ID
   * @param data The updated feature toggle data
   * @returns The updated feature toggle
   */
  async updateFeatureToggle(id: string, data: Partial<Omit<typeof featureToggles.$inferInsert, 'id' | 'createdAt'>>) {
    try {
      this.logger.debug(`Updating feature toggle with ID: ${id}`);
      
      // Get the current toggle to clear cache later
      const currentToggle = await this.drizzle
        .select()
        .from(featureToggles)
        .where(eq(featureToggles.id, id))
        .limit(1);
      
      // Set the updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      const result = await this.drizzle
        .update(featureToggles)
        .set(updateData)
        .where(eq(featureToggles.id, id))
        .returning();
      
      // Clear cache for this feature
      if (currentToggle.length > 0) {
        const feature = currentToggle[0];
        const key = this.getCacheKey(feature.feature, feature.companyId || undefined);
        this.cache.delete(key);
        this.logger.debug(`Cleared cache for feature toggle: ${key}`);
      }
      
      return result[0];
    } catch (error) {
      this.logger.error('Error updating feature toggle:', error);
      throw error;
    }
  }

  /**
   * Enable a feature toggle
   * 
   * @param id The feature toggle ID
   * @param userId The user ID who enabled the feature
   * @returns The updated feature toggle
   */
  async enableFeature(id: string, userId: string) {
    this.logger.debug(`Enabling feature toggle ${id} by user ${userId}`);
    return this.updateFeatureToggle(id, { enabled: true, updatedBy: userId });
  }

  /**
   * Disable a feature toggle
   * 
   * @param id The feature toggle ID
   * @param userId The user ID who disabled the feature
   * @returns The updated feature toggle
   */
  async disableFeature(id: string, userId: string) {
    this.logger.debug(`Disabling feature toggle ${id} by user ${userId}`);
    return this.updateFeatureToggle(id, { enabled: false, updatedBy: userId });
  }

  /**
   * Delete a feature toggle
   * 
   * @param id The feature toggle ID
   * @returns The deleted feature toggle
   */
  async deleteFeatureToggle(id: string) {
    try {
      this.logger.debug(`Deleting feature toggle with ID: ${id}`);
      
      // Get the current toggle to clear cache later
      const currentToggle = await this.drizzle
        .select()
        .from(featureToggles)
        .where(eq(featureToggles.id, id))
        .limit(1);
      
      const result = await this.drizzle
        .delete(featureToggles)
        .where(eq(featureToggles.id, id))
        .returning();
      
      // Clear cache for this feature
      if (currentToggle.length > 0) {
        const feature = currentToggle[0];
        const key = this.getCacheKey(feature.feature, feature.companyId || undefined);
        this.cache.delete(key);
        this.logger.debug(`Cleared cache for deleted feature toggle: ${key}`);
      }
      
      return result[0];
    } catch (error) {
      this.logger.error('Error deleting feature toggle:', error);
      throw error;
    }
  }
}