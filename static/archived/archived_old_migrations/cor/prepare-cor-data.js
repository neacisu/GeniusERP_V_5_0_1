/**
 * COR Data Preparation Script
 * 
 * This script processes the Romanian Classification of Occupations (COR) XML data
 * from the attached files and prepares it for database seeding.
 * 
 * It parses the XML structure and creates a normalized JSON structure for the
 * hierarchical data model (major groups, submajor groups, minor groups, subminor groups, occupations).
 */

import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';

// File paths
const grupe_ocupationale_file = './attached_assets/cor-grupe-ocupationale.xml';
const occupations_file = './attached_assets/isco-08-lista-cresc-cod-ocupatii-cor-2024.xml';
const output_file = './cor-data-prepared.json';

/**
 * Process the XML files and generate a structured JSON output
 */
async function processCORData() {
  try {
    console.log('Starting COR data processing...');
    
    // Read XML files
    const grupXML = fs.readFileSync(grupe_ocupationale_file, 'utf8');
    const occupationsXML = fs.readFileSync(occupations_file, 'utf8');
    
    // Parse XML
    const parser = new xml2js.Parser({ explicitArray: false });
    
    console.log('Parsing grup file...');
    const grupData = await parser.parseStringPromise(grupXML);
    
    console.log('Parsing occupations file...');
    const occupationsData = await parser.parseStringPromise(occupationsXML);
    
    // Process and combine data
    const processedData = processHierarchy(grupData, occupationsData);
    
    // Check if we have extracted occupations from the separate JSON file
    console.log('Checking for separately extracted occupations...');
    if (fs.existsSync('./extracted-occupations.json')) {
      const extractedOccupations = JSON.parse(fs.readFileSync('./extracted-occupations.json', 'utf-8'));
      console.log(`Found ${extractedOccupations.length} extracted occupations from separate file`);
      
      // Merge with existing occupations (if any)
      const occupationMap = new Map();
      
      // Add existing occupations to the map (if any)
      for (const occupation of processedData.occupations) {
        occupationMap.set(occupation.code, occupation);
      }
      
      // Add or update with extracted occupations
      for (const occupation of extractedOccupations) {
        // Only add if not already in the map
        if (!occupationMap.has(occupation.code)) {
          occupationMap.set(occupation.code, occupation);
        }
      }
      
      // Convert back to array
      processedData.occupations = Array.from(occupationMap.values());
      console.log(`After merging, total occupations: ${processedData.occupations.length}`);
    }
    
    // Write output
    fs.writeFileSync(output_file, JSON.stringify(processedData, null, 2));
    
    console.log(`Processed COR data has been written to ${output_file}`);
    console.log(`Extracted ${processedData.majorGroups.length} major groups`);
    console.log(`Extracted ${processedData.submajorGroups.length} submajor groups`);
    console.log(`Extracted ${processedData.minorGroups.length} minor groups`);
    console.log(`Extracted ${processedData.subminorGroups.length} subminor groups`);
    console.log(`Extracted ${processedData.occupations.length} occupations`);
    
    // Generate SQL-ready output
    generateSQLFile(processedData);
    
    return processedData;
  } catch (error) {
    console.error('Error processing COR data:', error);
    throw error;
  }
}

/**
 * Process the hierarchical structure of COR data
 */
function processHierarchy(grupData, occupationsData) {
  const result = {
    majorGroups: [],
    submajorGroups: [],
    minorGroups: [],
    subminorGroups: [],
    occupations: []
  };
  
  // Maps to track unique entries
  const majorMap = new Map();
  const submajorMap = new Map();
  const minorMap = new Map();
  const subminorMap = new Map();
  const occupationMap = new Map();
  
  try {
    // Process Excel XML format data
    console.log('Processing Excel XML format...');
    
    // Extract data from the first file (grup file)
    const grupWorksheet = grupData?.Workbook?.Worksheet;
    if (!grupWorksheet) {
      console.error('Could not find Worksheet in grup file');
      return result;
    }
    
    // Find the Worksheet containing occupation data
    let grupTable = null;
    if (Array.isArray(grupWorksheet)) {
      for (const ws of grupWorksheet) {
        if (ws.Table) {
          grupTable = ws.Table;
          break;
        }
      }
    } else if (grupWorksheet.Table) {
      grupTable = grupWorksheet.Table;
    }
    
    if (!grupTable) {
      console.error('Could not find Table in grup Worksheet');
      return result;
    }
    
    // Extract rows from the table
    const rows = grupTable.Row || [];
    const rowsArray = Array.isArray(rows) ? rows : [rows];
    
    console.log(`Found ${rowsArray.length} rows in grup file`);
    
    // Skip header row (if any)
    for (let i = 1; i < rowsArray.length; i++) {
      const row = rowsArray[i];
      if (!row || !row.Cell) continue;
      
      const cells = Array.isArray(row.Cell) ? row.Cell : [row.Cell];
      if (cells.length < 3) continue; // Need at least code and name cells
      
      // Extract code and name from cells (adjust indices based on actual data)
      const codeCell = cells[0];
      const nameCell = cells[2]; // Adjust if needed based on actual data
      
      // Extract cell values
      const code = codeCell?.Data?._; 
      const name = nameCell?.Data?._; 
      
      if (!code || !name) continue;
      
      // If the code is 6 digits, it's an occupation
      if (/^\d{6}$/.test(code)) {
        // Extract hierarchy codes
        const majorCode = code.substring(0, 1);
        const submajorCode = code.substring(0, 2);
        const minorCode = code.substring(0, 3);
        const subminorCode = code.substring(0, 4);
        
        // Add to occupation map
        if (!occupationMap.has(code)) {
          occupationMap.set(code, {
            code,
            name,
            description: '',
            subminorGroupCode: subminorCode,
            isActive: true
          });
        }
        
        // Create hierarchy groups if they don't exist
        // Process major group
        if (!majorMap.has(majorCode)) {
          majorMap.set(majorCode, {
            code: majorCode,
            name: `Grupa majoră ${majorCode}`,
            description: `Grupa majoră ${majorCode}`
          });
        }
        
        // Process submajor group
        if (!submajorMap.has(submajorCode)) {
          submajorMap.set(submajorCode, {
            code: submajorCode,
            name: `Subgrupa majoră ${submajorCode}`,
            description: `Subgrupa majoră ${submajorCode}`,
            majorGroupCode: majorCode
          });
        }
        
        // Process minor group
        if (!minorMap.has(minorCode)) {
          minorMap.set(minorCode, {
            code: minorCode,
            name: `Grupa minoră ${minorCode}`,
            description: `Grupa minoră ${minorCode}`,
            submajorGroupCode: submajorCode
          });
        }
        
        // Process subminor group
        if (!subminorMap.has(subminorCode)) {
          subminorMap.set(subminorCode, {
            code: subminorCode,
            name: `Subgrupa minoră ${subminorCode}`,
            description: `Subgrupa minoră ${subminorCode}`,
            minorGroupCode: minorCode
          });
        }
      } 
      // If the code is less than 6 digits, it might be a group heading
      else if (/^\d{1,4}$/.test(code)) {
        const codeLength = code.length;
        
        // Based on code length, determine group type
        if (codeLength === 1) {
          // Major group
          majorMap.set(code, {
            code,
            name,
            description: name
          });
        } else if (codeLength === 2) {
          // Submajor group
          const majorCode = code.substring(0, 1);
          submajorMap.set(code, {
            code,
            name,
            description: name,
            majorGroupCode: majorCode
          });
        } else if (codeLength === 3) {
          // Minor group
          const submajorCode = code.substring(0, 2);
          minorMap.set(code, {
            code,
            name,
            description: name,
            submajorGroupCode: submajorCode
          });
        } else if (codeLength === 4) {
          // Subminor group
          const minorCode = code.substring(0, 3);
          subminorMap.set(code, {
            code,
            name,
            description: name,
            minorGroupCode: minorCode
          });
        }
      }
    }
    
    // Process additional occupations from the second file
    if (occupationsData) {
      const additionalOccupations = extractOccupationsFromSecondFile(occupationsData);
      console.log(`Found ${additionalOccupations.length} additional occupations from second file`);
      
      for (const occupation of additionalOccupations) {
        if (!occupationMap.has(occupation.code)) {
          // Try to determine parent groups
          const subminorCode = occupation.code.substring(0, 4);
          const minorCode = occupation.code.substring(0, 3);
          const submajorCode = occupation.code.substring(0, 2);
          const majorCode = occupation.code.substring(0, 1);
          
          // Ensure all parent groups exist
          if (!majorMap.has(majorCode)) {
            majorMap.set(majorCode, {
              code: majorCode,
              name: `Grupa majoră ${majorCode}`,
              description: `Grupa majoră ${majorCode}`
            });
          }
          
          if (!submajorMap.has(submajorCode)) {
            submajorMap.set(submajorCode, {
              code: submajorCode,
              name: `Subgrupa majoră ${submajorCode}`,
              description: `Subgrupa majoră ${submajorCode}`,
              majorGroupCode: majorCode
            });
          }
          
          if (!minorMap.has(minorCode)) {
            minorMap.set(minorCode, {
              code: minorCode,
              name: `Grupa minoră ${minorCode}`,
              description: `Grupa minoră ${minorCode}`,
              submajorGroupCode: submajorCode
            });
          }
          
          if (!subminorMap.has(subminorCode)) {
            subminorMap.set(subminorCode, {
              code: subminorCode,
              name: `Subgrupa minoră ${subminorCode}`,
              description: `Subgrupa minoră ${subminorCode}`,
              minorGroupCode: minorCode
            });
          }
          
          occupationMap.set(occupation.code, {
            ...occupation,
            subminorGroupCode: subminorCode
          });
        }
      }
    }
    
    // Convert maps to arrays
    result.majorGroups = Array.from(majorMap.values());
    result.submajorGroups = Array.from(submajorMap.values());
    result.minorGroups = Array.from(minorMap.values());
    result.subminorGroups = Array.from(subminorMap.values());
    result.occupations = Array.from(occupationMap.values());
    
    return result;
  } catch (error) {
    console.error('Error processing hierarchy:', error);
    throw error;
  }
}

/**
 * Extract occupations from the second XML file format (Word DOCX format)
 */
function extractOccupationsFromSecondFile(data) {
  const occupations = [];
  
  try {
    console.log('Parsing Word XML format for occupations...');
    
    // This is a Word document XML format (DOCX)
    // Check if we have document and body 
    const doc = data.pkg?.part;
    
    if (!doc || !Array.isArray(doc)) {
      console.error('Could not find parts in Word document');
      return occupations;
    }
    
    // Find the document.xml part that contains the actual content
    let documentPart = null;
    for (const part of doc) {
      if (part['$']?.name === '/word/document.xml') {
        documentPart = part;
        break;
      }
    }
    
    if (!documentPart || !documentPart.pkg$xmlData) {
      console.error('Could not find document XML part');
      return occupations;
    }
    
    // Extract the document content
    const document = documentPart.pkg$xmlData.w$document;
    if (!document || !document.w$body) {
      console.error('Could not find document body');
      return occupations;
    }
    
    // Find tables in the document
    const tables = document.w$body[0]?.w$tbl;
    if (!tables || tables.length === 0) {
      console.error('No tables found in document');
      return occupations;
    }
    
    console.log(`Found ${tables.length} tables in Word document`);
    
    // Process the first table (assuming it contains our occupation data)
    const table = tables[0];
    const rows = table.w$tr || [];
    
    console.log(`Found ${rows.length} rows in table`);
    
    // Process each row
    for (const row of rows) {
      if (!row.w$tc || row.w$tc.length < 3) continue; // Need at least 3 cells (index, code, name)
      
      // Get the code cell (second cell) and name cell (third cell)
      const codeCell = row.w$tc[1];
      const nameCell = row.w$tc[2];
      
      if (!codeCell || !nameCell) continue;
      
      // Extract text from cells
      const code = extractTextFromWordCell(codeCell);
      const name = extractTextFromWordCell(nameCell);
      
      if (code && name && /^\d{6}$/.test(code)) {
        occupations.push({
          code,
          name,
          description: '',
          isActive: true
        });
      }
    }
    
    console.log(`Extracted ${occupations.length} occupations from Word document`);
  } catch (error) {
    console.error('Error extracting from second file:', error);
    console.error(error.stack);
  }
  
  return occupations;
}

/**
 * Helper function to extract text from a Word XML cell
 */
function extractTextFromWordCell(cell) {
  try {
    // Get paragraphs in the cell
    const paragraphs = cell.w$p || [];
    
    // Combine text from all paragraphs
    let text = '';
    for (const para of paragraphs) {
      const runs = para.w$r || [];
      
      for (const run of runs) {
        const textElements = run.w$t || [];
        
        for (const textEl of textElements) {
          // Text can be in _ property (actual text) or in $ property
          if (textEl._ !== undefined) {
            text += textEl._;
          } else if (typeof textEl === 'string') {
            text += textEl;
          }
        }
      }
    }
    
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from cell:', error);
    return '';
  }
}

/**
 * Generate a SQL file for direct database loading
 */
function generateSQLFile(data) {
  try {
    let sql = '-- COR data SQL import script\n\n';
    
    // Major groups
    sql += '-- Major Groups\n';
    for (const group of data.majorGroups) {
      sql += `INSERT INTO cor_major_groups (code, name, description) 
        VALUES ('${group.code}', '${escapeSql(group.name)}', '${escapeSql(group.description || '')}')
        ON CONFLICT (code) DO UPDATE SET 
        name = '${escapeSql(group.name)}', 
        description = '${escapeSql(group.description || '')}',
        updated_at = NOW();\n`;
    }
    
    // Submajor groups
    sql += '\n-- Submajor Groups\n';
    for (const group of data.submajorGroups) {
      sql += `INSERT INTO cor_submajor_groups (code, name, description, major_group_code) 
        VALUES ('${group.code}', '${escapeSql(group.name)}', '${escapeSql(group.description || '')}', '${group.majorGroupCode}')
        ON CONFLICT (code) DO UPDATE SET 
        name = '${escapeSql(group.name)}', 
        description = '${escapeSql(group.description || '')}',
        major_group_code = '${group.majorGroupCode}',
        updated_at = NOW();\n`;
    }
    
    // Minor groups
    sql += '\n-- Minor Groups\n';
    for (const group of data.minorGroups) {
      sql += `INSERT INTO cor_minor_groups (code, name, description, submajor_group_code) 
        VALUES ('${group.code}', '${escapeSql(group.name)}', '${escapeSql(group.description || '')}', '${group.submajorGroupCode}')
        ON CONFLICT (code) DO UPDATE SET 
        name = '${escapeSql(group.name)}', 
        description = '${escapeSql(group.description || '')}',
        submajor_group_code = '${group.submajorGroupCode}',
        updated_at = NOW();\n`;
    }
    
    // Subminor groups
    sql += '\n-- Subminor Groups\n';
    for (const group of data.subminorGroups) {
      sql += `INSERT INTO cor_subminor_groups (code, name, description, minor_group_code) 
        VALUES ('${group.code}', '${escapeSql(group.name)}', '${escapeSql(group.description || '')}', '${group.minorGroupCode}')
        ON CONFLICT (code) DO UPDATE SET 
        name = '${escapeSql(group.name)}', 
        description = '${escapeSql(group.description || '')}',
        minor_group_code = '${group.minorGroupCode}',
        updated_at = NOW();\n`;
    }
    
    // Occupations (limit file size by writing in batches)
    sql += '\n-- Occupations\n';
    const occupationSql = data.occupations.map(occupation => 
      `INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
        VALUES ('${occupation.code}', '${escapeSql(occupation.name)}', '${escapeSql(occupation.description || '')}', '${occupation.subminorGroupCode}', ${occupation.isActive})
        ON CONFLICT (code) DO UPDATE SET 
        name = '${escapeSql(occupation.name)}', 
        description = '${escapeSql(occupation.description || '')}',
        subminor_group_code = '${occupation.subminorGroupCode}',
        is_active = ${occupation.isActive},
        updated_at = NOW();`
    );
    
    // Write to a separate file due to potential size
    fs.writeFileSync('cor-data.sql', sql + occupationSql.join('\n'));
    console.log('SQL file generated: cor-data.sql');
  } catch (error) {
    console.error('Error generating SQL file:', error);
  }
}

/**
 * Escape SQL strings
 */
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Run the processing
processCORData().catch(console.error);