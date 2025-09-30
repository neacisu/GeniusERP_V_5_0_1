/**
 * Commission Controller
 * 
 * Handles HTTP requests related to sales commissions, including:
 * - Commission structure management
 * - Commission calculation
 * - Commission approval and payment processes
 */

import { Router, Response } from 'express';
import { CommissionService } from '../services/commission.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { AuthenticatedRequest } from '../../../types/express';
import { Logger } from '../../../common/logger';

// Initialize logger
const logger = new Logger('CommissionController');

export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  registerRoutes(router: Router) {
    // Commission endpoints
    router.post('/commissions/structures', this.createCommissionStructure.bind(this));
    router.put('/commissions/structures/:id', this.updateCommissionStructure.bind(this));
    router.get('/commissions/structures', this.getCommissionStructures.bind(this));
    router.post('/commissions/calculate', this.calculateCommission.bind(this));
    router.post('/commissions', this.createCommission.bind(this));
    router.get('/commissions', this.getCommissions.bind(this));
    router.put('/commissions/:id/approve', this.approveCommission.bind(this));
    router.put('/commissions/:id/mark-paid', this.markCommissionPaid.bind(this));
    router.get('/commissions/employee/:id', this.getEmployeeCommissions.bind(this));
    router.get('/commissions/summary', this.getCommissionSummary.bind(this));
    router.get('/commissions/:id', this.getCommissionById.bind(this));
  }

  /**
   * Create a new commission structure
   */
  async createCommissionStructure(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, type, rules, isActive } = req.body;
      
      if (!name || !type || !rules) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name, type, and rules are required' 
        });
      }
      
      const result = await this.commissionService.createCommissionStructure(
        req.user.companyId,
        name,
        type,
        rules,
        isActive !== false,
        req.user.id
      );
      
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error creating commission structure:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Update an existing commission structure
   */
  async updateCommissionStructure(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await this.commissionService.updateCommissionStructure(
        req.params.id,
        req.body,
        req.user.id
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error updating commission structure:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get all commission structures for a company
   */
  async getCommissionStructures(req: AuthenticatedRequest, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      
      const structures = await this.commissionService.getCommissionStructures(
        req.user.companyId,
        includeInactive
      );
      
      res.json(structures);
    } catch (error) {
      logger.error('Error retrieving commission structures:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Calculate commission for a period
   */
  async calculateCommission(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId, period, sales } = req.body;
      
      if (!employeeId || !period) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID and period are required' 
        });
      }
      
      const result = await this.commissionService.calculateCommission(
        req.user.companyId,
        employeeId,
        period,
        sales,
        req.user.id
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error calculating commission:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Approve a calculated commission
   */
  async approveCommission(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await this.commissionService.approveCommission(
        req.params.id,
        req.user.id
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error approving commission:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Mark a commission as paid
   */
  async markCommissionPaid(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentDate, paymentReference } = req.body;
      
      const result = await this.commissionService.markCommissionPaid(
        req.params.id,
        paymentDate ? new Date(paymentDate) : new Date(),
        paymentReference,
        req.user.id
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error marking commission as paid:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get commissions for a specific employee
   */
  async getEmployeeCommissions(req: AuthenticatedRequest, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      
      const commissions = await this.commissionService.getEmployeeCommissions(
        req.user.companyId,
        req.params.id,
        year
      );
      
      res.json(commissions);
    } catch (error) {
      logger.error('Error retrieving employee commissions:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get commission summary for the company
   */
  async getCommissionSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string) : null;
      
      const summary = await this.commissionService.getCommissionSummary(
        req.user.companyId,
        year,
        month
      );
      
      res.json(summary);
    } catch (error) {
      logger.error('Error retrieving commission summary:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
  
  /**
   * Create a new commission
   */
  async createCommission(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        employeeId, 
        structureId, 
        saleAmount, 
        saleId, 
        saleType, 
        period,
        metadata
      } = req.body;
      
      // Validate required fields
      if (!employeeId || !structureId || !saleAmount || !period) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID, structure ID, sale amount, and period are required' 
        });
      }
      
      // Calculate the commission using the service
      const result = await this.commissionService.calculateCommission(
        employeeId,
        req.user.companyId,
        structureId,
        saleAmount,
        saleId || '',
        saleType || 'manual',
        { 
          ...metadata || {}, 
          period,
          createdVia: 'commission_form'
        },
        req.user.id
      );
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error creating commission:', error);
      res.status(400).json({ 
        success: false,
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get all commissions for the company with filtering
   */
  async getCommissions(req: AuthenticatedRequest, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      const month = req.query.month ? parseInt(req.query.month as string) : null;
      const status = req.query.status as string || null;
      
      // Retrieves all commissions with optional filtering
      const commissions = await this.commissionService.getCompanyCommissions(
        req.user.companyId,
        year,
        month,
        status
      );
      
      res.json(commissions);
    } catch (error) {
      logger.error('Error retrieving commissions:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
  
  /**
   * Get a specific commission by ID
   */
  async getCommissionById(req: AuthenticatedRequest, res: Response) {
    try {
      const commissionId = req.params.id;
      
      const commission = await this.commissionService.getCommissionById(
        req.user.companyId,
        commissionId
      );
      
      if (!commission) {
        return res.status(404).json({ 
          success: false, 
          message: 'Commission not found' 
        });
      }
      
      res.json(commission);
    } catch (error) {
      logger.error('Error retrieving commission by ID:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}