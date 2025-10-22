/**
 * Deal Controller
 * 
 * Handles HTTP requests related to CRM deals
 */
import { Request, Response } from 'express';
import { DealService } from '../services/deal.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/types';
import { JwtService } from '../../auth/services/jwt.service';
import { UserRole } from '../../auth/types';

export class DealController {
  private dealService: DealService;
  private jwtService: JwtService | null = null;

  constructor() {
    this.dealService = new DealService();

    // Bind the methods to this instance
    this.createDeal = this.createDeal.bind(this);
    this.getDeal = this.getDeal.bind(this);
    this.updateDeal = this.updateDeal.bind(this);
    this.deleteDeal = this.deleteDeal.bind(this);
    this.listDeals = this.listDeals.bind(this);
    this.getDealsByCustomer = this.getDealsByCustomer.bind(this);
    this.getDealStageHistory = this.getDealStageHistory.bind(this);
    this.moveDealToStage = this.moveDealToStage.bind(this);
    this.getDealStatistics = this.getDealStatistics.bind(this);
    this.getUpcomingDeals = this.getUpcomingDeals.bind(this);
    this.getRecentlyUpdatedDeals = this.getRecentlyUpdatedDeals.bind(this);
    this.getStaleDeals = this.getStaleDeals.bind(this);
  }

  /**
   * Register routes
   */
  registerRoutes(app: any, jwtService?: JwtService) {
    // Save reference to the JWT service if provided
    if (jwtService) {
      this.jwtService = jwtService;
    }
    
    // Deal routes
    // Create deal - requires sales_agent, company_admin or admin role
    app.post(
      '/api/crm/deals', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.createDeal
    );
    
    // Get deal by ID
    app.get(
      '/api/crm/deals/:id', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getDeal
    );
    
    // Update deal - requires sales_agent, company_admin or admin role
    app.put(
      '/api/crm/deals/:id', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.updateDeal
    );
    
    // Delete deal - requires company_admin or admin role
    app.delete(
      '/api/crm/deals/:id', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.deleteDeal
    );
    
    // List all deals
    app.get(
      '/api/crm/deals', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.listDeals
    );
    
    // Get deals by customer ID
    app.get(
      '/api/crm/customers/:customerId/deals', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getDealsByCustomer
    );
    
    // Get deal stage history
    app.get(
      '/api/crm/deals/:id/history', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getDealStageHistory
    );
    
    // Move deal to a different stage - requires sales_agent, company_admin or admin role
    app.post(
      '/api/crm/deals/:id/move-to-stage', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.moveDealToStage
    );
    
    // Get deal statistics
    app.get(
      '/api/crm/deals-statistics', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getDealStatistics
    );
    
    // Get upcoming deals
    app.get(
      '/api/crm/deals-upcoming', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getUpcomingDeals
    );
    
    // Get recently updated deals
    app.get(
      '/api/crm/deals-recent', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getRecentlyUpdatedDeals
    );
    
    // Get stale deals
    app.get(
      '/api/crm/deals-stale', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getStaleDeals
    );
  }

  /**
   * Create a new deal
   */
  async createDeal(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate the request body
      if (!req.body.companyId) {
        req.body.companyId = req.user?.companyId;
      }

      if (!req.body.title) {
        return res.status(400).json({ message: 'Deal title is required' });
      }

      if (!req.body.stageId) {
        return res.status(400).json({ message: 'Stage ID is required' });
      }

      if (!req.body.pipelineId) {
        return res.status(400).json({ message: 'Pipeline ID is required' });
      }

      // Set owner ID to current user if not provided
      if (!req.body.ownerId) {
        req.body.ownerId = userId;
      }

      const deal = await this.dealService.create(req.body, userId);
      return res.status(201).json(deal);
    } catch (error) {
      console.error('Error creating deal:', error);
      return res.status(500).json({ message: 'Failed to create deal', error: (error as Error).message });
    }
  }

  /**
   * Get a deal by ID
   */
  async getDeal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const deal = await this.dealService.getById(id, companyId);

      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }

      return res.json(deal);
    } catch (error) {
      console.error('Error getting deal:', error);
      return res.status(500).json({ message: 'Failed to get deal', error: (error as Error).message });
    }
  }

  /**
   * Update a deal
   */
  async updateDeal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Set company ID from the authenticated user if not provided
      if (!req.body.companyId) {
        req.body.companyId = companyId;
      }

      const deal = await this.dealService.update(id, req.body, userId);

      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }

      return res.json(deal);
    } catch (error) {
      console.error('Error updating deal:', error);
      return res.status(500).json({ message: 'Failed to update deal', error: (error as Error).message });
    }
  }

  /**
   * Delete a deal
   */
  async deleteDeal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const success = await this.dealService.delete(id, companyId, userId);

      if (!success) {
        return res.status(404).json({ message: 'Deal not found' });
      }

      return res.json({ message: 'Deal deleted successfully' });
    } catch (error) {
      console.error('Error deleting deal:', error);
      return res.status(500).json({ message: 'Failed to delete deal', error: (error as Error).message });
    }
  }

  /**
   * List deals with filtering, sorting, and pagination
   */
  async listDeals(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const {
        page = '1',
        limit = '20',
        searchTerm,
        pipelineId,
        stageId,
        customerId,
        status,
        ownerId,
        isActive,
        sortBy,
        sortDirection,
        minAmount,
        maxAmount,
        expectedCloseDateStart,
        expectedCloseDateEnd
      } = req.query;

      const options = {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        searchTerm: searchTerm as string,
        pipelineId: pipelineId as string,
        stageId: stageId as string,
        customerId: customerId as string,
        status: status as string,
        ownerId: ownerId as string,
        isActive: isActive === undefined ? undefined : isActive === 'true',
        sortBy: sortBy as string,
        sortDirection: (sortDirection as 'asc' | 'desc') || 'desc',
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
        expectedCloseDateStart: expectedCloseDateStart ? new Date(expectedCloseDateStart as string) : undefined,
        expectedCloseDateEnd: expectedCloseDateEnd ? new Date(expectedCloseDateEnd as string) : undefined
      };

      const { data, total } = await this.dealService.list(companyId, options);

      return res.json({
        data,
        meta: {
          total,
          page: options.page,
          limit: options.limit,
          totalPages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      console.error('Error listing deals:', error);
      return res.status(500).json({ message: 'Failed to list deals', error: (error as Error).message });
    }
  }

  /**
   * Get deals by customer ID
   */
  async getDealsByCustomer(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const deals = await this.dealService.getByCustomerId(customerId, companyId);
      return res.json(deals);
    } catch (error) {
      console.error('Error getting deals by customer:', error);
      return res.status(500).json({ message: 'Failed to get deals by customer', error: (error as Error).message });
    }
  }

  /**
   * Get deal stage history
   */
  async getDealStageHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const history = await this.dealService.getStageHistory(id, companyId);
      return res.json(history);
    } catch (error) {
      console.error('Error getting deal stage history:', error);
      return res.status(500).json({ message: 'Failed to get deal stage history', error: (error as Error).message });
    }
  }

  /**
   * Move a deal to a different stage
   */
  async moveDealToStage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stageId, reason } = req.body;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!stageId) {
        return res.status(400).json({ message: 'Stage ID is required' });
      }

      const deal = await this.dealService.moveToStage(id, stageId, companyId, userId, reason);

      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }

      return res.json(deal);
    } catch (error) {
      console.error('Error moving deal to stage:', error);
      return res.status(500).json({ message: 'Failed to move deal to stage', error: (error as Error).message });
    }
  }

  /**
   * Get deal statistics
   */
  async getDealStatistics(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { pipelineId } = req.query;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const statistics = await this.dealService.getDealStats(companyId, pipelineId as string);
      return res.json(statistics);
    } catch (error) {
      console.error('Error getting deal statistics:', error);
      return res.status(500).json({ message: 'Failed to get deal statistics', error: (error as Error).message });
    }
  }

  /**
   * Get upcoming deals
   */
  async getUpcomingDeals(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { days = '30' } = req.query;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const deals = await this.dealService.getUpcomingDeals(companyId, parseInt(days as string, 10));
      return res.json(deals);
    } catch (error) {
      console.error('Error getting upcoming deals:', error);
      return res.status(500).json({ message: 'Failed to get upcoming deals', error: (error as Error).message });
    }
  }

  /**
   * Get recently updated deals
   */
  async getRecentlyUpdatedDeals(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      const { limit = '10' } = req.query;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const deals = await this.dealService.getRecentlyUpdatedDeals(companyId, parseInt(limit as string, 10));
      return res.json(deals);
    } catch (error) {
      console.error('Error getting recently updated deals:', error);
      return res.status(500).json({ message: 'Failed to get recently updated deals', error: (error as Error).message });
    }
  }

  /**
   * Get stale deals
   */
  async getStaleDeals(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const deals = await this.dealService.getStaleDeals(companyId);
      return res.json(deals);
    } catch (error) {
      console.error('Error getting stale deals:', error);
      return res.status(500).json({ message: 'Failed to get stale deals', error: (error as Error).message });
    }
  }
}