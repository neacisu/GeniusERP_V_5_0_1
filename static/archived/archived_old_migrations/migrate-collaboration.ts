/**
 * Collaboration Schema Migration Script
 * 
 * This script applies the collaboration schema changes directly to the database
 * using raw SQL queries to ensure compatibility with PostgreSQL.
 */

import 'dotenv/config';
import postgres from 'postgres';
import { Logger } from './server/common/logger';

// Initialize logger
const logger = new Logger({ name: 'migrate-collaboration' });

/**
 * Migrate collaboration schema
 */
async function migrateCollaborationSchema() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create a SQL client
  const sql = postgres(DATABASE_URL, { ssl: 'require' });
  
  try {
    logger.info('Starting collaboration schema migration...');
    
    // Create task status enum
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
          CREATE TYPE task_status AS ENUM (
            'pending', 'in_progress', 'completed', 'blocked', 
            'deferred', 'cancelled', 'review'
          );
        END IF;
      END$$;
    `;
    
    // Create task priority enum
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
          CREATE TYPE task_priority AS ENUM (
            'low', 'normal', 'high', 'urgent', 'critical'
          );
        END IF;
      END$$;
    `;
    
    // Create task type enum
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
          CREATE TYPE task_type AS ENUM (
            'regular', 'project', 'meeting', 'approval', 'review', 'decision'
          );
        END IF;
      END$$;
    `;
    
    // Create collaboration tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS collaboration_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type task_type DEFAULT 'regular',
        status task_status DEFAULT 'pending',
        priority task_priority DEFAULT 'normal',
        assigned_to UUID NOT NULL,
        supervisor_id UUID,
        due_date TIMESTAMP,
        completion_date TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        tags JSONB DEFAULT '[]',
        is_recurring BOOLEAN DEFAULT FALSE,
        recurring_pattern JSONB DEFAULT '{}',
        parent_task_id UUID,
        related_items JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by UUID,
        updated_by UUID
      );
    `;
    
    // Create indexes for collaboration tasks
    await sql`
      CREATE INDEX IF NOT EXISTS collaboration_tasks_company_id_idx ON collaboration_tasks (company_id);
      CREATE INDEX IF NOT EXISTS collaboration_tasks_assigned_to_idx ON collaboration_tasks (assigned_to);
      CREATE INDEX IF NOT EXISTS collaboration_tasks_supervisor_id_idx ON collaboration_tasks (supervisor_id);
      CREATE INDEX IF NOT EXISTS collaboration_tasks_status_idx ON collaboration_tasks (status);
      CREATE INDEX IF NOT EXISTS collaboration_tasks_priority_idx ON collaboration_tasks (priority);
      CREATE INDEX IF NOT EXISTS collaboration_tasks_due_date_idx ON collaboration_tasks (due_date);
      CREATE INDEX IF NOT EXISTS collaboration_tasks_type_idx ON collaboration_tasks (type);
      CREATE INDEX IF NOT EXISTS collaboration_tasks_parent_task_id_idx ON collaboration_tasks (parent_task_id);
    `;
    
    // Create collaboration notes table
    await sql`
      CREATE TABLE IF NOT EXISTS collaboration_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL,
        company_id UUID NOT NULL,
        user_id UUID NOT NULL,
        content TEXT NOT NULL,
        content_html TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        is_pinned BOOLEAN DEFAULT FALSE,
        attachments JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        edited_by UUID
      );
    `;
    
    // Create indexes for collaboration notes
    await sql`
      CREATE INDEX IF NOT EXISTS collaboration_notes_task_id_idx ON collaboration_notes (task_id);
      CREATE INDEX IF NOT EXISTS collaboration_notes_company_id_idx ON collaboration_notes (company_id);
      CREATE INDEX IF NOT EXISTS collaboration_notes_user_id_idx ON collaboration_notes (user_id);
      CREATE INDEX IF NOT EXISTS collaboration_notes_created_at_idx ON collaboration_notes (created_at);
    `;
    
    // Create collaboration threads table
    await sql`
      CREATE TABLE IF NOT EXISTS collaboration_threads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        franchise_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        is_closed BOOLEAN DEFAULT FALSE,
        category VARCHAR(100),
        tags JSONB DEFAULT '[]',
        participants JSONB DEFAULT '[]',
        last_message_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by UUID NOT NULL,
        updated_by UUID
      );
    `;
    
    // Create indexes for collaboration threads
    await sql`
      CREATE INDEX IF NOT EXISTS collaboration_threads_company_id_idx ON collaboration_threads (company_id);
      CREATE INDEX IF NOT EXISTS collaboration_threads_created_by_idx ON collaboration_threads (created_by);
      CREATE INDEX IF NOT EXISTS collaboration_threads_category_idx ON collaboration_threads (category);
      CREATE INDEX IF NOT EXISTS collaboration_threads_last_message_at_idx ON collaboration_threads (last_message_at);
    `;
    
    // Create collaboration messages table
    await sql`
      CREATE TABLE IF NOT EXISTS collaboration_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id UUID NOT NULL,
        company_id UUID NOT NULL,
        user_id UUID NOT NULL,
        content TEXT NOT NULL,
        content_html TEXT,
        is_edited BOOLEAN DEFAULT FALSE,
        attachments JSONB DEFAULT '[]',
        mentions JSONB DEFAULT '[]',
        reply_to_id UUID,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        edited_by UUID
      );
    `;
    
    // Create indexes for collaboration messages
    await sql`
      CREATE INDEX IF NOT EXISTS collaboration_messages_thread_id_idx ON collaboration_messages (thread_id);
      CREATE INDEX IF NOT EXISTS collaboration_messages_company_id_idx ON collaboration_messages (company_id);
      CREATE INDEX IF NOT EXISTS collaboration_messages_user_id_idx ON collaboration_messages (user_id);
      CREATE INDEX IF NOT EXISTS collaboration_messages_created_at_idx ON collaboration_messages (created_at);
      CREATE INDEX IF NOT EXISTS collaboration_messages_reply_to_id_idx ON collaboration_messages (reply_to_id);
    `;
    
    // Create task assignments history table
    await sql`
      CREATE TABLE IF NOT EXISTS collaboration_task_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL,
        company_id UUID NOT NULL,
        assigned_to UUID NOT NULL,
        assigned_by UUID NOT NULL,
        assigned_from UUID,
        comments TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Create indexes for task assignments history
    await sql`
      CREATE INDEX IF NOT EXISTS collaboration_task_assignments_task_id_idx ON collaboration_task_assignments (task_id);
      CREATE INDEX IF NOT EXISTS collaboration_task_assignments_assigned_to_idx ON collaboration_task_assignments (assigned_to);
      CREATE INDEX IF NOT EXISTS collaboration_task_assignments_assigned_by_idx ON collaboration_task_assignments (assigned_by);
      CREATE INDEX IF NOT EXISTS collaboration_task_assignments_created_at_idx ON collaboration_task_assignments (created_at);
    `;
    
    // Create task status history table
    await sql`
      CREATE TABLE IF NOT EXISTS collaboration_task_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL,
        company_id UUID NOT NULL,
        status task_status NOT NULL,
        previous_status task_status,
        changed_by UUID NOT NULL,
        comments TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Create indexes for task status history
    await sql`
      CREATE INDEX IF NOT EXISTS collaboration_task_status_history_task_id_idx ON collaboration_task_status_history (task_id);
      CREATE INDEX IF NOT EXISTS collaboration_task_status_history_status_idx ON collaboration_task_status_history (status);
      CREATE INDEX IF NOT EXISTS collaboration_task_status_history_changed_by_idx ON collaboration_task_status_history (changed_by);
      CREATE INDEX IF NOT EXISTS collaboration_task_status_history_created_at_idx ON collaboration_task_status_history (created_at);
    `;
    
    // Create task watchers table
    await sql`
      CREATE TABLE IF NOT EXISTS collaboration_task_watchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL,
        company_id UUID NOT NULL,
        user_id UUID NOT NULL,
        notification_preference JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    
    // Create indexes for task watchers
    await sql`
      CREATE INDEX IF NOT EXISTS collaboration_task_watchers_task_id_idx ON collaboration_task_watchers (task_id);
      CREATE INDEX IF NOT EXISTS collaboration_task_watchers_user_id_idx ON collaboration_task_watchers (user_id);
      CREATE INDEX IF NOT EXISTS collaboration_task_watchers_task_user_idx ON collaboration_task_watchers (task_id, user_id);
    `;
    
    // Add foreign key constraints
    await sql`
      ALTER TABLE collaboration_notes 
      ADD CONSTRAINT collaboration_notes_task_id_fkey 
      FOREIGN KEY (task_id) REFERENCES collaboration_tasks(id) ON DELETE CASCADE;
      
      ALTER TABLE collaboration_messages 
      ADD CONSTRAINT collaboration_messages_thread_id_fkey 
      FOREIGN KEY (thread_id) REFERENCES collaboration_threads(id) ON DELETE CASCADE;
      
      ALTER TABLE collaboration_task_assignments 
      ADD CONSTRAINT collaboration_task_assignments_task_id_fkey 
      FOREIGN KEY (task_id) REFERENCES collaboration_tasks(id) ON DELETE CASCADE;
      
      ALTER TABLE collaboration_task_status_history 
      ADD CONSTRAINT collaboration_task_status_history_task_id_fkey 
      FOREIGN KEY (task_id) REFERENCES collaboration_tasks(id) ON DELETE CASCADE;
      
      ALTER TABLE collaboration_task_watchers 
      ADD CONSTRAINT collaboration_task_watchers_task_id_fkey 
      FOREIGN KEY (task_id) REFERENCES collaboration_tasks(id) ON DELETE CASCADE;
    `;
    
    logger.info('Collaboration schema migration completed successfully');
  } catch (error) {
    logger.error('Error during collaboration schema migration:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration
migrateCollaborationSchema()
  .then(() => {
    logger.info('Migration completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Migration failed:', error);
    process.exit(1);
  });