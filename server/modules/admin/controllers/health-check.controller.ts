/**
 * Health Check Controller
 * 
 * This controller handles system health checks and monitoring endpoints
 * for system administrators to view the health status of the application.
 */

import { Request, Response } from 'express';
import { Logger } from '../../../common/logger';
import { HealthCheckService } from '../services/health-check.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

// Create logger instance
const logger = new Logger('HealthCheckController');

/**
 * Register the health check controller routes with the Express application
 * @param app Express application
 * @param healthCheckService Health check service instance
 */
export function registerHealthCheckControllerRoutes(app: any, healthCheckService: HealthCheckService) {
  const BASE_PATH = '/api/admin/health';

  /**
   * Get overall system health status
   * This endpoint is public and doesn't require authentication
   * 
   * @route GET /api/health
   */
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      // Get basic system health status (minimal checks for public endpoint)
      const health = await healthCheckService.runHealthChecks();

      return res.status(health.status === 'healthy' ? 200 : 503).json({
        status: health.status,
        timestamp: health.timestamp,
        uptime: health.uptime
      });
    } catch (error) {
      logger.error('Error checking system health', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to check system health'
      });
    }
  });

  /**
   * Get detailed system health status
   * 
   * @route GET /api/admin/health
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(BASE_PATH, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get detailed system health status
      const health = await healthCheckService.runHealthChecks();

      return res.status(health.status === 'healthy' ? 200 : health.status === 'degraded' ? 429 : 503).json(health);
    } catch (error) {
      logger.error('Error checking detailed system health', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to check system health'
      });
    }
  });

  /**
   * Run a specific health check
   * 
   * @route GET /api/admin/health/:check
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/:check`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const checkName = req.params.check;

      // Run the specific health check
      const checkResult = await healthCheckService.runHealthCheck(checkName);

      if (!checkResult) {
        return res.status(404).json({
          success: false,
          message: `Health check '${checkName}' not found`
        });
      }

      return res.status(checkResult.status === 'healthy' ? 200 : 503).json(checkResult);
    } catch (error) {
      logger.error(`Error running health check ${req.params.check}`, error);
      return res.status(500).json({
        status: 'error',
        message: `Failed to run health check ${req.params.check}`
      });
    }
  });

  /**
   * Get system health history
   * 
   * @route GET /api/admin/health/history
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   * 
   * TODO: Implement health check history storage and retrieval
   */
  app.get(`${BASE_PATH}/history`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // TODO: Implement health check history
      // For now, return current health status as history
      const health = await healthCheckService.runHealthChecks();

      return res.status(200).json({
        success: true,
        data: [health] // Return current state as history
      });
    } catch (error) {
      logger.error('Error retrieving health check history', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve health check history'
      });
    }
  });

  /**
   * Get system resource usage
   * 
   * @route GET /api/admin/health/resources
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   * 
   * TODO: Implement system resource usage tracking
   */
  app.get(`${BASE_PATH}/resources`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // TODO: Implement system resource usage
      // For now, return health components that contain CPU/Memory/Disk info
      const components = healthCheckService.getHealthComponents();
      const systemComponents = components.filter(c => c.type === 'system');

      return res.status(200).json({
        success: true,
        data: systemComponents
      });
    } catch (error) {
      logger.error('Error retrieving system resource usage', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve system resource usage'
      });
    }
  });

  /**
   * Run a health check on all components
   * 
   * @route POST /api/admin/health/check-all
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(`${BASE_PATH}/check-all`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Run all health checks
      const results = await healthCheckService.runHealthChecks();

      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error running all health checks', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to run all health checks'
      });
    }
  });

  /**
   * Get list of available health checks
   * 
   * @route GET /api/admin/health/checks
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/checks`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get list of available health checks
      const checks = healthCheckService.getHealthComponents();

      return res.status(200).json({
        success: true,
        data: checks
      });
    } catch (error) {
      logger.error('Error retrieving available health checks', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve available health checks'
      });
    }
  });

  logger.info('Health check controller routes registered');
}