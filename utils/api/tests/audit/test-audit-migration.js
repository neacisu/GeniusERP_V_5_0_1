// Test script to verify audit logging after migration
import { storage } from './server/storage.ts';

(async function testAuditLogging() {
  try {
    console.log("Testing audit log functionality after migration...");
    
    // Create a test audit log entry
    const auditLog = await storage.createAuditLog({
      companyId: "7196288d-7314-4512-8b67-2c82449b5465", // Using existing company ID
      userId: "49e12af8-dbd0-48db-b5bd-4fb3f6a39787",     // Using existing user ID
      action: "MIGRATION_TEST",
      entity: "migration",
      entityId: "00000000-0000-0000-0000-000000000000",
      details: {
        source: "migration_test",
        message: "Testing audit log after Drizzle migration",
        timestamp: new Date().toISOString()
      }
    });
    
    console.log("Successfully created audit log:", auditLog.id);
    
    // Query audit log entries
    const auditLogs = await storage.getAuditLogs({
      action: "MIGRATION_TEST",
      limit: 1
    });
    
    console.log("Retrieved audit logs:", auditLogs.length);
    console.log("First log:", auditLogs[0]);
    
    console.log("Audit log migration test successful!");
  } catch (error) {
    console.error("Error testing audit log:", error);
  }
})();