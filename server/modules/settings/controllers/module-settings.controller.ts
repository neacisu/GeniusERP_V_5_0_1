/**
 * Module Settings Controller
 * 
 * This controller handles all HTTP requests related to module-specific settings.
 * It provides endpoints for managing settings for different modules in the application.
 */

import { Request, Response } from 'express';
import { ModuleSettingsService } from '../services/module-settings.service';
import { Logger } from '../../../common/logger';

export class ModuleSettingsController {
  private service: ModuleSettingsService;
  private logger: Logger;
  
  constructor(moduleSettingsService?: ModuleSettingsService) {
    this.logger = new Logger('ModuleSettingsController');
    this.service = moduleSettingsService || ModuleSettingsService.getInstance();
  }
  
  /**
   * Get all settings for a specific module
   */
  async getAllModuleSettings(req: Request, res: Response): Promise<void> {
    try {
      const { moduleName } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to get all settings for module: ${moduleName}, companyId: ${companyId || 'N/A'}`);
      
      const settings = await this.service.getAllModuleSettings(
        moduleName, 
        companyId as string | undefined
      );
      
      res.status(200).json(settings);
    } catch (error) {
      this.logger.error('Error in getAllModuleSettings:', error);
      res.status(500).json({ error: 'Failed to retrieve module settings' });
    }
  }
  
  /**
   * Get a specific setting for a module
   */
  async getModuleSetting(req: Request, res: Response): Promise<void> {
    try {
      const { moduleName, key } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to get setting [${key}] for module: ${moduleName}, companyId: ${companyId || 'N/A'}`);
      
      const setting = await this.service.getModuleSetting(
        moduleName, 
        key,
        companyId as string | undefined
      );
      
      if (!setting) {
        this.logger.warn(`Module setting not found: ${moduleName}/${key}`);
        res.status(404).json({ error: 'Module setting not found' });
        return;
      }
      
      res.status(200).json(setting);
    } catch (error) {
      this.logger.error('Error in getModuleSetting:', error);
      res.status(500).json({ error: 'Failed to retrieve module setting' });
    }
  }
  
  /**
   * Create a module setting
   */
  async createModuleSetting(req: Request, res: Response): Promise<void> {
    try {
      const { moduleName } = req.params;
      const settingData = req.body;
      
      // Validate required fields
      if (!settingData.key || !settingData.value || !settingData.category) {
        this.logger.warn('Missing required fields in createModuleSetting request');
        res.status(400).json({ error: 'Missing required fields (key, value, category)' });
        return;
      }
      
      // Set the module name from the URL
      settingData.module = moduleName;
      
      this.logger.debug(`Request to create module setting: ${settingData.key} for module: ${moduleName}`);
      
      const result = await this.service.createModuleSetting(settingData);
      res.status(201).json(result);
    } catch (error) {
      this.logger.error('Error in createModuleSetting:', error);
      res.status(500).json({ error: 'Failed to create module setting' });
    }
  }
  
  /**
   * Update a module setting
   */
  async updateModuleSetting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      this.logger.debug(`Request to update module setting with ID: ${id}`);
      
      const result = await this.service.updateModuleSetting(id, updateData);
      
      if (!result) {
        this.logger.warn(`Module setting not found for update: ${id}`);
        res.status(404).json({ error: 'Module setting not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in updateModuleSetting:', error);
      res.status(500).json({ error: 'Failed to update module setting' });
    }
  }
  
  /**
   * Delete a module setting
   */
  async deleteModuleSetting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      this.logger.debug(`Request to delete module setting with ID: ${id}`);
      
      const result = await this.service.deleteModuleSetting(id);
      
      if (!result) {
        this.logger.warn(`Module setting not found for deletion: ${id}`);
        res.status(404).json({ error: 'Module setting not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in deleteModuleSetting:', error);
      res.status(500).json({ error: 'Failed to delete module setting' });
    }
  }
  
  /**
   * Register default settings for a module
   */
  async registerDefaultSettings(req: Request, res: Response): Promise<void> {
    try {
      const { moduleName } = req.params;
      const { companyId, createdBy, settings } = req.body;
      
      if (!settings || !Array.isArray(settings) || settings.length === 0) {
        this.logger.warn('Missing or invalid settings array in registerDefaultSettings request');
        res.status(400).json({ error: 'Valid settings array is required' });
        return;
      }
      
      this.logger.debug(`Request to register default settings for module: ${moduleName}, count: ${settings.length}`);
      
      const results = await this.service.registerDefaultSettings(
        moduleName,
        settings,
        companyId,
        createdBy
      );
      
      res.status(200).json({
        registered: results.length,
        settings: results
      });
    } catch (error) {
      this.logger.error('Error in registerDefaultSettings:', error);
      res.status(500).json({ error: 'Failed to register default settings' });
    }
  }
  
  /**
   * Get settings for multiple modules
   */
  async getMultiModuleSettings(req: Request, res: Response): Promise<void> {
    try {
      const { moduleNames } = req.body;
      const { companyId } = req.query;
      
      if (!moduleNames || !Array.isArray(moduleNames) || moduleNames.length === 0) {
        this.logger.warn('Missing or invalid moduleNames array in getMultiModuleSettings request');
        res.status(400).json({ error: 'Valid moduleNames array is required' });
        return;
      }
      
      this.logger.debug(`Request to get settings for multiple modules: ${moduleNames.join(', ')}, companyId: ${companyId || 'N/A'}`);
      
      const results = await this.service.getMultiModuleSettings(
        moduleNames,
        companyId as string | undefined
      );
      
      res.status(200).json(results);
    } catch (error) {
      this.logger.error('Error in getMultiModuleSettings:', error);
      res.status(500).json({ error: 'Failed to retrieve multi-module settings' });
    }
  }
}