/**
 * Department Service
 * 
 * This service handles department operations including:
 * - Department creation and management
 * - Department hierarchy
 * - Employee-department associations
 */

import { getDrizzle } from '../../../common/drizzle';
import { employees, departments } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../../audit/services/audit.service';
import { AuditAction, AuditResourceType } from '../../../common/enums/audit.enum';
import { eq, sql, asc, desc } from 'drizzle-orm';
import { Logger } from '../../../common/logger';

export class DepartmentService {
  private db: any;
  private auditService: AuditService;
  private logger = new Logger('DepartmentService');

  constructor() {
    this.db = getDrizzle();
    this.auditService = new AuditService();
  }

  /**
   * Create a new department
   */
  async createDepartment(
    companyId: string,
    name: string,
    description: string | null,
    managerId: string | null,
    parentDepartmentId: string | null,
    userId: string,
    isActive: boolean = true
  ) {
    try {
      // Validate parent department if provided
      if (parentDepartmentId) {
        const parentDept = await this.db.select()
          .from(departments)
          .where(sql`
            ${departments.id} = ${parentDepartmentId} AND
            ${departments.companyId} = ${companyId}
          `)
          .execute();

        if (!parentDept || parentDept.length === 0) {
          throw new Error('Parent department not found or does not belong to the company');
        }
      }

      // Create department
      const department = await this.db.insert(departments)
        .values({
          id: uuidv4(),
          companyId,
          name,
          description,
          managerId,
          parentDepartmentId,
          isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId
        })
        .returning()
        .execute();

      // Log department creation
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.DEPARTMENT,
        resourceId: department[0].id,
        newValue: JSON.stringify(department[0]),
        companyId
      });

      return department[0];
    } catch (error) {
      this.logger.error('Failed to create department:', error);
      throw error;
    }
  }

  /**
   * Get departments for a company with hierarchy information
   */
  async getDepartments(companyId: string, includeInactive: boolean = false) {
    try {
      let query = this.db.select()
        .from(departments)
        .where(sql`${departments.companyId} = ${companyId}`);

      if (!includeInactive) {
        query = query.where(sql`${departments.isActive} = true`);
      }

      const result = await query.orderBy(asc(departments.name)).execute();
      
      // Organize departments into hierarchy
      const departmentsMap = {};
      const rootDepartments = [];

      // First, create a map of all departments
      result.forEach(department => {
        departmentsMap[department.id] = {
          ...department,
          children: []
        };
      });

      // Build the hierarchy
      result.forEach(department => {
        if (department.parentDepartmentId && departmentsMap[department.parentDepartmentId]) {
          departmentsMap[department.parentDepartmentId].children.push(departmentsMap[department.id]);
        } else {
          rootDepartments.push(departmentsMap[department.id]);
        }
      });

      return rootDepartments;
    } catch (error) {
      this.logger.error('Failed to get departments:', error);
      throw error;
    }
  }

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(departmentId: string, includeInactive: boolean = false) {
    try {
      let query = this.db.select()
        .from(employees)
        .where(sql`${employees.departmentId} = ${departmentId}`);

      if (!includeInactive) {
        query = query.where(sql`${employees.isActive} = true`);
      }

      const result = await query
        .orderBy(asc(employees.lastName), asc(employees.firstName))
        .execute();

      return result;
    } catch (error) {
      this.logger.error('Failed to get employees by department:', error);
      throw error;
    }
  }

  /**
   * Update a department
   */
  async updateDepartment(
    departmentId: string,
    companyId: string,
    updates: any,
    userId: string
  ) {
    try {
      // Get current department for audit
      const currentDepartment = await this.db.select()
        .from(departments)
        .where(sql`
          ${departments.id} = ${departmentId} AND
          ${departments.companyId} = ${companyId}
        `)
        .execute();

      if (!currentDepartment || currentDepartment.length === 0) {
        throw new Error('Department not found or does not belong to the company');
      }

      // Validate parent department if being updated
      if (updates.parentDepartmentId && updates.parentDepartmentId !== currentDepartment[0].parentDepartmentId) {
        // Prevent circular references
        if (updates.parentDepartmentId === departmentId) {
          throw new Error('Department cannot be its own parent');
        }

        const parentDept = await this.db.select()
          .from(departments)
          .where(sql`
            ${departments.id} = ${updates.parentDepartmentId} AND
            ${departments.companyId} = ${companyId}
          `)
          .execute();

        if (!parentDept || parentDept.length === 0) {
          throw new Error('Parent department not found or does not belong to the company');
        }

        // Check for circular references in the hierarchy
        let currentParentId = parentDept[0].parentDepartmentId;
        while (currentParentId) {
          if (currentParentId === departmentId) {
            throw new Error('Circular reference detected in department hierarchy');
          }

          const parent = await this.db.select()
            .from(departments)
            .where(sql`${departments.id} = ${currentParentId}`)
            .execute();

          if (!parent || parent.length === 0) {
            break;
          }
          
          currentParentId = parent[0].parentDepartmentId;
        }
      }

      // Update department
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      };

      const updated = await this.db.update(departments)
        .set(updateData)
        .where(sql`${departments.id} = ${departmentId}`)
        .returning()
        .execute();

      // Log department update
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.DEPARTMENT,
        resourceId: departmentId,
        oldValue: JSON.stringify(currentDepartment[0]),
        newValue: JSON.stringify(updated[0]),
        companyId
      });

      return updated[0];
    } catch (error) {
      this.logger.error('Failed to update department:', error);
      throw error;
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(departmentId: string, companyId: string) {
    try {
      const departments = await this.db.select()
        .from(departments)
        .where(sql`
          ${departments.id} = ${departmentId} AND
          ${departments.companyId} = ${companyId}
        `)
        .execute();

      return departments.length > 0 ? departments[0] : null;
    } catch (error) {
      this.logger.error('Failed to get department by ID:', error);
      throw error;
    }
  }

  /**
   * Change department manager
   */
  async changeDepartmentManager(
    departmentId: string,
    companyId: string,
    managerId: string,
    userId: string
  ) {
    try {
      // Validate department
      const department = await this.getDepartmentById(departmentId, companyId);
      if (!department) {
        throw new Error('Department not found or does not belong to the company');
      }

      // Validate manager (must be an employee)
      const manager = await this.db.select()
        .from(employees)
        .where(sql`
          ${employees.id} = ${managerId} AND
          ${employees.companyId} = ${companyId} AND
          ${employees.isActive} = true
        `)
        .execute();

      if (!manager || manager.length === 0) {
        throw new Error('Manager not found or not an active employee');
      }

      // Update department manager
      const updated = await this.db.update(departments)
        .set({
          managerId,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(sql`${departments.id} = ${departmentId}`)
        .returning()
        .execute();

      // Log manager change
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.DEPARTMENT,
        resourceId: departmentId,
        oldValue: JSON.stringify({ managerId: department.managerId }),
        newValue: JSON.stringify({ managerId }),
        companyId
      });

      return updated[0];
    } catch (error) {
      this.logger.error('Failed to change department manager:', error);
      throw error;
    }
  }

  /**
   * Deactivate a department
   */
  async deactivateDepartment(
    departmentId: string,
    companyId: string,
    userId: string
  ) {
    try {
      // Get current department
      const department = await this.getDepartmentById(departmentId, companyId);
      if (!department) {
        throw new Error('Department not found or does not belong to the company');
      }

      // Check for active sub-departments
      const subDepartments = await this.db.select()
        .from(departments)
        .where(sql`
          ${departments.parentDepartmentId} = ${departmentId} AND
          ${departments.isActive} = true
        `)
        .execute();

      if (subDepartments && subDepartments.length > 0) {
        throw new Error('Cannot deactivate department with active sub-departments');
      }

      // Check for active employees in the department
      const activeEmployees = await this.db.select()
        .from(employees)
        .where(sql`
          ${employees.departmentId} = ${departmentId} AND
          ${employees.isActive} = true
        `)
        .execute();

      if (activeEmployees && activeEmployees.length > 0) {
        throw new Error('Cannot deactivate department with active employees');
      }

      // Deactivate department
      const updated = await this.db.update(departments)
        .set({
          isActive: false,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(sql`${departments.id} = ${departmentId}`)
        .returning()
        .execute();

      // Log deactivation
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.DEPARTMENT,
        resourceId: departmentId,
        oldValue: JSON.stringify({ isActive: true }),
        newValue: JSON.stringify({ isActive: false }),
        companyId
      });

      return updated[0];
    } catch (error) {
      this.logger.error('Failed to deactivate department:', error);
      throw error;
    }
  }
}