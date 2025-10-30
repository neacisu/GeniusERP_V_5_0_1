/**
 * Collaboration Schema Migration Script
 * 
 * This script applies the collaboration schema directly to the database
 * using Drizzle ORM's push method for quick development.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { collaborationActivities, collaborationNotifications } from './shared/schema/collaboration.schema';
import { sql } from 'drizzle-orm';

// Load environment variables
dotenv.config();

/**
 * Migrate collaboration schema
 */
async function migrateCollaborationSchema() {
  try {
    console.log('Starting collaboration schema migration...');
    
    // Create DB connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Connect to PostgreSQL
    const queryClient = postgres(connectionString, { max: 1 });
    const db = drizzle(queryClient);
    
    console.log('Connected to database');
    
    // Push collaboration tables to database
    console.log('Creating collaboration_activities table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "collaboration_activities" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "object_type" VARCHAR(50) NOT NULL,
        "object_id" UUID NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "data" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS "collaboration_activities_company_id_idx" ON "collaboration_activities" ("company_id");
      CREATE INDEX IF NOT EXISTS "collaboration_activities_user_id_idx" ON "collaboration_activities" ("user_id");
      CREATE INDEX IF NOT EXISTS "collaboration_activities_type_idx" ON "collaboration_activities" ("type");
      CREATE INDEX IF NOT EXISTS "collaboration_activities_object_type_idx" ON "collaboration_activities" ("object_type");
      CREATE INDEX IF NOT EXISTS "collaboration_activities_object_id_idx" ON "collaboration_activities" ("object_id");
      CREATE INDEX IF NOT EXISTS "collaboration_activities_created_at_idx" ON "collaboration_activities" ("created_at");
    `);
    
    console.log('Creating collaboration_notifications table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "collaboration_notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'UNREAD',
        "source_type" VARCHAR(50),
        "source_id" UUID,
        "action_type" VARCHAR(50),
        "action_target" VARCHAR(255),
        "metadata" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS "collaboration_notifications_company_id_idx" ON "collaboration_notifications" ("company_id");
      CREATE INDEX IF NOT EXISTS "collaboration_notifications_user_id_idx" ON "collaboration_notifications" ("user_id");
      CREATE INDEX IF NOT EXISTS "collaboration_notifications_status_idx" ON "collaboration_notifications" ("status");
      CREATE INDEX IF NOT EXISTS "collaboration_notifications_type_idx" ON "collaboration_notifications" ("type");
      CREATE INDEX IF NOT EXISTS "collaboration_notifications_source_type_idx" ON "collaboration_notifications" ("source_type");
      CREATE INDEX IF NOT EXISTS "collaboration_notifications_created_at_idx" ON "collaboration_notifications" ("created_at");
    `);
    
    console.log('Collaboration schema migration completed successfully!');
    
    // Insert sample activity data for testing
    console.log('Creating some sample activity data...');
    await db.execute(sql`
      INSERT INTO "collaboration_activities" (
        "company_id", "user_id", "type", "object_type", "object_id", "title", "data"
      ) VALUES 
      ('7196288d-7314-4512-8b67-2c82449b5465', '49e12af8-dbd0-48db-b5bd-4fb3f6a39787', 'TASK_CREATED', 'TASK', 'ea6ccab1-4713-4a3f-be88-51efeb395a80', 'Test task created', '{"id": "ea6ccab1-4713-4a3f-be88-51efeb395a80", "title": "Test task"}'),
      ('7196288d-7314-4512-8b67-2c82449b5465', '49e12af8-dbd0-48db-b5bd-4fb3f6a39787', 'NOTE_CREATED', 'NOTE', 'f27c9a5e-8971-4abd-9c0e-5c5a3b4c8c9d', 'Test note added', '{"id": "f27c9a5e-8971-4abd-9c0e-5c5a3b4c8c9d", "title": "Test note"}'),
      ('7196288d-7314-4512-8b67-2c82449b5465', '49e12af8-dbd0-48db-b5bd-4fb3f6a39787', 'THREAD_CREATED', 'THREAD', 'b08462d1-3f5e-4d8c-9f3a-3e7a6c2a9b5d', 'New discussion thread', '{"id": "b08462d1-3f5e-4d8c-9f3a-3e7a6c2a9b5d", "title": "Test thread"}');
    `);
    
    console.log('Sample data created successfully!');
    
    // Close the database connection
    await queryClient.end();
    console.log('Database connection closed');
    
    return true;
  } catch (error) {
    console.error('Error during collaboration schema migration:', error);
    return false;
  }
}

// Run the migration
migrateCollaborationSchema();