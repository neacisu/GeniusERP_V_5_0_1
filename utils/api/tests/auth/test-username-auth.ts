/**
 * Test script for Username-Based Authentication
 * 
 * This script tests the authentication using username (not email),
 * which is a requirement for the system. It verifies that users can
 * be authenticated with their username and password.
 */

import { DrizzleService } from './server/common/drizzle/drizzle.service';
import { AuthService } from './server/modules/auth/services/auth.service';
import { JwtService } from './server/modules/auth/services/jwt.service';
import * as bcrypt from 'bcrypt';
import { Logger } from './server/common/logger';

const logger = new Logger('TestUsernameAuth');
 
/**
 * Test and verify the username-based authentication
 */
async function testUsernameAuth() {
  try {
    logger.info('Starting username-based authentication test...');

    // Create a DrizzleService instance
    const drizzleService = new DrizzleService();
    await drizzleService.initialize();
    const db = drizzleService.getDrizzle();

    // Create AuthService and JwtService instances
    const jwtService = new JwtService();
    const authService = new AuthService(db, jwtService);

    // Test username for authentication
    const testUsername = 'testadmin';
    const testPassword = 'securepassword';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Check if user already exists
    const existingUser = await authService.getUserByUsername(testUsername);
    
    if (existingUser) {
      logger.info(`Test user '${testUsername}' already exists, using existing account`);
    } else {
      // Insert a test user with username (not email) for testing
      logger.info(`Creating test user with username: ${testUsername}`);
      
      // Ensure a users table is available
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NULL,
          first_name VARCHAR(255) NULL,
          last_name VARCHAR(255) NULL,
          role VARCHAR(50) DEFAULT 'user',
          company_id UUID NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert test user
      await db.execute(`
        INSERT INTO users (username, password, email, role)
        VALUES ('${testUsername}', '${hashedPassword}', 'admin@example.com', 'admin')
      `);
      
      logger.info('Test user created successfully');
    }

    // Test authentication with username
    logger.info('Testing authentication with username...');
    const authenticatedUser = await authService.authenticate(testUsername, testPassword);

    if (authenticatedUser) {
      logger.info('✅ Username-based authentication successful!');
      logger.info(`Authenticated user: ${JSON.stringify({
        id: authenticatedUser.id,
        username: authenticatedUser.username,
        role: authenticatedUser.role
      }, null, 2)}`);

      // Test JWT token generation
      logger.info('Testing JWT token generation...');
      const token = jwtService.generateToken(authenticatedUser);
      logger.info(`JWT token generated: ${token.substring(0, 20)}...`);

      // Verify JWT token
      logger.info('Testing JWT token verification...');
      const verifiedPayload = jwtService.verifyToken(token);
      logger.info(`Token verified with payload: ${JSON.stringify(verifiedPayload, null, 2)}`);

      logger.info('✅ All username-based authentication tests passed!');
    } else {
      logger.error('❌ Username-based authentication failed!');
    }
  } catch (error) {
    logger.error('Error during authentication test:', error);
    
    // Check if it's a server connection issue
    if (error.message && (
        error.message.includes('connect ECONNREFUSED') || 
        error.message.includes('Connection refused') ||
        error.message.includes('timeout')
    )) {
      logger.error('❌ Make sure the server is running before running this test.');
    }
  }
}

// Run the test
testUsernameAuth().catch(error => {
  logger.error('Unhandled error in test script:', error);
  process.exit(1);
});