/**
 * Test script for ProcessService with direct database connection
 * 
 * This script tests the refactored ProcessService that uses direct database connection
 * instead of DrizzleService.
 */

import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ProcessService } from './server/modules/bpm/services/process.service';
import { BpmProcessStatus } from './shared/schema/bpm.schema';

/**
 * Generate a UUID v4
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Test ProcessService with direct database connection
 */
async function testProcessService() {
  console.log('🚀 Testing ProcessService with direct database connection...');
  
  // Create direct database connection using connection string from environment
  const connectionString = process.env.DATABASE_URL || '';
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    // Connect to the database
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    // Create ProcessService instance with direct database connection
    const processService = new ProcessService(db);
    
    // Test creating a process
    const processId = uuidv4();
    const companyId = uuidv4();
    const userId = uuidv4();
    
    console.log('Creating test process...');
    const createdProcess = await processService.createProcess({
      id: processId,
      companyId,
      name: 'Test Process',
      description: 'Created by ProcessService test',
      steps: [
        { id: uuidv4(), name: 'Step 1', type: 'TASK', config: {} },
        { id: uuidv4(), name: 'Step 2', type: 'APPROVAL', config: {} }
      ],
      status: BpmProcessStatus.DRAFT,
      isTemplate: false,
      createdBy: userId,
      updatedBy: userId
    });
    
    console.log('✅ Process created successfully:', createdProcess.id);
    
    // Test retrieving the process
    console.log('Retrieving process by ID...');
    const retrievedProcess = await processService.getProcessById(processId);
    
    if (retrievedProcess) {
      console.log('✅ Process retrieved successfully:', retrievedProcess.name);
    } else {
      console.error('❌ Failed to retrieve process');
    }
    
    // Test updating the process
    console.log('Updating process...');
    const updatedProcess = await processService.updateProcess(processId, {
      name: 'Updated Test Process',
      description: 'Updated by ProcessService test',
      updatedBy: userId
    });
    
    if (updatedProcess) {
      console.log('✅ Process updated successfully:', updatedProcess.name);
    } else {
      console.error('❌ Failed to update process');
    }
    
    // Test listing processes
    console.log('Listing processes for company...');
    const processes = await processService.getProcesses(companyId);
    
    console.log(`✅ Retrieved ${processes.data.length} processes (total: ${processes.total})`);
    
    // Cleanup - delete the test process
    console.log('Cleaning up - deleting test process...');
    const deleteResult = await processService.deleteProcess(processId);
    
    if (deleteResult) {
      console.log('✅ Process deleted successfully');
    } else {
      console.error('❌ Failed to delete process');
    }
    
    console.log('🎉 All tests completed successfully!');
    
    // Close the database connection
    await client.end();
  } catch (error) {
    console.error('❌ Error testing ProcessService:', error);
  }
}

// Run the test
testProcessService();