/**
 * Contract Controller
 * 
 * Handles HTTP requests related to employee contracts, including:
 * - Contract creation and updates
 * - Contract history retrieval
 */

import { Router, Response } from 'express';
import { ContractService } from '../services/contract.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { AuthenticatedRequest } from '../../../types/express';
import { Logger } from '../../../common/logger';

// Initialize logger
const logger = new Logger('ContractController');

export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  registerRoutes(router: Router) {
    // Employment contracts endpoints
    router.post('/contracts', 
      AuthGuard.roleGuard(['hr_team', 'admin']),
      AuthGuard.companyGuard('companyId'),
      this.createContract.bind(this) as any
    );
    
    router.get('/contracts/:employeeId', 
      AuthGuard.roleGuard(['hr_team', 'admin']),
      AuthGuard.companyGuard('companyId'),
      this.getContractsByEmployeeId.bind(this) as any
    );
    
    router.put('/contracts/:id', 
      AuthGuard.roleGuard(['hr_team', 'admin']),
      AuthGuard.companyGuard('companyId'),
      this.updateContract.bind(this) as any
    );
  }

  /**
   * Create an employment contract
   */
  async createContract(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { 
        employeeId, contractNumber, contractType, startDate, endDate,
        baseSalaryGross, workingTime, corCode, annualVacationDays,
        contractFilePath, annexesFilePaths
      } = req.body;
      
      if (!employeeId || !contractNumber || !contractType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID, contract number, and contract type are required' 
        });
      }
      
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      
      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID and user ID are required' 
        });
      }
      
      const result = await this.contractService.createEmploymentContract(
        employeeId,
        companyId,
        contractNumber,
        contractType,
        startDate ? new Date(startDate) : new Date(),
        endDate ? new Date(endDate) : null,
        baseSalaryGross,
        workingTime,
        corCode,
        annualVacationDays,
        userId,
        { contractFilePath, annexesFilePaths }
      );
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error creating employment contract:', error);
      res.status(400).json({ 
        success: false,
        message: 'An error occurred while creating the employment contract',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Get employment contracts by employee ID
   */
  async getContractsByEmployeeId(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.params.employeeId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID is required' 
        });
      }
      
      const contracts = await this.contractService.getEmploymentContractHistory(req.params.employeeId);
      
      res.json({
        success: true,
        data: contracts
      });
    } catch (error: any) {
      logger.error('Error retrieving employment contracts:', error);
      res.status(500).json({ 
        success: false,
        message: 'An error occurred while retrieving employment contracts',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Update an employment contract
   */
  async updateContract(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.params.id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Contract ID is required' 
        });
      }
      
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'User ID is required' 
        });
      }
      
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID is required' 
        });
      }
      
      const result = await this.contractService.updateEmploymentContract(
        req.params.id,
        companyId,
        userId,
        req.body
      );
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Error updating employment contract:', error);
      res.status(400).json({ 
        success: false,
        message: 'An error occurred while updating the employment contract',
        error: (error as Error).message 
      });
    }
  }
}