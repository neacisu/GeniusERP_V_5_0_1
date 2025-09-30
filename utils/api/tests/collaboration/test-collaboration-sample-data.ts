/**
 * Test Script for Collaboration Sample Data
 * 
 * This script inserts sample data into the collaboration tables to verify
 * that the schema is working correctly.
 */

import 'dotenv/config';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './server/common/logger';

// Initialize logger
const logger = new Logger({ name: 'test-collaboration-sample-data' });

/**
 * Insert sample data into collaboration tables
 */
async function insertSampleData() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create a SQL client
  const sql = postgres(DATABASE_URL, { ssl: 'require' });
  
  try {
    logger.info('Starting to insert sample collaboration data...');
    
    // Create sample company and users
    const companyId = uuidv4();
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    const userId3 = uuidv4();
    
    // Create a few tasks
    logger.info('Creating tasks...');
    
    const taskIds = [];
    
    // Task 1: High priority task
    const task1Id = uuidv4();
    taskIds.push(task1Id);
    
    await sql`
      INSERT INTO collaboration_tasks (
        id, company_id, title, description, type, status, priority,
        assigned_to, supervisor_id, due_date, created_by, updated_by
      ) VALUES (
        ${task1Id}, ${companyId}, 'Complete quarterly financial report', 
        'Prepare the Q1 financial report for management review', 
        'regular', 'in_progress', 'high',
        ${userId1}, ${userId2}, ${new Date(2025, 4, 15)}, 
        ${userId2}, ${userId2}
      );
    `;
    
    // Task 2: Project task
    const task2Id = uuidv4();
    taskIds.push(task2Id);
    
    await sql`
      INSERT INTO collaboration_tasks (
        id, company_id, title, description, type, status, priority,
        assigned_to, supervisor_id, due_date, created_by, updated_by
      ) VALUES (
        ${task2Id}, ${companyId}, 'Website redesign project', 
        'Coordinate with marketing team on the new website design', 
        'project', 'pending', 'normal',
        ${userId3}, ${userId2}, ${new Date(2025, 5, 30)}, 
        ${userId2}, ${userId2}
      );
    `;
    
    // Task 3: Meeting task
    const task3Id = uuidv4();
    taskIds.push(task3Id);
    
    await sql`
      INSERT INTO collaboration_tasks (
        id, company_id, title, description, type, status, priority,
        assigned_to, supervisor_id, due_date, created_by, updated_by
      ) VALUES (
        ${task3Id}, ${companyId}, 'Client meeting preparation', 
        'Prepare presentation and materials for the client meeting', 
        'meeting', 'pending', 'urgent',
        ${userId1}, ${userId2}, ${new Date(2025, 4, 10)}, 
        ${userId2}, ${userId2}
      );
    `;
    
    logger.info(`Created ${taskIds.length} tasks successfully`);
    
    // Create notes for tasks
    logger.info('Creating notes for tasks...');
    
    await sql`
      INSERT INTO collaboration_notes (
        id, company_id, task_id, content, user_id, created_at, updated_at
      ) VALUES (
        ${uuidv4()}, ${companyId}, ${task1Id}, 
        'Need to include the new marketing expenses in this report', 
        ${userId2}, ${new Date()}, ${new Date()}
      );
    `;
    
    await sql`
      INSERT INTO collaboration_notes (
        id, company_id, task_id, content, user_id, created_at, updated_at
      ) VALUES (
        ${uuidv4()}, ${companyId}, ${task2Id}, 
        'Marketing team requested a modern design with better mobile support', 
        ${userId3}, ${new Date()}, ${new Date()}
      );
    `;
    
    logger.info('Created notes successfully');
    
    // Create a thread
    logger.info('Creating a thread...');
    
    const threadId = uuidv4();
    
    await sql`
      INSERT INTO collaboration_threads (
        id, company_id, title, description, created_by, updated_by, created_at, updated_at
      ) VALUES (
        ${threadId}, ${companyId}, 'Financial Report Discussion', 
        'Thread for discussing the quarterly financial report', 
        ${userId2}, ${userId2}, ${new Date()}, ${new Date()}
      );
    `;
    
    // Add messages to the thread
    logger.info('Adding messages to the thread...');
    
    await sql`
      INSERT INTO collaboration_messages (
        id, company_id, thread_id, content, user_id, created_at, updated_at
      ) VALUES (
        ${uuidv4()}, ${companyId}, ${threadId}, 
        'When do you think you can have the first draft ready?', 
        ${userId2}, ${new Date()}, ${new Date()}
      );
    `;
    
    await sql`
      INSERT INTO collaboration_messages (
        id, company_id, thread_id, content, user_id, created_at, updated_at
      ) VALUES (
        ${uuidv4()}, ${companyId}, ${threadId}, 
        'I should have it ready by next Monday, but I need the sales figures from the regional offices first.', 
        ${userId1}, ${new Date()}, ${new Date()}
      );
    `;
    
    logger.info('Created messages successfully');
    
    // Create task assignments
    logger.info('Creating task assignments...');
    
    await sql`
      INSERT INTO collaboration_task_assignments (
        id, company_id, task_id, assigned_to, assigned_by, created_at
      ) VALUES (
        ${uuidv4()}, ${companyId}, ${task1Id}, ${userId1}, ${userId2}, ${new Date()}
      );
    `;
    
    await sql`
      INSERT INTO collaboration_task_assignments (
        id, company_id, task_id, assigned_to, assigned_by, created_at
      ) VALUES (
        ${uuidv4()}, ${companyId}, ${task2Id}, ${userId3}, ${userId2}, ${new Date()}
      );
    `;
    
    logger.info('Created task assignments successfully');
    
    // Create task status history
    logger.info('Creating task status history...');
    
    await sql`
      INSERT INTO collaboration_task_status_history (
        id, company_id, task_id, previous_status, status, changed_by, created_at, comments
      ) VALUES (
        ${uuidv4()}, ${companyId}, ${task1Id}, 
        'pending', 'in_progress', ${userId1}, ${new Date()},
        'Started working on the financial report'
      );
    `;
    
    logger.info('Created task status history successfully');
    
    // Create task watchers
    logger.info('Creating task watchers...');
    
    await sql`
      INSERT INTO collaboration_task_watchers (
        id, company_id, task_id, user_id, created_at
      ) VALUES (
        ${uuidv4()}, ${companyId}, ${task1Id}, ${userId3}, ${new Date()}
      );
    `;
    
    logger.info('Created task watchers successfully');
    
    // Verify the data was inserted
    logger.info('Verifying data was inserted correctly...');
    
    const tasksCount = await sql`SELECT COUNT(*) FROM collaboration_tasks;`;
    const notesCount = await sql`SELECT COUNT(*) FROM collaboration_notes;`;
    const threadsCount = await sql`SELECT COUNT(*) FROM collaboration_threads;`;
    const messagesCount = await sql`SELECT COUNT(*) FROM collaboration_messages;`;
    const assignmentsCount = await sql`SELECT COUNT(*) FROM collaboration_task_assignments;`;
    const historyCount = await sql`SELECT COUNT(*) FROM collaboration_task_status_history;`;
    const watchersCount = await sql`SELECT COUNT(*) FROM collaboration_task_watchers;`;
    
    logger.info(`Verification results:`);
    logger.info(`- Tasks: ${tasksCount[0].count}`);
    logger.info(`- Notes: ${notesCount[0].count}`);
    logger.info(`- Threads: ${threadsCount[0].count}`);
    logger.info(`- Messages: ${messagesCount[0].count}`);
    logger.info(`- Task Assignments: ${assignmentsCount[0].count}`);
    logger.info(`- Task Status History: ${historyCount[0].count}`);
    logger.info(`- Task Watchers: ${watchersCount[0].count}`);
    
    logger.info('Sample data insertion completed successfully');
  } catch (error) {
    logger.error('Error during sample data insertion:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the sample data insertion
insertSampleData()
  .then(() => {
    logger.info('================================================');
    logger.info('COLLABORATION SAMPLE DATA INSERTION COMPLETE');
    logger.info('================================================');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Sample data insertion failed:', error);
    process.exit(1);
  });