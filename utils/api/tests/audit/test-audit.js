// Test script for audit logging
import { storage } from './server/storage.js';

async function testAuditLogging() {
  try {
    console.log('Testing audit logging...');
    
    // Create a test audit log
    const auditLog = {
      companyId: '7196288d-7314-4512-8b67-2c82449b5465',
      userId: '49e12af8-dbd0-48db-b5bd-4fb3f6a39787',
      action: 'TEST_SCRIPT',
      entity: 'script',
      entityId: '00000000-0000-0000-0000-000000000000',
      details: {
        source: 'test_script',
        timestamp: new Date().toISOString(),
        message: 'Testing direct call to storage.createAuditLog'
      }
    };
    
    // Call the storage method
    const result = await storage.createAuditLog(auditLog);
    console.log('Audit log created:', result);
    
    // Retrieve the audit logs
    const logs = await storage.getAuditLogs({
      action: 'TEST_SCRIPT',
      limit: 5
    });
    
    console.log('Retrieved logs:', logs);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing audit logging:', error);
  }
}

// Run the test
testAuditLogging();