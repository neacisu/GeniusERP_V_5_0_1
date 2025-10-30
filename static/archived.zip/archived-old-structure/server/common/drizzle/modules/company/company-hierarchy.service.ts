/**
 * Company Hierarchy Service
 * 
 * Provides specialized database operations for company hierarchy relationships
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';
import { SQL, sql, isNull, or, and } from 'drizzle-orm';
import { companies } from '../../../../../shared/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Create a logger for company hierarchy operations
const logger = new Logger('CompanyHierarchyService');

/**
 * Service that handles company hierarchy operations
 */
export class CompanyHierarchyService extends BaseDrizzleService {
  /**
   * Get the full company hierarchy
   * 
   * @returns Hierarchical structure of companies
   */
  async getCompanyHierarchy(): Promise<Array<any & { subsidiaries: any[] }>> {
    const context = 'getCompanyHierarchy';
    try {
      logger.debug(`[${context}] Getting complete company hierarchy`);
      
      return await this.query(async (db) => {
        // First get all parent companies (those without a parent_id)
        logger.debug(`[${context}] Retrieving parent companies`);
        const parentCompanies = await db
          .select({
            id: companies.id,
            name: companies.name,
            fiscalCode: companies.fiscalCode,
            parentId: sql<string>`parent_id`,
            type: sql<string>`type`,
            createdAt: companies.createdAt,
            updatedAt: companies.updatedAt
          })
          .from(companies)
          .where(
            and(
              sql`deleted_at IS NULL`,
              or(
                sql`parent_id IS NULL`,
                sql`parent_id = ''`
              )
            )
          );
        
        logger.debug(`[${context}] Found ${parentCompanies.length} parent companies`);
        
        if (!parentCompanies || parentCompanies.length === 0) {
          return [];
        }
        
        // For each parent company, get its subsidiaries
        logger.debug(`[${context}] Retrieving subsidiaries for each parent company`);
        const result = await Promise.all(parentCompanies.map(async (parent: any) => {
          try {
            const subsidiaries = await db
              .select({
                id: companies.id,
                name: companies.name,
                fiscalCode: companies.fiscalCode,
                parentId: sql<string>`parent_id`,
                type: sql<string>`type`,
                createdAt: companies.createdAt,
                updatedAt: companies.updatedAt
              })
              .from(companies)
              .where(
                and(
                  sql`deleted_at IS NULL`,
                  sql`parent_id = ${parent.id}`
                )
              );
            
            logger.debug(`[${context}] Found ${subsidiaries.length} subsidiaries for parent company ${parent.id}`);
            
            return {
              ...parent,
              subsidiaries: subsidiaries || []
            };
          } catch (subError) {
            logger.error(`[${context}] Error retrieving subsidiaries for parent ${parent.id}:`, subError);
            // Return parent with empty subsidiaries to avoid breaking the entire hierarchy
            return {
              ...parent,
              subsidiaries: []
            };
          }
        }));
        
        logger.info(`[${context}] Retrieved complete company hierarchy with ${result.length} parent companies`);
        return result;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get company hierarchy`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve company hierarchy: ${errorMessage}`);
    }
  }
  
  /**
   * Get child companies for a specific parent
   * 
   * @param parentId Parent company ID
   * @returns Array of child companies
   */
  async getChildCompanies(parentId: string): Promise<any[]> {
    const context = 'getChildCompanies';
    try {
      logger.debug(`[${context}] Getting child companies for parent: ${parentId}`);
      
      if (!parentId) {
        const errorMessage = 'Parent ID is required';
        logger.error(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      return await this.query(async (db) => {
        const children = await db
          .select({
            id: companies.id,
            name: companies.name,
            fiscalCode: companies.fiscalCode,
            registrationNumber: companies.registrationNumber,
            parentId: sql<string>`parent_id`,
            type: sql<string>`type`,
            createdAt: companies.createdAt,
            updatedAt: companies.updatedAt
          })
          .from(companies)
          .where(
            and(
              sql`deleted_at IS NULL`,
              sql`parent_id = ${parentId}`
            )
          );
        
        logger.debug(`[${context}] Found ${children.length} child companies for parent ${parentId}`);
        return children;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to get child companies for parent ${parentId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to retrieve child companies: ${errorMessage}`);
    }
  }
  
  /**
   * Check if a company has children
   * 
   * @param companyId Company ID to check
   * @returns Boolean indicating if the company has children
   */
  async hasChildren(companyId: string): Promise<boolean> {
    const context = 'hasChildren';
    try {
      logger.debug(`[${context}] Checking if company ${companyId} has children`);
      
      return await this.query(async (db) => {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(companies)
          .where(
            and(
              sql`deleted_at IS NULL`,
              sql`parent_id = ${companyId}`
            )
          );
        
        const hasChildren = result[0].count > 0;
        logger.debug(`[${context}] Company ${companyId} ${hasChildren ? 'has' : 'does not have'} children`);
        return hasChildren;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to check if company ${companyId} has children`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      // Default to false on error for safety
      return false;
    }
  }
  
  /**
   * Update parent-child relationship between companies
   * 
   * @param childId Child company ID
   * @param parentId Parent company ID (null to remove relationship)
   * @param updatedBy User ID making the change
   * @returns Boolean indicating success
   */
  async updateCompanyParent(childId: string, parentId: string | null, updatedBy: string): Promise<boolean> {
    const context = 'updateCompanyParent';
    try {
      logger.debug(`[${context}] Updating parent of company ${childId} to ${parentId || 'NULL'}`);
      
      if (!childId) {
        const errorMessage = 'Child company ID is required';
        logger.error(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Prevent circular references
      if (parentId && parentId === childId) {
        const errorMessage = 'Cannot set a company as its own parent';
        logger.error(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      return await this.transaction(async (tx) => {
        // Check if child company exists
        const childExists = await tx
          .select({ id: companies.id })
          .from(companies)
          .where(
            and(
              sql`id = ${childId}`,
              sql`deleted_at IS NULL`
            )
          );
        
        if (!childExists || childExists.length === 0) {
          logger.error(`[${context}] Child company ${childId} not found`);
          return false;
        }
        
        // Check if parent company exists if specified
        if (parentId) {
          const parentExists = await tx
            .select({ id: companies.id })
            .from(companies)
            .where(
              and(
                sql`id = ${parentId}`,
                sql`deleted_at IS NULL`
              )
            );
          
          if (!parentExists || parentExists.length === 0) {
            logger.error(`[${context}] Parent company ${parentId} not found`);
            return false;
          }
        }
        
        // Update the parent_id
        await tx.execute(sql`
          UPDATE companies
          SET 
            parent_id = ${parentId === null ? sql`NULL` : sql`${parentId}`},
            updated_at = NOW(),
            updated_by = ${updatedBy}
          WHERE id = ${childId} AND deleted_at IS NULL
        `);
        
        logger.info(`[${context}] Updated parent of company ${childId} to ${parentId || 'NULL'}`);
        return true;
      }, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error(`[${context}] Failed to update parent of company ${childId}`, error);
      logger.error(`[${context}] Error details: ${errorMessage}`);
      if (errorStack) {
        logger.error(`[${context}] Stack trace: ${errorStack}`);
      }
      throw new Error(`Failed to update company parent: ${errorMessage}`);
    }
  }
}