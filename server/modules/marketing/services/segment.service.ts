/**
 * Segment Service
 * 
 * This service provides functions to manage customer segments for targeted
 * marketing campaigns based on specified criteria.
 */

import { eq, and, desc, sql, like, not, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../common/logger';
import { DrizzleService, getDrizzle } from '../../../common/drizzle';
import { 
  campaignSegments, 
  CampaignSegment, 
  CampaignSegmentInsert
} from '../../../../shared/schema/marketing.schema';

/**
 * Service for managing marketing campaign segments
 */
export class SegmentService {
  private _logger: Logger;
  private drizzle: DrizzleService;
  
  constructor() {
    this._logger = new Logger('SegmentService');
    this.drizzle = new DrizzleService();
  }
  
  /**
   * Create a new customer segment
   * @param segmentData Segment data to insert
   * @param userId ID of the user creating the segment
   * @returns The created segment
   */
  async createSegment(segmentData: CampaignSegmentInsert, userId: string): Promise<CampaignSegment> {
    this._logger.info(`Creating new segment: ${segmentData.name}`);
    
    try {
      // Generate a new UUID if not provided
      const id = uuidv4();
      
      // Set created and updated by fields
      const nowTimestamp = new Date();
      
      const result = await this.drizzle.insert(campaignSegments).values({
        ...segmentData,
        id,
        createdAt: nowTimestamp,
        updatedAt: nowTimestamp,
        createdBy: userId,
        updatedBy: userId
      }).returning();
      
      if (!result || result.length === 0) {
        throw new Error('Failed to create segment');
      }
      
      return result[0];
    } catch (error) {
      this._logger.error('Error creating segment', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Get a segment by ID
   * @param id Segment ID
   * @param companyId Company ID
   * @returns The segment or null if not found
   */
  async getSegmentById(id: string, companyId: string): Promise<CampaignSegment | null> {
    this._logger.info(`Getting segment by ID: ${id}`);
    
    try {
      const result = await this.drizzle.select()
        .from(campaignSegments)
        .where(and(
          eq(campaignSegments.id, id),
          eq(campaignSegments.companyId, companyId)
        ));
      
      if (!result || result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      this._logger.error(`Error getting segment with ID ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Update an existing segment
   * @param id Segment ID
   * @param companyId Company ID
   * @param updateData The segment data to update
   * @param userId The ID of the user making the update
   * @returns The updated segment
   */
  async updateSegment(
    id: string, 
    companyId: string, 
    updateData: Partial<CampaignSegmentInsert>,
    userId: string
  ): Promise<CampaignSegment | null> {
    this._logger.info(`Updating segment: ${id}`);
    
    try {
      // Check if segment exists
      const existing = await this.getSegmentById(id, companyId);
      
      if (!existing) {
        this._logger.warn(`Segment with ID ${id} not found`);
        return null;
      }
      
      // Update the segment
      const result = await this.drizzle.update(campaignSegments)
        .set({
          ...updateData,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(campaignSegments.id, id),
          eq(campaignSegments.companyId, companyId)
        ))
        .returning();
      
      if (!result || result.length === 0) {
        throw new Error('Failed to update segment');
      }
      
      return result[0];
    } catch (error) {
      this._logger.error(`Error updating segment with ID ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Delete a segment
   * @param id Segment ID
   * @param companyId Company ID
   * @returns True if successfully deleted, false otherwise
   */
  async deleteSegment(id: string, companyId: string): Promise<boolean> {
    this._logger.info(`Deleting segment: ${id}`);
    
    try {
      // Check if segment exists
      const existing = await this.getSegmentById(id, companyId);
      
      if (!existing) {
        this._logger.warn(`Segment with ID ${id} not found`);
        return false;
      }
      
      // Delete the segment
      const result = await this.drizzle.delete(campaignSegments)
        .where(and(
          eq(campaignSegments.id, id),
          eq(campaignSegments.companyId, companyId)
        ))
        .returning({ id: campaignSegments.id });
      
      return result.length > 0;
    } catch (error) {
      this._logger.error(`Error deleting segment with ID ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * List segments with filtering and pagination
   * @param companyId Company ID
   * @param filters Optional filters for the segments
   * @param page Page number for pagination (1-based)
   * @param pageSize Number of items per page
   * @returns List of segments and total count
   */
  async listSegments(
    companyId: string,
    filters: {
      isActive?: boolean;
      search?: string;
    } = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ segments: CampaignSegment[]; total: number }> {
    this._logger.info(`Listing segments for company: ${companyId}`);
    
    try {
      const offset = (page - 1) * pageSize;
      
      // Build the where clause based on filters
      let whereClause = eq(campaignSegments.companyId, companyId);
      
      if (filters.isActive !== undefined) {
        whereClause = and(whereClause, eq(campaignSegments.isActive, filters.isActive));
      }
      
      if (filters.search) {
        whereClause = and(whereClause, like(campaignSegments.name, `%${filters.search}%`));
      }
      
      // Get the total count
      const countResult = await this.drizzle.select({ count: sql<number>`count(*)` })
        .from(campaignSegments)
        .where(whereClause);
      
      const total = countResult[0]?.count || 0;
      
      // Get the segments for the requested page
      const result = await this.drizzle.select()
        .from(campaignSegments)
        .where(whereClause)
        .orderBy(desc(campaignSegments.createdAt))
        .limit(pageSize)
        .offset(offset);
      
      return { segments: result, total };
    } catch (error) {
      this._logger.error('Error listing segments', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Refresh estimated reach for a segment
   * This would typically query customer data based on the segment criteria
   * @param id Segment ID
   * @param companyId Company ID
   * @param userId ID of the user refreshing the segment
   * @returns The updated segment with refreshed reach count
   */
  async refreshSegmentReach(
    id: string,
    companyId: string,
    userId: string
  ): Promise<CampaignSegment | null> {
    this._logger.info(`Refreshing reach for segment ${id}`);
    
    try {
      // Get the segment
      const segment = await this.getSegmentById(id, companyId);
      
      if (!segment) {
        this._logger.warn(`Segment with ID ${id} not found`);
        return null;
      }
      
      // TODO: Implement actual logic to calculate reach based on segment criteria
      // For now, we'll just use a placeholder value
      const estimatedReach = 0; // This should be calculated based on actual customer data
      
      // Update the segment with the new reach count and refresh timestamp
      const result = await this.drizzle.update(campaignSegments)
        .set({
          estimatedReach,
          lastRefreshedAt: new Date(),
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(campaignSegments.id, id),
          eq(campaignSegments.companyId, companyId)
        ))
        .returning();
      
      if (!result || result.length === 0) {
        throw new Error('Failed to update segment reach');
      }
      
      return result[0];
    } catch (error) {
      this._logger.error(`Error refreshing reach for segment ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Clone an existing segment
   * @param id ID of the segment to clone
   * @param companyId Company ID
   * @param newName Name for the cloned segment
   * @param userId ID of the user cloning the segment
   * @returns The newly created segment
   */
  async cloneSegment(
    id: string,
    companyId: string,
    newName: string,
    userId: string
  ): Promise<CampaignSegment | null> {
    this._logger.info(`Cloning segment ${id} with name ${newName}`);
    
    try {
      // Get the original segment
      const original = await this.getSegmentById(id, companyId);
      
      if (!original) {
        this._logger.warn(`Segment with ID ${id} not found`);
        return null;
      }
      
      // Create a new segment based on the original
      const clonedSegment = await this.createSegment({
        companyId,
        name: newName,
        description: original.description ? `Clone of: ${original.description}` : `Clone of segment: ${original.name}`,
        filterCriteria: original.filterCriteria,
        isActive: true,
        metadata: original.metadata
      }, userId);
      
      return clonedSegment;
    } catch (error) {
      this._logger.error(`Error cloning segment ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Toggle a segment's active status
   * @param id Segment ID
   * @param companyId Company ID
   * @param isActive New active status
   * @param userId ID of the user updating the segment
   * @returns The updated segment
   */
  async toggleSegmentStatus(
    id: string,
    companyId: string,
    isActive: boolean,
    userId: string
  ): Promise<CampaignSegment | null> {
    this._logger.info(`Setting segment ${id} active status to ${isActive}`);
    
    try {
      // Update the segment status
      return await this.updateSegment(
        id,
        companyId,
        { isActive },
        userId
      );
    } catch (error) {
      this._logger.error(`Error toggling status for segment ${id}`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}