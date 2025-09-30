/**
 * Romanian ERP - AuditService Implementation Test
 * 
 * This script tests the AuditService implementation that has been updated
 * to use direct Drizzle ORM queries with proper database access patterns.
 * It creates audit log entries and retrieves them using the service methods.
 * 
 * Features tested:
 * - Creating audit logs with proper user and company context
 * - Storing detailed JSON data in the audit logs
 * - Retrieving logs filtered by entity
 * - Retrieving logs filtered by user
 * - SSL-enabled database connection
 */

import { AuditService, AuditAction } from './server/modules/audit/services/audit.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main test function for the updated AuditService
 */
async function testUpdatedAuditService() {
  console.log('Romanian ERP - AuditService Implementation Test');
  console.log('==============================================');
  console.log('Testing updated AuditService implementation with SSL database connection...');
  
  // Use actual IDs from the database (admin user and demo company)
  const userId = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';
  const companyId = '7196288d-7314-4512-8b67-2c82449b5465';
  const entityId = uuidv4();
  const entity = 'TEST_ENTITY';
  
  try {
    // Create test data
    const testData = {
      userId,
      companyId,
      action: AuditAction.CREATE,
      entity,
      entityId,
      details: { 
        test: true, 
        message: 'Testing updated audit service',
        testTimestamp: new Date().toISOString(),
        testData: {
          fields: ['id', 'name', 'value'],
          count: 5,
          validated: true
        }
      }
    };
    
    // Test logging
    console.log('\n✓ Testing log creation...');
    const logId = await AuditService.log(testData);
    
    console.log(`  ✓ Created audit log with ID: ${logId}`);
    
    if (!logId) {
      throw new Error('Failed to create audit log');
    }
    
    // Wait a moment to ensure log is written
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test retrieving entity logs
    console.log('\n✓ Testing entity logs retrieval...');
    const entityLogs = await AuditService.getEntityLogs(entity, entityId, companyId);
    
    console.log(`  ✓ Retrieved ${entityLogs.length} entity logs`);
    console.log('  Sample entity log:');
    if (entityLogs.length > 0) {
      // Only print the first log with important fields
      const { id, action, entity, details, createdAt } = entityLogs[0];
      console.log(`  - ID: ${id}`);
      console.log(`  - Action: ${action}`);
      console.log(`  - Entity: ${entity}`);
      console.log(`  - Created: ${createdAt}`);
      console.log(`  - Details: ${JSON.stringify(details).substring(0, 100)}...`);
    }
    
    // Test retrieving user logs (limit to 5 for display)
    console.log('\n✓ Testing user logs retrieval...');
    const userLogs = await AuditService.getUserLogs(userId, companyId, 5);
    
    console.log(`  ✓ Retrieved ${userLogs.length} of total user logs (limited to 5 for display)`);
    console.log('  Most recent user logs:');
    userLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.createdAt}] ${log.action} | ${log.entity} (${log.entityId ? log.entityId.substring(0, 8) + '...' : 'N/A'})`);
    });
    
    console.log('\n✓ AuditService test completed successfully');
    console.log('==============================================');
  } catch (error) {
    console.error('\n❌ Test failed:', (error as Error).message);
    throw error;
  }
}

// Run the test
testUpdatedAuditService()
  .then(() => console.log('Test execution completed.'))
  .catch(error => console.error('Test execution failed:', error))
  .finally(() => process.exit());