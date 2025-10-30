/**
 * COR Import Status Script
 * 
 * This script generates a status report for the COR import process,
 * showing current database counts and progress.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/hr';
const XML_FILE_PATH = path.resolve(__dirname, 'attached_assets/cor-ocupatii.xml');
const CSV_FILE_PATH = path.resolve(__dirname, 'Coduri COR - occupations.csv');

// Function to get COR database statistics
async function getCorStats() {
  try {
    console.log('Fetching COR statistics from API...');
    
    // Generate a simple token for authentication
    // This is a placeholder and should be replaced with actual JWT generation
    const token = generateSimpleToken();
    
    const response = await fetch(`${API_BASE_URL}/cor/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching COR stats:', error);
    return {
      majorGroups: 0,
      submajorGroups: 0,
      minorGroups: 0,
      subminorGroups: 0,
      occupations: 0,
      activeOccupations: 0
    };
  }
}

// Function to get occupation count from XML file
function getXmlOccupationCount(xmlData) {
  try {
    if (!fs.existsSync(xmlData)) {
      console.error(`XML file not found: ${xmlData}`);
      return 0;
    }
    
    // Read the XML file and count occupations
    const xmlContent = fs.readFileSync(xmlData, 'utf8');
    
    // Quick count using string matching
    const count = (xmlContent.match(/<ocupatie>/g) || []).length;
    return count;
  } catch (error) {
    console.error('Error counting XML occupations:', error);
    return 0;
  }
}

// Function to get occupation count from CSV file
function getCsvOccupationCount() {
  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`CSV file not found: ${CSV_FILE_PATH}`);
      return 0;
    }
    
    // Read the CSV file and count lines (minus header)
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    // Subtract 1 for the header row
    return Math.max(0, lines.length - 1);
  } catch (error) {
    console.error('Error counting CSV occupations:', error);
    return 0;
  }
}

// Function to count SQL batch files
function countSqlBatchFiles() {
  try {
    const files = fs.readdirSync(__dirname);
    const batchFiles = files.filter(file => /^cor-occupations-batch\d+\.sql$/.test(file));
    return batchFiles.length;
  } catch (error) {
    console.error('Error counting SQL batch files:', error);
    return 0;
  }
}

// Function to get expected rows from SQL files
function getExpectedRowsFromSql() {
  try {
    // If combined file exists, count the INSERT statements
    const combinedFilePath = path.resolve(__dirname, 'cor-occupations.sql');
    
    if (fs.existsSync(combinedFilePath)) {
      const content = fs.readFileSync(combinedFilePath, 'utf8');
      const insertCount = (content.match(/INSERT INTO cor_occupations/g) || []).length;
      return insertCount;
    }
    
    // Otherwise check individual batch files
    let totalCount = 0;
    const files = fs.readdirSync(__dirname);
    const batchFiles = files.filter(file => /^cor-occupations-batch\d+\.sql$/.test(file));
    
    for (const file of batchFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
      const insertCount = (content.match(/INSERT INTO cor_occupations/g) || []).length;
      totalCount += insertCount;
    }
    
    return totalCount;
  } catch (error) {
    console.error('Error counting SQL rows:', error);
    return 0;
  }
}

// Function to generate a simple token for auth
function generateSimpleToken() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    userId: 'admin-user-id',
    username: 'admin',
    roles: ['admin']
  };
  
  // Base64 encode the header and payload
  const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const base64UrlPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Add a dummy signature
  return `${base64UrlHeader}.${base64UrlPayload}.dummy-signature`;
}

// Main function to generate status report
async function generateStatusReport() {
  try {
    console.log('Generating COR import status report...');
    
    // Get database statistics
    const stats = await getCorStats();
    
    // Get expected counts
    const csvCount = getCsvOccupationCount();
    const xmlCount = getXmlOccupationCount(XML_FILE_PATH);
    const sqlFileCount = countSqlBatchFiles();
    const sqlExpectedRows = getExpectedRowsFromSql();
    
    // Calculate completion percentages
    const dbPercentage = csvCount > 0 ? ((stats.occupations / csvCount) * 100).toFixed(2) : 0;
    const sqlGenerationPercentage = csvCount > 0 ? ((sqlExpectedRows / csvCount) * 100).toFixed(2) : 0;
    
    // Generate the report
    const report = {
      timestamp: new Date().toISOString(),
      database: {
        majorGroups: stats.majorGroups,
        submajorGroups: stats.submajorGroups,
        minorGroups: stats.minorGroups,
        subminorGroups: stats.subminorGroups,
        occupations: stats.occupations,
        activeOccupations: stats.activeOccupations
      },
      sourceFiles: {
        csvFile: {
          exists: fs.existsSync(CSV_FILE_PATH),
          count: csvCount
        },
        xmlFile: {
          exists: fs.existsSync(XML_FILE_PATH),
          count: xmlCount
        }
      },
      sqlGeneration: {
        batchFilesCount: sqlFileCount,
        expectedRows: sqlExpectedRows,
        percentage: sqlGenerationPercentage
      },
      importProgress: {
        dbPercentage: dbPercentage,
        remaining: csvCount - stats.occupations
      }
    };
    
    // Print the report to console
    console.log('\n===== COR Import Status Report =====');
    console.log(`Generated at: ${report.timestamp}`);
    console.log('\n--- Database Statistics ---');
    console.log(`Major Groups: ${report.database.majorGroups}`);
    console.log(`Submajor Groups: ${report.database.submajorGroups}`);
    console.log(`Minor Groups: ${report.database.minorGroups}`);
    console.log(`Subminor Groups: ${report.database.subminorGroups}`);
    console.log(`Occupations: ${report.database.occupations}`);
    console.log(`Active Occupations: ${report.database.activeOccupations}`);
    
    console.log('\n--- Source Files ---');
    console.log(`CSV File: ${report.sourceFiles.csvFile.exists ? 'Found' : 'Not found'} (${report.sourceFiles.csvFile.count} occupations)`);
    console.log(`XML File: ${report.sourceFiles.xmlFile.exists ? 'Found' : 'Not found'} (${report.sourceFiles.xmlFile.count} occupations)`);
    
    console.log('\n--- SQL Generation ---');
    console.log(`Batch Files: ${report.sqlGeneration.batchFilesCount}`);
    console.log(`Expected Rows: ${report.sqlGeneration.expectedRows} (${report.sqlGeneration.percentage}% of CSV)`);
    
    console.log('\n--- Import Progress ---');
    console.log(`Database: ${report.database.occupations}/${report.sourceFiles.csvFile.count} occupations (${report.importProgress.dbPercentage}%)`);
    console.log(`Remaining: ${report.importProgress.remaining} occupations`);
    
    console.log('\n===== End of Report =====');
    
    // Save the report to a JSON file
    fs.writeFileSync(
      path.resolve(__dirname, 'cor-verification-report.json'), 
      JSON.stringify(report, null, 2)
    );
    
    console.log('\nReport saved to cor-verification-report.json');
    
    return report;
  } catch (error) {
    console.error('Error generating status report:', error);
    throw error;
  }
}

// Run the report generation
generateStatusReport().catch(console.error);