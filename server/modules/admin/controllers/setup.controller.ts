/**
 * System Setup Controller
 * 
 * This controller handles the initial system setup process,
 * including database initialization, first-time user setup,
 * and configuration of system settings.
 */

import { Request, Response } from 'express';
import { Logger } from '../../../common/logger';
import { SetupService } from '../services/setup.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { z } from 'zod';

// Create validation schema for initial setup
const initialSetupSchema = z.object({
  adminUser: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
  company: z.object({
    name: z.string().min(1, 'Company name is required'),
    fiscalCode: z.string().optional(),
    registrationNumber: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email format').optional(),
  }).optional(),
  systemSettings: z.record(z.any()).optional(),
});

// Create logger instance
const logger = new Logger('SetupController');

/**
 * Register the setup controller routes with the Express application
 * @param app Express application
 * @param setupService Setup service instance
 */
export function registerSetupControllerRoutes(app: any, setupService: SetupService) {
  const BASE_PATH = '/api/admin/setup';

  /**
   * Check if the system is already set up
   * No authentication required for this endpoint
   * 
   * @route GET /api/admin/setup/status
   */
  app.get(`${BASE_PATH}/status`, async (req: Request, res: Response) => {
    try {
      // Check setup status
      const status = await setupService.checkSetupStatus();

      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error checking setup status', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Perform initial system setup
   * No authentication required for this endpoint (since it's used to create the first admin)
   * 
   * @route POST /api/admin/setup/initialize
   */
  app.post(`${BASE_PATH}/initialize`, async (req: Request, res: Response) => {
    try {
      // Check if system is already set up
      const status = await setupService.checkSetupStatus();
      if (status.isSetup) {
        return res.status(400).json({
          success: false,
          message: 'System is already set up'
        });
      }

      // Validate request body
      const validationResult = initialSetupSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      // Perform initial setup
      const setupData = validationResult.data;
      const result = await setupService.performInitialSetup(
        setupData.adminUser,
        setupData.company,
        setupData.systemSettings
      );

      logger.info('System successfully initialized');

      return res.status(200).json({
        success: true,
        message: 'System successfully initialized',
        data: result
      });
    } catch (error: any) {
      logger.error('Error during system initialization', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  });

  /**
   * Check database status
   * 
   * @route GET /api/admin/setup/database
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/database`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Check database status
      const status = await setupService.checkDatabaseStatus();

      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error checking database status', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Run database migrations
   * 
   * @route POST /api/admin/setup/database/migrate
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(`${BASE_PATH}/database/migrate`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Run database migrations
      const result = await setupService.runDatabaseMigrations();

      logger.info(`Database migrations executed by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'Database migrations executed successfully',
        data: result
      });
    } catch (error: any) {
      logger.error('Error running database migrations', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  });

  /**
   * Seed database with sample data
   * 
   * @route POST /api/admin/setup/database/seed
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(`${BASE_PATH}/database/seed`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const { dataset } = req.body;

      // Validate dataset parameter
      if (!dataset || typeof dataset !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Dataset parameter is required'
        });
      }

      // Seed database with sample data
      const result = await setupService.seedDatabase(dataset);

      logger.info(`Database seeded with ${dataset} data by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: `Database seeded with ${dataset} data successfully`,
        data: result
      });
    } catch (error: any) {
      logger.error('Error seeding database', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  });

  /**
   * Check system requirements
   * 
   * @route GET /api/admin/setup/requirements
   */
  app.get(`${BASE_PATH}/requirements`, async (req: Request, res: Response) => {
    try {
      // Check system requirements
      const requirements = await setupService.checkSystemRequirements();

      return res.status(200).json({
        success: true,
        data: requirements
      });
    } catch (error) {
      logger.error('Error checking system requirements', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get system information
   * 
   * @route GET /api/admin/setup/system-info
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/system-info`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get system information
      const systemInfo = await setupService.getSystemInformation();

      return res.status(200).json({
        success: true,
        data: systemInfo
      });
    } catch (error) {
      logger.error('Error retrieving system information', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get available database seed datasets
   * 
   * @route GET /api/admin/setup/database/seed-datasets
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/database/seed-datasets`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get available seed datasets
      const datasets = await setupService.getAvailableSeedDatasets();

      return res.status(200).json({
        success: true,
        data: datasets
      });
    } catch (error) {
      logger.error('Error retrieving available seed datasets', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  logger.info('Setup controller routes registered');
}