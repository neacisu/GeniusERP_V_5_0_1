/**
 * CRM Schema - Drizzle ORM Definitions
 * 
 * This file defines the schema for the CRM module tables using Drizzle ORM.
 * These tables implement a comprehensive CRM system with a Kanban-based sales pipeline
 * featuring contacts, customers, deals, activities, and more.
 */

import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  numeric, 
  date,
  primaryKey,
  json,
  pgEnum
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Customers - Organizations that are the target of sales efforts
 */
export const customers = pgTable("crm_customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  county: text("county"),
  country: text("country").default("Romania"),
  postalCode: text("postal_code"),
  type: text("type").default("lead"), // lead, prospect, customer, partner, etc.
  segment: text("segment"), // Enterprise, SMB, Startup, etc.
  industry: text("industry"),
  source: text("source"), // Website, Referral, Marketing, etc.
  leadScore: integer("lead_score").default(0),
  leadStatus: text("lead_status").default("New"), 
  leadQualificationDate: timestamp("lead_qualification_date", { withTimezone: true }),
  ownerId: uuid("owner_id").references(() => users.id),
  fiscalCode: text("fiscal_code"), // CUI / CIF in Romania
  registrationNumber: text("registration_number"), // J40/123/2020 format in Romania
  vatPayer: boolean("vat_payer").default(false),
  website: text("website"),
  notes: text("notes"),
  annualRevenue: numeric("annual_revenue", { precision: 20, scale: 2 }),
  employeeCount: integer("employee_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  customFields: json("custom_fields").default({})
});

/**
 * Contacts - Individual people associated with customer organizations 
 */
export const contacts = pgTable("crm_contacts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").references(() => customers.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  title: text("title"), // Job title
  department: text("department"),
  decisionMaker: boolean("decision_maker").default(false),
  influenceLevel: integer("influence_level").default(5), // 1-10 scale
  preferredContactMethod: text("preferred_contact_method").default("email"),
  notes: text("notes"),
  birthDate: date("birth_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  customFields: json("custom_fields").default({})
});

/**
 * Sales Pipelines - Define different sales processes for different business segments
 */
export const pipelines = pgTable("crm_pipelines", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  displayOrder: integer("display_order").default(0),
  targetDealSize: numeric("target_deal_size", { precision: 20, scale: 2 }),
  targetConversionRate: numeric("target_conversion_rate", { precision: 5, scale: 2 }),
  targetCycleTimeDays: integer("target_cycle_time_days"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  isActive: boolean("is_active").default(true)
});

/**
 * Pipeline Stages - Steps in the sales process (Kanban columns)
 */
export const pipelineStages = pgTable("crm_stages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pipelineId: uuid("pipeline_id").notNull().references(() => pipelines.id, { onDelete: 'cascade' }),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  probability: numeric("probability", { precision: 5, scale: 2 }).default("0"),
  expectedDuration: integer("expected_duration").default(0), // In days
  displayOrder: integer("display_order").default(0),
  color: text("color").default("#808080"),
  stageType: text("stage_type").default("standard"), // standard, qualification, proposal, negotiation, closed_won, closed_lost
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  isActive: boolean("is_active").default(true)
});

/**
 * Deals - Sales opportunities in the pipeline
 */
export const deals = pgTable("crm_deals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  customerId: uuid("customer_id").references(() => customers.id),
  pipelineId: uuid("pipeline_id").notNull().references(() => pipelines.id),
  stageId: uuid("stage_id").notNull().references(() => pipelineStages.id),
  name: text("name").notNull(), // Keep for backward compatibility
  title: text("title").notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 20, scale: 2 }),
  currency: text("currency").default("RON"),
  probability: numeric("probability", { precision: 5, scale: 2 }).default("0"),
  expectedCloseDate: date("expected_close_date"),
  actualCloseDate: date("actual_close_date"),
  dealType: text("deal_type").default("New Business"), // New Business, Upsell, Renewal, etc.
  priority: text("priority").default("medium"), // low, medium, high
  source: text("source"),
  ownerId: uuid("owner_id").references(() => users.id),
  healthScore: integer("health_score").default(50), // 0-100 scale
  status: text("status").default("open"), // open, won, lost
  wonReason: text("won_reason"),
  lostReason: text("lost_reason"),
  lostCompetitor: text("lost_competitor"),
  products: json("products").default([]), // List of products in the deal
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  customFields: json("custom_fields").default({})
});

/**
 * Deal Stage History - Track stage transitions for analytics
 */
export const dealStageHistory = pgTable("crm_stage_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: uuid("deal_id").notNull().references(() => deals.id, { onDelete: 'cascade' }),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  fromStageId: uuid("from_stage_id").references(() => pipelineStages.id),
  toStageId: uuid("to_stage_id").notNull().references(() => pipelineStages.id),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow(), // Renamed from transitionDate to match DB
  timeInStage: integer("time_in_stage"), // Renamed from daysInStage to match DB
  changedBy: uuid("changed_by").references(() => users.id), // Renamed from userId to match DB
  notes: text("notes")
});

/**
 * Activities - Calls, meetings, emails, tasks associated with deals and contacts
 */
export const activities = pgTable("crm_activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  dealId: uuid("deal_id").references(() => deals.id),
  customerId: uuid("customer_id").references(() => customers.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  type: text("type").notNull(), // call, meeting, email, task, note
  subject: text("subject").notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  completedDate: timestamp("completed_date", { withTimezone: true }),
  duration: integer("duration"), // In minutes
  outcome: text("outcome"),
  status: text("status").default("pending"), // pending, completed, cancelled
  priority: text("priority").default("medium"), // low, medium, high
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  reminderDate: timestamp("reminder_date", { withTimezone: true }),
  customFields: json("custom_fields").default({})
});

/**
 * Tags - For categorizing and filtering CRM entities
 */
export const tags = pgTable("crm_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  color: text("color").default("#808080"),
  category: text("category").default("general"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id)
});

/**
 * Tag relationships for customers
 */
export const customerTags = pgTable("crm_customer_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: 'cascade' }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id)
});

/**
 * Tag relationships for deals
 */
export const dealTags = pgTable("crm_deal_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: uuid("deal_id").notNull().references(() => deals.id, { onDelete: 'cascade' }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id)
});

/**
 * Revenue Forecasts
 */
export const revenueForecasts = pgTable("crm_revenue_forecasts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  pipeline: numeric("pipeline", { precision: 20, scale: 2 }), // Total value of all deals
  weighted: numeric("weighted", { precision: 20, scale: 2 }), // Probability-weighted value
  bestCase: numeric("best_case", { precision: 20, scale: 2 }), // Best case scenario
  commit: numeric("commit", { precision: 20, scale: 2 }), // Committed forecast
  closed: numeric("closed", { precision: 20, scale: 2 }), // Already closed deals
  forecastAccuracy: numeric("forecast_accuracy", { precision: 5, scale: 2 }),
  currency: text("currency").default("RON"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  calculatedBy: uuid("calculated_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  notes: text("notes")
});

/**
 * Sales Quotas
 */
export const salesQuotas = pgTable("crm_sales_quotas", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  targetAmount: numeric("target_amount", { precision: 20, scale: 2 }),
  actualAmount: numeric("actual_amount", { precision: 20, scale: 2 }),
  targetDeals: integer("target_deals"),
  actualDeals: integer("actual_deals"),
  currency: text("currency").default("RON"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
});

/**
 * Segments (Saved searches/filters)
 */
export const segments = pgTable("crm_segments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  entityType: text("entity_type").notNull(), // customers, contacts, deals
  criteria: json("criteria").notNull(), // JSON with filter criteria
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
});

/**
 * Lead Scoring Rules
 */
export const scoringRules = pgTable("crm_scoring_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  field: text("field").notNull(), // Which field to evaluate
  operator: text("operator").notNull(), // equals, contains, greater_than, etc.
  value: text("value").notNull(), // Value to compare against
  points: integer("points").notNull().default(1), // Points to add/subtract
  ruleType: text("rule_type").default("demographic"), // demographic, behavioral, engagement
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
});

/**
 * Email Templates
 */
export const emailTemplates = pgTable("crm_email_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  templateType: text("template_type").default("custom"), // custom, system, follow-up, etc.
  variables: json("variables").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
});

// Import references from shared schema
import { 
  companies, 
  users
} from "../../../../shared/schema";

// Define relations for Drizzle ORM

export const customerRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id]
  }),
  owner: one(users, {
    fields: [customers.ownerId],
    references: [users.id]
  }),
  contacts: many(contacts),
  deals: many(deals),
  activities: many(activities),
  tags: many(customerTags)
}));

export const contactRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id]
  }),
  customer: one(customers, {
    fields: [contacts.customerId],
    references: [customers.id]
  }),
  activities: many(activities)
}));

export const pipelineRelations = relations(pipelines, ({ one, many }) => ({
  company: one(companies, {
    fields: [pipelines.companyId],
    references: [companies.id]
  }),
  stages: many(pipelineStages),
  deals: many(deals)
}));

export const pipelineStageRelations = relations(pipelineStages, ({ one, many }) => ({
  company: one(companies, {
    fields: [pipelineStages.companyId],
    references: [companies.id]
  }),
  pipeline: one(pipelines, {
    fields: [pipelineStages.pipelineId],
    references: [pipelines.id]
  }),
  deals: many(deals),
  stageTransitionsTo: many(dealStageHistory, { relationName: "toStage" }),
  stageTransitionsFrom: many(dealStageHistory, { relationName: "fromStage" })
}));

export const dealRelations = relations(deals, ({ one, many }) => ({
  company: one(companies, {
    fields: [deals.companyId],
    references: [companies.id]
  }),
  customer: one(customers, {
    fields: [deals.customerId],
    references: [customers.id]
  }),
  pipeline: one(pipelines, {
    fields: [deals.pipelineId],
    references: [pipelines.id]
  }),
  stage: one(pipelineStages, {
    fields: [deals.stageId],
    references: [pipelineStages.id]
  }),
  owner: one(users, {
    fields: [deals.ownerId],
    references: [users.id]
  }),
  activities: many(activities),
  stageHistory: many(dealStageHistory),
  tags: many(dealTags)
}));

export const dealStageHistoryRelations = relations(dealStageHistory, ({ one }) => ({
  company: one(companies, {
    fields: [dealStageHistory.companyId],
    references: [companies.id]
  }),
  deal: one(deals, {
    fields: [dealStageHistory.dealId],
    references: [deals.id]
  }),
  fromStage: one(pipelineStages, {
    fields: [dealStageHistory.fromStageId],
    references: [pipelineStages.id],
    relationName: "fromStage"
  }),
  toStage: one(pipelineStages, {
    fields: [dealStageHistory.toStageId],
    references: [pipelineStages.id],
    relationName: "toStage"
  }),
  user: one(users, {
    fields: [dealStageHistory.changedBy],
    references: [users.id]
  })
}));

export const activityRelations = relations(activities, ({ one }) => ({
  company: one(companies, {
    fields: [activities.companyId],
    references: [companies.id]
  }),
  deal: one(deals, {
    fields: [activities.dealId],
    references: [deals.id]
  }),
  customer: one(customers, {
    fields: [activities.customerId],
    references: [customers.id]
  }),
  contact: one(contacts, {
    fields: [activities.contactId],
    references: [contacts.id]
  }),
  assignedUser: one(users, {
    fields: [activities.assignedTo],
    references: [users.id]
  }),
  createdByUser: one(users, {
    fields: [activities.createdBy],
    references: [users.id]
  })
}));

export const tagRelations = relations(tags, ({ one, many }) => ({
  company: one(companies, {
    fields: [tags.companyId],
    references: [companies.id]
  }),
  customerTags: many(customerTags),
  dealTags: many(dealTags)
}));

export const customerTagRelations = relations(customerTags, ({ one }) => ({
  company: one(companies, {
    fields: [customerTags.companyId],
    references: [companies.id]
  }),
  customer: one(customers, {
    fields: [customerTags.customerId],
    references: [customers.id]
  }),
  tag: one(tags, {
    fields: [customerTags.tagId],
    references: [tags.id]
  })
}));

export const dealTagRelations = relations(dealTags, ({ one }) => ({
  company: one(companies, {
    fields: [dealTags.companyId],
    references: [companies.id]
  }),
  deal: one(deals, {
    fields: [dealTags.dealId],
    references: [deals.id]
  }),
  tag: one(tags, {
    fields: [dealTags.tagId],
    references: [tags.id]
  })
}));

export const revenueForecastRelations = relations(revenueForecasts, ({ one }) => ({
  company: one(companies, {
    fields: [revenueForecasts.companyId],
    references: [companies.id]
  }),
  calculator: one(users, {
    fields: [revenueForecasts.calculatedBy],
    references: [users.id]
  })
}));

export const salesQuotaRelations = relations(salesQuotas, ({ one }) => ({
  company: one(companies, {
    fields: [salesQuotas.companyId],
    references: [companies.id]
  }),
  user: one(users, {
    fields: [salesQuotas.userId],
    references: [users.id]
  })
}));

export const segmentRelations = relations(segments, ({ one }) => ({
  company: one(companies, {
    fields: [segments.companyId],
    references: [companies.id]
  }),
  creator: one(users, {
    fields: [segments.createdBy],
    references: [users.id]
  })
}));

export const scoringRuleRelations = relations(scoringRules, ({ one }) => ({
  company: one(companies, {
    fields: [scoringRules.companyId],
    references: [companies.id]
  })
}));

export const emailTemplateRelations = relations(emailTemplates, ({ one }) => ({
  company: one(companies, {
    fields: [emailTemplates.companyId],
    references: [companies.id]
  })
}));

// Create Zod schemas for inserts

export const insertCustomerSchema = createInsertSchema(customers);
export const insertContactSchema = createInsertSchema(contacts);
export const insertPipelineSchema = createInsertSchema(pipelines);
export const insertPipelineStageSchema = createInsertSchema(pipelineStages);
export const insertDealSchema = createInsertSchema(deals);
export const insertDealStageHistorySchema = createInsertSchema(dealStageHistory);
export const insertActivitySchema = createInsertSchema(activities);
export const insertTagSchema = createInsertSchema(tags);
export const insertCustomerTagSchema = createInsertSchema(customerTags);
export const insertDealTagSchema = createInsertSchema(dealTags);
export const insertRevenueForecastSchema = createInsertSchema(revenueForecasts);
export const insertSalesQuotaSchema = createInsertSchema(salesQuotas);
export const insertSegmentSchema = createInsertSchema(segments);
export const insertScoringRuleSchema = createInsertSchema(scoringRules);
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);

// Types

export type Customer = typeof customers.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Pipeline = typeof pipelines.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type DealStageHistory = typeof dealStageHistory.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type CustomerTag = typeof customerTags.$inferSelect;
export type DealTag = typeof dealTags.$inferSelect;
export type RevenueForecast = typeof revenueForecasts.$inferSelect;
export type SalesQuota = typeof salesQuotas.$inferSelect;
export type Segment = typeof segments.$inferSelect;
export type ScoringRule = typeof scoringRules.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type InsertDealStageHistory = z.infer<typeof insertDealStageHistorySchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type InsertCustomerTag = z.infer<typeof insertCustomerTagSchema>;
export type InsertDealTag = z.infer<typeof insertDealTagSchema>;
export type InsertRevenueForecast = z.infer<typeof insertRevenueForecastSchema>;
export type InsertSalesQuota = z.infer<typeof insertSalesQuotaSchema>;
export type InsertSegment = z.infer<typeof insertSegmentSchema>;
export type InsertScoringRule = z.infer<typeof insertScoringRuleSchema>;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;