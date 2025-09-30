/**
 * Employee Service
 * 
 * This service handles employee management operations including:
 * - Employee CRUD operations
 * - Employment contract management
 * - Employee-department associations
 * - Employee search and filtering
 */

import { getDrizzle } from '../../../common/drizzle/drizzle.service';
import { employees, employmentContracts, departments } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../../audit/services/audit.service';
import { AuditAction, AuditResourceType } from '../../../common/enums/audit.enum';

export enum EmploymentContractType {
  STANDARD = 'standard',
  PART_TIME = 'part_time',
  TEMPORARY = 'temporary',
  INTERNSHIP = 'internship',
  APPRENTICESHIP = 'apprenticeship',
  HOME_BASED = 'home_based'
}

export enum EmploymentContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  TRANSFERRED = 'transferred'
}

export class EmployeeService {
  private db: any;
  private auditService: AuditService;

  constructor() {
    this.db = getDrizzle();
    this.auditService = new AuditService();
  }

  /**
   * Create a new employee record
   * 
   * @param companyId Company ID
   * @param firstName First name
   * @param lastName Last name
   * @param email Email address
   * @param phone Phone number
   * @param position Job position
   * @param departmentId Department ID
   * @param cnp Personal numeric code (Romanian CNP)
   * @param address Address
   * @param birthDate Birth date
   * @param hireDate Hire date
   * @param data Additional employee data
   * @param userId User ID creating the employee
   */
  async createEmployee(
    companyId: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    position: string,
    departmentId: string | null,
    cnp: string,
    address: string,
    birthDate: Date,
    hireDate: Date,
    data: Record<string, any>,
    userId: string
  ) {
    try {
      // Validate CNP (Romanian personal numeric code)
      this.validateRomanianCnp(cnp);
      
      // Check if employee with same CNP already exists
      const existingEmployee = await this.db.query(
        `SELECT * FROM hr_employees WHERE cnp = $1 AND company_id = $2`,
        [cnp, companyId]
      );
      
      if (existingEmployee.rows && existingEmployee.rows.length > 0) {
        throw new Error('Employee with the same CNP already exists');
      }
      
      // Create employee record
      const employeeId = uuidv4();
      await this.db.query(
        `INSERT INTO hr_employees (
          id, company_id, first_name, last_name, email, phone,
          position, department_id, cnp, address, birth_date, hire_date,
          employee_data, is_active, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15
        )`,
        [
          employeeId, companyId, firstName, lastName, email, phone,
          position, departmentId, cnp, address, birthDate, hireDate,
          JSON.stringify(data), true, userId
        ]
      );
      
      // Audit the creation
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.EMPLOYEE,
        resourceId: employeeId,
        metadata: {
          companyId,
          firstName,
          lastName,
          cnp
        }
      });
      
      return {
        id: employeeId,
        firstName,
        lastName,
        position,
        hireDate
      };
    } catch (error) {
      console.error('Error creating employee:', error);
      throw new Error(`Failed to create employee: ${error.message}`);
    }
  }

  /**
   * Create an employment contract for an employee
   * 
   * @param employeeId Employee ID
   * @param companyId Company ID
   * @param contractNumber Contract number
   * @param contractType Contract type
   * @param startDate Contract start date
   * @param endDate Contract end date (null for indefinite contracts)
   * @param baseSalaryGross Gross base salary
   * @param workingTime Working time (full_time or part_time_X)
   * @param corCode Romanian COR code (occupation code)
   * @param contractFilePath Path to contract file
   * @param annexesFilePaths Paths to contract annexes
   * @param userId User ID creating the contract
   */
  async createEmploymentContract(
    employeeId: string,
    companyId: string,
    contractNumber: string,
    contractType: EmploymentContractType,
    startDate: Date,
    endDate: Date | null,
    baseSalaryGross: number,
    workingTime: string,
    corCode: string,
    annualVacationDays: number,
    contractFilePath: string | null,
    annexesFilePaths: string[] | null,
    userId: string
  ) {
    try {
      // Validate COR code
      this.validateRomanianCorCode(corCode);
      
      // Check if employee exists
      const employee = await this.db.query(
        `SELECT * FROM hr_employees WHERE id = $1 AND company_id = $2`,
        [employeeId, companyId]
      );
      
      if (!employee.rows || employee.rows.length === 0) {
        throw new Error('Employee not found');
      }
      
      // Check if there is already an active contract
      const activeContract = await this.db.query(
        `SELECT * FROM hr_employment_contracts 
         WHERE employee_id = $1 AND status = $2`,
        [employeeId, EmploymentContractStatus.ACTIVE]
      );
      
      if (activeContract.rows && activeContract.rows.length > 0) {
        throw new Error('Employee already has an active contract');
      }
      
      // Create contract record
      const contractId = uuidv4();
      await this.db.query(
        `INSERT INTO hr_employment_contracts (
          id, company_id, employee_id, contract_number, contract_type,
          start_date, end_date, is_indefinite, base_salary_gross,
          working_time, cor_code, annual_vacation_days, status,
          contract_file_path, annexes_file_paths, created_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16
        )`,
        [
          contractId, companyId, employeeId, contractNumber, contractType,
          startDate, endDate, endDate === null, baseSalaryGross,
          workingTime, corCode, annualVacationDays, EmploymentContractStatus.ACTIVE,
          contractFilePath, JSON.stringify(annexesFilePaths || []), userId
        ]
      );
      
      // Audit the contract creation
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.EMPLOYMENT_CONTRACT,
        resourceId: contractId,
        metadata: {
          employeeId,
          contractNumber,
          contractType,
          baseSalaryGross
        }
      });
      
      return {
        id: contractId,
        employeeId,
        contractNumber,
        contractType,
        startDate,
        status: EmploymentContractStatus.ACTIVE
      };
    } catch (error) {
      console.error('Error creating employment contract:', error);
      throw new Error(`Failed to create employment contract: ${error.message}`);
    }
  }

  /**
   * Validate Romanian CNP (Personal Numeric Code)
   * CNP format: SAALLZZJJNNNC
   * S: Gender/Century (1/2 = M/F born 1900-1999, 3/4 = M/F born 1800-1899, 5/6 = M/F born 2000-2099)
   * AA: Year of birth (last 2 digits)
   * LL: Month of birth
   * ZZ: Day of birth
   * JJ: County code
   * NNN: Sequence number
   * C: Control digit
   * 
   * @param cnp CNP to validate
   */
  private validateRomanianCnp(cnp: string): void {
    // Basic format check
    if (!cnp || cnp.length !== 13 || !/^\d+$/.test(cnp)) {
      throw new Error('Invalid CNP format - must be 13 digits');
    }
    
    // Gender/Century digit check
    const genderCentury = parseInt(cnp.charAt(0));
    if (genderCentury < 1 || genderCentury > 8) {
      throw new Error('Invalid CNP - first digit must be 1-8');
    }
    
    // Month check
    const month = parseInt(cnp.substring(3, 5));
    if (month < 1 || month > 12) {
      throw new Error('Invalid CNP - invalid month');
    }
    
    // Day check
    const day = parseInt(cnp.substring(5, 7));
    if (day < 1 || day > 31) {
      throw new Error('Invalid CNP - invalid day');
    }
    
    // County code check
    const countyCode = parseInt(cnp.substring(7, 9));
    if ((countyCode < 1 || countyCode > 46) && countyCode !== 51 && countyCode !== 52) {
      throw new Error('Invalid CNP - invalid county code');
    }
    
    // Control digit check
    const controlDigit = parseInt(cnp.charAt(12));
    const controlString = "279146358279";
    let sum = 0;
    
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnp.charAt(i)) * parseInt(controlString.charAt(i));
    }
    
    const remainder = sum % 11;
    const calculatedControl = remainder === 10 ? 1 : remainder;
    
    if (calculatedControl !== controlDigit) {
      throw new Error('Invalid CNP - control digit mismatch');
    }
  }

  /**
   * Validate Romanian COR code (Classification of Occupations in Romania)
   * COR code format: 6 digits representing the hierarchical occupation classification
   * 
   * @param corCode COR code to validate
   */
  private validateRomanianCorCode(corCode: string): void {
    if (!corCode || corCode.length !== 6 || !/^\d+$/.test(corCode)) {
      throw new Error('Invalid COR code format - must be 6 digits');
    }
    
    // Additional validation could check against a list of valid COR codes
    // This would typically involve an API call or a database lookup
  }

  /**
   * Update an employee record
   * 
   * @param employeeId Employee ID
   * @param updates Object containing fields to update
   * @param userId User ID performing the update
   */
  async updateEmployee(
    employeeId: string,
    updates: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      position: string;
      departmentId: string | null;
      address: string;
      data: Record<string, any>;
      isActive: boolean;
    }>,
    userId: string
  ) {
    try {
      // Get the current employee
      const currentEmployee = await this.db.query(
        `SELECT * FROM hr_employees WHERE id = $1`,
        [employeeId]
      );
      
      if (!currentEmployee.rows || currentEmployee.rows.length === 0) {
        throw new Error('Employee not found');
      }
      
      // Build update query
      let updateQuery = 'UPDATE hr_employees SET updated_by = $1, updated_at = NOW()';
      const params = [userId];
      let paramIndex = 2;
      
      if (updates.firstName !== undefined) {
        updateQuery += `, first_name = $${paramIndex++}`;
        params.push(updates.firstName);
      }
      
      if (updates.lastName !== undefined) {
        updateQuery += `, last_name = $${paramIndex++}`;
        params.push(updates.lastName);
      }
      
      if (updates.email !== undefined) {
        updateQuery += `, email = $${paramIndex++}`;
        params.push(updates.email);
      }
      
      if (updates.phone !== undefined) {
        updateQuery += `, phone = $${paramIndex++}`;
        params.push(updates.phone);
      }
      
      if (updates.position !== undefined) {
        updateQuery += `, position = $${paramIndex++}`;
        params.push(updates.position);
      }
      
      if (updates.departmentId !== undefined) {
        updateQuery += `, department_id = $${paramIndex++}`;
        params.push(updates.departmentId);
      }
      
      if (updates.address !== undefined) {
        updateQuery += `, address = $${paramIndex++}`;
        params.push(updates.address);
      }
      
      if (updates.data !== undefined) {
        updateQuery += `, employee_data = $${paramIndex++}`;
        params.push(JSON.stringify(updates.data));
      }
      
      if (updates.isActive !== undefined) {
        updateQuery += `, is_active = $${paramIndex++}`;
        params.push(updates.isActive);
      }
      
      updateQuery += ` WHERE id = $${paramIndex}`;
      params.push(employeeId);
      
      // Execute the update
      await this.db.query(updateQuery, params);
      
      // Audit the update
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EMPLOYEE,
        resourceId: employeeId,
        metadata: {
          updates: Object.keys(updates),
          employeeId
        }
      });
      
      // Get and return the updated employee
      const updated = await this.db.query(
        `SELECT * FROM hr_employees WHERE id = $1`,
        [employeeId]
      );
      
      return updated.rows[0];
    } catch (error) {
      console.error('Error updating employee:', error);
      throw new Error(`Failed to update employee: ${error.message}`);
    }
  }

  /**
   * Update an employment contract
   * 
   * @param contractId Contract ID
   * @param updates Object containing fields to update
   * @param userId User ID performing the update
   */
  async updateEmploymentContract(
    contractId: string,
    updates: Partial<{
      endDate: Date | null;
      baseSalaryGross: number;
      workingTime: string;
      status: EmploymentContractStatus;
      suspensionReason: string | null;
      terminationReason: string | null;
      terminationDate: Date | null;
      annexesFilePaths: string[] | null;
    }>,
    userId: string
  ) {
    try {
      // Get the current contract
      const currentContract = await this.db.query(
        `SELECT * FROM hr_employment_contracts WHERE id = $1`,
        [contractId]
      );
      
      if (!currentContract.rows || currentContract.rows.length === 0) {
        throw new Error('Employment contract not found');
      }
      
      // Build update query
      let updateQuery = 'UPDATE hr_employment_contracts SET updated_by = $1, updated_at = NOW()';
      const params = [userId];
      let paramIndex = 2;
      
      if (updates.endDate !== undefined) {
        updateQuery += `, end_date = $${paramIndex}, is_indefinite = ${updates.endDate === null}`;
        params.push(updates.endDate);
        paramIndex++;
      }
      
      if (updates.baseSalaryGross !== undefined) {
        updateQuery += `, base_salary_gross = $${paramIndex++}`;
        params.push(updates.baseSalaryGross);
      }
      
      if (updates.workingTime !== undefined) {
        updateQuery += `, working_time = $${paramIndex++}`;
        params.push(updates.workingTime);
      }
      
      if (updates.status !== undefined) {
        updateQuery += `, status = $${paramIndex++}`;
        params.push(updates.status);
      }
      
      if (updates.suspensionReason !== undefined) {
        updateQuery += `, suspension_reason = $${paramIndex++}`;
        params.push(updates.suspensionReason);
      }
      
      if (updates.terminationReason !== undefined) {
        updateQuery += `, termination_reason = $${paramIndex++}`;
        params.push(updates.terminationReason);
      }
      
      if (updates.terminationDate !== undefined) {
        updateQuery += `, termination_date = $${paramIndex++}`;
        params.push(updates.terminationDate);
      }
      
      if (updates.annexesFilePaths !== undefined) {
        updateQuery += `, annexes_file_paths = $${paramIndex++}`;
        params.push(JSON.stringify(updates.annexesFilePaths || []));
      }
      
      updateQuery += ` WHERE id = $${paramIndex}`;
      params.push(contractId);
      
      // Execute the update
      await this.db.query(updateQuery, params);
      
      // Audit the update
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EMPLOYMENT_CONTRACT,
        resourceId: contractId,
        metadata: {
          updates: Object.keys(updates),
          contractId
        }
      });
      
      // Get and return the updated contract
      const updated = await this.db.query(
        `SELECT * FROM hr_employment_contracts WHERE id = $1`,
        [contractId]
      );
      
      return updated.rows[0];
    } catch (error) {
      console.error('Error updating employment contract:', error);
      throw new Error(`Failed to update employment contract: ${error.message}`);
    }
  }

  /**
   * Get an employee by ID
   * 
   * @param employeeId Employee ID
   */
  async getEmployeeById(employeeId: string) {
    try {
      const result = await this.db.query(
        `SELECT e.*, d.name as department_name
         FROM hr_employees e
         LEFT JOIN hr_departments d ON e.department_id = d.id
         WHERE e.id = $1`,
        [employeeId]
      );
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Employee not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error retrieving employee:', error);
      throw new Error(`Failed to retrieve employee: ${error.message}`);
    }
  }

  /**
   * Get an employee's active employment contract
   * 
   * @param employeeId Employee ID
   */
  async getActiveEmploymentContract(employeeId: string) {
    try {
      const result = await this.db.query(
        `SELECT * FROM hr_employment_contracts
         WHERE employee_id = $1 AND status = $2`,
        [employeeId, EmploymentContractStatus.ACTIVE]
      );
      
      if (!result.rows || result.rows.length === 0) {
        return null; // No active contract
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error retrieving active employment contract:', error);
      throw new Error(`Failed to retrieve active employment contract: ${error.message}`);
    }
  }

  /**
   * Get employee contract history
   * 
   * @param employeeId Employee ID
   */
  async getEmploymentContractHistory(employeeId: string) {
    try {
      const result = await this.db.query(
        `SELECT * FROM hr_employment_contracts
         WHERE employee_id = $1
         ORDER BY start_date DESC`,
        [employeeId]
      );
      
      return result.rows || [];
    } catch (error) {
      console.error('Error retrieving employment contract history:', error);
      throw new Error(`Failed to retrieve employment contract history: ${error.message}`);
    }
  }

  /**
   * Search employees with various filters
   * 
   * @param companyId Company ID
   * @param searchTerm Search term for name or CNP
   * @param departmentId Optional department filter
   * @param isActive Whether to return only active employees
   * @param page Page number for pagination
   * @param limit Items per page
   */
  async searchEmployees(
    companyId: string,
    searchTerm: string | null,
    departmentId: string | null,
    isActive: boolean | null,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT e.*, d.name as department_name
        FROM hr_employees e
        LEFT JOIN hr_departments d ON e.department_id = d.id
        WHERE e.company_id = $1
      `;
      
      const params: any[] = [companyId];
      
      if (searchTerm) {
        query += ` AND (
          e.first_name ILIKE $${params.length + 1} OR
          e.last_name ILIKE $${params.length + 1} OR
          e.cnp LIKE $${params.length + 1} OR
          e.email ILIKE $${params.length + 1}
        )`;
        params.push(`%${searchTerm}%`);
      }
      
      if (departmentId) {
        query += ` AND e.department_id = $${params.length + 1}`;
        params.push(departmentId);
      }
      
      if (isActive !== null) {
        query += ` AND e.is_active = $${params.length + 1}`;
        params.push(isActive);
      }
      
      // Count query for total records
      const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
      const countResult = await this.db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);
      
      // Add sorting and pagination
      query += ` ORDER BY e.last_name ASC, e.first_name ASC
                 LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const result = await this.db.query(query, params);
      
      return {
        employees: result.rows || [],
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      console.error('Error searching employees:', error);
      throw new Error(`Failed to search employees: ${error.message}`);
    }
  }

  /**
   * Create a new department
   * 
   * @param companyId Company ID
   * @param name Department name
   * @param description Department description
   * @param managerId Optional manager employee ID
   * @param parentDepartmentId Optional parent department ID
   * @param userId User ID creating the department
   */
  async createDepartment(
    companyId: string,
    name: string,
    description: string,
    managerId: string | null,
    parentDepartmentId: string | null,
    userId: string
  ) {
    try {
      // Check if department name already exists
      const existingDepartment = await this.db.query(
        `SELECT * FROM hr_departments WHERE company_id = $1 AND name = $2`,
        [companyId, name]
      );
      
      if (existingDepartment.rows && existingDepartment.rows.length > 0) {
        throw new Error('Department with this name already exists');
      }
      
      // Create department record
      const departmentId = uuidv4();
      await this.db.query(
        `INSERT INTO hr_departments (
          id, company_id, name, description, manager_id,
          parent_department_id, is_active, created_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8
        )`,
        [
          departmentId, companyId, name, description, managerId,
          parentDepartmentId, true, userId
        ]
      );
      
      // Audit the creation
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.DEPARTMENT,
        resourceId: departmentId,
        metadata: {
          companyId,
          name,
          managerId,
          parentDepartmentId
        }
      });
      
      return {
        id: departmentId,
        name,
        description,
        managerId,
        parentDepartmentId
      };
    } catch (error) {
      console.error('Error creating department:', error);
      throw new Error(`Failed to create department: ${error.message}`);
    }
  }

  /**
   * Get departments for a company
   * 
   * @param companyId Company ID
   * @param includeInactive Whether to include inactive departments
   */
  async getDepartments(companyId: string, includeInactive: boolean = false) {
    try {
      let query = `
        SELECT d.*,
               CONCAT(m.first_name, ' ', m.last_name) as manager_name,
               p.name as parent_department_name
        FROM hr_departments d
        LEFT JOIN hr_employees m ON d.manager_id = m.id
        LEFT JOIN hr_departments p ON d.parent_department_id = p.id
        WHERE d.company_id = $1
      `;
      
      const params: any[] = [companyId];
      
      if (!includeInactive) {
        query += ` AND d.is_active = true`;
      }
      
      query += ` ORDER BY d.name ASC`;
      
      const result = await this.db.query(query, params);
      
      return result.rows || [];
    } catch (error) {
      console.error('Error retrieving departments:', error);
      throw new Error(`Failed to retrieve departments: ${error.message}`);
    }
  }

  /**
   * Get employees in a department
   * 
   * @param departmentId Department ID
   * @param includeInactive Whether to include inactive employees
   */
  async getEmployeesByDepartment(departmentId: string, includeInactive: boolean = false) {
    try {
      let query = `
        SELECT e.*
        FROM hr_employees e
        WHERE e.department_id = $1
      `;
      
      const params: any[] = [departmentId];
      
      if (!includeInactive) {
        query += ` AND e.is_active = true`;
      }
      
      query += ` ORDER BY e.last_name ASC, e.first_name ASC`;
      
      const result = await this.db.query(query, params);
      
      return result.rows || [];
    } catch (error) {
      console.error('Error retrieving employees by department:', error);
      throw new Error(`Failed to retrieve employees by department: ${error.message}`);
    }
  }
}