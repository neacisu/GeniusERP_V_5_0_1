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
    router.post('/payroll/calculate', this.calculateEmployeePayroll.bind(this));
    router.post('/payroll/process-company', this.processCompanyPayroll.bind(this));
    router.get('/payroll/reports/:year/:month', this.getPayrollReport.bind(this));
    router.get('/payroll/employee/:id', this.getEmployeePayrollHistory.bind(this));
    router.post('/payroll/export', this.exportPayroll.bind(this));
  }

  /**
   * Calculate payroll for a single employee
   */
  async calculateEmployeePayroll(req: AuthenticatedRequest, res: Response) {
    try {
      const { employeeId, year, month } = req.body;
      
      const result = await this.payrollService.calculateEmployeePayroll(
        employeeId,
        req.user.companyId,
        year,
        month,
        req.user.id
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error calculating payroll:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Process payroll for an entire company
   */
  async processCompanyPayroll(req: AuthenticatedRequest, res: Response) {
    try {
      const { year, month } = req.body;
      
      const result = await this.payrollService.processCompanyPayroll(
        req.user.companyId,
        year,
        month,
        req.user.id
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error processing company payroll:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get a payroll report for a specific month
   */
  async getPayrollReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { year, month } = req.params;
      
      const report = await this.payrollService.getPayrollReport(
        req.user.companyId,
        parseInt(year),
        parseInt(month)
      );
      
      res.json(report);
    } catch (error) {
      logger.error('Error retrieving payroll report:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get payroll history for a specific employee
   */
  async getEmployeePayrollHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.params.id;
      
      const history = await this.payrollService.getEmployeePayrollHistory(
        employeeId,
        req.user.companyId
      );
      
      res.json(history);
    } catch (error) {
      logger.error('Error retrieving employee payroll history:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Export payroll data in various formats
   */
  async exportPayroll(req: AuthenticatedRequest, res: Response) {
    try {
      const { year, month, format } = req.body;
      
      const exportData = await this.payrollService.exportPayroll(
        req.user.companyId,
        year,
        month,
        format || 'excel'
      );
      
      res.json(exportData);
    } catch (error) {
      logger.error('Error exporting payroll:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}