/**
 * Admin Schema - Setup Steps Tracking
 * 
 * This schema defines the setup_steps model for tracking system configuration
 * and onboarding progress per company/franchise. It enables:
 * - Real-time setup state display
 * - Feature gating based on completion status
 * - Guided administrator setup flows
 * - Compliance with system initialization standards (Section 2.2.2.9)
 */

import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';

export const setup_steps = pgTable('setup_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  franchise_id: varchar('franchise_id', { length: 36 }),
  step: varchar('step', { length: 100 }).notNull(), // e.g. 'create-user', 'setup-invoice-series'
  status: varchar('status', { length: 20 }).default('pending'), // 'done', 'skipped', 'pending'
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
}, (table) => ({
  setupIndex: index('setup_step_idx').on(table.company_id, table.franchise_id, table.created_at),
}));