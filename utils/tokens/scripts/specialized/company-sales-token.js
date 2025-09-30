/**
 * Generate JWT token for testing the sales API endpoints
 * Using an existing company ID from the database
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Use the same JWT secret as in auth.service.ts
const JWT_SECRET = process.env.JWT_SECRET || "geniuserp_auth_jwt_secret";

// Use an existing company ID from the database
const companyId = "7196288d-7314-4512-8b67-2c82449b5465"; // GeniusERP Demo Company
const userId = uuidv4();

// This structure matches JwtUserData interface
const payload = {
  id: userId,
  username: 'salesuser',
  role: 'sales_team',  // Primary role
  roles: ['sales_team', 'user'],  // All roles
  companyId: companyId,
  franchiseId: 'test-franchise',
  email: 'sales@example.com',
  fullName: 'Sales User'
};

// Generate the token
function generateToken() {
  const token = jwt.sign(payload, JWT_SECRET);

  console.log('\n=== Sales API Test JWT Token ===');
  console.log(token);
  console.log('\n=== Token Payload ===');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n=== Usage Command for Customer Creation ===');
  console.log(`curl -X POST http://localhost:5000/api/sales/customer \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{
    "companyId": "${companyId}",
    "franchiseId": "test-franchise",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St"
  }'`);
}

generateToken();
