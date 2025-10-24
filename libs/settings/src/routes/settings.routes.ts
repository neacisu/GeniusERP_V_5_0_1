/**
 * Settings Routes
 * 
 * This file defines the API routes for the Settings module,
 * allowing clients to interact with settings, preferences, feature toggles, and themes.
 */

import { Router, Request, Response } from 'express';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';

// Import services directly
import { 
  GlobalSettingsService,
  UserPreferencesService,
  FeatureToggleService,
  ModuleSettingsService,
  UiThemeService
} from '../services';

// Import setup routes
import setupRoutes from './setup.routes';

// Create the router
const router = Router();

// Initialize service instances
const globalSettingsService = GlobalSettingsService.getInstance();
const userPreferencesService = UserPreferencesService.getInstance();
const featureToggleService = FeatureToggleService.getInstance();
const moduleSettingsService = ModuleSettingsService.getInstance();
const uiThemeService = UiThemeService.getInstance();

// Apply authentication middleware to all settings routes
// This is the correct way to register middleware for all routes in the router
router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

// Mount setup routes
router.use('/setup', setupRoutes);

// Global Settings Routes
router.get('/global', async (req: Request, res: Response) => {
  try {
    const { category, module, companyId } = req.query;

    if (category) {
      const settings = await globalSettingsService.getSettingsByCategory(
        category as string, 
        companyId as string | undefined
      );
      return res.status(200).json(settings);
    } else if (module) {
      const settings = await globalSettingsService.getSettingsByModule(
        module as string, 
        companyId as string | undefined
      );
      return res.status(200).json(settings);
    } else {
      return res.status(400).json({ error: 'Must provide category or module parameter' });
    }
  } catch (error) {
    console.error('Error retrieving global settings:', error);
    return res.status(500).json({ error: 'Failed to retrieve global settings' });
  }
});

router.get('/global/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { companyId } = req.query;

    const setting = await globalSettingsService.getSetting(key, companyId as string | undefined);

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    return res.status(200).json(setting);
  } catch (error) {
    console.error('Error retrieving global setting:', error);
    return res.status(500).json({ error: 'Failed to retrieve global setting' });
  }
});

router.post('/global', async (req: Request, res: Response) => {
  try {
    const settingData = req.body;

    // Validate required fields
    if (!settingData.key || !settingData.value || !settingData.category) {
      return res.status(400).json({ error: 'Missing required fields (key, value, category)' });
    }

    const createdSetting = await globalSettingsService.createSetting(settingData);
    return res.status(201).json(createdSetting);
  } catch (error) {
    console.error('Error creating global setting:', error);
    return res.status(500).json({ error: 'Failed to create global setting' });
  }
});

router.put('/global/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const settingData = req.body;

    const updatedSetting = await globalSettingsService.updateSetting(id, settingData);

    if (!updatedSetting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    return res.status(200).json(updatedSetting);
  } catch (error) {
    console.error('Error updating global setting:', error);
    return res.status(500).json({ error: 'Failed to update global setting' });
  }
});

router.delete('/global/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedSetting = await globalSettingsService.deleteSetting(id);

    if (!deletedSetting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    return res.status(200).json(deletedSetting);
  } catch (error) {
    console.error('Error deleting global setting:', error);
    return res.status(500).json({ error: 'Failed to delete global setting' });
  }
});

// Feature Toggle Routes
router.get('/features', async (req: Request, res: Response) => {
  try {
    const { module, companyId } = req.query;

    if (module) {
      const features = await featureToggleService.getFeaturesByModule(
        module as string, 
        companyId as string | undefined
      );
      return res.status(200).json(features);
    } else if (companyId) {
      const features = await featureToggleService.getCompanyFeatures(companyId as string);
      return res.status(200).json(features);
    } else {
      return res.status(400).json({ error: 'Must provide module or companyId parameter' });
    }
  } catch (error) {
    console.error('Error retrieving features:', error);
    return res.status(500).json({ error: 'Failed to retrieve features' });
  }
});

router.get('/features/:feature/status', async (req: Request, res: Response) => {
  try {
    const { feature } = req.params;
    const { companyId } = req.query;

    const isEnabled = await featureToggleService.isFeatureEnabled(
      feature, 
      companyId as string | undefined
    );

    return res.status(200).json({ feature, enabled: isEnabled });
  } catch (error) {
    console.error('Error checking feature status:', error);
    return res.status(500).json({ error: 'Failed to check feature status' });
  }
});

router.post('/features', async (req: Request, res: Response) => {
  try {
    const featureData = req.body;

    // Validate required fields
    if (!featureData.feature || !featureData.module) {
      return res.status(400).json({ error: 'Missing required fields (feature, module)' });
    }

    const createdFeature = await featureToggleService.createFeatureToggle(featureData);
    return res.status(201).json(createdFeature);
  } catch (error) {
    console.error('Error creating feature toggle:', error);
    return res.status(500).json({ error: 'Failed to create feature toggle' });
  }
});

router.put('/features/:id/enable', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field (userId)' });
    }

    const enabledFeature = await featureToggleService.enableFeature(id, userId);

    if (!enabledFeature) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    return res.status(200).json(enabledFeature);
  } catch (error) {
    console.error('Error enabling feature:', error);
    return res.status(500).json({ error: 'Failed to enable feature' });
  }
});

router.put('/features/:id/disable', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field (userId)' });
    }

    const disabledFeature = await featureToggleService.disableFeature(id, userId);

    if (!disabledFeature) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    return res.status(200).json(disabledFeature);
  } catch (error) {
    console.error('Error disabling feature:', error);
    return res.status(500).json({ error: 'Failed to disable feature' });
  }
});

router.delete('/features/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedFeature = await featureToggleService.deleteFeatureToggle(id);

    if (!deletedFeature) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    return res.status(200).json(deletedFeature);
  } catch (error) {
    console.error('Error deleting feature:', error);
    return res.status(500).json({ error: 'Failed to delete feature' });
  }
});

// Module Settings Routes
router.get('/modules/:moduleName/settings', async (req: Request, res: Response) => {
  try {
    const { moduleName } = req.params;
    const { companyId } = req.query;

    const settings = await moduleSettingsService.getAllModuleSettings(
      moduleName, 
      companyId as string | undefined
    );

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error retrieving module settings:', error);
    return res.status(500).json({ error: 'Failed to retrieve module settings' });
  }
});

router.get('/modules/:moduleName/settings/:key', async (req: Request, res: Response) => {
  try {
    const { moduleName, key } = req.params;
    const { companyId } = req.query;

    const setting = await moduleSettingsService.getModuleSetting(
      moduleName, 
      key, 
      companyId as string | undefined
    );

    if (!setting) {
      return res.status(404).json({ error: 'Module setting not found' });
    }

    return res.status(200).json(setting);
  } catch (error) {
    console.error('Error retrieving module setting:', error);
    return res.status(500).json({ error: 'Failed to retrieve module setting' });
  }
});

router.post('/modules/:moduleName/settings', async (req: Request, res: Response) => {
  try {
    const { moduleName } = req.params;
    const settingData = req.body;

    // Validate required fields
    if (!settingData.key || !settingData.value || !settingData.category) {
      return res.status(400).json({ error: 'Missing required fields (key, value, category)' });
    }

    // Set the module name from the URL
    settingData.module = moduleName;

    const createdSetting = await moduleSettingsService.createModuleSetting(settingData);
    return res.status(201).json(createdSetting);
  } catch (error) {
    console.error('Error creating module setting:', error);
    return res.status(500).json({ error: 'Failed to create module setting' });
  }
});

router.post('/modules/:moduleName/defaults', async (req: Request, res: Response) => {
  try {
    const { moduleName } = req.params;
    const { settings, companyId, userId } = req.body;

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ error: 'Missing or invalid settings array' });
    }

    const registeredSettings = await moduleSettingsService.registerDefaultSettings(
      moduleName,
      settings,
      companyId,
      userId
    );

    return res.status(201).json(registeredSettings);
  } catch (error) {
    console.error('Error registering default settings:', error);
    return res.status(500).json({ error: 'Failed to register default settings' });
  }
});

router.get('/multi-modules', async (req: Request, res: Response) => {
  try {
    const { modules, companyId } = req.query;

    if (!modules) {
      return res.status(400).json({ error: 'Missing modules parameter' });
    }

    const moduleNames = (modules as string).split(',');

    const settings = await moduleSettingsService.getMultiModuleSettings(
      moduleNames,
      companyId as string | undefined
    );

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error retrieving multi-module settings:', error);
    return res.status(500).json({ error: 'Failed to retrieve multi-module settings' });
  }
});

// User Preferences Routes
router.get('/user-preferences/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { companyId } = req.query;

    const preferences = await userPreferencesService.getUserPreferences(
      userId, 
      companyId as string | undefined
    );

    return res.status(200).json(preferences);
  } catch (error) {
    console.error('Error retrieving user preferences:', error);
    return res.status(500).json({ error: 'Failed to retrieve user preferences' });
  }
});

router.get('/user-preferences/:userId/category/:category', async (req: Request, res: Response) => {
  try {
    const { userId, category } = req.params;
    const { companyId } = req.query;

    const preferences = await userPreferencesService.getPreferencesByCategory(
      userId, 
      category, 
      companyId as string | undefined
    );

    return res.status(200).json(preferences);
  } catch (error) {
    console.error('Error retrieving user preferences by category:', error);
    return res.status(500).json({ error: 'Failed to retrieve user preferences by category' });
  }
});

router.get('/user-preferences/:userId/module/:module', async (req: Request, res: Response) => {
  try {
    const { userId, module } = req.params;
    const { companyId } = req.query;

    const preferences = await userPreferencesService.getPreferencesByModule(
      userId, 
      module, 
      companyId as string | undefined
    );

    return res.status(200).json(preferences);
  } catch (error) {
    console.error('Error retrieving user preferences by module:', error);
    return res.status(500).json({ error: 'Failed to retrieve user preferences by module' });
  }
});

router.get('/user-preferences/:userId/key/:key', async (req: Request, res: Response) => {
  try {
    const { userId, key } = req.params;
    const { companyId } = req.query;

    const preference = await userPreferencesService.getPreference(
      userId, 
      key, 
      companyId as string | undefined
    );

    if (!preference) {
      return res.status(404).json({ error: 'User preference not found' });
    }

    return res.status(200).json(preference);
  } catch (error) {
    console.error('Error retrieving user preference:', error);
    return res.status(500).json({ error: 'Failed to retrieve user preference' });
  }
});

router.post('/user-preferences', async (req: Request, res: Response) => {
  try {
    const preferenceData = req.body;

    // Validate required fields
    if (!preferenceData.userId || !preferenceData.key || !preferenceData.value || !preferenceData.category) {
      return res.status(400).json({ 
        error: 'Missing required fields (userId, key, value, category)' 
      });
    }

    const createdPreference = await userPreferencesService.createPreference(preferenceData);
    return res.status(201).json(createdPreference);
  } catch (error) {
    console.error('Error creating user preference:', error);
    return res.status(500).json({ error: 'Failed to create user preference' });
  }
});

router.put('/user-preferences/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const preferenceData = req.body;

    const updatedPreference = await userPreferencesService.updatePreference(id, preferenceData);

    if (!updatedPreference) {
      return res.status(404).json({ error: 'User preference not found' });
    }

    return res.status(200).json(updatedPreference);
  } catch (error) {
    console.error('Error updating user preference:', error);
    return res.status(500).json({ error: 'Failed to update user preference' });
  }
});

router.delete('/user-preferences/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedPreference = await userPreferencesService.deletePreference(id);

    if (!deletedPreference) {
      return res.status(404).json({ error: 'User preference not found' });
    }

    return res.status(200).json(deletedPreference);
  } catch (error) {
    console.error('Error deleting user preference:', error);
    return res.status(500).json({ error: 'Failed to delete user preference' });
  }
});

// UI Theme Routes
router.get('/themes/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const themes = await uiThemeService.getCompanyThemes(companyId);
    return res.status(200).json(themes);
  } catch (error) {
    console.error('Error retrieving company themes:', error);
    return res.status(500).json({ error: 'Failed to retrieve company themes' });
  }
});

router.get('/themes/:companyId/default', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const defaultTheme = await uiThemeService.getDefaultTheme(companyId);

    if (!defaultTheme) {
      return res.status(404).json({ error: 'Default theme not found' });
    }

    return res.status(200).json(defaultTheme);
  } catch (error) {
    console.error('Error retrieving default theme:', error);
    return res.status(500).json({ error: 'Failed to retrieve default theme' });
  }
});

router.get('/themes/id/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const theme = await uiThemeService.getThemeById(id);

    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    return res.status(200).json(theme);
  } catch (error) {
    console.error('Error retrieving theme:', error);
    return res.status(500).json({ error: 'Failed to retrieve theme' });
  }
});

router.post('/themes', async (req: Request, res: Response) => {
  try {
    const themeData = req.body;

    // Validate required fields
    if (!themeData.companyId || !themeData.name || !themeData.colors) {
      return res.status(400).json({ 
        error: 'Missing required fields (companyId, name, colors)' 
      });
    }

    const createdTheme = await uiThemeService.createTheme(themeData);
    return res.status(201).json(createdTheme);
  } catch (error) {
    console.error('Error creating theme:', error);
    return res.status(500).json({ error: 'Failed to create theme' });
  }
});

router.put('/themes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const themeData = req.body;

    const updatedTheme = await uiThemeService.updateTheme(id, themeData);

    if (!updatedTheme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    return res.status(200).json(updatedTheme);
  } catch (error) {
    console.error('Error updating theme:', error);
    return res.status(500).json({ error: 'Failed to update theme' });
  }
});

router.put('/themes/:id/set-default', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const defaultTheme = await uiThemeService.setAsDefault(id);

    if (!defaultTheme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    return res.status(200).json(defaultTheme);
  } catch (error) {
    console.error('Error setting theme as default:', error);
    return res.status(500).json({ error: 'Failed to set theme as default' });
  }
});

router.delete('/themes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedTheme = await uiThemeService.deleteTheme(id);

    if (!deletedTheme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    return res.status(200).json(deletedTheme);
  } catch (error) {
    console.error('Error deleting theme:', error);
    return res.status(500).json({ error: 'Failed to delete theme' });
  }
});

/**
 * Setup Placeholder Endpoint
 * 
 * This endpoint provides a placeholder for the system setup functionality
 * that will be fully implemented in future releases.
 */
router.post('/setup-placeholder', async (req: Request, res: Response) => {
  try {
    const { companyId, steps } = req.body;

    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: companyId' 
      });
    }

    // For now, simply return a success response
    // This will be expanded in future implementations to track setup progress
    return res.status(200).json({
      success: true,
      message: 'Setup placeholder processed successfully',
      data: {
        companyId,
        stepsReceived: steps?.length || 0,
        requestedBy: 'anonymous', // We're not using user data from req.user here to avoid type issues
        setupTracking: 'This feature will be fully implemented in future releases'
      }
    });
  } catch (error) {
    console.error('Error in setup placeholder endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred processing setup placeholder request' 
    });
  }
});

export default router;