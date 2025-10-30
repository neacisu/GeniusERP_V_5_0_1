/**
 * Business Intelligence Routes
 * 
 * This module defines the API routes for business intelligence functionality,
 * including cost center management, business unit management, performance analytics,
 * and cost allocation services.
 */

import express, { Response, NextFunction } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth';
import { BusinessIntelligenceService } from '../services/business-intelligence.service';
import { hasBusinessIntelligenceAccess } from '../analytics.roles';

const router = express.Router();

/**
 * Authentication middleware with role check for business intelligence
 * Allows ADMIN, COMPANY_ADMIN, BI_ANALYST, FINANCE_MANAGER, CFO, and CEO roles
 */
const biRoleGuard = (req: any, res: Response, next: NextFunction) => {
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
 * @route GET /api/analytics/bi/business-units
 * @desc Get all business units for a company
 * @access Private (requires authentication + BI role)
 */
router.get(
  '/business-units',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const businessUnits = await req.services.businessIntelligenceService.getBusinessUnits(companyId);
      
      return res.status(200).json({ businessUnits });
    } catch (error) {
      console.error('Error fetching business units:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching business units' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/bi/business-units
 * @desc Create a new business unit
 * @access Private (requires authentication + BI role)
 */
router.post(
  '/business-units',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      const businessUnitData = {
        ...req.body,
        companyId,
        createdBy: userId
      };
      
      const businessUnit = await req.services.businessIntelligenceService.createBusinessUnit(businessUnitData);
      
      return res.status(201).json({ businessUnit });
    } catch (error) {
      console.error('Error creating business unit:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while creating the business unit' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/bi/cost-centers
 * @desc Get all cost centers for a company
 * @access Private (requires authentication + BI role)
 */
router.get(
  '/cost-centers',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const costCenters = await req.services.businessIntelligenceService.getCostCenters(companyId);
      
      return res.status(200).json({ costCenters });
    } catch (error) {
      console.error('Error fetching cost centers:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching cost centers' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/bi/cost-centers
 * @desc Create a new cost center
 * @access Private (requires authentication + BI role)
 */
router.post(
  '/cost-centers',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      const costCenterData = {
        ...req.body,
        companyId,
        createdBy: userId
      };
      
      const costCenter = await req.services.businessIntelligenceService.createCostCenter(costCenterData);
      
      return res.status(201).json({ costCenter });
    } catch (error) {
      console.error('Error creating cost center:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while creating the cost center' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/bi/cost-allocations
 * @desc Get all cost allocations for a company
 * @access Private (requires authentication + BI role)
 */
router.get(
  '/cost-allocations',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const costAllocations = await req.services.businessIntelligenceService.getCostAllocations(companyId);
      
      return res.status(200).json({ costAllocations });
    } catch (error) {
      console.error('Error fetching cost allocations:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching cost allocations' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/bi/cost-allocations
 * @desc Create a new cost allocation
 * @access Private (requires authentication + BI role)
 */
router.post(
  '/cost-allocations',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      
      const costAllocationData = {
        ...req.body,
        companyId,
        createdBy: userId
      };
      
      const costAllocation = await req.services.businessIntelligenceService.createCostAllocation(costAllocationData);
      
      return res.status(201).json({ costAllocation });
    } catch (error) {
      console.error('Error creating cost allocation:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while creating the cost allocation' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/bi/cost-allocations/run
 * @desc Run cost allocations for a specific period
 * @access Private (requires authentication + BI role)
 */
router.post(
  '/cost-allocations/run',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const { periodStart, periodEnd, allocationIds } = req.body;
      
      const results = await req.services.businessIntelligenceService.runCostAllocations(
        companyId,
        periodStart,
        periodEnd,
        allocationIds
      );
      
      return res.status(200).json({ results });
    } catch (error) {
      console.error('Error running cost allocations:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while running cost allocations' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/bi/cost-analysis
 * @desc Analyze cost centers
 * @access Private (requires authentication + BI role)
 */
router.get(
  '/cost-analysis',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const { periodStart, periodEnd, costCenterIds } = req.query;
      
      const analysis = await req.services.businessIntelligenceService.analyzeCostCenters(
        companyId,
        periodStart as string,
        periodEnd as string,
        costCenterIds ? (Array.isArray(costCenterIds) ? costCenterIds : [costCenterIds]) : undefined
      );
      
      return res.status(200).json({ analysis });
    } catch (error) {
      console.error('Error analyzing cost centers:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while analyzing cost centers' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/bi/profit-analysis
 * @desc Analyze profit centers
 * @access Private (requires authentication + BI role)
 */
router.get(
  '/profit-analysis',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const { periodStart, periodEnd, businessUnitIds } = req.query;
      
      const analysis = await req.services.businessIntelligenceService.analyzeProfitCenters(
        companyId,
        periodStart as string,
        periodEnd as string,
        businessUnitIds ? (Array.isArray(businessUnitIds) ? businessUnitIds : [businessUnitIds]) : undefined
      );
      
      return res.status(200).json({ analysis });
    } catch (error) {
      console.error('Error analyzing profit centers:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while analyzing profit centers' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/bi/business-performance
 * @desc Analyze overall business performance
 * @access Private (requires authentication + BI role)
 */
router.get(
  '/business-performance',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const { periodStart, periodEnd } = req.query;
      
      const performance = await req.services.businessIntelligenceService.analyzeBusinessPerformance(
        companyId,
        periodStart as string,
        periodEnd as string
      );
      
      return res.status(200).json({ performance });
    } catch (error) {
      console.error('Error analyzing business performance:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while analyzing business performance' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/bi/dashboard
 * @desc Get business intelligence dashboard data
 * @access Private (requires authentication + BI role)
 */
router.get(
  '/dashboard',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  biRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      
      const dashboard = await req.services.businessIntelligenceService.getDashboardData(companyId);
      
      return res.status(200).json({ dashboard });
    } catch (error) {
      console.error('Error fetching BI dashboard data:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching BI dashboard data' 
      });
    }
  }
);

/**
 * Setup Business Intelligence Routes
 * 
 * @returns Express router with business intelligence routes
 */
export function setupBusinessIntelligenceRoutes() {
  return router;
}

export default router;