/**
 * Get Marketing Test Token
 * 
 * This script generates a valid JWT token for testing the Marketing module endpoints,
 * including the campaign-placeholder endpoint.
 */

import { getDrizzle } from './server/common/drizzle';
import { JwtService } from './server/common/services/jwt.service';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a JWT service
const jwtService = new JwtService();

/**
 * Generate a valid JWT token for testing
 */
async function generateMarketingTestToken() {
  console.log('Generating test token for Marketing module endpoints...');
  
  try {
    // Connect to the database
    const db = await getDrizzle();
    console.log('Connected to database');
    
    // Create a test user payload with marketing roles
    const testUser = {
      id: uuidv4(),
      username: 'marketing.tester',
      email: 'marketing@example.com',
      role: 'marketing_manager',
      roles: ['marketing_manager', 'marketing_user'],
      companyId: uuidv4(),
      franchiseId: null
    };
    
    // Generate a JWT token
    const token = jwtService.sign(testUser);
    
    console.log('\n===================================');
    console.log('🔑 Marketing Test Token Generated 🔑');
    console.log('===================================\n');
    console.log(token);
    console.log('\n===================================');
    
    console.log('\nExample usage:');
    console.log(`
curl -X POST http://localhost:5000/api/marketing/campaigns/campaign-placeholder \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{"campaignName":"Spring Sale 2025","description":"Promotional campaign","channels":["email","sms"]}'
`);
  } catch (error) {
    console.error('Error generating test token:', error);
  }
}

// Run the function
generateMarketingTestToken()
  .then(() => {
    console.log('Token generation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Token generation failed:', error);
    process.exit(1);
  });