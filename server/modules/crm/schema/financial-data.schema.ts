/**
 * Financial Data Schema
 * 
 * Stochează datele financiare obținute de la ANAF pentru fiecare companie și an fiscal
 * Aceste date sunt colectate prin API-ul de bilanț al ANAF
 */
import { pgTable, serial, varchar, integer, json, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Tabel pentru stocarea erorilor la interogarea bilanțurilor
 */
export const financialDataErrors = pgTable('financial_data_errors', {
  id: serial('id').primaryKey(),
  cui: varchar('cui', { length: 20 }).notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  errorMessage: text('error_message').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at').defaultNow().notNull(),
  isResolved: boolean('is_resolved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Structura indicatorilor financiari
 */
export const financialIndicator = z.object({
  indicator: z.string(),
  val_indicator: z.number().nullable(),
  val_den_indicator: z.string()
});

/**
 * Tabel principal pentru datele financiare
 */
export const financialData = pgTable('financial_data', {
  id: serial('id').primaryKey(),
  cui: varchar('cui', { length: 20 }).notNull(),
  companyId: varchar('company_id', { length: 36 }).notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  
  // Informații generale
  companyName: varchar('company_name', { length: 255 }).notNull(),
  caenCode: integer('caen_code').notNull(),
  caenDescription: varchar('caen_description', { length: 255 }).notNull(),
  
  // Indicatori financiari (stocați ca JSON)
  indicators: json('indicators').notNull(),
  
  // Metadate de procesare
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  isProcessed: boolean('is_processed').default(true).notNull(),
  processingErrors: varchar('processing_errors', { length: 500 }),
  
  // Câmpuri de audit
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 36 }),
  updatedBy: varchar('updated_by', { length: 36 })
});

/**
 * Tabel pentru stocarea job-urilor în așteptare
 */
export const financialDataJobs = pgTable('financial_data_jobs', {
  id: serial('id').primaryKey(),
  cui: varchar('cui', { length: 20 }).notNull(),
  companyId: varchar('company_id', { length: 36 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  startYear: integer('start_year').notNull(),
  endYear: integer('end_year').notNull(),
  currentYear: integer('current_year'),
  progress: integer('progress').default(0).notNull(),
  totalYears: integer('total_years').notNull(),
  lastProcessedAt: timestamp('last_processed_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 36 })
});

// Type-uri pentru Drizzle ORM
export type FinancialData = InferSelectModel<typeof financialData>;
export type FinancialDataInsert = InferInsertModel<typeof financialData>;
export type FinancialDataError = InferSelectModel<typeof financialDataErrors>;
export type FinancialDataErrorInsert = InferInsertModel<typeof financialDataErrors>;
export type FinancialDataJob = InferSelectModel<typeof financialDataJobs>;
export type FinancialDataJobInsert = InferInsertModel<typeof financialDataJobs>;

// Scheme Zod pentru validare
export const insertFinancialDataSchema = createInsertSchema(financialData, {
  indicators: z.array(financialIndicator)
});

export const selectFinancialDataSchema = createSelectSchema(financialData, {
  indicators: z.array(financialIndicator)
});

export const insertFinancialDataJobSchema = createInsertSchema(financialDataJobs);
export const selectFinancialDataJobSchema = createSelectSchema(financialDataJobs);

// Schema pentru request-ul de creare a unui job
export const createFinancialDataJobSchema = z.object({
  cui: z.string().min(1).max(20),
  companyId: z.string().uuid(),
  startYear: z.number().min(1990).max(new Date().getFullYear()),
  endYear: z.number().min(1990).max(new Date().getFullYear())
});

// Indecși pentru performanță optimă
// Acești indecși vor fi creați la migrarea bazei de date
export const financialDataIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_financial_data_cui ON financial_data(cui)',
  'CREATE INDEX IF NOT EXISTS idx_financial_data_company_id ON financial_data(company_id)',
  'CREATE INDEX IF NOT EXISTS idx_financial_data_fiscal_year ON financial_data(fiscal_year)',
  'CREATE INDEX IF NOT EXISTS idx_financial_data_cui_fiscal_year ON financial_data(cui, fiscal_year)',
  'CREATE INDEX IF NOT EXISTS idx_financial_data_jobs_cui ON financial_data_jobs(cui)',
  'CREATE INDEX IF NOT EXISTS idx_financial_data_jobs_status ON financial_data_jobs(status)',
  'CREATE INDEX IF NOT EXISTS idx_financial_data_errors_cui ON financial_data_errors(cui)',
  'CREATE INDEX IF NOT EXISTS idx_financial_data_errors_is_resolved ON financial_data_errors(is_resolved)'
];