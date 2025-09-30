/**
 * BPM Process Service Test Script
 * 
 * This script tests the BPM Process Service functionality including:
 * - Creating a process definition
 * - Retrieving process definitions
 * - Updating a process
 * - Managing process statuses
 * - Working with templates
 */

import { v4 as uuidv4 } from 'uuid';
import { DrizzleService } from './server/common/services/drizzle-service';
import { getDrizzle } from './server/common/drizzle';
import { BpmProcessStatus } from './shared/schema/bpm.schema';
import { ProcessService } from './server/modules/bpm/services/process.service';
import { Logger } from './server/common/logger';

// Create test logger
const logger = new Logger({ logLevel: 'debug' });

// Test process data
const testCompanyId = uuidv4();
const testUserId = uuidv4();

/**
 * Test the BPM Process Service
 */
async function testBpmProcessService() {
  logger.info('Starting BPM Process Service test...');
  
  // Create database connection with DrizzleService
  const db = getDrizzle();
  const drizzleService = new DrizzleService(db);
  
  // Initialize the Process Service
  const processService = new ProcessService(drizzleService);
  
  try {
    // 1. Create a sample process
    logger.info('Creating test process...');
    const newProcess = await processService.createProcess({
      name: 'Test Approval Workflow',
      description: 'A test approval workflow with multiple steps',
      companyId: testCompanyId,
      createdBy: testUserId,
      updatedBy: testUserId,
      steps: {
        nodes: [
          { id: 'start', type: 'start', position: { x: 100, y: 100 } },
          { id: 'approval', type: 'task', position: { x: 300, y: 100 }, data: { name: 'Manager Approval' } },
          { id: 'end', type: 'end', position: { x: 500, y: 100 } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'approval' },
          { id: 'e2', source: 'approval', target: 'end' }
        ]
      },
      status: BpmProcessStatus.DRAFT,
      isTemplate: false,
      version: '1.0'
    });
    
    logger.info('Created test process:', { id: newProcess.id, name: newProcess.name });
    
    // 2. Get process by ID
    const retrievedProcess = await processService.getProcessById(newProcess.id);
    
    if (!retrievedProcess) {
      throw new Error('Failed to retrieve process by ID');
    }
    
    logger.info('Successfully retrieved process by ID:', { id: retrievedProcess.id, name: retrievedProcess.name });
    
    // 3. Update the process
    const updatedProcess = await processService.updateProcess(newProcess.id, {
      name: 'Updated Approval Workflow',
      description: 'This process has been updated',
      updatedBy: testUserId
    });
    
    if (!updatedProcess) {
      throw new Error('Failed to update process');
    }
    
    logger.info('Successfully updated process:', { id: updatedProcess.id, name: updatedProcess.name });
    
    // 4. Change process status to ACTIVE
    const activatedProcess = await processService.changeProcessStatus(
      newProcess.id, 
      BpmProcessStatus.ACTIVE, 
      testUserId
    );
    
    if (!activatedProcess) {
      throw new Error('Failed to activate process');
    }
    
    logger.info('Successfully activated process:', { id: activatedProcess.id, status: activatedProcess.status });
    
    // 5. Create a template process
    logger.info('Creating test template process...');
    const templateProcess = await processService.createProcess({
      name: 'Invoice Approval Template',
      description: 'A reusable template for invoice approvals',
      companyId: testCompanyId,
      createdBy: testUserId,
      updatedBy: testUserId,
      steps: {
        nodes: [
          { id: 'start', type: 'start', position: { x: 100, y: 100 } },
          { id: 'validate', type: 'task', position: { x: 300, y: 100 }, data: { name: 'Validate Invoice' } },
          { id: 'approve', type: 'task', position: { x: 500, y: 100 }, data: { name: 'Finance Approval' } },
          { id: 'end', type: 'end', position: { x: 700, y: 100 } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'validate' },
          { id: 'e2', source: 'validate', target: 'approve' },
          { id: 'e3', source: 'approve', target: 'end' }
        ]
      },
      status: BpmProcessStatus.ACTIVE,
      isTemplate: true,
      version: '1.0'
    });
    
    logger.info('Created template process:', { id: templateProcess.id, name: templateProcess.name });
    
    // 6. Get all templates
    const templates = await processService.getProcessTemplates(testCompanyId);
    
    logger.info(`Retrieved ${templates.length} templates`);
    
    // 7. Create a new process from template
    const processFromTemplate = await processService.createFromTemplate(
      templateProcess.id,
      {
        name: 'Invoice #12345 Approval',
        companyId: testCompanyId,
        userId: testUserId
      }
    );
    
    if (!processFromTemplate) {
      throw new Error('Failed to create process from template');
    }
    
    logger.info('Successfully created process from template:', { 
      id: processFromTemplate.id, 
      name: processFromTemplate.name,
      isTemplate: processFromTemplate.isTemplate,
      stepsFromTemplate: processFromTemplate.steps !== null
    });
    
    // 8. Duplicate a process
    const duplicatedProcess = await processService.duplicateProcess(
      newProcess.id,
      {
        asTemplate: true,
        newName: 'Duplicated Approval Template',
        userId: testUserId
      }
    );
    
    if (!duplicatedProcess) {
      throw new Error('Failed to duplicate process');
    }
    
    logger.info('Successfully duplicated process as template:', { 
      id: duplicatedProcess.id, 
      name: duplicatedProcess.name,
      isTemplate: duplicatedProcess.isTemplate
    });
    
    // 9. Get processes with filtering
    const activeProcesses = await processService.getProcesses(
      testCompanyId,
      {
        status: [BpmProcessStatus.ACTIVE],
        isTemplate: false
      }
    );
    
    logger.info(`Retrieved ${activeProcesses.data.length} active processes that are not templates`);
    
    const templateProcesses = await processService.getProcesses(
      testCompanyId,
      { isTemplate: true }
    );
    
    logger.info(`Retrieved ${templateProcesses.data.length} template processes`);
    
    // 10. Delete processes
    logger.info('Deleting test processes...');
    
    const deleteResults = await Promise.all([
      processService.deleteProcess(newProcess.id),
      processService.deleteProcess(templateProcess.id),
      processService.deleteProcess(processFromTemplate!.id),
      processService.deleteProcess(duplicatedProcess.id)
    ]);
    
    logger.info(`Deleted ${deleteResults.filter(result => result).length} test processes`);
    
    logger.info('✅ All BPM Process Service tests passed successfully!');
    
  } catch (error) {
    logger.error('❌ BPM Process Service test failed:', { error });
    throw error;
  }
}

// Run the test
testBpmProcessService()
  .then(() => {
    console.log('BPM Process Service test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('BPM Process Service test failed:', error);
    process.exit(1);
  });