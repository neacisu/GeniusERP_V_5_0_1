/**
 * Campaign Service
 * 
 * This service provides functions to manage marketing campaigns, including CRUD operations,
 * campaign scheduling, and execution with integration to the Communications module.
 */

import { eq, and, desc, sql, like, not, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../common/logger';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { CommsModule } from '../../comms/comms.module';
import { 
  campaigns, 
  campaignMessages, 
  Campaign, 
  CampaignInsert,
  CampaignType,
  CampaignStatus,
  AudienceType
} from '../../../../shared/schema/marketing.schema';

/**
 * Service for managing marketing campaigns
 */
export class CampaignService {
  private _logger: Logger;
  private drizzle: DrizzleService;
  
  constructor() {
    this._logger = new Logger('CampaignService');
    this.drizzle = new DrizzleService();
  }
  
  /**
   * Create a new marketing campaign
   * @param campaignData Campaign data to insert
   * @param userId ID of the user creating the campaign
   * @returns The created campaign
   */
  async createCampaign(campaignData: CampaignInsert, userId: string): Promise<Campaign> {
    this._logger.info(`Creating new campaign: ${campaignData.name}`);
    
    try {
      // Generate a new UUID if not provided
      const id = uuidv4();
      
      // Set created and updated by fields
      const nowTimestamp = new Date();
      
      const result = await this.drizzle.insert(campaigns).values({
        ...campaignData,
        id,
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
        createdBy: userId,
        updatedBy: userId
      }).returning();
      
      if (!result || result.length === 0) {
        throw new Error('Failed to create campaign');
      }
      
      return result[0];
    } catch (error) {
      this._logger.error('Error creating campaign', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Get a campaign by ID
   * @param id Campaign ID
   * @param companyId Company ID
   * @returns The campaign or null if not found
   */
  async getCampaignById(id: string, companyId: string): Promise<Campaign | null> {
    this._logger.info(`Getting campaign by ID: ${id}`);
    
    try {
      const result = await this.drizzle.select()
        .from(campaigns)
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.companyId, companyId)
        ));
      
      if (!result || result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      this._logger.error(`Error getting campaign with ID ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Update an existing campaign
   * @param id Campaign ID
   * @param companyId Company ID
   * @param updateData The campaign data to update
   * @param userId The ID of the user making the update
   * @returns The updated campaign
   */
  async updateCampaign(
    id: string, 
    companyId: string, 
    updateData: Partial<CampaignInsert>,
    userId: string
  ): Promise<Campaign | null> {
    this._logger.info(`Updating campaign: ${id}`);
    
    try {
      // Check if campaign exists
      const existing = await this.getCampaignById(id, companyId);
      
      if (!existing) {
        this._logger.warn(`Campaign with ID ${id} not found`);
        return null;
      }
      
      // Update the campaign
      const result = await this.drizzle.update(campaigns)
        .set({
          ...updateData,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.companyId, companyId)
        ))
        .returning();
      
      if (!result || result.length === 0) {
        throw new Error('Failed to update campaign');
      }
      
      return result[0];
    } catch (error) {
      this._logger.error(`Error updating campaign with ID ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Delete a campaign
   * @param id Campaign ID
   * @param companyId Company ID
   * @returns True if successfully deleted, false otherwise
   */
  async deleteCampaign(id: string, companyId: string): Promise<boolean> {
    this._logger.info(`Deleting campaign: ${id}`);
    
    try {
      // Check if campaign exists
      const existing = await this.getCampaignById(id, companyId);
      
      if (!existing) {
        this._logger.warn(`Campaign with ID ${id} not found`);
        return false;
      }
      
      // Delete the campaign (cascade will handle related records)
      const result = await this.drizzle.delete(campaigns)
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.companyId, companyId)
        ))
        .returning({ id: campaigns.id });
      
      return result.length > 0;
    } catch (error) {
      this._logger.error(`Error deleting campaign with ID ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * List campaigns with filtering and pagination
   * @param companyId Company ID
   * @param filters Optional filters for the campaigns
   * @param page Page number for pagination (1-based)
   * @param pageSize Number of items per page
   * @returns List of campaigns and total count
   */
  async listCampaigns(
    companyId: string,
    filters: {
      status?: CampaignStatus;
      type?: CampaignType;
      search?: string;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ campaigns: Campaign[]; total: number }> {
    this._logger.info(`Listing campaigns for company: ${companyId}`);
    
    try {
      const offset = (page - 1) * pageSize;
      
      // Build the where clause based on filters
      let whereClause = eq(campaigns.companyId, companyId);
      
      if (filters.status) {
        whereClause = and(whereClause, eq(campaigns.status, filters.status));
      }
      
      if (filters.type) {
        whereClause = and(whereClause, eq(campaigns.type, filters.type));
      }
      
      if (filters.search) {
        whereClause = and(whereClause, like(campaigns.name, `%${filters.search}%`));
      }
      
      // Get the total count
      const countResult = await this.drizzle.select({ count: sql<number>`count(*)` })
        .from(campaigns)
        .where(whereClause);
      
      const total = countResult[0]?.count || 0;
      
      // Get the campaigns for the requested page
      const result = await this.drizzle.select()
        .from(campaigns)
        .where(whereClause)
        .orderBy(desc(campaigns.createdAt))
        .limit(pageSize)
        .offset(offset);
      
      return { campaigns: result, total };
    } catch (error) {
      this._logger.error('Error listing campaigns', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Schedule a campaign for execution
   * @param id Campaign ID
   * @param companyId Company ID
   * @param scheduledAt When to schedule the campaign
   * @param userId ID of the user scheduling the campaign
   * @returns The updated campaign
   */
  async scheduleCampaign(
    id: string,
    companyId: string,
    scheduledAt: Date,
    userId: string
  ): Promise<Campaign | null> {
    this._logger.info(`Scheduling campaign ${id} for execution at ${scheduledAt.toISOString()}`);
    
    try {
      // Update the campaign status and scheduled time
      const updatedCampaign = await this.updateCampaign(
        id,
        companyId,
        {
          status: CampaignStatus.SCHEDULED,
          scheduledAt
        },
        userId
      );
      
      return updatedCampaign;
    } catch (error) {
      this._logger.error(`Error scheduling campaign ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Start a campaign immediately
   * @param id Campaign ID
   * @param companyId Company ID
   * @param userId ID of the user starting the campaign
   * @returns The updated campaign
   */
  async startCampaign(
    id: string,
    companyId: string,
    userId: string
  ): Promise<Campaign | null> {
    this._logger.info(`Starting campaign ${id} immediately`);
    
    try {
      // Update the campaign status and start time
      const updatedCampaign = await this.updateCampaign(
        id,
        companyId,
        {
          status: CampaignStatus.ACTIVE,
          startedAt: new Date()
        },
        userId
      );
      
      // TODO: Implement actual campaign execution logic
      // This would involve integrating with the Communications module
      // to send messages through the appropriate channels
      
      return updatedCampaign;
    } catch (error) {
      this._logger.error(`Error starting campaign ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Pause an active campaign
   * @param id Campaign ID
   * @param companyId Company ID
   * @param userId ID of the user pausing the campaign
   * @returns The updated campaign
   */
  async pauseCampaign(
    id: string,
    companyId: string,
    userId: string
  ): Promise<Campaign | null> {
    this._logger.info(`Pausing campaign ${id}`);
    
    try {
      // Update the campaign status
      const updatedCampaign = await this.updateCampaign(
        id,
        companyId,
        {
          status: CampaignStatus.PAUSED
        },
        userId
      );
      
      // TODO: Implement logic to pause ongoing campaign activities
      
      return updatedCampaign;
    } catch (error) {
      this._logger.error(`Error pausing campaign ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Resume a paused campaign
   * @param id Campaign ID
   * @param companyId Company ID
   * @param userId ID of the user resuming the campaign
   * @returns The updated campaign
   */
  async resumeCampaign(
    id: string,
    companyId: string,
    userId: string
  ): Promise<Campaign | null> {
    this._logger.info(`Resuming campaign ${id}`);
    
    try {
      // Update the campaign status
      const updatedCampaign = await this.updateCampaign(
        id,
        companyId,
        {
          status: CampaignStatus.ACTIVE
        },
        userId
      );
      
      // TODO: Implement logic to resume campaign activities
      
      return updatedCampaign;
    } catch (error) {
      this._logger.error(`Error resuming campaign ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Mark a campaign as completed
   * @param id Campaign ID
   * @param companyId Company ID
   * @param userId ID of the user completing the campaign
   * @returns The updated campaign
   */
  async completeCampaign(
    id: string,
    companyId: string,
    userId: string
  ): Promise<Campaign | null> {
    this._logger.info(`Completing campaign ${id}`);
    
    try {
      // Update the campaign status and completion time
      const updatedCampaign = await this.updateCampaign(
        id,
        companyId,
        {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date()
        },
        userId
      );
      
      return updatedCampaign;
    } catch (error) {
      this._logger.error(`Error completing campaign ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Get campaign performance metrics
   * @param id Campaign ID
   * @param companyId Company ID
   * @returns Performance metrics for the campaign
   */
  async getCampaignPerformance(
    id: string,
    companyId: string
  ): Promise<{
    messagesSent: number;
    messagesDelivered: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    responseRate: number;
  }> {
    this._logger.info(`Getting performance metrics for campaign ${id}`);
    
    try {
      // Get the campaign
      const campaign = await this.getCampaignById(id, companyId);
      
      if (!campaign) {
        throw new Error(`Campaign with ID ${id} not found`);
      }
      
      // Calculate metrics based on stored counts
      const messagesSent = campaign.sentCount || 0;
      const messagesDelivered = campaign.deliveredCount || 0;
      const openCount = campaign.openCount || 0;
      const clickCount = campaign.clickCount || 0;
      const bounceCount = campaign.bounceCount || 0;
      const responseCount = campaign.responseCount || 0;
      
      // Calculate rates (avoid division by zero)
      const openRate = messagesSent > 0 ? openCount / messagesSent : 0;
      const clickRate = messagesSent > 0 ? clickCount / messagesSent : 0;
      const bounceRate = messagesSent > 0 ? bounceCount / messagesSent : 0;
      const responseRate = messagesSent > 0 ? responseCount / messagesSent : 0;
      
      return {
        messagesSent,
        messagesDelivered,
        openRate,
        clickRate,
        bounceRate,
        responseRate
      };
    } catch (error) {
      this._logger.error(`Error getting performance metrics for campaign ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Link a message to a campaign
   * @param campaignId Campaign ID
   * @param messageId Message ID from the Communications module
   * @param recipientId Recipient ID (contact)
   * @param companyId Company ID
   * @param status Message status
   * @returns The created campaign message link
   */
  async linkMessageToCampaign(
    campaignId: string,
    messageId: string,
    recipientId: string,
    companyId: string,
    status: string = 'sent',
    variantId?: string
  ): Promise<any> {
    this._logger.info(`Linking message ${messageId} to campaign ${campaignId}`);
    
    try {
      // Create a record in the campaign messages table
      const result = await this.drizzle.insert(campaignMessages).values({
        id: uuidv4(),
        campaignId,
        messageId,
        recipientId,
        companyId,
        status,
        sentAt: new Date(),
        variantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Update the campaign sent count
      await this.drizzle.update(campaigns)
        .set({
          sentCount: sql`${campaigns.sentCount} + 1`,
          updatedAt: new Date()
        })
        .where(and(
          eq(campaigns.id, campaignId),
          eq(campaigns.companyId, companyId)
        ));
      
      return result[0];
    } catch (error) {
      this._logger.error(`Error linking message ${messageId} to campaign ${campaignId}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Update campaign message status
   * @param messageId Message ID
   * @param campaignId Campaign ID
   * @param status New status
   * @param details Additional details (like bounce reason)
   * @returns True if successfully updated
   */
  async updateCampaignMessageStatus(
    messageId: string,
    campaignId: string,
    status: string,
    details: { bounceReason?: string } = {}
  ): Promise<boolean> {
    this._logger.info(`Updating status for message ${messageId} in campaign ${campaignId} to ${status}`);
    
    try {
      // Prepare the update data
      const updateData: any = {
        status,
        updatedAt: new Date()
      };
      
      // Add timestamp for specific statuses
      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      } else if (status === 'opened') {
        updateData.openedAt = new Date();
      } else if (status === 'clicked') {
        updateData.clickedAt = new Date();
      } else if (status === 'bounced') {
        updateData.bouncedAt = new Date();
        if (details.bounceReason) {
          updateData.bounceReason = details.bounceReason;
        }
      }
      
      // Update the campaign message
      const result = await this.drizzle.update(campaignMessages)
        .set(updateData)
        .where(and(
          eq(campaignMessages.messageId, messageId),
          eq(campaignMessages.campaignId, campaignId)
        ))
        .returning({ id: campaignMessages.id });
      
      // Update campaign level counts based on the status
      if (status === 'delivered') {
        await this.incrementCampaignField(campaignId, 'deliveredCount');
      } else if (status === 'opened') {
        await this.incrementCampaignField(campaignId, 'openCount');
      } else if (status === 'clicked') {
        await this.incrementCampaignField(campaignId, 'clickCount');
      } else if (status === 'bounced') {
        await this.incrementCampaignField(campaignId, 'bounceCount');
      } else if (status === 'responded') {
        await this.incrementCampaignField(campaignId, 'responseCount');
      }
      
      return result.length > 0;
    } catch (error) {
      this._logger.error(`Error updating status for message ${messageId}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Increment a numeric field in the campaign table
   * @param campaignId Campaign ID
   * @param field The field to increment
   * @returns True if successfully updated
   */
  private async incrementCampaignField(campaignId: string, field: string): Promise<boolean> {
    try {
      // Dynamic update of the specified field
      const result = await this.drizzle.update(campaigns)
        .set({
          [field]: sql`${campaigns[field as keyof typeof campaigns]} + 1`,
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaignId))
        .returning({ id: campaigns.id });
      
      return result.length > 0;
    } catch (error) {
      this._logger.error(`Error incrementing ${field} for campaign ${campaignId}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}