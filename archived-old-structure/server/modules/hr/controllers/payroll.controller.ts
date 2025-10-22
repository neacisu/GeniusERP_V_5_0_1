/**
 * Payroll Controller
 * 
 * Handles HTTP requests related to payroll, including:
 * - Employee payroll calculation
 * - Company payroll processing
 * - Payroll reporting and exports
 */

import { Router, Response } from 'express';
import { PayrollService } from '../services/payroll.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { AuthenticatedRequest } from '../../../types/express';
import { Logger } from '../../../common/logger';

// Initialize logger
const logger = new Logger('PayrollController');

export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  registerRoutes(router: Router) {
    // Payroll endpoints
    router.post('/payroll/calculate', this.calculateEmployeePayroll.bind(this) as any);
    router.post('/payroll/process-company', this.processCompanyPayroll.bind(this) as any);
    router.get('/payroll/reports/:year/:month', this.getPayrollReport.bind(this) as any);
    router.get('/payroll/employee/:id', this.getEmployeePayrollHistory.bind(this) as any);
    router.post('/payroll/export', this.exportPayroll.bind(this) as any);
  }

  /**
   * Calculate payroll for a single employee
   */
  async calculateEmployeePayroll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { employeeId, year, month } = req.body;
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const result = await this.payrollService.calculateEmployeePayroll(
        employeeId,
        req.user.companyId,
        year,
        month,
        req.user.id
      );
      
      res.json(result);
    } catch (error: any) {
      logger.error('Error calculating payroll:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Process payroll for an entire company
   */
  async processCompanyPayroll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { year, month } = req.body;
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const result = await this.payrollService.processCompanyPayroll(
        req.user.companyId,
        year,
        month,
        req.user.id
      );
      
      res.json(result);
    } catch (error: any) {
      logger.error('Error processing company payroll:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get a payroll report for a specific month
   */
  async getPayrollReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { year, month } = req.params;
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const report = await this.payrollService.getPayrollReport(
        req.user.companyId,
        parseInt(year),
        month ? parseInt(month) : undefined
      );
      
      res.json(report);
    } catch (error: any) {
      logger.error('Error retrieving payroll report:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get payroll history for a specific employee
   */
  async getEmployeePayrollHistory(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const employeeId = req.params.id;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
      
      const history = await this.payrollService.getEmployeePayrollHistory(
        employeeId,
        year,
        limit
      );
      
      res.json(history);
    } catch (error: any) {
      logger.error('Error retrieving employee payroll history:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Export payroll data in various formats
   */
  async exportPayroll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { year, month, format } = req.body;
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const exportData = await this.payrollService.exportPayroll(
        req.user.companyId,
        year,
        month,
        format || 'csv'
      );
      
      res.json(exportData);
    } catch (error: any) {
      logger.error('Error exporting payroll:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}