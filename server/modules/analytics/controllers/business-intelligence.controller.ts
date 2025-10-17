/**
 * Business Intelligence Controller
 * 
 * This controller handles business intelligence functionality including
 * business unit performance, KPIs, OLAP operations, and data warehousing.
 */

import { Request, Response } from 'express';
import { BusinessIntelligenceService } from '../services/business-intelligence.service';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { hasBusinessIntelligenceAccess } from '../analytics.roles';

// Create logger instance
const logger = new Logger('BusinessIntelligenceController');

/**
 * Authentication middleware with role check for business intelligence
 * Allows users with BI-related roles
 */
const biRoleGuard = (req: any, res: Response, next: any) => {
  // Make sure user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'You must be logged in to access Business Intelligence features' 
    });
  }

  // Check if user has business intelligence access
  if (!hasBusinessIntelligenceAccess(req.user.roles)) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You do not have permission to access Business Intelligence features' 
    });
  }

  next();
};

/**
 * Register the Business Intelligence controller routes with the Express application
 * @param app Express application
 * @param biService Business Intelligence service instance
 */
export function registerBusinessIntelligenceControllerRoutes(app: any, biService: BusinessIntelligenceService) {
  const BASE_PATH = '/api/analytics/bi';

  /**
   * Get all business units for a company
   * 
   * @route GET /api/analytics/bi/business-units
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.get(
    `${BASE_PATH}/business-units`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        
        const businessUnits = await biService.getBusinessUnits(companyId);
        
        return res.status(200).json({ businessUnits });
      } catch (error) {
        logger.error('Error fetching business units:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching business units' 
        });
      }
    }
  );

  /**
   * Get KPIs for a company
   * 
   * @route GET /api/analytics/bi/kpis
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.get(
    `${BASE_PATH}/kpis`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const businessUnitId = req.query.businessUnitId as string;
        const periodStart = req.query.periodStart as string;
        const periodEnd = req.query.periodEnd as string;
        
        // TODO: Implement KPI functionality
        const kpis = undefined;
        throw new Error('KPI functionality not yet implemented');
      } catch (error) {
        logger.error('Error fetching KPIs:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching KPIs' 
        });
      }
    }
  );

  /**
   * Create a new KPI
   * 
   * @route POST /api/analytics/bi/kpis
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.post(
    `${BASE_PATH}/kpis`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const kpiData = {
          ...req.body,
          companyId: req.user.companyId,
          createdBy: req.user.id
        };
        
        // TODO: Implement KPI functionality
        throw new Error('KPI creation not yet implemented');
        
        return res.status(201).json({ kpi });
      } catch (error) {
        logger.error('Error creating KPI:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while creating the KPI' 
        });
      }
    }
  );

  /**
   * Get OLAP dimensions for a company
   * 
   * @route GET /api/analytics/bi/dimensions
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.get(
    `${BASE_PATH}/dimensions`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const datasetId = req.query.datasetId as string;
        
        // TODO: Implement OLAP functionality
        throw new Error('OLAP dimensions not yet implemented');
        
        return res.status(200).json({ dimensions });
      } catch (error) {
        logger.error('Error fetching OLAP dimensions:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching OLAP dimensions' 
        });
      }
    }
  );

  /**
   * Get OLAP measures for a company
   * 
   * @route GET /api/analytics/bi/measures
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.get(
    `${BASE_PATH}/measures`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const datasetId = req.query.datasetId as string;
        
        // TODO: Implement OLAP functionality
        throw new Error('OLAP measures not yet implemented');
        
        return res.status(200).json({ measures });
      } catch (error) {
        logger.error('Error fetching OLAP measures:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching OLAP measures' 
        });
      }
    }
  );

  /**
   * Execute OLAP query
   * 
   * @route POST /api/analytics/bi/olap-query
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.post(
    `${BASE_PATH}/olap-query`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const { dimensions, measures, filters, datasetId } = req.body;
        
        // TODO: Implement OLAP functionality
        throw new Error('OLAP query execution not yet implemented');
        
        return res.status(200).json({ results });
      } catch (error) {
        logger.error('Error executing OLAP query:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while executing the OLAP query' 
        });
      }
    }
  );

  /**
   * Get ETL jobs
   * 
   * @route GET /api/analytics/bi/etl-jobs
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.get(
    `${BASE_PATH}/etl-jobs`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const status = req.query.status as string;
        
        // TODO: Implement ETL functionality
        throw new Error('ETL jobs not yet implemented');
        
        return res.status(200).json({ jobs });
      } catch (error) {
        logger.error('Error fetching ETL jobs:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching ETL jobs' 
        });
      }
    }
  );

  /**
   * Create ETL job
   * 
   * @route POST /api/analytics/bi/etl-jobs
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.post(
    `${BASE_PATH}/etl-jobs`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const jobData = {
          ...req.body,
          companyId: req.user.companyId,
          createdBy: req.user.id
        };
        
        // TODO: Implement ETL functionality
        throw new Error('ETL job creation not yet implemented');
        
        return res.status(201).json({ job });
      } catch (error) {
        logger.error('Error creating ETL job:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while creating the ETL job' 
        });
      }
    }
  );

  /**
   * Get datasets
   * 
   * @route GET /api/analytics/bi/datasets
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.get(
    `${BASE_PATH}/datasets`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const type = req.query.type as string;
        
        // TODO: Implement dataset functionality
        throw new Error('Dataset retrieval not yet implemented');
        
        return res.status(200).json({ datasets });
      } catch (error) {
        logger.error('Error fetching datasets:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching datasets' 
        });
      }
    }
  );

  /**
   * Create dataset
   * 
   * @route POST /api/analytics/bi/datasets
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware biRoleGuard - Requires BI role access
   */
  app.post(
    `${BASE_PATH}/datasets`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    biRoleGuard,
    async (req: any, res: Response) => {
      try {
        const datasetData = {
          ...req.body,
          companyId: req.user.companyId,
          createdBy: req.user.id
        };
        
        // TODO: Implement dataset functionality
        throw new Error('Dataset creation not yet implemented');
        
        return res.status(201).json({ dataset });
      } catch (error) {
        logger.error('Error creating dataset:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while creating the dataset' 
        });
      }
    }
  );

  logger.info('Business Intelligence controller routes registered');
}