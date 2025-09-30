/**
 * Direct BPM Schema Migration Script
 * 
 * This script applies the BPM schema directly to the database
 * using raw SQL queries for PostgreSQL compatibility.
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migrate BPM schema directly
 */
async function migrateBpmDirect() {
  console.log('Starting direct BPM schema migration...');
  
  // Create a database connection
  const sql = postgres(process.env.DATABASE_URL || '', {
    max: 1,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : true,
    idle_timeout: 20,
    connect_timeout: 30,
  });
  
  try {
    // Create enum types if they don't exist
    console.log('Creating BPM enum types if they don\'t exist...');
    
    // Process status enum
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bpm_process_status') THEN
          CREATE TYPE bpm_process_status AS ENUM ('draft', 'active', 'paused', 'archived');
        END IF;
      END
      $$;
    `);
    
    // Trigger type enum
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trigger_type') THEN
          CREATE TYPE trigger_type AS ENUM ('scheduled', 'event_based', 'data_change', 'manual', 'api_webhook');
        END IF;
      END
      $$;
    `);
    
    // Process step type enum
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'process_step_type') THEN
          CREATE TYPE process_step_type AS ENUM ('action', 'decision', 'delay', 'notification', 'approval', 'subprocess', 'api_call', 'document_generation');
        END IF;
      END
      $$;
    `);
    
    // Action target type enum
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_target_type') THEN
          CREATE TYPE action_target_type AS ENUM ('invoicing', 'inventory', 'crm', 'logistics', 'accounting', 'documents', 'communications', 'marketing', 'external_api');
        END IF;
      END
      $$;
    `);
    
    // Create BPM Processes table
    console.log('Creating bpm_processes table if it doesn\'t exist...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS bpm_processes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        name TEXT NOT NULL,
        description TEXT,
        steps JSONB NOT NULL,
        status TEXT DEFAULT 'draft',
        is_template BOOLEAN DEFAULT false,
        version VARCHAR(20) DEFAULT '1.0.0',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );
    `);
    
    // Create indexes for bpm_processes
    console.log('Creating indexes for bpm_processes...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_company_idx') THEN
          CREATE INDEX bpm_company_idx ON bpm_processes(company_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_franchise_idx') THEN
          CREATE INDEX bpm_franchise_idx ON bpm_processes(franchise_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_status_idx') THEN
          CREATE INDEX bpm_status_idx ON bpm_processes(status);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_template_idx') THEN
          CREATE INDEX bpm_template_idx ON bpm_processes(is_template);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_created_at_idx') THEN
          CREATE INDEX bpm_created_at_idx ON bpm_processes(created_at);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_combined_idx') THEN
          CREATE INDEX bpm_combined_idx ON bpm_processes(company_id, franchise_id, status, created_at);
        END IF;
      END
      $$;
    `);
    
    // Create BPM Triggers table
    console.log('Creating bpm_triggers table if it doesn\'t exist...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS bpm_triggers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        process_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        condition JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );
    `);
    
    // Create indexes for bpm_triggers
    console.log('Creating indexes for bpm_triggers...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_trigger_process_idx') THEN
          CREATE INDEX bpm_trigger_process_idx ON bpm_triggers(process_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_trigger_type_idx') THEN
          CREATE INDEX bpm_trigger_type_idx ON bpm_triggers(type);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_trigger_active_idx') THEN
          CREATE INDEX bpm_trigger_active_idx ON bpm_triggers(is_active);
        END IF;
      END
      $$;
    `);
    
    // Create Process Instances table
    console.log('Creating bpm_process_instances table if it doesn\'t exist...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS bpm_process_instances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        process_id UUID NOT NULL,
        trigger_id UUID,
        company_id UUID NOT NULL,
        context_data JSONB,
        current_step VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'running',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        created_by UUID,
        last_updated_by UUID
      );
    `);
    
    // Create indexes for bpm_process_instances
    console.log('Creating indexes for bpm_process_instances...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_instance_process_idx') THEN
          CREATE INDEX bpm_instance_process_idx ON bpm_process_instances(process_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_instance_company_idx') THEN
          CREATE INDEX bpm_instance_company_idx ON bpm_process_instances(company_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_instance_status_idx') THEN
          CREATE INDEX bpm_instance_status_idx ON bpm_process_instances(status);
        END IF;
      END
      $$;
    `);
    
    // Create Step Templates table
    console.log('Creating bpm_step_templates table if it doesn\'t exist...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS bpm_step_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        configuration JSONB NOT NULL,
        target_type TEXT,
        is_global BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );
    `);
    
    // Create indexes for bpm_step_templates
    console.log('Creating indexes for bpm_step_templates...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_template_company_idx') THEN
          CREATE INDEX bpm_template_company_idx ON bpm_step_templates(company_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_template_type_idx') THEN
          CREATE INDEX bpm_template_type_idx ON bpm_step_templates(type);
        END IF;
      END
      $$;
    `);
    
    // Create Step Executions table
    console.log('Creating bpm_step_executions table if it doesn\'t exist...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS bpm_step_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        instance_id UUID NOT NULL,
        step_id VARCHAR(100) NOT NULL,
        step_type TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        input_data JSONB,
        output_data JSONB,
        error_data JSONB,
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        executed_by UUID
      );
    `);
    
    // Create indexes for bpm_step_executions
    console.log('Creating indexes for bpm_step_executions...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_exec_instance_idx') THEN
          CREATE INDEX bpm_exec_instance_idx ON bpm_step_executions(instance_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_exec_status_idx') THEN
          CREATE INDEX bpm_exec_status_idx ON bpm_step_executions(status);
        END IF;
      END
      $$;
    `);
    
    // Create Approvals table
    console.log('Creating bpm_approvals table if it doesn\'t exist...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS bpm_approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        execution_id UUID NOT NULL,
        user_id UUID NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        comments TEXT,
        approval_data JSONB,
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        responded_at TIMESTAMP WITH TIME ZONE,
        reminders_sent JSONB DEFAULT '[]'
      );
    `);
    
    // Create indexes for bpm_approvals
    console.log('Creating indexes for bpm_approvals...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_approval_execution_idx') THEN
          CREATE INDEX bpm_approval_execution_idx ON bpm_approvals(execution_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_approval_user_idx') THEN
          CREATE INDEX bpm_approval_user_idx ON bpm_approvals(user_id);
        END IF;
      END
      $$;
    `);
    
    // Create API Connections table
    console.log('Creating bpm_api_connections table if it doesn\'t exist...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS bpm_api_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        name TEXT NOT NULL,
        provider VARCHAR(100) NOT NULL,
        connection_type VARCHAR(50) NOT NULL,
        base_url TEXT NOT NULL,
        auth_type VARCHAR(50) NOT NULL,
        auth_data JSONB,
        headers JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        last_tested_at TIMESTAMP WITH TIME ZONE
      );
    `);
    
    // Create indexes for bpm_api_connections
    console.log('Creating indexes for bpm_api_connections...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_api_company_idx') THEN
          CREATE INDEX bpm_api_company_idx ON bpm_api_connections(company_id);
        END IF;
      END
      $$;
    `);
    
    // Create Scheduled Jobs table
    console.log('Creating bpm_scheduled_jobs table if it doesn\'t exist...');
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS bpm_scheduled_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        process_id UUID NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        cron_expression VARCHAR(100) NOT NULL,
        timezone VARCHAR(50) DEFAULT 'UTC',
        input_data JSONB,
        is_active BOOLEAN DEFAULT true,
        last_run_at TIMESTAMP WITH TIME ZONE,
        next_run_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );
    `);
    
    // Create indexes for bpm_scheduled_jobs
    console.log('Creating indexes for bpm_scheduled_jobs...');
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_sched_company_idx') THEN
          CREATE INDEX bpm_sched_company_idx ON bpm_scheduled_jobs(company_id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bpm_sched_process_idx') THEN
          CREATE INDEX bpm_sched_process_idx ON bpm_scheduled_jobs(process_id);
        END IF;
      END
      $$;
    `);
    
    console.log('BPM schema migration completed successfully!');
    
  } catch (error) {
    console.error('Error during BPM schema migration:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration
migrateBpmDirect()
  .then(() => {
    console.log('BPM schema migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('BPM schema migration failed:', error);
    process.exit(1);
  });