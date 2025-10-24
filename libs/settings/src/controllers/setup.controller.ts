/**
 * Setup Controller
 * 
 * This controller handles all HTTP requests related to system setup and onboarding.
 * It provides endpoints for tracking and managing setup steps for companies and franchises.
 */

import { Request, Response } from 'express';
import { SetupService, SetupStepStatus } from '../services/setup.service';
import { createModuleLogger } from "@common/logger/loki-logger";

export class SetupController {
  private service: SetupService;
  private logger: ReturnType<typeof createModuleLogger>;
  
  constructor(setupService?: SetupService) {
    this.logger = createModuleLogger('SetupController');
    this.service = setupService || SetupService.getInstance();
  }
  
  /**
   * Update a setup step
   */
  async updateSetupStep(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, step } = req.params;
      const { franchiseId, status } = req.body;
      
      const validStatuses = ['completed', 'in_progress', 'not_started', 'skipped', 'pending'];
      if (!status || !validStatuses.includes(status as SetupStepStatus)) {
        this.logger.warn(`Invalid status value: ${status} for step: ${step}`);
        res.status(400).json({ 
          error: 'Invalid status value',
          validValues: validStatuses
        });
        return;
      }
      
      this.logger.debug(`Request to update setup step: ${step} for company: ${companyId}, franchiseId: ${franchiseId || 'N/A'}, status: ${status}`);
      
      const result = await this.service.updateSetupStep(
        companyId,
        step,
        status as SetupStepStatus,
        franchiseId
      );
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in updateSetupStep:', error);
      res.status(500).json({ error: 'Failed to update setup step' });
    }
  }
  
  /**
   * Check if a step is completed
   */
  async isStepComplete(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, step } = req.params;
      const { franchiseId } = req.query;
      
      this.logger.debug(`Request to check if step is completed: ${step} for company: ${companyId}, franchiseId: ${franchiseId || 'N/A'}`);
      
      const isCompleted = await this.service.isStepComplete(
        companyId,
        step,
        franchiseId as string | undefined
      );
      
      res.status(200).json({ step, completed: isCompleted });
    } catch (error) {
      this.logger.error('Error in isStepComplete:', error);
      res.status(500).json({ error: 'Failed to check step completion status' });
    }
  }
  
  /**
   * Get all setup steps for a company
   */
  async getCompanySetupSteps(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { franchiseId } = req.query;
      
      this.logger.debug(`Request to get all setup steps for company: ${companyId}, franchiseId: ${franchiseId || 'N/A'}`);
      
      const steps = await this.service.getCompanySetupSteps(
        companyId,
        franchiseId as string | undefined
      );
      
      res.status(200).json(steps);
    } catch (error) {
      this.logger.error('Error in getCompanySetupSteps:', error);
      res.status(500).json({ error: 'Failed to retrieve company setup steps' });
    }
  }
  
  /**
   * Get setup progress percentage
   */
  async getSetupProgress(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { franchiseId } = req.query;
      
      this.logger.debug(`Request to get setup progress for company: ${companyId}, franchiseId: ${franchiseId || 'N/A'}`);
      
      const progress = await this.service.getSetupProgress(
        companyId,
        franchiseId as string | undefined
      );
      
      res.status(200).json({ companyId, franchiseId: franchiseId || null, progress });
    } catch (error) {
      this.logger.error('Error in getSetupProgress:', error);
      res.status(500).json({ error: 'Failed to calculate setup progress' });
    }
  }
}