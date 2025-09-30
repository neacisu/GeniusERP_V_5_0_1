/**
 * Analytics Controller
 * 
 * This controller handles core analytics functionality including reports,
 * dashboards, metrics, and alerts.
 */

import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { hasAnalyticsAccess } from '../analytics.roles';
import { z } from 'zod';

// Create logger instance
const logger = new Logger('AnalyticsController');

/**
 * Authentication middleware with role check for analytics
 * Allows users with analytics-related roles
 */
const analyticsRoleGuard = (req: any, res: Response, next: any) => {
  // Make sure user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'You must be logged in to access Analytics features' 
    });
  }

  // Check if user has analytics access
  if (!hasAnalyticsAccess(req.user.roles)) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You do not have permission to access Analytics features' 
    });
  }

  next();
};

/**
 * Register the Analytics controller routes with the Express application
 * @param app Express application
 * @param analyticsService Analytics service instance
 */
export function registerAnalyticsControllerRoutes(app: any, analyticsService: AnalyticsService) {
  const BASE_PATH = '/api/analytics';

  /**
   * Create a new report
   * 
   * @route POST /api/analytics/reports
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.post(
    `${BASE_PATH}/reports`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const reportData = {
          ...req.body,
          companyId: req.user.companyId,
          createdBy: req.user.id
        };

        const report = await analyticsService.createReport(reportData);

        return res.status(201).json({ report });
      } catch (error) {
        logger.error('Error creating report:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while creating the report' 
        });
      }
    }
  );

  /**
   * Get all reports for a company
   * 
   * @route GET /api/analytics/reports
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.get(
    `${BASE_PATH}/reports`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const type = req.query.type as string;

        const reports = await analyticsService.getReports({
          companyId,
          type,
          limit,
          offset: (page - 1) * limit
        });

        return res.status(200).json({
          reports,
          pagination: {
            page,
            limit,
            totalReports: reports.length
          }
        });
      } catch (error) {
        logger.error('Error fetching reports:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching reports' 
        });
      }
    }
  );

  /**
   * Get a specific report by ID
   * 
   * @route GET /api/analytics/reports/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.get(
    `${BASE_PATH}/reports/:id`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const reportId = req.params.id;

        const companyId = req.user.companyId;
        const report = await analyticsService.getById({ reportId, companyId });

        if (!report) {
          return res.status(404).json({ 
            error: 'Not Found', 
            message: 'Report not found' 
          });
        }

          });
        }

        return res.status(200).json({ report });
      } catch (error) {
        logger.error(`Error fetching report ${req.params.id}:`, error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching the report' 
        });
      }
    }
  );

  /**
   * Run a report to generate results
   * 
   * @route POST /api/analytics/reports/:id/run
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.post(
    `${BASE_PATH}/reports/:id/run`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const reportId = req.params.id;
        const parameters = req.body.parameters;

        // Get the report to verify ownership
        const companyId = req.user.companyId;
        const report = await analyticsService.getById({ reportId, companyId });

        if (!report) {
          return res.status(404).json({ 
            error: 'Not Found', 
            message: 'Report not found' 
          });
        }

          });
        }

        // Run the report
        const result = await analyticsService.executeReport(reportId, parameters);

        return res.status(200).json({ result });
      } catch (error) {
        logger.error(`Error running report ${req.params.id}:`, error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while running the report' 
        });
      }
    }
  );

  /**
   * Create a new dashboard
   * 
   * @route POST /api/analytics/dashboards
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.post(
    `${BASE_PATH}/dashboards`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const dashboardData = {
          ...req.body,
          companyId: req.user.companyId,
          createdBy: req.user.id
        };

        const dashboard = await analyticsService.createDashboard(dashboardData);

        return res.status(201).json({ dashboard });
      } catch (error) {
        logger.error('Error creating dashboard:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while creating the dashboard' 
        });
      }
    }
  );

  /**
   * Get all dashboards for a company
   * 
   * @route GET /api/analytics/dashboards
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.get(
    `${BASE_PATH}/dashboards`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

        const dashboards = await analyticsService.getDashboards({
          companyId,
          limit,
          offset: (page - 1) * limit
        });

        return res.status(200).json({
          dashboards,
          pagination: {
            page,
            limit,
            totalDashboards: dashboards.length
          }
        });
      } catch (error) {
        logger.error('Error fetching dashboards:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching dashboards' 
        });
      }
    }
  );

  /**
   * Get a specific dashboard by ID
   * 
   * @route GET /api/analytics/dashboards/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.get(
    `${BASE_PATH}/dashboards/:id`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const dashboardId = req.params.id;

        const dashboard = await analyticsService.getDashboardById(dashboardId);

        if (!dashboard) {
          return res.status(404).json({ 
            error: 'Not Found', 
            message: 'Dashboard not found' 
          });
        }

          });
        }

        return res.status(200).json({ dashboard });
      } catch (error) {
        logger.error(`Error fetching dashboard ${req.params.id}:`, error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching the dashboard' 
        });
      }
    }
  );

  /**
   * Update a dashboard
   * 
   * @route PUT /api/analytics/dashboards/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.put(
    `${BASE_PATH}/dashboards/:id`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const dashboardId = req.params.id;

        // Get the dashboard to verify ownership
        const dashboard = await analyticsService.getDashboardById(dashboardId);

        if (!dashboard) {
          return res.status(404).json({ 
            error: 'Not Found', 
            message: 'Dashboard not found' 
          });
        }

          });
        }

        const updatedDashboard = await analyticsService.updateDashboard(dashboardId, {
          ...req.body,
          updatedBy: req.user.id
        });

        return res.status(200).json({ dashboard: updatedDashboard });
      } catch (error) {
        logger.error(`Error updating dashboard ${req.params.id}:`, error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while updating the dashboard' 
        });
      }
    }
  );

  /**
   * Create a new alert
   * 
   * @route POST /api/analytics/alerts
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.post(
    `${BASE_PATH}/alerts`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const alertData = {
          ...req.body,
          companyId: req.user.companyId,
          createdBy: req.user.id
        };

        const alert = await analyticsService.createAlert(alertData);

        return res.status(201).json({ alert });
      } catch (error) {
        logger.error('Error creating alert:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while creating the alert' 
        });
      }
    }
  );

  /**
   * Get all alerts for a company
   * 
   * @route GET /api/analytics/alerts
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.get(
    `${BASE_PATH}/alerts`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const status = req.query.status as string;
        const severity = req.query.severity as string;

        const alerts = await analyticsService.getAlerts({
          companyId,
          severity,
          limit,
          offset: (page - 1) * limit
        });

        return res.status(200).json({
          alerts,
          pagination: {
            page,
            limit,
            totalAlerts: alerts.length
          }
        });
      } catch (error) {
        logger.error('Error fetching alerts:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching alerts' 
        });
      }
    }
  );

  /**
   * Get alert history for a company
   * 
   * @route GET /api/analytics/alerts/history
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.get(
    `${BASE_PATH}/alerts/history`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const alertId = req.query.alertId as string;
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

        // If alertId specified, check access
        if (alertId) {
          const alert = await analyticsService.getAlertById(alertId);
          if (alert && (alert as any).companyId !== companyId) {
            return res.status(403).json({
              error: 'Forbidden',
              message: 'You do not have access to this alert'
            });
          }
        }

        // Get alert history
        const filter = {
          companyId,
          limit,
          offset: (page - 1) * limit
        };
        
        const history = alertId 
          ? await analyticsService.getAlertHistory(filter, alertId)
          : await analyticsService.getAlertHistory(filter);

        return res.status(200).json({
          history,
          pagination: {
            page,
            limit,
            totalEntries: history.length
          }
        });
      } catch (error) {
        logger.error('Error fetching alert history:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching alert history' 
        });
      }
    }
  );

  /**
   * Get metrics for a company
   * 
   * @route GET /api/analytics/metrics
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.get(
    `${BASE_PATH}/metrics`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;
        const periodStart = req.query.periodStart as string;
        const periodEnd = req.query.periodEnd as string;
        const metricTypes = req.query.metricTypes 
          ? (Array.isArray(req.query.metricTypes) 
              ? req.query.metricTypes 
              : [req.query.metricTypes]) as string[] 
          : undefined;

        // Get metrics using companyId
        const metrics = await analyticsService.getMetricsForCompany(companyId);

        return res.status(200).json({ metrics });
      } catch (error) {
        logger.error('Error fetching metrics:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching metrics' 
        });
      }
    }
  );

  /**
   * Get metrics summary for a company
   * 
   * @route GET /api/analytics/metrics/summary
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware analyticsRoleGuard - Requires analytics role access
   */
  app.get(
    `${BASE_PATH}/metrics/summary`,
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    analyticsRoleGuard,
    async (req: any, res: Response) => {
      try {
        const companyId = req.user.companyId;

        // Get key metrics for company
        const metrics = await analyticsService.getMetricsForCompany(companyId);
        
        // Format as summary
        const summary = {
          totalMetrics: metrics.length,
          keyMetrics: metrics.slice(0, 5),
          lastUpdated: new Date()
        };

        return res.status(200).json({ summary });
      } catch (error) {
        logger.error('Error fetching metrics summary:', error);
        return res.status(500).json({ 
          error: 'Internal Server Error', 
          message: 'An error occurred while fetching metrics summary' 
        });
      }
    }
  );

  logger.info('Analytics controller routes registered');
}