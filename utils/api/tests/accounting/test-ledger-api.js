import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read token from file - fallback to local directory if the runner hasn't generated it yet
const tokenPath = path.join(__dirname, 'app-token.txt');
let token;

try {
  token = fs.readFileSync(tokenPath, 'utf-8').trim();
} catch (error) {
  console.error(`Error reading token file: ${error.message}`);
  console.error('Please run the accounting test runner first to generate auth tokens.');
  process.exit(1);
}

// Base URL for API requests
const baseUrl = 'http://localhost:5000'; // Updated port to match the application

// Headers for authenticated requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Create a ledger transaction
async function createLedgerTransaction() {
  try {
    const response = await axios.post(`${baseUrl}/api/accounting/ledger/transactions`, {
      debitAccount: '401', // Furnizori (suppliers)
      creditAccount: '5121', // Conturi la bănci în lei (bank accounts in RON)
      amount: 1000,
      description: 'Plata furnizor ABC',
      documentId: 'INV-2023-001',
      documentType: 'invoice'
    }, { headers });

    console.log('Create Transaction Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error.response?.data || error.message);
    throw error;
  }
}

// Create a ledger entry
async function createLedgerEntry() {
  try {
    const response = await axios.post(`${baseUrl}/api/accounting/ledger/entries`, {
      type: 'standard',
      referenceNumber: 'REF-2023-001',
      amount: 2500,
      description: 'Nota contabila test',
      lines: [
        {
          accountCode: '401',
          description: 'Furnizor ABC',
          debit: 2500,
          credit: 0
        },
        {
          accountCode: '5121',
          description: 'Banca Transilvania',
          debit: 0,
          credit: 2500
        }
      ]
    }, { headers });

    console.log('Create Ledger Entry Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error creating ledger entry:', error.response?.data || error.message);
    throw error;
  }
}

// Get transaction by ID
async function getTransaction(id) {
  try {
    const response = await axios.get(`${baseUrl}/api/accounting/ledger/transactions/${id}`, { headers });
    console.log('Get Transaction Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error getting transaction:', error.response?.data || error.message);
    throw error;
  }
}

// Run tests
async function runTests() {
  try {
    console.log('=== Testing Ledger API ===');
    
    // Create transaction
    console.log('\n1. Creating transaction...');
    const transactionResult = await createLedgerTransaction();
    
    // If transaction creation was successful, get the details
    if (transactionResult && transactionResult.data && transactionResult.data.entryId) {
      console.log('\n2. Fetching transaction details...');
      await getTransaction(transactionResult.data.entryId);
    }
    
    // Create ledger entry
    console.log('\n3. Creating ledger entry...');
    await createLedgerEntry();
    
    console.log('\n=== Tests completed ===');
  } catch (error) {
    console.error('Test run failed:', error.message);
  }
}

// Run the tests
runTests();
