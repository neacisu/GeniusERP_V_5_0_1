/**
 * Activity Controller
 * 
 * Controller for handling activity-related API endpoints
 */
import { Express, Request, Response } from 'express';
import { ActivityService } from '../services/activity.service';
import { JwtService } from '../../auth/services/jwt.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/types';
import { UserRole } from '../../auth/types';

export class ActivityController {
  private activityService: ActivityService;
  
  constructor() {
    this.activityService = new ActivityService();
  }
  
  /**
   * Register all activity routes
   */
  registerRoutes(app: Express, jwtService: JwtService): void {
    // Create a new activity
    app.post(
      '/api/crm/activities',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.createActivity.bind(this)
    );
    
    // Get a specific activity by ID
    app.get(
      '/api/crm/activities/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getActivity.bind(this)
    );
    
    // Update an existing activity
    app.put(
      '/api/crm/activities/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.updateActivity.bind(this)
    );
    
    // Delete an activity
    app.delete(
      '/api/crm/activities/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.deleteActivity.bind(this)
    );
    
    // List activities with filters
    app.get(
      '/api/crm/activities',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.listActivities.bind(this)
    );
    
    // Mark activity as completed
    app.put(
      '/api/crm/activities/:id/complete',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.completeActivity.bind(this)
    );
    
    // Get activities for a deal
    app.get(
      '/api/crm/deals/:dealId/activities',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getActivitiesByDeal.bind(this)
    );
    
    // Get activities for a customer
    app.get(
      '/api/crm/customers/:customerId/activities',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getActivitiesByCustomer.bind(this)
    );
    
    // Get activities for a contact
    app.get(
      '/api/crm/contacts/:contactId/activities',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getActivitiesByContact.bind(this)
    );
    
    // Get calendar activities for a date range
    app.get(
      '/api/crm/calendar',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getCalendarActivities.bind(this)
    );
    
    // Get user's upcoming activities
    app.get(
      '/api/crm/activities/upcoming',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getUpcomingActivities.bind(this)
    );
    
    // Get user's overdue activities
    app.get(
      '/api/crm/activities/overdue',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getOverdueActivities.bind(this)
    );
    
    // Get activities statistics
    app.get(
      '/api/crm/activities/stats',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getActivityStats.bind(this)
    );
  }
  
  /**
   * Create a new activity
   */
  private async createActivity(req: Request, res: Response): Promise<void> {
    try {
      const { user, body } = req;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const activityData = {
        ...body,
        companyId: user.companyId
      };
      
      const activity = await this.activityService.create(activityData, user.id);
      res.status(201).json(activity);
    } catch (error) {
      console.error('Error creating activity:', error);
      res.status(500).json({ 
        message: 'Failed to create activity', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get a specific activity by ID
   */
  private async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { id } = params;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const activity = await this.activityService.getById(id, user.companyId);
      
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      
      res.json(activity);
    } catch (error) {
      console.error('Error getting activity:', error);
      res.status(500).json({ 
        message: 'Failed to get activity', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Update an existing activity
   */
  private async updateActivity(req: Request, res: Response): Promise<void> {
    try {
      const { user, params, body } = req;
      const { id } = params;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const activityData = {
        ...body,
        companyId: user.companyId
      };
      
      const activity = await this.activityService.update(id, activityData, user.id);
      
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      
      res.json(activity);
    } catch (error) {
      console.error('Error updating activity:', error);
      res.status(500).json({ 
        message: 'Failed to update activity', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Delete an activity
   */
  private async deleteActivity(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { id } = params;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const success = await this.activityService.delete(id, user.companyId, user.id);
      
      if (!success) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      
      res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
      console.error('Error deleting activity:', error);
      res.status(500).json({ 
        message: 'Failed to delete activity', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * List activities with filters
   */
  private async listActivities(req: Request, res: Response): Promise<void> {
    try {
      const { user, query } = req;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // Parse query parameters
      const page = query.page ? parseInt(query.page as string, 10) : 1;
      const limit = query.limit ? parseInt(query.limit as string, 10) : 20;
      const searchTerm = query.search as string;
      const dealId = query.dealId as string;
      const customerId = query.customerId as string;
      const contactId = query.contactId as string;
      const type = query.activityType as string;
      const status = query.status as string;
      const assignedTo = query.assignedTo as string;
      const sortBy = query.sortBy as string;
      const sortDirection = query.sortDirection as 'asc' | 'desc';
      const dateFrom = query.dateFrom ? new Date(query.dateFrom as string) : undefined;
      const dateTo = query.dateTo ? new Date(query.dateTo as string) : undefined;
      
      const result = await this.activityService.list(user.companyId, {
        page,
        limit,
        searchTerm,
        dealId,
        customerId,
        contactId,
        type,
        status,
        assignedTo,
        dateFrom,
        dateTo,
        sortBy,
        sortDirection
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error listing activities:', error);
      res.status(500).json({ 
        message: 'Failed to list activities', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Mark activity as completed
   */
  private async completeActivity(req: Request, res: Response): Promise<void> {
    try {
      const { user, params, body } = req;
      const { id } = params;
      const { outcome } = body;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const activity = await this.activityService.markAsCompleted(id, user.companyId, user.id, outcome);
      
      if (!activity) {
        res.status(404).json({ message: 'Activity not found' });
        return;
      }
      
      res.json(activity);
    } catch (error) {
      console.error('Error completing activity:', error);
      res.status(500).json({ 
        message: 'Failed to complete activity', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get activities for a deal
   */
  private async getActivitiesByDeal(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { dealId } = params;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const activities = await this.activityService.getActivitiesByDealId(dealId, user.companyId);
      res.json(activities);
    } catch (error) {
      console.error('Error getting deal activities:', error);
      res.status(500).json({ 
        message: 'Failed to get deal activities', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get activities for a customer
   */
  private async getActivitiesByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { customerId } = params;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const activities = await this.activityService.getActivitiesByCustomerId(customerId, user.companyId);
      res.json(activities);
    } catch (error) {
      console.error('Error getting customer activities:', error);
      res.status(500).json({ 
        message: 'Failed to get customer activities', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get activities for a contact
   */
  private async getActivitiesByContact(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { contactId } = params;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const activities = await this.activityService.getActivitiesByContactId(contactId, user.companyId);
      res.json(activities);
    } catch (error) {
      console.error('Error getting contact activities:', error);
      res.status(500).json({ 
        message: 'Failed to get contact activities', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get calendar activities for a date range
   */
  private async getCalendarActivities(req: Request, res: Response): Promise<void> {
    try {
      const { user, query } = req;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // Parse date range parameters
      const startDate = query.startDate ? new Date(query.startDate as string) : new Date();
      const endDate = query.endDate ? new Date(query.endDate as string) : new Date();
      endDate.setDate(startDate.getDate() + 30); // Default to 30 days if not specified
      
      // Optionally filter by user
      const userId = query.userId as string;
      
      const activities = await this.activityService.getActivitiesByDateRange(
        user.companyId, 
        startDate, 
        endDate, 
        userId || undefined
      );
      
      res.json(activities);
    } catch (error) {
      console.error('Error getting calendar activities:', error);
      res.status(500).json({ 
        message: 'Failed to get calendar activities', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get user's upcoming activities
   */
  private async getUpcomingActivities(req: Request, res: Response): Promise<void> {
    try {
      const { user, query } = req;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // Parse days parameter, default to 7 days
      const days = query.days ? parseInt(query.days as string, 10) : 7;
      
      const activities = await this.activityService.getUpcomingActivities(user.companyId, user.id, days);
      res.json(activities);
    } catch (error) {
      console.error('Error getting upcoming activities:', error);
      res.status(500).json({ 
        message: 'Failed to get upcoming activities', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get user's overdue activities
   */
  private async getOverdueActivities(req: Request, res: Response): Promise<void> {
    try {
      const { user } = req;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const activities = await this.activityService.getOverdueActivities(user.companyId, user.id);
      res.json(activities);
    } catch (error) {
      console.error('Error getting overdue activities:', error);
      res.status(500).json({ 
        message: 'Failed to get overdue activities', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get activities statistics
   */
  private async getActivityStats(req: Request, res: Response): Promise<void> {
    try {
      const { user, query } = req;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // Optionally filter by user
      const userId = query.userId as string;
      
      const stats = await this.activityService.getActivityStats(user.companyId, userId || undefined);
      res.json(stats);
    } catch (error) {
      console.error('Error getting activity statistics:', error);
      res.status(500).json({ 
        message: 'Failed to get activity statistics', 
        error: (error as Error).message 
      });
    }
  }
}