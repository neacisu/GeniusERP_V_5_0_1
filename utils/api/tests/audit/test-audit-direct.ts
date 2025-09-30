/**
 * Direct Audit Service Test
 * This script tests the AuditService with direct database access
 */

import { v4 as uuidv4 } from 'uuid';
import AuditService, { AuditAction } from './server/modules/audit/services/audit.service';
import { auditLogs } from './server/modules/audit/schema/audit.schema';

async function testDirectAuditService() {
  try {
    console.log('Starting Direct Audit Service Test...');
    
    // Generate test data
    const userId = uuidv4();
    const companyId = uuidv4();
    const entityId = uuidv4();
    
    console.log('Test User ID:', userId);
    console.log('Test Company ID:', companyId);
    console.log('Test Entity ID:', entityId);
    
    // Test logging an audit event
    console.log('\nTesting AuditService.log()...');
    const auditId = await AuditService.log({
      userId,
      companyId,
      action: AuditAction.CREATE,
      entity: 'TestEntity',
      entityId,
      details: { test: true, message: 'This is a test audit log entry' },
      ipAddress: '127.0.0.1',
      userAgent: 'Test Script/1.0'
    });
    
    console.log('Created audit log with ID:', auditId);
    
    if (!auditId) {
      throw new Error('Failed to create audit log');
    }
    
    // Test retrieving entity logs
    console.log('\nTesting AuditService.getEntityLogs()...');
    const entityLogs = await AuditService.getEntityLogs('TestEntity', entityId, companyId);
    console.log(`Retrieved ${entityLogs.length} entity logs`);
    console.log('First entity log:', JSON.stringify(entityLogs[0], null, 2));
    
    // Test retrieving user logs
    console.log('\nTesting AuditService.getUserLogs()...');
    const userLogs = await AuditService.getUserLogs(userId, companyId);
    console.log(`Retrieved ${userLogs.length} user logs`);
    console.log('First user log:', JSON.stringify(userLogs[0], null, 2));
    
    console.log('\nDirect Audit Service Test completed successfully!');
  } catch (error) {
    console.error('Error in testDirectAuditService:', error);
  }
}

// Run the test
testDirectAuditService();