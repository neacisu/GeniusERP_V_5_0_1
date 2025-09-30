/**
 * Company Mutation Service
 * 
 * Provides specialized database mutation operations for company entities
 * with comprehensive error handling and logging.
 */

import { Logger } from '../../../logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';
import { SQL, sql } from 'drizzle-orm';
import { companies } from '../../../../../shared/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { CompanyQueryService } from './company-query.service';

// Create a logger for company mutation operations
const logger = new Logger('CompanyMutationService');

/**
 * Service that handles company mutation operations (create, update, delete)
 */
export class CompanyMutationService extends BaseDrizzleService {
  private companyQueryService: CompanyQueryService;
  
  constructor() {
    super();
    this.companyQueryService = new CompanyQueryService();
  }
  
  /**
   * Create a new company
   * 
   * @param data Company data to insert
   * @param createdBy User ID of the creator
   * @returns Created company object
   */
  async createCompany(data: any, createdBy: string): Promise<any> {
    const context = 'createCompany';
    try {
      logger.debug(`[${context}] Creating company with data:`, {...data, createdBy});
      
      // Check if required fields are present
      if (!data.name || !data.fiscalCode) {
        const errorMessage = 'Name and fiscal code are required for creating a company';
        logger.error(`[${context}] ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      return await this.transaction(async (tx) => {
        // Build the insert query with prepared values
        const result = await tx
          .insert(companies)
          .values({
            name: data.name,
            fiscalCode: data.fiscalCode,
            registrationNumber: data.registrationNumber || '',
            address: data.address || '',
            city: data.city || '',
            county: data.county || '',
            country: data.country || 'Romania',
            phone: data.phone,
            email: data.email,
            bankAccount: data.bankAccount,
            bankName: data.bankName,
            vatPayer: data.vatPayer !== undefined ? data.vatPayer : true,
            vatRate: data.vatRate || 19,
            logoUrl: data.logoUrl,
            createdAt: new Date()
          })
          .returning();
        
        // Handle additional fields via raw SQL since they don't exist in the static schema
        // but do exist in the actual database
        if (result.length > 0) {
          const companyId = result[0].id;
          
          const additionalFields = {
            type: data.type || 'company',
            parent_id: data.parentId || null,
            created_by: createdBy
          };
          
          const fieldsToUpdate = Object.entries(additionalFields)
            .map(([key, value]) => `${key} = ${value === null ? 'NULL' : `'${value}'`}`)
            .join(', ');
          
          await tx.execute(sql`
            UPDATE companies 
            SET ${sql.raw(fieldsToUpdate)} 
            WHERE id = ${companyId}
          `);
          
          logger.info(`[${context}] Company created successfully: ${data.name} (${companyId})`);
          
          // Get the complete company record with all fields
          const createdCompany = await this.companyQueryService.getCompanyById(companyId);
          return createdCompany;
        } else {
          throw new Error('Failed to create company, no result returned');
        }
      }, context);
    } catch (error) {
      logger.error(`[${context}] Failed to create company`, error);
      logger.error(`[${context}] Company data: ${JSON.stringify(data)}`);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      throw new Error(`Failed to create company: ${error.message}`);
    }
  }
  
  /**
   * Update an existing company
   * 
   * @param companyId Company ID to update
   * @param data Updated company data
   * @param updatedBy User ID of the updater
   * @returns Updated company or null if not found
   */
  async updateCompany(companyId: string, data: any, updatedBy: string): Promise<any | null> {
    const context = 'updateCompany';
    try {
      logger.debug(`[${context}] Updating company ${companyId} with data:`, {...data, updatedBy});
      
      // First check if company exists
      const existingCompany = await this.companyQueryService.getCompanyById(companyId);
      
      if (!existingCompany) {
        logger.warn(`[${context}] Company not found with ID: ${companyId}`);
        return null;
      }
      
      return await this.transaction(async (tx) => {
        // Build a dynamic UPDATE operation
        const updates: Record<string, any> = {
          updatedAt: new Date()
        };
        
        // Add standard fields if they are provided
        if (data.name !== undefined) updates.name = data.name;
        if (data.fiscalCode !== undefined) updates.fiscalCode = data.fiscalCode;
        if (data.registrationNumber !== undefined) updates.registrationNumber = data.registrationNumber;
        if (data.address !== undefined) updates.address = data.address;
        if (data.city !== undefined) updates.city = data.city;
        if (data.county !== undefined) updates.county = data.county;
        if (data.country !== undefined) updates.country = data.country;
        if (data.phone !== undefined) updates.phone = data.phone;
        if (data.email !== undefined) updates.email = data.email;
        if (data.bankAccount !== undefined) updates.bankAccount = data.bankAccount;
        if (data.bankName !== undefined) updates.bankName = data.bankName;
        if (data.vatPayer !== undefined) updates.vatPayer = data.vatPayer;
        if (data.vatRate !== undefined) updates.vatRate = data.vatRate;
        if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
        
        // Update standard fields first
        if (Object.keys(updates).length > 1) { // More than just updatedAt
          await tx
            .update(companies)
            .set(updates)
            .where(sql`id = ${companyId} AND deleted_at IS NULL`);
        }
        
        // Update custom fields through raw SQL
        const customUpdates: Record<string, any> = {};
        
        if (data.type !== undefined) customUpdates.type = data.type;
        if (data.parentId !== undefined) customUpdates.parent_id = data.parentId;
        
        // Always set updated_by
        customUpdates.updated_by = updatedBy;
        
        if (Object.keys(customUpdates).length > 0) {
          const fieldsToUpdate = Object.entries(customUpdates)
            .map(([key, value]) => `${key} = ${value === null ? 'NULL' : `'${value}'`}`)
            .join(', ');
          
          await tx.execute(sql`
            UPDATE companies 
            SET ${sql.raw(fieldsToUpdate)} 
            WHERE id = ${companyId} AND deleted_at IS NULL
          `);
        }
        
        logger.info(`[${context}] Company updated successfully: ${companyId}`);
        
        // Get the updated company
        const updatedCompany = await this.companyQueryService.getCompanyById(companyId);
        return updatedCompany;
      }, context);
    } catch (error) {
      logger.error(`[${context}] Failed to update company ${companyId}`, error);
      logger.error(`[${context}] Update data: ${JSON.stringify(data)}`);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      throw new Error(`Failed to update company: ${error.message}`);
    }
  }
  
  /**
   * Soft delete a company
   * 
   * @param companyId Company ID to delete
   * @param deletedBy User ID performing the deletion
   * @returns True if successful, false if company not found
   */
  async deleteCompany(companyId: string, deletedBy: string): Promise<boolean> {
    const context = 'deleteCompany';
    try {
      logger.debug(`[${context}] Soft deleting company ${companyId} by user ${deletedBy}`);
      
      // First check if company exists and is not already deleted
      const existingCompany = await this.companyQueryService.getCompanyById(companyId);
      
      if (!existingCompany) {
        logger.warn(`[${context}] Company not found with ID: ${companyId}`);
        return false;
      }
      
      return await this.transaction(async (tx) => {
        // Using raw SQL because custom fields aren't in the static schema
        await tx.execute(sql`
          UPDATE companies
          SET 
            deleted_at = NOW(),
            deleted_by = ${deletedBy},
            updated_at = NOW()
          WHERE id = ${companyId} AND deleted_at IS NULL
        `);
        
        logger.info(`[${context}] Company ${companyId} soft deleted successfully`);
        return true;
      }, context);
    } catch (error) {
      logger.error(`[${context}] Failed to delete company ${companyId}`, error);
      logger.error(`[${context}] Error details: ${error.message}`);
      logger.error(`[${context}] Stack trace: ${error.stack}`);
      throw new Error(`Failed to delete company: ${error.message}`);
    }
  }
}