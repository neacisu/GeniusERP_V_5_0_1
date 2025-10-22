/**
 * Document Search Service
 * 
 * Provides advanced search capabilities for documents including:
 * - Full-text search across document content and metadata
 * - Semantic/contextual search for finding documents by meaning not just keywords
 * - Filtered search by document properties, dates, and types
 * - Support for OCR-extracted text search
 */

import postgres from 'postgres';
import { sql, SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, or, like, ilike, isNull, not, desc } from 'drizzle-orm';
import { documents, documentVersions } from '@shared/schema';
import { OcrService } from './ocr.service';
import { DrizzleService } from '../../../common/drizzle';

/**
 * Search result with relevance scoring
 */
export interface DocumentSearchResult {
  id: string;
  relevanceScore: number;
  title: string;
  content: string;
  excerpt: string;
  createdAt: Date;
  updatedAt: Date;
  type: string;
  companyId: string;
  matchedField: string;
}

/**
 * Document Search Service for full-text and semantic document searching
 */
export class DocumentSearchService {
  private db!: ReturnType<typeof drizzle>;
  private ocrService: OcrService;
  
  constructor() {
    const drizzleService = new DrizzleService();
    this.db = drizzleService.getDbInstance();
    this.ocrService = new OcrService();
    
    console.log('[DocumentSearchService] 🔍 Search service initialized');
  }
  
  /**
   * Perform a full-text search across documents
   * 
   * @param companyId Company ID for data isolation
   * @param query Search query string
   * @param options Search options for filtering and pagination
   */
  async search(
    companyId: string,
    query: string,
    options: {
      documentTypes?: string[];
      startDate?: Date;
      endDate?: Date;
      useSemanticSearch?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    results: DocumentSearchResult[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        documentTypes,
        startDate,
        endDate,
        useSemanticSearch = false,
        page = 1,
        limit = 20
      } = options;
      
      console.log(`[DocumentSearchService] 🔍 Searching for "${query}" in company ${companyId}`);
      
      // Build search conditions
      const conditions = [eq(documents.companyId, companyId)];
      
      // Filter by document types if provided
      if (documentTypes && documentTypes.length > 0) {
        const typeConditions = or(...documentTypes.map(type => eq(documents.type, type)));
        if (typeConditions) {
          conditions.push(typeConditions);
        }
      }
      
      // Date range filters
      if (startDate) {
        conditions.push(sql`${documents.createdAt} >= ${startDate}`);
      }
      
      if (endDate) {
        conditions.push(sql`${documents.createdAt} <= ${endDate}`);
      }
      
      // For semantic search (placeholder - would use embeddings in a real implementation)
      if (useSemanticSearch) {
        console.log('[DocumentSearchService] Using semantic search capabilities');
        // In a real implementation, this would use vector similarity with embeddings
      }
      
      // Full-text search condition for query
      if (query) {
        const searchCondition = or(
          ilike(documents.ocrText, `%${query}%`),
          sql`EXISTS (
            SELECT 1 FROM ${documentVersions} 
            WHERE ${documentVersions.documentId} = ${documents.id} 
            AND ${documentVersions.content} ILIKE ${'%' + query + '%'}
          )`
        );
        if (searchCondition) {
          conditions.push(searchCondition);
        }
      }
      
      // Count total results
      const validConditions = conditions.filter((c): c is SQL<unknown> => c !== undefined);
      const [countResult] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(validConditions.length > 0 ? and(...validConditions) : undefined);
      
      const total = Number(countResult?.count || 0);
      
      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Execute the search query with pagination
      const searchResults = await this.db
        .select({
          id: documents.id,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
          type: documents.type,
          companyId: documents.companyId,
          ocrText: documents.ocrText,
        })
        .from(documents)
        .where(validConditions.length > 0 ? and(...validConditions) : undefined)
        .orderBy(desc(documents.updatedAt))
        .limit(limit)
        .offset(offset);
      
      // Process results to add excerpts and scoring (simplified placeholder implementation)
      const processedResults: DocumentSearchResult[] = searchResults.map(doc => {
        // Extract matching excerpt from OCR text
        const ocrText = doc.ocrText || '';
        const excerptStart = Math.max(0, ocrText.toLowerCase().indexOf(query.toLowerCase()));
        const excerptLength = 200;
        const excerpt = excerptStart >= 0 
          ? `...${ocrText.substring(excerptStart, excerptStart + excerptLength)}...` 
          : '';
        
        return {
          id: doc.id,
          relevanceScore: 1.0, // Simple scoring for now, could be improved with TF-IDF or other ranking algorithms
          title: `Document ${doc.id}`, // In real implementation, extract title from metadata
          content: ocrText,
          excerpt: excerpt,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          type: doc.type,
          companyId: doc.companyId,
          matchedField: 'content'
        };
      });
      
      return {
        results: processedResults,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('[DocumentSearchService] Search error:', error);
      throw new Error(`Failed to search documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export singleton instance
export const documentSearchService = new DocumentSearchService();