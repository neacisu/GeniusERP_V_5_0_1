/**
 * Simple Occupation Extraction Script
 * 
 * This script reads the Word XML file and extracts all 6-digit codes and 
 * their corresponding descriptions using regular expressions.
 */
import fs from 'fs';

/**
 * Extract occupations from the Word XML file
 */
async function extractOccupations() {
  try {
    // Read the XML file as text
    const xmlText = fs.readFileSync('./attached_assets/isco-08-lista-cresc-cod-ocupatii-cor-2024.xml', 'utf-8');
    console.log(`File loaded, size: ${xmlText.length} bytes`);
    
    // Use regex to find patterns of 6-digit codes followed by text
    // The pattern looks for XML tags that might contain the occupation code and name
    const occupations = [];
    
    // First approach - look for w:t tags containing 6 digits
    const codeRegex = /<w:t[^>]*>(\d{6})<\/w:t>/g;
    let codeMatch;
    
    // Extract all 6-digit codes
    const codes = [];
    while ((codeMatch = codeRegex.exec(xmlText)) !== null) {
      codes.push(codeMatch[1]);
    }
    
    console.log(`Found ${codes.length} potential occupation codes`);
    
    // For each code, try to find the corresponding name
    // We'll look for the occupation name in text that comes after the code
    for (const code of codes) {
      // Find the position of the code
      const codePosition = xmlText.indexOf(`<w:t>${code}</w:t>`);
      if (codePosition === -1) continue;
      
      // Get a chunk of text after the code (should contain the name)
      const textAfterCode = xmlText.substring(codePosition, codePosition + 1000);
      
      // Now extract the nearest text node that comes after this code
      // This is likely to be the occupation name
      const nameRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
      
      // Skip the first match (which is the code itself)
      nameRegex.exec(textAfterCode);
      
      // The next match should be the name
      const nameMatch = nameRegex.exec(textAfterCode);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        
        // Skip if the name is another code
        if (/^\d+$/.test(name)) continue;
        
        // Extract subminor code (first 4 digits)
        const subminorCode = code.substring(0, 4);
        
        occupations.push({
          code,
          name,
          subminorGroupCode: subminorCode,
          description: '',
          isActive: true
        });
      }
    }
    
    console.log(`Successfully extracted ${occupations.length} occupations`);
    
    // Save to a JSON file
    fs.writeFileSync('extracted-occupations.json', JSON.stringify(occupations, null, 2));
    console.log('Saved to extracted-occupations.json');
    
    // Create SQL files with these occupations in smaller batches
    const batchSize = 200;
    const totalBatches = Math.ceil(occupations.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, occupations.length);
      const batchOccupations = occupations.slice(start, end);
      
      let sql = '-- COR Occupations SQL Batch ' + (batchIndex + 1) + '\n\n';
      
      for (const occupation of batchOccupations) {
        sql += `INSERT INTO cor_occupations (code, name, description, subminor_group_code, is_active) 
          VALUES ('${occupation.code}', '${escapeSql(occupation.name)}', '', '${occupation.subminorGroupCode}', true)
          ON CONFLICT (code) DO UPDATE SET 
          name = '${escapeSql(occupation.name)}', 
          description = '', 
          subminor_group_code = '${occupation.subminorGroupCode}',
          is_active = true,
          updated_at = NOW();\n`;
      }
      
      const fileName = `cor-occupations-batch${batchIndex + 1}.sql`;
      fs.writeFileSync(fileName, sql);
      console.log(`SQL file generated: ${fileName} with ${batchOccupations.length} occupations`);
    }
    
    console.log(`Generated ${totalBatches} SQL batch files`);
    
    return occupations;
  } catch (error) {
    console.error('Error extracting occupations:', error);
    return [];
  }
}

/**
 * Escape SQL strings
 */
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Run the extraction
extractOccupations().catch(console.error);