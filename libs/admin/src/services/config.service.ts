/**
 * Config Service for Admin Module
 * 
 * This service manages system-wide and module-specific configuration settings,
 * supporting hierarchical configuration with company, user, and global scopes.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { configurations } from '@geniuserp/shared';
import { and, eq, isNull, sql, like } from 'drizzle-orm';
import { createModuleLogger } from "@common/logger/loki-logger";
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration scope enum
 */
export enum ConfigScope {
  GLOBAL = 'global',
  COMPANY = 'company',
  USER = 'user',
  MODULE = 'module'
}

/**
 * Config service for the Admin module
 */
export class ConfigService {
  private db: PostgresJsDatabase<any>;
  private logger = createModuleLogger('ConfigService');
  private cache: Map<string, any> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps: Map<string, number> = new Map();

  /**
   * Constructor for ConfigService
   * @param db Drizzle database instance
   */
  constructor(db: PostgresJsDatabase<any>) {
    this.db = db;
  }

  /**
   * Get all configuration settings
   * @param options Optional filters (scope, companyId, userId, moduleId)
   * @returns Array of all configuration settings
   */
  async getAllConfigs(options?: {
    scope?: ConfigScope;
    companyId?: string;
    userId?: string;
    moduleId?: string;
  }): Promise<any[]> {
    try {
      this.logger.debug('Getting all configs');
      
      const filters = [];
      
      if (options?.scope) {
        filters.push(eq(configurations.scope, options.scope));
      }
      
      if (options?.companyId) {
        filters.push(eq(configurations.company_id, options.companyId));
      }
      
      if (options?.userId) {
        filters.push(eq(configurations.user_id, options.userId));
      }
      
      if (options?.moduleId) {
        filters.push(eq(configurations.module_id, options.moduleId));
      }
      
      let configs;
      if (filters.length > 0) {
        configs = await this.db.select()
          .from(configurations)
          .where(and(...filters));
      } else {
        configs = await this.db.select()
          .from(configurations);
      }
      
      return configs;
    } catch (error) {
      this.logger.error('Error getting all configs:', error);
      throw error;
    }
  }

  /**
   * Set a configuration value
   * @param key Configuration key
   * @param value Configuration value (will be stored as JSON)
   * @param options Options including scope and IDs
   * @param actorId ID of the user making the change
   * @returns Created/updated configuration
   */
  async setConfig(
    key: string,
    value: any,
    options: {
      scope: ConfigScope;
      companyId?: string;
      userId?: string;
      moduleId?: string;
      description?: string;
    },
    actorId: string
  ) {
    try {
      this.logger.debug(`Setting config: ${key} in scope ${options.scope}`);
      const { scope, companyId, userId, moduleId, description } = options;
      
      // Validate required IDs based on scope
      if (scope === ConfigScope.COMPANY && !companyId) {
        throw new Error('Company ID is required for company scope');
      }
      
      if (scope === ConfigScope.USER && (!userId || !companyId)) {
        throw new Error('User ID and Company ID are required for user scope');
      }
      
      if (scope === ConfigScope.MODULE && !moduleId) {
        throw new Error('Module ID is required for module scope');
      }
      
      // Check if config already exists
      const whereConditions = this.buildWhereConditions(key, options);
      const existingConfigs = await this.db.select()
        .from(configurations)
        .where(whereConditions);
      
      let config;
      
      if (existingConfigs.length > 0) {
        // Update existing config
        const [updatedConfig] = await this.db.update(configurations)
          .set({
            value: value,
            description: description || existingConfigs[0].description,
            updated_at: new Date(),
            updated_by: actorId
          })
          .where(whereConditions)
          .returning();
        
        config = updatedConfig;
      } else {
        // Create new config
        const [newConfig] = await this.db.insert(configurations)
          .values({
            id: uuidv4(),
            key,
            value: value,
            scope,
            company_id: companyId || null,
            user_id: userId || null,
            module_id: moduleId || null,
            description: description || null,
            is_encrypted: false,
            created_by: actorId,
            updated_by: actorId
          })
          .returning();
        
        config = newConfig;
      }
      
      // Invalidate cache
      this.invalidateCache(key, options);
      
      return config;
    } catch (error) {
      this.logger.error(`Error setting config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a configuration value
   * @param key Configuration key
   * @param options Options including scope and IDs
   * @returns Configuration value or null if not found
   */
  async getConfig(
    key: string,
    options: {
      scope: ConfigScope;
      companyId?: string;
      userId?: string;
      moduleId?: string;
      useCache?: boolean;
    }
  ): Promise<any> {
    try {
      const { scope, companyId, userId, moduleId, useCache = true } = options;
      
      // Try to get from cache first
      const cacheKey = this.getCacheKey(key, options);
      if (useCache) {
        const cachedValue = this.getFromCache(cacheKey);
        if (cachedValue !== undefined) {
          return cachedValue;
        }
      }
      
      // Validate required IDs based on scope
      if (scope === ConfigScope.COMPANY && !companyId) {
        throw new Error('Company ID is required for company scope');
      }
      
      if (scope === ConfigScope.USER && (!userId || !companyId)) {
        throw new Error('User ID and Company ID are required for user scope');
      }
      
      if (scope === ConfigScope.MODULE && !moduleId) {
        throw new Error('Module ID is required for module scope');
      }
      
      // Get from database
      const whereConditions = this.buildWhereConditions(key, options);
      const [config] = await this.db.select()
        .from(configurations)
        .where(whereConditions);
      
      const result = config || null;
      
      // Update cache
      if (useCache) {
        this.setInCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error getting config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get configuration with cascading fallback
   * This tries to get a config in the following order:
   * 1. User-specific config
   * 2. Company-specific config
   * 3. Module-specific config
   * 4. Global config
   * 
   * @param key Configuration key
   * @param options Options with scope priority and IDs
   * @returns First found configuration value or null if not found at any level
   */
  async getConfigWithFallback(
    key: string,
    options: {
      userId?: string;
      companyId?: string;
      moduleId?: string;
      useCache?: boolean;
    }
  ): Promise<any> {
    const { userId, companyId, moduleId, useCache = true } = options;
    
    try {
      // Try user scope first (if userId and companyId provided)
      if (userId && companyId) {
        const userConfig = await this.getConfig(key, {
          scope: ConfigScope.USER,
          userId,
          companyId,
          useCache
        }).catch(() => null);
        
        if (userConfig !== null) {
          return userConfig;
        }
      }
      
      // Try company scope (if companyId provided)
      if (companyId) {
        const companyConfig = await this.getConfig(key, {
          scope: ConfigScope.COMPANY,
          companyId,
          useCache
        }).catch(() => null);
        
        if (companyConfig !== null) {
          return companyConfig;
        }
      }
      
      // Try module scope (if moduleId provided)
      if (moduleId) {
        const moduleConfig = await this.getConfig(key, {
          scope: ConfigScope.MODULE,
          moduleId,
          useCache
        }).catch(() => null);
        
        if (moduleConfig !== null) {
          return moduleConfig;
        }
      }
      
      // Finally, try global scope
      return await this.getConfig(key, {
        scope: ConfigScope.GLOBAL,
        useCache
      }).catch(() => null);
    } catch (error) {
      this.logger.error(`Error getting config with fallback ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a configuration
   * @param key Configuration key
   * @param options Options including scope and IDs
   * @param actorId ID of the user making the change
   * @returns Boolean indicating success
   */
  async deleteConfig(
    key: string,
    options: {
      scope: ConfigScope;
      companyId?: string;
      userId?: string;
      moduleId?: string;
    }
  ): Promise<boolean> {
    try {
      const { scope, companyId, userId, moduleId } = options;
      
      // Validate required IDs based on scope
      if (scope === ConfigScope.COMPANY && !companyId) {
        throw new Error('Company ID is required for company scope');
      }
      
      if (scope === ConfigScope.USER && (!userId || !companyId)) {
        throw new Error('User ID and Company ID are required for user scope');
      }
      
      if (scope === ConfigScope.MODULE && !moduleId) {
        throw new Error('Module ID is required for module scope');
      }
      
      // Get config for verification
      const whereConditions = this.buildWhereConditions(key, options);
      const [config] = await this.db.select()
        .from(configurations)
        .where(whereConditions);
      
      if (!config) {
        return false;
      }
      
      // Delete the config
      await this.db.delete(configurations)
        .where(whereConditions);
      
      // Invalidate cache
      this.invalidateCache(key, options);
      
      return true;
    } catch (error) {
      this.logger.error(`Error deleting config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get configurations by category/module
   * @param category The category/module ID
   * @param options Optional filters
   * @returns Array of configurations for the specified category
   */
  async getConfigsByCategory(
    category: string,
    options?: {
      companyId?: string;
      userId?: string;
    }
  ): Promise<any[]> {
    try {
      this.logger.debug(`Getting configs for category: ${category}`);
      
      const filters = [eq(configurations.module_id, category)];
      
      if (options?.companyId) {
        filters.push(eq(configurations.company_id, options.companyId));
      }
      
      if (options?.userId) {
        filters.push(eq(configurations.user_id, options.userId));
      }
      
      const configs = await this.db.select()
        .from(configurations)
        .where(and(...filters));
      
      return configs;
    } catch (error) {
      this.logger.error(`Error getting configs for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Reset configurations to default values
   * @param options Optional filters to specify which configs to reset
   */
  async resetToDefaults(options?: {
    companyId?: string;
    userId?: string;
    moduleId?: string;
    scope?: ConfigScope;
  }): Promise<void> {
    try {
      this.logger.info('Resetting configs to defaults');
      
      const filters = [];
      
      if (options?.companyId) {
        filters.push(eq(configurations.company_id, options.companyId));
      }
      
      if (options?.userId) {
        filters.push(eq(configurations.user_id, options.userId));
      }
      
      if (options?.moduleId) {
        filters.push(eq(configurations.module_id, options.moduleId));
      }
      
      if (options?.scope) {
        filters.push(eq(configurations.scope, options.scope));
      }
      
      if (filters.length > 0) {
        await this.db.delete(configurations)
          .where(and(...filters));
      } else {
        // If no filters specified, only delete non-global configs to be safe
        await this.db.delete(configurations)
          .where(sql`${configurations.scope} != 'global'`);
      }
      
      // Clear cache
      this.clearCache();
      
      this.logger.info('Configs reset to defaults completed');
    } catch (error) {
      this.logger.error('Error resetting configs to defaults:', error);
      throw error;
    }
  }

  /**
   * List configurations by scope and optional filters
   * @param options Options for filtering
   * @returns Array of configuration objects
   */
  async listConfigurations(
    options: {
      scope?: ConfigScope;
      companyId?: string;
      userId?: string;
      moduleId?: string;
      keyPrefix?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    try {
      const { scope, companyId, userId, moduleId, keyPrefix, limit = 100, offset = 0 } = options;
      
      // Apply filters
      const filters = [];
      
      if (scope) {
        filters.push(eq(configurations.scope, scope));
      }
      
      if (companyId) {
        filters.push(eq(configurations.company_id, companyId));
      }
      
      if (userId) {
        filters.push(eq(configurations.user_id, userId));
      }
      
      if (moduleId) {
        filters.push(eq(configurations.module_id, moduleId));
      }
      
      if (keyPrefix) {
        filters.push(like(configurations.key, `${keyPrefix}%`));
      }
      
      // Apply pagination
      let configs;
      if (filters.length > 0) {
        configs = await this.db.select()
          .from(configurations)
          .where(and(...filters))
          .limit(limit)
          .offset(offset);
      } else {
        configs = await this.db.select()
          .from(configurations)
          .limit(limit)
          .offset(offset);
      }
      
      return configs;
    } catch (error) {
      this.logger.error('Error listing configurations:', error);
      throw error;
    }
  }

  /**
   * Build the where conditions for a configuration query
   * @param key Configuration key
   * @param options Scope options
   * @returns SQL where conditions
   */
  private buildWhereConditions(
    key: string,
    options: {
      scope: ConfigScope;
      companyId?: string;
      userId?: string;
      moduleId?: string;
    }
  ) {
    const { scope, companyId, userId, moduleId } = options;
    
    const conditions = [
      eq(configurations.key, key),
      eq(configurations.scope, scope)
    ];
    
    if (scope === ConfigScope.COMPANY) {
      conditions.push(eq(configurations.company_id, companyId!));
      conditions.push(isNull(configurations.user_id));
      conditions.push(isNull(configurations.module_id));
    } else if (scope === ConfigScope.USER) {
      conditions.push(eq(configurations.company_id, companyId!));
      conditions.push(eq(configurations.user_id, userId!));
      conditions.push(isNull(configurations.module_id));
    } else if (scope === ConfigScope.MODULE) {
      conditions.push(isNull(configurations.company_id));
      conditions.push(isNull(configurations.user_id));
      conditions.push(eq(configurations.module_id, moduleId!));
    } else if (scope === ConfigScope.GLOBAL) {
      conditions.push(isNull(configurations.company_id));
      conditions.push(isNull(configurations.user_id));
      conditions.push(isNull(configurations.module_id));
    }
    
    return and(...conditions);
  }

  /**
   * Get a cache key for a configuration
   * @param key Configuration key
   * @param options Scope options
   * @returns Cache key string
   */
  private getCacheKey(
    key: string,
    options: {
      scope: ConfigScope;
      companyId?: string;
      userId?: string;
      moduleId?: string;
    }
  ): string {
    const { scope, companyId, userId, moduleId } = options;
    return `${scope}:${companyId || 'null'}:${userId || 'null'}:${moduleId || 'null'}:${key}`;
  }

  /**
   * Get a value from the cache
   * @param cacheKey Cache key
   * @returns Cached value or undefined if not found or expired
   */
  private getFromCache(cacheKey: string): any {
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (timestamp && Date.now() - timestamp < this.cacheTTL) {
      return this.cache.get(cacheKey);
    }
    
    // Clean up expired entry
    if (timestamp) {
      this.cache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);
    }
    
    return undefined;
  }

  /**
   * Set a value in the cache
   * @param cacheKey Cache key
   * @param value Value to cache
   */
  private setInCache(cacheKey: string, value: any): void {
    this.cache.set(cacheKey, value);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  /**
   * Invalidate cache for a specific key
   * @param key Configuration key
   * @param options Scope options
   */
  private invalidateCache(
    key: string,
    options: {
      scope: ConfigScope;
      companyId?: string;
      userId?: string;
      moduleId?: string;
    }
  ): void {
    const cacheKey = this.getCacheKey(key, options);
    this.cache.delete(cacheKey);
    this.cacheTimestamps.delete(cacheKey);
  }

  /**
   * Clear the entire cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.logger.info('Config cache cleared');
  }
}
