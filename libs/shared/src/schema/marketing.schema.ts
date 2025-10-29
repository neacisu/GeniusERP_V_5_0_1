/**
 * Marketing Module Schema - Drizzle ORM Definitions
 * 
 * This file defines the database schema for the Marketing module tables
 * using Drizzle ORM with specific customizations for campaign management
 * and integration with the Communications module.
 */

import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  pgEnum, 
  json,
  index,
  unique,
  boolean,
  real,
  date,
  integer
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { channelEnum } from "./communications.schema";

/**
 * Campaign Status enum
 */
export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

/**
 * Campaign Type enum
 */
export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  SOCIAL = 'social',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
  MULTI_CHANNEL = 'multi_channel'
}

/**
 * Audience Type enum
 */
export enum AudienceType {
  SEGMENT = 'segment',
  LIST = 'list',
  CUSTOM = 'custom',
  ALL_CUSTOMERS = 'all_customers',
  FILTERED = 'filtered'
}

// Define PostgreSQL enums
export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled', 'failed'
]);
export const campaignTypeEnum = pgEnum('campaign_type', [
  'email', 'sms', 'social', 'push', 'whatsapp', 'multi_channel'
]);
export const audienceTypeEnum = pgEnum('audience_type', [
  'segment', 'list', 'custom', 'all_customers', 'filtered'
]);

/**
 * Campaigns Table
 * 
 * This table stores marketing campaigns that can send messages through
 * various communication channels.
 */
export const marketing_campaigns = pgTable('marketing_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: campaignTypeEnum('type').notNull(),
  status: campaignStatusEnum('status').default(CampaignStatus.DRAFT).notNull(),
  
  // Content fields
  subject: text('subject'),
  content: text('content'),
  contentHtml: text('content_html'),
  templateId: uuid('template_id'),
  
  // Channel configuration
  channels: json('channels').default([]).notNull(), // Array of channel IDs
  primaryChannel: channelEnum('primary_channel'), // From communications_schema
  
  // Schedule fields
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  // Audience targeting
  audienceType: audienceTypeEnum('audience_type').notNull(),
  audienceId: uuid('audience_id'), // ID of the segment or list
  audienceFilter: json('audience_filter').default({}), // For filtered audiences
  estimatedReach: integer('estimated_reach'),
  
  // Campaign statistics
  sentCount: integer('sent_count').default(0),
  deliveredCount: integer('delivered_count').default(0),
  openCount: integer('open_count').default(0),
  clickCount: integer('click_count').default(0),
  bounceCount: integer('bounce_count').default(0),
  responseCount: integer('response_count').default(0),
  
  // A/B Testing
  isAbTest: boolean('is_ab_test').default(false),
  abTestVariants: json('ab_test_variants').default([]),
  abTestWinnerVariant: text('ab_test_winner_variant'),
  
  // Additional settings
  settings: json('settings').default({}),
  metadata: json('metadata').default({}),
  
  // Tracking fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => {
  return {
    companyIdIdx: index('marketing_campaigns_company_id_idx').on(table.companyId),
    typeIdx: index('marketing_campaigns_type_idx').on(table.type),
    statusIdx: index('marketing_campaigns_status_idx').on(table.status),
    audienceTypeIdx: index('marketing_campaigns_audience_type_idx').on(table.audienceType),
    scheduledAtIdx: index('marketing_campaigns_scheduled_at_idx').on(table.scheduledAt)
  };
});

/**
 * Campaign Messages Table
 * 
 * This table links messages from the communications module to campaigns,
 * allowing tracking of which messages were sent as part of which campaign.
 */
export const marketing_campaign_messages = pgTable('marketing_campaign_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => marketing_campaigns.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').notNull(), // References communications_messages.id
  companyId: uuid('company_id').notNull(),
  recipientId: uuid('recipient_id').notNull(), // References communications_contacts.id
  status: text('status').notNull(), // Message delivery status
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  bouncedAt: timestamp('bounced_at'),
  bounceReason: text('bounce_reason'),
  metadata: json('metadata').default({}),
  variantId: text('variant_id'), // For A/B testing
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    campaignIdIdx: index('marketing_campaign_messages_campaign_id_idx').on(table.campaignId),
    messageIdIdx: index('marketing_campaign_messages_message_id_idx').on(table.messageId),
    recipientIdIdx: index('marketing_campaign_messages_recipient_id_idx').on(table.recipientId),
    statusIdx: index('marketing_campaign_messages_status_idx').on(table.status),
    uniqueMessageCampaign: unique('marketing_campaign_messages_unique').on(table.campaignId, table.messageId)
  };
});

/**
 * Campaign Segments Table
 * 
 * This table defines customer segments for targeted marketing campaigns.
 */
export const marketing_campaign_segments = pgTable('marketing_campaign_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  filterCriteria: json('filter_criteria').default({}),
  estimatedReach: integer('estimated_reach'),
  isActive: boolean('is_active').default(true),
  lastRefreshedAt: timestamp('last_refreshed_at'),
  metadata: json('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => {
  return {
    companyIdIdx: index('marketing_campaign_segments_company_id_idx').on(table.companyId),
    uniqueNamePerCompany: unique('marketing_campaign_segments_name_company_idx').on(table.name, table.companyId)
  };
});

/**
 * Campaign Templates Table
 * 
 * This table stores reusable content templates for marketing campaigns.
 */
export const marketing_campaign_templates = pgTable('marketing_campaign_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: campaignTypeEnum('type').notNull(),
  subject: text('subject'),
  content: text('content'),
  contentHtml: text('content_html'),
  previewImage: text('preview_image'),
  category: text('category'),
  isActive: boolean('is_active').default(true),
  metadata: json('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => {
  return {
    companyIdIdx: index('marketing_campaign_templates_company_id_idx').on(table.companyId),
    typeIdx: index('marketing_campaign_templates_type_idx').on(table.type),
    categoryIdx: index('marketing_campaign_templates_category_idx').on(table.category)
  };
});

// Create Zod schemas for validation and insertion

export const insertCampaignSchema = createInsertSchema(marketing_campaigns, {
  id: z.string().uuid().optional(),
  type: z.nativeEnum(CampaignType),
  status: z.nativeEnum(CampaignStatus).optional(),
  audienceType: z.nativeEnum(AudienceType),
  channels: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertCampaignMessageSchema = createInsertSchema(marketing_campaign_messages, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertCampaignSegmentSchema = createInsertSchema(marketing_campaign_segments, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertCampaignTemplateSchema = createInsertSchema(marketing_campaign_templates, {
  id: z.string().uuid().optional(),
  type: z.nativeEnum(CampaignType),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

// Type definitions for inference

export type CampaignInsert = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type CampaignMessageInsert = z.infer<typeof insertCampaignMessageSchema>;
export type CampaignMessage = typeof campaignMessages.$inferSelect;

export type CampaignSegmentInsert = z.infer<typeof insertCampaignSegmentSchema>;
export type CampaignSegment = typeof campaignSegments.$inferSelect;

export type CampaignTemplateInsert = z.infer<typeof insertCampaignTemplateSchema>;
export type CampaignTemplate = typeof campaignTemplates.$inferSelect;