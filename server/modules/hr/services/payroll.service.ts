/**
 * Payroll Service
 * 
 * This service handles payroll calculations, processing, and recordkeeping
 * according to Romanian labor laws. It supports:
 * - Monthly payroll processing
 * - Tax calculations (CAS, CASS, income tax)
 * - Employer contributions
 * - Payslip generation
 * - Year-to-date totals
 */

import { getDrizzle } from '../../../common/drizzle';
import { employees, payrollLogs } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import AuditService from '../../audit/services/audit.service';
import { AuditAction, AuditResourceType } from '../../../common/enums/audit.enum';
import { sql } from 'drizzle-orm';

export class PayrollService {
  private db: ReturnType<typeof getDrizzle>;

  constructor() {
    this.db = getDrizzle();
  }

  /**
   * Calculate payroll for a specific employee
   * 
   * @param employeeId Employee ID
   * @param companyId Company ID
   * @param year Year for calculation
   * @param month Month for calculation (1-12)
   * @param userId User ID performing the action
   */
  async calculateEmployeePayroll(employeeId: string, companyId: string, year: number, month: number, userId: string) {
    try {
      // Get employee details including contract
      const employee = await this.db.execute(
        sql`SELECT e.*, ec.base_salary_gross, ec.contract_type 
            FROM hr_employees e
            JOIN hr_employment_contracts ec ON e.id = ec.employee_id
            WHERE e.id = ${employeeId} AND e.company_id = ${companyId}`
      );
      
      if (!employee.rows || employee.rows.length === 0) {
        throw new Error('Employee not found');
      }

      const employeeData = employee.rows[0];
      const grossSalary = parseFloat(employeeData.base_salary_gross);
      
      // Calculate Romanian tax values
      // CAS: 25% employee contribution to social security
      const casEmployeeAmount = grossSalary * 0.25;
      
      // CASS: 10% employee contribution to health insurance
      const cassEmployeeAmount = grossSalary * 0.10;
      
      // Deduction: 600 RON personal deduction (simplified for this example)
      const personalDeduction = 600;
      
      // Taxable income after social contributions and deductions
      const taxableIncome = grossSalary - casEmployeeAmount - cassEmployeeAmount - personalDeduction;
      
      // Income tax: 10% of taxable income
      const incomeTaxAmount = Math.max(0, taxableIncome * 0.10);
      
      // Net salary calculation
      const netSalary = grossSalary - casEmployeeAmount - cassEmployeeAmount - incomeTaxAmount;
      
      // CAM: 2.25% employer contribution to work insurance
      const camEmployerAmount = grossSalary * 0.0225;
      
      // Create payroll record
      const payrollId = uuidv4();
      await this.db.execute(
        sql`INSERT INTO hr_payroll_logs (
          id, company_id, employee_id, year, month, 
          gross_total, cas_employee_amount, cass_employee_amount, 
          income_tax_amount, personal_deduction_amount, net_salary,
          cam_employer_amount, status, created_by
        ) VALUES (
          ${payrollId}, ${companyId}, ${employeeId}, ${year}, ${month}, 
          ${grossSalary}, ${casEmployeeAmount}, ${cassEmployeeAmount}, 
          ${incomeTaxAmount}, ${personalDeduction}, ${netSalary},
          ${camEmployerAmount}, 'calculated', ${userId}
        )`
      );
      
      // Audit the payroll calculation
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.CREATE,
        entity: 'PAYROLL',
        entityId: payrollId,
        details: {
          employeeId,
          year,
          month,
          grossTotal: grossSalary,
          netSalary
        }
      });
      
      return {
        id: payrollId,
        employeeId,
        year,
        month,
        grossTotal: grossSalary,
        netSalary,
        status: 'calculated'
      };
    } catch (error) {
      console.error('Error calculating payroll:', error);
      throw new Error(`Failed to calculate payroll: ${error.message}`);
    }
  }

  /**
   * Process payroll for all active employees in a company
   * 
   * @param companyId Company ID
   * @param year Year for processing
   * @param month Month for processing (1-12)
   * @param userId User ID performing the action
   */
  async processCompanyPayroll(companyId: string, year: number, month: number, userId: string) {
    try {
      // Get all active employees with valid contracts
      const activeEmployees = await this.db.execute(
        sql`SELECT e.id 
            FROM hr_employees e
            JOIN hr_employment_contracts ec ON e.id = ec.employee_id
            WHERE e.company_id = ${companyId} 
            AND e.is_active = true
            AND ec.status = 'active'`
      );
      
      if (!activeEmployees.rows || activeEmployees.rows.length === 0) {
        return { processed: 0, message: 'No active employees found' };
      }
      
      const results = [];
      
      // Process each employee's payroll
      for (const employee of activeEmployees.rows) {
        try {
          const payrollResult = await this.calculateEmployeePayroll(
            employee.id, 
            companyId, 
            year, 
            month, 
            userId
          );
          results.push(payrollResult);
        } catch (employeeError) {
          console.error(`Error processing payroll for employee ${employee.id}:`, employeeError);
          // Continue with the next employee
        }
      }
      
      return {
        processed: results.length,
        total: activeEmployees.rows.length,
        results
      };
    } catch (error) {
      console.error('Error processing company payroll:', error);
      throw new Error(`Failed to process company payroll: ${error.message}`);
    }
  }

  /**
   * Approve a calculated payroll record
   * 
   * @param payrollId Payroll record ID
   * @param userId User ID performing the approval
   */
  async approvePayroll(payrollId: string, userId: string) {
    try {
      const payroll = await this.db.execute(
        sql`SELECT * FROM hr_payroll_logs WHERE id = ${payrollId}`
      );
      
      if (!payroll.rows || payroll.rows.length === 0) {
        throw new Error('Payroll record not found');
      }
      
      if (payroll.rows[0].status !== 'calculated') {
        throw new Error(`Cannot approve payroll in ${payroll.rows[0].status} status`);
      }
      
      // Update the payroll status
      await this.db.execute(
        sql`UPDATE hr_payroll_logs
            SET status = 'approved', 
                approved_by = ${userId}, 
                approved_at = NOW(), 
                updated_by = ${userId}, 
                updated_at = NOW()
            WHERE id = ${payrollId}`
      );
      
      // Audit the approval
      await AuditService.log({
        userId,
        companyId: payroll.rows[0].company_id,
        action: AuditAction.UPDATE,
        entity: 'PAYROLL',
        entityId: payrollId,
        details: {
          status: 'approved',
          payrollId
        }
      });
      
      return {
        id: payrollId,
        status: 'approved',
        message: 'Payroll approved successfully'
      };
    } catch (error) {
      console.error('Error approving payroll:', error);
      throw new Error(`Failed to approve payroll: ${error.message}`);
    }
  }

  /**
   * Get payroll details for an employee
   * 
   * @param employeeId Employee ID
   * @param year Year (optional)
   * @param month Month (optional)
   */
  async getEmployeePayroll(employeeId: string, year?: number, month?: number) {
    try {
      let querySQL;
      
      if (year && month) {
        querySQL = sql`
          SELECT pl.*, e.first_name, e.last_name
          FROM hr_payroll_logs pl
          JOIN hr_employees e ON pl.employee_id = e.id
          WHERE pl.employee_id = ${employeeId}
          AND pl.year = ${year}
          AND pl.month = ${month}
          ORDER BY pl.year DESC, pl.month DESC
        `;
      } else if (year) {
        querySQL = sql`
          SELECT pl.*, e.first_name, e.last_name
          FROM hr_payroll_logs pl
          JOIN hr_employees e ON pl.employee_id = e.id
          WHERE pl.employee_id = ${employeeId}
          AND pl.year = ${year}
          ORDER BY pl.year DESC, pl.month DESC
        `;
      } else {
        querySQL = sql`
          SELECT pl.*, e.first_name, e.last_name
          FROM hr_payroll_logs pl
          JOIN hr_employees e ON pl.employee_id = e.id
          WHERE pl.employee_id = ${employeeId}
          ORDER BY pl.year DESC, pl.month DESC
        `;
      }
      
      const payrollRecords = await this.db.execute(querySQL);
      
      return payrollRecords.rows || [];
    } catch (error) {
      console.error('Error retrieving employee payroll:', error);
      throw new Error(`Failed to retrieve employee payroll: ${(error as Error).message}`);
    }
  }

  /**
   * Get payroll summary for a company in a specific period
   * 
   * @param companyId Company ID
   * @param year Year for summary
   * @param month Month for summary (optional)
   */
  async getCompanyPayrollSummary(companyId: string, year: number, month?: number) {
    try {
      let query = `
        SELECT 
          COUNT(*) as employee_count,
          SUM(gross_total) as total_gross,
          SUM(net_salary) as total_net,
          SUM(cas_employee_amount) as total_cas_employee,
          SUM(cass_employee_amount) as total_cass_employee,
          SUM(income_tax_amount) as total_income_tax,
          SUM(cam_employer_amount) as total_cam_employer
        FROM hr_payroll_logs
        WHERE company_id = $1 AND year = $2
      `;
      
      const params = [companyId, year];
      
      if (month) {
        query += ` AND month = $${params.length + 1}`;
        params.push(month);
      }
      
      const summary = await this.db.query(query, params);
      
      if (!summary.rows || summary.rows.length === 0) {
        return {
          employeeCount: 0,
          totalGross: 0,
          totalNet: 0,
          totalCasEmployee: 0,
          totalCassEmployee: 0,
          totalIncomeTax: 0,
          totalCamEmployer: 0
        };
      }
      
      return {
        employeeCount: parseInt(summary.rows[0].employee_count) || 0,
        totalGross: parseFloat(summary.rows[0].total_gross) || 0,
        totalNet: parseFloat(summary.rows[0].total_net) || 0,
        totalCasEmployee: parseFloat(summary.rows[0].total_cas_employee) || 0,
        totalCassEmployee: parseFloat(summary.rows[0].total_cass_employee) || 0,
        totalIncomeTax: parseFloat(summary.rows[0].total_income_tax) || 0,
        totalCamEmployer: parseFloat(summary.rows[0].total_cam_employer) || 0
      };
    } catch (error) {
      console.error('Error retrieving company payroll summary:', error);
      throw new Error(`Failed to retrieve company payroll summary: ${error.message}`);
    }
  }
}