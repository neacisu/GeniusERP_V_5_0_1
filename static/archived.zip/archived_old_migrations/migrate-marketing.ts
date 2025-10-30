/**
 * Marketing Schema Migration Script
 * 
 * This script applies the marketing schema changes directly to the database
 * using raw SQL queries to ensure compatibility with PostgreSQL.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as process from 'process';
import fs from 'fs';
import path from 'path';

/**
 * Migrate marketing schema
 */
async function migrateMarketingSchema() {
  console.log('Creating direct database connection...');
  
  // Get database connection string from environment
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  const client = postgres(connectionString, { ssl: 'require' });
  const db = drizzle(client);
  
  console.log('Connected to the database.');
  console.log('Migrating marketing schema...');
  
  try {
    // Create enums first
    await db.execute(sql`
      DO $$
      BEGIN
        -- Check if campaign_status enum type exists and create if not
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
          CREATE TYPE campaign_status AS ENUM (
            'draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'
          );
        END IF;
        
        -- Check if campaign_type enum type exists and create if not
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_type') THEN
          CREATE TYPE campaign_type AS ENUM (
            'email', 'sms', 'social', 'push', 'whatsapp', 'multi_channel'
          );
        END IF;
        
        -- Check if audience_type enum type exists and create if not
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audience_type') THEN
          CREATE TYPE audience_type AS ENUM (
            'segment', 'list', 'custom', 'all_customers', 'filtered'
          );
        END IF;
      END
      $$;
    `);
    
    console.log('Created enum types.');
    
    // Create tables with foreign key constraints and indexes
    
    // 1. Create campaigns table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type campaign_type NOT NULL,
        status campaign_status NOT NULL DEFAULT 'draft',
        subject TEXT,
        content TEXT,
        content_html TEXT,
        template_id UUID,
        channels JSONB NOT NULL DEFAULT '[]',
        primary_channel communication_channel,
        scheduled_at TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        audience_type audience_type NOT NULL,
        audience_id UUID,
        audience_filter JSONB DEFAULT '{}',
        estimated_reach INTEGER,
        sent_count INTEGER DEFAULT 0,
        delivered_count INTEGER DEFAULT 0,
        open_count INTEGER DEFAULT 0,
        click_count INTEGER DEFAULT 0,
        bounce_count INTEGER DEFAULT 0,
        response_count INTEGER DEFAULT 0,
        is_ab_test BOOLEAN DEFAULT FALSE,
        ab_test_variants JSONB DEFAULT '[]',
        ab_test_winner_variant TEXT,
        settings JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );
      
      -- Create indexes for marketing_campaigns
      CREATE INDEX IF NOT EXISTS marketing_campaigns_company_id_idx ON marketing_campaigns(company_id);
      CREATE INDEX IF NOT EXISTS marketing_campaigns_type_idx ON marketing_campaigns(type);
      CREATE INDEX IF NOT EXISTS marketing_campaigns_status_idx ON marketing_campaigns(status);
      CREATE INDEX IF NOT EXISTS marketing_campaigns_audience_type_idx ON marketing_campaigns(audience_type);
      CREATE INDEX IF NOT EXISTS marketing_campaigns_scheduled_at_idx ON marketing_campaigns(scheduled_at);
    `);
    
    console.log('Created marketing_campaigns table.');
    
    // 2. Create campaign messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS marketing_campaign_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
        message_id UUID NOT NULL,
        company_id UUID NOT NULL,
        recipient_id UUID NOT NULL,
        status TEXT NOT NULL,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        bounced_at TIMESTAMP,
        bounce_reason TEXT,
        metadata JSONB DEFAULT '{}',
        variant_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        CONSTRAINT marketing_campaign_messages_unique UNIQUE(campaign_id, message_id)
      );
      
      -- Create indexes for marketing_campaign_messages
      CREATE INDEX IF NOT EXISTS marketing_campaign_messages_campaign_id_idx ON marketing_campaign_messages(campaign_id);
      CREATE INDEX IF NOT EXISTS marketing_campaign_messages_message_id_idx ON marketing_campaign_messages(message_id);
      CREATE INDEX IF NOT EXISTS marketing_campaign_messages_recipient_id_idx ON marketing_campaign_messages(recipient_id);
      CREATE INDEX IF NOT EXISTS marketing_campaign_messages_status_idx ON marketing_campaign_messages(status);
    `);
    
    console.log('Created marketing_campaign_messages table.');
    
    // 3. Create campaign segments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS marketing_campaign_segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        filter_criteria JSONB DEFAULT '{}',
        estimated_reach INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        last_refreshed_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by UUID,
        updated_by UUID,
        
        CONSTRAINT marketing_campaign_segments_name_company_idx UNIQUE(name, company_id)
      );
      
      -- Create indexes for marketing_campaign_segments
      CREATE INDEX IF NOT EXISTS marketing_campaign_segments_company_id_idx ON marketing_campaign_segments(company_id);
    `);
    
    console.log('Created marketing_campaign_segments table.');
    
    // 4. Create campaign templates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS marketing_campaign_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type campaign_type NOT NULL,
        subject TEXT,
        content TEXT,
        content_html TEXT,
        preview_image TEXT,
        category TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );
      
      -- Create indexes for marketing_campaign_templates
      CREATE INDEX IF NOT EXISTS marketing_campaign_templates_company_id_idx ON marketing_campaign_templates(company_id);
      CREATE INDEX IF NOT EXISTS marketing_campaign_templates_type_idx ON marketing_campaign_templates(type);
      CREATE INDEX IF NOT EXISTS marketing_campaign_templates_category_idx ON marketing_campaign_templates(category);
    `);
    
    console.log('Created marketing_campaign_templates table.');
    
    console.log('Marketing schema migration completed successfully!');
  } catch (error) {
    console.error('Error migrating marketing schema:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Close the connection
    await client.end();
  }
}

// Call the migration function
migrateMarketingSchema()
  .then(() => {
    console.log('Marketing module migration completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });