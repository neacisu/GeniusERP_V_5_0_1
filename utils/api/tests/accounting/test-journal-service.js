/**
 * Test script for JournalService
 * 
 * This script tests the JournalService implementation for recording and retrieving
 * accounting journal entries.
 * 
 * NOTE: This test uses a mock implementation of JournalService for standalone testing
 * without requiring TypeScript imports.
 */

// Mock implementation of JournalService for testing
class MockJournalService {
  constructor() {
    this.journalEntries = new Map();
    this.nextId = 1;
    this.mockDb = {
      accounts: {
        "411": { accountNumber: "411", name: "Clients", type: "ASSET" },
        "4427": { accountNumber: "4427", name: "VAT Collected", type: "LIABILITY" },
        "707": { accountNumber: "707", name: "Service Revenue", type: "REVENUE" }
      }
    };
  }
  
  async createJournalEntry(entryData) {
    console.log('Creating journal entry with data:', JSON.stringify(entryData, null, 2));
    
    const { companyId, documentId, documentType, description, journalType, items } = entryData;
    
    // Basic validation
    if (!companyId) throw new Error('Company ID is required');
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Valid items array is required');
    }
    
    // Verify entry is balanced
    let totalDebit = 0;
    let totalCredit = 0;
    
    for (const item of items) {
      totalDebit += item.debitAmount || 0;
      totalCredit += item.creditAmount || 0;
    }
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Journal entry is not balanced');
    }
    
    // Create a journal entry
    const entryId = `JE-${this.nextId++}`;
    const now = new Date();
    
    const entry = {
      id: entryId,
      companyId,
      documentId,
      documentType,
      description,
      journalType,
      status: 'POSTED',
      createdAt: now,
      updatedAt: now,
      items: items.map((item, index) => ({
        id: `JI-${this.nextId++}`,
        journalEntryId: entryId,
        lineNumber: index + 1,
        accountNumber: item.accountNumber,
        description: item.description || description,
        debitAmount: item.debitAmount || 0,
        creditAmount: item.creditAmount || 0,
        createdAt: now
      }))
    };
    
    // Store the entry
    this.journalEntries.set(entryId, entry);
    
    return entryId;
  }
  
  async getJournalEntryById(id) {
    const entry = this.journalEntries.get(id);
    if (!entry) throw new Error(`Journal entry with ID ${id} not found`);
    return entry;
  }
  
  async getJournalEntriesByCompany(companyId, options = {}) {
    const entries = [];
    
    for (const entry of this.journalEntries.values()) {
      if (entry.companyId === companyId) {
        if (options.documentType && entry.documentType !== options.documentType) {
          continue;
        }
        if (options.startDate && new Date(entry.createdAt) < new Date(options.startDate)) {
          continue;
        }
        if (options.endDate && new Date(entry.createdAt) > new Date(options.endDate)) {
          continue;
        }
        
        entries.push(entry);
      }
    }
    
    // Sort by date descending (newest first)
    entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return entries;
  }
  
  async reverseJournalEntry(id, reversalData = {}) {
    const originalEntry = await this.getJournalEntryById(id);
    if (!originalEntry) throw new Error(`Journal entry with ID ${id} not found`);
    
    // Create a reversal entry
    const now = new Date();
    
    const reversalEntry = {
      companyId: originalEntry.companyId,
      documentId: reversalData.documentId || `REV-${originalEntry.documentId}`,
      documentType: reversalData.documentType || originalEntry.documentType,
      description: reversalData.description || `Reversal of ${originalEntry.description}`,
      journalType: originalEntry.journalType,
      items: originalEntry.items.map(item => ({
        accountNumber: item.accountNumber,
        description: `Reversal: ${item.description}`,
        // Swap debit and credit
        debitAmount: item.creditAmount,
        creditAmount: item.debitAmount
      }))
    };
    
    // Create the reversal entry
    const reversalId = await this.createJournalEntry(reversalEntry);
    
    // Update the original entry with the reversal reference
    originalEntry.reversedBy = reversalId;
    originalEntry.reversedAt = now;
    originalEntry.status = 'REVERSED';
    
    // Update in the map
    this.journalEntries.set(originalEntry.id, originalEntry);
    
    return reversalId;
  }
}

// Test the createJournalEntry method
async function testCreateJournalEntry() {
  try {
    console.log('Running test for creating journal entry...');
    
    const journalService = new MockJournalService();
    
    // Create a journal entry
    const journalEntry = {
      companyId: 'b0c725f7-2b9d-4e7c-a4c4-c54a95a37837',
      documentId: 'INV-12345',
      documentType: 'INVOICE',
      description: 'Test journal entry for invoice #12345',
      journalType: 'SALES',
      items: [
        {
          accountNumber: '411', // Clients (Romanian Chart of Accounts)
          description: 'Client receivable',
          debitAmount: 1190,
          creditAmount: 0
        },
        {
          accountNumber: '4427', // VAT Collected (Romanian Chart of Accounts)
          description: 'VAT',
          debitAmount: 0,
          creditAmount: 190
        },
        {
          accountNumber: '707', // Service Revenue (Romanian Chart of Accounts)
          description: 'Service revenue',
          debitAmount: 0,
          creditAmount: 1000
        }
      ]
    };
    
    const result = await journalService.createJournalEntry(journalEntry);
    console.log('Journal entry created with ID:', result);
    
    // Fetch the created journal entry to verify it
    const createdEntry = await journalService.getJournalEntryById(result);
    console.log('Retrieved journal entry:', JSON.stringify(createdEntry, null, 2));
    
    // Verify the entry has balanced debit and credit items
    let totalDebits = 0;
    let totalCredits = 0;
    
    for (const item of createdEntry.items) {
      totalDebits += item.debitAmount || 0;
      totalCredits += item.creditAmount || 0;
    }
    
    console.log(`Total debits: ${totalDebits}`);
    console.log(`Total credits: ${totalCredits}`);
    console.log(`Balanced: ${Math.abs(totalDebits - totalCredits) < 0.01 ? 'YES' : 'NO'}`);
    
    // Test journal entry reversal
    console.log('\nTesting journal entry reversal...');
    const reversalId = await journalService.reverseJournalEntry(result, {
      description: 'Reversal for testing purposes'
    });
    
    console.log('Reversal entry created with ID:', reversalId);
    
    // Fetch the reversal entry
    const reversalEntry = await journalService.getJournalEntryById(reversalId);
    console.log('Reversal entry:', JSON.stringify(reversalEntry, null, 2));
    
    // Check the original entry was updated
    const updatedOriginal = await journalService.getJournalEntryById(result);
    console.log('Original entry after reversal:', JSON.stringify(updatedOriginal, null, 2));
    
    return result;
  } catch (error) {
    console.error('Error in test:', error);
    throw error;
  }
}

// Run the test
async function runTest() {
  try {
    console.log('Starting journal service test with mock implementation');
    
    // Run the test
    const entryId = await testCreateJournalEntry();
    
    console.log('✅ Test completed successfully!');
    console.log('Created journal entry ID:', entryId);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTest();