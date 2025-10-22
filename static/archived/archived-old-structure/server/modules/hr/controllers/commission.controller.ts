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
    router.post('/commissions/structures', this.createCommissionStructure.bind(this) as any);
    router.put('/commissions/structures/:id', this.updateCommissionStructure.bind(this) as any);
    router.get('/commissions/structures', this.getCommissionStructures.bind(this) as any);
    router.post('/commissions/calculate', this.calculateCommission.bind(this) as any);
    router.post('/commissions', this.createCommission.bind(this) as any);
    router.get('/commissions', this.getCommissions.bind(this) as any);
    router.put('/commissions/:id/approve', this.approveCommission.bind(this) as any);
    router.put('/commissions/:id/mark-paid', this.markCommissionPaid.bind(this) as any);
    router.get('/commissions/employee/:id', this.getEmployeeCommissions.bind(this) as any);
    router.get('/commissions/summary', this.getCommissionSummary.bind(this) as any);
    router.get('/commissions/:id', this.getCommissionById.bind(this) as any);
  }

  /**
   * Create a new commission structure
   */
  async createCommissionStructure(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { name, type, rules, isActive } = req.body;
      
      if (!name || !type || !rules) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name, type, and rules are required' 
        });
      }
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const result = await this.commissionService.createCommissionStructure(
        req.user.companyId,
        name,
        '', // description
        type,
        rules,
        isActive !== false,
        req.user.id
      );
      
      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Error creating commission structure:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Update an existing commission structure
   */
  async updateCommissionStructure(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const result = await this.commissionService.updateCommissionStructure(
        req.params.id,
        req.body,
        req.user.id
      );
      
      res.json(result);
    } catch (error: any) {
      logger.error('Error updating commission structure:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get all commission structures for a company
   */
  async getCommissionStructures(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const includeInactive = req.query.includeInactive === 'true';
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const structures = await this.commissionService.getCommissionStructures(
        req.user.companyId,
        includeInactive
      );
      
      res.json(structures);
    } catch (error: any) {
      logger.error('Error retrieving commission structures:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Calculate commission for a period
   */
  async calculateCommission(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { employeeId, structureId, saleAmount, saleId, saleType, metadata = {} } = req.body;
      
      if (!employeeId || !structureId || !saleAmount) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID, structure ID, and sale amount are required' 
        });
      }
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const result = await this.commissionService.calculateCommission(
        employeeId,
        req.user.companyId,
        structureId,
        saleAmount,
        saleId || '',
        saleType || 'sale',
        metadata,
        req.user.id
      );
      
      res.json(result);
    } catch (error: any) {
      logger.error('Error calculating commission:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Approve a calculated commission
   */
  async approveCommission(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const result = await this.commissionService.approveCommission(
        req.params.id,
        req.user.id
      );
      
      res.json(result);
    } catch (error: any) {
      logger.error('Error approving commission:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Mark a commission as paid
   */
  async markCommissionPaid(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { paymentDate, paymentReference } = req.body;
      
      const result = await this.commissionService.markCommissionAsPaid(
        req.params.id,
        paymentReference,
        req.user.id
      );
      
      res.json(result);
    } catch (error: any) {
      logger.error('Error marking commission as paid:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get commissions for a specific employee
   */
  async getEmployeeCommissions(req: AuthenticatedRequest, res: Response) {
    try {
      const status = req.query.status as any; // CommissionStatus or undefined
      const timeframe = req.query.timeframe as 'month' | 'quarter' | 'year' | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const commissions = await this.commissionService.getEmployeeCommissions(
        req.params.id, // employeeId
        status,
        timeframe,
        limit
      );
      
      res.json(commissions);
    } catch (error: any) {
      logger.error('Error retrieving employee commissions:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get commission summary for the company
   */
  async getCommissionSummary(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const summary = await this.commissionService.getCommissionSummary(
        req.user.companyId,
        year,
        month
      );
      
      res.json(summary);
    } catch (error: any) {
      logger.error('Error retrieving commission summary:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
  
  /**
   * Create a new commission
   */
  async createCommission(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
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
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
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
    } catch (error: any) {
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
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      const month = req.query.month ? parseInt(req.query.month as string) : null;
      const status = req.query.status as string || null;
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      // Retrieves all commissions with optional filtering
      const commissions = await this.commissionService.getCompanyCommissions(
        req.user.companyId,
        year,
        month,
        status
      );
      
      res.json(commissions);
    } catch (error: any) {
      logger.error('Error retrieving commissions:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
  
  /**
   * Get a specific commission by ID
   */
  async getCommissionById(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const commissionId = req.params.id;
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
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
    } catch (error: any) {
      logger.error('Error retrieving commission by ID:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}