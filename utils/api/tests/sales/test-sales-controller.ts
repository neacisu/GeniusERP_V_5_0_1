/**
 * Test script for Sales Controller
 * 
 * This script tests the Sales Controller endpoints, specifically the placeholder route.
 */
import axios from 'axios';
import { JwtService } from './server/modules/auth/services/jwt.service';
import { UserRole } from './server/modules/auth/types';

interface JwtUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  roles: string[];
  companyId: string;
  franchiseId?: string;
}

/**
 * Create a test JWT token for a sales agent user
 */
function createSalesAgentToken(): string {
  const jwtService = new JwtService();
  
  const salesAgentUserData: JwtUserData = {
    id: '9876543210',
    username: 'salesagent',
    email: 'sales@example.com',
    role: UserRole.SALES_AGENT,
    roles: [UserRole.SALES_AGENT],
    companyId: '123456789'
  };
  
  return jwtService.generateToken(salesAgentUserData);
}

/**
 * Create a test JWT token for a regular user
 */
function createRegularUserToken(): string {
  const jwtService = new JwtService();
  
  const regularUserData: JwtUserData = {
    id: '1234567890',
    username: 'regularuser',
    email: 'user@example.com',
    role: UserRole.USER,
    roles: [UserRole.USER],
    companyId: '123456789'
  };
  
  return jwtService.generateToken(regularUserData);
}

/**
 * Test the Sales Controller endpoints
 */
async function testSalesController() {
  try {
    const BASE_URL = 'http://localhost:5000';
    
    console.log('Testing Sales Controller endpoints...');
    console.log('====================================');
    
    // Create tokens for different user roles
    const salesAgentToken = createSalesAgentToken();
    const regularUserToken = createRegularUserToken();
    
    console.log('\nTesting with SALES_AGENT role:');
    console.log('----------------------------');
    
    try {
      const salesAgentHeaders = { Authorization: `Bearer ${salesAgentToken}` };
      const salesAgentResponse = await axios.post(
        `${BASE_URL}/api/v1/crm/sales/placeholder`, 
        {}, 
        { headers: salesAgentHeaders }
      );
      
      console.log('✅ Sales agent can access placeholder endpoint:');
      console.log('Status:', salesAgentResponse.status);
      console.log('Response:', salesAgentResponse.data);
    } catch (error) {
      console.error('❌ Error when sales agent accesses placeholder endpoint:', 
        error.response?.data || error.message);
    }
    
    console.log('\nTesting with USER role (should be denied):');
    console.log('---------------------------------------');
    
    try {
      const regularUserHeaders = { Authorization: `Bearer ${regularUserToken}` };
      const regularUserResponse = await axios.post(
        `${BASE_URL}/api/v1/crm/sales/placeholder`, 
        {}, 
        { headers: regularUserHeaders }
      );
      
      console.log('⚠️ Regular user can access placeholder endpoint (not expected):');
      console.log('Status:', regularUserResponse.status);
      console.log('Response:', regularUserResponse.data);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Regular user correctly denied access with 403 Forbidden');
        console.log('Error message:', error.response.data);
      } else {
        console.error('❌ Unexpected error when regular user accesses placeholder endpoint:', 
          error.response?.data || error.message);
      }
    }
    
    console.log('\nTesting without authentication (should be denied):');
    console.log('-----------------------------------------------');
    
    try {
      const noAuthResponse = await axios.post(`${BASE_URL}/api/v1/crm/sales/placeholder`, {});
      
      console.log('⚠️ Unauthenticated request can access placeholder endpoint (not expected):');
      console.log('Status:', noAuthResponse.status);
      console.log('Response:', noAuthResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthenticated request correctly denied with 401 Unauthorized');
        console.log('Error message:', error.response.data);
      } else {
        console.error('❌ Unexpected error for unauthenticated request to placeholder endpoint:', 
          error.response?.data || error.message);
      }
    }
    
    console.log('\nAll Sales Controller tests completed');
    
  } catch (error) {
    console.error('Error testing Sales Controller:', error);
  }
}

// Run the test
testSalesController();