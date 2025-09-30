/**
 * Test JournalServiceV2 - Direct Double-Entry Recording
 * 
 * This script tests the JournalServiceV2 implementation with a focus on:
 * 1. Creating ledger entries (double-entry recording)
 * 2. Retrieving ledger entries with their lines
 * 3. Reversing ledger entries
 */

import JournalServiceV2 from '../../../../server/modules/accounting/services/journal-service-v2.ts';
import { getDrizzle } from '../../../../server/common/drizzle/index.ts';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
import { v4 as uuidv4 } from 'uuid';

// Create a random company ID for testing
const COMPANY_ID = process.env.TEST_COMPANY_ID || uuidv4();
console.log(`Using Company ID: ${COMPANY_ID}`);

// Initialize the service
const journalService = new JournalServiceV2();

/**
 * Test the recordTransaction method for direct double-entry recording
 */
async function testRecordTransaction() {
  try {
    console.log('\n--- Testing recordTransaction method ---');
    
    // Create a simple double-entry transaction (debit and credit)
    const transactionId = await journalService.recordTransaction({
      companyId: COMPANY_ID,
      debitAccount: '607', // Expense account (Romanian accounting) - Cheltuieli privind mărfurile
      creditAccount: '401', // Liability account (Romanian accounting) - Furnizori
      amount: 1000.50,
      description: 'Test purchase of merchandise',
      documentId: `INV-${Date.now()}`,
      documentType: 'PURCHASE'
    });
    
    console.log(`Created transaction with ID: ${transactionId}`);
    
    // Verify the entry was created by retrieving it
    const entry = await journalService.getLedgerEntryById(transactionId);
    
    if (!entry) {
      console.error('ERROR: Failed to retrieve the created entry');
      return false;
    }
    
    console.log(`Retrieved entry: ${entry.id}`);
    console.log(`Company ID: ${entry.companyId}`);
    console.log(`Type: ${entry.type}`);
    console.log(`Reference Number: ${entry.referenceNumber}`);
    console.log(`Amount: ${entry.amount}`);
    console.log(`Description: ${entry.description}`);
    console.log(`Created At: ${entry.createdAt}`);
    
    // Verify the lines
    console.log('\nLedger Lines:');
    entry.lines.forEach((line, index) => {
      console.log(`Line ${index + 1}:`);
      console.log(`  Account ID: ${line.accountId}`);
      console.log(`  Debit Amount: ${line.debitAmount}`);
      console.log(`  Credit Amount: ${line.creditAmount}`);
      console.log(`  Description: ${line.description}`);
    });
    
    // Validate that the debit line is for account 607 and the credit line is for account 401
    const debitLine = entry.lines.find(line => line.debitAmount > 0);
    const creditLine = entry.lines.find(line => line.creditAmount > 0);
    
    if (!debitLine || !creditLine) {
      console.error('ERROR: Missing debit or credit line');
      return false;
    }
    
    if (debitLine.accountId !== '607') {
      console.error(`ERROR: Expected debit account 607, got ${debitLine.accountId}`);
      return false;
    }
    
    if (creditLine.accountId !== '401') {
      console.error(`ERROR: Expected credit account 401, got ${creditLine.accountId}`);
      return false;
    }
    
    if (debitLine.debitAmount !== 1000.5) {
      console.error(`ERROR: Expected debit amount 1000.5, got ${debitLine.debitAmount}`);
      return false;
    }
    
    if (creditLine.creditAmount !== 1000.5) {
      console.error(`ERROR: Expected credit amount 1000.5, got ${creditLine.creditAmount}`);
      return false;
    }
    
    console.log('SUCCESS: Transaction recorded and verified correctly!');
    return transactionId;
  } catch (error) {
    console.error('ERROR in testRecordTransaction:', error);
    return false;
  }
}

/**
 * Test the reverseLedgerEntry method
 */
async function testReverseLedgerEntry(ledgerEntryId) {
  try {
    console.log('\n--- Testing reverseLedgerEntry method ---');
    
    if (!ledgerEntryId) {
      console.error('ERROR: Need a valid ledger entry ID to test reversal');
      return false;
    }
    
    // Reverse the ledger entry
    const reversalId = await journalService.reverseLedgerEntry(
      ledgerEntryId,
      'Test reversal'
    );
    
    console.log(`Created reversal with ID: ${reversalId}`);
    
    // Verify the reversal entry
    const reversalEntry = await journalService.getLedgerEntryById(reversalId);
    
    if (!reversalEntry) {
      console.error('ERROR: Failed to retrieve the reversal entry');
      return false;
    }
    
    console.log(`Retrieved reversal entry: ${reversalEntry.id}`);
    console.log(`Type: ${reversalEntry.type}`);
    console.log(`Reference Number: ${reversalEntry.referenceNumber}`);
    console.log(`Amount: ${reversalEntry.amount}`);
    console.log(`Description: ${reversalEntry.description}`);
    
    // Verify the reversed lines
    console.log('\nReversal Ledger Lines:');
    reversalEntry.lines.forEach((line, index) => {
      console.log(`Line ${index + 1}:`);
      console.log(`  Account ID: ${line.accountId}`);
      console.log(`  Debit Amount: ${line.debitAmount}`);
      console.log(`  Credit Amount: ${line.creditAmount}`);
      console.log(`  Description: ${line.description}`);
    });
    
    // The reversal should have the debit and credit accounts swapped
    const debitLine = reversalEntry.lines.find(line => line.debitAmount > 0);
    const creditLine = reversalEntry.lines.find(line => line.creditAmount > 0);
    
    if (!debitLine || !creditLine) {
      console.error('ERROR: Missing debit or credit line in reversal');
      return false;
    }
    
    // In the original, 607 was debited and 401 was credited
    // In the reversal, 401 should be debited and 607 should be credited
    if (debitLine.accountId !== '401') {
      console.error(`ERROR: Expected reversed debit account 401, got ${debitLine.accountId}`);
      return false;
    }
    
    if (creditLine.accountId !== '607') {
      console.error(`ERROR: Expected reversed credit account 607, got ${creditLine.accountId}`);
      return false;
    }
    
    if (debitLine.debitAmount !== 1000.5) {
      console.error(`ERROR: Expected reversed debit amount 1000.5, got ${debitLine.debitAmount}`);
      return false;
    }
    
    if (creditLine.creditAmount !== 1000.5) {
      console.error(`ERROR: Expected reversed credit amount 1000.5, got ${creditLine.creditAmount}`);
      return false;
    }
    
    console.log('SUCCESS: Ledger entry reversed and verified correctly!');
    return true;
  } catch (error) {
    console.error('ERROR in testReverseLedgerEntry:', error);
    return false;
  }
}

/**
 * Test the createLedgerEntry method directly with multiple lines
 */
async function testCreateLedgerEntry() {
  try {
    console.log('\n--- Testing createLedgerEntry method with multiple lines ---');
    
    // Create a complex ledger entry with multiple lines
    const entryId = await journalService.createLedgerEntry({
      companyId: COMPANY_ID,
      type: 'GENERAL',
      amount: 4000,
      description: 'Test complex journal entry',
      lines: [
        {
          accountId: '101', // Capital account
          creditAmount: 4000,
          description: 'Capital contribution'
        },
        {
          accountId: '212', // Building (asset)
          debitAmount: 1500,
          description: 'Building acquisition portion'
        },
        {
          accountId: '213', // Equipment (asset)
          debitAmount: 1000,
          description: 'Equipment acquisition portion'
        },
        {
          accountId: '371', // Merchandise inventory
          debitAmount: 500,
          description: 'Inventory acquisition portion'
        },
        {
          accountId: '371-A', // Test account with analytical (suffix)
          debitAmount: 1000,
          description: 'Testing analytical account'
        },
      ]
    });
    
    console.log(`Created ledger entry with ID: ${entryId}`);
    
    // Verify the entry
    const entry = await journalService.getLedgerEntryById(entryId);
    
    if (!entry) {
      console.error('ERROR: Failed to retrieve the complex entry');
      return false;
    }
    
    console.log(`Retrieved complex entry: ${entry.id}`);
    console.log(`Type: ${entry.type}`);
    console.log(`Amount: ${entry.amount}`);
    console.log(`Description: ${entry.description}`);
    
    // Verify all lines
    console.log('\nComplex Entry Ledger Lines:');
    entry.lines.forEach((line, index) => {
      console.log(`Line ${index + 1}:`);
      console.log(`  Account ID: ${line.accountId}`);
      console.log(`  Debit Amount: ${line.debitAmount}`);
      console.log(`  Credit Amount: ${line.creditAmount}`);
      console.log(`  Description: ${line.description}`);
    });
    
    // Count the number of lines
    if (entry.lines.length !== 5) {
      console.error(`ERROR: Expected 5 lines, got ${entry.lines.length}`);
      return false;
    }
    
    // Calculate total debits and credits
    const totalDebits = entry.lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredits = entry.lines.reduce((sum, line) => sum + line.creditAmount, 0);
    
    console.log(`Total Debits: ${totalDebits}`);
    console.log(`Total Credits: ${totalCredits}`);
    
    // Verify the totals match
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      console.error(`ERROR: Debits (${totalDebits}) and credits (${totalCredits}) don't balance`);
      return false;
    }
    
    console.log('SUCCESS: Complex ledger entry created and verified correctly!');
    return entryId;
    
  } catch (error) {
    console.error('ERROR in testCreateLedgerEntry:', error);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting JournalServiceV2 Tests...');
  
  try {
    // Test recording a simple transaction
    const transactionId = await testRecordTransaction();
    
    if (transactionId) {
      // Test reversal with the created transaction
      await testReverseLedgerEntry(transactionId);
    }
    
    // Test creating a complex ledger entry
    await testCreateLedgerEntry();
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('ERROR in test execution:', error);
  }
}

// Run the tests
runTests();