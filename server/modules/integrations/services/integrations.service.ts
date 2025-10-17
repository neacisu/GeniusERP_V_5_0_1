/**
 * Integrations Service
 * 
 * Service for managing external integrations and API connections.
 */

import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import { DrizzleService } from '../../../common/drizzle';
import { 
  integrations, 
  Integration, 
  IntegrationProvider, 
  IntegrationStatus,
  UpdateIntegration 
} from '../schema/integrations.schema';
import { AuditService } from '../../audit/services/audit.service';
import { Logger } from '../../../common/logger';

// For audit logging
const RESOURCE_TYPE = 'integration';
const logger = new Logger('IntegrationsService');

/**
 * Service for managing external integrations
 */
export class IntegrationsService {
  private drizzle: DrizzleService;
  private auditService: AuditService;

  constructor() {
    this.drizzle = new DrizzleService();
    this.auditService = new AuditService();
    logger.info('IntegrationsService initialized');
  }

  /**
   * Create a new integration
   * @param provider Integration provider
   * @param companyId Company ID
   * @param config Integration configuration
   * @param userId User ID creating the integration
   * @param franchiseId Optional franchise ID
   * @param name Optional integration name
   * @param description Optional integration description
   * @param webhookUrl Optional webhook URL
   * @param webhookSecret Optional webhook secret
   */
  async createIntegration(
    provider: IntegrationProvider,
    companyId: string,
    config: Record<string, any> = {},
    userId: string,
    franchiseId?: string,
    name?: string,
    description?: string,
    webhookUrl?: string,
    webhookSecret?: string
  ): Promise<Integration> {
    try {
      // Create new integration
      const id = uuidv4();
      const now = new Date();
      
      const [integration] = await this.drizzle.insert(integrations).values({
        id,
        companyId,
        provider,
        name: name || null,
        description: description || null,
        franchiseId: franchiseId || null,
        config,
        status: IntegrationStatus.PENDING,
        isConnected: false,
        webhookUrl: webhookUrl || null,
        webhookSecret: webhookSecret || null,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId
      }).returning();
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'create',
        resourceType: RESOURCE_TYPE,
        resourceId: id,
        details: {
          provider,
          franchiseId
        }
      });
      
      return integration;
    } catch (error) {
      console.error('[IntegrationsService] Create integration error:', error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to create ${provider} integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get integration by ID
   * @param id Integration ID
   * @param companyId Company ID
   */
  async getIntegration(id: string, companyId: string): Promise<Integration | null> {
    try {
      const [integration] = await this.drizzle.select()
        .from(integrations)
        .where(
          and(
            eq(integrations.id, id),
            eq(integrations.companyId, companyId)
          )
        );
      
      return integration || null;
    } catch (error) {
      console.error('[IntegrationsService] Get integration error:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Get integration by provider
   * @param provider Integration provider
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID
   */
  async getIntegrationByProvider(
    provider: IntegrationProvider,
    companyId: string,
    franchiseId?: string
  ): Promise<Integration | null> {
    try {
      let query = this.drizzle.select()
        .from(integrations)
        .where(
          and(
            eq(integrations.provider, provider),
            eq(integrations.companyId, companyId)
          )
        );
      
      if (franchiseId) {
        query = query.where(eq(integrations.franchiseId, franchiseId));
      } else {
        query = query.where(eq(integrations.franchiseId, null));
      }
      
      const [integration] = await query;
      
      return integration || null;
    } catch (error) {
      console.error('[IntegrationsService] Get integration by provider error:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * List integrations for a company
   * @param companyId Company ID
   * @param franchiseId Optional franchise ID to filter by
   */
  async listIntegrations(companyId: string, franchiseId?: string): Promise<Integration[]> {
    try {
      let query = this.drizzle.select()
        .from(integrations)
        .where(eq(integrations.companyId, companyId))
        .orderBy(desc(integrations.updatedAt));
      
      if (franchiseId) {
        query = query.where(eq(integrations.franchiseId, franchiseId));
      }
      
      const integrationsList = await query;
      
      return integrationsList;
    } catch (error) {
      console.error('[IntegrationsService] List integrations error:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Update integration
   * @param id Integration ID
   * @param companyId Company ID
   * @param updates Fields to update
   * @param userId User ID performing the update
   */
  async updateIntegration(
    id: string,
    companyId: string,
    updates: UpdateIntegration,
    userId: string
  ): Promise<Integration | null> {
    try {
      // Don't allow updating certain fields
      const {
        id: _id,
        companyId: _companyId,
        createdAt: _createdAt,
        createdBy: _createdBy,
        ...validUpdates
      } = updates;
      
      // Add audit fields
      const updateData = {
        ...validUpdates,
        updatedAt: new Date(),
        updatedBy: userId
      };
      
      // Update integration
      const [updatedIntegration] = await this.drizzle.update(integrations)
        .set(updateData)
        .where(
          and(
            eq(integrations.id, id),
            eq(integrations.companyId, companyId)
          )
        )
        .returning();
      
      if (!updatedIntegration) {
        return null;
      }
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'update',
        resourceType: RESOURCE_TYPE,
        resourceId: id,
        details: {
          updates: validUpdates
        }
      });
      
      return updatedIntegration;
    } catch (error) {
      console.error('[IntegrationsService] Update integration error:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Update integration status
   * @param id Integration ID
   * @param companyId Company ID
   * @param status New status
   * @param userId User ID updating the status
   */
  async updateIntegrationStatus(
    id: string,
    companyId: string,
    status: IntegrationStatus,
    userId: string
  ): Promise<boolean> {
    try {
      // Update status
      const [updatedIntegration] = await this.drizzle.update(integrations)
        .set({
          status,
          isConnected: status === IntegrationStatus.ACTIVE,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(
          and(
            eq(integrations.id, id),
            eq(integrations.companyId, companyId)
          )
        )
        .returning();
      
      if (!updatedIntegration) {
        return false;
      }
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'update',
        resourceType: RESOURCE_TYPE,
        resourceId: id,
        details: {
          status,
          isConnected: status === IntegrationStatus.ACTIVE
        }
      });
      
      return true;
    } catch (error) {
      console.error('[IntegrationsService] Update integration status error:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Update last synced timestamp
   * @param id Integration ID
   * @param companyId Company ID
   * @param userId User ID who initiated the sync
   */
  async updateLastSyncedAt(
    id: string,
    companyId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Update last synced timestamp
      const now = new Date();
      const [updatedIntegration] = await this.drizzle.update(integrations)
        .set({
          lastSyncedAt: now,
          updatedAt: now,
          updatedBy: userId
        })
        .where(
          and(
            eq(integrations.id, id),
            eq(integrations.companyId, companyId)
          )
        )
        .returning();
      
      return !!updatedIntegration;
    } catch (error) {
      console.error('[IntegrationsService] Update last sync error:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Delete integration (soft delete)
   * @param id Integration ID
   * @param companyId Company ID
   * @param userId User ID performing the deletion
   */
  async deleteIntegration(id: string, companyId: string, userId: string): Promise<boolean> {
    try {
      // Get integration first to verify it exists
      const integration = await this.getIntegration(id, companyId);
      
      if (!integration) {
        return false;
      }
      
      // Delete integration (hard delete for now, can be changed to soft delete)
      await this.drizzle.delete(integrations)
        .where(
          and(
            eq(integrations.id, id),
            eq(integrations.companyId, companyId)
          )
        );
      
      // Audit log
      await AuditService.createAuditLog({
        userId,
        companyId,
        action: 'delete',
        resourceType: RESOURCE_TYPE,
        resourceId: id,
        details: {
          provider: integration.provider,
          franchiseId: integration.franchiseId
        }
      });
      
      return true;
    } catch (error) {
      console.error('[IntegrationsService] Delete integration error:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
}