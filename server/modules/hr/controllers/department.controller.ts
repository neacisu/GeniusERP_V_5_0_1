/**
 * Department Controller
 * 
 * Handles HTTP requests related to departments, including:
 * - Department creation
 * - Department listing
 * - Department employee listings
 */

import { Router, Response, Request } from 'express';
import { EmployeeService } from '../services/employee.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { AuthenticatedRequest } from '../../../types/express';
import { Logger } from '../../../common/logger';

// Initialize logger
const logger = new Logger('DepartmentController');

export class DepartmentController {
  constructor(private readonly employeeService: EmployeeService) {}

  registerRoutes(router: Router) {
    // Department endpoints
    router.get('/departments', this.getDepartments.bind(this));
    router.post('/departments', this.createDepartment.bind(this));
    router.get('/departments/:id/employees', this.getEmployeesByDepartment.bind(this));
  }

  /**
   * Get all departments for a company
   */
  async getDepartments(req: AuthenticatedRequest, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID is required' 
        });
      }
      
      const departments = await this.employeeService.getDepartments(companyId, includeInactive);
      res.json(departments);
    } catch (error) {
      logger.error('Error retrieving departments:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to retrieve departments',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Create a new department
   */
  async createDepartment(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description, managerId, parentDepartmentId } = req.body;
      
      const result = await this.employeeService.createDepartment(
        req.user.companyId,
        name,
        description,
        managerId,
        parentDepartmentId,
        req.user.id
      );
      
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error creating department:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get employees by department ID
   */
  async getEmployeesByDepartment(req: AuthenticatedRequest, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const employees = await this.employeeService.getEmployeesByDepartment(req.params.id, includeInactive);
      res.json(employees);
    } catch (error) {
      logger.error('Error retrieving department employees:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}