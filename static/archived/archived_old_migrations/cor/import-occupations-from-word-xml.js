/**
 * Import COR Occupations from Word XML file
 * 
 * This script calls the seed-word-xml endpoint to import additional occupations 
 * from the Word XML format file that contains more recent occupation data.
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an admin JWT token
function generateAdminToken() {
  const jwtSecret = process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8';
  
  return jwt.sign(
    { 
      userId: 'admin-user-id', 
      roles: ['admin', 'hr_admin'],
      email: 'admin@test.com',
      companyId: 'system'
    },
    jwtSecret,
    { expiresIn: '1h' }
  );
}

// Main function to import occupations
async function importOccupationsFromWordXml() {
  try {
    const token = generateAdminToken();
    
    // Path to the Word XML file
    const wordXmlPath = path.join(__dirname, 'attached_assets', 'isco-08-lista-cresc-cod-ocupatii-cor-2024.xml');
    
    if (!fs.existsSync(wordXmlPath)) {
      console.error(`Word XML file not found at ${wordXmlPath}`);
      return;
    }
    
    console.log(`Found Word XML file at ${wordXmlPath}`);
    
    // Make API request to seed the data
    const response = await axios.post(
      'http://localhost:5000/api/hr/cor/seed-word-xml',
      { xmlFilePath: wordXmlPath },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('API response:', response.data);
    
    // Get COR stats after import
    const statsResponse = await axios.get(
      'http://localhost:5000/api/hr/cor/stats',
      { 
        headers: { 
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('COR statistics after import:', statsResponse.data);
    
  } catch (error) {
    console.error('Error importing occupations from Word XML:', error.response?.data || error.message);
  }
}

// Execute the import function
importOccupationsFromWordXml();