/**
 * Direct CRM Schema Migration Script
 * 
 * This script applies the CRM schema directly to the database without using the
 * Drizzle Kit migration tools. It's meant for testing and development only.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './shared/schema';

// Load environment variables
dotenv.config();

// Define the CRM tables to create
const CRM_TABLES = [
  // Customers - Organizations that are the target of sales efforts
  `CREATE TABLE IF NOT EXISTS crm_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    county TEXT,
    country TEXT DEFAULT 'Romania',
    postal_code TEXT,
    type TEXT DEFAULT 'lead',
    segment TEXT,
    industry TEXT,
    source TEXT,
    lead_score INTEGER DEFAULT 0,
    lead_status TEXT DEFAULT 'New',
    lead_qualification_date TIMESTAMP WITH TIME ZONE,
    owner_id UUID REFERENCES users(id),
    fiscal_code TEXT,
    registration_number TEXT,
    vat_payer BOOLEAN DEFAULT FALSE,
    website TEXT,
    notes TEXT,
    annual_revenue NUMERIC(20,2),
    employee_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    custom_fields JSONB DEFAULT '{}'
  )`,

  // Deal pipeline definitions
  `CREATE TABLE IF NOT EXISTS crm_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    company_id UUID NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    target_deal_size NUMERIC(20,2),
    target_conversion_rate DECIMAL(5,2),
    target_cycle_time_days INTEGER
  )`,
  
  // Pipeline stages for sales pipeline
  `CREATE TABLE IF NOT EXISTS crm_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
    probability DECIMAL(5,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_days INTEGER DEFAULT 0,
    color TEXT DEFAULT '#808080',
    is_active BOOLEAN DEFAULT TRUE,
    stage_type TEXT DEFAULT 'standard',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    expected_duration INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0
  )`,
  
  // CRM Contacts (business contacts)
  `CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    title TEXT,
    company_id UUID NOT NULL REFERENCES companies(id),
    customer_id UUID REFERENCES crm_customers(id),
    contact_company_id UUID, -- Either internal company or external
    contact_type TEXT DEFAULT 'lead',
    status TEXT DEFAULT 'active',
    source TEXT,
    lead_score INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    avatar_url TEXT,
    custom_fields JSONB,
    facebook TEXT,
    linkedin TEXT,
    twitter TEXT,
    instagram TEXT,
    birth_date DATE,
    mobile TEXT,
    department TEXT,
    decision_maker BOOLEAN DEFAULT FALSE,
    influence_level INTEGER DEFAULT 5,
    preferred_contact_method TEXT DEFAULT 'email',
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT email_phone_not_null CHECK (email IS NOT NULL OR phone IS NOT NULL)
  )`,
  
  // External companies (clients, prospects)
  `CREATE TABLE IF NOT EXISTS crm_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    industry TEXT,
    size TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT,
    vat_number TEXT,
    registration_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    status TEXT DEFAULT 'active',
    custom_fields JSONB,
    logo_url TEXT,
    created_by UUID REFERENCES users(id), 
    updated_by UUID REFERENCES users(id),
    parent_company_id UUID REFERENCES crm_companies(id),
    annual_revenue NUMERIC(20,2),
    is_customer BOOLEAN DEFAULT FALSE
  )`,
  
  // Deals (opportunities)
  `CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    stage_id UUID NOT NULL REFERENCES crm_stages(id),
    pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id),
    contact_id UUID REFERENCES crm_contacts(id),
    client_company_id UUID REFERENCES crm_companies(id),
    amount NUMERIC(20,2),
    currency TEXT DEFAULT 'RON',
    expected_close_date DATE,
    actual_close_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    probability DECIMAL(5,2),
    custom_fields JSONB,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    tags TEXT[],
    source TEXT,
    lost_reason TEXT,
    win_reason TEXT,
    customer_id UUID REFERENCES crm_customers(id),
    deal_type TEXT DEFAULT 'New Business',
    owner_id UUID REFERENCES users(id),
    health_score INTEGER DEFAULT 50,
    won_reason TEXT,
    lost_competitor TEXT,
    products JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE
  )`,
  
  // Activities (calls, emails, meetings)
  `CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    activity_type TEXT NOT NULL,
    status TEXT DEFAULT 'planned',
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    deal_id UUID REFERENCES crm_deals(id),
    contact_id UUID REFERENCES crm_contacts(id),
    client_company_id UUID REFERENCES crm_companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    outcome TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    location TEXT,
    custom_fields JSONB
  )`,
  
  // Notes on contacts, companies, deals
  `CREATE TABLE IF NOT EXISTS crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    deal_id UUID REFERENCES crm_deals(id),
    contact_id UUID REFERENCES crm_contacts(id),
    client_company_id UUID REFERENCES crm_companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    pinned BOOLEAN DEFAULT FALSE,
    note_type TEXT DEFAULT 'general'
  )`,
  
  // Tasks related to deals, contacts
  `CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    deal_id UUID REFERENCES crm_deals(id),
    contact_id UUID REFERENCES crm_contacts(id),
    client_company_id UUID REFERENCES crm_companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    reminder_time TIMESTAMP WITH TIME ZONE
  )`,
  
  // Products that can be sold/services offered
  /* Table crm_products removed - consolidated with inventory_products */
  
  // Products related to a deal
  `CREATE TABLE IF NOT EXISTS crm_deal_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES inventory_products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(20,2) NOT NULL,
    currency TEXT DEFAULT 'RON',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount NUMERIC(20,2) DEFAULT 0,
    total_price NUMERIC(20,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    notes TEXT
  )`,
  
  // Stage history to track movements
  `CREATE TABLE IF NOT EXISTS crm_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES crm_stages(id),
    to_stage_id UUID NOT NULL REFERENCES crm_stages(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_in_stage INTEGER, -- In seconds
    notes TEXT,
    company_id UUID NOT NULL REFERENCES companies(id),
    changed_by UUID REFERENCES users(id)
  )`,
  
  // Segments (saved filters/views)
  `CREATE TABLE IF NOT EXISTS crm_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    segment_type TEXT NOT NULL,
    filter_criteria JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_dynamic BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE
  )`,
  
  // Tags for all CRM objects
  `CREATE TABLE IF NOT EXISTS crm_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#808080',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    tag_type TEXT DEFAULT 'general'
  )`,
  
  // Junction table for tagging objects
  `CREATE TABLE IF NOT EXISTS crm_taggables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
    taggable_id UUID NOT NULL,
    taggable_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    UNIQUE (tag_id, taggable_id, taggable_type)
  )`,
  
  // Email templates for CRM
  `CREATE TABLE IF NOT EXISTS crm_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    template_type TEXT DEFAULT 'custom',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    variables JSONB
  )`,
  
  // Lead scoring rules
  `CREATE TABLE IF NOT EXISTS crm_scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    property TEXT NOT NULL,
    operation TEXT NOT NULL,
    value TEXT NOT NULL,
    score_value INTEGER NOT NULL,
    rule_type TEXT DEFAULT 'demographic',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
  )`,
  
  // Custom fields configuration
  `CREATE TABLE IF NOT EXISTS crm_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    options JSONB,
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    placeholder TEXT,
    help_text TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    validation_rules JSONB
  )`,
  
  // Revenue forecasts
  `CREATE TABLE IF NOT EXISTS crm_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_period TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    forecast_amount NUMERIC(20,2) NOT NULL,
    actual_amount NUMERIC(20,2),
    currency TEXT DEFAULT 'RON',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    pipeline_id UUID REFERENCES crm_pipelines(id),
    confidence_level DECIMAL(5,2),
    forecast_type TEXT DEFAULT 'revenue',
    notes TEXT
  )`
];

/**
 * Direct migration function that creates CRM tables
 */
async function directMigrate() {
  console.log('🚀 Starting direct CRM schema migration');
  
  // Database connection
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  const migrationClient = postgres(databaseUrl);
  const db = drizzle(migrationClient);
  
  try {
    // First, check if tables already exist
    console.log('📊 Checking for existing CRM tables');
    
    const existingTablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'crm_%'
    `);
    
    console.log('Raw SQL result:', JSON.stringify(existingTablesResult));
    
    // Use a simpler approach to extract table names
    let existingTables: string[] = [];
    try {
      if (Array.isArray(existingTablesResult)) {
        existingTables = existingTablesResult
          .filter(row => row && row.table_name)
          .map(row => String(row.table_name));
      } else if (existingTablesResult && typeof existingTablesResult === 'object') {
        const rows = (existingTablesResult as any).rows;
        if (rows && Array.isArray(rows)) {
          existingTables = rows
            .filter(row => row && row.table_name)
            .map(row => String(row.table_name));
        }
      }
    } catch (err) {
      console.log('Error parsing SQL result:', err);
    }
    
    console.log('Existing CRM tables:', existingTables.length ? existingTables.join(', ') : 'None');
    
    // Create tables
    console.log('📝 Creating CRM tables...');
    
    let createdCount = 0;
    
    for (const createTableSQL of CRM_TABLES) {
      try {
        await db.execute(sql.raw(createTableSQL));
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating table: ${error}`);
      }
    }
    
    console.log(`✅ Successfully created ${createdCount} CRM tables!`);
    
    // Create indexes for better performance
    console.log('📈 Creating indexes for CRM tables');
    
    const INDEXES = [
      // Deals
      `CREATE INDEX IF NOT EXISTS idx_crm_deals_stage_id ON crm_deals (stage_id)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id ON crm_deals (contact_id)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_deals_company_id ON crm_deals (company_id)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON crm_deals (status)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline_id ON crm_deals (pipeline_id)`,
      
      // Contacts
      `CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON crm_contacts (company_id)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts (status)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts (email)`,
      
      // Companies
      `CREATE INDEX IF NOT EXISTS idx_crm_companies_company_id ON crm_companies (company_id)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_companies_status ON crm_companies (status)`,
      
      // Activities
      `CREATE INDEX IF NOT EXISTS idx_crm_activities_deal_id ON crm_activities (deal_id)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_id ON crm_activities (contact_id)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_activities_status ON crm_activities (status)`,
      
      // Stage history
      `CREATE INDEX IF NOT EXISTS idx_crm_stage_history_deal_id ON crm_stage_history (deal_id)`,
      
      // Pipelines and stages
      `CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline_id ON crm_stages (pipeline_id)`,
      
      // Tasks
      `CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks (status)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON crm_tasks (assigned_to)`,
      `CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON crm_tasks (due_date)`,
    ];
    
    let indexCount = 0;
    
    for (const indexSQL of INDEXES) {
      try {
        await db.execute(sql.raw(indexSQL));
        indexCount++;
      } catch (error) {
        console.error(`❌ Error creating index: ${error}`);
      }
    }
    
    console.log(`✅ Successfully created ${indexCount} indexes!`);
    
    console.log('\n✅ CRM migration script completed successfully');
    
  } catch (error) {
    console.error('❌ Error in CRM migration:', error);
  } finally {
    await migrationClient.end();
  }
}

// Run the migration
directMigrate().catch(console.error);