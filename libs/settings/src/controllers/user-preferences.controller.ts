/**
 * User Preferences Controller
 * 
 * This controller handles all HTTP requests related to user preferences.
 * It provides endpoints for managing user-specific settings across the application.
 */

import { Request, Response } from 'express';
import { UserPreferencesService } from '../services/user-preferences.service';
import { createModuleLogger } from "@common/logger/loki-logger";

export class UserPreferencesController {
  private service: UserPreferencesService;
  private logger: ReturnType<typeof createModuleLogger>;
  
  constructor(userPreferencesService?: UserPreferencesService) {
    this.logger = createModuleLogger('UserPreferencesController');
    this.service = userPreferencesService || UserPreferencesService.getInstance();
  }
  
  /**
   * Get a user preference by key
   */
  async getPreference(req: Request, res: Response): Promise<void> {
    try {
      const { userId, key } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to get preference ${key} for user: ${userId}, companyId: ${companyId || 'N/A'}`);
      
      const preference = await this.service.getPreference(
        userId, 
        key, 
        companyId as string | undefined
      );
      
      if (!preference) {
        this.logger.debug(`Preference not found: ${key} for user: ${userId}`);
        res.status(404).json({ error: 'User preference not found' });
        return;
      }
      
      res.status(200).json(preference);
    } catch (error) {
      this.logger.error('Error in getPreference:', error);
      res.status(500).json({ error: 'Failed to retrieve user preference' });
    }
  }
  
  /**
   * Get all preferences for a user
   */
  async getUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to get all preferences for user: ${userId}, companyId: ${companyId || 'N/A'}`);
      
      const preferences = await this.service.getUserPreferences(
        userId,
        companyId as string | undefined
      );
      
      res.status(200).json(preferences);
    } catch (error) {
      this.logger.error('Error in getUserPreferences:', error);
      res.status(500).json({ error: 'Failed to retrieve user preferences' });
    }
  }
  
  /**
   * Get user preferences by category
   */
  async getPreferencesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { userId, category } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to get preferences by category: ${category} for user: ${userId}, companyId: ${companyId || 'N/A'}`);
      
      const preferences = await this.service.getPreferencesByCategory(
        userId,
        category,
        companyId as string | undefined
      );
      
      res.status(200).json(preferences);
    } catch (error) {
      this.logger.error('Error in getPreferencesByCategory:', error);
      res.status(500).json({ error: 'Failed to retrieve user preferences by category' });
    }
  }
  
  /**
   * Get user preferences for a module
   */
  async getPreferencesByModule(req: Request, res: Response): Promise<void> {
    try {
      const { userId, module } = req.params;
      const { companyId } = req.query;
      
      this.logger.debug(`Request to get preferences by module: ${module} for user: ${userId}, companyId: ${companyId || 'N/A'}`);
      
      const preferences = await this.service.getPreferencesByModule(
        userId,
        module,
        companyId as string | undefined
      );
      
      res.status(200).json(preferences);
    } catch (error) {
      this.logger.error('Error in getPreferencesByModule:', error);
      res.status(500).json({ error: 'Failed to retrieve user preferences by module' });
    }
  }
  
  /**
   * Create a new user preference
   */
  async createPreference(req: Request, res: Response): Promise<void> {
    try {
      const preferenceData = req.body;
      
      // Validate required fields
      if (!preferenceData.userId || !preferenceData.key || !preferenceData.value || !preferenceData.category) {
        this.logger.warn('Missing required fields in createPreference request');
        res.status(400).json({ error: 'Missing required fields (userId, key, value, category)' });
        return;
      }
      
      this.logger.debug(`Request to create preference: ${preferenceData.key} for user: ${preferenceData.userId}`);
      
      const result = await this.service.createPreference(preferenceData);
      res.status(201).json(result);
    } catch (error) {
      this.logger.error('Error in createPreference:', error);
      res.status(500).json({ error: 'Failed to create user preference' });
    }
  }
  
  /**
   * Update an existing user preference
   */
  async updatePreference(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      this.logger.debug(`Request to update preference with ID: ${id}`);
      
      const result = await this.service.updatePreference(id, updateData);
      
      if (!result) {
        this.logger.warn(`Preference not found for update: ${id}`);
        res.status(404).json({ error: 'User preference not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in updatePreference:', error);
      res.status(500).json({ error: 'Failed to update user preference' });
    }
  }
  
  /**
   * Delete a user preference
   */
  async deletePreference(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      this.logger.debug(`Request to delete preference with ID: ${id}`);
      
      const result = await this.service.deletePreference(id);
      
      if (!result) {
        this.logger.warn(`Preference not found for deletion: ${id}`);
        res.status(404).json({ error: 'User preference not found' });
        return;
      }
      
      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Error in deletePreference:', error);
      res.status(500).json({ error: 'Failed to delete user preference' });
    }
  }
}