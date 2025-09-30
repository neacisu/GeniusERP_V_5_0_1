/**
 * Test script for the AI report endpoint
 * 
 * This script tests the new /api/ai/report endpoint that generates
 * reports using AI with OpenAI integration.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Generate a test JWT token with admin role
function generateAdminToken() {
  // Use the default JWT secret from the auth service
  const secret = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret';
  
  const payload = {
    id: '12345',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    roles: ['hq_admin', 'ai_access'],
    companyId: 'test-company',
    franchiseId: null
  };
  
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

// Main test function
async function testAiReportEndpoint() {
  try {
    const token = generateAdminToken();
    const baseUrl = 'http://localhost:5000';
    
    console.log('Testing AI report endpoint...');
    
    // Test data for report generation
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
    
    // Make request to new report endpoint
    const response = await axios.post(
      `${baseUrl}/api/ai/report`,
      reportData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Report generation response status:', response.status);
    console.log('Response data:', response.data);
    
    if (response.data && response.data.data) {
      console.log('Report ID:', response.data.data.id);
      console.log('Report content preview:', response.data.data.content.substring(0, 200) + '...');
    }
    
    console.log('\n✅ AI report endpoint test completed!');
    return true;
  } catch (error) {
    console.error('❌ Error testing AI report endpoint:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return false;
  }
}

// Run the test
testAiReportEndpoint().catch(console.error);