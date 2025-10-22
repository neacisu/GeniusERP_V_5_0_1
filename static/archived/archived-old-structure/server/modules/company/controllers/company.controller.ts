/**
 * Company Controller
 * 
 * This controller handles HTTP requests related to company management
 * and delegates business logic to the CompanyService.
 */

import { Response } from 'express';
import { CompanyService } from '../services/company.service';
import { Logger } from '../../../common/logger';
import { insertCompanySchema } from '../schema/company.schema';
import { z } from 'zod';
import { JwtUserData, AuthenticatedRequest } from '../../auth/types';

// Create a logger for the controller
const logger = new Logger('CompanyController');

export class CompanyController {
  /**
   * Constructor for the CompanyController
   * @param companyService Injected CompanyService instance
   */
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Get all companies
   * 
   * @param req Express request with authenticated user
   * @param res Express response
   */
  async getAllCompanies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const parentId = req.query.parentId as string | undefined;
      const companies = await this.companyService.getAllCompanies(parentId);
      
      res.status(200).json({
        success: true,
        data: companies
      });
    } catch (error) {
      logger.error('Failed to get all companies', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve companies'
      });
    }
  }

  /**
   * Get company by ID
   * 
   * @param req Express request with authenticated user
   * @param res Express response
   */
  async getCompanyById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }
      
      const company = await this.companyService.getCompanyById(id);
      
      if (!company) {
        res.status(404).json({
          success: false,
          message: 'Company not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: company
      });
    } catch (error) {
      logger.error(`Failed to get company with ID ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve company'
      });
    }
  }

  /**
   * Create a new company
   * 
   * @param req Express request with authenticated user
   * @param res Express response
   */
  async createCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate input using Zod schema
      const validationResult = insertCompanySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid company data',
          errors: validationResult.error.format()
        });
        return;
      }
      
      // Get user from request (set by AuthGuard)
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }
      
      const company = await this.companyService.createCompany(
        validationResult.data,
        userId
      );
      
      res.status(201).json({
        success: true,
        data: company
      });
    } catch (error) {
      logger.error('Failed to create company', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create company'
      });
    }
  }

  /**
   * Update an existing company
   * 
   * @param req Express request with authenticated user
   * @param res Express response
   */
  async updateCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }
      
      // Validate input
      const validationSchema = insertCompanySchema.partial();
      const validationResult = validationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid company data',
          errors: validationResult.error.format()
        });
        return;
      }
      
      // Get user from request (set by AuthGuard)
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }
      
      const updatedCompany = await this.companyService.updateCompany(
        id,
        validationResult.data,
        userId
      );
      
      if (!updatedCompany) {
        res.status(404).json({
          success: false,
          message: 'Company not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: updatedCompany
      });
    } catch (error) {
      logger.error(`Failed to update company with ID ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to update company'
      });
    }
  }

  /**
   * Delete a company
   * 
   * @param req Express request with authenticated user
   * @param res Express response
   */
  async deleteCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Company ID is required'
        });
        return;
      }
      
      // Get user from request (set by AuthGuard)
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }
      
      const success = await this.companyService.deleteCompany(id, userId);
      
      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Company not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Company deleted successfully'
      });
    } catch (error) {
      logger.error(`Failed to delete company with ID ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete company'
      });
    }
  }

  /**
   * Search companies
   * 
   * @param req Express request with authenticated user
   * @param res Express response
   */
  async searchCompanies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const searchTerm = req.query.term as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
        return;
      }
      
      const companies = await this.companyService.searchCompanies(searchTerm, limit);
      
      res.status(200).json({
        success: true,
        data: companies
      });
    } catch (error) {
      logger.error(`Failed to search companies with term "${req.query.term}"`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to search companies'
      });
    }
  }

  /**
   * Get company hierarchy
   * 
   * @param req Express request with authenticated user
   * @param res Express response
   */
  async getCompanyHierarchy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const hierarchy = await this.companyService.getCompanyHierarchy();
      
      res.status(200).json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      logger.error('Failed to get company hierarchy', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve company hierarchy'
      });
    }
  }
  
  /**
   * Get franchises
   * Retrieves all franchises, optionally filtered by parent company ID
   * 
   * @param req Express request with authenticated user
   * @param res Express response
   */
  async getFranchises(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log(`[CompanyController] Getting franchises, auth user:`, req.user);
      console.log(`[CompanyController] Query params:`, req.query);
      
      const companyId = req.query.companyId as string | undefined;
      const franchises = await this.companyService.getFranchises(companyId);
      
      console.log(`[CompanyController] Found ${franchises?.length || 0} franchises`);
      
      res.status(200).json({
        success: true,
        data: franchises
      });
    } catch (error) {
      logger.error('Failed to get franchises', error);
      console.error(`[CompanyController] Error getting franchises:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve franchises',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

/**
 * Create an instance of the CompanyController with the provided CompanyService
 * 
 * @param companyService CompanyService instance
 * @returns Initialized CompanyController
 */
export function createCompanyController(companyService: CompanyService): CompanyController {
  return new CompanyController(companyService);
}