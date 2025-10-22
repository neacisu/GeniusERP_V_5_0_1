/**
 * Settings Schema
 * 
 * This file defines the database schema for settings management in the application.
 * It includes tables for global settings, module-specific settings, user preferences,
 * and feature toggles.
 */

import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean, 
  jsonb, 
  varchar,
  primaryKey,
  index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { companies } from '../../company/schema/company.schema';
import { users } from '@shared/schema';

/**
 * Global Settings
 * Stores system-wide and company-level settings
 */
export const globalSettings = pgTable('settings_global', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  key: varchar('key', { length: 100 }).notNull(),
  value: jsonb('value').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  module: varchar('module', { length: 50 }),
  description: text('description'),
  isSystemWide: boolean('is_system_wide').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  keyCompanyIdx: index('settings_global_key_company_idx').on(table.key, table.companyId),
  moduleCompanyIdx: index('settings_global_module_company_idx').on(table.module, table.companyId),
}));

/**
 * User Preferences
 * Stores user-specific preferences and settings
 */
export const userPreferences = pgTable('settings_user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  key: varchar('key', { length: 100 }).notNull(),
  value: jsonb('value').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  module: varchar('module', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userKeyIdx: index('settings_user_preferences_user_key_idx').on(table.userId, table.key),
  userModuleIdx: index('settings_user_preferences_user_module_idx').on(table.userId, table.module),
}));

/**
 * Feature Toggles
 * Stores feature flags for enabling/disabling functionality
 */
export const featureToggles = pgTable('settings_feature_toggles', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  feature: varchar('feature', { length: 100 }).notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  featureCompanyIdx: index('settings_feature_toggles_feature_company_idx').on(table.feature, table.companyId),
  moduleCompanyIdx: index('settings_feature_toggles_module_company_idx').on(table.module, table.companyId),
}));

/**
 * UI Themes
 * Stores theme configuration for UI customization
 */
export const uiThemes = pgTable('settings_ui_themes', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  colors: jsonb('colors').notNull(),
  fonts: jsonb('fonts'),
  logos: jsonb('logos'),
  customCss: text('custom_css'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
});

/**
 * Setup Steps
 * Tracks the progress of system setup and onboarding steps
 */
export const setupSteps = pgTable('setup_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  franchiseId: uuid('franchise_id').references(() => companies.id),
  step: varchar('step', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('not_started'),
  metadata: jsonb('metadata'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  companyStepIdx: index('setup_steps_company_step_idx').on(table.companyId, table.step),
  franchiseStepIdx: index('setup_steps_franchise_step_idx').on(table.franchiseId, table.step),
}));