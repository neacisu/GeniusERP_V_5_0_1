/**
 * Test script for the Collaboration Module
 * 
 * This script demonstrates initializing and using the Collaboration module.
 */

import 'dotenv/config';
import express from 'express';
import { logger } from './server/common/logger';
import { CollabModule } from './server/modules/collab/collab.module';
import { getDrizzle } from './server/common/drizzle';

async function testCollabModule() {
  try {
    // Create Express app
    const app = express();
    app.use(express.json());
    
    // Create database connection
    const db = getDrizzle();
    
    // Initialize Collaboration module
    const collabModule = CollabModule.getInstance();
    collabModule.initialize(db);
    
    // Register routes
    collabModule.registerRoutes(app);
    
    // Start the module (if needed)
    collabModule.start();
    
    logger.info('Collaboration module initialized successfully');
    logger.info('The following routes are available:');
    logger.info('- /api/collaboration/tasks');
    logger.info('- /api/collaboration/notes');
    logger.info('- /api/collaboration/threads');
    logger.info('- /api/collaboration/messages');
    logger.info('- /api/collaboration/watchers');
    
    // Test a method from TaskService
    // In a real scenario, you would call these through the APIs
    const task = await collabModule.taskService.getTaskById('some-task-id', 'some-company-id');
    logger.info('Task retrieval test:', task ? 'Successful' : 'Not found (expected)');
    
    // Stop the module when done
    collabModule.stop();
    
    logger.info('Collaboration module test completed successfully');
  } catch (error) {
    logger.error('Error in Collaboration module test', { error });
    throw error;
  }
}

// Run the test
testCollabModule()
  .then(() => {
    logger.info('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Test failed', { error });
    process.exit(1);
  });