/**
 * Communications Schema Migration Script
 * 
 * This script applies the communications schema changes directly to the database
 * using raw SQL queries to ensure compatibility with PostgreSQL.
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../libs/shared/src/schema/communications.schema';

// Load environment variables
dotenv.config();

/**
 * Migrate communications schema
 */
async function migrateCommunicationsSchema() {
  console.log('Migrating communications schema...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    // Create Postgres client with SSL
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    
    // Create Drizzle ORM client
    const db = drizzle(sql, { schema });
    
    console.log('Creating communications tables and enum types...');
    
    // Create communication_channel enum type
    await sql`
      DO $$ 
      BEGIN
        -- Check if the enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communication_channel') THEN
          CREATE TYPE communication_channel AS ENUM (
            'email',
            'whatsapp',
            'messenger',
            'comment',
            'call',
            'shopify-inbox',
            'sms',
            'contact-form',
            'chat',
            'other'
          );
        END IF;
      END $$;
    `;
    
    // Create message_direction enum type
    await sql`
      DO $$ 
      BEGIN
        -- Check if the enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_direction') THEN
          CREATE TYPE message_direction AS ENUM (
            'inbound',
            'outbound',
            'internal'
          );
        END IF;
      END $$;
    `;
    
    // Create message_status enum type
    await sql`
      DO $$ 
      BEGIN
        -- Check if the enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
          CREATE TYPE message_status AS ENUM (
            'new',
            'read',
            'responded',
            'archived',
            'spam',
            'deleted',
            'pending',
            'scheduled',
            'draft'
          );
        END IF;
      END $$;
    `;
    
    // Create sentiment_type enum type
    await sql`
      DO $$ 
      BEGIN
        -- Check if the enum exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentiment_type') THEN
          CREATE TYPE sentiment_type AS ENUM (
            'positive',
            'negative',
            'neutral',
            'mixed'
          );
        END IF;
      END $$;
    `;
    
    // Create message threads table
    await sql`
      CREATE TABLE IF NOT EXISTS communications_threads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        subject TEXT,
        channel communication_channel NOT NULL,
        external_thread_id TEXT,
        status message_status DEFAULT 'new',
        last_message_at TIMESTAMP DEFAULT NOW(),
        assigned_to UUID,
        customer_id UUID,
        contact_id UUID,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Create messages table
    await sql`
      CREATE TABLE IF NOT EXISTS communications_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id UUID NOT NULL REFERENCES communications_threads(id) ON DELETE CASCADE,
        company_id UUID NOT NULL,
        channel communication_channel NOT NULL,
        direction message_direction NOT NULL,
        status message_status DEFAULT 'new',
        from_email TEXT,
        from_name TEXT,
        from_phone TEXT,
        to_email TEXT,
        to_name TEXT,
        to_phone TEXT,
        subject TEXT,
        body TEXT NOT NULL,
        body_html TEXT,
        sentiment sentiment_type,
        sentiment_score REAL,
        external_message_id TEXT,
        external_conversation_id TEXT,
        is_flagged BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        delivered_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by UUID,
        updated_by UUID
      );
    `;
    
    // Create contact profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS communications_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        customer_id UUID,
        email TEXT,
        full_name TEXT,
        phone TEXT,
        avatar_url TEXT,
        preferred_channel communication_channel,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Create channel configurations table
    await sql`
      CREATE TABLE IF NOT EXISTS communications_channel_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        channel communication_channel NOT NULL,
        integration_id UUID,
        is_active BOOLEAN DEFAULT TRUE,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Create message access control table
    await sql`
      CREATE TABLE IF NOT EXISTS communications_message_access (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES communications_messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        company_id UUID NOT NULL,
        can_view BOOLEAN DEFAULT TRUE,
        can_reply BOOLEAN DEFAULT FALSE,
        can_delete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Create thread access control table
    await sql`
      CREATE TABLE IF NOT EXISTS communications_thread_access (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id UUID NOT NULL REFERENCES communications_threads(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        company_id UUID NOT NULL,
        can_view BOOLEAN DEFAULT TRUE,
        can_reply BOOLEAN DEFAULT FALSE,
        can_assign BOOLEAN DEFAULT FALSE,
        can_delete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Add indexes to improve query performance
    console.log('Adding indexes for better performance...');
    
    // Thread indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_threads_company_id ON communications_threads(company_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_threads_channel ON communications_threads(channel);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_threads_status ON communications_threads(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_threads_customer_id ON communications_threads(customer_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_threads_last_message_at ON communications_threads(last_message_at);`;
    
    // Message indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON communications_messages(thread_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_company_id ON communications_messages(company_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_channel ON communications_messages(channel);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_direction ON communications_messages(direction);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_status ON communications_messages(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_external_ids ON communications_messages(external_message_id, external_conversation_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON communications_messages(created_at);`;
    
    // Contact indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON communications_contacts(company_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON communications_contacts(customer_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_email ON communications_contacts(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_phone ON communications_contacts(phone);`;
    
    // Channel config indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_channels_company_id ON communications_channel_configs(company_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_channels_integration_id ON communications_channel_configs(integration_id);`;
    
    // Access control indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_message_access_message_id ON communications_message_access(message_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_access_user_id ON communications_message_access(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_thread_access_thread_id ON communications_thread_access(thread_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_thread_access_user_id ON communications_thread_access(user_id);`;
    
    console.log('Checking database to verify communications tables...');
    
    // Verify tables exist
    const messageTables = await sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'communications%';
    `;
    
    console.log('Created communications tables:');
    for (const row of messageTables) {
      console.log(`✅ ${row.tablename}`);
    }
    
    // Success
    console.log('Communications schema migration completed successfully.');
  } catch (error) {
    console.error('Schema migration failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

// Run migration
migrateCommunicationsSchema()
  .then(() => {
    console.log('Migration completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });