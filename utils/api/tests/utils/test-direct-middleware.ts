/**
 * Direct Role-Based Access Control (RBAC) Test
 * 
 * This script tests the role-checking logic directly without Express middleware
 * to verify that users with the proper roles will be granted access to restricted endpoints.
 */

// Test users with different roles
const inventoryManagerUser = {
  role: 'inventory_manager',
  roles: ['inventory_manager']
};

const regularUser = {
  role: 'user',
  roles: ['user']
};

const multiRoleUser = {
  role: 'user', 
  roles: ['user', 'inventory_manager']
};

const adminUser = {
  role: 'admin',
  roles: ['admin']
};

// Function that implements the core RBAC logic from AuthGuard
function hasRequiredRole(user: any, allowedRoles: string[]): boolean {
  if (!user) return false;
  
  const userRoles = user.roles || [user.role];
  return userRoles.some(role => allowedRoles.includes(role));
}

// Test the RBAC logic
function testRbacLogic() {
  console.log('🔒 Testing Role-Based Access Control Logic');
  console.log('=============================================');
  
  // Protected endpoint allowed roles
  const inventoryEndpointRoles = ['inventory_manager', 'admin'];
  
  // Test 1: Regular user should be denied
  console.log('\nTest 1: Regular user accessing inventory endpoint');
  const test1 = hasRequiredRole(regularUser, inventoryEndpointRoles);
  
  if (test1 === false) {
    console.log('✅ PASS: Regular user correctly denied access');
  } else {
    console.log('❌ FAIL: Regular user incorrectly granted access');
  }
  
  // Test 2: Inventory manager should be allowed
  console.log('\nTest 2: Inventory manager accessing inventory endpoint');
  const test2 = hasRequiredRole(inventoryManagerUser, inventoryEndpointRoles);
  
  if (test2 === true) {
    console.log('✅ PASS: Inventory manager correctly granted access');
  } else {
    console.log('❌ FAIL: Inventory manager incorrectly denied access');
  }
  
  // Test 3: Admin should be allowed
  console.log('\nTest 3: Admin accessing inventory endpoint');
  const test3 = hasRequiredRole(adminUser, inventoryEndpointRoles);
  
  if (test3 === true) {
    console.log('✅ PASS: Admin correctly granted access');
  } else {
    console.log('❌ FAIL: Admin incorrectly denied access');
  }
  
  // Test 4: User with multiple roles including an allowed one should be allowed
  console.log('\nTest 4: User with multiple roles including inventory_manager');
  const test4 = hasRequiredRole(multiRoleUser, inventoryEndpointRoles);
  
  if (test4 === true) {
    console.log('✅ PASS: Multi-role user correctly granted access');
  } else {
    console.log('❌ FAIL: Multi-role user incorrectly denied access');
  }
  
  // Test 5: Check with empty allowed roles
  console.log('\nTest 5: Any user with empty allowed roles list');
  const test5 = hasRequiredRole(regularUser, []);
  
  if (test5 === false) {
    console.log('✅ PASS: Empty allowed roles correctly denies access');
  } else {
    console.log('❌ FAIL: Empty allowed roles incorrectly grants access');
  }
  
  // Summary
  console.log('\n🧪 RBAC Testing Summary:');
  console.log('- Regular user access: ' + (test1 ? '❌ PERMITTED' : '✅ DENIED'));
  console.log('- Inventory manager access: ' + (test2 ? '✅ PERMITTED' : '❌ DENIED'));
  console.log('- Admin access: ' + (test3 ? '✅ PERMITTED' : '❌ DENIED'));
  console.log('- Multi-role user access: ' + (test4 ? '✅ PERMITTED' : '❌ DENIED'));
}

// Run the tests
testRbacLogic();