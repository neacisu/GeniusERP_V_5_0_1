/**
 * Activity Controller
 * 
 * Controller for managing collaboration activity streams.
 */

import { Request, Response, Router } from 'express';
import { ActivityService } from '../services/activity.service';
import { Logger } from "@common/logger";
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';

/**
 * Activity Controller Class
 * 
 * Handles API requests for collaboration activity data.
 */
export class ActivityController {
  private _logger: Logger;
  
  /**
   * Constructor
   * 
   * @param activityService Activity service
   */
  constructor(private activityService: ActivityService) {
    this._logger = new Logger('ActivityController');
  }
  
  /**
   * Register routes with the router
   * 
   * @param router Express router
   */
  registerRoutes(router: Router): void {
    this._logger.info('Registering activity controller routes');
    
    /**
     * Get recent activity for a company
     * 
     * @route GET /api/collaboration/activity
     * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
     */
    router.get('/', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
      try {
        // Log the incoming request
        this._logger.info('GET /api/collaboration/activity endpoint hit', { 
          user: req.user?.id,
          companyId: req.user?.companyId,
          query: req.query,
          headers: req.headers['x-company-id']
        });
        
        // Get company ID from auth or header
        const companyId = req.user?.companyId || req.header('X-Company-ID');
        
        if (!companyId) {
          this._logger.warn('Activity request missing company ID', { user: req.user?.id });
          return res.status(401).json({ 
            error: 'Unauthorized - Company ID missing',
            status: 401,
            items: []
          });
        }
        
        // Parse query parameters
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
        const userId = req.query.userId ? String(req.query.userId) : undefined;
        const includeTypes = req.query.types 
          ? String(req.query.types).split(',') 
          : undefined;
        
        this._logger.debug('Fetching activity for company', { 
          companyId, 
          limit, 
          userId, 
          includeTypes 
        });
        
        // Get activity
        const activity = await this.activityService.getCompanyActivity(companyId, {
          limit,
          userId,
          includeTypes: includeTypes as any // Type assertion to avoid type issues
        });
        
        // If the response has items property, extract items and return them directly
        // This ensures we match the format expected by the frontend
        const responseData = activity && 'items' in activity ? activity.items : [];
        
        this._logger.debug('Activity response', { 
          status: activity?.status || 200,
          itemCount: responseData?.length || 0,
          firstItem: responseData?.[0]?.id || 'none'
        });
        
        // Return response
        return res.status(200).json(responseData);
      } catch (error) {
        this._logger.error('Error fetching activity', { error });
        
        return res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500,
          items: []
        });
      }
    });
    
    // Add a debug endpoint
    router.get('/debug', AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
      try {
        this._logger.info('Debug endpoint hit for activity controller');
        
        // Get company ID from auth or header
        const companyId = req.user?.companyId || req.header('X-Company-ID');
        
        if (!companyId) {
          return res.status(401).json({ message: 'Unauthorized - Company ID missing' });
        }
        
        // Execute direct database query to check if activities exist
        const rawQueryResults = await this.activityService.countActivities(companyId);
        
        return res.status(200).json({
          message: 'Activity debug info',
          timestamp: new Date().toISOString(),
          rawQueryResults,
          companyId
        });
      } catch (error) {
        this._logger.error('Error in debug endpoint', { error });
        
        return res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }
}

/**
 * Factory function to create an ActivityController
 * 
 * @param activityService Activity service instance 
 * @returns ActivityController instance
 */
export const createActivityController = (activityService: ActivityService): ActivityController => {
  return new ActivityController(activityService);
};