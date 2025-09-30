/**
 * Test V2 Ledger Creation Script
 * 
 * This script tests the JournalServiceV2 implementation for ledger operations
 * via the newly updated JournalController.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate an authentication token
function generateAuthToken() {
  const testUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'test@example.com',
    username: 'testuser',
    companyId: '22222222-2222-2222-2222-222222222222',
    roles: ['admin']
  };
  
  return jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
}

// Set up the HTTP client with auth token
function createClient() {
  const token = generateAuthToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
}

// Test the recordTransaction endpoint
async function testRecordTransaction() {
  const client = createClient();
  
  try {
    console.log('Testing recordTransaction with JournalServiceV2...');
    
    const response = await client.post('/accounting/ledger/transactions', {
      debitAccount: '5121', // Bank accounts in Romanian chart of accounts
      creditAccount: '4111', // Clients account in Romanian chart of accounts
      amount: 1000,
      description: 'Test transaction using V2 service',
      documentType: 'PAYMENT'
    });
    
    console.log('Transaction recorded successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data.entryId;
  } catch (error) {
    console.error('Error recording transaction:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// Test the createLedgerEntry endpoint with multiple lines
async function testCreateLedgerEntry() {
  const client = createClient();
  
  try {
    console.log('Testing createLedgerEntry with JournalServiceV2...');
    
    const response = await client.post('/accounting/ledger/entries', {
      type: 'GENERAL',
      referenceNumber: 'TEST-ENTRY-001',
      amount: 2500,
      description: 'Test ledger entry with multiple lines using V2 service',
      lines: [
        {
          accountNumber: '5121', // Bank accounts
          debitAmount: 1500,
          description: 'Debit bank account'
        },
        {
          accountNumber: '5311', // Cash
          debitAmount: 1000,
          description: 'Debit cash'
        },
        {
          accountNumber: '4111', // Clients
          creditAmount: 2500,
          description: 'Credit client account'
        }
      ]
    });
    
    console.log('Ledger entry created successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data.id;
  } catch (error) {
    console.error('Error creating ledger entry:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// Test the reverseLedgerEntry endpoint
async function testReverseLedgerEntry(entryId) {
  const client = createClient();
  
  try {
    console.log(`Testing reverseLedgerEntry for entry ${entryId} with JournalServiceV2...`);
    
    const response = await client.post(`/accounting/ledger/entries/${entryId}/reverse`, {
      reason: 'Testing reversal with V2 service'
    });
    
    console.log('Ledger entry reversed successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data.reversalEntryId;
  } catch (error) {
    console.error('Error reversing ledger entry:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// Test getTransaction endpoint
async function testGetTransaction(entryId) {
  const client = createClient();
  
  try {
    console.log(`Testing getTransaction for entry ${entryId} with JournalServiceV2...`);
    
    const response = await client.get(`/accounting/ledger/transactions/${entryId}`);
    
    console.log('Transaction details retrieved successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error getting transaction details:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('=== Starting JournalServiceV2 Tests ===');
    
    // Test simple transaction recording
    const txnId = await testRecordTransaction();
    console.log(`Transaction ID: ${txnId}`);
    
    // Test transaction retrieval
    if (txnId) {
      const txnDetails = await testGetTransaction(txnId);
      console.log(`Retrieved transaction details for: ${txnDetails.data.id}`);
    }
    
    // Test complex ledger entry creation
    const entryId = await testCreateLedgerEntry();
    console.log(`Ledger Entry ID: ${entryId}`);
    
    // Test ledger entry details retrieval
    if (entryId) {
      const entryDetails = await testGetTransaction(entryId);
      console.log(`Retrieved ledger entry details with ${entryDetails.data.lines.length} lines`);
    }
    
    // Test ledger entry reversal
    if (entryId) {
      const reversalId = await testReverseLedgerEntry(entryId);
      console.log(`Reversal Entry ID: ${reversalId}`);
      
      // Test retrieval of reversal entry
      if (reversalId) {
        const reversalDetails = await testGetTransaction(reversalId);
        console.log(`Retrieved reversal entry details: ${reversalDetails.data.type}`);
      }
    }
    
    console.log('=== All tests completed successfully ===');
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
}

// Execute the tests
runTests();