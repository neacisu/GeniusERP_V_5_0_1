/**
 * Settings Module
 * 
 * This module serves as a centralized configuration hub for managing all
 * application settings, preferences, feature toggles, and customization options.
 * It provides a unified interface for accessing and modifying settings across
 * all modules in the application.
 */

import { Express, Router, Request, Response } from 'express';
import { AuthGuard } from '../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../auth/src/constants/auth-mode.enum';

// Import controllers
import { 
  GlobalSettingsController,
  FeatureToggleController,
  ModuleSettingsController,
  SetupController,
  UserPreferencesController,
  UiThemeController
} from './controllers';

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
        },
        {
          name: 'setup-tracking',
          description: 'System setup and onboarding progress tracking'
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
    
    // Create a base router for all settings endpoints
    const baseRouter = Router();
    
    // Apply authentication middleware to all settings routes
    baseRouter.use(AuthGuard.protect(JwtAuthMode.REQUIRED));
    
    // Create controller instances
    const globalSettingsController = new GlobalSettingsController();
    const featureToggleController = new FeatureToggleController();
    const moduleSettingsController = new ModuleSettingsController();
    const setupController = new SetupController();
    const userPreferencesController = new UserPreferencesController();
    const uiThemeController = new UiThemeController();
    
    // Register Global Settings routes
    const globalRouter = Router();
    globalRouter.get('/', (req: Request, res: Response) => {
      if (req.query['category']) {
        return globalSettingsController.getSettingsByCategory(req, res);
      } else if (req.query['module']) {
        return globalSettingsController.getSettingsByCategory(req, res);
      } else {
        return res.status(400).json({ error: 'Must provide category or module parameter' });
      }
    });
    globalRouter.get('/:key', (req, res) => globalSettingsController.getSetting(req, res));
    globalRouter.post('/', (req, res) => globalSettingsController.createSetting(req, res));
    globalRouter.put('/:id', (req, res) => globalSettingsController.updateSetting(req, res));
    globalRouter.delete('/:id', (req, res) => globalSettingsController.deleteSetting(req, res));
    baseRouter.use('/global', globalRouter);
    
    // Register Feature Toggle routes
    const featuresRouter = Router();
    featuresRouter.get('/', (req: Request, res: Response) => {
      if (req.query['module']) {
        return featureToggleController.getFeaturesByModule(req, res);
      } else if (req.query['companyId']) {
        return featureToggleController.getCompanyFeatures(req, res);
      } else {
        return res.status(400).json({ error: 'Must provide module or companyId parameter' });
      }
    });
    featuresRouter.get('/:feature/status', (req, res) => featureToggleController.isFeatureEnabled(req, res));
    featuresRouter.post('/', (req, res) => featureToggleController.createFeatureToggle(req, res));
    featuresRouter.put('/:id/enable', (req, res) => featureToggleController.enableFeature(req, res));
    featuresRouter.put('/:id/disable', (req, res) => featureToggleController.disableFeature(req, res));
    featuresRouter.delete('/:id', (req, res) => featureToggleController.deleteFeatureToggle(req, res));
    baseRouter.use('/features', featuresRouter);
    
    // Register Module Settings routes
    const modulesRouter = Router();
    modulesRouter.get('/:moduleName/settings', (req, res) => moduleSettingsController.getAllModuleSettings(req, res));
    modulesRouter.get('/:moduleName/settings/:key', (req, res) => moduleSettingsController.getModuleSetting(req, res));
    modulesRouter.post('/:moduleName/settings', (req, res) => moduleSettingsController.createModuleSetting(req, res));
    modulesRouter.post('/:moduleName/defaults', (req, res) => moduleSettingsController.registerDefaultSettings(req, res));
    baseRouter.use('/modules', modulesRouter);
    
    // Multi-module settings route
    baseRouter.get('/multi-modules', (req, res) => {
      const { modules } = req.query;
      if (!modules) {
        return res.status(400).json({ error: 'Missing modules parameter' });
      }
      req.body.moduleNames = (modules as string).split(',');
      return moduleSettingsController.getMultiModuleSettings(req, res);
    });
    
    // Register Setup routes
    const setupRouter = Router();
    setupRouter.get('/', (req, res) => setupController.getCompanySetupSteps(req, res));
    setupRouter.get('/progress/:companyId', (req, res) => setupController.getSetupProgress(req, res));
    setupRouter.get('/:companyId/step/:step/status', (req, res) => setupController.isStepComplete(req, res));
    setupRouter.post('/:companyId/step/:step', (req, res) => setupController.updateSetupStep(req, res));
    baseRouter.use('/setup', setupRouter);
    
    // Register User Preferences routes
    const preferencesRouter = Router();
    preferencesRouter.get('/:userId', (req, res) => userPreferencesController.getUserPreferences(req, res));
    preferencesRouter.get('/:userId/category/:category', (req, res) => userPreferencesController.getPreferencesByCategory(req, res));
    preferencesRouter.get('/:userId/module/:module', (req, res) => userPreferencesController.getPreferencesByModule(req, res));
    preferencesRouter.get('/:userId/key/:key', (req, res) => userPreferencesController.getPreference(req, res));
    preferencesRouter.post('/', (req, res) => userPreferencesController.createPreference(req, res));
    preferencesRouter.put('/:id', (req, res) => userPreferencesController.updatePreference(req, res));
    preferencesRouter.delete('/:id', (req, res) => userPreferencesController.deletePreference(req, res));
    baseRouter.use('/user-preferences', preferencesRouter);
    
    // Register UI Theme routes
    const themesRouter = Router();
    themesRouter.get('/:companyId', (req, res) => uiThemeController.getCompanyThemes(req, res));
    themesRouter.get('/:companyId/default', (req, res) => uiThemeController.getDefaultTheme(req, res));
    themesRouter.get('/theme/:id', (req, res) => uiThemeController.getThemeById(req, res));
    themesRouter.post('/', (req, res) => uiThemeController.createTheme(req, res));
    themesRouter.put('/:id', (req, res) => uiThemeController.updateTheme(req, res));
    themesRouter.put('/:id/set-default', (req, res) => uiThemeController.setAsDefault(req, res));
    themesRouter.delete('/:id', (req, res) => uiThemeController.deleteTheme(req, res));
    baseRouter.use('/themes', themesRouter);
    
    // Mount all settings routes at /api/settings
    app.use('/api/settings', baseRouter);
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
        'ui-customization', 'module-settings', 'setup-tracking'
      ]
    };
  }

  /**
   * Initialize the module
   */
  static initialize(app: Express) {
    return SettingsModule.registerRoutes(app);
  }

  /**
   * Get the module information
   */
  getModuleInfo(): ModuleInfo {
    return this.moduleInfo;
  }
}