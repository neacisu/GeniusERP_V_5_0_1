/**
 * Test script for Inventory Controller
 * 
 * This script tests the RBAC-secured inventory controller endpoints
 * for warehouse management and stock transfers.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Interface for JWT user data
interface JwtUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  companyId?: string | null;
  franchiseId?: string | null;
}

// Create a test JWT token for an inventory manager user
function createInventoryManagerToken(): string {
  const userData: JwtUserData = {
    id: '12345678-1234-1234-1234-123456789012',
    username: 'inventory_manager',
    email: 'inventory@example.com',
    role: 'inventory_manager', // Legacy field
    roles: ['inventory_manager'], // New field
    companyId: '98765432-9876-9876-9876-987654321098',
    franchiseId: null
  };

  // Log the token data for debugging
  console.log('Creating token for inventory_manager with roles:', userData.roles);

  const jwtSecret = process.env.JWT_SECRET || 'x7kTp9cL0wQ8zFr3yS6vU2aD1bN4mE5q8';
  return jwt.sign(userData, jwtSecret, { expiresIn: '1h' });
}

// Create a test JWT token for a regular user without inventory permissions
function createRegularUserToken(): string {
  const userData: JwtUserData = {
    id: '12345678-5555-5555-5555-123456789012',
    username: 'regular_user',
    email: 'user@example.com',
    role: 'user',
    roles: ['user'],
    companyId: '98765432-9876-9876-9876-987654321098',
    franchiseId: null
  };

  // Log the token data for debugging
  console.log('Creating token for regular_user with roles:', userData.roles);

  const jwtSecret = process.env.JWT_SECRET || 'x7kTp9cL0wQ8zFr3yS6vU2aD1bN4mE5q8';
  return jwt.sign(userData, jwtSecret, { expiresIn: '1h' });
}

// Test the secure inventory controller
async function testInventoryController() {
  const baseUrl = 'http://localhost:5000/api/v1/inventory';
  console.log('Using base URL:', baseUrl);
  
  // Get tokens
  const inventoryManagerToken = createInventoryManagerToken();
  const regularUserToken = createRegularUserToken();
  
  console.log('=======================================');
  console.log('TESTING SECURE INVENTORY CONTROLLER');
  console.log('=======================================');
  
  try {
    // --------------------------------------------------
    // Test 1: Regular user should be denied access to create warehouse
    // --------------------------------------------------
    console.log('Test 1: Regular user attempting to create warehouse (should fail)');
    
    try {
      const response = await axios.post(
        `${baseUrl}/warehouse`,
        {
          name: 'Test Warehouse',
          code: 'TW-001',
          location: 'Bucharest',
          type: 'depozit',
          is_active: true
        },
        {
          headers: {
            Authorization: `Bearer ${regularUserToken}`
          }
        }
      );
      console.log('Response:', JSON.stringify(response.data, null, 2));
      console.log('❌ FAIL: Regular user was able to create warehouse');
    } catch (error: any) {
      console.log('Error status:', error.response?.status);
      console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
      
      if (error.response && error.response.status === 403) {
        console.log('✅ PASS: Regular user was properly denied access');
      } else {
        console.log('❌ ERROR: Unexpected error', error.message);
      }
    }
    
    // --------------------------------------------------
    // Test 2: Inventory manager should be able to create a warehouse
    // --------------------------------------------------
    console.log('\nTest 2: Inventory manager creating warehouse (should succeed)');
    
    let warehouseId: string | null = null;
    
    try {
      const response = await axios.post(
        `${baseUrl}/warehouse`,
        {
          name: 'Manager Warehouse',
          code: 'MW-001',
          location: 'Cluj',
          type: 'magazin',
          is_active: true
        },
        {
          headers: {
            Authorization: `Bearer ${inventoryManagerToken}`
          }
        }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.warehouse && response.data.warehouse.id) {
        warehouseId = response.data.warehouse.id;
        console.log('✅ PASS: Warehouse created successfully, ID:', warehouseId);
      } else {
        console.log('❌ FAIL: Warehouse created but response was not as expected');
      }
    } catch (error: any) {
      console.log('❌ FAIL: Inventory manager could not create warehouse', error.message);
    }
    
    // Skip remaining tests if warehouse creation failed
    if (!warehouseId) {
      console.log('❌ SKIPPING remaining tests because warehouse creation failed');
      return;
    }
    
    // --------------------------------------------------
    // Test 3: Both user types should be able to get warehouse by ID
    // --------------------------------------------------
    console.log('\nTest 3a: Regular user getting warehouse by ID (should succeed)');
    
    try {
      const response = await axios.get(
        `${baseUrl}/warehouse/${warehouseId}`,
        {
          headers: {
            Authorization: `Bearer ${regularUserToken}`
          }
        }
      );
      
      if (response.data.success && response.data.warehouse) {
        console.log('✅ PASS: Regular user could fetch warehouse details');
      } else {
        console.log('❌ FAIL: Regular user got success response but data was not as expected');
      }
    } catch (error: any) {
      console.log('❌ FAIL: Regular user could not fetch warehouse details', error.message);
    }
    
    console.log('\nTest 3b: Inventory manager getting warehouse by ID (should succeed)');
    
    try {
      const response = await axios.get(
        `${baseUrl}/warehouse/${warehouseId}`,
        {
          headers: {
            Authorization: `Bearer ${inventoryManagerToken}`
          }
        }
      );
      
      if (response.data.success && response.data.warehouse) {
        console.log('✅ PASS: Inventory manager could fetch warehouse details');
      } else {
        console.log('❌ FAIL: Inventory manager got success response but data was not as expected');
      }
    } catch (error: any) {
      console.log('❌ FAIL: Inventory manager could not fetch warehouse details', error.message);
    }
    
    // --------------------------------------------------
    // Test 4: Both user types should be able to list warehouses
    // --------------------------------------------------
    console.log('\nTest 4a: Regular user listing warehouses (should succeed)');
    
    try {
      const response = await axios.get(
        `${baseUrl}/warehouses`,
        {
          headers: {
            Authorization: `Bearer ${regularUserToken}`
          }
        }
      );
      
      if (response.data.success && Array.isArray(response.data.warehouses)) {
        console.log('✅ PASS: Regular user could list warehouses, count:', response.data.warehouses.length);
      } else {
        console.log('❌ FAIL: Regular user got success response but data was not as expected');
      }
    } catch (error: any) {
      console.log('❌ FAIL: Regular user could not list warehouses', error.message);
    }
    
    console.log('\nTest 4b: Inventory manager listing warehouses (should succeed)');
    
    try {
      const response = await axios.get(
        `${baseUrl}/warehouses`,
        {
          headers: {
            Authorization: `Bearer ${inventoryManagerToken}`
          }
        }
      );
      
      if (response.data.success && Array.isArray(response.data.warehouses)) {
        console.log('✅ PASS: Inventory manager could list warehouses, count:', response.data.warehouses.length);
      } else {
        console.log('❌ FAIL: Inventory manager got success response but data was not as expected');
      }
    } catch (error: any) {
      console.log('❌ FAIL: Inventory manager could not list warehouses', error.message);
    }
    
    // --------------------------------------------------
    // Test 5: Only inventory manager should be able to update a warehouse
    // --------------------------------------------------
    console.log('\nTest 5a: Regular user updating warehouse (should fail)');
    
    try {
      await axios.put(
        `${baseUrl}/warehouse/${warehouseId}`,
        {
          name: 'Updated Warehouse Name',
          location: 'Timisoara'
        },
        {
          headers: {
            Authorization: `Bearer ${regularUserToken}`
          }
        }
      );
      console.log('❌ FAIL: Regular user was able to update warehouse');
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        console.log('✅ PASS: Regular user was properly denied access to update warehouse');
      } else {
        console.log('❌ ERROR: Unexpected error', error.message);
      }
    }
    
    console.log('\nTest 5b: Inventory manager updating warehouse (should succeed)');
    
    try {
      const response = await axios.put(
        `${baseUrl}/warehouse/${warehouseId}`,
        {
          name: 'Manager Updated Warehouse',
          location: 'Iasi'
        },
        {
          headers: {
            Authorization: `Bearer ${inventoryManagerToken}`
          }
        }
      );
      
      if (response.data.success && response.data.warehouse) {
        console.log('✅ PASS: Inventory manager could update warehouse');
        console.log(`   New name: ${response.data.warehouse.name}`);
        console.log(`   New location: ${response.data.warehouse.location}`);
      } else {
        console.log('❌ FAIL: Inventory manager got success response but data was not as expected');
      }
    } catch (error: any) {
      console.log('❌ FAIL: Inventory manager could not update warehouse', error.message);
    }
    
    // --------------------------------------------------
    // Test 6: Only inventory manager should be able to deactivate a warehouse
    // --------------------------------------------------
    console.log('\nTest 6a: Regular user deactivating warehouse (should fail)');
    
    try {
      await axios.delete(
        `${baseUrl}/warehouse/${warehouseId}`,
        {
          headers: {
            Authorization: `Bearer ${regularUserToken}`
          }
        }
      );
      console.log('❌ FAIL: Regular user was able to deactivate warehouse');
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        console.log('✅ PASS: Regular user was properly denied access to deactivate warehouse');
      } else {
        console.log('❌ ERROR: Unexpected error', error.message);
      }
    }
    
    console.log('\nTest 6b: Inventory manager deactivating warehouse (should succeed)');
    
    try {
      const response = await axios.delete(
        `${baseUrl}/warehouse/${warehouseId}`,
        {
          headers: {
            Authorization: `Bearer ${inventoryManagerToken}`
          }
        }
      );
      
      if (response.data.success && response.data.warehouse) {
        console.log('✅ PASS: Inventory manager could deactivate warehouse');
        console.log(`   Warehouse active status: ${response.data.warehouse.is_active}`);
      } else {
        console.log('❌ FAIL: Inventory manager got success response but data was not as expected');
      }
    } catch (error: any) {
      console.log('❌ FAIL: Inventory manager could not deactivate warehouse', error.message);
    }
    
    console.log('\nInventory Controller RBAC Tests Completed!');
    
  } catch (error: any) {
    console.error('Error during test execution:', error.message);
  }
}

// Execute the test
testInventoryController().catch(console.error);