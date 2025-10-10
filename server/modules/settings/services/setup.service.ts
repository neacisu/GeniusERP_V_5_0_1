/**
 * Setup Service for Settings Module
 * 
 * This service manages system setup steps tracking for proper initialization
 * of companies, franchises, and various system components. It provides functionality
 * for updating and tracking setup progress.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { setupSteps } from '../schema/settings.schema'; // using the setup steps from settings schema
import { eq, and } from 'drizzle-orm';
import { createId } from '../../../utils/id';
import { Logger } from '../../../common/logger';

// Define setup step status types
export type SetupStepStatus = 'completed' | 'in_progress' | 'not_started' | 'skipped' | 'pending';

export class SetupService {
  private drizzle: DrizzleService;
  private logger: Logger;
  private static instance: SetupService;
  
  constructor(drizzleService?: DrizzleService) {
    this.logger = new Logger('SetupService');
    this.drizzle = drizzleService || new DrizzleService();
  }
  
  /**
   * Get the singleton instance of the SetupService
   */
  public static getInstance(drizzleService?: DrizzleService): SetupService {
    if (!SetupService.instance) {
      SetupService.instance = new SetupService(drizzleService);
    }
    return SetupService.instance;
  }
  
  /**
   * Update or create a setup step for a company/franchise
   * 
   * @param companyId Company ID
   * @param franchiseId Franchise ID (optional)
   * @param step Step identifier
   * @param status Status of the step
   * @returns The result of the database operation
   */
  async updateSetupStep(companyId: string, step: string, status: SetupStepStatus, franchiseId?: string) {
    try {
      this.logger.debug(`Updating setup step [${step}] for company: ${companyId}, franchiseId: ${franchiseId || 'N/A'}, status: ${status}`);
      
      // Look for an existing step
      const existing = await this.drizzle
        .select()
        .from(setupSteps)
        .where(
          and(
            eq(setupSteps.companyId, companyId),
            eq(setupSteps.step, step),
            franchiseId ? eq(setupSteps.franchiseId, franchiseId) : undefined
          )
        )
        .limit(1);

      if (existing && existing.length > 0) {
        this.logger.debug(`Updating existing setup step: ${existing[0].id}`);
        // Update the existing step
        return await this.drizzle
          .update(setupSteps)
          .set({ 
            status,
            updatedAt: new Date()
          })
          .where(eq(setupSteps.id, existing[0].id))
          .returning();
      } else {
        this.logger.debug(`Creating new setup step for: ${step}`);
        // Create a new step
        return await this.drizzle
          .insert(setupSteps)
          .values({
            id: createId(),
            companyId: companyId,
            franchiseId: franchiseId || null,
            step,
            status,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
      }
    } catch (error) {
      this.logger.error('Error updating setup step:', error);
      throw error;
    }
  }

  /**
   * Check if a specific step is completed
   * 
   * @param companyId Company ID
   * @param step Step identifier
   * @param franchiseId Franchise ID (optional)
   * @returns Boolean indicating if the step is completed
   */
  async isStepComplete(companyId: string, step: string, franchiseId?: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking if step [${step}] is completed for company: ${companyId}, franchiseId: ${franchiseId || 'N/A'}`);
      
      const steps = await this.drizzle.select()
        .from(setupSteps)
        .where(
          and(
            eq(setupSteps.companyId, companyId),
            eq(setupSteps.step, step),
            eq(setupSteps.status, 'completed'),
            franchiseId ? eq(setupSteps.franchiseId, franchiseId) : undefined
          )
        );
      return steps.length > 0;
    } catch (error) {
      this.logger.error('Error checking step completion:', error);
      return false;
    }
  }

  /**
   * Get all setup steps for a company
   * 
   * @param companyId Company ID
   * @param franchiseId Franchise ID (optional)
   * @returns Array of setup steps
   */
  async getCompanySetupSteps(companyId: string, franchiseId?: string) {
    try {
      this.logger.debug(`Getting all setup steps for company: ${companyId}, franchiseId: ${franchiseId || 'N/A'}`);
      
      return await this.drizzle.select()
        .from(setupSteps)
        .where(
          and(
            eq(setupSteps.companyId, companyId),
            franchiseId ? eq(setupSteps.franchiseId, franchiseId) : undefined
          )
        )
        .orderBy(setupSteps.createdAt);
    } catch (error) {
      this.logger.error('Error fetching setup steps:', error);
      throw error;
    }
  }

  /**
   * Get setup progress percentage
   * 
   * @param companyId Company ID
   * @param franchiseId Franchise ID (optional)
   * @returns Percentage of completed steps (0-100)
   */
  async getSetupProgress(companyId: string, franchiseId?: string): Promise<number> {
    try {
      this.logger.debug(`Calculating setup progress for company: ${companyId}, franchiseId: ${franchiseId || 'N/A'}`);
      
      const totalSteps = await this.drizzle.select()
        .from(setupSteps)
        .where(
          and(
            eq(setupSteps.companyId, companyId),
            franchiseId ? eq(setupSteps.franchiseId, franchiseId) : undefined
          )
        );
      
      // Count completed and skipped steps as done for progress calculation
      const completedSteps = totalSteps.filter((step: any) => 
        step.status === 'completed' || step.status === 'skipped'
      );
      
      if (totalSteps.length === 0) return 0;
      const progress = Math.round((completedSteps.length / totalSteps.length) * 100);
      this.logger.debug(`Setup progress: ${progress}% (${completedSteps.length}/${totalSteps.length} steps completed)`);
      
      return progress;
    } catch (error) {
      this.logger.error('Error calculating setup progress:', error);
      return 0;
    }
  }
}