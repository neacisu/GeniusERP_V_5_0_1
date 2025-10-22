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
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { Logger } from "@common/logger";
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

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
      service: string;
      expiresAt?: Date;
      companyId: string;
    },
    createdBy: string
  ) {
    try {
      this.logger.info(`Creating new API key: ${data.name}`);
      
      // Generate API key components
      const id = uuidv4();
      const secretKey = this.generateSecretKey();
      const keyIdentifier = `****${secretKey.substring(secretKey.length - 8)}`; // Masked identifier
      
      // Insert the API key
      const [apiKey] = await this.db.insert(api_keys).values({
        id,
        name: data.name,
        service: data.service,
        key_identifier: keyIdentifier,
        is_active: true,
        last_used_at: null,
        expires_at: data.expiresAt || null,
        company_id: data.companyId,
        created_by: createdBy,
        last_rotated_at: null
      }).returning();
      
      // Return the API key with the full key (only shown once)
      return {
        ...apiKey,
        full_key: secretKey // This is only returned once
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
      // Create masked identifier for comparison
      const keyIdentifier = `****${apiKey.substring(apiKey.length - 8)}`;
      
      // Find the API key by key_identifier
      const [key] = await this.db.select()
        .from(api_keys)
        .where(
          and(
            eq(api_keys.key_identifier, keyIdentifier),
            eq(api_keys.is_active, true)
          )
        );
      
      if (!key) {
        return null;
      }
      
      // Check if key is expired
      if (key.expires_at && new Date(key.expires_at) < new Date()) {
        // Update status to inactive (expired)
        await this.db.update(api_keys)
          .set({
            is_active: false
          })
          .where(eq(api_keys.id, key.id));
        
        return null;
      }
      
      // Update last used timestamp
      await this.db.update(api_keys)
        .set({
          last_used_at: new Date()
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
        service: api_keys.service,
        keyIdentifier: api_keys.key_identifier,
        isActive: api_keys.is_active,
        lastUsedAt: api_keys.last_used_at,
        expiresAt: api_keys.expires_at,
        createdAt: api_keys.created_at,
        createdBy: api_keys.created_by,
        lastRotatedAt: api_keys.last_rotated_at
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
        service: api_keys.service,
        keyIdentifier: api_keys.key_identifier,
        isActive: api_keys.is_active,
        lastUsedAt: api_keys.last_used_at,
        expiresAt: api_keys.expires_at,
        companyId: api_keys.company_id,
        createdAt: api_keys.created_at,
        createdBy: api_keys.created_by,
        lastRotatedAt: api_keys.last_rotated_at
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
   * @param updates Fields to update (name, service, expiresAt)
   * @param updatedBy ID of the user making the change
   * @returns Updated API key object
   */
  async updateApiKey(
    keyId: string,
    updates: Partial<{
      name: string;
      service: string;
      expiresAt: Date | null;
    }>,
    updatedBy: string
  ) {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      
      if (updates.service !== undefined) {
        updateData.service = updates.service;
      }
      
      if (updates.expiresAt !== undefined) {
        updateData.expires_at = updates.expiresAt;
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
        service: apiKey.service,
        keyIdentifier: apiKey.key_identifier,
        isActive: apiKey.is_active,
        lastUsedAt: apiKey.last_used_at,
        expiresAt: apiKey.expires_at,
        companyId: apiKey.company_id,
        createdAt: apiKey.created_at,
        createdBy: apiKey.created_by,
        lastRotatedAt: apiKey.last_rotated_at
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
      const keyIdentifier = `****${secretKey.substring(secretKey.length - 8)}`;
      
      // Update the API key
      const [apiKey] = await this.db.update(api_keys)
        .set({
          key_identifier: keyIdentifier,
          last_rotated_at: new Date()
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
        full_key: secretKey // This is only returned once
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
      
      // Update API key status to inactive (revoked)
      await this.db.update(api_keys)
        .set({
          is_active: false
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
   * Register API routes for API key management
   * @param app Express application
   */
  registerRoutes(app: Express): void {
    this.logger.info('Registering API key management routes...');
    const router = Router();

    // Authentication middleware  
    const requireAuth = AuthGuard.protect(JwtAuthMode.REQUIRED);
    const requireAdmin = AuthGuard.roleGuard(['admin']);
    
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
        const { name, service, expiresAt, companyId } = req.body;
        
        if (!name || !service || !companyId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields (name, service, companyId)'
          });
        }
        
        const parsedExpiresAt = expiresAt ? new Date(expiresAt) : undefined;
        
        const apiKey = await this.createApiKey(
          {
            name,
            service,
            expiresAt: parsedExpiresAt,
            companyId
          },
          req.user?.id || 'system'
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
        const { name, service, expiresAt } = req.body;
        
        // Require at least one field to update
        if (!name && !service && expiresAt === undefined) {
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
            service,
            expiresAt: parsedExpiresAt
          },
          req.user?.id || 'system'
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
        
        const apiKey = await this.rotateApiKey(keyId, req.user?.id || 'system');
        
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
        
        await this.revokeApiKey(keyId, req.user?.id || 'system');
        
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