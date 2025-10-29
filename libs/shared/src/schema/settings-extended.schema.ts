/**
 * Settings Extended Schema
 * 
 * Application-wide settings, feature toggles, and user preferences.
 * 
 * Tables:
 * - settings_global: Global application settings (system-wide or company-specific)
 * - settings_feature_toggles: Feature flags for gradual rollout
 * - settings_ui_themes: UI theme configurations
 * - settings_user_preferences: Per-user preference storage
 * 
 * All structures extracted from PostgreSQL DB.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  unique
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================================
// SETTINGS TABLES
// ============================================================================

/**
 * Settings Global table
 * System-wide and company-specific settings
 */
export const settings_global = pgTable('settings_global', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id'),
  key: varchar('key', { length: 100 }).notNull(),
  value: jsonb('value').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  module: varchar('module', { length: 50 }),
  description: text('description'),
  is_system_wide: boolean('is_system_wide').default(false),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`),
  created_by: uuid('created_by'),
  updated_by: uuid('updated_by')
}, (table) => ({
  key_unique: unique('settings_global_key_unique').on(table.key, table.company_id),
  key_idx: index('settings_global_key_idx').on(table.key),
  company_idx: index('settings_global_company_idx').on(table.company_id),
  category_idx: index('settings_global_category_idx').on(table.category),
  module_idx: index('settings_global_module_idx').on(table.module),
  system_wide_idx: index('settings_global_system_wide_idx').on(table.is_system_wide),
}));

/**
 * Settings Feature Toggles table
 * Feature flags for controlled feature rollout
 */
export const settings_feature_toggles = pgTable('settings_feature_toggles', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id'),
  feature: varchar('feature', { length: 100 }).notNull(),
  enabled: boolean('enabled').notNull().default(false),
  module: varchar('module', { length: 50 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`),
  created_by: uuid('created_by'),
  updated_by: uuid('updated_by')
}, (table) => ({
  feature_company_unique: unique('settings_feature_toggles_feature_company_unique').on(table.feature, table.company_id),
  feature_idx: index('settings_feature_toggles_feature_idx').on(table.feature),
  company_idx: index('settings_feature_toggles_company_idx').on(table.company_id),
  module_idx: index('settings_feature_toggles_module_idx').on(table.module),
  enabled_idx: index('settings_feature_toggles_enabled_idx').on(table.enabled),
}));

/**
 * Settings UI Themes table
 * Custom UI themes for white-labeling and branding
 */
export const settings_ui_themes = pgTable('settings_ui_themes', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id'),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  is_default: boolean('is_default').default(false),
  colors: jsonb('colors').notNull(),
  fonts: jsonb('fonts'),
  logos: jsonb('logos'),
  custom_css: text('custom_css'),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`),
  created_by: uuid('created_by'),
  updated_by: uuid('updated_by')
}, (table) => ({
  name_idx: index('settings_ui_themes_name_idx').on(table.name),
  company_idx: index('settings_ui_themes_company_idx').on(table.company_id),
  default_idx: index('settings_ui_themes_default_idx').on(table.is_default),
}));

/**
 * Settings User Preferences table
 * Per-user customizable preferences
 */
export const settings_user_preferences = pgTable('settings_user_preferences', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  company_id: uuid('company_id'),
  key: varchar('key', { length: 100 }).notNull(),
  value: jsonb('value').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  module: varchar('module', { length: 50 }),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  user_key_unique: unique('settings_user_preferences_user_key_unique').on(table.user_id, table.key),
  user_idx: index('settings_user_preferences_user_idx').on(table.user_id),
  key_idx: index('settings_user_preferences_key_idx').on(table.key),
  category_idx: index('settings_user_preferences_category_idx').on(table.category),
  module_idx: index('settings_user_preferences_module_idx').on(table.module),
}));

// ============================================================================
// RELATIONS
// ============================================================================

/**
 * Settings Global Relations
 */
export const settings_globalRelations = relations(settings_global, ({ one }) => ({
  company: one(companies, {
    fields: [settings_global.company_id],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [settings_global.created_by],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [settings_global.updated_by],
    references: [users.id],
  }),
}));

/**
 * Settings Feature Toggles Relations
 */
export const settings_feature_togglesRelations = relations(settings_feature_toggles, ({ one }) => ({
  company: one(companies, {
    fields: [settings_feature_toggles.company_id],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [settings_feature_toggles.created_by],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [settings_feature_toggles.updated_by],
    references: [users.id],
  }),
}));

/**
 * Settings UI Themes Relations
 */
export const settings_ui_themesRelations = relations(settings_ui_themes, ({ one }) => ({
  company: one(companies, {
    fields: [settings_ui_themes.company_id],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [settings_ui_themes.created_by],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [settings_ui_themes.updated_by],
    references: [users.id],
  }),
}));

/**
 * Settings User Preferences Relations
 */
export const settings_user_preferencesRelations = relations(settings_user_preferences, ({ one }) => ({
  user: one(users, {
    fields: [settings_user_preferences.user_id],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [settings_user_preferences.company_id],
    references: [companies.id],
  }),
}));

// Note: Forward references to companies and users will be resolved when schemas are combined

