/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Communications Module Schema - Drizzle ORM Definitions
 * 
 * This file defines the database schema for the Communications module tables
 * using Drizzle ORM with specific customizations for universal inbox support.
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
  real
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Communication Channel enum 
 */
export enum CommunicationChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  MESSENGER = 'messenger',
  COMMENT = 'comment',
  CALL = 'call',
  SHOPIFY_INBOX = 'shopify-inbox',
  SMS = 'sms',
  CONTACT_FORM = 'contact-form',
  CHAT = 'chat',
  OTHER = 'other'
}

/**
 * Message Direction enum
 */
export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  INTERNAL = 'internal'
}

/**
 * Message Status enum
 */
export enum MessageStatus {
  NEW = 'new',
  READ = 'read',
  RESPONDED = 'responded',
  ARCHIVED = 'archived',
  SPAM = 'spam',
  DELETED = 'deleted',
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  DRAFT = 'draft'
}

/**
 * Sentiment Type enum
 */
export enum SentimentType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  MIXED = 'mixed'
}

// Define the PostgreSQL enums
export const channelEnum = pgEnum('communication_channel', ['email', 'whatsapp', 'messenger', 'comment', 'call', 'shopify-inbox', 'sms', 'contact-form', 'chat', 'other']);
export const directionEnum = pgEnum('message_direction', ['inbound', 'outbound', 'internal']);
export const statusEnum = pgEnum('message_status', ['new', 'read', 'responded', 'archived', 'spam', 'deleted', 'pending', 'scheduled', 'draft']);
export const sentimentEnum = pgEnum('sentiment_type', ['positive', 'negative', 'neutral', 'mixed']);

/**
 * Message Threads Table
 * 
 * This table stores communication threads (conversations) across different channels.
 */
export const communications_threads = pgTable('communications_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  subject: text('subject'),
  channel: channelEnum('channel').notNull(),
  externalThreadId: text('external_thread_id'),
  status: statusEnum('status').default(MessageStatus.NEW),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  assignedTo: uuid('assigned_to'),
  customerId: uuid('customer_id'),
  contactId: uuid('contact_id'),
  metadata: json('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => {
  return {
    companyIdIdx: index('communications_threads_company_id_idx').on(table.companyId),
    channelIdx: index('communications_threads_channel_idx').on(table.channel),
    customerIdIdx: index('communications_threads_customer_id_idx').on(table.customerId),
    contactIdIdx: index('communications_threads_contact_id_idx').on(table.contactId),
    lastMessageAtIdx: index('communications_threads_last_message_at_idx').on(table.lastMessageAt)
  };
});

/**
 * Messages Table
 * 
 * This table stores individual communications_messages within threads.
 */
export const communications_messages = pgTable('communications_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => communications_threads.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').notNull(),
  channel: channelEnum('channel').notNull(),
  direction: directionEnum('direction').notNull(),
  status: statusEnum('status').default(MessageStatus.NEW),
  fromEmail: text('from_email'),
  fromName: text('from_name'),
  fromPhone: text('from_phone'),
  toEmail: text('to_email'),
  toName: text('to_name'),
  toPhone: text('to_phone'),
  subject: text('subject'),
  body: text('body').notNull(),
  bodyHtml: text('body_html'),
  sentiment: sentimentEnum('sentiment'),
  sentimentScore: real('sentiment_score'),
  externalMessageId: text('external_message_id'),
  externalConversationId: text('external_conversation_id'),
  isFlagged: boolean('is_flagged').default(false),
  readAt: timestamp('read_at'),
  deliveredAt: timestamp('delivered_at'),
  metadata: json('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => {
  return {
    threadIdIdx: index('communications_messages_thread_id_idx').on(table.threadId),
    companyIdIdx: index('communications_messages_company_id_idx').on(table.companyId),
    channelIdx: index('communications_messages_channel_idx').on(table.channel),
    directionIdx: index('communications_messages_direction_idx').on(table.direction),
    sentimentIdx: index('communications_messages_sentiment_idx').on(table.sentiment),
    createdAtIdx: index('communications_messages_created_at_idx').on(table.createdAt)
  };
});

/**
 * Contacts Table
 * 
 * This table stores contact profiles for communication.
 */
export const contacts = pgTable('communications_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  customerId: uuid('customer_id'),
  email: text('email'),
  phone: text('phone'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  displayName: text('display_name'),
  company: text('company'),
  jobTitle: text('job_title'),
  avatarUrl: text('avatar_url'),
  socialProfiles: json('social_profiles').default({}),
  communicationPreferences: json('communication_preferences').default({}),
  optOut: json('opt_out').default({}),
  metadata: json('metadata').default({}),
  externalId: text('external_id'),
  externalSource: text('external_source'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => {
  return {
    companyIdIdx: index('communications_contacts_company_id_idx').on(table.companyId),
    emailIdx: index('communications_contacts_email_idx').on(table.email),
    phoneIdx: index('communications_contacts_phone_idx').on(table.phone),
    customerIdIdx: index('communications_contacts_customer_id_idx').on(table.customerId),
    externalIdIdx: index('communications_contacts_external_id_idx').on(table.externalId)
  };
});

/**
 * Channel Configurations Table
 * 
 * This table stores configuration for communication channels (API keys, credentials, etc.).
 */
export const communications_channel_configs = pgTable('communications_channel_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  companyId: uuid('company_id').notNull(),
  channel: channelEnum('channel').notNull(),
  isActive: boolean('is_active').default(true),
  credentials: text('credentials').notNull(), // Stored encrypted in production
  settings: json('settings').default({}),
  webhookUrl: text('webhook_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
}, (table) => {
  return {
    companyIdIdx: index('communications_channel_configs_company_id_idx').on(table.companyId),
    channelIdx: index('communications_channel_configs_channel_idx').on(table.channel),
    companyChannelIdx: index('communications_channel_configs_company_channel_idx').on(table.companyId, table.channel)
  };
});

/**
 * Message Access Control Table
 * 
 * This table controls user access to specific communications_messages.
 */
export const communications_message_access = pgTable('communications_message_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => communications_messages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  companyId: uuid('company_id').notNull(),
  canView: boolean('can_view').default(true),
  canReply: boolean('can_reply').default(false),
  canDelete: boolean('can_delete').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    messageIdIdx: index('communications_message_access_message_id_idx').on(table.messageId),
    userIdIdx: index('communications_message_access_user_id_idx').on(table.userId),
    companyIdIdx: index('communications_message_access_company_id_idx').on(table.companyId),
    uniqueAccess: unique('communications_message_access_unique').on(table.messageId, table.userId)
  };
});

/**
 * Thread Access Control Table
 * 
 * This table controls user access to specific threads.
 */
export const communications_thread_access = pgTable('communications_thread_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => communications_threads.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  companyId: uuid('company_id').notNull(),
  canView: boolean('can_view').default(true),
  canReply: boolean('can_reply').default(false),
  canAssign: boolean('can_assign').default(false),
  canDelete: boolean('can_delete').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    threadIdIdx: index('communications_thread_access_thread_id_idx').on(table.threadId),
    userIdIdx: index('communications_thread_access_user_id_idx').on(table.userId),
    companyIdIdx: index('communications_thread_access_company_id_idx').on(table.companyId),
    uniqueAccess: unique('communications_thread_access_unique').on(table.threadId, table.userId)
  };
});

// Create Zod schemas for validation and insertion

export const insertMessageThreadSchema = createInsertSchema(communications_threads, {
  id: z.string().uuid().optional(),
  channel: z.nativeEnum(CommunicationChannel),
  status: z.nativeEnum(MessageStatus).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertMessageSchema = createInsertSchema(communications_messages, {
  id: z.string().uuid().optional(),
  channel: z.nativeEnum(CommunicationChannel),
  direction: z.nativeEnum(MessageDirection),
  status: z.nativeEnum(MessageStatus).optional(),
  sentiment: z.nativeEnum(SentimentType).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertContactSchema = createInsertSchema(contacts, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

export const insertChannelConfigSchema = createInsertSchema(communications_channel_configs, {
  id: z.string().uuid().optional(),
  channel: z.nativeEnum(CommunicationChannel),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
}); // Fixed: removed omit() for drizzle-zod compatibility;

// Type definitions for inference

export type MessageThreadInsert = z.infer<typeof insertMessageThreadSchema>;
export type MessageThread = typeof communications_threads.$inferSelect;

export type MessageInsert = z.infer<typeof insertMessageSchema>;
export type Message = typeof communications_messages.$inferSelect;

export type ContactInsert = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type ChannelConfigInsert = z.infer<typeof insertChannelConfigSchema>;
export type ChannelConfig = typeof communications_channel_configs.$inferSelect;