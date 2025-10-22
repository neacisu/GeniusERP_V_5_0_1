/**
 * Global Settings Controller
 * 
 * This controller handles all HTTP requests related to global settings.
 * It provides endpoints for managing system-wide and company-level settings.
 */

import { Request, Response } from 'express';
import { GlobalSettingsService } from '../services/global-settings.service';
import { Logger } from '../../../common/logger';

export class GlobalSettingsController {
  private service: GlobalSettingsService;
  private logger: Logger;
  
  constructor(globalSettingsService?: GlobalSettingsService) {
    this.logger = new Logger('GlobalSettingsController');
    this.service = globalSettingsService || GlobalSettingsService.getInstance();
  }
  
  /**
   * Get a setting by key
   */
  async getSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to get setting: ${key}, companyId: ${companyId || 'system-wide'}`);
      
      const setting = await this.service.getSetting(
        key, 
        companyId as string | undefined
      );
      
      if (!setting) {
        this.logger.debug(`Setting not found: ${key}`);
        res.status(404).json({ error: 'Setting not found' });
        return;
      }
      
      res.status(200).json(setting);
    } catch (error) {
      this.logger.error('Error in getSetting:', error);
      res.status(500).json({ error: 'Failed to retrieve setting' });
    }
  }
  
  /**
   * Get settings by category
   */
  async getSettingsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to get settings by category: ${category}, companyId: ${companyId || 'system-wide'}`);
      
      const settings = await this.service.getSettingsByCategory(
        category, 
        companyId as string | undefined
      );
      
      res.status(200).json(settings);
    } catch (error) {
      this.logger.error('Error in getSettingsByCategory:', error);
      res.status(500).json({ error: 'Failed to retrieve settings by category' });
    }
  }
  
  /**
   * Create a new setting
   */
  async createSetting(req: Request, res: Response): Promise<void> {
    try {
      const settingData = req.body;
      
      // Validate required fields
      if (!settingData.key || !settingData.value || !settingData.category) {
        this.logger.warn('Missing required fields in createSetting request');
        res.status(400).json({ error: 'Missing required fields (key, value, category)' });
        return;
      }
      
      this.logger.debug(`Request to create setting: ${settingData.key}`);
      
      const result = await this.service.createSetting(settingData);
      res.status(201).json(result);
    } catch (error) {
      this.logger.error('Error in createSetting:', error);
      res.status(500).json({ error: 'Failed to create setting' });
    }
  }
  
  /**
   * Update an existing setting
   */
  async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      this.logger.debug(`Request to update setting with ID: ${id}`);
      
      const result = await this.service.updateSetting(id, updateData);
      if (!result) {
        this.logger.warn(`Setting not found for update: ${id}`);
        res.status(404).json({ error: 'Setting not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in updateSetting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  }
  
  /**
   * Delete a setting
   */
  async deleteSetting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      this.logger.debug(`Request to delete setting with ID: ${id}`);
      
      const result = await this.service.deleteSetting(id);
      if (!result) {
        this.logger.warn(`Setting not found for deletion: ${id}`);
        res.status(404).json({ error: 'Setting not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in deleteSetting:', error);
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  }
}