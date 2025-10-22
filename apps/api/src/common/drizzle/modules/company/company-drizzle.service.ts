/**
 * Company Drizzle Service
 * 
 * Facade service that provides unified access to company-related database operations
 * by delegating to specialized services for query, mutation, and hierarchy operations.
 */

import { Logger } from '../../../logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';
import { Company } from '../../../../../shared/schema';
import { CompanyQueryService } from './company-query.service';
import { CompanyMutationService } from './company-mutation.service';
import { CompanyHierarchyService } from './company-hierarchy.service';

// Create a logger for the company facade service
const logger = new Logger('CompanyDrizzleService');

/**
 * Facade service that aggregates specialized company-related database services
 */
export class CompanyDrizzleService extends BaseDrizzleService {
  private companyQueryService: CompanyQueryService;
  private companyMutationService: CompanyMutationService;
  private companyHierarchyService: CompanyHierarchyService;
  
  constructor() {
    super();
    this.companyQueryService = new CompanyQueryService();
    this.companyMutationService = new CompanyMutationService();
    this.companyHierarchyService = new CompanyHierarchyService();
    
    logger.info('CompanyDrizzleService initialized with all specialized services');
  }
  
  /**
   * Fetch companies from the database
   * 
   * @param options Query options for filtering companies
   * @returns Array of companies
   */
  async getCompanies(options: {
    parentId?: string;
    searchTerm?: string;
    limit?: number;
    type?: string;
    withDeleted?: boolean;
  } = {}): Promise<Company[]> {
    const context = 'getCompanies';
    try {
      logger.debug(`[${context}] Delegating to CompanyQueryService`);
      return await this.companyQueryService.getCompanies(options);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get company by ID
   * 
   * @param companyId Company ID
   * @returns Company or null if not found
   */
  async getCompanyById(companyId: string): Promise<Company | null> {
    const context = 'getCompanyById';
    try {
      logger.debug(`[${context}] Delegating to CompanyQueryService`);
      return await this.companyQueryService.getCompanyById(companyId);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get franchises, optionally filtering by parent company ID
   * 
   * @param parentId Optional parent company ID
   * @returns Array of franchise companies
   */
  async getFranchises(parentId?: string): Promise<Company[]> {
    const context = 'getFranchises';
    try {
      logger.debug(`[${context}] Delegating to CompanyQueryService`);
      return await this.companyQueryService.getFranchises(parentId);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Create a new company
   * 
   * @param data Company data to insert
   * @param createdBy User ID of the creator
   * @returns Created company
   */
  async createCompany(data: any, createdBy: string): Promise<Company> {
    const context = 'createCompany';
    try {
      logger.debug(`[${context}] Delegating to CompanyMutationService`);
      return await this.companyMutationService.createCompany(data, createdBy);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Update an existing company
   * 
   * @param companyId Company ID to update
   * @param data Company data to update
   * @param updatedBy User ID of the updater
   * @returns Updated company or null if not found
   */
  async updateCompany(companyId: string, data: Partial<any>, updatedBy: string): Promise<Company | null> {
    const context = 'updateCompany';
    try {
      logger.debug(`[${context}] Delegating to CompanyMutationService`);
      return await this.companyMutationService.updateCompany(companyId, data, updatedBy);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Soft delete a company
   * 
   * @param companyId Company ID to delete
   * @param deletedBy User ID of the person performing the deletion
   * @returns True if successful, false if company not found
   */
  async deleteCompany(companyId: string, deletedBy: string): Promise<boolean> {
    const context = 'deleteCompany';
    try {
      logger.debug(`[${context}] Delegating to CompanyMutationService`);
      return await this.companyMutationService.deleteCompany(companyId, deletedBy);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get companies with their subsidiaries
   * 
   * @returns Array of companies with subsidiaries
   */
  async getCompanyHierarchy(): Promise<Array<Company & { subsidiaries: Company[] }>> {
    const context = 'getCompanyHierarchy';
    try {
      logger.debug(`[${context}] Delegating to CompanyHierarchyService`);
      return await this.companyHierarchyService.getCompanyHierarchy();
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Search for companies by name or fiscal code
   * 
   * @param searchTerm Search term to look for
   * @param limit Maximum number of results
   * @returns Matching companies
   */
  async searchCompanies(searchTerm: string, limit: number = 10): Promise<Company[]> {
    const context = 'searchCompanies';
    try {
      logger.debug(`[${context}] Delegating to CompanyQueryService`);
      return await this.companyQueryService.searchCompanies(searchTerm, limit);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
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
      logger.debug(`[${context}] Delegating to CompanyHierarchyService`);
      return await this.companyHierarchyService.updateCompanyParent(childId, parentId, updatedBy);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
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
      logger.debug(`[${context}] Delegating to CompanyHierarchyService`);
      return await this.companyHierarchyService.getChildCompanies(parentId);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Check if a company has children
   * 
   * @param companyId Company ID
   * @returns Boolean indicating if the company has children
   */
  async hasChildren(companyId: string): Promise<boolean> {
    const context = 'hasChildren';
    try {
      logger.debug(`[${context}] Delegating to CompanyHierarchyService`);
      return await this.companyHierarchyService.hasChildren(companyId);
    } catch (error) {
      logger.error(`[${context}] Error in CompanyDrizzleService wrapper`, error);
      throw error;
    }
  }
}