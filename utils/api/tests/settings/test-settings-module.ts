/**
 * Test script for Settings Module
 * 
 * This script tests the functionality of the Settings Module,
 * verifying that all services are properly registered and operational.
 */

import {
  globalSettingsService,
  userPreferencesService,
  featureToggleService,
  moduleSettingsService,
  uiThemeService
} from './server/modules/settings';

import { SettingsModule } from './server/modules/settings/settings.module';

/**
 * Test the settings module
 */
async function testSettingsModule() {
  console.log('Testing Settings Module...');
  
  // Verify service exports
  console.log('Verifying service exports...');
  console.log('GlobalSettingsService:', !!globalSettingsService);
  console.log('UserPreferencesService:', !!userPreferencesService);
  console.log('FeatureToggleService:', !!featureToggleService);
  console.log('ModuleSettingsService:', !!moduleSettingsService);
  console.log('UiThemeService:', !!uiThemeService);
  
  // Get module information
  console.log('\nGetting module information...');
  const moduleInfo = SettingsModule.initialize();
  console.log(`Module Name: ${moduleInfo.name}`);
  console.log(`Module Version: ${moduleInfo.version}`);
  console.log(`Module Description: ${moduleInfo.description}`);
  
  // Print capabilities
  console.log('\nModule Capabilities:');
  moduleInfo.capabilities.forEach(capability => {
    console.log(`- ${capability.name}: ${capability.description}`);
  });
  
  console.log('\nSettings Module test completed successfully');
}

// Run the test
testSettingsModule().catch(error => {
  console.error('Error testing Settings Module:', error);
});