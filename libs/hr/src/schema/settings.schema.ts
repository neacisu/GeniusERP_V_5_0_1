/**
 * HR Settings Schema
 * 
 * This schema defines the HR module settings structure.
 */
import {
  pgTable,
  uuid,
  text,
  varchar,
  numeric,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { companies } from '@geniuserp/shared';

/**
 * HR Settings table - Module configuration
 */
export const hrSettings = pgTable("hr_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id).unique(),
  
  // Company Information
  companyName: text("company_name"),
  companyRegistrationNumber: text("company_registration_number"),
  fiscalCode: text("fiscal_code"),
  address: text("address"),
  city: text("city"),
  county: text("county"),
  postalCode: text("postal_code"),
  country: text("country").default("România"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  contactPerson: text("contact_person"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  
  // HR Defaults
  defaultProbationPeriod: integer("default_probation_period").default(90),
  defaultWorkingHours: integer("default_working_hours").default(40),
  defaultVacationDays: integer("default_vacation_days").default(21),
  defaultSickDays: integer("default_sick_days").default(5),
  defaultNoticePeriod: integer("default_notice_period").default(30),
  
  // Features
  enableAutoCalculateVacationDays: boolean("enable_auto_calculate_vacation_days").default(false),
  enableAutoCalculateSeniority: boolean("enable_auto_calculate_seniority").default(true),
  enableContractNotifications: boolean("enable_contract_notifications").default(true),
  enableBirthdayNotifications: boolean("enable_birthday_notifications").default(true),
  
  // Integrations
  anafIntegrationEnabled: boolean("anaf_integration_enabled").default(false),
  anafApiKey: text("anaf_api_key"),
  anafUsername: text("anaf_username"),
  anafPassword: text("anaf_password"),
  revisalIntegrationEnabled: boolean("revisal_integration_enabled").default(false),
  revisalApiKey: text("revisal_api_key"),
  sendgridEnabled: boolean("sendgrid_enabled").default(false),
  sendgridApiKey: text("sendgrid_api_key"),
  stripeEnabled: boolean("stripe_enabled").default(false),
  stripeApiKey: text("stripe_api_key"),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});