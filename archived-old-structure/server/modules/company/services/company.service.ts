/**
 * Company Service
 * 
 * This service handles all operations related to company management
 * and provides a centralized interface for working with company data.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { companies, Company, InsertCompany } from '../schema/company.schema';
import { eq, and, isNull } from 'drizzle-orm';
import { Logger } from '../../../common/logger';

// Create a logger for the service
const logger = new Logger('CompanyService');

export class CompanyService {
  /**
   * Constructor for the CompanyService
   * @param drizzleService Injectable DrizzleService instance
   */
  constructor(private readonly drizzleService: DrizzleService) {}

  /**
   * Get all companies
   * Optionally filter by parent company
   * 
   * @param parentId Optional parent company ID to filter by
   * @returns Promise resolving to an array of companies
   */
  async getAllCompanies(parentId?: string): Promise<Company[]> {
    try {
      return await this.drizzleService.transaction(async (tx) => {
        let query = tx.select().from(companies);
        
        if (parentId) {
          query = query.where(eq(companies.parentId, parentId));
        }
        
        // Only return non-deleted companies
        query = query.where(isNull(companies.deletedAt));
        
        return await query;
      });
    } catch (error) {
      logger.error('Failed to get all companies', error);
      throw new Error('Failed to retrieve companies');
    }
  }

  /**
   * Get a company by ID
   * 
   * @param id Company ID
   * @returns Promise resolving to the company or null if not found
   */
  async getCompanyById(id: string): Promise<Company | null> {
    try {
      return await this.drizzleService.transaction(async (tx) => {
        const result = await tx.select()
          .from(companies)
          .where(
            and(
              eq(companies.id, id),
              isNull(companies.deletedAt)
            )
          )
          .limit(1);
        
        return result.length > 0 ? result[0] : null;
      });
    } catch (error) {
      logger.error(`Failed to get company with ID ${id}`, error);
      throw new Error('Failed to retrieve company');
    }
  }

  /**
   * Create a new company
   * 
   * @param data Company data to insert
   * @param createdBy User ID of the creator
   * @returns Promise resolving to the created company
   */
  async createCompany(data: InsertCompany, createdBy: string): Promise<Company> {
    try {
      return await this.drizzleService.transaction(async (tx) => {
        const companyData = {
          ...data,
          createdBy,
          updatedBy: createdBy
        };
        
        const [createdCompany] = await tx.insert(companies)
          .values(companyData)
          .returning();
        
        return createdCompany;
      });
    } catch (error) {
      logger.error('Failed to create company', error);
      throw new Error('Failed to create company');
    }
  }

  /**
   * Update an existing company
   * 
   * @param id Company ID to update
   * @param data Company data to update
   * @param updatedBy User ID of the updater
   * @returns Promise resolving to the updated company
   */
  async updateCompany(id: string, data: Partial<InsertCompany>, updatedBy: string): Promise<Company | null> {
    try {
      return await this.drizzleService.transaction(async (tx) => {
        // First check if the company exists
        const existingCompany = await tx.select()
          .from(companies)
          .where(
            and(
              eq(companies.id, id),
              isNull(companies.deletedAt)
            )
          )
          .limit(1);
        
        if (existingCompany.length === 0) {
          return null;
        }
        
        // Update the company
        const companyData = {
          ...data,
          updatedBy,
          updatedAt: new Date().toISOString()
        };
        
        const [updatedCompany] = await tx.update(companies)
          .set(companyData)
          .where(eq(companies.id, id))
          .returning();
        
        return updatedCompany;
      });
    } catch (error) {
      logger.error(`Failed to update company with ID ${id}`, error);
      throw new Error('Failed to update company');
    }
  }

  /**
   * Soft delete a company
   * 
   * @param id Company ID to delete
   * @param deletedBy User ID of the person performing the deletion
   * @returns Promise resolving to true if successful, false if company not found
   */
  async deleteCompany(id: string, deletedBy: string): Promise<boolean> {
    try {
      return await this.drizzleService.transaction(async (tx) => {
        // First check if the company exists
        const existingCompany = await tx.select()
          .from(companies)
          .where(
            and(
              eq(companies.id, id),
              isNull(companies.deletedAt)
            )
          )
          .limit(1);
        
        if (existingCompany.length === 0) {
          return false;
        }
        
        // Soft delete the company
        const [deletedCompany] = await tx.update(companies)
          .set({
            deletedAt: new Date().toISOString(),
            updatedBy: deletedBy,
            updatedAt: new Date().toISOString()
          })
          .where(eq(companies.id, id))
          .returning();
        
        return !!deletedCompany;
      });
    } catch (error) {
      logger.error(`Failed to delete company with ID ${id}`, error);
      throw new Error('Failed to delete company');
    }
  }

  /**
   * Search for companies by name or fiscal code
   * 
   * @param searchTerm Search term to look for
   * @param limit Maximum number of results to return
   * @returns Promise resolving to matching companies
   */
  async searchCompanies(searchTerm: string, limit: number = 10): Promise<Company[]> {
    try {
      return await this.drizzleService.transaction(async (tx) => {
        const result = await tx.select()
          .from(companies)
          .where(
            and(
              isNull(companies.deletedAt),
              tx.sql`(${companies.name} ILIKE ${'%' + searchTerm + '%'} OR
                     ${companies.fiscalCode} ILIKE ${'%' + searchTerm + '%'})`
            )
          )
          .limit(limit);
        
        return result;
      });
    } catch (error) {
      logger.error(`Failed to search companies with term "${searchTerm}"`, error);
      throw new Error('Failed to search companies');
    }
  }

  /**
   * Get companies with subsidiaries/child companies
   * Returns parent companies with an array of their subsidiaries
   * 
   * @returns Promise resolving to an array of company trees
   */
  async getCompanyHierarchy(): Promise<Array<Company & { subsidiaries: Company[] }>> {
    try {
      return await this.drizzleService.transaction(async (tx) => {
        // First get all parent companies (headquarters)
        const parentCompanies = await tx.select()
          .from(companies)
          .where(
            and(
              isNull(companies.parentId),
              isNull(companies.deletedAt)
            )
          );
        
        // For each parent, get its subsidiaries
        const result = await Promise.all(parentCompanies.map(async (parent: Company) => {
          const subsidiaries = await tx.select()
            .from(companies)
            .where(
              and(
                eq(companies.parentId, parent.id),
                isNull(companies.deletedAt)
              )
            );
          
          return {
            ...parent,
            subsidiaries
          };
        }));
        
        return result;
      });
    } catch (error) {
      logger.error('Failed to get company hierarchy', error);
      throw new Error('Failed to retrieve company hierarchy');
    }
  }
  
  /**
   * Get franchises
   * Retrieves all franchises, optionally filtered by parent company ID
   * 
   * @param companyId Optional parent company ID to filter franchises by
   * @returns Promise resolving to an array of franchise companies
   */
  async getFranchises(companyId?: string): Promise<Company[]> {
    try {
      logger.debug(`Getting franchises with filter:`, companyId || 'all');
      
      // Utilizăm serviciul Drizzle modular dedicat pentru companii
      const result = await this.drizzleService.company.getFranchises(companyId);
      return result as unknown as Company[];
    } catch (error) {
      logger.error('Failed to get franchises', error);
      throw new Error('Failed to retrieve franchises');
    }
  }
}