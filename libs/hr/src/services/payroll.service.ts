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

import { employees, payrollLogs } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import AuditService from '@geniuserp/audit';
import { AuditAction, AuditResourceType } from "@common/enums/audit.enum";
import { sql } from 'drizzle-orm';
import { DrizzleService } from "@common/drizzle/drizzle.service";

export class PayrollService {
  private drizzle: DrizzleService;

  constructor() {
    this.drizzle = new DrizzleService();
  }
  
  // Backward compatibility getter
  private get db() {
    return this.drizzle.db;
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
      const employee = await this.drizzle.db.execute(
        sql`SELECT e.*, ec.base_salary_gross, ec.contract_type 
            FROM hr_employees e
            JOIN hr_employment_contracts ec ON e.id = ec.employee_id
            WHERE e.id = ${employeeId} AND e.company_id = ${companyId}`
      );
      
      if (!employee || employee.length === 0) {
        throw new Error('Employee not found');
      }

      const employeeData = employee[0];
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
      await this.drizzle.db.execute(
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
    } catch (error: any) {
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
      const activeEmployees = await this.drizzle.db.execute(
        sql`SELECT e.id 
            FROM hr_employees e
            JOIN hr_employment_contracts ec ON e.id = ec.employee_id
            WHERE e.company_id = ${companyId} 
            AND e.is_active = true
            AND ec.status = 'active'`
      );
      
      if (!activeEmployees || activeEmployees.length === 0) {
        return { processed: 0, message: 'No active employees found' };
      }
      
      const results = [];
      
      // Process each employee's payroll
      for (const employee of activeEmployees) {
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
        total: activeEmployees.length,
        results
      };
    } catch (error: any) {
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
      const payroll = await this.drizzle.db.execute(
        sql`SELECT * FROM hr_payroll_logs WHERE id = ${payrollId}`
      );
      
      if (!payroll || payroll.length === 0) {
        throw new Error('Payroll record not found');
      }
      
      if (payroll[0].status !== 'calculated') {
        throw new Error(`Cannot approve payroll in ${payroll[0].status} status`);
      }
      
      // Update the payroll status
      await this.drizzle.db.execute(
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
        companyId: payroll[0].company_id,
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
    } catch (error: any) {
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
      
      const payrollRecords = await this.drizzle.db.execute(querySQL);
      
      return payrollRecords || [];
    } catch (error: any) {
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
      
      const summary = await this.drizzle.executeQuery(query, params);
      
      if (!summary || summary.length === 0) {
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
        employeeCount: parseInt(summary[0].employee_count) || 0,
        totalGross: parseFloat(summary[0].total_gross) || 0,
        totalNet: parseFloat(summary[0].total_net) || 0,
        totalCasEmployee: parseFloat(summary[0].total_cas_employee) || 0,
        totalCassEmployee: parseFloat(summary[0].total_cass_employee) || 0,
        totalIncomeTax: parseFloat(summary[0].total_income_tax) || 0,
        totalCamEmployer: parseFloat(summary[0].total_cam_employer) || 0
      };
    } catch (error: any) {
      console.error('Error retrieving company payroll summary:', error);
      throw new Error(`Failed to retrieve company payroll summary: ${(error as Error).message}`);
    }
  }

  /**
   * Get payroll report for a company
   * 
   * @param companyId Company ID
   * @param year Year for report
   * @param month Month for report (optional)
   */
  async getPayrollReport(companyId: string, year: number, month?: number) {
    try {
      // Get detailed payroll data
      let query = `
        SELECT 
          pl.*,
          e.first_name,
          e.last_name,
          e.cnp,
          ec.contract_number,
          ec.position
        FROM hr_payroll_logs pl
        JOIN hr_employees e ON pl.employee_id = e.id
        LEFT JOIN hr_employment_contracts ec ON pl.employment_contract_id = ec.id
        WHERE pl.company_id = $1 AND pl.year = $2
      `;
      
      const params: any[] = [companyId, year];
      
      if (month) {
        query += ` AND pl.month = $${params.length + 1}`;
        params.push(month);
      }
      
      query += ` ORDER BY e.last_name, e.first_name, pl.month`;
      
      const payrollData = await this.drizzle.executeQuery(query, params);
      
      // Get summary data
      const summary = await this.getCompanyPayrollSummary(companyId, year, month);
      
      return {
        payrollData: payrollData || [],
        summary,
        year,
        month: month || null,
        generatedAt: new Date()
      };
    } catch (error: any) {
      console.error('Error generating payroll report:', error);
      throw new Error(`Failed to generate payroll report: ${(error as Error).message}`);
    }
  }

  /**
   * Get employee payroll history
   * Alias for getEmployeePayroll for backward compatibility
   * 
   * @param employeeId Employee ID
   * @param year Year (optional)
   * @param limit Limit of records to return
   */
  async getEmployeePayrollHistory(employeeId: string, year?: number, limit: number = 12) {
    try {
      let query = `
        SELECT 
          pl.*,
          e.first_name,
          e.last_name,
          ec.contract_number
        FROM hr_payroll_logs pl
        JOIN hr_employees e ON pl.employee_id = e.id
        LEFT JOIN hr_employment_contracts ec ON pl.employment_contract_id = ec.id
        WHERE pl.employee_id = $1
      `;
      
      const params: any[] = [employeeId];
      
      if (year) {
        query += ` AND pl.year = $${params.length + 1}`;
        params.push(year);
      }
      
      query += ` ORDER BY pl.year DESC, pl.month DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const history = await this.drizzle.executeQuery(query, params);
      
      return history || [];
    } catch (error: any) {
      console.error('Error retrieving employee payroll history:', error);
      throw new Error(`Failed to retrieve employee payroll history: ${(error as Error).message}`);
    }
  }

  /**
   * Export payroll data to CSV or Excel format
   * 
   * @param companyId Company ID
   * @param year Year for export
   * @param month Month for export (optional)
   * @param format Export format ('csv' or 'excel')
   */
  async exportPayroll(
    companyId: string,
    year: number,
    month?: number,
    format: 'csv' | 'excel' = 'csv'
  ) {
    try {
      // Get the payroll report data
      const reportData = await this.getPayrollReport(companyId, year, month);
      
      if (format === 'csv') {
        // Generate CSV content
        const headers = [
          'CNP',
          'Nume',
          'Prenume',
          'Luna',
          'An',
          'Salariu Brut',
          'CAS',
          'CASS',
          'Impozit',
          'Salariu Net',
          'Status'
        ].join(',');
        
        const rows = reportData.payrollData.map((record: any) => {
          return [
            record.cnp,
            record.last_name,
            record.first_name,
            record.month,
            record.year,
            record.gross_total,
            record.cas_employee_amount,
            record.cass_employee_amount,
            record.income_tax_amount,
            record.net_salary,
            record.status
          ].join(',');
        });
        
        const csvContent = [headers, ...rows].join('\n');
        
        return {
          content: csvContent,
          filename: `payroll_${year}_${month || 'all'}.csv`,
          mimeType: 'text/csv'
        };
      } else {
        // For Excel, return JSON that can be processed by a library like xlsx
        return {
          content: JSON.stringify(reportData.payrollData, null, 2),
          filename: `payroll_${year}_${month || 'all'}.json`,
          mimeType: 'application/json'
        };
      }
    } catch (error: any) {
      console.error('Error exporting payroll:', error);
      throw new Error(`Failed to export payroll: ${(error as Error).message}`);
    }
  }
}