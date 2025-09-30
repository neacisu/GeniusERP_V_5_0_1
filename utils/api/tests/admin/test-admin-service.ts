/**
 * Test script for Admin Module Setup Service
 * 
 * This script tests the setup service that tracks company setup progress
 * and configuration steps.
 */

import { SetupService, SetupStepStatus } from './server/modules/admin/services/setup.service';
import { v4 as uuidv4 } from 'uuid';

async function testSetupService() {
  console.log('Testing Admin Module Setup Service...');
  
  try {
    // Create setup service instance
    const setupService = new SetupService();
    
    // Generate test IDs
    const companyId = uuidv4();
    const franchiseId = uuidv4();
    
    console.log(`Test Company ID: ${companyId}`);
    console.log(`Test Franchise ID: ${franchiseId}`);
    
    // Test recording setup steps
    console.log('\nRecording setup steps...');
    
    const steps: { step: string; status: SetupStepStatus }[] = [
      { step: 'company_created', status: 'completed' },
      { step: 'users_configured', status: 'completed' },
      { step: 'accounting_setup', status: 'in_progress' },
      { step: 'warehouse_setup', status: 'not_started' },
    ];
    
    for (const { step, status } of steps) {
      const stepId = await setupService.recordSetupStep(companyId, step, status, franchiseId);
      console.log(`- Recorded step '${step}' with status '${status}', ID: ${stepId}`);
    }
    
    // Test retrieving setup steps
    console.log('\nRetrieving all setup steps for company...');
    const setupSteps = await setupService.getCompanySetupSteps(companyId, franchiseId);
    console.log(`Retrieved ${setupSteps.length} setup steps:`);
    setupSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step.step}: ${step.status} (Updated: ${step.updated_at})`);
    });
    
    // Test checking step completion
    console.log('\nChecking step completion status...');
    const completedSteps = ['company_created', 'users_configured'];
    const inProgressSteps = ['accounting_setup'];
    const notStartedSteps = ['warehouse_setup', 'nonexistent_step'];
    
    for (const step of completedSteps) {
      const isComplete = await setupService.isStepComplete(companyId, step, franchiseId);
      console.log(`- Step '${step}' is ${isComplete ? 'complete' : 'not complete'}`);
    }
    
    for (const step of inProgressSteps) {
      const isComplete = await setupService.isStepComplete(companyId, step, franchiseId);
      console.log(`- Step '${step}' is ${isComplete ? 'complete' : 'not complete'}`);
    }
    
    for (const step of notStartedSteps) {
      const isComplete = await setupService.isStepComplete(companyId, step, franchiseId);
      console.log(`- Step '${step}' is ${isComplete ? 'complete' : 'not complete'}`);
    }
    
    // Test calculating setup progress
    console.log('\nCalculating setup progress...');
    const progress = await setupService.getSetupProgress(companyId, franchiseId);
    console.log(`- Setup progress: ${progress}%`);
    
    console.log('\nAdmin Module Setup Service tests completed successfully!');
  } catch (error) {
    console.error('Error testing Setup Service:', error);
  }
}

// Run the test
testSetupService();