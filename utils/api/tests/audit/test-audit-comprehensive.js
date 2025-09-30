/**
 * Comprehensive Audit Service Test
 * This script tests all aspects of the audit logging system using the global registry
 */
import { v4 as uuidv4 } from 'uuid';

// Import the AuditService class
import { Services, logAction } from './server/common/services/index.js';

async function testAuditService() {
  console.log('Starting comprehensive audit service test...');
  
  // Use test values
  const companyId = '7196288d-7314-4512-8b67-2c82449b5465'; // Example company ID
  const userId = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';    // Example user ID
  
  try {
    // Test 1: Log a simple action via Services registry
    console.log('\n🔍 Test 1: Log a simple action via Services registry');
    const entityId1 = uuidv4();
    await Services.audit.createLog({
      companyId,
      userId,
      action: 'TEST_SIMPLE_ACTION',
      entity: 'test_entity',
      entityId: entityId1,
      details: {
        source: 'test_script',
        testCase: 'Test 1',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Test 1 completed successfully');
    
    // Test 2: Log an action via convenience function
    console.log('\n🔍 Test 2: Log an action via convenience function');
    const entityId2 = uuidv4();
    await logAction({
      companyId,
      userId,
      action: 'TEST_CONVENIENCE_FUNCTION',
      entity: 'test_entity',
      entityId: entityId2,
      details: {
        source: 'test_script',
        testCase: 'Test 2',
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Test 2 completed successfully');
    
    // Test 3: Log with null user (system action)
    console.log('\n🔍 Test 3: Log a system action (null user)');
    const entityId3 = uuidv4();
    await Services.audit.createLog({
      companyId,
      userId: null,
      action: 'TEST_SYSTEM_ACTION',
      entity: 'test_entity',
      entityId: entityId3,
      details: {
        source: 'test_script',
        testCase: 'Test 3',
        isSystemAction: true,
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Test 3 completed successfully');
    
    // Test 4: Log multiple related actions
    console.log('\n🔍 Test 4: Log multiple related actions');
    const parentEntityId = uuidv4();
    
    // Parent action
    await Services.audit.createLog({
      companyId,
      userId,
      action: 'TEST_PARENT_ACTION',
      entity: 'test_parent',
      entityId: parentEntityId,
      details: {
        source: 'test_script',
        testCase: 'Test 4.1',
        isParent: true,
        timestamp: new Date().toISOString()
      }
    });
    
    // Child actions
    for (let i = 0; i < 3; i++) {
      const childEntityId = uuidv4();
      await Services.audit.createLog({
        companyId,
        userId,
        action: 'TEST_CHILD_ACTION',
        entity: 'test_child',
        entityId: childEntityId,
        details: {
          source: 'test_script',
          testCase: `Test 4.2.${i+1}`,
          parentEntityId,
          childIndex: i,
          timestamp: new Date().toISOString()
        }
      });
    }
    console.log('✅ Test 4 completed successfully');
    
    // Test 5: Complex nested details
    console.log('\n🔍 Test 5: Log with complex nested details');
    const entityId5 = uuidv4();
    await Services.audit.createLog({
      companyId,
      userId,
      action: 'TEST_COMPLEX_DETAILS',
      entity: 'test_entity',
      entityId: entityId5,
      details: {
        source: 'test_script',
        testCase: 'Test 5',
        timestamp: new Date().toISOString(),
        metadata: {
          environment: 'test',
          version: '1.0.0',
          features: ['audit', 'security', 'compliance'],
        },
        transaction: {
          id: uuidv4(),
          type: 'test',
          status: 'completed',
          items: [
            { id: '1', name: 'Item 1', value: 100.00 },
            { id: '2', name: 'Item 2', value: 200.00 },
            { id: '3', name: 'Item 3', value: 300.00 }
          ],
          total: 600.00
        }
      }
    });
    console.log('✅ Test 5 completed successfully');
    
    // Test 6: Retrieve audit logs
    console.log('\n🔍 Test 6: Retrieve audit logs');
    // 6.1 - Get all logs
    const allLogs = await Services.audit.getAllLogs();
    console.log(`Retrieved ${allLogs.length} total audit logs`);
    
    // 6.2 - Get logs with filters
    const filteredLogs = await Services.audit.getLogs({
      entity: 'test_entity',
      limit: 10,
      offset: 0
    });
    console.log(`Retrieved ${filteredLogs.length} filtered audit logs`);
    
    // 6.3 - Get logs for specific entity
    const entityLogs = await Services.audit.getLogs({
      entityId: entityId5
    });
    console.log(`Retrieved ${entityLogs.length} logs for entity ${entityId5}`);
    
    console.log('✅ Test 6 completed successfully');
    
    console.log('\n🎉 All audit service tests completed successfully!');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error during audit service tests:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testAuditService()
  .then(result => console.log('Test result:', result))
  .catch(error => console.error('Test failed with error:', error));