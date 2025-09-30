/**
 * Test script for Collaboration Schema
 * 
 * This script tests the collaboration schema by creating and fetching sample records.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  CollaborationTask, 
  CollaborationNote,
  collaborationTasks,
  collaborationNotes,
  collaborationThreads,
  collaborationMessages,
  TaskStatus,
  TaskPriority,
  TaskType
} from './shared/schema/collaboration.schema';
import { Logger } from './server/common/logger';
import { randomUUID } from 'crypto';

// Initialize logger
const logger = new Logger({ name: 'test-collaboration-schema' });

/**
 * Generate a random UUID
 */
function uuidv4(): string {
  return randomUUID();
}

/**
 * Test the collaboration schema implementation
 */
async function testCollaborationSchema() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    logger.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create database client
  const client = postgres(DATABASE_URL, { ssl: 'require' });
  const db = drizzle(client);
  
  // Generate test IDs
  const companyId = uuidv4();
  const userId1 = uuidv4(); 
  const userId2 = uuidv4();
  const createdBy = userId1;
  
  try {
    logger.info('Starting collaboration schema test...');
    
    // 1. Create a test task
    logger.info('Creating test task...');
    const testTask = {
      id: uuidv4(),
      companyId,
      title: 'Test Collaboration Task',
      description: 'This is a test task for the collaboration module',
      type: TaskType.PROJECT,
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      assignedTo: userId1,
      supervisorId: userId2,
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      tags: ['test', 'collaboration', 'sample'],
      relatedItems: { docId: uuidv4() },
      createdBy,
      updatedBy: createdBy
    };
    
    const insertedTask = await db.insert(collaborationTasks).values(testTask).returning();
    logger.info('Inserted task:', insertedTask);
    
    // 2. Create a test note on the task
    logger.info('Creating test note...');
    const testNote = {
      taskId: testTask.id,
      companyId,
      userId: userId1,
      content: 'This is a test note for the collaboration task.',
      contentHtml: '<p>This is a test note for the collaboration task.</p>',
      isPrivate: false,
      isPinned: true,
      attachments: [{ name: 'test-doc.pdf', url: 'https://example.com/test-doc.pdf' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      editedBy: null
    };
    
    const insertedNote = await db.insert(collaborationNotes).values(testNote).returning();
    logger.info('Inserted note:', insertedNote);
    
    // 3. Create a test discussion thread
    logger.info('Creating test discussion thread...');
    const testThread = {
      id: uuidv4(),
      companyId,
      title: 'Test Discussion Thread',
      description: 'This is a test discussion thread for the collaboration module',
      isPrivate: false,
      isClosed: false,
      category: 'general',
      tags: ['discussion', 'test', 'collaboration'],
      participants: [userId1, userId2],
      createdBy: userId1
    };
    
    const insertedThread = await db.insert(collaborationThreads).values(testThread).returning();
    logger.info('Inserted thread:', insertedThread);
    
    // 4. Create test messages in the thread
    logger.info('Creating test messages...');
    const testMessage1 = {
      id: uuidv4(),
      threadId: testThread.id,
      companyId,
      userId: userId1,
      content: 'This is the first message in the test thread.',
      contentHtml: '<p>This is the first message in the test thread.</p>',
      mentions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const testMessage2 = {
      id: uuidv4(),
      threadId: testThread.id,
      companyId,
      userId: userId2,
      content: 'This is a reply to the first message.',
      contentHtml: '<p>This is a reply to the first message.</p>',
      mentions: [userId1],
      replyToId: testMessage1.id,
      createdAt: new Date(Date.now() + 3600000), // 1 hour later
      updatedAt: new Date(Date.now() + 3600000)
    };
    
    const insertedMessage1 = await db.insert(collaborationMessages).values(testMessage1).returning();
    logger.info('Inserted message 1:', insertedMessage1);
    
    const insertedMessage2 = await db.insert(collaborationMessages).values(testMessage2).returning();
    logger.info('Inserted message 2:', insertedMessage2);
    
    // 5. Query and validate the data
    logger.info('Querying inserted data for validation...');
    
    const fetchedTask = await db.select().from(collaborationTasks).where({ id: testTask.id });
    logger.info('Fetched task:', fetchedTask);
    
    const fetchedNotes = await db.select().from(collaborationNotes).where({ taskId: testTask.id });
    logger.info('Fetched notes:', fetchedNotes);
    
    const fetchedThread = await db.select().from(collaborationThreads).where({ id: testThread.id });
    logger.info('Fetched thread:', fetchedThread);
    
    const fetchedMessages = await db.select().from(collaborationMessages).where({ threadId: testThread.id });
    logger.info('Fetched messages:', fetchedMessages);
    
    // 6. Clean up test data (optional - uncomment if needed)
    /*
    logger.info('Cleaning up test data...');
    await db.delete(collaborationMessages).where({ threadId: testThread.id });
    await db.delete(collaborationThreads).where({ id: testThread.id });
    await db.delete(collaborationNotes).where({ taskId: testTask.id });
    await db.delete(collaborationTasks).where({ id: testTask.id });
    */
    
    logger.info('Collaboration schema test completed successfully');
  } catch (error) {
    logger.error('Error during collaboration schema test:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run test
testCollaborationSchema()
  .then(() => {
    logger.info('Test completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Test failed:', error);
    process.exit(1);
  });