/**
 * Company Access Middleware
 * 
 * Validates that users can only access data from their own company
 * Prevents cross-company data access vulnerabilities
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../types/express';
import { Logger } from "@common/logger";

const logger = new Logger('CompanyAccessMiddleware');

/**
 * Extended authenticated request with company filter
 */
interface CompanyFilteredRequest extends AuthenticatedRequest {
  companyId?: string;
}

/**
 * Middleware to validate company access
 * Ensures users can only access data from their own company
 */
export const validateCompanyAccess = (options: {
  paramName?: string;
  bodyField?: string;
  queryField?: string;
  allowAdminCrossAccess?: boolean;
} = {}) => {
  const {
    paramName = 'companyId',
    bodyField = 'companyId',
    queryField = 'companyId',
    allowAdminCrossAccess = true
  } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        logger.warn('Company access validation failed: No authenticated user');
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userCompanyId = user.companyId;
      if (!userCompanyId) {
        logger.warn('Company access validation failed: User has no company ID');
        return res.status(403).json({ error: 'User not associated with any company' });
      }

      // Get the requested company ID from various sources
      const requestedCompanyId = 
        req.params[paramName] || 
        req.body?.[bodyField] || 
        req.query[queryField] as string;

      // If no company ID is specified in the request, allow access
      // The user will only see their own company's data anyway
      if (!requestedCompanyId) {
        logger.debug('No company ID specified in request, allowing access');
        return next();
      }

      // Check if user has admin privileges for cross-company access
      if (allowAdminCrossAccess) {
        const userRoles = user.roles || [user.role];
        const isAdmin = userRoles.some((role: string) => 
          ['admin', 'ADMIN', 'system_admin', 'SYSTEM_ADMIN'].includes(role)
        );
        
        if (isAdmin) {
          logger.debug('Admin user granted cross-company access');
          return next();
        }
      }

      // Validate that the user can access the requested company's data
      if (userCompanyId !== requestedCompanyId) {
        logger.warn('Company access denied: Cross-company access attempt');
        
        return res.status(403).json({ 
          error: 'Access denied: You do not have permission to access this company\'s data' 
        });
      }

      logger.debug('Company access validation successful');

      next();
    } catch (error) {
      logger.error('Error in company access validation', error);
      return res.status(500).json({ error: 'Internal server error during access validation' });
    }
  };
};

/**
 * Middleware to ensure all requests include the user's company ID
 * Automatically adds the company ID to the request body if not present
 */
export const ensureCompanyId = (bodyField: string = 'companyId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userCompanyId = user.companyId;
      if (!userCompanyId) {
        return res.status(403).json({ error: 'User not associated with any company' });
      }

      // Add company ID to request body if not present
      if (req.body && !req.body[bodyField]) {
        req.body[bodyField] = userCompanyId;
        logger.debug('Added company ID to request body');
      }

      next();
    } catch (error) {
      logger.error('Error in ensureCompanyId middleware', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to filter query results by company ID
 * Adds company filter to database queries
 */
export const addCompanyFilter = (req: CompanyFilteredRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userCompanyId = user.companyId;
    if (!userCompanyId) {
      return res.status(403).json({ error: 'User not associated with any company' });
    }

    // Add company filter to query parameters
    if (!req.query.companyId) {
      req.query.companyId = userCompanyId;
    }

    // Store company ID in request for easy access by controllers
    req.companyId = userCompanyId;

    next();
  } catch (error) {
    logger.error('Error in addCompanyFilter middleware', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  validateCompanyAccess,
  ensureCompanyId,
  addCompanyFilter
}; 