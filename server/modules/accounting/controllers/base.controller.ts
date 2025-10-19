import { Response } from 'express';
import { AuthenticatedRequest } from '../../../types/express';
import { captureException, addBreadcrumb } from '../../../common/sentry';
import { createModuleLogger } from '../../../common/logger/loki-logger';

const logger = createModuleLogger('BaseController');

interface ErrorWithStatus extends Error {
  statusCode?: number;
  details?: unknown;
}

/**
 * BaseController
 * 
 * Provides common functionality for all accounting controllers
 * Handles error management, request processing, and data extraction
 * Integrates Sentry error tracking and breadcrumbs
 */
export class BaseController {
  /**
   * Handle API request with standardized error handling
   */
  protected async handleRequest<T>(
    req: AuthenticatedRequest, 
    res: Response, 
    handler: () => Promise<T>,
    context?: {
      module?: string;
      operation?: string;
    }
  ): Promise<void> {
    try {
      // Add breadcrumb for tracking request flow
      addBreadcrumb(
        `Request: ${req.method} ${req.path}`,
        context?.module || 'accounting',
        {
          method: req.method,
          path: req.path,
          operation: context?.operation,
        }
      );

      const result = await handler();
      res.status(200).json(result);
    } catch (error) {
      const err = error as ErrorWithStatus;
      logger.error('Controller error', err, {
        method: req.method,
        path: req.path,
        operation: context?.operation,
      });
      
      // Capture exception in Sentry with full context
      captureException(err, {
        module: context?.module || 'accounting',
        operation: context?.operation || req.path,
        userId: req.user?.id,
        companyId: req.user?.companyId ?? undefined,
        extra: {
          method: req.method,
          path: req.path,
          body: req.body,
          params: req.params,
          query: req.query,
        },
      });
      
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal server error';
      
      res.status(statusCode).json({
        error: true,
        message: message,
        details: err.details || null
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
    return req.user.franchiseId || null;
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
    } catch (_error) {
      return undefined;
    }
  }
}