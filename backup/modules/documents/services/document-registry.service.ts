/**
 * Document Registry Service
 * 
 * Provides a registry for incoming and outgoing document management (Registru intrări/ieșiri documente)
 * with auto-numbering and indexing capabilities for Romanian legal compliance.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc, and, asc, sql, like } from 'drizzle-orm';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../../../../shared/schema';
import { documents } from '../../../../shared/schema';
import { format } from 'date-fns';

/**
 * Document flow direction
 */
export enum DocumentFlow {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
  INTERNAL = 'INTERNAL'
}

/**
 * Document Registry Service for tracking incoming and outgoing documents
 */
export class DocumentRegistryService {
  private db: ReturnType<typeof drizzle>;
  private queryClient: ReturnType<typeof postgres>;

  constructor() {
    const connectionString = process.env.DATABASE_URL as string;
    
    if (!connectionString) {
      console.error('[DocumentRegistryService] 🚨 Missing DATABASE_URL in environment');
      throw new Error('Database connection string is missing');
    }

    this.queryClient = postgres(connectionString);
    this.db = drizzle(this.queryClient, { schema });
    
    console.log('[DocumentRegistryService] 📚 Registry service initialized');
  }

  /**
   * Register a document in the registry with auto-numbering
   * @param documentId Document ID to register
   * @param flow Document flow (incoming, outgoing, internal)
   * @param companyId Company ID for organization-specific numbering
   * @param metadata Additional metadata about the document
   */
  async registerDocument(
    documentId: string, 
    flow: DocumentFlow, 
    companyId: string,
    metadata: Record<string, any> = {}
  ) {
    console.log(`[DocumentRegistryService] 📥 Registering document ${documentId} as ${flow}`);
    
    try {
      // Get the current year for numbering
      const currentYear = new Date().getFullYear();
      
      // Get the next registry number for this company and flow
      const nextNumber = await this.getNextRegistryNumber(companyId, flow, currentYear);
      
      // Format the registry number according to Romanian standards
      // Example: IN-2025-0001 (for incoming documents)
      const prefix = this.getRegistryPrefix(flow);
      const formattedNumber = `${prefix}-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
      
      // Update the document with registry information
      await this.db.update(documents)
        .set({
          // Store registry info in the metadata field (we'll extend the schema later)
          type: `${flow}_REGISTERED`
        })
        .where(eq(documents.id, documentId));
        
      console.log(`[DocumentRegistryService] ✅ Document registered with number ${formattedNumber}`);
      
      return {
        documentId,
        registryNumber: formattedNumber,
        registeredAt: new Date(),
        flow,
        year: currentYear,
        sequentialNumber: nextNumber
      };
    } catch (error: any) {
      console.error(`[DocumentRegistryService] ❌ Failed to register document: ${error.message}`);
      throw new Error(`Failed to register document: ${error.message}`);
    }
  }
  
  /**
   * Get the next sequential registry number for a company and flow
   */
  private async getNextRegistryNumber(companyId: string, flow: DocumentFlow, year: number): Promise<number> {
    try {
      // This is a simplified implementation
      // In a production system, we would have a dedicated registry_numbers table
      // with auto-incrementing counters per company, flow, and year
      
      // For now, we'll just count the existing documents of this type and add 1
      const result = await this.db.select({
        count: sql`count(*)`,
      })
      .from(documents)
      .where(
        and(
          eq(documents.companyId, companyId),
          like(documents.type, `${flow}%`)
        )
      );
      
      const count = Number(result[0]?.count || 0);
      return count + 1;
    } catch (error: any) {
      console.error(`[DocumentRegistryService] ❌ Failed to get next registry number: ${error.message}`);
      throw new Error(`Failed to get next registry number: ${error.message}`);
    }
  }
  
  /**
   * Get registry prefix based on document flow
   */
  private getRegistryPrefix(flow: DocumentFlow): string {
    switch (flow) {
      case DocumentFlow.INCOMING:
        return 'IN';
      case DocumentFlow.OUTGOING:
        return 'OUT';
      case DocumentFlow.INTERNAL:
        return 'INT';
      default:
        return 'DOC';
    }
  }
  
  /**
   * Search the document registry
   */
  async searchRegistry(params: {
    companyId: string;
    flow?: DocumentFlow;
    startDate?: Date;
    endDate?: Date;
    keyword?: string;
    page?: number;
    limit?: number;
  }) {
    const { 
      companyId, 
      flow, 
      startDate, 
      endDate, 
      keyword,
      page = 1,
      limit = 20
    } = params;
    
    try {
      console.log(`[DocumentRegistryService] 🔍 Searching registry for company ${companyId}`);
      
      // Build the conditions array
      const conditions = [eq(documents.companyId, companyId)];
      
      // Add optional filters if provided
      if (flow) {
        conditions.push(like(documents.type, `${flow}%`));
      }
      
      if (startDate) {
        conditions.push(sql`${documents.createdAt} >= ${startDate}`);
      }
      
      if (endDate) {
        conditions.push(sql`${documents.createdAt} <= ${endDate}`);
      }
      
      if (keyword) {
        conditions.push(sql`${documents.ocrText} ILIKE ${'%' + keyword + '%'}`);
      }
      
      // Execute the query with all conditions
      const results = await this.db.select({
        id: documents.id,
        type: documents.type,
        filePath: documents.filePath,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        ocrText: documents.ocrText
      })
      .from(documents)
      .where(and(...conditions))
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(documents.createdAt));
      
      console.log(`[DocumentRegistryService] ✅ Found ${results.length} documents`);
      return results;
    } catch (error: any) {
      console.error(`[DocumentRegistryService] ❌ Failed to search registry: ${error.message}`);
      throw new Error(`Failed to search registry: ${error.message}`);
    }
  }
}

// Export singleton instance
export const documentRegistryService = new DocumentRegistryService();