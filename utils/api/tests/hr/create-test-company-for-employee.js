/**
 * Create Test Company Script for HR Module Testing
 * 
 * This script creates a test company record to use for HR employee testing.
 * It ensures we have a valid company ID to reference in foreign key relationships.
 */
import postgres from 'postgres';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

dotenv.config();

// Create a database connection
const sql = postgres(process.env.DATABASE_URL, { 
  ssl: { rejectUnauthorized: false },
  connection: {
    timezone: 'UTC'
  }
});

// Generate a random but valid fiscal code (CUI) for a company
function generateValidFiscalCode() {
  // Prefix with RO for Romanian companies
  return `RO${Math.floor(10000000 + Math.random() * 90000000)}`;
}

// Generate a UUID if needed
function generateUUID() {
  return crypto.randomUUID();
}

// Generate a JWT token for the user
function generateToken(user) {
  // Use the JWT secret from environment variable or fallback to a default for testing
  const JWT_SECRET = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
  const JWT_EXPIRES_IN = '24h';

  return jwt.sign(
    {
      id: user.id,
      companyId: user.companyId,
      email: user.email || 'test@example.com',
      role: 'admin',
      roles: ['admin']
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Main function to create test data
async function createTestCompany() {
  console.log('Creating test company for HR module testing...');
  let companyId, userId;

  try {
    // Check if test company already exists
    const existingCompanies = await sql`
      SELECT * FROM companies 
      WHERE name = 'Test Company'
    `;

    if (existingCompanies.length > 0) {
      companyId = existingCompanies[0].id;
      console.log(`Using existing test company with ID: ${companyId}`);
    } else {
      // Create a new test company
      const now = new Date();
      const fiscalCode = generateValidFiscalCode();
      
      const newCompany = await sql`
        INSERT INTO companies (
          id, name, fiscal_code, registration_number, address, 
          city, county, country, email, phone, 
          website, created_at, updated_at
        ) VALUES (
          ${generateUUID()}, 'Test Company', ${fiscalCode}, 'J40/1234/2023',
          'Test Address', 'Test City', 'Test County', 'Romania',
          'test@example.com', '0700123456',
          'https://example.com', ${now}, ${now}
        )
        RETURNING *
      `;
      
      companyId = newCompany[0].id;
      console.log(`Created new test company with ID: ${companyId}`);
    }

    // Check if any user exists for this company already
    const existingUsers = await sql`
      SELECT * FROM users 
      WHERE company_id = ${companyId}
      LIMIT 1
    `;

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`Using existing user with ID: ${userId} for company ${companyId}`);
    } else {
      // Create a new test user with a unique username based on timestamp
      const now = new Date();
      const uniqueUsername = `testuser_${Date.now()}`;
      
      const newUser = await sql`
        INSERT INTO users (
          id, company_id, first_name, last_name, 
          email, username, password, role, roles,
          status, created_at, updated_at
        ) VALUES (
          ${generateUUID()}, ${companyId}, 'Test', 'User',
          ${`${uniqueUsername}@example.com`}, ${uniqueUsername}, 
          '$2b$10$cU0XA45BB1Q.g.Ct66mNuOGVtf9kzQi6vP5Z6HtZ7tqVGGMaLQiBC', 
          'admin', ARRAY['admin', 'user'],
          'active', ${now}, ${now}
        )
        RETURNING *
      `;
      
      userId = newUser[0].id;
      console.log(`Created new test user with ID: ${userId}`);
    }

    // Generate a valid JWT token
    const token = generateToken({ id: userId, companyId: companyId });
    console.log('Generated JWT token for testing:', token);

    // Return test data
    const testData = {
      companyId,
      userId,
      token
    };

    // Save test data to a file for future reference
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    return testData;
  } catch (error) {
    console.error('Error creating test company:', error);
    throw error;
  } finally {
    // Close the database connection
    await sql.end();
  }
}

// Run the script
createTestCompany().catch(console.error);