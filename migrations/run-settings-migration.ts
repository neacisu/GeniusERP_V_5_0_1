/**
 * Settings Schema Migration Script
 * 
 * This script applies the settings schema directly to the database
 * using Drizzle ORM's push method for quick testing and development.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './server/modules/settings/schema/settings.schema';

/**
 * Migrate settings schema
 */
async function migrateSettingsSchema() {
  console.log('Starting settings schema migration...');
  
  try {
    // Create a direct database connection
    const queryClient = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    const db = drizzle(queryClient);
    
    console.log('Connected to database');
    
    // Create global settings table
    console.log('Creating global settings table...');
    await queryClient`
      CREATE TABLE IF NOT EXISTS settings_global (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        key TEXT NOT NULL,
        value JSONB NOT NULL,
        category TEXT NOT NULL,
        module TEXT,
        description TEXT,
        is_system_wide BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID,
        updated_by UUID,
        UNIQUE(company_id, key)
      )
    `;
    
    // Create user preferences table
    console.log('Creating user preferences table...');
    await queryClient`
      CREATE TABLE IF NOT EXISTS settings_user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        company_id UUID,
        key TEXT NOT NULL,
        value JSONB NOT NULL,
        category TEXT NOT NULL,
        module TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, company_id, key)
      )
    `;
    
    // Create feature toggles table
    console.log('Creating feature toggles table...');
    await queryClient`
      CREATE TABLE IF NOT EXISTS settings_feature_toggles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID,
        feature TEXT NOT NULL,
        enabled BOOLEAN DEFAULT FALSE,
        module TEXT NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID,
        updated_by UUID,
        UNIQUE(company_id, feature)
      )
    `;
    
    // Create UI themes table
    console.log('Creating UI themes table...');
    await queryClient`
      CREATE TABLE IF NOT EXISTS settings_ui_themes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        name TEXT NOT NULL,
        colors JSONB NOT NULL,
        fonts JSONB,
        logos JSONB,
        custom_css TEXT,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID,
        updated_by UUID
      )
    `;
    
    console.log('Tables created successfully!');
    
    // Create indexes for better performance
    console.log('Creating indexes...');
    
    // Global settings indexes
    await queryClient`CREATE INDEX IF NOT EXISTS idx_global_settings_company_id ON settings_global(company_id)`;
    await queryClient`CREATE INDEX IF NOT EXISTS idx_global_settings_category ON settings_global(category)`;
    await queryClient`CREATE INDEX IF NOT EXISTS idx_global_settings_module ON settings_global(module)`;
    
    // User preferences indexes
    await queryClient`CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON settings_user_preferences(user_id)`;
    await queryClient`CREATE INDEX IF NOT EXISTS idx_user_preferences_company_id ON settings_user_preferences(company_id)`;
    await queryClient`CREATE INDEX IF NOT EXISTS idx_user_preferences_category ON settings_user_preferences(category)`;
    await queryClient`CREATE INDEX IF NOT EXISTS idx_user_preferences_module ON settings_user_preferences(module)`;
    
    // Feature toggles indexes
    await queryClient`CREATE INDEX IF NOT EXISTS idx_feature_toggles_company_id ON settings_feature_toggles(company_id)`;
    await queryClient`CREATE INDEX IF NOT EXISTS idx_feature_toggles_module ON settings_feature_toggles(module)`;
    
    // UI themes indexes
    await queryClient`CREATE INDEX IF NOT EXISTS idx_ui_themes_company_id ON settings_ui_themes(company_id)`;
    await queryClient`CREATE INDEX IF NOT EXISTS idx_ui_themes_is_default ON settings_ui_themes(is_default)`;
    
    console.log('Indexes created successfully!');
    console.log('Settings schema migration completed successfully');
    
    await queryClient.end();
  } catch (error) {
    console.error('Error migrating settings schema:', error);
    process.exit(1);
  }
}

// Run the migration
migrateSettingsSchema();