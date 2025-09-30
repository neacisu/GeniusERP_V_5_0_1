/**
 * AuditService Demo
 * 
 * This file demonstrates how to use the globally registered AuditService
 * through the Services registry from anywhere in the application.
 */
import { v4 as uuidv4 } from 'uuid';

// Import the Services registry
import { Services, logAction } from '../common/services';

/**
 * Example function demonstrating the use of AuditService via the global Services registry
 */
export async function demoUsingServicesRegistry() {
  const companyId = '7196288d-7314-4512-8b67-2c82449b5465'; // Example company ID
  const userId = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';     // Example user ID
  const entityId = uuidv4();
  
  try {
    // Using the AuditService through the Services registry
    await Services.audit.createLog({
      companyId,
      userId,
      action: 'DEMO_SERVICE_REGISTRY',
      entity: 'demo',
      entityId,
      details: {
        source: 'demo_script',
        message: 'Using AuditService through the global Services registry',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('Successfully logged action via Services registry');
    
    // Using the convenience function
    await logAction({
      companyId,
      userId,
      action: 'DEMO_CONVENIENCE_FUNCTION',
      entity: 'demo',
      entityId,
      details: {
        source: 'demo_script',
        message: 'Using convenience function from the global Services registry',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('Successfully logged action via convenience function');
    
    return {
      success: true,
      message: 'Successfully demonstrated AuditService through global registry'
    };
  } catch (error) {
    console.error('Error in AuditService demo:', error);
    return {
      success: false,
      message: 'Error demonstrating AuditService'
    };
  }
}