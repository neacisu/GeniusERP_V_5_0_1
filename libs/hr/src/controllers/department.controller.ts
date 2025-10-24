/**
 * Department Controller
 * 
 * Handles HTTP requests related to departments, including:
 * - Department creation
 * - Department listing
 * - Department employee listings
 */

import { Router, Response, Request } from 'express';
import { DepartmentService } from '../services/department.service';
import { EmployeeService } from '../services/employee.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { AuthenticatedRequest } from '../../../types/express';
import { createModuleLogger } from "@common/logger/loki-logger";

// Initialize logger
const logger = createModuleLogger('DepartmentController');

export class DepartmentController {
  constructor(
    private readonly departmentService: DepartmentService,
    private readonly employeeService: EmployeeService
  ) {}

  registerRoutes(router: Router) {
    // Department endpoints
    router.get('/departments', this.getDepartments.bind(this) as any);
    router.post('/departments', this.createDepartment.bind(this) as any);
    router.get('/departments/:id/employees', this.getEmployeesByDepartment.bind(this) as any);
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
      
      const departments = await this.departmentService.getDepartments(companyId, includeInactive);
      res.json(departments);
    } catch (error: any) {
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
      
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      if (!req.user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      
      const result = await this.departmentService.createDepartment(
        req.user.companyId,
        name,
        description,
        managerId,
        parentDepartmentId,
        req.user.id
      );
      
      res.status(201).json(result);
    } catch (error: any) {
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
    } catch (error: any) {
      logger.error('Error retrieving department employees:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}