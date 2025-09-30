/**
 * Integrations Schema Push Script
 * 
 * This script pushes the integrations schema directly to the database
 * using Drizzle ORM's push method for quick development.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './server/modules/integrations/schema/integrations.schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Push schema changes
 */
async function pushSchemaChanges() {
  console.log('Pushing integrations schema changes...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    // Create Postgres client with SSL
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    
    // Create Drizzle ORM client
    const db = drizzle(sql, { schema });
    
    // Generate and push schema changes
    console.log('Pushing schema to database...');
    
    await db.execute(sql`
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
        ELSE
          -- Alter existing enum to add new values
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'revolut_business';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'facebook_messenger';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'facebook_comments';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'wamm_ro';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'smtp';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'imap';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'pop3';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'tiktok_ads';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'facebook_analytics';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'google_analytics';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'shopify_storefront';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'shopify_admin';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'shopify_inbox';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'sameday';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'fan_courier';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'urgent_cargus';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'termene_ro';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'mfinante';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'neverbounce';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'openai';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'grok';
          ALTER TYPE integration_provider ADD VALUE IF NOT EXISTS 'elevenlabs';
        END IF;
      END $$;
    `);
    
    // Success
    console.log('Schema changes pushed successfully.');
  } catch (error) {
    console.error('Failed to push schema changes:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

// Run script
pushSchemaChanges()
  .then(() => {
    console.log('Schema push completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Schema push failed:', error);
    process.exit(1);
  });