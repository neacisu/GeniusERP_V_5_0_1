/**
 * Company Query Service
 * 
 * Provides specialized database query operations for company entities
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';
import { SQL, eq, and, or, isNull, sql } from 'drizzle-orm';
import { companies } from '../../../../../shared/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Create a logger for company query operations
const logger = new Logger('CompanyQueryService');

/**
 * Service that handles company query operations
 */
export class CompanyQueryService extends BaseDrizzleService {
  /**
   * Get all companies with optional filtering
   * 
   * @param options Filter options
   * @returns Array of companies
   */
  async getCompanies(options: {
    parentId?: string;
    searchTerm?: string;
    limit?: number;
    type?: string;
    withDeleted?: boolean;
  } = {}): Promise<any[]> {
    const context = 'getCompanies';
    try {
      const { parentId, searchTerm, limit, type, withDeleted = false } = options;
      logger.debug(`[${context}] Getting companies with options: ${JSON.stringify(options)}`);
      
      return await this.query(async (db) => {
        // Build a dynamic query with filters
        const query = db
          .select({
            id: companies.id,
            name: companies.name,
            fiscalCode: companies.fiscalCode,
            registrationNumber: companies.registrationNumber,
            address: companies.address,
            city: companies.city,
            county: companies.county,
            country: companies.country,
            phone: companies.phone,
            email: companies.email,
            bankAccount: companies.bankAccount,
            bankName: companies.bankName,
            vatPayer: companies.vatPayer,
            vatRate: companies.vatRate,
            logoUrl: companies.logoUrl,
            parentId: sql<string>`parent_id`,
            type: sql<string>`type`,
            createdAt: companies.createdAt,
            updatedAt: companies.updatedAt,
            deletedAt: sql<string | null>`deleted_at`
          })
          .from(companies);
        
        // Add filters
        const conditions: SQL<unknown>[] = [];
        
        // Filter by deleted status
        if (!withDeleted) {
          logger.debug(`[${context}] Adding filter for non-deleted companies`);
          conditions.push(sql`deleted_at IS NULL`);
        }
        
        // Filter by parent ID
        if (parentId) {
          logger.debug(`[${context}] Adding filter for parent ID: ${parentId}`);
          conditions.push(sql`parent_id = ${parentId}`);
        }
        
        // Filter by company type
        if (type) {
          logger.debug(`[${context}] Adding filter for company type: ${type}`);
          conditions.push(sql`type = ${type}`);
        }
        
        // Filter by search term
        if (searchTerm) {
          logger.debug(`[${context}] Adding search term filter: ${searchTerm}`);
          const searchCondition = or(
            sql`name ILIKE ${`%${searchTerm}%`}`,
            sql`fiscal_code ILIKE ${`%${searchTerm}%`}`
          );
          if (searchCondition) {
            conditions.push(searchCondition);
          }
        }
        
        // Build query directly to avoid Drizzle type mismatch
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const queryWithWhere = whereClause ? query.where(whereClause) : query;
        
        // Execute query with optional limit
        const result = limit 
          ? await queryWithWhere.limit(limit)
          : await queryWithWhere;
        
        logger.debug(`[${context}] Retrieved ${result.length} companies`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get companies with options: ${JSON.stringify(options)}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve companies: ${errorMessage}`);
    }
  }
  
  /**
   * Get a company by ID
   * 
   * @param companyId Company ID
   * @returns Company object or null if not found
   */
  async getCompanyById(companyId: string): Promise<any | null> {
    const context = 'getCompanyById';
    try {
      logger.debug(`[${context}] Getting company by ID: ${companyId}`);
      
      return await this.query(async (db) => {
        const result = await db
          .select({
            id: companies.id,
            name: companies.name,
            fiscalCode: companies.fiscalCode,
            registrationNumber: companies.registrationNumber,
            address: companies.address,
            city: companies.city,
            county: companies.county,
            country: companies.country,
            phone: companies.phone,
            email: companies.email,
            bankAccount: companies.bankAccount,
            bankName: companies.bankName,
            vatPayer: companies.vatPayer,
            vatRate: companies.vatRate,
            logoUrl: companies.logoUrl,
            parentId: sql<string>`parent_id`,
            type: sql<string>`type`,
            createdAt: companies.createdAt,
            updatedAt: companies.updatedAt,
            deletedAt: sql<string | null>`deleted_at`
          })
          .from(companies)
          .where(
            and(
              sql`id = ${companyId}`,
              sql`deleted_at IS NULL`
            )
          )
          .limit(1);
        
        if (!result || result.length === 0) {
          logger.debug(`[${context}] No company found with ID: ${companyId}`);
          return null;
        }
        
        logger.debug(`[${context}] Retrieved company: ${result[0].name}`);
        return result[0];
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get company by ID: ${companyId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve company: ${errorMessage}`);
    }
  }
  
  /**
   * Search for companies by name or fiscal code
   * 
   * @param searchTerm Search term
   * @param limit Maximum number of results to return
   * @returns Array of matching companies
   */
  async searchCompanies(searchTerm: string, limit: number = 10): Promise<any[]> {
    const context = 'searchCompanies';
    try {
      logger.debug(`[${context}] Searching companies with term: "${searchTerm}" (limit: ${limit})`);
      
      if (!searchTerm || searchTerm.trim() === '') {
        logger.debug(`[${context}] Empty search term, returning empty result`);
        return [];
      }
      
      return await this.query(async (db) => {
        const pattern = `%${searchTerm.trim()}%`;
        
        const result = await db
          .select({
            id: companies.id,
            name: companies.name,
            fiscalCode: companies.fiscalCode,
            registrationNumber: companies.registrationNumber,
            parentId: sql<string>`parent_id`,
            type: sql<string>`type`
          })
          .from(companies)
          .where(
            and(
              sql`deleted_at IS NULL`,
              or(
                sql`name ILIKE ${pattern}`,
                sql`fiscal_code ILIKE ${pattern}`
              )
            )
          )
          .limit(limit);
        
        logger.debug(`[${context}] Found ${result.length} companies matching "${searchTerm}"`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to search companies with term: "${searchTerm}"`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to search companies: ${errorMessage}`);
    }
  }
  
  /**
   * Get franchises, optionally filtering by parent company ID
   * 
   * @param parentId Optional parent company ID
   * @returns Array of franchise companies
   */
  async getFranchises(parentId?: string): Promise<any[]> {
    const context = 'getFranchises';
    try {
      logger.debug(`[${context}] Getting franchises${parentId ? ` for parent company ${parentId}` : ''}`);
      
      return await this.query(async (db) => {
        // Build query with conditions
        const conditions: SQL<unknown>[] = [
          sql`deleted_at IS NULL`,
          sql`type = 'franchise'`
        ];
        
        // Add parent ID condition if provided
        if (parentId) {
          logger.debug(`[${context}] Adding parent ID filter: ${parentId}`);
          conditions.push(sql`parent_id = ${parentId}`);
        }
        
        const result = await db
          .select({
            id: companies.id,
            name: companies.name,
            fiscalCode: companies.fiscalCode,
            parentId: sql<string>`parent_id`,
            type: sql<string>`type`
          })
          .from(companies)
          .where(and(...conditions));
        
        logger.debug(`[${context}] Retrieved ${result.length} franchises`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get franchises${parentId ? ` for parent ${parentId}` : ''}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve franchises: ${errorMessage}`);
    }
  }
}