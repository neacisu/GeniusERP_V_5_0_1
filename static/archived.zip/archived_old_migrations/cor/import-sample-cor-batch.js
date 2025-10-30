/**
 * Import a sample batch of COR occupations for demonstration
 * 
 * This script imports a larger set of sample occupations to demonstrate batch processing
 */

import jwt from 'jsonwebtoken';
import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:5000/api/hr/cor';
const BATCH_SIZE = 20;

// Create an admin JWT token
function generateAdminToken() {
  const jwtSecret = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
  
  return jwt.sign(
    { 
      userId: 'admin-user-id', 
      roles: ['admin', 'hr_admin'],
      email: 'admin@test.com',
      companyId: 'system'
    },
    jwtSecret,
    { expiresIn: '1h' }
  );
}

// Sample occupations (more extensive list)
const sampleOccupations = [
  // IT occupations
  { code: '251201', name: 'Software designer', subminorGroupCode: '2512' },
  { code: '251202', name: 'Software developer', subminorGroupCode: '2512' },
  { code: '251203', name: 'Web developer', subminorGroupCode: '2512' },
  { code: '251204', name: 'Mobile app developer', subminorGroupCode: '2512' },
  { code: '251205', name: 'Game developer', subminorGroupCode: '2512' },
  { code: '251401', name: 'System programmer', subminorGroupCode: '2514' },
  { code: '251402', name: 'DevOps engineer', subminorGroupCode: '2514' },
  { code: '251403', name: 'Cloud architect', subminorGroupCode: '2514' },
  { code: '251301', name: 'Database administrator', subminorGroupCode: '2513' },
  { code: '251302', name: 'Database developer', subminorGroupCode: '2513' },
  
  // Management occupations
  { code: '121001', name: 'Chief financial officer', subminorGroupCode: '1210' },
  { code: '121002', name: 'Chief operations officer', subminorGroupCode: '1210' },
  { code: '121003', name: 'Chief technology officer', subminorGroupCode: '1210' },
  { code: '121004', name: 'Chief marketing officer', subminorGroupCode: '1210' },
  { code: '121005', name: 'Chief human resources officer', subminorGroupCode: '1210' },
  { code: '122101', name: 'Sales manager', subminorGroupCode: '1221' },
  { code: '122102', name: 'Marketing manager', subminorGroupCode: '1221' },
  { code: '122103', name: 'Business development manager', subminorGroupCode: '1221' },
  { code: '122201', name: 'Production manager', subminorGroupCode: '1222' },
  { code: '122202', name: 'Manufacturing manager', subminorGroupCode: '1222' },
  
  // Finance occupations
  { code: '241101', name: 'Accountant', subminorGroupCode: '2411' },
  { code: '241102', name: 'Financial auditor', subminorGroupCode: '2411' },
  { code: '241103', name: 'Tax consultant', subminorGroupCode: '2411' },
  { code: '241104', name: 'Financial analyst', subminorGroupCode: '2411' },
  { code: '241201', name: 'Investment advisor', subminorGroupCode: '2412' },
  { code: '241202', name: 'Financial planner', subminorGroupCode: '2412' },
  { code: '241203', name: 'Portfolio manager', subminorGroupCode: '2412' },
  { code: '241301', name: 'Financial risk analyst', subminorGroupCode: '2413' },
  { code: '241302', name: 'Credit risk analyst', subminorGroupCode: '2413' },
  { code: '241303', name: 'Insurance risk specialist', subminorGroupCode: '2413' }
];

// Import a batch of occupations
async function importBatch(occupations, token) {
  try {
    console.log(`Sending batch of ${occupations.length} occupations to import...`);
    
    const response = await axios.post(
      `${API_URL}/import-batch`,
      { occupations },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Import result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error importing batch:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Server response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Get COR statistics
async function getCorStats() {
  try {
    const response = await axios.get(
      `${API_URL}/stats`,
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('COR statistics:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching COR stats:', error.response?.data || error.message);
  }
}

// Main function
async function importSampleBatches() {
  try {
    // Generate admin token for authentication
    const token = generateAdminToken();
    
    // Get stats before import
    console.log('\nCOR statistics BEFORE import:');
    await getCorStats();
    
    // Split occupations into batches
    const batches = [];
    for (let i = 0; i < sampleOccupations.length; i += BATCH_SIZE) {
      batches.push(sampleOccupations.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Processing ${sampleOccupations.length} occupations in ${batches.length} batches`);
    
    // Import each batch
    for (let i = 0; i < batches.length; i++) {
      console.log(`\nProcessing batch ${i + 1}/${batches.length}`);
      
      try {
        const result = await importBatch(batches[i], token);
        console.log(`Batch ${i + 1} result:`, result);
      } catch (error) {
        console.error(`Failed to process batch ${i + 1}:`, error);
      }
      
      // Add a small delay between batches
      if (i < batches.length - 1) {
        console.log('Waiting before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Get stats after import
    console.log('\nCOR statistics AFTER import:');
    await getCorStats();
    
  } catch (error) {
    console.error('Error in sample batch import:', error);
  }
}

// Execute the import
importSampleBatches();