/**
 * Collaboration Schema Push Script
 * 
 * This script pushes the collaboration schema directly to the database
 * using Drizzle ORM's push method for quick development.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema';
import { sql } from 'drizzle-orm';
import { Logger } from './server/common/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = new Logger({ name: 'push-collaboration-schema' });

/**
 * Push schema changes
 */
async function pushSchemaChanges() {
  logger.info('Pushing collaboration schema to database...');
  
  // Database connection
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.error('DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  // Connect to the database
  const queryClient = postgres(databaseUrl, { ssl: 'require' });
  const db = drizzle(queryClient, { schema });
  
  try {
    // Create task status enum if not exists
    logger.info('Ensuring task_status enum exists...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
          CREATE TYPE task_status AS ENUM (
            'pending', 'in_progress', 'completed', 'blocked', 
            'deferred', 'cancelled', 'review'
          );
        END IF;
      END$$;
    `);
    
    // Create task priority enum if not exists
    logger.info('Ensuring task_priority enum exists...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
          CREATE TYPE task_priority AS ENUM (
            'low', 'normal', 'high', 'urgent', 'critical'
          );
        END IF;
      END$$;
    `);
    
    // Create task type enum if not exists
    logger.info('Ensuring task_type enum exists...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
          CREATE TYPE task_type AS ENUM (
            'regular', 'project', 'meeting', 'approval', 'review', 'decision'
          );
        END IF;
      END$$;
    `);
    
    // Check if the collaboration_tasks table exists
    logger.info('Checking if collaboration_tasks table exists...');
    const [tableExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'collaboration_tasks'
      );
    `);
    
    if (tableExists.exists) {
      logger.info('collaboration_tasks table already exists. Verifying structure...');
      
      // Query the table columns
      const columns = await db.execute(sql`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'collaboration_tasks';
      `);
      
      logger.info(`Found ${columns.length} columns in collaboration_tasks table`);
      
      // Check for required columns
      const requiredColumns = ['id', 'company_id', 'title', 'description', 'assigned_to', 'supervisor_id', 'status', 'priority'];
      const foundColumns = columns.map((col: any) => col.column_name);
      
      const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));
      
      if (missingColumns.length > 0) {
        logger.warn(`Missing columns in collaboration_tasks table: ${missingColumns.join(', ')}`);
        logger.info('Altering table to add missing columns...');
        
        // Add missing columns
        for (const col of missingColumns) {
          switch (col) {
            case 'id':
              await db.execute(sql`ALTER TABLE collaboration_tasks ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();`);
              break;
            case 'company_id':
              await db.execute(sql`ALTER TABLE collaboration_tasks ADD COLUMN company_id UUID NOT NULL;`);
              break;
            case 'title':
              await db.execute(sql`ALTER TABLE collaboration_tasks ADD COLUMN title VARCHAR(255) NOT NULL;`);
              break;
            case 'description':
              await db.execute(sql`ALTER TABLE collaboration_tasks ADD COLUMN description TEXT NOT NULL;`);
              break;
            case 'assigned_to':
              await db.execute(sql`ALTER TABLE collaboration_tasks ADD COLUMN assigned_to UUID NOT NULL;`);
              break;
            case 'supervisor_id':
              await db.execute(sql`ALTER TABLE collaboration_tasks ADD COLUMN supervisor_id UUID;`);
              break;
            case 'status':
              await db.execute(sql`ALTER TABLE collaboration_tasks ADD COLUMN status task_status DEFAULT 'pending';`);
              break;
            case 'priority':
              await db.execute(sql`ALTER TABLE collaboration_tasks ADD COLUMN priority task_priority DEFAULT 'normal';`);
              break;
          }
        }
        
        logger.info('Added missing columns to collaboration_tasks table');
      } else {
        logger.info('All required columns exist in collaboration_tasks table');
      }
    } else {
      logger.info('collaboration_tasks table does not exist. Creating full schema...');
      
      // Create collaboration_tasks table with all required columns and indexes
      await db.execute(sql`
        CREATE TABLE collaboration_tasks (
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
        
        CREATE INDEX collaboration_tasks_company_id_idx ON collaboration_tasks (company_id);
        CREATE INDEX collaboration_tasks_assigned_to_idx ON collaboration_tasks (assigned_to);
        CREATE INDEX collaboration_tasks_supervisor_id_idx ON collaboration_tasks (supervisor_id);
        CREATE INDEX collaboration_tasks_status_idx ON collaboration_tasks (status);
        CREATE INDEX collaboration_tasks_priority_idx ON collaboration_tasks (priority);
        CREATE INDEX collaboration_tasks_due_date_idx ON collaboration_tasks (due_date);
        CREATE INDEX collaboration_tasks_type_idx ON collaboration_tasks (type);
        CREATE INDEX collaboration_tasks_parent_task_id_idx ON collaboration_tasks (parent_task_id);
      `);
      
      logger.info('collaboration_tasks table and indexes created successfully');
    }
    
    // Check for the collaboration_notes table
    logger.info('Checking if collaboration_notes table exists...');
    const [notesTableExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'collaboration_notes'
      );
    `);
    
    if (!notesTableExists.exists) {
      logger.info('Creating collaboration_notes table...');
      await db.execute(sql`
        CREATE TABLE collaboration_notes (
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
        
        CREATE INDEX collaboration_notes_task_id_idx ON collaboration_notes (task_id);
        CREATE INDEX collaboration_notes_company_id_idx ON collaboration_notes (company_id);
        CREATE INDEX collaboration_notes_user_id_idx ON collaboration_notes (user_id);
        CREATE INDEX collaboration_notes_created_at_idx ON collaboration_notes (created_at);
        
        ALTER TABLE collaboration_notes 
        ADD CONSTRAINT collaboration_notes_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES collaboration_tasks(id) ON DELETE CASCADE;
      `);
      
      logger.info('collaboration_notes table and indexes created successfully');
    } else {
      logger.info('collaboration_notes table already exists');
    }
    
    // Check for the collaboration_threads table
    logger.info('Checking if collaboration_threads table exists...');
    const [threadsTableExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'collaboration_threads'
      );
    `);
    
    if (!threadsTableExists.exists) {
      logger.info('Creating collaboration_threads table...');
      await db.execute(sql`
        CREATE TABLE collaboration_threads (
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
        
        CREATE INDEX collaboration_threads_company_id_idx ON collaboration_threads (company_id);
        CREATE INDEX collaboration_threads_created_by_idx ON collaboration_threads (created_by);
        CREATE INDEX collaboration_threads_category_idx ON collaboration_threads (category);
        CREATE INDEX collaboration_threads_last_message_at_idx ON collaboration_threads (last_message_at);
      `);
      
      logger.info('collaboration_threads table and indexes created successfully');
    } else {
      logger.info('collaboration_threads table already exists');
    }
    
    // Check for the collaboration_messages table
    logger.info('Checking if collaboration_messages table exists...');
    const [messagesTableExists] = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'collaboration_messages'
      );
    `);
    
    if (!messagesTableExists.exists) {
      logger.info('Creating collaboration_messages table...');
      await db.execute(sql`
        CREATE TABLE collaboration_messages (
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
        
        CREATE INDEX collaboration_messages_thread_id_idx ON collaboration_messages (thread_id);
        CREATE INDEX collaboration_messages_company_id_idx ON collaboration_messages (company_id);
        CREATE INDEX collaboration_messages_user_id_idx ON collaboration_messages (user_id);
        CREATE INDEX collaboration_messages_created_at_idx ON collaboration_messages (created_at);
        CREATE INDEX collaboration_messages_reply_to_id_idx ON collaboration_messages (reply_to_id);
        
        ALTER TABLE collaboration_messages 
        ADD CONSTRAINT collaboration_messages_thread_id_fkey 
        FOREIGN KEY (thread_id) REFERENCES collaboration_threads(id) ON DELETE CASCADE;
      `);
      
      logger.info('collaboration_messages table and indexes created successfully');
    } else {
      logger.info('collaboration_messages table already exists');
    }
    
    // Create remaining tables if they don't exist
    const tablesToCreate = [
      {
        name: 'collaboration_task_assignments',
        check: async () => {
          const [exists] = await db.execute(sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'collaboration_task_assignments'
            );
          `);
          return exists.exists;
        },
        create: async () => {
          await db.execute(sql`
            CREATE TABLE collaboration_task_assignments (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              task_id UUID NOT NULL,
              company_id UUID NOT NULL,
              assigned_to UUID NOT NULL,
              assigned_by UUID NOT NULL,
              assigned_from UUID,
              comments TEXT,
              created_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
            
            CREATE INDEX collaboration_task_assignments_task_id_idx ON collaboration_task_assignments (task_id);
            CREATE INDEX collaboration_task_assignments_assigned_to_idx ON collaboration_task_assignments (assigned_to);
            CREATE INDEX collaboration_task_assignments_assigned_by_idx ON collaboration_task_assignments (assigned_by);
            CREATE INDEX collaboration_task_assignments_created_at_idx ON collaboration_task_assignments (created_at);
            
            ALTER TABLE collaboration_task_assignments 
            ADD CONSTRAINT collaboration_task_assignments_task_id_fkey 
            FOREIGN KEY (task_id) REFERENCES collaboration_tasks(id) ON DELETE CASCADE;
          `);
        }
      },
      {
        name: 'collaboration_task_status_history',
        check: async () => {
          const [exists] = await db.execute(sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'collaboration_task_status_history'
            );
          `);
          return exists.exists;
        },
        create: async () => {
          await db.execute(sql`
            CREATE TABLE collaboration_task_status_history (
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
            
            CREATE INDEX collaboration_task_status_history_task_id_idx ON collaboration_task_status_history (task_id);
            CREATE INDEX collaboration_task_status_history_status_idx ON collaboration_task_status_history (status);
            CREATE INDEX collaboration_task_status_history_changed_by_idx ON collaboration_task_status_history (changed_by);
            CREATE INDEX collaboration_task_status_history_created_at_idx ON collaboration_task_status_history (created_at);
            
            ALTER TABLE collaboration_task_status_history 
            ADD CONSTRAINT collaboration_task_status_history_task_id_fkey 
            FOREIGN KEY (task_id) REFERENCES collaboration_tasks(id) ON DELETE CASCADE;
          `);
        }
      },
      {
        name: 'collaboration_task_watchers',
        check: async () => {
          const [exists] = await db.execute(sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'collaboration_task_watchers'
            );
          `);
          return exists.exists;
        },
        create: async () => {
          await db.execute(sql`
            CREATE TABLE collaboration_task_watchers (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              task_id UUID NOT NULL,
              company_id UUID NOT NULL,
              user_id UUID NOT NULL,
              notification_preference JSONB DEFAULT '{}',
              created_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
            
            CREATE INDEX collaboration_task_watchers_task_id_idx ON collaboration_task_watchers (task_id);
            CREATE INDEX collaboration_task_watchers_user_id_idx ON collaboration_task_watchers (user_id);
            CREATE INDEX collaboration_task_watchers_task_user_idx ON collaboration_task_watchers (task_id, user_id);
            
            ALTER TABLE collaboration_task_watchers 
            ADD CONSTRAINT collaboration_task_watchers_task_id_fkey 
            FOREIGN KEY (task_id) REFERENCES collaboration_tasks(id) ON DELETE CASCADE;
          `);
        }
      }
    ];
    
    // Create each table if it doesn't exist
    for (const table of tablesToCreate) {
      logger.info(`Checking if ${table.name} table exists...`);
      const exists = await table.check();
      
      if (!exists) {
        logger.info(`Creating ${table.name} table...`);
        await table.create();
        logger.info(`${table.name} table and indexes created successfully`);
      } else {
        logger.info(`${table.name} table already exists`);
      }
    }
    
    logger.info('Collaboration schema push completed successfully');
  } catch (error) {
    logger.error('Error pushing collaboration schema:', error);
    throw error;
  } finally {
    await queryClient.end();
  }
}

// Run schema push
pushSchemaChanges()
  .then(() => {
    logger.info('Schema push completed.');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Schema push failed:', error);
    process.exit(1);
  });