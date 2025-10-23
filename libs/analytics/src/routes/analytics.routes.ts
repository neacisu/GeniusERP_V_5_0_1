/**
 * Analytics Routes
 * 
 * This module defines the API routes for the analytics functionality including reports,
 * dashboards, and alerts.
 */

import express, { Response, NextFunction } from 'express';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../../auth/src/constants/auth-mode.enum';
import { hasAnalyticsAccess } from '../analytics.roles';

const router = express.Router();

/**
 * Authentication middleware with role check for analytics
 * Allows users with analytics-related roles
 */
const analyticsRoleGuard = (req: any, res: Response, next: NextFunction): void => {
  // Make sure user is authenticated
  if (!req.user) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'You must be logged in to access Analytics features' 
    });
    return;
  }

  // Check if user has analytics access
  if (!hasAnalyticsAccess(req.user.roles)) {
    res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You do not have permission to access Analytics features' 
    });
    return;
  }

  next();
};

/**
 * @route POST /api/analytics/reports
 * @desc Create a new report
 * @access Private (requires authentication + analytics role)
 */
router.post(
  '/reports',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const reportData = {
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id
      };

      const report = await req.services.analyticsService.createReport(reportData);

      return res.status(201).json({ report });
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while creating the report' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/reports
 * @desc Get all reports for a company
 * @access Private (requires authentication + analytics role)
 */
router.get(
  '/reports',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const type = req.query.type as string;

      const reports = await req.services.analyticsService.getReports(
        companyId,
        {
          page, 
          limit,
          type
        }
      );

      return res.status(200).json({
        reports,
        pagination: {
          page,
          limit,
          totalReports: reports.length
        }
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching reports' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/reports/:id
 * @desc Get a specific report by ID
 * @access Private (requires authentication + analytics role)
 */
router.get(
  '/reports/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const reportId = req.params.id;
      const companyId = req.user.companyId;

      const report = await req.services.analyticsService.getReportById(
        reportId, 
        companyId
      );

      if (!report) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Report not found' 
        });
      }

      return res.status(200).json({ report });
    } catch (error) {
      console.error('Error fetching report:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching the report' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/reports/:id/run
 * @desc Run a report to generate results
 * @access Private (requires authentication + analytics role)
 */
router.post(
  '/reports/:id/run',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const reportId = req.params.id;
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const parameters = req.body.parameters;

      // Get the report to verify ownership
      const report = await req.services.analyticsService.getReportById(reportId, companyId);

      if (!report) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Report not found' 
        });
      }

      // Run the report
      const result = await req.services.analyticsService.runReport(
        reportId, 
        companyId, 
        userId, 
        parameters
      );

      return res.status(200).json({ result });
    } catch (error) {
      console.error('Error running report:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while running the report' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/reports/:id/history
 * @desc Get the execution history of a report
 * @access Private (requires authentication + analytics role)
 */
router.get(
  '/reports/:id/history',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const reportId = req.params.id;
      const companyId = req.user.companyId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      // Get the report to verify ownership
      const report = await req.services.analyticsService.getReportById(reportId, companyId);

      if (!report) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Report not found' 
        });
      }

      // Get report execution history
      const history = await req.services.analyticsService.getReportExecutionHistory(
        reportId,
        companyId,
        { page, limit }
      );

      return res.status(200).json({ 
        history,
        pagination: {
          page,
          limit,
          totalExecutions: history.length
        }
      });
    } catch (error) {
      console.error('Error fetching report history:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching report history' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/dashboards
 * @desc Create a new dashboard
 * @access Private (requires authentication + analytics role)
 */
router.post(
  '/dashboards',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const dashboardData = {
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id
      };

      const dashboard = await req.services.analyticsService.createDashboard(dashboardData);

      return res.status(201).json({ dashboard });
    } catch (error) {
      console.error('Error creating dashboard:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while creating the dashboard' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/dashboards
 * @desc Get all dashboards for a company
 * @access Private (requires authentication + analytics role)
 */
router.get(
  '/dashboards',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const dashboards = await req.services.analyticsService.getDashboards(
        companyId,
        { page, limit }
      );

      return res.status(200).json({
        dashboards,
        pagination: {
          page,
          limit,
          totalDashboards: dashboards.length
        }
      });
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching dashboards' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/dashboards/:id
 * @desc Get a specific dashboard by ID
 * @access Private (requires authentication + analytics role)
 */
router.get(
  '/dashboards/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const dashboardId = req.params.id;
      const companyId = req.user.companyId;

      const dashboard = await req.services.analyticsService.getDashboardById(dashboardId, companyId);

      if (!dashboard) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Dashboard not found' 
        });
      }

      // Track dashboard view
      await req.services.analyticsService.trackDashboardView(dashboardId, req.user.id);

      // Get dashboard reports
      const reports = await req.services.analyticsService.getReportsByDashboardId(dashboardId);

      return res.status(200).json({ 
        dashboard,
        reports
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching the dashboard' 
      });
    }
  }
);

/**
 * @route PUT /api/analytics/dashboards/:id
 * @desc Update a dashboard
 * @access Private (requires authentication + analytics role)
 */
router.put(
  '/dashboards/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const dashboardId = req.params.id;
      const companyId = req.user.companyId;
      const userId = req.user.id;

      // Get the dashboard to verify ownership
      const dashboard = await req.services.analyticsService.getDashboardById(dashboardId, companyId);

      if (!dashboard) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Dashboard not found' 
        });
      }

      const updatedDashboard = await req.services.analyticsService.updateDashboard(
        dashboardId,
        companyId,
        userId,
        req.body
      );

      return res.status(200).json({ dashboard: updatedDashboard });
    } catch (error) {
      console.error('Error updating dashboard:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while updating the dashboard' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/alerts
 * @desc Create a new alert
 * @access Private (requires authentication + analytics role)
 */
router.post(
  '/alerts',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const alertData = {
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id
      };

      const alert = await req.services.analyticsService.createAlert(alertData);

      return res.status(201).json({ alert });
    } catch (error) {
      console.error('Error creating alert:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while creating the alert' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/alerts
 * @desc Get all alerts for a company
 * @access Private (requires authentication + analytics role)
 */
router.get(
  '/alerts',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const status = req.query.status as string;
      const severity = req.query.severity as string;

      const alerts = await req.services.analyticsService.getAlerts(
        companyId,
        {
          page,
          limit,
          status,
          severity
        }
      );

      return res.status(200).json({
        alerts,
        pagination: {
          page,
          limit,
          totalAlerts: alerts.length
        }
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching alerts' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/alerts/history
 * @desc Get alert history for a company
 * @access Private (requires authentication + analytics role)
 */
router.get(
  '/alerts/history',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const alertId = req.query.alertId as string;

      const history = await req.services.analyticsService.getAlertHistory(
        companyId,
        alertId,
        { page, limit }
      );

      return res.status(200).json({
        history,
        pagination: {
          page,
          limit,
          totalEntries: history.length
        }
      });
    } catch (error) {
      console.error('Error fetching alert history:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching alert history' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/metrics
 * @desc Get metrics for a company
 * @access Private (requires authentication + analytics role)
 */
router.get(
  '/metrics',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const { periodStart, periodEnd, metricTypes } = req.query;

      const metrics = await req.services.analyticsService.getMetrics(
        companyId,
        periodStart as string,
        periodEnd as string,
        metricTypes ? (Array.isArray(metricTypes) ? metricTypes : [metricTypes]) as string[] : undefined
      );

      return res.status(200).json({ metrics });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching metrics' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/metrics/summary
 * @desc Get metrics summary for a company
 * @access Private (requires authentication + analytics role)
 */
router.get(
  '/metrics/summary',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  analyticsRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;

      const summary = await req.services.analyticsService.getMetricsSummary(companyId);

      return res.status(200).json({ summary });
    } catch (error) {
      console.error('Error fetching metrics summary:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching metrics summary' 
      });
    }
  }
);

/**
 * Setup Analytics Routes
 * 
 * @returns Express router with analytics routes
 */
export function setupAnalyticsRoutes() {
  return router;
}

export default router;