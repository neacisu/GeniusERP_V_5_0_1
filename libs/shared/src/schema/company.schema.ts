/**
 * Company Schema
 * 
 * Schema definition for companies and their configurations.
 */

import { relations } from 'drizzle-orm';
import { 
  pgTable, 
  uuid, 
  timestamp, 
  text, 
  varchar,
  pgEnum,
  decimal,
  boolean,
  integer
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Company type enum
 */
export enum CompanyType {
  HEADQUARTERS = 'headquarters',
  SUBSIDIARY = 'subsidiary',
  FRANCHISE = 'franchise'
}

// Create enum for company type
// Note: Using text instead of enum to avoid duplicate enum error with shared schema
// The company_type enum already exists in database from shared schema

/**
 * Companies table
 */
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: text('type').notNull().default(CompanyType.HEADQUARTERS),
  parentId: uuid('parent_id').references((): any => companies.id),
  fiscalCode: varchar('fiscal_code', { length: 50 }).notNull(), // CUI / Cod fiscal
  registrationNumber: varchar('registration_number', { length: 50 }).notNull(), // Număr registrul comerțului
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  country: varchar('country', { length: 100 }).default('Romania'),
  postalCode: varchar('postal_code', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  bankName: varchar('bank_name', { length: 100 }),
  bankAccount: varchar('bank_account', { length: 50 }),
  socialCapital: decimal('social_capital', { precision: 15, scale: 2 }),
  
  // VAT settings (missing columns)
  vatPayer: boolean('vat_payer').default(true),
  vatRate: integer('vat_rate').default(19),
  useCashVAT: boolean('use_cash_vat').default(false),
  
  logo: text('logo_url'), // Coloana din baza de date este 'logo_url'
  settings: text('settings'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { mode: 'string' })
});

/**
 * Company relationships
 */
export const companiesRelations = relations(companies, ({ one, many }) => ({
  parent: one(companies, {
    fields: [companies.parentId],
    references: [companies.id]
  }),
  children: many(companies)
}));

// Company insert schema
export const insertCompanySchema = createInsertSchema(companies)
  .extend({ // Fixed: removed omit() for drizzle-zod compatibility
    type: z.nativeEnum(CompanyType).optional()
  });

// Type definitions using Zod schemas
export type Company = z.infer<typeof insertCompanySchema> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type InsertCompany = z.infer<typeof insertCompanySchema>;

export default {
  companies,
  CompanyType
};