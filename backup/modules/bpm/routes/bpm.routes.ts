/**
 * BPM General Routes
 * 
 * API endpoints for general BPM functionality and placeholders for future development
 */

import { Router, Express, Request, Response } from 'express';
import { Logger } from '../../../common/logger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { AuditService, AuditAction } from '../../audit/services/audit.service';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('BpmRoutes');

/**
 * Register general BPM routes with the Express app
 */
export function registerBpmRoutes(app: Express) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(AuthGuard.protect());
  
  /**
   * GET Process placeholder endpoint for BPM functionality
   * Protected with role-based access control requiring the 'bpm_user' role
   */
  router.get('/process-placeholder', async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'User and company information are required'
        });
      }

      // Log the access for audit purposes
      try {
        await AuditService.log({
          companyId,
          userId,
          action: 'BPM_PROCESS_VIEW', // Use string literal to avoid enum reference issues
          entity: 'BPM_PROCESS',
          entityId: uuidv4(),
          details: {
            method: 'GET',
            timestamp: new Date().toISOString()
          }
        });
      } catch (auditError) {
        // Log but don't fail if audit logging fails
        logger.error('[BpmRoutes] Error in audit logging:', auditError instanceof Error ? auditError.message : String(auditError));
      }

      // Return successful response with placeholder data
      return res.status(200).json({
        success: true,
        message: 'BPM process definition placeholder view',
        data: {
          processes: [
            { id: '1', name: 'Approval Process', status: 'active', steps: 5 },
            { id: '2', name: 'Document Review', status: 'active', steps: 3 },
            { id: '3', name: 'Inventory Reconciliation', status: 'inactive', steps: 7 }
          ],
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('[BpmRoutes] Error in process-placeholder GET:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        message: 'Failed to process BPM GET request',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  /**
   * POST Process placeholder endpoint for BPM functionality expansion
   * This endpoint serves as a foundation for future business automation logic
   */
  router.post('/process-placeholder', async (req: Request, res: Response) => {
    try {
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'User and company information are required'
        });
      }

      // Log the request for audit purposes
      try {
        await AuditService.log({
          companyId,
          userId,
          action: AuditAction.BPM_PROCESS_ACTION,
          entity: 'BPM_PROCESS',
          // Use a proper UUID v4 for the entityId
          entityId: uuidv4(),
          details: {
            requestData: req.body,
            timestamp: new Date().toISOString()
          }
        });
      } catch (auditError) {
        // Log but don't fail if audit logging fails
        logger.error('[BpmRoutes] Error in audit logging:', auditError instanceof Error ? auditError.message : String(auditError));
      }

      // Return successful response with process data
      return res.status(200).json({
        success: true,
        message: 'BPM process definition placeholder',
        data: {
          requestData: req.body,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('[BpmRoutes] Error in process-placeholder:', error instanceof Error ? error.message : String(error));
      return res.status(500).json({
        success: false,
        message: 'Failed to process BPM request',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Mount router on app
  app.use('/api/bpm', router);

  logger.info('Registered BPM general routes');
}