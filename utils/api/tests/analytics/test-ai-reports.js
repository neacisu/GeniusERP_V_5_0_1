/**
 * AI Reports API Testing Script
 * 
 * This script tests the AI Reports API endpoints by generating a sample report.
 * It requires a valid user token for authentication.
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
dotenv.config();

// Generate a test token for API access
function generateTestToken() {
  // Simple test user data
  const userData = {
    id: randomUUID(),
    companyId: randomUUID(),
    email: 'test-user@example.com',
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser',
    roles: ['ai_access', 'admin'] // Include ai_access role for AI Reports API
  };
  
  // Read JWT secret from environment
  const jwtSecret = process.env.JWT_SECRET || 'test-secret-key';
  
  // Generate token
  const token = jwt.sign(userData, jwtSecret, { expiresIn: '1h' });
  
  console.log('Generated test token for API access');
  
  return token;
}

// Test the AI Reports API
async function testAiReportsApi() {
  try {
    const token = generateTestToken();
    const baseUrl = 'http://localhost:5000';
    
    console.log('Testing AI Reports API endpoints...');
    
    // 1. First, test the AI health endpoint
    console.log('\n1. Testing AI module health endpoint');
    const healthResponse = await axios.get(`${baseUrl}/api/ai/health`);
    console.log('Health endpoint response:', healthResponse.data);
    
    // 2. Test generating a financial summary report
    console.log('\n2. Testing report generation endpoint');
    
    const reportData = {
      type: 'financial_summary',
      name: 'Q2 2023 Financial Summary',
      description: 'Financial performance summary for Q2 2023',
      parameters: {
        period: 'Q2 2023',
        metrics: ['revenue', 'expenses', 'profit_margin', 'cash_flow'],
        focusAreas: ['cost_reduction', 'revenue_growth']
      }
    };
    
    try {
      const generateResponse = await axios.post(
        `${baseUrl}/api/ai/reports/generate`,
        reportData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Report generation response status:', generateResponse.status);
      console.log('Report ID:', generateResponse.data.data.id);
      console.log('Report content preview:', generateResponse.data.data.content.substring(0, 200) + '...');
      
      // 3. Test fetching the generated report
      if (generateResponse.data && generateResponse.data.data && generateResponse.data.data.id) {
        console.log('\n3. Testing report retrieval by ID');
        
        const reportId = generateResponse.data.data.id;
        
        const getReportResponse = await axios.get(
          `${baseUrl}/api/ai/reports/${reportId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('Report retrieval response status:', getReportResponse.status);
        console.log('Retrieved report name:', getReportResponse.data.data.name);
        
        // 4. Test listing reports
        console.log('\n4. Testing reports listing endpoint');
        
        const listReportsResponse = await axios.get(
          `${baseUrl}/api/ai/reports`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('Reports listing response status:', listReportsResponse.status);
        console.log('Number of reports:', listReportsResponse.data.data.length);
        console.log('Reports:', listReportsResponse.data.data.map(r => ({ id: r.id, name: r.name })));
      }
      
      return true;
    } catch (error) {
      console.error('Error accessing AI Reports API:');
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(error.message);
      }
      
      return false;
    }
  } catch (error) {
    console.error('Test execution error:', error);
    return false;
  }
}

// Run the test
testAiReportsApi()
  .then(success => {
    if (success) {
      console.log('\n✅ AI Reports API test completed successfully!');
    } else {
      console.log('\n❌ AI Reports API test failed!');
    }
  })
  .catch(err => {
    console.error('\n❌ Test execution error:', err);
  });