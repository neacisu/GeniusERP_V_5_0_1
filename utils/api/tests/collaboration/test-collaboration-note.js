/**
 * Test script for collaboration note creation
 * Uses real database data and the JWT_SECRET from the environment
 */
import jwt from 'jsonwebtoken';
import fs from 'fs';
import axios from 'axios';

// Use environment variable for JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'geniuserp_auth_jwt_secret';

// Use a real user and company ID from the database
const USER_ID = '49e12af8-dbd0-48db-b5bd-4fb3f6a39787';
const COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465';
const TASK_ID = '302c8928-b341-48b3-8d38-4a05b247e858';

// Generate JWT token
function generateToken() {
  const payload = {
    userId: USER_ID,
    companyId: COMPANY_ID,
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
  };

  const token = jwt.sign(payload, JWT_SECRET);
  console.log('Generated token:', token);
  
  // Save token to file for use in curl commands
  fs.writeFileSync('test-token.txt', token);
  
  return token;
}

// Test creating a note via API
async function testCreateNote() {
  const token = generateToken();
  
  try {
    // Create a test note
    const noteData = {
      taskId: TASK_ID,
      userId: USER_ID,
      content: "Test note created with real data",
      isPrivate: false
    };
    
    const response = await axios.post('http://localhost:5000/api/collaboration/notes', 
      noteData,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log('Note creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating note:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Run the tests
testCreateNote()
  .then(() => console.log('Test completed successfully'))
  .catch(error => console.error('Test failed:', error));