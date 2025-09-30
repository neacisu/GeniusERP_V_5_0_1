/**
 * Business Process Management (BPM) Schema Migration Script
 * 
 * This script applies the BPM schema changes directly to the database
 * using raw SQL queries to ensure compatibility with PostgreSQL.
 */

import postgres from 'postgres';
import { Logger } from './server/common/logger';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const logger = new Logger('debug');

// Migrate BPM schema
async function migrateBpmSchema() {
  logger.info('Starting BPM schema migration...');
  
  // Create a database connection
  const sql = postgres(process.env.DATABASE_URL || '', {
    max: 1,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : true,
    idle_timeout: 20,
    connect_timeout: 30,
  });
  
  try {
    // Create enum types
    logger.info('Creating enum types...');
    
    await sql.unsafe(`
      -- Create BPM Process Status Enum
      DO $$ BEGIN
        CREATE TYPE "bpm_process_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create BPM Trigger Type Enum
      DO $$ BEGIN
        CREATE TYPE "bpm_trigger_type" AS ENUM ('WEBHOOK', 'SCHEDULED', 'EVENT', 'MANUAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create BPM Process Instance Status Enum
      DO $$ BEGIN
        CREATE TYPE "bpm_process_instance_status" AS ENUM ('CREATED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create BPM Step Execution Status Enum
      DO $$ BEGIN
        CREATE TYPE "bpm_step_execution_status" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create BPM API Connection Status Enum
      DO $$ BEGIN
        CREATE TYPE "bpm_api_connection_status" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Create BPM Scheduled Job Status Enum
      DO $$ BEGIN
        CREATE TYPE "bpm_scheduled_job_status" AS ENUM ('SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    logger.info('Enum types created successfully.');
    
    // Create BPM tables
    logger.info('Creating BPM tables...');
    
    // Create BPM Processes table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "bpm_processes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "description" TEXT,
        "company_id" UUID NOT NULL,
        "steps" JSONB,
        "status" bpm_process_status NOT NULL DEFAULT 'DRAFT',
        "is_template" BOOLEAN NOT NULL DEFAULT FALSE,
        "version" TEXT,
        "created_by" UUID NOT NULL,
        "updated_by" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS "bpm_processes_company_id_idx" ON "bpm_processes" ("company_id");
      CREATE INDEX IF NOT EXISTS "bpm_processes_is_template_idx" ON "bpm_processes" ("is_template");
      CREATE INDEX IF NOT EXISTS "bpm_processes_status_idx" ON "bpm_processes" ("status");
    `);
    
    // Create BPM Triggers table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "bpm_triggers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "description" TEXT,
        "company_id" UUID NOT NULL,
        "type" bpm_trigger_type NOT NULL,
        "process_id" UUID NOT NULL REFERENCES "bpm_processes" ("id") ON DELETE CASCADE,
        "configuration" JSONB,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_by" UUID NOT NULL,
        "updated_by" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS "bpm_triggers_company_id_idx" ON "bpm_triggers" ("company_id");
      CREATE INDEX IF NOT EXISTS "bpm_triggers_process_id_idx" ON "bpm_triggers" ("process_id");
      CREATE INDEX IF NOT EXISTS "bpm_triggers_type_idx" ON "bpm_triggers" ("type");
      CREATE INDEX IF NOT EXISTS "bpm_triggers_is_active_idx" ON "bpm_triggers" ("is_active");
    `);
    
    // Create BPM Step Templates table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "bpm_step_templates" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "description" TEXT,
        "company_id" UUID NOT NULL,
        "configuration" JSONB,
        "created_by" UUID NOT NULL,
        "updated_by" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS "bpm_step_templates_company_id_idx" ON "bpm_step_templates" ("company_id");
    `);
    
    // Create BPM Process Instances table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "bpm_process_instances" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "process_id" UUID NOT NULL REFERENCES "bpm_processes" ("id") ON DELETE CASCADE,
        "company_id" UUID NOT NULL,
        "status" bpm_process_instance_status NOT NULL DEFAULT 'CREATED',
        "data" JSONB,
        "current_step_id" TEXT,
        "started_by" UUID NOT NULL,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "created_by" UUID NOT NULL,
        "updated_by" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS "bpm_process_instances_company_id_idx" ON "bpm_process_instances" ("company_id");
      CREATE INDEX IF NOT EXISTS "bpm_process_instances_process_id_idx" ON "bpm_process_instances" ("process_id");
      CREATE INDEX IF NOT EXISTS "bpm_process_instances_status_idx" ON "bpm_process_instances" ("status");
      CREATE INDEX IF NOT EXISTS "bpm_process_instances_started_by_idx" ON "bpm_process_instances" ("started_by");
    `);
    
    // Create BPM Step Executions table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "bpm_step_executions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "process_instance_id" UUID NOT NULL REFERENCES "bpm_process_instances" ("id") ON DELETE CASCADE,
        "step_id" TEXT NOT NULL,
        "status" bpm_step_execution_status NOT NULL DEFAULT 'PENDING',
        "data" JSONB,
        "assigned_to" UUID,
        "company_id" UUID NOT NULL,
        "started_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "created_by" UUID NOT NULL,
        "updated_by" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS "bpm_step_executions_company_id_idx" ON "bpm_step_executions" ("company_id");
      CREATE INDEX IF NOT EXISTS "bpm_step_executions_process_instance_id_idx" ON "bpm_step_executions" ("process_instance_id");
      CREATE INDEX IF NOT EXISTS "bpm_step_executions_status_idx" ON "bpm_step_executions" ("status");
      CREATE INDEX IF NOT EXISTS "bpm_step_executions_assigned_to_idx" ON "bpm_step_executions" ("assigned_to");
    `);
    
    // Create BPM API Connections table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "bpm_api_connections" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "description" TEXT,
        "company_id" UUID NOT NULL,
        "base_url" TEXT NOT NULL,
        "headers" JSONB,
        "authentication" JSONB,
        "status" bpm_api_connection_status NOT NULL DEFAULT 'ACTIVE',
        "created_by" UUID NOT NULL,
        "updated_by" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS "bpm_api_connections_company_id_idx" ON "bpm_api_connections" ("company_id");
      CREATE INDEX IF NOT EXISTS "bpm_api_connections_status_idx" ON "bpm_api_connections" ("status");
    `);
    
    // Create BPM Scheduled Jobs table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "bpm_scheduled_jobs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "description" TEXT,
        "company_id" UUID NOT NULL,
        "cron_expression" TEXT NOT NULL,
        "process_id" UUID NOT NULL REFERENCES "bpm_processes" ("id") ON DELETE CASCADE,
        "data" JSONB,
        "next_run_at" TIMESTAMP WITH TIME ZONE,
        "last_run_at" TIMESTAMP WITH TIME ZONE,
        "status" bpm_scheduled_job_status NOT NULL DEFAULT 'SCHEDULED',
        "created_by" UUID NOT NULL,
        "updated_by" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS "bpm_scheduled_jobs_company_id_idx" ON "bpm_scheduled_jobs" ("company_id");
      CREATE INDEX IF NOT EXISTS "bpm_scheduled_jobs_process_id_idx" ON "bpm_scheduled_jobs" ("process_id");
      CREATE INDEX IF NOT EXISTS "bpm_scheduled_jobs_status_idx" ON "bpm_scheduled_jobs" ("status");
      CREATE INDEX IF NOT EXISTS "bpm_scheduled_jobs_next_run_at_idx" ON "bpm_scheduled_jobs" ("next_run_at");
    `);
    
    logger.info('BPM tables created successfully.');
    
    logger.info('BPM schema migration completed successfully!');
    
  } catch (error) {
    logger.error('Error during BPM schema migration:', { error });
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration
migrateBpmSchema()
  .then(() => {
    console.log('BPM schema migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('BPM schema migration failed:', error);
    process.exit(1);
  });