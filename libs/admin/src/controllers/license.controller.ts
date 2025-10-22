/**
 * License Management Controller
 * 
 * This controller handles license management operations,
 * including activating, verifying, and managing software licenses.
 */

import { Request, Response } from 'express';
import { Logger } from "@common/logger";
import { LicenseService } from '../services/license.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { z } from 'zod';

// Create logger instance
const logger = new Logger('LicenseController');

// Create validation schema for license activation
const activateLicenseSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  email: z.string().email('Invalid email format'),
  companyName: z.string().optional(),
});

/**
 * Register the license controller routes with the Express application
 * @param app Express application
 * @param licenseService License service instance
 */
export function registerLicenseControllerRoutes(app: any, licenseService: LicenseService) {
  const BASE_PATH = '/api/admin/license';

  /**
   * Get license information
   * 
   * @route GET /api/admin/license
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(BASE_PATH, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get license information
      const license = await licenseService.getActiveLicense();

      if (!license) {
        return res.status(404).json({
          success: false,
          message: 'No license found'
        });
      }

      return res.status(200).json({
        success: true,
        data: license
      });
    } catch (error) {
      logger.error('Error retrieving license information', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Activate a license
   * 
   * @route POST /api/admin/license/activate
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(`${BASE_PATH}/activate`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = activateLicenseSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationResult.error.issues
        });
      }

      // Activate license - first register, then activate
      const { licenseKey, email, companyName } = validationResult.data;
      const registerResult = await licenseService.registerLicense(licenseKey, req.user?.id || 'system');
      const activationResult = await licenseService.activateLicense(registerResult.id, req.user?.id || 'system');

      logger.info(`License activated by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'License activated successfully',
        data: activationResult
      });
    } catch (error: any) {
      logger.error('Error activating license', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  });

  /**
   * Verify license
   * 
   * @route POST /api/admin/license/verify
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(`${BASE_PATH}/verify`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Verify license
      const verificationResult = await licenseService.verifyLicense();

      return res.status(200).json({
        success: true,
        data: verificationResult
      });
    } catch (error) {
      logger.error('Error verifying license', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Deactivate license
   * 
   * @route POST /api/admin/license/deactivate
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(`${BASE_PATH}/deactivate`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Deactivate license - get active license first
      const activeLicense = await licenseService.getActiveLicense();
      if (!activeLicense) {
        return res.status(404).json({
          success: false,
          message: 'No active license found'
        });
      }
      
      const deactivationResult = await licenseService.deactivateLicense(activeLicense.id, req.user?.id || 'system');

      logger.info(`License deactivated by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'License deactivated successfully'
      });
    } catch (error) {
      logger.error('Error deactivating license', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get license usage statistics
   * 
   * @route GET /api/admin/license/usage
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/usage`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get license usage statistics
      const usage = await licenseService.getLicenseUsage();

      return res.status(200).json({
        success: true,
        data: usage
      });
    } catch (error) {
      logger.error('Error retrieving license usage', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get license features
   * 
   * @route GET /api/admin/license/features
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/features`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get license features
      const features = await licenseService.getLicenseFeatures();

      return res.status(200).json({
        success: true,
        data: features
      });
    } catch (error) {
      logger.error('Error retrieving license features', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get license history
   * 
   * @route GET /api/admin/license/history
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/history`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get license history
      const history = await licenseService.getAllLicenses();

      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error retrieving license history', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  logger.info('License controller routes registered');
}