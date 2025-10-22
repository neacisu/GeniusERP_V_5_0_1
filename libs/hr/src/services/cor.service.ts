/**
 * COR Service - Romanian Occupation Classification
 * 
 * This service manages the Romanian Classification of Occupations (COR)
 * and provides methods for:
 * - Adding and updating COR data
 * - Searching for occupations
 * - Validating COR codes
 * - Seeding the database with COR data from XML files
 * 
 * The COR nomenclature is hierarchical:
 * - Major groups (1 digit)
 * - Submajor groups (2 digits)
 * - Minor groups (3 digits)
 * - Subminor groups (4 digits)
 * - Occupations (6 digits)
 */

// Import dependencies
import xml2js from 'xml2js';
import fs from 'fs';
import path from 'path';
import {
  corMajorGroups,
  corSubmajorGroups,
  corMinorGroups,
  corSubminorGroups,
  corOccupations
} from '../schema/cor.schema';
import { eq, sql, count } from 'drizzle-orm';
import { AuditService } from "@common/services/audit.service";

export class CorService {
  private db: any;
  private auditService: any;

  constructor(db: any, auditService: any) {
    this.db = db;
    this.auditService = auditService;
  }

  /**
   * Get major groups with optional search filter
   */
  async getMajorGroups(searchTerm?: string) {
    try {
      let query = this.db.select().from(corMajorGroups);
      
      if (searchTerm) {
        query = query.where(sql`lower(name) LIKE ${`%${searchTerm.toLowerCase()}%`}`);
      }
      
      return await query.orderBy(corMajorGroups.code);
    } catch (error: any) {
      console.error("Error fetching COR major groups:", error);
      throw new Error("Failed to fetch COR major groups");
    }
  }

  /**
   * Get submajor groups with optional parent code or search filter
   */
  async getSubmajorGroups(majorGroupCode?: string, searchTerm?: string) {
    try {
      let query = this.db.select().from(corSubmajorGroups);
      
      if (majorGroupCode) {
        query = query.where(eq(corSubmajorGroups.majorGroupCode, majorGroupCode));
      }
      
      if (searchTerm) {
        query = query.where(sql`lower(name) LIKE ${`%${searchTerm.toLowerCase()}%`}`);
      }
      
      return await query.orderBy(corSubmajorGroups.code);
    } catch (error: any) {
      console.error("Error fetching COR submajor groups:", error);
      throw new Error("Failed to fetch COR submajor groups");
    }
  }

  /**
   * Get minor groups with optional parent code or search filter
   */
  async getMinorGroups(submajorGroupCode?: string, searchTerm?: string) {
    try {
      let query = this.db.select().from(corMinorGroups);
      
      if (submajorGroupCode) {
        query = query.where(eq(corMinorGroups.submajorGroupCode, submajorGroupCode));
      }
      
      if (searchTerm) {
        query = query.where(sql`lower(name) LIKE ${`%${searchTerm.toLowerCase()}%`}`);
      }
      
      return await query.orderBy(corMinorGroups.code);
    } catch (error: any) {
      console.error("Error fetching COR minor groups:", error);
      throw new Error("Failed to fetch COR minor groups");
    }
  }

  /**
   * Get subminor groups with optional parent code or search filter
   */
  async getSubminorGroups(minorGroupCode?: string, searchTerm?: string) {
    try {
      let query = this.db.select().from(corSubminorGroups);
      
      if (minorGroupCode) {
        query = query.where(eq(corSubminorGroups.minorGroupCode, minorGroupCode));
      }
      
      if (searchTerm) {
        query = query.where(sql`lower(name) LIKE ${`%${searchTerm.toLowerCase()}%`}`);
      }
      
      return await query.orderBy(corSubminorGroups.code);
    } catch (error: any) {
      console.error("Error fetching COR subminor groups:", error);
      throw new Error("Failed to fetch COR subminor groups");
    }
  }

  /**
   * Get occupations with optional parent code or search filter
   */
  async getOccupations(params?: { 
    subminorGroupCode?: string; 
    searchTerm?: string; 
    page?: number; 
    limit?: number;
  }) {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const offset = (page - 1) * limit;
      
      let query = this.db.select().from(corOccupations);
      let countQuery = this.db.select({ count: sql<number>`count(*)` }).from(corOccupations);
      
      if (params?.subminorGroupCode) {
        query = query.where(eq(corOccupations.subminorGroupCode, params.subminorGroupCode));
        countQuery = countQuery.where(eq(corOccupations.subminorGroupCode, params.subminorGroupCode));
      }
      
      if (params?.searchTerm) {
        const searchCondition = sql`lower(${corOccupations.name}) LIKE ${`%${params.searchTerm.toLowerCase()}%`}`;
        query = query.where(searchCondition);
        countQuery = countQuery.where(searchCondition);
      }
      
      // Get total count
      const totalResult = await countQuery;
      const total = totalResult[0]?.count || 0;
      
      // Get paginated items
      const items = await query
        .orderBy(corOccupations.code)
        .limit(limit)
        .offset(offset);
      
      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      console.error("Error fetching COR occupations:", error);
      throw new Error("Failed to fetch COR occupations");
    }
  }

  /**
   * Get occupation details by code
   */
  async getOccupationByCode(code: string) {
    try {
      const occupation = await this.db.select()
        .from(corOccupations)
        .where(eq(corOccupations.code, code))
        .limit(1);
      
      return occupation[0] || null;
    } catch (error: any) {
      console.error(`Error fetching COR occupation with code ${code}:`, error);
      throw new Error(`Failed to fetch COR occupation with code ${code}`);
    }
  }

  /**
   * Search occupations by name or code
   */
  async searchOccupations(searchTerm: string, limit = 50) {
    try {
      // If the search term is numeric, prioritize code search
      const isNumeric = /^\d+$/.test(searchTerm);
      
      let query = this.db.select().from(corOccupations);
      
      if (isNumeric) {
        query = query.where(sql`code LIKE ${`${searchTerm}%`}`)
                     .orderBy(corOccupations.code)
                     .limit(limit);
      } else {
        query = query.where(sql`lower(name) LIKE ${`%${searchTerm.toLowerCase()}%`}`)
                     .orderBy(corOccupations.name)
                     .limit(limit);
      }
      
      return await query;
    } catch (error: any) {
      console.error("Error searching COR occupations:", error);
      throw new Error("Failed to search COR occupations");
    }
  }

  /**
   * Validate a COR code
   */
  async validateCorCode(code: string): Promise<boolean> {
    try {
      // Check if it's a 6-digit code
      if (!/^\d{6}$/.test(code)) {
        return false;
      }
      
      // Check if it exists in the database
      const occupation = await this.getOccupationByCode(code);
      return !!occupation;
    } catch (error: any) {
      console.error(`Error validating COR code ${code}:`, error);
      throw new Error(`Failed to validate COR code ${code}`);
    }
  }
  
  /**
   * Get COR database statistics
   */
  async getCorStats() {
    try {
      // Count all COR database entries
      const majorGroupsCount = await this.db.select({ count: sql`count(*)` }).from(corMajorGroups);
      const submajorGroupsCount = await this.db.select({ count: sql`count(*)` }).from(corSubmajorGroups);
      const minorGroupsCount = await this.db.select({ count: sql`count(*)` }).from(corMinorGroups);
      const subminorGroupsCount = await this.db.select({ count: sql`count(*)` }).from(corSubminorGroups);
      const occupationsCount = await this.db.select({ count: sql`count(*)` }).from(corOccupations);
      
      // Count active entries only
      const activeOccupationsCount = await this.db.select({ count: sql`count(*)` })
        .from(corOccupations)
        .where(eq(corOccupations.isActive, true));
      
      return {
        majorGroups: Number(majorGroupsCount[0].count),
        submajorGroups: Number(submajorGroupsCount[0].count),
        minorGroups: Number(minorGroupsCount[0].count),
        subminorGroups: Number(subminorGroupsCount[0].count),
        occupations: Number(occupationsCount[0].count),
        activeOccupations: Number(activeOccupationsCount[0].count)
      };
    } catch (error: any) {
      console.error("Error fetching COR statistics:", error);
      throw new Error(`Failed to fetch COR statistics: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Seed the COR database with data from XML files
   * Supports both Excel XML format and Word XML format
   */
  async seedCorData(userId: string, xmlFilePath: string) {
    try {
      console.log(`Starting COR data seeding from ${xmlFilePath}`);
      
      // Determine the XML type by file content
      const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
      
      // Check if it's Word XML format
      if (xmlData.includes('<?mso-application progid="Word.Document"?>')) {
        return this.seedCorDataFromWordXml(userId, xmlFilePath);
      }
      
      // Otherwise, assume it's Excel XML format
      return this.seedCorDataFromExcelXml(userId, xmlFilePath);
    } catch (error: any) {
      console.error("Error seeding COR data:", error);
      throw new Error(`Failed to seed COR data: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Seed COR data from Excel XML format (cor-grupe-ocupationale.xml)
   */
  async seedCorDataFromExcelXml(userId: string, xmlFilePath: string) {
    try {
      console.log(`Processing Excel XML format from ${xmlFilePath}`);
      
      // Parse XML file
      const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);
      
      if (!result || !result.COR || !result.COR.GrupaOcupationala) {
        throw new Error("Invalid COR Excel XML format");
      }
      
      console.log("Successfully parsed COR Excel XML data");
      
      // Create a transaction for all operations
      await this.db.transaction(async (tx: any) => {
        const grupeOcupationale = Array.isArray(result.COR.GrupaOcupationala) 
          ? result.COR.GrupaOcupationala 
          : [result.COR.GrupaOcupationala];
        
        // Step 1: Process major groups (1-digit)
        const majorGroupsMap = new Map();
        for (const grupa of grupeOcupationale) {
          const majorCode = grupa.$.cod.substring(0, 1);
          
          if (!majorGroupsMap.has(majorCode)) {
            majorGroupsMap.set(majorCode, {
              code: majorCode,
              name: `Grupa majora ${majorCode}`,
              description: `Grupa majora ${majorCode}`,
            });
          }
        }
        
        // Insert major groups
        for (const majorGroup of majorGroupsMap.values()) {
          await tx.insert(corMajorGroups).values(majorGroup)
            .onConflictDoUpdate({
              target: corMajorGroups.code,
              set: { 
                name: majorGroup.name,
                description: majorGroup.description,
                updatedAt: new Date()
              }
            });
        }
        
        console.log(`Inserted ${majorGroupsMap.size} major groups`);
        
        // Step 2: Process submajor groups (2-digit)
        const submajorGroupsMap = new Map();
        for (const grupa of grupeOcupationale) {
          const majorCode = grupa.$.cod.substring(0, 1);
          const submajorCode = grupa.$.cod.substring(0, 2);
          
          if (!submajorGroupsMap.has(submajorCode)) {
            submajorGroupsMap.set(submajorCode, {
              code: submajorCode,
              name: `Subgrupa majora ${submajorCode}`,
              description: `Subgrupa majora ${submajorCode}`,
              majorGroupCode: majorCode
            });
          }
        }
        
        // Insert submajor groups
        for (const submajorGroup of submajorGroupsMap.values()) {
          await tx.insert(corSubmajorGroups).values(submajorGroup)
            .onConflictDoUpdate({
              target: corSubmajorGroups.code,
              set: { 
                name: submajorGroup.name,
                description: submajorGroup.description,
                majorGroupCode: submajorGroup.majorGroupCode,
                updatedAt: new Date()
              }
            });
        }
        
        console.log(`Inserted ${submajorGroupsMap.size} submajor groups`);
        
        // Step 3: Process minor groups (3-digit)
        const minorGroupsMap = new Map();
        for (const grupa of grupeOcupationale) {
          const submajorCode = grupa.$.cod.substring(0, 2);
          const minorCode = grupa.$.cod.substring(0, 3);
          
          if (!minorGroupsMap.has(minorCode)) {
            minorGroupsMap.set(minorCode, {
              code: minorCode,
              name: `Grupa minora ${minorCode}`,
              description: `Grupa minora ${minorCode}`,
              submajorGroupCode: submajorCode
            });
          }
        }
        
        // Insert minor groups
        for (const minorGroup of minorGroupsMap.values()) {
          await tx.insert(corMinorGroups).values(minorGroup)
            .onConflictDoUpdate({
              target: corMinorGroups.code,
              set: { 
                name: minorGroup.name,
                description: minorGroup.description,
                submajorGroupCode: minorGroup.submajorGroupCode,
                updatedAt: new Date()
              }
            });
        }
        
        console.log(`Inserted ${minorGroupsMap.size} minor groups`);
        
        // Step 4: Process subminor groups (4-digit)
        const subminorGroupsMap = new Map();
        for (const grupa of grupeOcupationale) {
          const minorCode = grupa.$.cod.substring(0, 3);
          const subminorCode = grupa.$.cod.substring(0, 4);
          
          if (!subminorGroupsMap.has(subminorCode)) {
            subminorGroupsMap.set(subminorCode, {
              code: subminorCode,
              name: `Subgrupa minora ${subminorCode}`,
              description: `Subgrupa minora ${subminorCode}`,
              minorGroupCode: minorCode
            });
          }
        }
        
        // Insert subminor groups
        for (const subminorGroup of subminorGroupsMap.values()) {
          await tx.insert(corSubminorGroups).values(subminorGroup)
            .onConflictDoUpdate({
              target: corSubminorGroups.code,
              set: { 
                name: subminorGroup.name,
                description: subminorGroup.description,
                minorGroupCode: subminorGroup.minorGroupCode,
                updatedAt: new Date()
              }
            });
        }
        
        console.log(`Inserted ${subminorGroupsMap.size} subminor groups`);
        
        // Step 5: Process occupations (6-digit)
        let occupationCount = 0;
        for (const grupa of grupeOcupationale) {
          const subminorCode = grupa.$.cod.substring(0, 4);
          const ocupatii = Array.isArray(grupa.Ocupatie) ? grupa.Ocupatie : (grupa.Ocupatie ? [grupa.Ocupatie] : []);
          
          for (const ocupatie of ocupatii) {
            const occupationCode = ocupatie.$.cod;
            const occupationName = ocupatie.$.denumire;
            
            if (!occupationCode || !occupationName) {
              console.warn(`Skipping occupation with missing code or name: ${JSON.stringify(ocupatie)}`);
              continue;
            }
            
            await tx.insert(corOccupations).values({
              code: occupationCode,
              name: occupationName,
              description: '',
              subminorGroupCode: subminorCode,
              isActive: true
            }).onConflictDoUpdate({
              target: corOccupations.code,
              set: { 
                name: occupationName,
                subminorGroupCode: subminorCode,
                updatedAt: new Date()
              }
            });
            
            occupationCount++;
          }
        }
        
        console.log(`Inserted ${occupationCount} occupations`);
        
        // Log the seeding in the audit log
        await this.auditService.logAction(
          userId,
          'SEED',
          'COR',
          'SEED',
          `Seeded COR data from Excel XML format: ${xmlFilePath}`,
          null,
          {
            stats: {
              majorGroups: majorGroupsMap.size,
              submajorGroups: submajorGroupsMap.size,
              minorGroups: minorGroupsMap.size,
              subminorGroups: subminorGroupsMap.size,
              occupations: occupationCount
            }
          }
        );
      });
      
      console.log("COR data seeding from Excel XML completed successfully");
      return {
        success: true,
        message: "COR data seeding from Excel XML completed successfully"
      };
    } catch (error: any) {
      console.error("Error seeding COR data from Excel XML:", error);
      throw new Error(`Failed to seed COR data from Excel XML: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Seed COR data from Word XML format (isco-08-lista-cresc-cod-ocupatii-cor-2024.xml)
   * This format has a different structure and requires special processing
   */
  async seedCorDataFromWordXml(userId: string, xmlFilePath: string) {
    try {
      console.log(`Processing Word XML format from ${xmlFilePath}`);
      
      // Read the file content
      const xmlData = fs.readFileSync(xmlFilePath, 'utf8');
      
      // Extract all 6-digit numbers (occupation codes) from the document
      // We use a more flexible approach to find all 6-digit numbers in the file
      const codeMatches = xmlData.match(/\b([0-9]{6})\b/g) || [];
      const uniqueCodes = Array.from(new Set(codeMatches));
      
      console.log(`Found ${uniqueCodes.length} occupation codes in Word XML`);
      
      // Extract text content that might contain occupation names
      // This is a simplified approach - we'll extract text between w:t tags 
      // and then try to match them with codes
      const textMatches = xmlData.match(/<w:t>([^<]+)<\/w:t>/g) || [];
      const textContents = textMatches.map(match => {
        const content = match.replace(/<w:t>|<\/w:t>/g, '').trim();
        return content;
      }).filter(text => text.length > 0);
      
      // Build a map of occupation codes to names
      // For simplicity, we'll assume each occupation code is followed by its name
      const occupationMap = new Map<string, string>();
      
      // Extract occupation text chunks (title + description)
      for (let i = 0; i < textContents.length; i++) {
        const content = textContents[i];
        
        // Check if this content is a 6-digit code
        if (/^[0-9]{6}$/.test(content)) {
          const code = content;
          // Check if the next content exists and could be a name
          if (i + 1 < textContents.length && textContents[i + 1].length > 0) {
            const name = textContents[i + 1];
            occupationMap.set(code, name);
            i++; // Skip the name we just processed
          }
        }
      }
      
      // If we couldn't find enough pairs, try a different approach by looking for occupation codes in the text
      if (occupationMap.size < uniqueCodes.length / 2) {
        console.log(`First approach only found ${occupationMap.size} matches, trying alternative...`);
        occupationMap.clear();
        
        // For each unique code, try to find text that contains or follows that code
        for (const code of uniqueCodes) {
          // Find the index of this code in the original XML
          const codeIndex = xmlData.indexOf(code);
          if (codeIndex !== -1) {
            // Look for text after this code within a reasonable distance
            const afterCode = xmlData.substring(codeIndex + code.length, codeIndex + 500);
            const nameMatch = afterCode.match(/<w:t>([^<]{5,100})<\/w:t>/);
            if (nameMatch) {
              const name = nameMatch[1].trim();
              // Only use names that don't look like codes or XML tags
              if (name.length > 5 && !/^\d+$/.test(name) && !name.includes('<') && !name.includes('>')) {
                occupationMap.set(code, name);
              }
            }
          }
        }
      }
      
      console.log(`Matched ${occupationMap.size} occupations with names`);
      
      // Process and insert the occupations in batches
      await this.db.transaction(async (tx: any) => {
        let insertCount = 0;
        let updateCount = 0;
        
        // Process entries in batches of 100
        const batchSize = 100;
        const entries = Array.from(occupationMap.entries());
        
        for (let i = 0; i < entries.length; i += batchSize) {
          const batch = entries.slice(i, i + batchSize);
          
          for (const [code, name] of batch) {
            // Determine the subminor group code (first 4 digits)
            const subminorCode = code.substring(0, 4);
            
            // Check if the occupation exists
            const existingOccupation = await tx.select()
              .from(corOccupations)
              .where(eq(corOccupations.code, code))
              .limit(1);
            
            if (existingOccupation.length === 0) {
              // Insert new occupation
              await tx.insert(corOccupations).values({
                code: code,
                name: name,
                description: '',
                subminorGroupCode: subminorCode,
                isActive: true
              });
              insertCount++;
            } else {
              // Update existing occupation
              await tx.update(corOccupations)
                .set({ 
                  name: name,
                  updatedAt: new Date()
                })
                .where(eq(corOccupations.code, code));
              updateCount++;
            }
            
            // Ensure the parent groups exist
            await this.ensureParentGroupsExist(tx, subminorCode);
          }
          
          console.log(`Processed batch ${i/batchSize + 1}/${Math.ceil(entries.length/batchSize)}`);
        }
        
        console.log(`Word XML import: ${insertCount} new occupations inserted, ${updateCount} existing occupations updated`);
        
        // Log the seeding in the audit log
        await this.auditService.logAction(
          userId,
          'SEED',
          'COR',
          'SEED',
          `Seeded COR data from Word XML format: ${xmlFilePath}`,
          null,
          {
            stats: {
              occupationsInserted: insertCount,
              occupationsUpdated: updateCount,
              totalProcessed: insertCount + updateCount
            }
          }
        );
      });
      
      console.log("COR data seeding from Word XML completed successfully");
      return {
        success: true,
        message: "COR data seeding from Word XML completed successfully"
      };
    } catch (error: any) {
      console.error("Error seeding COR data from Word XML:", error);
      throw new Error(`Failed to seed COR data from Word XML: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Log batch import in the audit log
   */
  public async logBatchImport(userId: string, insertCount: number, updateCount: number, totalCount: number) {
    // Log the batch import in the audit log
    await this.auditService.logAction(
      userId,
      'IMPORT',
      'COR',
      'BATCH_IMPORT',
      `Imported COR occupations batch`,
      null,
      {
        stats: {
          occupationsInserted: insertCount,
          occupationsUpdated: updateCount,
          totalProcessed: insertCount + updateCount,
          batchSize: totalCount
        }
      }
    );
  }
  
  /**
   * Ensure parent groups exist for a given subminor code
   * This method is public so it can be called from the controller
   */
  public async ensureParentGroupsExist(tx: any, subminorCode: string) {
    try {
      const majorCode = subminorCode.substring(0, 1);
      const submajorCode = subminorCode.substring(0, 2);
      const minorCode = subminorCode.substring(0, 3);
      
      // Check if major group exists
      const majorGroup = await tx.select()
        .from(corMajorGroups)
        .where(eq(corMajorGroups.code, majorCode))
        .limit(1);
      
      if (majorGroup.length === 0) {
        // Create major group
        await tx.insert(corMajorGroups).values({
          code: majorCode,
          name: `Grupa majora ${majorCode}`,
          description: `Grupa majora ${majorCode}`
        });
      }
      
      // Check if submajor group exists
      const submajorGroup = await tx.select()
        .from(corSubmajorGroups)
        .where(eq(corSubmajorGroups.code, submajorCode))
        .limit(1);
      
      if (submajorGroup.length === 0) {
        // Create submajor group
        await tx.insert(corSubmajorGroups).values({
          code: submajorCode,
          name: `Subgrupa majora ${submajorCode}`,
          description: `Subgrupa majora ${submajorCode}`,
          majorGroupCode: majorCode
        });
      }
      
      // Check if minor group exists
      const minorGroup = await tx.select()
        .from(corMinorGroups)
        .where(eq(corMinorGroups.code, minorCode))
        .limit(1);
      
      if (minorGroup.length === 0) {
        // Create minor group
        await tx.insert(corMinorGroups).values({
          code: minorCode,
          name: `Grupa minora ${minorCode}`,
          description: `Grupa minora ${minorCode}`,
          submajorGroupCode: submajorCode
        });
      }
      
      // Check if subminor group exists
      const subminorGroup = await tx.select()
        .from(corSubminorGroups)
        .where(eq(corSubminorGroups.code, subminorCode))
        .limit(1);
      
      if (subminorGroup.length === 0) {
        // Create subminor group
        await tx.insert(corSubminorGroups).values({
          code: subminorCode,
          name: `Subgrupa minora ${subminorCode}`,
          description: `Subgrupa minora ${subminorCode}`,
          minorGroupCode: minorCode
        });
      }
    } catch (error: any) {
      console.error(`Error ensuring parent groups for ${subminorCode}:`, error);
      throw error;
    }
  }
}