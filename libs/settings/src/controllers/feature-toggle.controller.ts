/**
 * Feature Toggle Controller
 * 
 * This controller handles all HTTP requests related to feature toggles.
 * It provides endpoints for managing feature flags across the application.
 */

import { Request, Response } from 'express';
import { FeatureToggleService } from '../services/feature-toggle.service';
import { Logger } from "@common/logger";

export class FeatureToggleController {
  private service: FeatureToggleService;
  private logger: Logger;
  
  constructor(featureToggleService?: FeatureToggleService) {
    this.logger = new Logger('FeatureToggleController');
    this.service = featureToggleService || FeatureToggleService.getInstance();
  }
  
  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(req: Request, res: Response): Promise<void> {
    try {
      const { feature } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to check feature: ${feature}, companyId: ${companyId || 'global'}`);
      
      const isEnabled = await this.service.isFeatureEnabled(
        feature, 
        companyId as string | undefined
      );
      
      res.status(200).json({ feature, enabled: isEnabled });
    } catch (error) {
      this.logger.error('Error in isFeatureEnabled:', error);
      res.status(500).json({ error: 'Failed to check feature status' });
    }
  }
  
  /**
   * Get all feature toggles for a module
   */
  async getFeaturesByModule(req: Request, res: Response): Promise<void> {
    try {
      const { module } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to get features for module: ${module}, companyId: ${companyId || 'global'}`);
      
      const features = await this.service.getFeaturesByModule(
        module,
        companyId as string | undefined
      );
      
      res.status(200).json(features);
    } catch (error) {
      this.logger.error('Error in getFeaturesByModule:', error);
      res.status(500).json({ error: 'Failed to retrieve features by module' });
    }
  }
  
  /**
   * Get all feature toggles for a company
   */
  async getCompanyFeatures(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
      this.logger.debug(`Request to get features for company: ${companyId}`);
      
      const features = await this.service.getCompanyFeatures(companyId);
      
      res.status(200).json(features);
    } catch (error) {
      this.logger.error('Error in getCompanyFeatures:', error);
      res.status(500).json({ error: 'Failed to retrieve company features' });
    }
  }
  
  /**
   * Create a new feature toggle
   */
  async createFeatureToggle(req: Request, res: Response): Promise<void> {
    try {
      const toggleData = req.body;
      
      // Validate required fields
      if (!toggleData.feature || toggleData.enabled === undefined || !toggleData.module) {
        this.logger.warn('Missing required fields in createFeatureToggle request');
        res.status(400).json({ error: 'Missing required fields (feature, enabled, module)' });
        return;
      }
      
      this.logger.debug(`Request to create feature toggle: ${toggleData.feature}`);
      
      const result = await this.service.createFeatureToggle(toggleData);
      res.status(201).json(result);
    } catch (error) {
      this.logger.error('Error in createFeatureToggle:', error);
      res.status(500).json({ error: 'Failed to create feature toggle' });
    }
  }
  
  /**
   * Update an existing feature toggle
   */
  async updateFeatureToggle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      this.logger.debug(`Request to update feature toggle with ID: ${id}`);
      
      const result = await this.service.updateFeatureToggle(id, updateData);
      
      if (!result) {
        this.logger.warn(`Feature toggle not found for update: ${id}`);
        res.status(404).json({ error: 'Feature toggle not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in updateFeatureToggle:', error);
      res.status(500).json({ error: 'Failed to update feature toggle' });
    }
  }
  
  /**
   * Enable a feature toggle
   */
  async enableFeature(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        this.logger.warn('Missing userId in enableFeature request');
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      
      this.logger.debug(`Request to enable feature toggle: ${id} by user: ${userId}`);
      
      const result = await this.service.enableFeature(id, userId);
      
      if (!result) {
        this.logger.warn(`Feature toggle not found for enabling: ${id}`);
        res.status(404).json({ error: 'Feature toggle not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in enableFeature:', error);
      res.status(500).json({ error: 'Failed to enable feature' });
    }
  }
  
  /**
   * Disable a feature toggle
   */
  async disableFeature(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        this.logger.warn('Missing userId in disableFeature request');
        res.status(400).json({ error: 'User ID is required' });
        return;
      }
      
      this.logger.debug(`Request to disable feature toggle: ${id} by user: ${userId}`);
      
      const result = await this.service.disableFeature(id, userId);
      
      if (!result) {
        this.logger.warn(`Feature toggle not found for disabling: ${id}`);
        res.status(404).json({ error: 'Feature toggle not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in disableFeature:', error);
      res.status(500).json({ error: 'Failed to disable feature' });
    }
  }
  
  /**
   * Delete a feature toggle
   */
  async deleteFeatureToggle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      this.logger.debug(`Request to delete feature toggle with ID: ${id}`);
      
      const result = await this.service.deleteFeatureToggle(id);
      
      if (!result) {
        this.logger.warn(`Feature toggle not found for deletion: ${id}`);
        res.status(404).json({ error: 'Feature toggle not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in deleteFeatureToggle:', error);
      res.status(500).json({ error: 'Failed to delete feature toggle' });
    }
  }
}