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
  pgEnum,
  index
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { companies, users } from '@geniuserp/shared';

/**
 * ANAF Company Data - Stocare completă a datelor preluate de la ANAF
 */
export const anafCompanyData = pgTable("anaf_company_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id), // Eliminat notNull() pentru a permite salvarea de date ANAF independente
  customerId: uuid("customer_id").references(() => customers.id),
  
  // Date generale
  cui: text("cui").notNull(),
  dataInterogare: date("data_interogare").notNull(),
  denumire: text("denumire"),
  adresa: text("adresa"),
  nrRegCom: text("nr_reg_com"),
  telefon: text("telefon"),
  fax: text("fax"),
  codPostal: text("cod_postal"),
  act: text("act"),
  stareInregistrare: text("stare_inregistrare"),
  dataInregistrare: date("data_inregistrare"),
  codCAEN: text("cod_caen"),
  iban: text("iban"),
  statusROeFactura: boolean("status_ro_e_factura").default(false),
  organFiscalCompetent: text("organ_fiscal_competent"),
  formaDeProprietate: text("forma_de_proprietate"),
  formaOrganizare: text("forma_organizare"),
  formaJuridica: text("forma_juridica"),
  
  // Înregistrare în scop de TVA
  scpTVA: boolean("scp_tva").default(false),
  
  // Ultima perioadă TVA (cea activă)
  dataInceputScpTVA: date("data_inceput_scp_tva"),
  dataSfarsitScpTVA: date("data_sfarsit_scp_tva"),
  dataAnulImpScpTVA: date("data_anul_imp_scp_tva"),
  mesajScpTVA: text("mesaj_scp_tva"),
  
  // Înregistrare TVA la încasare
  dataInceputTvaInc: date("data_inceput_tva_inc"),
  dataSfarsitTvaInc: date("data_sfarsit_tva_inc"),
  dataActualizareTvaInc: date("data_actualizare_tva_inc"),
  dataPublicareTvaInc: date("data_publicare_tva_inc"),
  tipActTvaInc: text("tip_act_tva_inc"),
  statusTvaIncasare: boolean("status_tva_incasare").default(false),
  
  // Stare inactiv
  dataInactivare: date("data_inactivare"),
  dataReactivare: date("data_reactivare"),
  dataPublicare: date("data_publicare"),
  dataRadiere: date("data_radiere"),
  statusInactivi: boolean("status_inactivi").default(false),
  
  // Split TVA
  dataInceputSplitTVA: date("data_inceput_split_tva"),
  dataAnulareSplitTVA: date("data_anulare_split_tva"),
  statusSplitTVA: boolean("status_split_tva").default(false),
  
  // Adresa sediu social
  sdenumireStrada: text("ss_denumire_strada"),
  snumarStrada: text("ss_numar_strada"),
  sdenumireLocalitate: text("ss_denumire_localitate"),
  scodLocalitate: text("ss_cod_localitate"),
  sdenumireJudet: text("ss_denumire_judet"),
  scodJudet: text("ss_cod_judet"),
  scodJudetAuto: text("ss_cod_judet_auto"),
  stara: text("ss_tara"),
  sdetaliiAdresa: text("ss_detalii_adresa"),
  scodPostal: text("ss_cod_postal"),
  
  // Adresa domiciliu fiscal
  ddenumireStrada: text("df_denumire_strada"),
  dnumarStrada: text("df_numar_strada"),
  ddenumireLocalitate: text("df_denumire_localitate"),
  dcodLocalitate: text("df_cod_localitate"),
  ddenumireJudet: text("df_denumire_judet"),
  dcodJudet: text("df_cod_judet"),
  dcodJudetAuto: text("df_cod_judet_auto"),
  dtara: text("df_tara"),
  ddetaliiAdresa: text("df_detalii_adresa"),
  dcodPostal: text("df_cod_postal"),
  
  // Istoricul tuturor perioadelor de TVA
  perioadeTVA: json("perioade_tva").default([]),
  
  // Date și metadate
  rawResponse: json("raw_response"), // Răspunsul complet de la ANAF
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  
  // Flags pentru integrarea cu modulele interne
  isAdditionalInfoLoaded: boolean("is_additional_info_loaded").default(false),
  isUpdatedFromAnaf: boolean("is_updated_from_anaf").default(true),
  observatii: text("observatii"),
}, (anafData) => ({
  cuiIdx: index("anaf_company_cui_idx").on(anafData.cui),
  customerIdx: index("anaf_company_customer_idx").on(anafData.customerId),
  companyIdx: index("anaf_company_company_idx").on(anafData.companyId),
}));

/**
 * CRM Companies - Entities representing customer organizations in the CRM system
 */
export const crm_companies: any = pgTable("crm_companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  industry: text("industry"),
  size: text("size"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country"),
  vatNumber: text("vat_number"),
  registrationNumber: text("registration_number"),
  cui: text("cui").unique(), // CUI field for storing formatted tax ID
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  companyId: uuid("company_id").references(() => companies.id),
  status: text("status").default("active"),
  customFields: json("custom_fields").default({}),
  logoUrl: text("logo_url"),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  parentCompanyId: uuid("parent_company_id").references(() => crm_companies.id),
  annualRevenue: numeric("annual_revenue"),
  isCustomer: boolean("is_customer").default(true),
  isSupplier: boolean("is_supplier").default(false),
  // Câmpuri pentru conturile analitice
  analythic_401: text("analythic_401"), // Cont analitic furnizori (401.x)
  analythic_4111: text("analythic_4111") // Cont analitic clienți (4111.x)
}, (crmCompany) => ({
  cuiIdx: index("crm_company_cui_idx").on(crmCompany.cui),
  companyIdIdx: index("crm_company_company_id_idx").on(crmCompany.companyId)
}));

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
  expectedDays: integer("expected_days").default(0), // Legacy field, maintained for compatibility
  displayOrder: integer("display_order").default(0),
  sortOrder: integer("sort_order").default(0), // Legacy field for ordering, maintained for compatibility
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
  title: text("title").notNull(),
  description: text("description"),
  activityType: text("activity_type").notNull(), // call, meeting, email, task, note
  status: text("status").default("pending"), // pending, completed, cancelled
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  dealId: uuid("deal_id").references(() => deals.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  clientCompanyId: uuid("client_company_id").references(() => crm_companies.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  outcome: text("outcome"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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

// The companies and users tables are imported at the top of the file

// Define relations for Drizzle ORM

export const anafCompanyDataRelations = relations(anafCompanyData, ({ one }) => ({
  company: one(companies, {
    fields: [anafCompanyData.companyId],
    references: [companies.id]
  }),
  customer: one(customers, {
    fields: [anafCompanyData.customerId],
    references: [customers.id]
  }),
  createdByUser: one(users, {
    fields: [anafCompanyData.createdBy],
    references: [users.id]
  }),
  updatedByUser: one(users, {
    fields: [anafCompanyData.updatedBy],
    references: [users.id]
  })
}));

export const crmCompaniesRelations = relations(crm_companies, ({ one, many }) => ({
  company: one(companies, {
    fields: [crm_companies.companyId],
    references: [companies.id]
  }),
  parentCompany: one(crm_companies, {
    fields: [crm_companies.parentCompanyId],
    references: [crm_companies.id]
  }),
  createdByUser: one(users, {
    fields: [crm_companies.createdBy],
    references: [users.id]
  }),
  updatedByUser: one(users, {
    fields: [crm_companies.updatedBy],
    references: [users.id]
  }),
  activities: many(activities)
}));

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
  clientCompany: one(crm_companies, {
    fields: [activities.clientCompanyId],
    references: [crm_companies.id]
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
// Fix for drizzle-zod compatibility issue - remove omit() completely
export const insertAnafCompanyDataSchema = createInsertSchema(anafCompanyData);

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
export type AnafCompanyData = typeof anafCompanyData.$inferSelect;

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
export type InsertAnafCompanyData = z.infer<typeof insertAnafCompanyDataSchema>;