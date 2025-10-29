/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * CRM Schema - Drizzle ORM Definitions
 * 
 * This file defines the schema for the CRM module tables using Drizzle ORM.
 * These tables implement a comprehensive CRM system with a Kanban-based sales pipeline
 * featuring crm_contacts, crm_customers, crm_deals, crm_activities, and more.
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
import { companies, users } from "../schema";

/**
 * ANAF Company Data - Stocare completă a datelor preluate de la ANAF
 */
export const anaf_company_data = pgTable("anaf_company_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").references(() => companies.id), // Eliminat notNull() pentru a permite salvarea de date ANAF independente
  customerId: uuid("customer_id").references(() => crm_customers.id),
  
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
export const crm_customers = pgTable("crm_customers", {
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
export const crm_contacts = pgTable("crm_contacts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").references(() => crm_customers.id),
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
 * Sales Pipelines - Define different sales processes for different business crm_segments
 */
export const crm_pipelines = pgTable("crm_pipelines", {
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
export const crm_stages = pgTable("crm_stages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pipelineId: uuid("pipeline_id").notNull().references(() => crm_pipelines.id, { onDelete: 'cascade' }),
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
export const crm_deals = pgTable("crm_deals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  customerId: uuid("customer_id").references(() => crm_customers.id),
  pipelineId: uuid("pipeline_id").notNull().references(() => crm_pipelines.id),
  stageId: uuid("stage_id").notNull().references(() => crm_stages.id),
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
export const crm_stage_history = pgTable("crm_stage_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: uuid("deal_id").notNull().references(() => crm_deals.id, { onDelete: 'cascade' }),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  fromStageId: uuid("from_stage_id").references(() => crm_stages.id),
  toStageId: uuid("to_stage_id").notNull().references(() => crm_stages.id),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow(), // Renamed from transitionDate to match DB
  timeInStage: integer("time_in_stage"), // Renamed from daysInStage to match DB
  changedBy: uuid("changed_by").references(() => users.id), // Renamed from userId to match DB
  notes: text("notes")
});

/**
 * Activities - Calls, meetings, emails, tasks associated with crm_deals and crm_contacts
 */
export const crm_activities = pgTable("crm_activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  activityType: text("activity_type").notNull(), // call, meeting, email, task, note
  status: text("status").default("pending"), // pending, completed, cancelled
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  dealId: uuid("deal_id").references(() => crm_deals.id),
  contactId: uuid("contact_id").references(() => crm_contacts.id),
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
export const crm_tags = pgTable("crm_tags", {
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
 * Tag relationships for crm_customers
 */
export const crm_customer_tags = pgTable("crm_customer_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").notNull().references(() => crm_customers.id, { onDelete: 'cascade' }),
  tagId: uuid("tag_id").notNull().references(() => crm_tags.id, { onDelete: 'cascade' }),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id)
});

/**
 * Tag relationships for crm_deals
 */
export const crm_deal_tags = pgTable("crm_deal_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: uuid("deal_id").notNull().references(() => crm_deals.id, { onDelete: 'cascade' }),
  tagId: uuid("tag_id").notNull().references(() => crm_tags.id, { onDelete: 'cascade' }),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id)
});

/**
 * Revenue Forecasts
 */
export const crm_revenue_forecasts = pgTable("crm_revenue_forecasts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  pipeline: numeric("pipeline", { precision: 20, scale: 2 }), // Total value of all crm_deals
  weighted: numeric("weighted", { precision: 20, scale: 2 }), // Probability-weighted value
  bestCase: numeric("best_case", { precision: 20, scale: 2 }), // Best case scenario
  commit: numeric("commit", { precision: 20, scale: 2 }), // Committed forecast
  closed: numeric("closed", { precision: 20, scale: 2 }), // Already closed crm_deals
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
export const crm_sales_quotas = pgTable("crm_sales_quotas", {
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
export const crm_segments = pgTable("crm_segments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  entityType: text("entity_type").notNull(), // crm_customers, crm_contacts, crm_deals
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
export const crm_scoring_rules = pgTable("crm_scoring_rules", {
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
export const crm_email_templates = pgTable("crm_email_templates", {
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

export const anafCompanyDataRelations = relations(anaf_company_data, ({ one }) => ({
  company: one(companies, {
    fields: [anaf_company_data.companyId],
    references: [companies.id]
  }),
  customer: one(crm_customers, {
    fields: [anaf_company_data.customerId],
    references: [crm_customers.id]
  }),
  createdByUser: one(users, {
    fields: [anaf_company_data.createdBy],
    references: [users.id]
  }),
  updatedByUser: one(users, {
    fields: [anaf_company_data.updatedBy],
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
  crm_activities: many(crm_activities)
}));

export const customerRelations = relations(crm_customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [crm_customers.companyId],
    references: [companies.id]
  }),
  owner: one(users, {
    fields: [crm_customers.ownerId],
    references: [users.id]
  }),
  crm_contacts: many(crm_contacts),
  crm_deals: many(crm_deals),
  crm_activities: many(crm_activities),
  crm_tags: many(crm_customer_tags)
}));

export const contactRelations = relations(crm_contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [crm_contacts.companyId],
    references: [companies.id]
  }),
  customer: one(crm_customers, {
    fields: [crm_contacts.customerId],
    references: [crm_customers.id]
  }),
  crm_activities: many(crm_activities)
}));

export const pipelineRelations = relations(crm_pipelines, ({ one, many }) => ({
  company: one(companies, {
    fields: [crm_pipelines.companyId],
    references: [companies.id]
  }),
  stages: many(crm_stages),
  crm_deals: many(crm_deals)
}));

export const pipelineStageRelations = relations(crm_stages, ({ one, many }) => ({
  company: one(companies, {
    fields: [crm_stages.companyId],
    references: [companies.id]
  }),
  pipeline: one(crm_pipelines, {
    fields: [crm_stages.pipelineId],
    references: [crm_pipelines.id]
  }),
  crm_deals: many(crm_deals),
  stageTransitionsTo: many(crm_stage_history, { relationName: "toStage" }),
  stageTransitionsFrom: many(crm_stage_history, { relationName: "fromStage" })
}));

export const dealRelations = relations(crm_deals, ({ one, many }) => ({
  company: one(companies, {
    fields: [crm_deals.companyId],
    references: [companies.id]
  }),
  customer: one(crm_customers, {
    fields: [crm_deals.customerId],
    references: [crm_customers.id]
  }),
  pipeline: one(crm_pipelines, {
    fields: [crm_deals.pipelineId],
    references: [crm_pipelines.id]
  }),
  stage: one(crm_stages, {
    fields: [crm_deals.stageId],
    references: [crm_stages.id]
  }),
  owner: one(users, {
    fields: [crm_deals.ownerId],
    references: [users.id]
  }),
  crm_activities: many(crm_activities),
  stageHistory: many(crm_stage_history),
  crm_tags: many(crm_deal_tags)
}));

export const dealStageHistoryRelations = relations(crm_stage_history, ({ one }) => ({
  company: one(companies, {
    fields: [crm_stage_history.companyId],
    references: [companies.id]
  }),
  deal: one(crm_deals, {
    fields: [crm_stage_history.dealId],
    references: [crm_deals.id]
  }),
  fromStage: one(crm_stages, {
    fields: [crm_stage_history.fromStageId],
    references: [crm_stages.id],
    relationName: "fromStage"
  }),
  toStage: one(crm_stages, {
    fields: [crm_stage_history.toStageId],
    references: [crm_stages.id],
    relationName: "toStage"
  }),
  user: one(users, {
    fields: [crm_stage_history.changedBy],
    references: [users.id]
  })
}));

export const activityRelations = relations(crm_activities, ({ one }) => ({
  company: one(companies, {
    fields: [crm_activities.companyId],
    references: [companies.id]
  }),
  deal: one(crm_deals, {
    fields: [crm_activities.dealId],
    references: [crm_deals.id]
  }),
  clientCompany: one(crm_companies, {
    fields: [crm_activities.clientCompanyId],
    references: [crm_companies.id]
  }),
  contact: one(crm_contacts, {
    fields: [crm_activities.contactId],
    references: [crm_contacts.id]
  }),
  assignedUser: one(users, {
    fields: [crm_activities.assignedTo],
    references: [users.id]
  }),
  createdByUser: one(users, {
    fields: [crm_activities.createdBy],
    references: [users.id]
  })
}));

export const tagRelations = relations(crm_tags, ({ one, many }) => ({
  company: one(companies, {
    fields: [crm_tags.companyId],
    references: [companies.id]
  }),
  crm_customer_tags: many(crm_customer_tags),
  crm_deal_tags: many(crm_deal_tags)
}));

export const customerTagRelations = relations(crm_customer_tags, ({ one }) => ({
  company: one(companies, {
    fields: [crm_customer_tags.companyId],
    references: [companies.id]
  }),
  customer: one(crm_customers, {
    fields: [crm_customer_tags.customerId],
    references: [crm_customers.id]
  }),
  tag: one(crm_tags, {
    fields: [crm_customer_tags.tagId],
    references: [crm_tags.id]
  })
}));

export const dealTagRelations = relations(crm_deal_tags, ({ one }) => ({
  company: one(companies, {
    fields: [crm_deal_tags.companyId],
    references: [companies.id]
  }),
  deal: one(crm_deals, {
    fields: [crm_deal_tags.dealId],
    references: [crm_deals.id]
  }),
  tag: one(crm_tags, {
    fields: [crm_deal_tags.tagId],
    references: [crm_tags.id]
  })
}));

export const revenueForecastRelations = relations(crm_revenue_forecasts, ({ one }) => ({
  company: one(companies, {
    fields: [crm_revenue_forecasts.companyId],
    references: [companies.id]
  }),
  calculator: one(users, {
    fields: [crm_revenue_forecasts.calculatedBy],
    references: [users.id]
  })
}));

export const salesQuotaRelations = relations(crm_sales_quotas, ({ one }) => ({
  company: one(companies, {
    fields: [crm_sales_quotas.companyId],
    references: [companies.id]
  }),
  user: one(users, {
    fields: [crm_sales_quotas.userId],
    references: [users.id]
  })
}));

export const segmentRelations = relations(crm_segments, ({ one }) => ({
  company: one(companies, {
    fields: [crm_segments.companyId],
    references: [companies.id]
  }),
  creator: one(users, {
    fields: [crm_segments.createdBy],
    references: [users.id]
  })
}));

export const scoringRuleRelations = relations(crm_scoring_rules, ({ one }) => ({
  company: one(companies, {
    fields: [crm_scoring_rules.companyId],
    references: [companies.id]
  })
}));

export const emailTemplateRelations = relations(crm_email_templates, ({ one }) => ({
  company: one(companies, {
    fields: [crm_email_templates.companyId],
    references: [companies.id]
  })
}));

// Create Zod schemas for inserts

export const insertCustomerSchema = createInsertSchema(crm_customers);
export const insertContactSchema = createInsertSchema(crm_contacts);
export const insertPipelineSchema = createInsertSchema(crm_pipelines);
export const insertPipelineStageSchema = createInsertSchema(crm_stages);
export const insertDealSchema = createInsertSchema(crm_deals);
export const insertDealStageHistorySchema = createInsertSchema(crm_stage_history);
export const insertActivitySchema = createInsertSchema(crm_activities);
export const insertTagSchema = createInsertSchema(crm_tags);
export const insertCustomerTagSchema = createInsertSchema(crm_customer_tags);
export const insertDealTagSchema = createInsertSchema(crm_deal_tags);
export const insertRevenueForecastSchema = createInsertSchema(crm_revenue_forecasts);
export const insertSalesQuotaSchema = createInsertSchema(crm_sales_quotas);
export const insertSegmentSchema = createInsertSchema(crm_segments);
export const insertScoringRuleSchema = createInsertSchema(crm_scoring_rules);
export const insertEmailTemplateSchema = createInsertSchema(crm_email_templates);
// Fix for drizzle-zod compatibility issue - remove omit() completely
export const insertAnafCompanyDataSchema = createInsertSchema(anaf_company_data);

// Types

export type Customer = typeof crm_customers.$inferSelect;
export type Contact = typeof crm_contacts.$inferSelect;
export type Pipeline = typeof crm_pipelines.$inferSelect;
export type PipelineStage = typeof crm_stages.$inferSelect;
export type Deal = typeof crm_deals.$inferSelect;
export type DealStageHistory = typeof crm_stage_history.$inferSelect;
export type Activity = typeof crm_activities.$inferSelect;
export type Tag = typeof crm_tags.$inferSelect;
export type CustomerTag = typeof crm_customer_tags.$inferSelect;
export type DealTag = typeof crm_deal_tags.$inferSelect;
export type RevenueForecast = typeof crm_revenue_forecasts.$inferSelect;
export type SalesQuota = typeof crm_sales_quotas.$inferSelect;
export type Segment = typeof crm_segments.$inferSelect;
export type ScoringRule = typeof crm_scoring_rules.$inferSelect;
export type EmailTemplate = typeof crm_email_templates.$inferSelect;
export type AnafCompanyData = typeof anaf_company_data.$inferSelect;

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

// ============================================================================
// ADDITIONAL CRM TABLES (Previously missing from schema)
// ============================================================================

/**
 * CRM Custom Fields
 * Dynamic custom fields for CRM entities
 */
export const crm_custom_fields = pgTable("crm_custom_fields", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  label: text("label").notNull(),
  fieldType: text("field_type").notNull(), // 'text', 'number', 'date', 'select', etc.
  entityType: text("entity_type").notNull(), // 'customer', 'deal', 'contact'
  options: json("options"),
  isRequired: boolean("is_required").default(false),
  defaultValue: text("default_value"),
  placeholder: text("placeholder"),
  helpText: text("help_text"),
  sortOrder: integer("sort_order").default(0),
  companyId: uuid("company_id").notNull(),
  isActive: boolean("is_active").default(true),
  validationRules: json("validation_rules"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => ({
  companyIdx: index("crm_custom_fields_company_idx").on(table.companyId),
  entityTypeIdx: index("crm_custom_fields_entity_type_idx").on(table.entityType),
}));

/**
 * CRM Deal Products
 * Products/services associated with crm_deals
 */
export const crm_deal_products = pgTable("crm_deal_products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: uuid("deal_id").notNull(),
  productId: uuid("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  price: numeric("price", { precision: 20, scale: 2 }).notNull(),
  currency: text("currency").default('RON'),
  discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default('0'),
  discountAmount: numeric("discount_amount", { precision: 20, scale: 2 }).default('0'),
  totalPrice: numeric("total_price", { precision: 20, scale: 2 }).notNull(),
  notes: text("notes"),
  companyId: uuid("company_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => ({
  dealIdx: index("crm_deal_products_deal_idx").on(table.dealId),
  productIdx: index("crm_deal_products_product_idx").on(table.productId),
}));

/**
 * CRM Forecasts
 * Sales forecasting and projections
 */
export const crm_forecasts = pgTable("crm_forecasts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  pipelineId: uuid("pipeline_id").notNull(),
  stageId: uuid("stage_id"),
  period: text("period").notNull(), // 'month', 'quarter', 'year'
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  forecastedValue: numeric("forecasted_value", { precision: 20, scale: 2 }).notNull(),
  actualValue: numeric("actual_value", { precision: 20, scale: 2 }),
  confidence: numeric("confidence", { precision: 5, scale: 2 }), // 0-100%
  notes: text("notes"),
  companyId: uuid("company_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => ({
  pipelineIdx: index("crm_forecasts_pipeline_idx").on(table.pipelineId),
  periodIdx: index("crm_forecasts_period_idx").on(table.periodStart, table.periodEnd),
}));

/**
 * CRM Notes
 * Notes attached to CRM entities (crm_deals, crm_contacts, companies)
 */
export const crm_notes = pgTable("crm_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  dealId: uuid("deal_id"),
  contactId: uuid("contact_id"),
  clientCompanyId: uuid("client_company_id"),
  noteType: text("note_type").default('general'),
  pinned: boolean("pinned").default(false),
  companyId: uuid("company_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => ({
  dealIdx: index("crm_notes_deal_idx").on(table.dealId),
  contactIdx: index("crm_notes_contact_idx").on(table.contactId),
  companyIdx: index("crm_notes_company_idx").on(table.companyId),
}));

/**
 * CRM Taggables
 * Polymorphic tagging system for CRM entities
 */
export const crm_taggables = pgTable("crm_taggables", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tagId: uuid("tag_id").notNull(),
  taggableId: uuid("taggable_id").notNull(),
  taggableType: text("taggable_type").notNull(), // 'customer', 'deal', 'contact'
  companyId: uuid("company_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  tagIdx: index("crm_taggables_tag_idx").on(table.tagId),
  taggableIdx: index("crm_taggables_taggable_idx").on(table.taggableId, table.taggableType),
}));

/**
 * CRM Tasks
 * Task management within CRM context
 */
export const crm_tasks = pgTable("crm_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default('todo'), // 'todo', 'in_progress', 'done'
  priority: text("priority").default('medium'), // 'low', 'medium', 'high', 'urgent'
  dueDate: timestamp("due_date", { withTimezone: true }),
  dealId: uuid("deal_id"),
  contactId: uuid("contact_id"),
  clientCompanyId: uuid("client_company_id"),
  assignedTo: uuid("assigned_to"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  reminderTime: timestamp("reminder_time", { withTimezone: true }),
  companyId: uuid("company_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => ({
  dealIdx: index("crm_tasks_deal_idx").on(table.dealId),
  contactIdx: index("crm_tasks_contact_idx").on(table.contactId),
  assignedIdx: index("crm_tasks_assigned_idx").on(table.assignedTo),
  statusIdx: index("crm_tasks_status_idx").on(table.status),
  dueDateIdx: index("crm_tasks_due_date_idx").on(table.dueDate),
}));

// Relations for new tables

export const crm_custom_fieldsRelations = relations(crm_custom_fields, ({ one }) => ({
  company: one(companies, {
    fields: [crm_custom_fields.companyId],
    references: [companies.id],
  }),
}));

export const crm_deal_productsRelations = relations(crm_deal_products, ({ one }) => ({
  deal: one(crm_deals, {
    fields: [crm_deal_products.dealId],
    references: [crm_deals.id],
  }),
  company: one(companies, {
    fields: [crm_deal_products.companyId],
    references: [companies.id],
  }),
}));

export const crm_forecastsRelations = relations(crm_forecasts, ({ one }) => ({
  pipeline: one(crm_pipelines, {
    fields: [crm_forecasts.pipelineId],
    references: [crm_pipelines.id],
  }),
  stage: one(crm_stages, {
    fields: [crm_forecasts.stageId],
    references: [crm_stages.id],
  }),
}));

export const crm_notesRelations = relations(crm_notes, ({ one }) => ({
  deal: one(crm_deals, {
    fields: [crm_notes.dealId],
    references: [crm_deals.id],
  }),
  contact: one(crm_contacts, {
    fields: [crm_notes.contactId],
    references: [crm_contacts.id],
  }),
}));

export const crm_taggablesRelations = relations(crm_taggables, ({ one }) => ({
  tag: one(crm_tags, {
    fields: [crm_taggables.tagId],
    references: [crm_tags.id],
  }),
}));

export const crm_tasksRelations = relations(crm_tasks, ({ one }) => ({
  deal: one(crm_deals, {
    fields: [crm_tasks.dealId],
    references: [crm_deals.id],
  }),
  contact: one(crm_contacts, {
    fields: [crm_tasks.contactId],
    references: [crm_contacts.id],
  }),
  assignedToUser: one(users, {
    fields: [crm_tasks.assignedTo],
    references: [users.id],
  }),
}));