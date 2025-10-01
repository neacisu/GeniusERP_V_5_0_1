import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../../common/middleware/auth-types';

/**
 * BaseController
 * 
 * Provides common functionality for all accounting controllers
 * Handles error management, request processing, and data extraction
 */
export class BaseController {
  /**
   * Handle API request with standardized error handling
   */
  protected async handleRequest(
    req: AuthenticatedRequest, 
    res: Response, 
    handler: () => Promise<any>
  ): Promise<void> {
    try {
      const result = await handler();
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Controller error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal server error';
      
      res.status(statusCode).json({
        error: true,
        message: message,
        details: error.details || null
      });
    }
  }
  
  /**
   * Extract company ID from request
   */
  protected getCompanyId(req: AuthenticatedRequest): string {
    if (!req.user || !req.user.companyId) {
      throw { 
        statusCode: 401, 
        message: 'User is not associated with a company' 
      };
    }
    return req.user.companyId;
  }
  
  /**
   * Extract user ID from request
   */
  protected getUserId(req: AuthenticatedRequest): string {
    if (!req.user || !req.user.id) {
      throw { 
        statusCode: 401, 
        message: 'User ID not found in request' 
      };
    }
    return req.user.id;
  }
  
  /**
   * Extract franchise ID from request (if available)
   */
  protected getFranchiseId(req: AuthenticatedRequest): string | null {
    if (!req.user) {
      throw { 
        statusCode: 401, 
        message: 'User not authenticated' 
      };
    }
    
    // Franchise ID might be attached to the user object by middleware
    return (req.user as any).franchiseId || null;
  }
  
  /**
   * Get pagination parameters with defaults
   */
  protected getPaginationParams(req: AuthenticatedRequest): { page: number, limit: number } {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    return {
      page: Math.max(1, page), // Ensure page is at least 1
      limit: Math.min(Math.max(1, limit), 100) // Limit between 1 and 100
    };
  }
  
  /**
   * Parse date parameter safely
   */
  protected parseDate(dateStr: string | undefined): Date | undefined {
    if (!dateStr) return undefined;
    
    try {
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return undefined;
      }
      
      return date;
    } catch (error) {
      return undefined;
    }
  }
}