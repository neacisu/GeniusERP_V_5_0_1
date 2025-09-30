/**
 * Test Inventory API Endpoints
 * 
 * This script tests the newly added inventory stock level endpoints.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { log } from './server/vite';
import { config } from 'dotenv';
import { createId } from './server/utils/id';

// Load environment variables
config();

// Secret key for JWT token
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key';

/**
 * Interface for JWT user data
 */
interface JwtUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  companyId?: string | null;
  franchiseId?: string | null;
}

/**
 * Create a test JWT token for an inventory manager user
 */
function createInventoryManagerToken(): string {
  const inventoryManagerData: JwtUserData = {
    id: createId(),
    username: 'inventory_test_user',
    email: 'inventory_test@example.com',
    role: 'inventory_manager',
    roles: ['inventory_manager', 'user'],
    companyId: 'test-company-123'
  };

  return jwt.sign(inventoryManagerData, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Test the inventory endpoints
 */
async function testInventoryEndpoints() {
  const token = createInventoryManagerToken();
  const baseUrl = 'http://localhost:5000/api/inventory';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    log('Starting inventory endpoints test...', 'test');

    // Test 1: Call the check stock levels endpoint
    log('Test 1: Check stock levels', 'test');
    let response = await axios.post(`${baseUrl}/check-stock-levels`, {}, { headers });
    log(`Response status: ${response.status}`, 'test');
    log(`Response data: ${JSON.stringify(response.data, null, 2)}`, 'test');

    // Test 2: Get approaching threshold products
    log('Test 2: Get approaching threshold products', 'test');
    response = await axios.get(`${baseUrl}/stock/approaching-threshold`, { headers });
    log(`Response status: ${response.status}`, 'test');
    log(`Response data: ${JSON.stringify(response.data, null, 2)}`, 'test');

    // Test 3: Schedule stock checks
    log('Test 3: Schedule regular stock checks', 'test');
    response = await axios.post(
      `${baseUrl}/schedule-stock-checks`,
      { schedulePattern: '0 9 * * 1-5' }, // Every weekday at 9 AM
      { headers }
    );
    log(`Response status: ${response.status}`, 'test');
    log(`Response data: ${JSON.stringify(response.data, null, 2)}`, 'test');

    log('✅ All inventory endpoint tests completed!', 'test');
  } catch (error: any) {
    log('❌ Error testing inventory endpoints:', 'test-error');
    if (error.response) {
      log(`Response status: ${error.response.status}`, 'test-error');
      log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`, 'test-error');
    } else {
      log(error.message, 'test-error');
    }
  }
}

// Run the test
testInventoryEndpoints().catch(error => {
  console.error('Unhandled error during test:', error);
});