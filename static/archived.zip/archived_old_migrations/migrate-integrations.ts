/**
 * Integrations Schema Migration Script
 * 
 * This script applies the integrations schema changes directly to the database
 * using raw SQL queries to ensure compatibility with PostgreSQL.
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './server/modules/integrations/schema/integrations.schema';

// Load environment variables
dotenv.config();

/**
 * Migrate integrations schema
 */
async function migrateIntegrationsSchema() {
  console.log('Migrating integrations schema...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    // Create Postgres client with SSL
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    
    // Create Drizzle ORM client
    const db = drizzle(sql, { schema });
    
    console.log('Creating integrations table and enum types...');
    
    // Create integration_provider enum type
    await sql`
      DO $$ 
      BEGIN
        -- Check if the enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_provider') THEN
          CREATE TYPE integration_provider AS ENUM (
            -- Romanian e-Factura
            'anaf_efactura',
            
            -- Payments
            'stripe',
            'revolut_business',
            
            -- Document Signing
            'pandadoc',
            
            -- Email/Messaging
            'microsoft_graph',
            'google_workspace',
            'slack',
            'whatsapp_business',
            'facebook_messenger',
            'facebook_comments',
            'wamm_ro',
            'smtp',
            'imap',
            'pop3',
            
            -- Marketing
            'mailchimp',
            'hubspot',
            
            -- Advertising & Analytics
            'facebook_ads',
            'google_ads',
            'tiktok_ads',
            'facebook_analytics',
            'google_analytics',
            
            -- eCommerce
            'shopify_storefront',
            'shopify_admin',
            'shopify_inbox',
            
            -- Shipping
            'sameday',
            'fan_courier',
            'urgent_cargus',
            
            -- Company Registry & Validation
            'termene_ro',
            'mfinante',
            'neverbounce',
            
            -- AI Integrations
            'openai',
            'grok',
            'elevenlabs'
          );
        END IF;
      END $$;
    `;
    
    // Create integration_status enum type
    await sql`
      DO $$ 
      BEGIN
        -- Check if the enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status') THEN
          CREATE TYPE integration_status AS ENUM (
            'active',
            'inactive',
            'error',
            'pending'
          );
        END IF;
      END $$;
    `;
    
    // Create integrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        provider integration_provider NOT NULL,
        name TEXT,
        description TEXT,
        status integration_status DEFAULT 'pending',
        is_connected BOOLEAN DEFAULT FALSE,
        config JSONB DEFAULT '{}',
        last_synced_at TIMESTAMP,
        webhook_url TEXT,
        webhook_secret TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by UUID,
        updated_by UUID
      );
    `;
    
    console.log('Checking database to verify integration table...');
    
    // Verify table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'integrations'
      );
    `;
    
    if (tableCheck[0].exists) {
      console.log('✅ integrations table verified in database.');
      
      // Check for existing records
      const count = await sql`SELECT COUNT(*) FROM integrations;`;
      console.log(`Found ${count[0].count} existing integration records.`);
    } else {
      throw new Error('Table creation failed. integrations table not found.');
    }
    
    // Success
    console.log('Schema migration completed successfully.');
  } catch (error) {
    console.error('Schema migration failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

// Run migration
migrateIntegrationsSchema()
  .then(() => {
    console.log('Migration completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });