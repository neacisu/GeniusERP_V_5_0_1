/**
 * Test Script for Ledger Transaction Recording
 * 
 * This script demonstrates how to use the JournalService's recordTransaction method
 * to create a simple double-entry accounting transaction.
 */

import { JournalService, LedgerEntryType } from 'server/modules/accounting/services/journal.service.js';
import jwt from 'jsonwebtoken';

/**
 * Generate a JWT token for testing
 */
function generateTestToken() {
  const payload = {
    id: "test-user-id",
    email: "test@example.com",
    companyId: "test-company-id",
    roles: ["admin", "accountant"]
  };
  
  // In a real app, this would be an environment variable
  const secret = "test-secret-key";
  
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

/**
 * Test the recordTransaction method
 */
async function testRecordTransaction() {
  try {
    const journalService = new JournalService();
    
    // Simple transaction - debit one account, credit another
    const entryId = await journalService.recordTransaction({
      companyId: "test-company-id",
      debitAccount: "411", // Clients
      creditAccount: "701", // Revenue from product sales
      amount: 1000.00,
      description: "Invoice for product sales",
      documentId: "INV-2025-001",
      documentType: "INVOICE",
      userId: "test-user-id"
    });
    
    console.log("Transaction recorded successfully!");
    console.log("Ledger entry ID:", entryId);
    
    // In a real application, we would query the database to verify the entry
    console.log("✅ Test completed successfully");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testRecordTransaction().catch(console.error);