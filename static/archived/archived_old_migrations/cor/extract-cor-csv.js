/**
 * Extract COR Occupations from CSV
 * 
 * This script extracts occupation data from the CSV file and generates SQL
 * INSERT statements that can be executed directly in the database.
 */

// Required modules
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CSV_FILE_PATH = path.resolve(__dirname, 'Coduri COR - occupations.csv');
const OUTPUT_PATH = path.resolve(__dirname, 'cor-occupations.sql');
const BATCH_SIZE = 100;

// Function to escape SQL strings
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Function to load and process the CSV file
async function extractOccupations() {
  console.log(`Loading CSV file from ${CSV_FILE_PATH}`);
  
  const fileStream = fs.createReadStream(CSV_FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const occupations = [];
  let isFirstLine = true;
  
  for await (const line of rl) {
    // Skip the header
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    
    // Parse CSV line
    let parts = line.split(',');
    let code, name;
    
    // Handle quoted strings for name (e.g., "name with, comma")
    if (parts.length > 2) {
      code = parts[0].trim();
      
      // If the name is in quotes and contains commas
      if (line.indexOf('"') !== -1) {
        const match = line.match(/^(\d+),\s*"(.+?)"$/);
        if (match) {
          code = match[1].trim();
          name = match[2].trim();
        } else {
          // Try an alternative approach
          name = parts.slice(1).join(',').trim();
          if (name.startsWith('"') && name.endsWith('"')) {
            name = name.substring(1, name.length - 1).trim();
          }
        }
      } else {
        // If there are commas but no quotes, just join everything after the code
        name = parts.slice(1).join(',').trim();
      }
    } else {
      code = parts[0].trim();
      name = parts[1] ? parts[1].trim() : '';
    }
    
    // Validate data
    if (!code || !name) {
      console.warn(`Skipping invalid line: ${line}`);
      continue;
    }
    
    // Validate occupation code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      console.warn(`Skipping occupation with invalid code format: ${code}`);
      continue;
    }
    
    // Calculate the subminor group code (first 4 digits of the occupation code)
    const subminorGroupCode = code.substring(0, 4);
    
    occupations.push({
      code,
      name,
      subminorGroupCode
    });
  }
  
  console.log(`Loaded ${occupations.length} occupations from CSV file`);
  return occupations;
}

// Function to generate SQL files
async function generateSqlFiles(occupations) {
  console.log('Generating SQL files...');
  
  // Generate parent groups SQL
  const majorGroups = new Map();
  const submajorGroups = new Map();
  const minorGroups = new Map();
  const subminorGroups = new Map();
  
  // Extract unique groups
  for (const occupation of occupations) {
    const code = occupation.code;
    const majorCode = code.substring(0, 1);
    const submajorCode = code.substring(0, 2);
    const minorCode = code.substring(0, 3);
    const subminorCode = code.substring(0, 4);
    
    if (!majorGroups.has(majorCode)) {
      majorGroups.set(majorCode, {
        code: majorCode,
        name: `Grupa majora ${majorCode}`
      });
    }
    
    if (!submajorGroups.has(submajorCode)) {
      submajorGroups.set(submajorCode, {
        code: submajorCode,
        name: `Subgrupa majora ${submajorCode}`,
        majorGroupCode: majorCode
      });
    }
    
    if (!minorGroups.has(minorCode)) {
      minorGroups.set(minorCode, {
        code: minorCode,
        name: `Grupa minora ${minorCode}`,
        submajorGroupCode: submajorCode
      });
    }
    
    if (!subminorGroups.has(subminorCode)) {
      subminorGroups.set(subminorCode, {
        code: subminorCode,
        name: `Subgrupa minora ${subminorCode}`,
        minorGroupCode: minorCode
      });
    }
  }
  
  // Create groups SQL file
  let groupsSql = '-- COR Groups SQL\n\n';
  
  // Major groups
  groupsSql += '-- Major Groups\n';
  for (const group of majorGroups.values()) {
    groupsSql += `INSERT INTO cor_major_groups (code, name, description) 
    VALUES ('${group.code}', '${escapeSql(group.name)}', '${escapeSql(group.name)}')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      updated_at = NOW();\n`;
  }
  
  // Submajor groups
  groupsSql += '\n-- Submajor Groups\n';
  for (const group of submajorGroups.values()) {
    groupsSql += `INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
    VALUES ('${group.code}', '${escapeSql(group.name)}', '${escapeSql(group.name)}', '${group.majorGroupCode}')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      major_group_code = EXCLUDED.major_group_code,
      updated_at = NOW();\n`;
  }
  
  // Minor groups
  groupsSql += '\n-- Minor Groups\n';
  for (const group of minorGroups.values()) {
    groupsSql += `INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
    VALUES ('${group.code}', '${escapeSql(group.name)}', '${escapeSql(group.name)}', '${group.submajorGroupCode}')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      submajor_group_code = EXCLUDED.submajor_group_code,
      updated_at = NOW();\n`;
  }
  
  // Subminor groups
  groupsSql += '\n-- Subminor Groups\n';
  for (const group of subminorGroups.values()) {
    groupsSql += `INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
    VALUES ('${group.code}', '${escapeSql(group.name)}', '${escapeSql(group.name)}', '${group.minorGroupCode}')
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name, 
      description = EXCLUDED.description,
      minor_group_code = EXCLUDED.minor_group_code,
      updated_at = NOW();\n`;
  }
  
  // Write groups SQL file
  fs.writeFileSync(path.resolve(__dirname, 'cor-groups.sql'), groupsSql);
  console.log(`Generated cor-groups.sql with ${majorGroups.size} major groups, ${submajorGroups.size} submajor groups, ${minorGroups.size} minor groups, and ${subminorGroups.size} subminor groups`);
  
  // Create occupations SQL files in batches
  let totalBatches = 0;
  for (let i = 0; i < occupations.length; i += BATCH_SIZE) {
    const batch = occupations.slice(i, i + BATCH_SIZE);
    const batchNumber = totalBatches + 1;
    
    let occupationsSql = `-- COR Occupations SQL - Batch ${batchNumber}\n\n`;
    
    for (const occupation of batch) {
      occupationsSql += `INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
      VALUES ('${occupation.code}', '${escapeSql(occupation.name)}', '', '${occupation.subminorGroupCode}', TRUE)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        updated_at = NOW();\n`;
    }
    
    const batchFileName = `cor-occupations-batch${batchNumber}.sql`;
    fs.writeFileSync(path.resolve(__dirname, batchFileName), occupationsSql);
    console.log(`Generated ${batchFileName} with ${batch.length} occupations`);
    
    totalBatches++;
  }
  
  // Create a combined occupations file
  let combinedSql = '-- COR Occupations SQL - Combined\n\n';
  for (const occupation of occupations) {
    combinedSql += `INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
    VALUES ('${occupation.code}', '${escapeSql(occupation.name)}', '', '${occupation.subminorGroupCode}', TRUE)
    ON CONFLICT (code) DO UPDATE SET 
      name = EXCLUDED.name,
      updated_at = NOW();\n`;
  }
  
  fs.writeFileSync(path.resolve(__dirname, 'cor-occupations.sql'), combinedSql);
  console.log(`Generated cor-occupations.sql with ${occupations.length} occupations`);
  
  return {
    totalOccupations: occupations.length,
    totalBatches,
    majorGroups: majorGroups.size,
    submajorGroups: submajorGroups.size,
    minorGroups: minorGroups.size,
    subminorGroups: subminorGroups.size
  };
}

// Main function
async function main() {
  try {
    console.log('Starting COR occupations extraction...');
    
    // Extract occupations from CSV
    const occupations = await extractOccupations();
    
    // Generate SQL files
    const stats = await generateSqlFiles(occupations);
    
    // Display summary
    console.log('\n===== Extraction Summary =====');
    console.log(`Total occupations extracted: ${stats.totalOccupations}`);
    console.log(`Total SQL batch files generated: ${stats.totalBatches}`);
    console.log(`Major groups: ${stats.majorGroups}`);
    console.log(`Submajor groups: ${stats.submajorGroups}`);
    console.log(`Minor groups: ${stats.minorGroups}`);
    console.log(`Subminor groups: ${stats.subminorGroups}`);
    
    console.log('\nCOR occupations extraction completed successfully.');
  } catch (error) {
    console.error('Error in extraction process:', error);
    process.exit(1);
  }
}

// Run the extraction function
main().catch(console.error);