/**
 * Settings Module Index
 * 
 * Main export file for the Settings module, providing access to the module's
 * public interfaces, services, and components.
 */

// Export the schema
export * from './schema/settings.schema';
import { SettingsModule } from './settings.module';

// Initialize the module
export const initSettingsModule = (app: any) => {
  // Register routes
  return SettingsModule.registerRoutes(app);
};

// Export the module class
export { SettingsModule };