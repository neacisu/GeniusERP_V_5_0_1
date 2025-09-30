/**
 * Settings Module
 * 
 * This module serves as a centralized configuration hub for managing all
 * application settings, preferences, feature toggles, and customization options.
 * It provides a unified interface for accessing and modifying settings across
 * all modules in the application.
 */

import { Express } from 'express';
import { getDrizzle } from '../../common/drizzle';
import { AuthGuard } from '../../common/middleware/auth-guard';

// Import routes
import settingsRouter from './routes/settings.routes';

// Types for module capabilities
interface ModuleCapability {
  name: string;
  description: string;
}

// Types for module info
interface ModuleInfo {
  name: string;
  version: string;
  description: string;
  capabilities: ModuleCapability[];
}

/**
 * Settings Module Registration Class
 * Centralizes all settings-related services for use throughout the application
 */
export class SettingsModule {
  private static instance: SettingsModule;
  private moduleInfo: ModuleInfo;
  
  private constructor() {
    this.moduleInfo = {
      name: 'Settings Module',
      version: '1.0.0',
      description: 'Centralized settings management for all application modules',
      capabilities: [
        {
          name: 'global-settings',
          description: 'System-wide and company-level configurations'
        },
        {
          name: 'user-preferences',
          description: 'User-specific preferences and settings'
        },
        {
          name: 'feature-toggles',
          description: 'Feature flags for enabling/disabling functionality'
        },
        {
          name: 'ui-customization',
          description: 'UI theming and appearance settings'
        },
        {
          name: 'module-settings',
          description: 'Module-specific configurations'
        }
      ]
    };
  }
  
  /**
   * Register settings module routes with the Express app
   * 
   * @param app Express application instance
   */
  static registerRoutes(app: Express) {
    console.log('Registering settings module routes...');
    
    // No services initialization here to avoid circular dependencies
    app.use('/api/settings', settingsRouter);
    console.log('Settings module routes registered at /api/settings');
    
    if (!SettingsModule.instance) {
      SettingsModule.instance = new SettingsModule();
    }
    
    return {
      name: 'Settings Module',
      version: '1.0.0',
      description: 'Centralized settings management for all application modules',
      capabilities: [
        'global-settings', 'user-preferences', 'feature-toggles', 
        'ui-customization', 'module-settings'
      ]
    };
  }

  /**
   * Get the module information
   */
  getModuleInfo(): ModuleInfo {
    return this.moduleInfo;
  }
}