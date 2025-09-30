/**
 * Generate a valid JWT token for API testing
 * Uses the project's real JWT_SECRET from environment
 */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "geniuserp_auth_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Create a test user payload
const testPayload = {
  id: "00000000-0000-0000-0000-000000000000",
  username: "test-admin",
  role: "admin",
  roles: ["admin", "accounting"],
  companyId: "00000000-0000-0000-0000-000000000001"
};

// Generate and print token
const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

console.log("JWT token for testing:");
console.log(token);