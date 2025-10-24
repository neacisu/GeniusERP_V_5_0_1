/**
 * UI Theme Controller
 * 
 * This controller handles all HTTP requests related to UI themes.
 * It provides endpoints for managing application themes and appearance settings.
 */

import { Request, Response } from 'express';
import { UiThemeService } from '../services/ui-theme.service';
import { createModuleLogger } from "@common/logger/loki-logger";

export class UiThemeController {
  private service: UiThemeService;
  private logger: ReturnType<typeof createModuleLogger>;
  
  constructor(uiThemeService?: UiThemeService) {
    this.logger = createModuleLogger('UiThemeController');
    this.service = uiThemeService || UiThemeService.getInstance();
  }
  
  /**
   * Get all themes for a company
   */
  async getCompanyThemes(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
      this.logger.debug(`Request to get UI themes for company: ${companyId}`);
      
      const themes = await this.service.getCompanyThemes(companyId);
      
      res.status(200).json(themes);
    } catch (error) {
      this.logger.error('Error in getCompanyThemes:', error);
      res.status(500).json({ error: 'Failed to retrieve company themes' });
    }
  }
  
  /**
   * Get the default theme for a company
   */
  async getDefaultTheme(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
      this.logger.debug(`Request to get default UI theme for company: ${companyId}`);
      
      const theme = await this.service.getDefaultTheme(companyId);
      
      if (!theme) {
        this.logger.debug(`Default theme not found for company: ${companyId}`);
        res.status(404).json({ error: 'Default theme not found' });
        return;
      }
      
      res.status(200).json(theme);
    } catch (error) {
      this.logger.error('Error in getDefaultTheme:', error);
      res.status(500).json({ error: 'Failed to retrieve default theme' });
    }
  }
  
  /**
   * Get a theme by ID
   */
  async getThemeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      this.logger.debug(`Request to get UI theme by ID: ${id}`);
      
      const theme = await this.service.getThemeById(id);
      
      if (!theme) {
        this.logger.debug(`Theme not found with ID: ${id}`);
        res.status(404).json({ error: 'UI theme not found' });
        return;
      }
      
      res.status(200).json(theme);
    } catch (error) {
      this.logger.error('Error in getThemeById:', error);
      res.status(500).json({ error: 'Failed to retrieve UI theme' });
    }
  }
  
  /**
   * Create a new UI theme
   */
  async createTheme(req: Request, res: Response): Promise<void> {
    try {
      const themeData = req.body;
      
      // Validate required fields
      if (!themeData.companyId || !themeData.name || !themeData.theme) {
        this.logger.warn('Missing required fields in createTheme request');
        res.status(400).json({ error: 'Missing required fields (companyId, name, theme)' });
        return;
      }
      
      this.logger.debug(`Request to create UI theme: ${themeData.name} for company: ${themeData.companyId}`);
      
      const result = await this.service.createTheme(themeData);
      
      res.status(201).json(result);
    } catch (error) {
      this.logger.error('Error in createTheme:', error);
      res.status(500).json({ error: 'Failed to create UI theme' });
    }
  }
  
  /**
   * Update an existing UI theme
   */
  async updateTheme(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      this.logger.debug(`Request to update UI theme with ID: ${id}`);
      
      const result = await this.service.updateTheme(id, updateData);
      
      if (!result) {
        this.logger.warn(`Theme not found for update: ${id}`);
        res.status(404).json({ error: 'UI theme not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in updateTheme:', error);
      res.status(500).json({ error: 'Failed to update UI theme' });
    }
  }
  
  /**
   * Delete a UI theme
   */
  async deleteTheme(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      this.logger.debug(`Request to delete UI theme with ID: ${id}`);
      
      const result = await this.service.deleteTheme(id);
      
      if (!result) {
        this.logger.warn(`Theme not found for deletion: ${id}`);
        res.status(404).json({ error: 'UI theme not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in deleteTheme:', error);
      res.status(500).json({ error: 'Failed to delete UI theme' });
    }
  }
  
  /**
   * Set a theme as the default for a company
   */
  async setAsDefault(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      this.logger.debug(`Request to set UI theme with ID: ${id} as default`);
      
      const result = await this.service.setAsDefault(id);
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in setAsDefault:', error);
      
      if (error instanceof Error && error.message === 'Theme not found') {
        res.status(404).json({ error: 'UI theme not found' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to set UI theme as default' });
    }
  }
}