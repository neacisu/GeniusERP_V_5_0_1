/**
 * BPM Schema Test Script
 * 
 * This script tests the BPM schema by creating and retrieving entities
 * to ensure the database tables are properly set up.
 */

import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { DrizzleService } from './server/common/services/drizzle-service';
import { getDrizzle } from './server/common/drizzle';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { 
  BpmProcessStatus, 
  BpmTriggerType,
  BpmApiConnectionStatus,
  BpmStepExecutionStatus,
  BpmProcessInstanceStatus,
  BpmScheduledJobStatus
} from './shared/schema/bpm.schema';
import { Logger } from './server/common/logger';

// Configuration
const TEST_COMPANY_ID = uuidv4();
const TEST_USER_ID = uuidv4();

// Create logger
const logger = new Logger('debug');

/**
 * Test BPM schema by creating and retrieving entities
 */
async function testBpmSchema() {
  logger.info('Starting BPM schema test...');
  
  // Get database connection
  const db = getDrizzle();
  const drizzleService = new DrizzleService(db);
  
  try {
    // 1. Test Process table
    logger.info('Testing BPM Process table...');
    const processId = uuidv4();
    
    // Create a test process
    const processData = {
      id: processId,
      name: 'Test Process',
      description: 'A test process',
      companyId: TEST_COMPANY_ID,
      steps: {
        nodes: [
          { id: 'start', type: 'start', position: { x: 100, y: 100 } },
          { id: 'task', type: 'task', position: { x: 300, y: 100 } },
          { id: 'end', type: 'end', position: { x: 500, y: 100 } }
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'task' },
          { id: 'e2', source: 'task', target: 'end' }
        ]
      },
      status: BpmProcessStatus.DRAFT,
      isTemplate: false,
      version: '1.0',
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID
    };
    
    await drizzleService.query((tx) => 
      tx.insert(schema.bpmProcesses).values(processData)
    );
    
    // Retrieve the process
    const processes = await drizzleService.query((tx) =>
      tx.select().from(schema.bpmProcesses).where(eq(schema.bpmProcesses.id, processId))
    );
    
    if (processes.length !== 1 || processes[0].id !== processId) {
      throw new Error('Failed to create or retrieve BPM process');
    }
    
    logger.info('BPM Process table is working correctly.');
    
    // 2. Test Trigger table
    logger.info('Testing BPM Trigger table...');
    const triggerId = uuidv4();
    
    // Create a test trigger
    const triggerData = {
      id: triggerId,
      name: 'Test Trigger',
      description: 'A test trigger',
      companyId: TEST_COMPANY_ID,
      type: BpmTriggerType.WEBHOOK,
      processId: processId,
      configuration: {
        endpoint: '/webhook/test',
        method: 'POST'
      },
      isActive: true,
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID
    };
    
    await drizzleService.query((tx) => 
      tx.insert(schema.bpmTriggers).values(triggerData)
    );
    
    // Retrieve the trigger
    const triggers = await drizzleService.query((tx) =>
      tx.select().from(schema.bpmTriggers).where(eq(schema.bpmTriggers.id, triggerId))
    );
    
    if (triggers.length !== 1 || triggers[0].id !== triggerId) {
      throw new Error('Failed to create or retrieve BPM trigger');
    }
    
    logger.info('BPM Trigger table is working correctly.');
    
    // 3. Test Step Template table
    logger.info('Testing BPM Step Template table...');
    const stepTemplateId = uuidv4();
    
    // Create a test step template
    const stepTemplateData = {
      id: stepTemplateId,
      name: 'Approval Step',
      description: 'Generic approval step template',
      companyId: TEST_COMPANY_ID,
      configuration: {
        requiresApproval: true,
        approvalLevels: 1,
        timeoutInHours: 24
      },
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID
    };
    
    await drizzleService.query((tx) => 
      tx.insert(schema.bpmStepTemplates).values(stepTemplateData)
    );
    
    // Retrieve the step template
    const stepTemplates = await drizzleService.query((tx) =>
      tx.select().from(schema.bpmStepTemplates).where(eq(schema.bpmStepTemplates.id, stepTemplateId))
    );
    
    if (stepTemplates.length !== 1 || stepTemplates[0].id !== stepTemplateId) {
      throw new Error('Failed to create or retrieve BPM step template');
    }
    
    logger.info('BPM Step Template table is working correctly.');
    
    // 4. Test Process Instance table
    logger.info('Testing BPM Process Instance table...');
    const processInstanceId = uuidv4();
    
    // Create a test process instance
    const processInstanceData = {
      id: processInstanceId,
      name: 'Test Process Instance',
      processId: processId,
      companyId: TEST_COMPANY_ID,
      status: BpmProcessInstanceStatus.RUNNING,
      data: { key: 'value' },
      currentStepId: 'task',
      startedBy: TEST_USER_ID,
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID
    };
    
    await drizzleService.query((tx) => 
      tx.insert(schema.bpmProcessInstances).values(processInstanceData)
    );
    
    // Retrieve the process instance
    const processInstances = await drizzleService.query((tx) =>
      tx.select().from(schema.bpmProcessInstances).where(eq(schema.bpmProcessInstances.id, processInstanceId))
    );
    
    if (processInstances.length !== 1 || processInstances[0].id !== processInstanceId) {
      throw new Error('Failed to create or retrieve BPM process instance');
    }
    
    logger.info('BPM Process Instance table is working correctly.');
    
    // 5. Test Step Execution table
    logger.info('Testing BPM Step Execution table...');
    const stepExecutionId = uuidv4();
    
    // Create a test step execution
    const stepExecutionData = {
      id: stepExecutionId,
      processInstanceId: processInstanceId,
      stepId: 'task',
      status: BpmStepExecutionStatus.PENDING,
      data: {},
      assignedTo: TEST_USER_ID,
      companyId: TEST_COMPANY_ID,
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID
    };
    
    await drizzleService.query((tx) => 
      tx.insert(schema.bpmStepExecutions).values(stepExecutionData)
    );
    
    // Retrieve the step execution
    const stepExecutions = await drizzleService.query((tx) =>
      tx.select().from(schema.bpmStepExecutions).where(eq(schema.bpmStepExecutions.id, stepExecutionId))
    );
    
    if (stepExecutions.length !== 1 || stepExecutions[0].id !== stepExecutionId) {
      throw new Error('Failed to create or retrieve BPM step execution');
    }
    
    logger.info('BPM Step Execution table is working correctly.');
    
    // 6. Test API Connection table
    logger.info('Testing BPM API Connection table...');
    const apiConnectionId = uuidv4();
    
    // Create a test API connection
    const apiConnectionData = {
      id: apiConnectionId,
      name: 'Test API Connection',
      description: 'A test API connection',
      companyId: TEST_COMPANY_ID,
      baseUrl: 'https://api.example.com',
      headers: { 'Content-Type': 'application/json' },
      authentication: {
        type: 'API_KEY',
        apiKey: 'test-api-key'
      },
      status: BpmApiConnectionStatus.ACTIVE,
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID
    };
    
    await drizzleService.query((tx) => 
      tx.insert(schema.bpmApiConnections).values(apiConnectionData)
    );
    
    // Retrieve the API connection
    const apiConnections = await drizzleService.query((tx) =>
      tx.select().from(schema.bpmApiConnections).where(eq(schema.bpmApiConnections.id, apiConnectionId))
    );
    
    if (apiConnections.length !== 1 || apiConnections[0].id !== apiConnectionId) {
      throw new Error('Failed to create or retrieve BPM API connection');
    }
    
    logger.info('BPM API Connection table is working correctly.');
    
    // 7. Test Scheduled Job table
    logger.info('Testing BPM Scheduled Job table...');
    const scheduledJobId = uuidv4();
    
    // Create a test scheduled job
    const scheduledJobData = {
      id: scheduledJobId,
      name: 'Test Scheduled Job',
      description: 'A test scheduled job',
      companyId: TEST_COMPANY_ID,
      cronExpression: '0 * * * *', // Every hour
      processId: processId,
      data: { type: 'reminder' },
      nextRunAt: new Date(Date.now() + 3600000), // 1 hour from now
      status: BpmScheduledJobStatus.SCHEDULED,
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID
    };
    
    await drizzleService.query((tx) => 
      tx.insert(schema.bpmScheduledJobs).values(scheduledJobData)
    );
    
    // Retrieve the scheduled job
    const scheduledJobs = await drizzleService.query((tx) =>
      tx.select().from(schema.bpmScheduledJobs).where(eq(schema.bpmScheduledJobs.id, scheduledJobId))
    );
    
    if (scheduledJobs.length !== 1 || scheduledJobs[0].id !== scheduledJobId) {
      throw new Error('Failed to create or retrieve BPM scheduled job');
    }
    
    logger.info('BPM Scheduled Job table is working correctly.');
    
    // 8. Clean up test data
    logger.info('Cleaning up test data...');
    
    await drizzleService.query((tx) => tx.delete(schema.bpmProcesses).where(eq(schema.bpmProcesses.id, processId)));
    await drizzleService.query((tx) => tx.delete(schema.bpmTriggers).where(eq(schema.bpmTriggers.id, triggerId)));
    await drizzleService.query((tx) => tx.delete(schema.bpmStepTemplates).where(eq(schema.bpmStepTemplates.id, stepTemplateId)));
    await drizzleService.query((tx) => tx.delete(schema.bpmProcessInstances).where(eq(schema.bpmProcessInstances.id, processInstanceId)));
    await drizzleService.query((tx) => tx.delete(schema.bpmStepExecutions).where(eq(schema.bpmStepExecutions.id, stepExecutionId)));
    await drizzleService.query((tx) => tx.delete(schema.bpmApiConnections).where(eq(schema.bpmApiConnections.id, apiConnectionId)));
    await drizzleService.query((tx) => tx.delete(schema.bpmScheduledJobs).where(eq(schema.bpmScheduledJobs.id, scheduledJobId)));
    
    logger.info('✅ All BPM schema tests passed successfully!');
    return true;
    
  } catch (error) {
    logger.error('❌ BPM schema test failed:', { error });
    throw error;
  }
}

// Run the test
testBpmSchema()
  .then(() => {
    console.log('BPM schema test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('BPM schema test failed:', error);
    process.exit(1);
  });