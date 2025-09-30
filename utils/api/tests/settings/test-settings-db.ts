/**
 * Settings Module Database Test
 * 
 * This script tests database operations for the Settings Module,
 * including creating, retrieving, updating, and deleting settings.
 */

import {
  globalSettingsService,
  featureToggleService,
  moduleSettingsService
} from './server/modules/settings';

import { getDrizzle } from './server/common/drizzle';
import { globalSettings, featureToggles } from './server/modules/settings/schema/settings.schema';
import { sql } from 'drizzle-orm';

// Global company ID for testing
const TEST_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Create schema for testing
 */
async function createSchema() {
  const db = getDrizzle();
  
  console.log('Creating test schema...');
  
  // Create the tables for testing
  try {
    // Create global settings table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings_global (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        key VARCHAR(100) NOT NULL,
        value JSONB NOT NULL,
        category VARCHAR(50) NOT NULL,
        module VARCHAR(50),
        description TEXT,
        is_system_wide BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by UUID,
        updated_by UUID
      )
    `);
    
    // Create feature toggles table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings_feature_toggles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        feature VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT FALSE NOT NULL,
        module VARCHAR(50) NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by UUID,
        updated_by UUID
      )
    `);
    
    console.log('Test schema created successfully');
    return true;
  } catch (error) {
    console.error('Error creating test schema:', error);
    return false;
  }
}

/**
 * Test global settings service
 */
async function testGlobalSettings() {
  console.log('\nTesting Global Settings Service...');
  
  try {
    // Create a test setting
    console.log('Creating test setting...');
    const settingData = {
      companyId: TEST_COMPANY_ID,
      key: 'test-setting',
      value: { testValue: 'This is a test value' },
      category: 'test',
      description: 'A test setting',
      isSystemWide: false,
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID
    };
    
    const createdSetting = await globalSettingsService.createSetting(settingData);
    console.log('Created setting:', createdSetting?.id || 'Failed to create');
    
    if (createdSetting) {
      // Retrieve the setting
      console.log('Retrieving setting...');
      const retrievedSetting = await globalSettingsService.getSetting('test-setting', TEST_COMPANY_ID);
      console.log('Retrieved setting:', !!retrievedSetting, retrievedSetting?.value);
      
      // Update the setting
      console.log('Updating setting...');
      const updatedSetting = await globalSettingsService.updateSetting(
        createdSetting.id,
        {
          value: { testValue: 'Updated test value' },
          updatedBy: TEST_USER_ID
        }
      );
      console.log('Updated setting:', !!updatedSetting);
      
      // Delete the setting
      console.log('Deleting setting...');
      const deletedSetting = await globalSettingsService.deleteSetting(createdSetting.id);
      console.log('Deleted setting:', !!deletedSetting);
    }
    
    return true;
  } catch (error) {
    console.error('Error testing global settings:', error);
    return false;
  }
}

/**
 * Test feature toggle service
 */
async function testFeatureToggles() {
  console.log('\nTesting Feature Toggle Service...');
  
  try {
    // Create a test feature toggle
    console.log('Creating test feature toggle...');
    const toggleData = {
      companyId: TEST_COMPANY_ID,
      feature: 'test-feature',
      enabled: false,
      module: 'test-module',
      description: 'A test feature toggle',
      metadata: { testData: 'This is test metadata' },
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID
    };
    
    const createdToggle = await featureToggleService.createFeatureToggle(toggleData);
    console.log('Created feature toggle:', createdToggle?.id || 'Failed to create');
    
    if (createdToggle) {
      // Check if feature is enabled
      console.log('Checking if feature is enabled...');
      const isEnabled = await featureToggleService.isFeatureEnabled('test-feature', TEST_COMPANY_ID);
      console.log('Feature enabled:', isEnabled);
      
      // Enable the feature
      console.log('Enabling feature...');
      const enabledToggle = await featureToggleService.enableFeature(createdToggle.id, TEST_USER_ID);
      console.log('Enabled feature:', !!enabledToggle, enabledToggle?.enabled);
      
      // Check if feature is enabled after update
      console.log('Checking if feature is enabled after update...');
      const isEnabledAfterUpdate = await featureToggleService.isFeatureEnabled('test-feature', TEST_COMPANY_ID);
      console.log('Feature enabled after update:', isEnabledAfterUpdate);
      
      // Disable the feature
      console.log('Disabling feature...');
      const disabledToggle = await featureToggleService.disableFeature(createdToggle.id, TEST_USER_ID);
      console.log('Disabled feature:', !!disabledToggle, disabledToggle?.enabled);
      
      // Delete the feature toggle
      console.log('Deleting feature toggle...');
      const deletedToggle = await featureToggleService.deleteFeatureToggle(createdToggle.id);
      console.log('Deleted feature toggle:', !!deletedToggle);
    }
    
    return true;
  } catch (error) {
    console.error('Error testing feature toggles:', error);
    return false;
  }
}

/**
 * Test module settings service
 */
async function testModuleSettings() {
  console.log('\nTesting Module Settings Service...');
  
  try {
    // Register default settings for a module
    console.log('Registering default settings for a module...');
    const defaultSettings = [
      {
        key: 'module-setting-1',
        value: { setting1: 'value1' },
        category: 'module-category',
        description: 'Module setting 1'
      },
      {
        key: 'module-setting-2',
        value: { setting2: 'value2' },
        category: 'module-category',
        description: 'Module setting 2'
      }
    ];
    
    const registeredSettings = await moduleSettingsService.registerDefaultSettings(
      'test-module',
      defaultSettings,
      TEST_COMPANY_ID,
      TEST_USER_ID
    );
    
    console.log('Registered settings count:', registeredSettings.length);
    
    // Get all settings for a module
    console.log('Getting all settings for the module...');
    const allModuleSettings = await moduleSettingsService.getAllModuleSettings('test-module', TEST_COMPANY_ID);
    console.log('Module settings count:', allModuleSettings.length);
    
    // Get a specific module setting
    console.log('Getting a specific module setting...');
    const moduleSetting = await moduleSettingsService.getModuleSetting(
      'test-module',
      'module-setting-1', 
      TEST_COMPANY_ID
    );
    console.log('Retrieved module setting:', !!moduleSetting, moduleSetting?.value);
    
    // Get settings for multiple modules
    console.log('Getting settings for multiple modules...');
    const multiModuleSettings = await moduleSettingsService.getMultiModuleSettings(['test-module'], TEST_COMPANY_ID);
    console.log('Multi-module settings:', Object.keys(multiModuleSettings), multiModuleSettings['test-module']?.length);
    
    // Clean up - delete the registered settings
    console.log('Cleaning up registered settings...');
    for (const setting of allModuleSettings) {
      await moduleSettingsService.deleteModuleSetting(setting.id);
    }
    console.log('Cleanup completed');
    
    return true;
  } catch (error) {
    console.error('Error testing module settings:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('Starting Settings Module Database Tests...');
  
  // Create the schema
  const schemaCreated = await createSchema();
  if (!schemaCreated) {
    console.error('Failed to create schema, aborting tests');
    return;
  }
  
  // Run the tests
  const globalSettingsResult = await testGlobalSettings();
  const featureTogglesResult = await testFeatureToggles();
  const moduleSettingsResult = await testModuleSettings();
  
  // Print summary
  console.log('\nTest Results Summary:');
  console.log('GlobalSettingsService:', globalSettingsResult ? 'PASSED' : 'FAILED');
  console.log('FeatureToggleService:', featureTogglesResult ? 'PASSED' : 'FAILED');
  console.log('ModuleSettingsService:', moduleSettingsResult ? 'PASSED' : 'FAILED');
  
  console.log('\nSettings Module Database Tests Completed');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});