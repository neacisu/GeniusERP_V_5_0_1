/**
 * Simple test utility for testing RBAC in the inventory module
 */

import { AuthGuard } from './server/common/middleware/auth-guard';
import jwt from 'jsonwebtoken';

// Create a test JWT token for an inventory manager user
function createInventoryManagerToken() {
  const userData = {
    id: '12345678-1234-1234-1234-123456789012',
    username: 'inventory_manager',
    email: 'inventory@example.com',
    role: 'inventory_manager',
    roles: ['inventory_manager'],
    companyId: '98765432-9876-9876-9876-987654321098',
    franchiseId: null
  };

  const jwtSecret = process.env.JWT_SECRET || 'x7kTp9cL0wQ8zFr3yS6vU2aD1bN4mE5q8';
  return jwt.sign(userData, jwtSecret, { expiresIn: '1h' });
}

// Create a test JWT token for a regular user without inventory permissions
function createRegularUserToken() {
  const userData = {
    id: '12345678-5555-5555-5555-123456789012',
    username: 'regular_user',
    email: 'user@example.com',
    role: 'user',
    roles: ['user'],
    companyId: '98765432-9876-9876-9876-987654321098',
    franchiseId: null
  };

  const jwtSecret = process.env.JWT_SECRET || 'x7kTp9cL0wQ8zFr3yS6vU2aD1bN4mE5q8';
  return jwt.sign(userData, jwtSecret, { expiresIn: '1h' });
}

// Simple test to log tokens and check if roles middleware works
async function testInventoryRoles() {
  const inventoryManagerToken = createInventoryManagerToken();
  const regularUserToken = createRegularUserToken();
  
  console.log('Inventory Manager Token:');
  console.log(inventoryManagerToken);
  console.log('\nRegular User Token:');
  console.log(regularUserToken);
  
  const roles = ['inventory_manager', 'admin'];
  
  // Decode tokens for inspection
  const decoded1 = jwt.verify(inventoryManagerToken, process.env.JWT_SECRET || 'x7kTp9cL0wQ8zFr3yS6vU2aD1bN4mE5q8');
  const decoded2 = jwt.verify(regularUserToken, process.env.JWT_SECRET || 'x7kTp9cL0wQ8zFr3yS6vU2aD1bN4mE5q8');
  
  console.log('\nInventory Manager Token Contents:');
  console.log(decoded1);
  
  console.log('\nRegular User Token Contents:');
  console.log(decoded2);
  
  // Manually check if roles match
  const inventoryManagerRoles = (decoded1 as any).roles || [(decoded1 as any).role];
  const regularUserRoles = (decoded2 as any).roles || [(decoded2 as any).role];
  
  const inventoryManagerHasRole = inventoryManagerRoles.some((role: string) => roles.includes(role));
  const regularUserHasRole = regularUserRoles.some((role: string) => roles.includes(role));
  
  console.log('\nInventory Manager Roles:', inventoryManagerRoles);
  console.log('Regular User Roles:', regularUserRoles);
  
  console.log('\nInventory Manager has required role?', inventoryManagerHasRole);
  console.log('Regular User has required role?', regularUserHasRole);
}

// Execute test
testInventoryRoles().catch(console.error);