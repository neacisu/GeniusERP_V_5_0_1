/**
 * Test Ledger Entry Creation with Real Database Data
 * Uses valid JWT token and real company/account data from database
 */
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Real data from database
const REAL_ADMIN_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';
const REAL_COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465';
const ACCOUNT_DEBIT = '602';    // Office supplies expense account
const ACCOUNT_CREDIT = '5311';  // Petty cash account

// Auth token generation
const JWT_SECRET = process.env.JWT_SECRET || "geniuserp_auth_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

const generateToken = () => {
  const payload = {
    id: REAL_ADMIN_ID,
    username: "admin",
    role: "admin",
    roles: ["admin", "accounting"], 
    companyId: REAL_COMPANY_ID
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Test the ledger API endpoints
 */
const testLedgerAPI = async () => {
  const token = generateToken();
  console.log('Generated JWT token with real user data:', token);
  
  // First, check the API routes using OPTIONS
  console.log('\n----- Testing API Endpoints -----');
  try {
    const optionsResponse = await axios.options(
      'http://localhost:5000/api/accounting/ledger/entry',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log('OPTIONS Response:', optionsResponse.status, optionsResponse.headers);
  } catch (error) {
    console.log('OPTIONS request failed:', error.message);
  }
  
  // Second, try to get existing ledger entries
  console.log('\n----- Getting Existing Ledger Entries -----');
  try {
    const getResponse = await axios.get(
      'http://localhost:5000/api/accounting/ledger/entries',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          companyId: REAL_COMPANY_ID
        }
      }
    );
    console.log('GET Response Status:', getResponse.status);
    console.log('Found Entries:', getResponse.data ? getResponse.data.length : 0);
  } catch (error) {
    console.error('GET API Error:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    }
  }
  
  // Create a new ledger entry
  console.log('\n----- Creating New Ledger Entry -----');
  const documentNumber = `EXP${Date.now()}`;
  const ledgerEntry = {
    companyId: REAL_COMPANY_ID,
    type: "EXPENSE",
    amount: 1500,
    description: "Office supplies expense test from API",
    documentType: "EXPENSE",
    documentNumber: documentNumber,
    transactionDate: new Date().toISOString(),
    lines: [
      {
        accountNumber: ACCOUNT_DEBIT,
        debitAmount: 1500,
        creditAmount: 0,
        description: "Office supplies expense"
      },
      {
        accountNumber: ACCOUNT_CREDIT,
        debitAmount: 0,
        creditAmount: 1500,
        description: "Payment from petty cash"
      }
    ]
  };
  
  console.log('Ledger Entry Payload:', JSON.stringify(ledgerEntry, null, 2));
  
  try {
    // Make the API request
    const response = await axios.post(
      'http://localhost:5000/api/accounting/ledger/entry',
      ledgerEntry,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('POST Response Status:', response.status);
    console.log('POST Response Headers:', response.headers);
    console.log('POST Response Data Type:', typeof response.data);
    console.log('POST Response Data:', response.data);
    
    // Verify the entry was created
    console.log('\n----- Verifying Creation -----');
    console.log('Looking for entry with document number:', documentNumber);
    
    setTimeout(async () => {
      try {
        const verifyResponse = await axios.get(
          `http://localhost:5000/api/accounting/ledger/entries?documentNumber=${documentNumber}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log('Verification Response:', verifyResponse.status);
        console.log('Verification Data:', verifyResponse.data ? 
          `Found ${verifyResponse.data.length} entries` : 'No entries found');
      } catch (error) {
        console.error('Verification Error:', error.message);
      }
    }, 1000);
    
    return response.data;
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    }
    throw error;
  }
};

// Run the test
testLedgerAPI()
  .then(() => console.log('\nTest completed successfully'))
  .catch(err => console.error('\nTest failed:', err.message));