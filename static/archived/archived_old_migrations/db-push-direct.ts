/**
 * Direct DB Push Script
 * 
 * This script pushes the schema directly to the database using
 * drizzle-kit's push command.
 */

import { getDrizzle } from './server/common/drizzle';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config();

/**
 * Push schema changes directly to the database
 */
async function pushSchemaDirectly() {
  console.log('Pushing schema changes directly to the database...');

  try {
    const db = getDrizzle();
    
    // Create an integrations table
    console.log('Creating base integrations table if it doesn\'t exist...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        provider VARCHAR(100) NOT NULL,
        name TEXT,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
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
    `);
    
    console.log('Checking if integration_provider type exists...');
    const [enumExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'integration_provider'
      );
    `);
    
    if (!enumExists.exists) {
      console.log('Creating integration_provider enum type...');
      await db.execute(sql`
        CREATE TYPE integration_provider AS ENUM (
          'anaf_efactura',
          'stripe',
          'revolut_business',
          'pandadoc',
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
          'mailchimp',
          'hubspot',
          'facebook_ads',
          'google_ads',
          'tiktok_ads',
          'facebook_analytics',
          'google_analytics',
          'shopify_storefront',
          'shopify_admin',
          'shopify_inbox',
          'sameday',
          'fan_courier',
          'urgent_cargus',
          'termene_ro',
          'mfinante',
          'neverbounce',
          'openai',
          'grok',
          'elevenlabs'
        );
      `);
    } else {
      console.log('Integration_provider enum type already exists, adding new values...');
      
      // Adding new enum values individually since we can't do it in batch
      // Using pg_enum to check if each value exists before adding
      for (const value of [
        'revolut_business', 'facebook_messenger', 'facebook_comments', 'wamm_ro',
        'smtp', 'imap', 'pop3', 'tiktok_ads', 'facebook_analytics', 'google_analytics',
        'shopify_storefront', 'shopify_admin', 'shopify_inbox', 'sameday', 'fan_courier',
        'urgent_cargus', 'termene_ro', 'mfinante', 'neverbounce', 'openai', 'grok', 'elevenlabs'
      ]) {
        // Check if value exists
        const [valueExists] = await db.execute(sql`
          SELECT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'integration_provider')
            AND enumlabel = ${value}
          );
        `);
        
        if (!valueExists.exists) {
          console.log(`Adding enum value: ${value}`);
          await db.execute(sql`
            ALTER TYPE integration_provider ADD VALUE '${sql.raw(value)}';
          `);
        }
      }
    }
    
    console.log('Checking if integration_status type exists...');
    const [statusEnumExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'integration_status'
      );
    `);
    
    if (!statusEnumExists.exists) {
      console.log('Creating integration_status enum type...');
      await db.execute(sql`
        CREATE TYPE integration_status AS ENUM (
          'active',
          'inactive',
          'error',
          'pending'
        );
      `);
    }
    
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
pushSchemaDirectly()
  .then(() => {
    console.log('Schema push completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Schema push failed:', error);
    process.exit(1);
  });