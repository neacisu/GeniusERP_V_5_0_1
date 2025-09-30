/**
 * API Key Service for Admin Module
 * 
 * This service manages API keys for authenticating external services and applications,
 * supporting the creation, validation, rotation, and revocation of API keys.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { api_keys } from '../../../../shared/schema/admin.schema';
import { and, eq } from 'drizzle-orm';
import { Express, Request, Response, Router } from 'express';
import { AuthGuard } from '../../../common/middleware/auth-guard';
import { Logger } from '../../../common/logger';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * API key status
 */
enum ApiKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired'
}

/**
 * API Key service for the Admin module
 */
export class ApiKeyService {
  private db: PostgresJsDatabase<any>;
  private logger = new Logger('ApiKeyService');

  /**
   * Constructor for ApiKeyService
   * @param db Drizzle database instance
   */
  constructor(db: PostgresJsDatabase<any>) {
    this.db = db;
  }

  /**
   * Create a new API key
   * @param data API key data including name, expiration, and scope
   * @param createdBy ID of the user creating the key
   * @returns Created API key object with the full key (only shown once)
   */
  async createApiKey(
    data: {
      name: string;
      description?: string;
      expiresAt?: Date;
      scope?: string[];
      companyId: string;
    },
    createdBy: string
  ) {
    try {
      this.logger.info(`Creating new API key: ${data.name}`);
      
      // Generate API key components
      const id = uuidv4();
      const prefix = 'geniusapi';
      const secretKey = this.generateSecretKey();
      const displayKey = `${prefix}_${secretKey.substring(0, 16)}`;
      const hashedKey = this.hashKey(secretKey);
      
      // Insert the API key
      const [apiKey] = await this.db.insert(api_keys).values({
        id,
        name: data.name,
        description: data.description || null,
        prefix,
        key_hash: hashedKey,
        last_used_at: null,
        expires_at: data.expiresAt || null, 
        scope: data.scope || null,
        status: ApiKeyStatus.ACTIVE,
        company_id: data.companyId,
        created_by: createdBy,
        updated_by: createdBy
      }).returning();
      
      // Return the API key with the full key (only shown once)
      return {
        ...apiKey,
        full_key: `${prefix}_${secretKey}` // This is only returned once
      };
    } catch (error) {
      this.logger.error('Error creating API key:', error);
      throw error;
    }
  }

  /**
   * Validate an API key
   * @param apiKey The full API key to validate
   * @returns API key record if valid, null otherwise
   */
  async validateApiKey(apiKey: string): Promise<any | null> {
    try {
      const [prefix, secretKey] = apiKey.split('_');
      
      if (!prefix || !secretKey) {
        return null;
      }
      
      const hashedKey = this.hashKey(secretKey);
      
      // Find the API key
      const [key] = await this.db.select()
        .from(api_keys)
        .where(
          and(
            eq(api_keys.prefix, prefix),
            eq(api_keys.key_hash, hashedKey),
            eq(api_keys.status, ApiKeyStatus.ACTIVE)
          )
        );
      
      if (!key) {
        return null;
      }
      
      // Check if key is expired
      if (key.expires_at && new Date(key.expires_at) < new Date()) {
        // Update status to expired
        await this.db.update(api_keys)
          .set({
            status: ApiKeyStatus.EXPIRED,
            updated_at: new Date()
          })
          .where(eq(api_keys.id, key.id));
        
        return null;
      }
      
      // Update last used timestamp
      await this.db.update(api_keys)
        .set({
          last_used_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(api_keys.id, key.id));
      
      return key;
    } catch (error) {
      this.logger.error('Error validating API key:', error);
      return null;
    }
  }

  /**
   * Get API keys for a company
   * @param companyId Company ID
   * @returns Array of API key objects
   */
  async getApiKeysByCompany(companyId: string) {
    try {
      return await this.db.select({
        id: api_keys.id,
        name: api_keys.name,
        description: api_keys.description,
        prefix: api_keys.prefix,
        lastUsedAt: api_keys.last_used_at,
        expiresAt: api_keys.expires_at,
        scope: api_keys.scope,
        status: api_keys.status,
        createdAt: api_keys.created_at,
        createdBy: api_keys.created_by
      })
      .from(api_keys)
      .where(eq(api_keys.company_id, companyId));
    } catch (error) {
      this.logger.error(`Error getting API keys for company ${companyId}:`, error);
      throw error;
    }
  }

  /**
   * Get an API key by ID
   * @param keyId API key ID
   * @returns API key object
   */
  async getApiKeyById(keyId: string) {
    try {
      const [key] = await this.db.select({
        id: api_keys.id,
        name: api_keys.name,
        description: api_keys.description,
        prefix: api_keys.prefix,
        lastUsedAt: api_keys.last_used_at,
        expiresAt: api_keys.expires_at,
        scope: api_keys.scope,
        status: api_keys.status,
        companyId: api_keys.company_id,
        createdAt: api_keys.created_at,
        createdBy: api_keys.created_by
      })
      .from(api_keys)
      .where(eq(api_keys.id, keyId));
      
      return key;
    } catch (error) {
      this.logger.error(`Error getting API key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Update an API key
   * @param keyId API key ID
   * @param updates Fields to update (name, description, expiresAt, scope)
   * @param updatedBy ID of the user making the change
   * @returns Updated API key object
   */
  async updateApiKey(
    keyId: string,
    updates: Partial<{
      name: string;
      description: string;
      expiresAt: Date | null;
      scope: string[] | null;
    }>,
    updatedBy: string
  ) {
    try {
      const updateData: any = {
        updated_at: new Date(),
        updated_by: updatedBy
      };
      
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      
      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }
      
      if (updates.expiresAt !== undefined) {
        updateData.expires_at = updates.expiresAt;
      }
      
      if (updates.scope !== undefined) {
        updateData.scope = updates.scope;
      }
      
      const [apiKey] = await this.db.update(api_keys)
        .set(updateData)
        .where(eq(api_keys.id, keyId))
        .returning();
      
      if (!apiKey) {
        throw new Error(`API key with ID ${keyId} not found`);
      }
      
      // Log the audit event
      await AuditService.log({
        userId: updatedBy,
        companyId: apiKey.company_id,
        action: AuditAction.UPDATE,
        entity: 'api_keys',
        entityId: keyId,
        details: {
          updates: {
            ...updates,
            // Don't include the actual key in the audit log
            key: undefined
          },
        }
      });
      
      return {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        prefix: apiKey.prefix,
        lastUsedAt: apiKey.last_used_at,
        expiresAt: apiKey.expires_at,
        scope: apiKey.scope,
        status: apiKey.status,
        companyId: apiKey.company_id,
        createdAt: apiKey.created_at,
        createdBy: apiKey.created_by
      };
    } catch (error) {
      this.logger.error(`Error updating API key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Rotate an API key (generate a new secret but keep the same ID and metadata)
   * @param keyId API key ID
   * @param updatedBy ID of the user making the change
   * @returns Updated API key object with the new full key (only shown once)
   */
  async rotateApiKey(keyId: string, updatedBy: string) {
    try {
      // Get the existing key
      const [existingKey] = await this.db.select()
        .from(api_keys)
        .where(eq(api_keys.id, keyId));
      
      if (!existingKey) {
        throw new Error(`API key with ID ${keyId} not found`);
      }
      
      // Generate a new secret key
      const secretKey = this.generateSecretKey();
      const hashedKey = this.hashKey(secretKey);
      
      // Update the API key
      const [apiKey] = await this.db.update(api_keys)
        .set({
          key_hash: hashedKey,
          updated_at: new Date(),
          updated_by: updatedBy
        })
        .where(eq(api_keys.id, keyId))
        .returning();
      
      // Log the audit event
      await AuditService.log({
        userId: updatedBy,
        companyId: apiKey.company_id,
        action: AuditAction.UPDATE,
        entity: 'api_keys',
        entityId: keyId,
        details: {
          event: 'api_key_rotation'
        }
      });
      
      // Return the API key with the full key (only shown once)
      return {
        ...apiKey,
        full_key: `${apiKey.prefix}_${secretKey}` // This is only returned once
      };
    } catch (error) {
      this.logger.error(`Error rotating API key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Revoke an API key
   * @param keyId API key ID
   * @param updatedBy ID of the user making the change
   * @returns Boolean indicating success
   */
  async revokeApiKey(keyId: string, updatedBy: string) {
    try {
      // Get the existing key for audit purposes
      const [existingKey] = await this.db.select()
        .from(api_keys)
        .where(eq(api_keys.id, keyId));
      
      if (!existingKey) {
        throw new Error(`API key with ID ${keyId} not found`);
      }
      
      // Update API key status to revoked
      await this.db.update(api_keys)
        .set({
          status: ApiKeyStatus.REVOKED,
          updated_at: new Date(),
          updated_by: updatedBy
        })
        .where(eq(api_keys.id, keyId));
      
      // Log the audit event
      await AuditService.log({
        userId: updatedBy,
        companyId: existingKey.company_id,
        action: AuditAction.UPDATE,
        entity: 'api_keys',
        entityId: keyId,
        details: {
          event: 'api_key_revocation'
        }
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Error revoking API key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a cryptographically secure random key
   * @returns Random key string
   */
  private generateSecretKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash an API key for storage
   * @param key The key to hash
   * @returns Hashed key
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Register API routes for API key management
   * @param app Express application
   */
  registerRoutes(app: Express): void {
    this.logger.info('Registering API key management routes...');
    const router = Router();

    // Authentication middleware
    const requireAuth = AuthGuard.requireAuth();
    const requireAdmin = AuthGuard.requireRoles(['admin']);
    
    // GET /api/admin/api-keys/:companyId - Get API keys for a company
    router.get('/api-keys/:companyId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId } = req.params;
        
        const apiKeys = await this.getApiKeysByCompany(companyId);
        
        res.json({ success: true, data: apiKeys });
      } catch (error) {
        this.logger.error('Error fetching API keys:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch API keys' });
      }
    });

    // GET /api/admin/api-keys/detail/:keyId - Get API key details
    router.get('/api-keys/detail/:keyId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { keyId } = req.params;
        
        const apiKey = await this.getApiKeyById(keyId);
        
        if (!apiKey) {
          return res.status(404).json({ success: false, message: 'API key not found' });
        }
        
        res.json({ success: true, data: apiKey });
      } catch (error) {
        this.logger.error('Error fetching API key details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch API key details' });
      }
    });

    // POST /api/admin/api-keys - Create a new API key
    router.post('/api-keys', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { name, description, expiresAt, scope, companyId } = req.body;
        
        if (!name || !companyId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields (name, companyId)'
          });
        }
        
        const parsedExpiresAt = expiresAt ? new Date(expiresAt) : undefined;
        
        const apiKey = await this.createApiKey(
          {
            name,
            description,
            expiresAt: parsedExpiresAt,
            scope,
            companyId
          },
          req.user?.id
        );
        
        res.status(201).json({ success: true, data: apiKey });
      } catch (error) {
        this.logger.error('Error creating API key:', error);
        res.status(500).json({ success: false, message: 'Failed to create API key' });
      }
    });

    // PUT /api/admin/api-keys/:keyId - Update an API key
    router.put('/api-keys/:keyId', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { keyId } = req.params;
        const { name, description, expiresAt, scope } = req.body;
        
        // Require at least one field to update
        if (!name && description === undefined && expiresAt === undefined && scope === undefined) {
          return res.status(400).json({
            success: false,
            message: 'At least one field to update is required'
          });
        }
        
        const parsedExpiresAt = expiresAt !== undefined
          ? (expiresAt ? new Date(expiresAt) : null)
          : undefined;
        
        const apiKey = await this.updateApiKey(
          keyId,
          {
            name,
            description,
            expiresAt: parsedExpiresAt,
            scope: scope === undefined ? undefined : (scope || null)
          },
          req.user?.id
        );
        
        res.json({ success: true, data: apiKey });
      } catch (error) {
        this.logger.error('Error updating API key:', error);
        res.status(500).json({ success: false, message: 'Failed to update API key' });
      }
    });

    // POST /api/admin/api-keys/:keyId/rotate - Rotate an API key
    router.post('/api-keys/:keyId/rotate', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { keyId } = req.params;
        
        const apiKey = await this.rotateApiKey(keyId, req.user?.id);
        
        res.json({
          success: true,
          data: apiKey,
          message: 'API key rotated successfully. Please save the new key as it will not be shown again.'
        });
      } catch (error) {
        this.logger.error('Error rotating API key:', error);
        res.status(500).json({ success: false, message: 'Failed to rotate API key' });
      }
    });

    // POST /api/admin/api-keys/:keyId/revoke - Revoke an API key
    router.post('/api-keys/:keyId/revoke', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { keyId } = req.params;
        
        await this.revokeApiKey(keyId, req.user?.id);
        
        res.json({ success: true, message: 'API key revoked successfully' });
      } catch (error) {
        this.logger.error('Error revoking API key:', error);
        res.status(500).json({ success: false, message: 'Failed to revoke API key' });
      }
    });

    // Mount routes
    app.use('/api/admin', router);
    this.logger.info('API key management routes registered successfully');
  }
}