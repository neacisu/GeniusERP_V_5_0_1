/**
 * Config Service for Admin Module
 * 
 * This service manages system-wide and module-specific configuration settings,
 * supporting hierarchical configuration with company, user, and global scopes.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { configurations } from '../../../../shared/schema/admin.schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { Express, Request, Response, Router } from 'express';
import { AuthGuard } from '../../../common/middleware/auth-guard';
import { Logger } from '../../../common/logger';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration scope enum
 */
enum ConfigScope {
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
  private logger = new Logger('ConfigService');
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
    },
    actorId: string
  ) {
    try {
      this.logger.debug(`Setting config: ${key} in scope ${options.scope}`);
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
            value_json: value,
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
            value_json: value,
            scope,
            company_id: companyId || null,
            user_id: userId || null,
            module_id: moduleId || null,
            created_by: actorId,
            updated_by: actorId
          })
          .returning();
        
        config = newConfig;
      }
      
      // Invalidate cache
      this.invalidateCache(key, options);
      
      // Log audit event
      await AuditService.log({
        userId: actorId,
        companyId: companyId || null,
        action: AuditAction.UPDATE,
        entity: 'configurations',
        entityId: config.id,
        details: {
          key,
          scope,
          // Don't log sensitive values
          valueType: typeof value
        }
      });
      
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
      
      const value = config ? config.value_json : null;
      
      // Update cache
      if (useCache) {
        this.setInCache(cacheKey, value);
      }
      
      return value;
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
    },
    actorId: string
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
      
      // Get config for audit log
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
      
      // Log audit event
      await AuditService.log({
        userId: actorId,
        companyId: companyId || null,
        action: AuditAction.DELETE,
        entity: 'configurations',
        entityId: config.id,
        details: {
          key,
          scope
        }
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Error deleting config ${key}:`, error);
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
      
      let query = this.db.select()
        .from(configurations);
      
      // Apply filters
      const filters = [];
      
      if (scope) {
        filters.push(eq(configurations.scope, scope));
      }
      
      if (companyId) {
        filters.push(eq(configurations.company_id, companyId));
      } else if (companyId === null) {
        filters.push(isNull(configurations.company_id));
      }
      
      if (userId) {
        filters.push(eq(configurations.user_id, userId));
      } else if (userId === null) {
        filters.push(isNull(configurations.user_id));
      }
      
      if (moduleId) {
        filters.push(eq(configurations.module_id, moduleId));
      } else if (moduleId === null) {
        filters.push(isNull(configurations.module_id));
      }
      
      if (keyPrefix) {
        filters.push(sql`${configurations.key} LIKE ${keyPrefix + '%'}`);
      }
      
      if (filters.length > 0) {
        query = query.where(and(...filters));
      }
      
      // Apply pagination
      query = query
        .limit(limit)
        .offset(offset)
        .orderBy(configurations.key);
      
      return await query;
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

  /**
   * Register API routes for configuration management
   * @param app Express application
   */
  registerRoutes(app: Express): void {
    this.logger.info('Registering configuration management routes...');
    const router = Router();

    // Authentication middleware
    const requireAuth = AuthGuard.requireAuth();
    const requireAdmin = AuthGuard.requireRoles(['admin']);
    
    // GET /api/admin/config - Get a configuration value with fallback
    router.get('/config', requireAuth, async (req: Request, res: Response) => {
      try {
        const { key, userId, companyId, moduleId, useCache } = req.query;
        
        if (!key) {
          return res.status(400).json({
            success: false,
            message: 'Key parameter is required'
          });
        }
        
        const value = await this.getConfigWithFallback(
          key as string,
          {
            userId: userId as string | undefined,
            companyId: companyId as string | undefined,
            moduleId: moduleId as string | undefined,
            useCache: useCache !== 'false'
          }
        );
        
        res.json({ success: true, data: value });
      } catch (error) {
        this.logger.error('Error getting configuration:', error);
        res.status(500).json({ success: false, message: 'Failed to get configuration' });
      }
    });

    // GET /api/admin/config/scoped - Get a configuration value with specific scope
    router.get('/config/scoped', requireAuth, async (req: Request, res: Response) => {
      try {
        const { key, scope, userId, companyId, moduleId, useCache } = req.query;
        
        if (!key || !scope) {
          return res.status(400).json({
            success: false,
            message: 'Key and scope parameters are required'
          });
        }
        
        // Validate scope
        if (!Object.values(ConfigScope).includes(scope as ConfigScope)) {
          return res.status(400).json({
            success: false,
            message: `Invalid scope. Must be one of: ${Object.values(ConfigScope).join(', ')}`
          });
        }
        
        const value = await this.getConfig(
          key as string,
          {
            scope: scope as ConfigScope,
            userId: userId as string | undefined,
            companyId: companyId as string | undefined,
            moduleId: moduleId as string | undefined,
            useCache: useCache !== 'false'
          }
        );
        
        res.json({ success: true, data: value });
      } catch (error) {
        this.logger.error('Error getting scoped configuration:', error);
        res.status(500).json({ success: false, message: 'Failed to get configuration' });
      }
    });

    // POST /api/admin/config - Set a configuration value
    router.post('/config', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { key, value, scope, userId, companyId, moduleId } = req.body;
        
        if (!key || value === undefined || !scope) {
          return res.status(400).json({
            success: false,
            message: 'Key, value, and scope are required'
          });
        }
        
        // Validate scope
        if (!Object.values(ConfigScope).includes(scope)) {
          return res.status(400).json({
            success: false,
            message: `Invalid scope. Must be one of: ${Object.values(ConfigScope).join(', ')}`
          });
        }
        
        const config = await this.setConfig(
          key,
          value,
          {
            scope,
            userId,
            companyId,
            moduleId
          },
          req.user?.id
        );
        
        res.json({ success: true, data: config });
      } catch (error) {
        this.logger.error('Error setting configuration:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to set configuration',
          error: (error as Error).message
        });
      }
    });

    // DELETE /api/admin/config - Delete a configuration
    router.delete('/config', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { key, scope, userId, companyId, moduleId } = req.query;
        
        if (!key || !scope) {
          return res.status(400).json({
            success: false,
            message: 'Key and scope parameters are required'
          });
        }
        
        // Validate scope
        if (!Object.values(ConfigScope).includes(scope as ConfigScope)) {
          return res.status(400).json({
            success: false,
            message: `Invalid scope. Must be one of: ${Object.values(ConfigScope).join(', ')}`
          });
        }
        
        const success = await this.deleteConfig(
          key as string,
          {
            scope: scope as ConfigScope,
            userId: userId as string | undefined,
            companyId: companyId as string | undefined,
            moduleId: moduleId as string | undefined
          },
          req.user?.id
        );
        
        if (success) {
          res.json({ success: true, message: 'Configuration deleted successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Configuration not found' });
        }
      } catch (error) {
        this.logger.error('Error deleting configuration:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to delete configuration',
          error: (error as Error).message
        });
      }
    });

    // GET /api/admin/config/list - List configurations
    router.get('/config/list', requireAuth, async (req: Request, res: Response) => {
      try {
        const {
          scope,
          companyId,
          userId,
          moduleId,
          keyPrefix,
          limit,
          offset
        } = req.query;
        
        const configs = await this.listConfigurations({
          scope: scope as ConfigScope | undefined,
          companyId: companyId as string | undefined,
          userId: userId as string | undefined,
          moduleId: moduleId as string | undefined,
          keyPrefix: keyPrefix as string | undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined
        });
        
        res.json({ success: true, data: configs });
      } catch (error) {
        this.logger.error('Error listing configurations:', error);
        res.status(500).json({ success: false, message: 'Failed to list configurations' });
      }
    });

    // POST /api/admin/config/clear-cache - Clear the config cache
    router.post('/config/clear-cache', requireAdmin, async (req: Request, res: Response) => {
      try {
        this.clearCache();
        res.json({ success: true, message: 'Configuration cache cleared successfully' });
      } catch (error) {
        this.logger.error('Error clearing config cache:', error);
        res.status(500).json({ success: false, message: 'Failed to clear configuration cache' });
      }
    });

    // Mount routes
    app.use('/api/admin', router);
    this.logger.info('Configuration management routes registered successfully');
  }
}