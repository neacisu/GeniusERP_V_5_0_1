/**
 * Test for CRM Controllers
 * 
 * This script tests the CRM module's controllers for customers and deals
 */
import axios from 'axios';
import { JwtService } from './server/modules/auth/services/jwt.service';

// Base URL for API calls
const BASE_URL = 'http://localhost:3000';

// Create JWT service for token generation
const jwtService = new JwtService();

/**
 * Main test function for CRM controllers
 */
async function testCrmControllers() {
  try {
    console.log('Testing CRM controllers...');
    
    // Step 1: Generate a test token for authentication
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    const username = 'testuser';
    const companyId = '550e8400-e29b-41d4-a716-446655440099';
    const role = 'admin';
    
    const token = jwtService.generateToken({ 
      id: userId, 
      username, 
      role, 
      roles: ['admin'], 
      companyId 
    });
    
    console.log('Test token generated');
    
    // Common headers with authentication
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test creating a customer
    console.log('\nTesting customer creation...');
    
    const customerData = {
      name: 'Test Customer Ltd',
      email: 'info@testcustomer.com',
      phone: '+40723456789',
      website: 'https://testcustomer.com',
      industry: 'Technology',
      type: 'client',
      status: 'active',
      address: {
        street: 'Calea Victoriei 12',
        city: 'Bucharest',
        state: 'Bucharest',
        country: 'Romania',
        postalCode: '010022'
      },
      taxIdentifier: 'RO12345678',
      registrationNumber: 'J40/123/2020',
      bankAccount: 'RO49AAAA1B31007593840000',
      bankName: 'Romanian Bank',
      companyId
    };
    
    const customerResponse = await axios.post(`${BASE_URL}/api/v1/crm/customers`, customerData, { headers });
    console.log('Customer created:', customerResponse.data.id);
    
    const customerId = customerResponse.data.id;
    
    // Step 3: Test creating a pipeline and stage
    console.log('\nTesting pipeline and stage creation...');
    
    // This would typically be done through the PipelineService
    // For this test, we'll assume a pipeline and stage exist with these IDs
    const pipelineId = '550e8400-e29b-41d4-a716-446655440777';
    const stageId = '550e8400-e29b-41d4-a716-446655440888';
    
    // Step 4: Test creating a deal
    console.log('\nTesting deal creation...');
    
    const dealData = {
      title: 'Test Software Project',
      customerId,
      pipelineId,
      stageId,
      amount: 25000,
      currency: 'RON',
      status: 'open',
      priority: 'medium',
      source: 'website',
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: 'A test deal for our CRM system',
      ownerId: userId,
      companyId
    };
    
    const dealResponse = await axios.post(`${BASE_URL}/api/v1/crm/deals`, dealData, { headers });
    console.log('Deal created:', dealResponse.data.id);
    
    const dealId = dealResponse.data.id;
    
    // Step 5: Test getting customer by ID
    console.log('\nTesting get customer by ID...');
    const customerGetResponse = await axios.get(`${BASE_URL}/api/v1/crm/customers/${customerId}`, { headers });
    console.log('Customer retrieved successfully');
    
    // Step 6: Test getting deal by ID
    console.log('\nTesting get deal by ID...');
    const dealGetResponse = await axios.get(`${BASE_URL}/api/v1/crm/deals/${dealId}`, { headers });
    console.log('Deal retrieved successfully');
    
    // Step 7: Test listing customers
    console.log('\nTesting customer listing...');
    const customersListResponse = await axios.get(`${BASE_URL}/api/v1/crm/customers?page=1&limit=10`, { headers });
    console.log(`Retrieved ${customersListResponse.data.data.length} customers`);
    
    // Step 8: Test listing deals
    console.log('\nTesting deal listing...');
    const dealsListResponse = await axios.get(`${BASE_URL}/api/v1/crm/deals?page=1&limit=10`, { headers });
    console.log(`Retrieved ${dealsListResponse.data.data.length} deals`);
    
    // Step 9: Test getting deals by customer
    console.log('\nTesting get deals by customer...');
    const customerDealsResponse = await axios.get(`${BASE_URL}/api/v1/crm/customers/${customerId}/deals`, { headers });
    console.log(`Customer has ${customerDealsResponse.data.length} deals`);
    
    // Step 10: Test deal statistics
    console.log('\nTesting deal statistics...');
    const dealStatsResponse = await axios.get(`${BASE_URL}/api/v1/crm/deals-statistics`, { headers });
    console.log('Deal statistics retrieved successfully');
    
    // Step 11: Test CRM dashboard
    console.log('\nTesting CRM dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/api/v1/crm/dashboard`, { headers });
    console.log('Dashboard data retrieved successfully:', dashboardResponse.data.metrics);
    
    console.log('\nAll CRM controller tests completed successfully');
  } catch (error) {
    console.error('Error testing CRM controllers:', error.response?.data || error.message);
  }
}

// Run the test
testCrmControllers();