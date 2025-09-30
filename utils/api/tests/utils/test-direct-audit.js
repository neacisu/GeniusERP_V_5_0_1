// Direct test of AuditService without going through API
import { auditService, AuditService } from './server/modules/audit/services/audit.service';
import { v4 as uuidv4 } from 'uuid';

async function testDirectAuditService() {
  try {
    console.log('Testing AuditService directly without going through API...');
    
    const companyId = '7196288d-7314-4512-8b67-2c82449b5465'; // Using existing company ID
    const entityId = uuidv4();
    
    // Test createLog method
    await auditService.createLog({
      companyId,
      userId: '49e12af8-dbd0-48db-b5bd-4fb3f6a39787', // Using existing user ID
      action: 'DIRECT_TEST',
      entity: 'direct_test',
      entityId,
      details: {
        source: 'direct_test',
        message: 'Testing auditService.createLog directly from Node.js script',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('Test successful! Check the database for new entries.');
    process.exit(0);
  } catch (error) {
    console.error('Error in direct test:', error);
    process.exit(1);
  }
}

// Run the test
testDirectAuditService();